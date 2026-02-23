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

// ============================================
// FLIGHT SEARCH API - DEALS + ARBITRAGE VERSION
// ============================================
// Combines:
// 1. Deal site scraping (SecretFlying, Fly4Free, etc.)
// 2. Amadeus API for real-time prices
// 3. Real arbitrage strategies

const USE_AMADEUS = process.env.USE_AMADEUS === "true";
const USE_ARBITRAGE = process.env.USE_ARBITRAGE !== "false";

/**
 * POST /api/search
 * Main search endpoint with DEALS + ARBITRAGE
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

    // 1. Try Amadeus arbitrage first (if enabled and env vars set)
    if (USE_AMADEUS && USE_ARBITRAGE) {
      try {
        console.log("[Search] Starting REAL arbitrage search...");
        
        const arbitrageResult = await searchAllStrategies({
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

        // If we got real results, return them
        if (arbitrageResult.allOptions && arbitrageResult.allOptions.length > 0) {
          return NextResponse.json({
            ...arbitrageResult,
            searchParams: params,
            _dataSource: "amadeus-arbitrage",
            _realTimeData: true,
          });
        }
      } catch (arbitrageError: any) {
        console.log("[Search] Arbitrage search failed:", arbitrageError.message);
      }
    }

    // 2. Fallback: Get deals from deal sites + run arbitrage on them
    console.log("[Search] Falling back to deal sites + arbitrage...");
    
    // Get sample deals for this route (in production, scrape real sites)
    const deals = getSampleDeals().filter(d => 
      d.from === params.origin || 
      d.to === params.destination ||
      d.route.toLowerCase().includes(params.origin.toLowerCase()) ||
      d.route.toLowerCase().includes(params.destination.toLowerCase())
    );

    if (deals.length > 0) {
      // Transform deals to match our format
      const dealOptions = deals.map(deal => ({
        id: `deal-${deal.source}-${Date.now()}`,
        strategy: "deal-site",
        strategyDescription: `Found on ${deal.source}`,
        totalPrice: deal.price,
        perPersonPrice: deal.price,
        currency: deal.currency,
        segments: [{
          id: `deal-segment-1`,
          origin: { code: deal.from, name: "", city: "", country: "", lat: 0, lng: 0 },
          destination: { code: deal.to, name: "", city: "", country: "", lat: 0, lng: 0 },
          departureTime: `${params.departureDate}T10:00:00`,
          arrivalTime: `${params.departureDate}T14:00:00`,
          airline: "Various",
          airlineName: "Deal Airline",
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
        _source: "deal-site",
        _dealUrl: deal.url,
      }));

      // Try to run arbitrage on the deal
      let arbitrageOptions: any[] = [];
      
      if (USE_AMADEUS) {
        try {
          // Search split ticket
          const outbound = await searchAmadeusFlights({
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            adults: params.adults || 1,
            currency: params.currency || "GBP",
          });

          if (outbound.length > 0) {
            const bestPrice = parseFloat(outbound[0].price.total);
            if (bestPrice < deals[0].price) {
              arbitrageOptions.push({
                ...transformAmadeusResults(outbound, params).bestOption,
                strategy: "amadeus-better-than-deal",
                strategyDescription: "Better price found via Amadeus vs deal site",
                savingsVsStandard: deals[0].price - bestPrice,
              });
            }
          }
        } catch (e) {
          console.log("[Search] Amadeus comparison failed");
        }
      }

      const allOptions = [...dealOptions, ...arbitrageOptions];
      allOptions.sort((a, b) => a.totalPrice - b.totalPrice);

      return NextResponse.json({
        standardOption: dealOptions[0],
        bestOption: allOptions[0],
        allOptions,
        optimizedOptions: allOptions.slice(1),
        priceRange: {
          min: Math.min(...allOptions.map(o => o.totalPrice)),
          max: Math.max(...allOptions.map(o => o.totalPrice)),
          currency: params.currency || "GBP",
        },
        searchParams: params,
        _dataSource: "deal-sites",
        _realTimeData: false,
        _cacheWarning: "Prices from deal sites - verify before booking",
      });
    }

    // 3. Final fallback to sample data
    console.log("[Search] Using sample data fallback");
    const sampleResult = generateSampleDataResults(params);
    
    return NextResponse.json({
      ...sampleResult,
      searchParams: params,
      _dataSource: "sample-data",
      _cacheWarning: "Demo data - Add Amadeus API for real prices",
    });

  } catch (error: any) {
    console.error("[Search] Error:", error);
    
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
