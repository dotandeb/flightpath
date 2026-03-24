/**
 * UNIFIED FLIGHT SEARCH API v3
 * No API keys required - uses intelligent route-based generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverlessScraper, ScrapedFlight } from '@/lib/serverless-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function formatFlight(f: ScrapedFlight) {
  const hours = Math.floor(f.duration / 60);
  const mins = f.duration % 60;
  
  return {
    id: f.id,
    source: f.source,
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: true,
    lastTicketingDate: f.departure.split('T')[0],
    numberOfBookableSeats: 9,
    itineraries: [{
      duration: `PT${hours}H${mins}M`,
      segments: [{
        id: f.id,
        departure: {
          iataCode: f.origin,
          at: f.departure,
        },
        arrival: {
          iataCode: f.destination,
          at: f.arrival,
        },
        carrierCode: f.airlineCode,
        number: f.flightNumber.replace(f.airlineCode, ''),
        aircraft: { code: '77W' },
        duration: `PT${hours}H${mins}M`,
        numberOfStops: f.stops,
      }],
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
      fareDetailsBySegment: [{
        segmentId: f.id,
        cabin: 'ECONOMY',
        fareBasis: 'Y',
        class: 'Y',
        includedCheckedBags: { quantity: 1 },
      }],
    }],
    _extended: {
      bookingLink: f.bookingLink,
    },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, departureDate' },
      { status: 400 }
    );
  }
  
  const startTime = Date.now();
  
  try {
    // Get direct flights
    const directFlights = await serverlessScraper.scrapeFlights({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults,
    });

    // Get split ticket opportunities
    const splitOpportunities = await serverlessScraper.findSplitTickets({
      origin,
      destination,
      departureDate,
      adults,
    });

    // Format split tickets
    const splitTickets = splitOpportunities.map(opp => ({
      id: `split-${opp.hub}-${Date.now()}`,
      type: 'split',
      badge: 'SPLIT TICKET',
      savings: opp.savings,
      totalPrice: opp.totalPrice,
      hub: opp.hub,
      layoverTime: '2h 00m',
      tickets: [formatFlight(opp.leg1), formatFlight(opp.leg2)],
      description: `Save £${opp.savings} by booking separate tickets via ${opp.hub}`,
      bookingLink: `https://www.google.com/travel/flights?q=${origin}+to+${opp.hub}+to+${destination}`,
    }));

    // Calculate cheapest prices
    const cheapestDirect = directFlights[0]?.price || 0;
    const cheapestSplit = splitTickets[0]?.totalPrice || Infinity;
    const overallCheapest = Math.min(cheapestDirect, cheapestSplit);

    // Get unique airlines for filters
    const airlines = [...new Set(directFlights.map(f => f.airline))];
    const priceRange = {
      min: Math.min(...directFlights.map(f => f.price), cheapestSplit || Infinity),
      max: Math.max(...directFlights.map(f => f.price)),
    };

    return NextResponse.json({
      flights: directFlights.map(formatFlight),
      optimizations: {
        splitTickets,
        hackerFares: [], // Would need return flights for this
        totalSavingsOptions: splitTickets.length,
        bestDeal: {
          type: cheapestSplit < cheapestDirect ? 'split' : 'direct',
          price: overallCheapest,
          savings: cheapestSplit < cheapestDirect ? splitTickets[0].savings : 0,
        },
      },
      meta: {
        totalResults: directFlights.length,
        splitTicketOptions: splitTickets.length,
        cheapestPrice: overallCheapest,
        sources: ['RouteDatabase'],
        searchTime: Date.now() - startTime,
        route: `${origin}-${destination}`,
        adults,
        filters: {
          airlines,
          priceRange,
          maxStops: Math.max(...directFlights.map(f => f.stops)),
        },
      },
    });
    
  } catch (error: any) {
    console.error('[Search API Error]', error);
    
    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    );
  }
}
