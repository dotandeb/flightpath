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

// ============================================
// FLIGHT SEARCH API - REAL ARBITRAGE VERSION
// ============================================
// Uses Amadeus FREE tier with real arbitrage strategies:
// - Split tickets (actual separate searches)
// - Nearby airports (real alternative searches)
// - Flexible dates (real date variations)
// Smart caching to stay within 2,000 calls/month

const USE_AMADEUS = process.env.USE_AMADEUS === "true";
const USE_ARBITRAGE = process.env.USE_ARBITRAGE !== "false"; // Default true

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
 * Main search endpoint with REAL arbitrage
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

    // Use real arbitrage search if enabled
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

        // Transform to frontend format
        const response = {
          ...arbitrageResult,
          searchParams: params,
          _dataSource: "amadeus-arbitrage",
          _realTimeData: true,
          _cacheWarning: null,
        };

        return NextResponse.json(response);

      } catch (arbitrageError: any) {
        console.log("[Search] Arbitrage search failed:", arbitrageError.message);
        // Fall through to standard search
      }
    }

    // Fallback to standard Amadeus search
    if (USE_AMADEUS) {
      try {
        console.log("[Search] Using standard Amadeus search...");
        
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
          const result = transformAmadeusResults(offers, params);
          
          return NextResponse.json({
            ...result,
            searchParams: params,
            _dataSource: "amadeus-standard",
            _realTimeData: true,
          });
        }
      } catch (amadeusError: any) {
        console.log("[Search] Amadeus failed:", amadeusError.message);
      }
    }

    // Final fallback to sample data
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

/**
 * GET /api/search/stats
 * Get API usage statistics
 */
export async function getStats() {
  const stats = getApiUsageStats();
  return NextResponse.json(stats);
}
