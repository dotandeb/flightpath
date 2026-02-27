// Integrated Search API with Validation
// Uses global airports, metro search, and flight validation

import { NextRequest, NextResponse } from "next/server";
import { getAirportByIATA, getMetroAirports, searchAirports } from "@/app/lib/global-airports";
import { getMetroArea, findMetroByName } from "@/app/lib/metro-areas";
import { validateFlight } from "@/app/lib/flight-validation";
import { searchAmadeusFlights } from "@/app/lib/amadeus-api";

// ============================================
// PRODUCTION SEARCH API - VALIDATED DATA ONLY
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
 * Handles metro areas (e.g., "London" -> LHR, LGW, STN, LTN)
 */
function expandToAirports(query: string): {
  isMetro: boolean;
  airports: string[];
  displayName: string;
} {
  // Check if it's a metro area name
  const metro = findMetroByName(query);
  if (metro) {
    return {
      isMetro: true,
      airports: metro.airports,
      displayName: `${metro.name} (All Airports)`
    };
  }
  
  // Check if it's a metro code
  const metroByCode = getMetroArea(query);
  if (metroByCode) {
    return {
      isMetro: true,
      airports: metroByCode.airports,
      displayName: `${metroByCode.name} (All Airports)`
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
    
    // For now, use first airport from each (primary airport)
    const originAirport = originExpanded.airports[0];
    const destAirport = destExpanded.airports[0];
    
    // Try Amadeus API first (real data)
    let flights: any[] = [];
    let dataSource = "none";
    
    try {
      const amadeusResult = await searchAmadeusFlights({
        origin: originAirport,
        destination: destAirport,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults || 1,
        travelClass: (params.cabinClass as any) || "ECONOMY",
      });
      
      if (amadeusResult && amadeusResult.length > 0) {
        flights = amadeusResult;
        dataSource = "amadeus";
        console.log(`[Search] Found ${flights.length} flights from Amadeus`);
      }
    } catch (e) {
      console.log("[Search] Amadeus API failed:", e);
    }
    
    // If no Amadeus results, return empty with message
    if (flights.length === 0) {
      return NextResponse.json({
        error: "No flights found",
        message: "No validated flights available for this route. Try different dates or airports.",
        searchParams: {
          origin: originExpanded,
          destination: destExpanded,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
        },
        _dataSource: "none",
        _validated: true,
      }, { status: 404 });
    }
    
    // Validate each flight
    const validatedFlights = flights.map(flight => {
      // Validate the flight
      const validation = validateFlight({
        flightNumber: flight.flightNumber,
        airline: flight.segments[0]?.airline,
        origin: flight.segments[0]?.origin?.code,
        destination: flight.segments[0]?.destination?.code,
        departureTime: flight.segments[0]?.departureTime,
        arrivalTime: flight.segments[0]?.arrivalTime,
        duration: flight.segments[0]?.duration,
        aircraft: flight.segments[0]?.aircraft,
        source: 'amadeus-api',
        fetchedAt: new Date(),
      });
      
      return {
        ...flight,
        _validation: validation,
        _isValid: validation.isValid,
        _confidence: validation.confidence,
      };
    }).filter(f => f._isValid); // Only return valid flights
    
    console.log(`[Search] ${validatedFlights.length} flights passed validation`);
    
    // Sort by confidence then price
    validatedFlights.sort((a, b) => {
      if (b._confidence !== a._confidence) {
        return b._confidence - a._confidence;
      }
      return a.totalPrice - b.totalPrice;
    });
    
    return NextResponse.json({
      flights: validatedFlights,
      count: validatedFlights.length,
      searchParams: {
        origin: originExpanded,
        destination: destExpanded,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        cabinClass: params.cabinClass || "ECONOMY",
      },
      _dataSource: dataSource,
      _validated: true,
      _timestamp: new Date().toISOString(),
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
    airports: airports.slice(0, 10), // Limit to 10
    metroArea: metro || null,
  });
}
