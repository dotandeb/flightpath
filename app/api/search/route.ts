import { NextRequest, NextResponse } from "next/server";
import {
  searchAmadeusFlights,
  transformAmadeusResults,
  runAcidTest,
} from "@/app/lib/amadeus-api";
import {
  searchAllStrategies,
  getApiUsageStats,
} from "@/app/lib/arbitrage-engine";
import {
  generateSampleDataResults,
} from "@/app/lib/travelpayouts-data-api";
import { getSampleDeals } from "@/app/lib/deal-scraper";
import { getAllRSSDeals, getDealsForRoute } from "@/app/lib/rss-scraper";

// ============================================
// FLIGHT SEARCH API - RSS DEALS + ARBITRAGE
// ============================================
// 1. Fetches real deals from RSS (SecretFlying, Fly4Free, HolidayPirates)
// 2. Runs arbitrage strategies on deals
// 3. Falls back to Amadeus if env vars set
// 4. Final fallback to sample data

const USE_AMADEUS = process.env.USE_AMADEUS === "true";
const USE_ARBITRAGE = process.env.USE_ARBITRAGE !== "false";

/**
 * POST /api/search
 * Main search with RSS deals + arbitrage
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

    // 1. Try RSS deal sites first (real deals)
    console.log("[Search] Fetching RSS deals...");
    let rssDeals: any[] = [];
    
    try {
      rssDeals = await getDealsForRoute(params.origin, params.destination);
      console.log(`[Search] Found ${rssDeals.length} RSS deals`);
    } catch (rssError) {
      console.log("[Search] RSS fetch failed, using sample deals");
    }

    // If no RSS deals, use sample deals
    const deals = rssDeals.length > 0 ? rssDeals : getSampleDeals().filter(d => 
      d.from === params.origin || 
      d.to === params.destination ||
      d.route.toLowerCase().includes(params.origin.toLowerCase()) ||
      d.route.toLowerCase().includes(params.destination.toLowerCase())
    );

    if (deals.length > 0) {
      // Transform deals to our format
      const dealOptions = deals.map(deal => ({
        id: `deal-${deal.source}-${Date.now()}`,
        strategy: "rss-deal",
        strategyDescription: `${deal.source}: ${deal.route} ${deal.currency}${deal.price}`,
        totalPrice: deal.price,
        perPersonPrice: deal.price,
        currency: deal.currency,
        segments: [{
          id: `deal-segment-1`,
          origin: { code: deal.fromCode || deal.from, name: "", city: deal.from, country: "", lat: 0, lng: 0 },
          destination: { code: deal.toCode || deal.to, name: "", city: deal.to, country: "", lat: 0, lng: 0 },
          departureTime: `${params.departureDate}T10:00:00`,
          arrivalTime: `${params.departureDate}T14:00:00`,
          airline: "Various",
          airlineName: deal.source,
          flightNumber: "DEAL001",
          duration: "PT4H",
          durationMinutes: 240,
          stops: 0,
          aircraft: "",
          cabinClass: params.travelClass || "ECONOMY",
          bookingClass: "",
        }],
        bookingLinks: [{
          airline: deal.source,
          price: deal.price,
          url: deal.url,
        }],
        savingsVsStandard: 0,
        risks: ["Deal may expire quickly", "Verify dates before booking"],
        _source: "rss-deal",
        _dealUrl: deal.url,
        _publishedAt: deal.publishedAt,
      }));

      // 2. Try Amadeus arbitrage for comparison
      let arbitrageOptions: any[] = [];
      
      if (USE_AMADEUS && USE_ARBITRAGE) {
        try {
          const arbitrageResult = await searchAllStrategies({
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults || 1,
            currency: params.currency || "GBP",
          });

          if (arbitrageResult.allOptions && arbitrageResult.allOptions.length > 0) {
            arbitrageOptions = arbitrageResult.allOptions.map((opt: any) => ({
              ...opt,
              strategy: `amadeus-${opt.strategy}`,
            }));
          }
        } catch (e) {
          console.log("[Search] Amadeus arbitrage failed");
        }
      }

      // Combine and sort
      const allOptions = [...dealOptions, ...arbitrageOptions];
      allOptions.sort((a, b) => a.totalPrice - b.totalPrice);

      const bestOption = allOptions[0];
      const standardOption = dealOptions[0];

      return NextResponse.json({
        standardOption,
        bestOption,
        allOptions,
        optimizedOptions: allOptions.filter(o => o !== bestOption),
        priceRange: {
          min: Math.min(...allOptions.map(o => o.totalPrice)),
          max: Math.max(...allOptions.map(o => o.totalPrice)),
          currency: params.currency || "GBP",
        },
        searchParams: params,
        _dataSource: rssDeals.length > 0 ? "rss-deals" : "sample-deals",
        _realTimeData: rssDeals.length > 0,
        _cacheWarning: rssDeals.length > 0 ? null : "Using sample deals - RSS may be unavailable",
      });
    }

    // 3. Fallback to Amadeus only
    if (USE_AMADEUS) {
      try {
        const arbitrageResult = await searchAllStrategies({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults || 1,
          currency: params.currency || "GBP",
        });

        return NextResponse.json({
          ...arbitrageResult,
          searchParams: params,
          _dataSource: "amadeus-arbitrage",
          _realTimeData: true,
        });
      } catch (e) {
        console.log("[Search] Amadeus fallback failed");
      }
    }

    // 4. Final fallback to sample data
    console.log("[Search] Using sample data fallback");
    const sampleResult = generateSampleDataResults(params);
    
    return NextResponse.json({
      ...sampleResult,
      searchParams: params,
      _dataSource: "sample-data",
      _cacheWarning: "Demo data - No real deals found",
    });

  } catch (error: any) {
    console.error("[Search] Error:", error);
    
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
