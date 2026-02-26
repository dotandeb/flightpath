// Amadeus Flight API Integration - Acid Test Version
// Uses your existing credentials for real-time price testing

import Amadeus from "amadeus";
import { generateAllBookingLinks, getAirlineName, generateBookingLinks } from "./booking-links";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "",
  clientSecret: process.env.AMADEUS_API_SECRET || "",
});

export interface AmadeusSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currency?: string;
  maxPrice?: number;
}

export interface AmadeusFlightOffer {
  id: string;
  price: {
    total: string;
    base: string;
    currency: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
    duration: string;
  }>;
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerType: string;
    price: {
      total: string;
    };
  }>;
}

/**
 * Search flights using Amadeus API
 * FREE TIER: 2,000 calls/month
 */
export async function searchAmadeusFlights(
  params: AmadeusSearchParams
): Promise<AmadeusFlightOffer[]> {
  try {
    console.log("[Amadeus] Searching:", params);

    const searchParams: any = {
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      max: "10",
      currencyCode: params.currency || "GBP",
    };

    if (params.returnDate) {
      searchParams.returnDate = params.returnDate;
    }

    if (params.children) {
      searchParams.children = params.children.toString();
    }

    if (params.travelClass) {
      searchParams.travelClass = params.travelClass;
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    console.log(`[Amadeus] Found ${response.data?.length || 0} offers`);
    
    return response.data || [];
  } catch (error: any) {
    console.error("[Amadeus] Search error:", error.response?.data || error.message);
    
    // Check for quota exceeded
    if (error.response?.status === 429) {
      throw new Error("Amadeus API quota exceeded (2,000 calls/month free tier)");
    }
    
    throw error;
  }
}

/**
 * Transform Amadeus response to our app's format
 */
export function transformAmadeusResults(
  offers: AmadeusFlightOffer[],
  params: AmadeusSearchParams
): any {
  if (!offers || offers.length === 0) {
    return { options: [], priceRange: { min: 0, max: 0 } };
  }

  const totalPassengers = params.adults + (params.children || 0) + (params.infants || 0);
  
  const options = offers.map((offer, idx) => {
    const totalPrice = parseFloat(offer.price.total);
    const perPersonPrice = totalPrice / totalPassengers;
    
    // Build segments from itineraries
    const segments = offer.itineraries.flatMap((itinerary, itinIdx) =>
      itinerary.segments.map((seg, segIdx) => ({
        id: `${offer.id}-${itinIdx}-${segIdx}`,
        origin: {
          code: seg.departure.iataCode,
          name: "",
          city: "",
          country: "",
          lat: 0,
          lng: 0,
        },
        destination: {
          code: seg.arrival.iataCode,
          name: "",
          city: "",
          country: "",
          lat: 0,
          lng: 0,
        },
        departureTime: seg.departure.at,
        arrivalTime: seg.arrival.at,
        airline: seg.carrierCode,
        airlineName: getAirlineName(seg.carrierCode),
        flightNumber: `${seg.carrierCode}${seg.number}`,
        duration: seg.duration,
        durationMinutes: parseDuration(seg.duration),
        stops: 0, // Direct segment
        aircraft: seg.aircraft.code,
        cabinClass: params.travelClass || "ECONOMY",
        bookingClass: "",
      }))
    );

    const firstSegment = offer.itineraries[0]?.segments[0];
    
    return {
      id: offer.id,
      strategy: "standard",
      strategyDescription: `Direct via ${getAirlineName(offer.validatingAirlineCodes[0])}`,
      totalPrice: Math.round(totalPrice),
      perPersonPrice: Math.round(perPersonPrice),
      currency: offer.price.currency,
      segments,
      bookingLinks: generateBookingLinks({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children || 0,
        infants: params.infants || 0,
        airline: firstSegment?.carrierCode,
        price: Math.round(totalPrice),
      }).map(l => ({ airline: l.provider, price: l.price, url: l.url })),
      savingsVsStandard: 0,
      risks: [],
      _source: "amadeus",
      _realTime: true,
    };
  });

  // Sort by price
  options.sort((a, b) => a.totalPrice - b.totalPrice);

  const prices = options.map((o) => o.totalPrice);

  return {
    options,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: options[0]?.currency || "GBP",
    },
    bestOption: options[0],
    standardOption: options[0],
    optimizedOptions: [],
    _dataSource: "amadeus-api",
    _realTimeData: true,
    _cacheWarning: "Real-time prices from Amadeus",
  };
}

function parseDuration(duration: string): number {
  // PT2H30M -> 150 minutes
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  return hours * 60 + minutes;
}

/**
 * ACID TEST: Verify Amadeus API works
 */
export async function runAcidTest(): Promise<{
  success: boolean;
  message: string;
  sampleResult?: any;
}> {
  try {
    console.log("[Acid Test] Running Amadeus API test...");
    
    const testParams: AmadeusSearchParams = {
      origin: "LHR",
      destination: "CDG",
      departureDate: getFutureDate(14),
      adults: 1,
      currency: "GBP",
    };

    const offers = await searchAmadeusFlights(testParams);
    
    if (offers.length === 0) {
      return {
        success: false,
        message: "API connected but no flights found for test route",
      };
    }

    const transformed = transformAmadeusResults(offers, testParams);
    
    return {
      success: true,
      message: `✅ ACID TEST PASSED: Found ${offers.length} real flights from ${testParams.origin} to ${testParams.destination}. Best price: ${transformed.priceRange.currency} ${transformed.priceRange.min}`,
      sampleResult: transformed.bestOption,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ ACID TEST FAILED: ${error.message}`,
    };
  }
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
