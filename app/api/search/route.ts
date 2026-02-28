// Integrated Search API with Validation
// Uses global airports, metro search, and flight validation
// Returns format compatible with frontend

import { NextRequest, NextResponse } from "next/server";
import { getAirportByIATA, searchAirports } from "@/app/lib/global-airports";
import { findMetroByName, getMetroArea } from "@/app/lib/metro-areas";
import { validateFlight } from "@/app/lib/flight-validation";
import { searchAmadeusFlights, transformAmadeusResults } from "@/app/lib/amadeus-api";
import { getDealsForRoute } from "@/app/lib/rss-scraper";

// ============================================
// PRODUCTION SEARCH API - VALIDATED DATA
// ============================================

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}

/**
 * Expand search query to airports
 * Handles metro areas (e.g., "London" -> LHR, LGW, STN, LTN, LCY, SEN)
 */
function expandToAirports(query: string): {
  isMetro: boolean;
  airports: string[];
  displayName: string;
  metroCode?: string;
} {
  // Check if it's a metro area name
  const metro = findMetroByName(query);
  if (metro) {
    return {
      isMetro: true,
      airports: metro.airports,
      displayName: `${metro.name} (All Airports)`,
      metroCode: metro.code
    };
  }
  
  // Check if it's a metro code
  const metroByCode = getMetroArea(query);
  if (metroByCode) {
    return {
      isMetro: true,
      airports: metroByCode.airports,
      displayName: `${metroByCode.name} (All Airports)`,
      metroCode: metroByCode.code
    };
  }
  
  // Check if it's a valid airport
  const airport = getAirportByIATA(query);
  if (airport) {
    return {
      isMetro: false,
      airports: [airport.iata],
      displayName: `${airport.city} (${airport.iata})`
    };
  }
  
  // Fallback: treat as IATA code
  return {
    isMetro: false,
    airports: [query.toUpperCase()],
    displayName: query.toUpperCase()
  };
}

/**
 * POST /api/search
 * Production search with validation
 */
export async function POST(request: NextRequest) {
  try {
    const params: SearchParams = await request.json();
    
    // Validate required fields
    if (!params.origin || !params.destination || !params.departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, departureDate" },
        { status: 400 }
      );
    }
    
    console.log(`[Search] ${params.origin} -> ${params.destination} on ${params.departureDate}`);
    
    // Expand metro areas to airports
    const originExpanded = expandToAirports(params.origin);
    const destExpanded = expandToAirports(params.destination);
    
    console.log(`[Search] Origin: ${originExpanded.displayName} -> ${originExpanded.airports.join(", ")}`);
    console.log(`[Search] Destination: ${destExpanded.displayName} -> ${destExpanded.airports.join(", ")}`);
    
    // Get all airport combinations for metro search
    const allOptions: any[] = [];
    
    // Try each airport combination
    for (const originAirport of originExpanded.airports) {
      for (const destAirport of destExpanded.airports) {
        try {
          // Try Amadeus API
          const amadeusResult = await searchAmadeusFlights({
            origin: originAirport,
            destination: destAirport,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            adults: params.adults || 1,
            travelClass: (params.cabinClass as any) || "ECONOMY",
          });
          
          if (amadeusResult && amadeusResult.length > 0) {
            // Transform to our format
            const transformed = transformAmadeusResults(amadeusResult, {
              origin: originAirport,
              destination: destAirport,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.adults || 1,
              travelClass: (params.cabinClass as any) || "ECONOMY",
            });
            
            // Validate and add each flight
            for (const flight of transformed.options || []) {
              const firstSegment = flight.segments?.[0];
              if (!firstSegment) continue;
              
              const validation = validateFlight({
                flightNumber: firstSegment.flightNumber,
                airline: firstSegment.airline,
                origin: firstSegment.origin?.code,
                destination: firstSegment.destination?.code,
                departureTime: firstSegment.departureTime,
                arrivalTime: firstSegment.arrivalTime,
                duration: firstSegment.durationMinutes,
                aircraft: firstSegment.aircraft,
                source: 'amadeus-api',
                fetchedAt: new Date(),
              });
              
              if (validation.isValid) {
                allOptions.push({
                  ...flight,
                  _validation: validation,
                  _confidence: validation.confidence,
                  _source: 'amadeus',
                  _airports: { origin: originAirport, destination: destAirport }
                });
              }
            }
          }
        } catch (e) {
          console.log(`[Search] ${originAirport}->${destAirport} failed:`, e);
        }
      }
    }
    
    // Also try RSS deals
    try {
      const rssDeals = await getDealsForRoute(
        originExpanded.airports[0], 
        destExpanded.airports[0]
      );
      
      for (const deal of rssDeals) {
        allOptions.push({
          id: `deal-${deal.source}-${Date.now()}`,
          strategy: "rss-deal",
          strategyDescription: `${deal.source}: ${deal.route}`,
          totalPrice: deal.price,
          perPersonPrice: deal.price,
          currency: deal.currency,
          segments: [{
            origin: { code: deal.fromCode || deal.from, name: deal.from },
            destination: { code: deal.toCode || deal.to, name: deal.to },
            departureTime: `${params.departureDate}T10:00:00`,
            arrivalTime: `${params.departureDate}T14:00:00`,
            airline: deal.source,
            flightNumber: "DEAL",
          }],
          bookingLinks: [{ airline: deal.source, price: deal.price, url: deal.url }],
          _source: 'rss',
          _confidence: 50,
        });
      }
    } catch (e) {
      console.log("[Search] RSS deals failed:", e);
    }
    
    // Sort by price
    allOptions.sort((a, b) => a.totalPrice - b.totalPrice);
    
    if (allOptions.length === 0) {
      // Return empty result with proper structure
      return NextResponse.json({
        standardOption: null,
        bestOption: null,
        allOptions: [],
        optimizedOptions: [],
        priceRange: { min: 0, max: 0, currency: "GBP" },
        searchParams: {
          origin: params.origin,
          destination: params.destination,
          originDisplay: originExpanded.displayName,
          destinationDisplay: destExpanded.displayName,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
        },
        _dataSource: "none",
        _validated: true,
        _message: "No flights found for this route. Try different dates or airports.",
      });
    }
    
    const bestOption = allOptions[0];
    const standardOption = allOptions.find(o => o.strategy === "standard") || allOptions[0];
    
    return NextResponse.json({
      standardOption,
      bestOption,
      allOptions,
      optimizedOptions: allOptions.filter(o => o !== bestOption),
      priceRange: {
        min: Math.min(...allOptions.map(o => o.totalPrice)),
        max: Math.max(...allOptions.map(o => o.totalPrice)),
        currency: bestOption.currency || "GBP",
      },
      searchParams: {
        origin: params.origin,
        destination: params.destination,
        originDisplay: originExpanded.displayName,
        destinationDisplay: destExpanded.displayName,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        metroOrigin: originExpanded.isMetro ? originExpanded.airports : null,
        metroDestination: destExpanded.isMetro ? destExpanded.airports : null,
      },
      _dataSource: "mixed",
      _validated: true,
      _metroSearch: originExpanded.isMetro || destExpanded.isMetro,
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
 * GET /api/search/airports
 * Search airports by query
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  
  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }
  
  // Search airports
  const airports = searchAirports(query);
  
  // Search metro areas
  const metro = findMetroByName(query);
  
  return NextResponse.json({
    query,
    airports: airports.slice(0, 10),
    metroArea: metro || null,
  });
}
