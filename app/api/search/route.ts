/**
 * UNIFIED FLIGHT SEARCH API v2
 * Real multi-source data with optimization engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { flightEngine, UnifiedFlight, HackerFare, SplitTicket } from '@/lib/multi-source-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Convert unified flight to API response format
function formatFlight(f: UnifiedFlight) {
  return {
    id: f.id,
    source: f.source,
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: true,
    lastTicketingDate: f.departure.split('T')[0],
    numberOfBookableSeats: 9,
    itineraries: [{
      duration: `PT${Math.floor(f.duration / 60)}H${f.duration % 60}M`,
      segments: f.segments.map(s => ({
        id: `${s.flightNumber}-${s.departure}`,
        departure: {
          iataCode: s.origin,
          at: s.departure,
        },
        arrival: {
          iataCode: s.destination,
          at: s.arrival,
        },
        carrierCode: s.airlineCode,
        number: s.flightNumber.replace(s.airlineCode, ''),
        aircraft: { code: '77W' },
        duration: `PT${Math.floor(s.duration / 60)}H${s.duration % 60}M`,
        numberOfStops: 0,
      })),
    }],
    price: {
      currency: f.currency,
      total: String(f.price),
      base: String(Math.floor(f.price * 0.85)),
      grandTotal: String(f.price),
    },
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: false,
    },
    validatingAirlineCodes: [f.airlineCode],
    travelerPricings: [{
      travelerId: '1',
      fareOption: 'STANDARD',
      travelerType: 'ADULT',
      price: {
        currency: f.currency,
        total: String(f.price),
        base: String(Math.floor(f.price * 0.85)),
      },
      fareDetailsBySegment: f.segments.map(s => ({
        segmentId: `${s.flightNumber}-${s.departure}`,
        cabin: 'ECONOMY',
        fareBasis: 'Y',
        class: 'Y',
        includedCheckedBags: { quantity: 1 },
      })),
    }],
    _extended: {
      bookingLink: f.bookingLink,
      baggage: f.baggage,
    },
  };
}

function formatHackerFare(h: HackerFare) {
  return {
    id: h.id,
    type: 'hacker',
    badge: 'HACKER FARE',
    savings: h.savings,
    totalPrice: h.totalPrice,
    airlines: h.airlines,
    outbound: formatFlight(h.outbound),
    return: h.return ? formatFlight(h.return) : null,
    description: `Combine ${h.outbound.airline} outbound + ${h.return?.airline || 'return'} for savings`,
  };
}

function formatSplitTicket(s: SplitTicket) {
  return {
    id: s.id,
    type: 'split',
    badge: 'SPLIT TICKET',
    savings: s.savings,
    totalPrice: s.totalPrice,
    layovers: s.layovers,
    tickets: s.tickets.map(formatFlight),
    description: `Separate tickets via ${s.layovers.join(', ')} save £${s.savings}`,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  const adults = parseInt(searchParams.get('adults') || '1');
  const expandNearby = searchParams.get('expandNearby') === 'true';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  const startTime = Date.now();
  
  try {
    const result = await flightEngine.search({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults,
      expandNearby,
    });

    const flights = result.flights.map(formatFlight);
    const hackerFares = result.hackerFares.map(formatHackerFare);
    const splitTickets = result.splitTickets.map(formatSplitTicket);

    // Build filter options
    const airlines = [...new Set(result.flights.map(f => f.airline))];
    const priceRange = {
      min: Math.min(...result.flights.map(f => f.price), 0),
      max: Math.max(...result.flights.map(f => f.price), 0),
    };

    return NextResponse.json({
      flights,
      optimizations: {
        hackerFares,
        splitTickets,
        totalSavingsOptions: hackerFares.length + splitTickets.length,
      },
      meta: {
        totalResults: flights.length,
        cheapestPrice: flights[0]?.price?.total || 0,
        sources: result.sources,
        searchTime: Date.now() - startTime,
        route: `${origin}-${destination}`,
        class: travelClass,
        adults,
        filters: {
          airlines,
          priceRange,
          maxStops: Math.max(...result.flights.map(f => f.stops), 0),
        },
      },
    });
    
  } catch (error: any) {
    console.error('[Search API Error]', error);
    
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error.message,
        help: 'Add KIWI_API_KEY to environment variables for real flight data'
      },
      { status: 500 }
    );
  }
}
