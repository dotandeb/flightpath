import { NextRequest, NextResponse } from "next/server";
import {
  searchAmadeusFlights,
  transformAmadeusResults,
  runAcidTest,
} from "@/app/lib/amadeus-api";
import {
  generateSampleDataResults,
} from "@/app/lib/travelpayouts-data-api";

// ============================================
// FLIGHT SEARCH API - ACID TEST VERSION
// ============================================
// Uses Amadeus FREE tier (2,000 calls/month) for real-time testing
// Falls back to sample data if Amadeus fails or quota exceeded

const USE_AMADEUS = process.env.USE_AMADEUS === "true";

/**
 * GET /api/search/test
 * Run acid test to verify Amadeus API works
 */
export async function GET(request: NextRequest) {
  const testResult = await runAcidTest();
  return NextResponse.json(testResult);
}

/**
 * POST /api/search
 * Main search endpoint
 */
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

    // Try Amadeus first if enabled
    if (USE_AMADEUS) {
      try {
        console.log("[Search] Trying Amadeus API...");
        
        const offers = await searchAmadeusFlights({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults || 1,
          children: params.children || 0,
          infants: params.infants || 0,
          travelClass: params.travelClass,
          currency: params.currency || "GBP",
        });

        if (offers.length > 0) {
          console.log(`[Search] Amadeus returned ${offers.length} offers`);
          const result = transformAmadeusResults(offers, params);
          
          // Add arbitrage options
          addArbitrageOptions(result, params);
          
          return NextResponse.json(result);
        }
      } catch (amadeusError: any) {
        console.log("[Search] Amadeus failed:", amadeusError.message);
        // Fall through to sample data
      }
    }

    // Use sample data (for demo or when Amadeus fails)
    console.log("[Search] Using sample data");
    const sampleResult = generateSampleDataResults(params);
    
    // Mark as sample
    sampleResult._dataSource = "sample-data";
    sampleResult._cacheWarning = "Demo data - Add Amadeus API for real prices";
    
    return NextResponse.json(sampleResult);

  } catch (error: any) {
    console.error("[Search] Error:", error);
    
    // Return sample data on error
    const fallbackParams = await request.clone().json().catch(() => ({
      origin: "LHR",
      destination: "BKK",
      departureDate: new Date().toISOString().split('T')[0],
      adults: 1,
    }));
    
    const fallback = generateSampleDataResults(fallbackParams);
    fallback._error = error.message;
    
    return NextResponse.json(fallback);
  }
}

/**
 * Add arbitrage optimization options
 */
function addArbitrageOptions(result: any, params: any) {
  const basePrice = result.bestOption?.perPersonPrice || 500;
  const totalPassengers = (params.adults || 1) + (params.children || 0) + (params.infants || 0);
  
  const optimizedOptions: any[] = [];

  // Split-ticket option
  if (params.returnDate) {
    const splitPrice = Math.round(basePrice * 0.85 * totalPassengers);
    optimizedOptions.push({
      ...result.bestOption,
      id: `${result.bestOption.id}-split`,
      strategy: "split-ticket",
      strategyDescription: "Book separate one-way tickets",
      totalPrice: splitPrice,
      perPersonPrice: Math.round(splitPrice / totalPassengers),
      savingsVsStandard: result.bestOption.totalPrice - splitPrice,
      risks: [
        "If you miss a connection, the airline won't help",
        "You need to collect and re-check baggage",
        "Allow at least 3 hours between separate tickets",
      ],
    });
  }

  // Nearby origin option
  const nearbyOriginPrice = Math.round(basePrice * 0.88 * totalPassengers);
  optimizedOptions.push({
    ...result.bestOption,
    id: `${result.bestOption.id}-nearby-origin`,
    strategy: "nearby-origin",
    strategyDescription: `Fly from alternative airport (save £${Math.round(basePrice * 0.12)})`,
    totalPrice: nearbyOriginPrice,
    perPersonPrice: Math.round(nearbyOriginPrice / totalPassengers),
    savingsVsStandard: result.bestOption.totalPrice - nearbyOriginPrice,
    risks: ["Factor in transport costs to alternative airport"],
  });

  // Sort by price
  optimizedOptions.sort((a, b) => a.totalPrice - b.totalPrice);

  // Update result
  const bestSavings = optimizedOptions[0]?.savingsVsStandard || 0;
  if (bestSavings > 0) {
    result.optimizedOptions = optimizedOptions.filter(o => o.id !== optimizedOptions[0].id);
    result.bestOption = optimizedOptions[0];
  } else {
    result.optimizedOptions = optimizedOptions;
  }
  
  // Update price range
  const allPrices = [
    result.standardOption?.totalPrice,
    result.bestOption?.totalPrice,
    ...optimizedOptions.map(o => o.totalPrice),
  ].filter(Boolean);
  
  result.priceRange = {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
    currency: result.priceRange?.currency || "GBP",
  };
}
