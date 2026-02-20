import { NextRequest, NextResponse } from "next/server";
import {
  TravelpayoutsDataAPI,
  transformCheapFlights,
  transformNearestPlaces,
  generateSampleDataResults,
} from "@/app/lib/travelpayouts-data-api";

// ============================================
// FLIGHT SEARCH API ROUTE - DATA API VERSION
// ============================================
// Uses Travelpayouts Data API (cached prices, no MAU requirement)
// Falls back to sample data if API fails

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const USE_SAMPLE_DATA = process.env.USE_SAMPLE_DATA === "true" || !TP_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const params = await request.json();

    // Validate required fields
    if (!params.origin || !params.destination || !params.departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, departureDate" },
        { status: 400 }
      );
    }

    // Use sample data mode if configured
    if (USE_SAMPLE_DATA) {
      console.log("[Search] Using sample data mode");
      const results = generateSampleDataResults(params);
      return NextResponse.json(results);
    }

    // Initialize Data API client
    const api = new TravelpayoutsDataAPI(TP_TOKEN!);

    // Build search parameters
    const searchParams = {
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departureDate: params.departureDate.substring(0, 7), // YYYY-MM format
      returnDate: params.returnDate?.substring(0, 7),
      currency: params.currency || "GBP",
    };

    console.log("[Search] Data API query:", searchParams);

    // Fetch multiple data sources in parallel
    const [cheapFlights, nearestPlaces] = await Promise.allSettled([
      // Primary: Cheap flights for the route
      api.getCheapFlights(searchParams),
      
      // Secondary: Nearby airport alternatives
      api.getNearestPlacesPrices(
        searchParams.origin,
        searchParams.destination,
        {
          departDate: params.departureDate,
          returnDate: params.returnDate,
          limit: 10,
          flexibility: 3,
          currency: params.currency || "GBP",
        }
      ),
    ]);

    // Transform cheap flights response
    let standardOptions: any[] = [];
    if (cheapFlights.status === "fulfilled" && cheapFlights.value.success) {
      const transformed = transformCheapFlights(
        cheapFlights.value,
        searchParams.origin,
        searchParams.destination,
        params
      );
      standardOptions = transformed.options;
    }

    // Transform nearby places for arbitrage opportunities
    let nearbyOptions: any[] = [];
    if (nearestPlaces.status === "fulfilled") {
      nearbyOptions = transformNearestPlaces(
        nearestPlaces.value,
        searchParams.origin,
        searchParams.destination,
        params
      );
    }

    // If no results from API, fall back to sample data
    if (standardOptions.length === 0 && nearbyOptions.length === 0) {
      console.log("[Search] No API results, using sample data");
      return NextResponse.json(generateSampleDataResults(params));
    }

    // Combine all options
    const allOptions = [...standardOptions, ...nearbyOptions];

    // Calculate savings vs standard (cheapest direct flight)
    const standardPrice = standardOptions[0]?.totalPrice || allOptions[0]?.totalPrice || 0;
    allOptions.forEach((opt) => {
      opt.savingsVsStandard = Math.round(standardPrice - opt.totalPrice);
    });

    // Sort by total price
    allOptions.sort((a, b) => a.totalPrice - b.totalPrice);

    // Separate best, standard, and alternatives
    const bestOption = allOptions[0];
    const standardOption = standardOptions[0] || allOptions[0];
    const optimizedOptions = allOptions.filter(
      (o) => o.id !== bestOption.id && o.id !== standardOption.id
    );

    const prices = allOptions.map((o) => o.totalPrice);

    const result = {
      searchParams: params,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: params.currency || "GBP",
      },
      bestOption,
      standardOption,
      optimizedOptions: optimizedOptions.slice(0, 5), // Limit to 5 alternatives
      _dataSource: "travelpayouts-data-api",
      _cacheWarning: "Prices cached ~48 hours ago. Click through for current prices.",
    };

    console.log(`[Search] Found ${allOptions.length} options, best: £${bestOption.totalPrice}`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[Search] Error:", error);
    
    // Return sample data on error so UI doesn't break
    console.log("[Search] Error occurred, falling back to sample data");
    
    // Parse params again or use defaults
    let fallbackParams;
    try {
      fallbackParams = await request.clone().json();
    } catch {
      fallbackParams = {
        origin: "LHR",
        destination: "BKK",
        departureDate: new Date().toISOString().split('T')[0],
        adults: 1,
      };
    }
    
    return NextResponse.json(generateSampleDataResults(fallbackParams));
  }
}
