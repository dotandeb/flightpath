/**
 * RELIABLE SEARCH API - Direct Amadeus integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFlights } from '@/lib/amadeus';
import { validateFlight, removeMockData } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const origin = searchParams.get('origin')?.toUpperCase() || '';
  const destination = searchParams.get('destination')?.toUpperCase() || '';
  const departureDate = searchParams.get('departureDate') || '';
  const travelClass = searchParams.get('travelClass') || 'ECONOMY';
  
  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  try {
    // Direct Amadeus call
    const amadeusResults = await searchFlights({
      origin,
      destination,
      departureDate,
      adults: 1,
      children: 0,
      infants: 0,
      travelClass: travelClass as any,
      nonStop: false
    });
    
    if (!amadeusResults || amadeusResults.length === 0) {
      return NextResponse.json({
        flights: [],
        splitTickets: [],
        meta: { message: 'No flights found for this route/date' }
      });
    }
    
    // Map to our format
    const flights = amadeusResults.map((offer: any, idx: number) => {
      const seg = offer.itineraries[0]?.segments[0];
      return {
        id: `ama-${idx}`,
        source: 'AMADEUS',
        airline: offer.validatingAirlineCodes?.[0] || 'Unknown',
        flightNumber: seg ? `${seg.carrierCode}${seg.number}` : 'FL001',
        from: seg?.departure?.iataCode || origin,
        to: seg?.arrival?.iataCode || destination,
        departure: {
          airport: seg?.departure?.iataCode || origin,
          time: seg?.departure?.at?.split('T')[1]?.substring(0, 5) || '12:00',
          date: seg?.departure?.at?.split('T')[0] || departureDate
        },
        arrival: {
          airport: seg?.arrival?.iataCode || destination,
          time: seg?.arrival?.at?.split('T')[1]?.substring(0, 5) || '15:00',
          date: seg?.arrival?.at?.split('T')[0] || departureDate
        },
        duration: offer.itineraries[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || '3h 00m',
        stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
        price: parseFloat(offer.price?.total) || 999,
        currency: offer.price?.currency || 'GBP',
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}`
      };
    });
    
    // Validate
    const validatedFlights = removeMockData(flights)
      .map(validateFlight)
      .filter((f): f is NonNullable<typeof f> => f !== null);
    
    return NextResponse.json({
      flights: validatedFlights.slice(0, 20),
      splitTickets: [],
      meta: {
        totalResults: validatedFlights.length,
        cheapestPrice: validatedFlights[0]?.price || 0,
        sources: ['AMADEUS']
      }
    });
    
  } catch (error: any) {
    console.error('[Search API Error]', error);
    return NextResponse.json({
      flights: [],
      splitTickets: [],
      meta: { error: error.message || 'Search failed' }
    }, { status: 500 });
  }
}
