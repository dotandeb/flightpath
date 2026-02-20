// Travelpayouts Data API Integration
// Partner ID: 705007
// Docs: https://support.travelpayouts.com/hc/en-us/articles/360020615880-Travelpayouts-Data-API
// NOTE: Data is cached ~48 hours - suitable for static pages and arbitrage comparison

import crypto from "crypto";

// ============================================
// CONFIGURATION
// ============================================

const TP_CONFIG = {
  MARKER: "705007",
  BASE_URL: "https://api.travelpayouts.com",
  DATA_URL: "https://travelpayouts-travelpayouts-flight-data-v1.p.rapidapi.com",
};

// ============================================
// TYPES
// ============================================

export interface TPDataSearchParams {
  origin: string;           // IATA code (e.g., "LHR")
  destination: string;      // IATA code (e.g., "BKK")
  departureDate: string;    // YYYY-MM or YYYY-MM-DD
  returnDate?: string;      // YYYY-MM or YYYY-MM-DD
  currency?: string;        // Default: GBP
  token?: string;           // Your affiliate token
}

export interface TPCheapFlight {
  price: number;
  airline: string;
  flight_number: number;
  departure_at: string;
  return_at?: string;
  expires_at: string;
}

export interface TPCheapResponse {
  success: boolean;
  data: Record<string, Record<string, TPCheapFlight>>;
  error?: string;
}

export interface TPCalendarFlight {
  origin: string;
  destination: string;
  price: number;
  transfers: number;
  airline: string;
  flight_number: number;
  departure_at: string;
  return_at: string;
  expires_at: string;
}

export interface TPCalendarResponse {
  success: boolean;
  data: Record<string, TPCalendarFlight>;
  error?: string;
}

export interface TPNearestPlace {
  value: number;
  trip_class: number;
  show_to_affiliates: boolean;
  return_date: string;
  origin: string;
  number_of_changes: number;
  gate: string;
  found_at: string;
  distance: number;
  destination: string;
  depart_date: string;
  actual: boolean;
}

export interface TPNearestPlacesResponse {
  prices: TPNearestPlace[];
  origins: string[];
  destinations: string[];
  errors?: Record<string, any>;
}

// ============================================
// DATA API CLIENT
// ============================================

export class TravelpayoutsDataAPI {
  private token: string;
  private marker: string;
  private rapidApiKey?: string;

  constructor(token: string, rapidApiKey?: string) {
    this.token = token;
    this.marker = TP_CONFIG.MARKER;
    this.rapidApiKey = rapidApiKey;
  }

  /**
   * Get cheapest tickets for a route
   * Endpoint: /v1/prices/cheap
   * Returns cheapest non-stop and 1-2 stop tickets
   */
  async getCheapFlights(params: TPDataSearchParams): Promise<TPCheapResponse> {
    const queryParams = new URLSearchParams({
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      currency: params.currency || "GBP",
      token: params.token || this.token,
    });

    if (params.departureDate) {
      queryParams.set("depart_date", params.departureDate);
    }
    if (params.returnDate) {
      queryParams.set("return_date", params.returnDate);
    }

    const url = `${TP_CONFIG.BASE_URL}/v1/prices/cheap?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
        ...(this.rapidApiKey && {
          "X-RapidAPI-Key": this.rapidApiKey,
          "X-RapidAPI-Host": "travelpayouts-travelpayouts-flight-data-v1.p.rapidapi.com",
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Data API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get cheapest direct (non-stop) flights
   * Endpoint: /v1/prices/direct
   */
  async getDirectFlights(params: TPDataSearchParams): Promise<TPCheapResponse> {
    const queryParams = new URLSearchParams({
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      currency: params.currency || "GBP",
      token: params.token || this.token,
    });

    if (params.departureDate) {
      queryParams.set("depart_date", params.departureDate);
    }
    if (params.returnDate) {
      queryParams.set("return_date", params.returnDate);
    }

    const url = `${TP_CONFIG.BASE_URL}/v1/prices/direct?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`Data API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get calendar of prices for a month
   * Endpoint: /v1/prices/calendar
   * Returns cheapest flights for each day of the month
   */
  async getCalendarPrices(params: TPDataSearchParams): Promise<TPCalendarResponse> {
    const queryParams = new URLSearchParams({
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      depart_date: params.departureDate, // YYYY-MM format
      calendar_type: "departure_date",
      currency: params.currency || "GBP",
      token: params.token || this.token,
    });

    if (params.returnDate) {
      queryParams.set("return_date", params.returnDate);
    }

    const url = `${TP_CONFIG.BASE_URL}/v1/prices/calendar?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get prices for nearest places (alternative airports)
   * Endpoint: /v2/prices/nearest-places-matrix
   * Great for finding nearby airport savings
   */
  async getNearestPlacesPrices(
    origin: string,
    destination: string,
    options: {
      departDate?: string;
      returnDate?: string;
      limit?: number;
      flexibility?: number;
      currency?: string;
    } = {}
  ): Promise<TPNearestPlacesResponse> {
    const queryParams = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      currency: options.currency || "GBP",
      show_to_affiliates: "true",
      token: this.token,
    });

    if (options.departDate) queryParams.set("depart_date", options.departDate);
    if (options.returnDate) queryParams.set("return_date", options.returnDate);
    if (options.limit) queryParams.set("limit", options.limit.toString());
    if (options.flexibility) queryParams.set("flexibility", options.flexibility.toString());

    const url = `${TP_CONFIG.BASE_URL}/v2/prices/nearest-places-matrix?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`Nearest places API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get monthly prices grouped by month
   * Endpoint: /v1/prices/monthly
   */
  async getMonthlyPrices(
    origin: string,
    destination: string,
    currency: string = "GBP"
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      currency,
      token: this.token,
    });

    const url = `${TP_CONFIG.BASE_URL}/v1/prices/monthly?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`Monthly API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get popular directions from a city
   * Endpoint: /v1/city-directions
   */
  async getPopularDirections(origin: string, currency: string = "GBP"): Promise<any> {
    const queryParams = new URLSearchParams({
      origin: origin.toUpperCase(),
      currency,
      token: this.token,
    });

    const url = `${TP_CONFIG.BASE_URL}/v1/city-directions?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`City directions API error: ${response.status}`);
    }

    return response.json();
  }
}

// ============================================
// AFFILIATE LINK GENERATION
// ============================================

/**
 * Generate affiliate booking link
 * This redirects to Aviasales/Skyscanner with your marker
 */
export function generateAffiliateLink(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  marker: string = TP_CONFIG.MARKER,
  passengers: { adults: number; children: number; infants: number } = { adults: 1, children: 0, infants: 0 }
): string {
  const baseUrl = "https://www.aviasales.com/search";
  
  // Format: /origin-departureMonth-destination-returnMonth-1
  const depMonth = departureDate.substring(0, 7).replace("-", ""); // YYYYMM
  const retParam = returnDate ? returnDate.substring(0, 7).replace("-", "") : "";
  
  const route = `${origin.toLowerCase()}${depMonth}${destination.toLowerCase()}${retParam}`;
  const pax = `${passengers.adults}${passengers.children}${passengers.infants}`;
  
  return `${baseUrl}/${route}${pax}?marker=${marker}`;
}

/**
 * Generate direct airline or OTA search links
 */
export function generateBookingLinks(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  price: number,
  marker: string = TP_CONFIG.MARKER
): Array<{ provider: string; url: string; price: number }> {
  const links = [];

  // Aviasales/Skyscanner (primary affiliate)
  links.push({
    provider: "Aviasales",
    url: generateAffiliateLink(origin, destination, departureDate, returnDate, marker),
    price,
  });

  // Alternative search options
  links.push(
    {
      provider: "Google Flights",
      url: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departureDate}`,
      price,
    },
    {
      provider: "Skyscanner",
      url: `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/?oym=${departureDate.substring(0, 7).replace("-", "")}`,
      price,
    }
  );

  return links;
}

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Convert Data API response to our app's format
 */
export function transformCheapFlights(
  response: TPCheapResponse,
  origin: string,
  destination: string,
  params: any
): any {
  if (!response.success || !response.data) {
    return { options: [], priceRange: { min: 0, max: 0 } };
  }

  const options: any[] = [];
  const prices: number[] = [];

  // Data structure: { destination: { "0": flight, "1": flight, ... } }
  Object.entries(response.data).forEach(([destCode, flights]) => {
    Object.entries(flights).forEach(([idx, flight]) => {
      prices.push(flight.price);
      
      options.push({
        id: `${origin}-${destCode}-${idx}`,
        strategy: "standard",
        strategyDescription: `Direct flight via ${flight.airline}`,
        totalPrice: flight.price,
        perPersonPrice: flight.price,
        currency: params.currency || "GBP",
        segments: [
          {
            id: `seg-${idx}`,
            origin: { code: origin, name: "", city: "", country: "", lat: 0, lng: 0 },
            destination: { code: destCode, name: "", city: "", country: "", lat: 0, lng: 0 },
            departureTime: flight.departure_at,
            arrivalTime: flight.departure_at, // Data API doesn't provide arrival
            airline: flight.airline,
            airlineName: flight.airline,
            flightNumber: `${flight.airline}${flight.flight_number}`,
            duration: "",
            durationMinutes: 0,
            stops: 0,
            aircraft: "",
            cabinClass: params.travelClass || "ECONOMY",
            bookingClass: "",
          },
        ],
        bookingLinks: generateBookingLinks(
          origin,
          destCode,
          flight.departure_at.substring(0, 10),
          flight.return_at?.substring(0, 10),
          flight.price
        ).map(l => ({ airline: l.provider, price: l.price, url: l.url })),
        savingsVsStandard: 0,
        risks: [],
        expiresAt: flight.expires_at,
      });
    });
  });

  // Sort by price
  options.sort((a, b) => a.totalPrice - b.totalPrice);

  return {
    options,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: params.currency || "GBP",
    },
    bestOption: options[0],
    standardOption: options[0],
    optimizedOptions: [],
    _dataSource: "travelpayouts-data-api",
    _cacheWarning: "Prices cached ~48 hours ago",
  };
}

/**
 * Transform nearest places for nearby airport arbitrage
 */
export function transformNearestPlaces(
  response: TPNearestPlacesResponse,
  originalOrigin: string,
  originalDest: string,
  params: any
): any[] {
  if (!response.prices || response.prices.length === 0) return [];

  const options: any[] = [];

  response.prices.forEach((place, idx) => {
    const isAltOrigin = place.origin !== originalOrigin.toUpperCase();
    const isAltDest = place.destination !== originalDest.toUpperCase();
    
    let strategy = "standard";
    let description = "Direct flight";
    
    if (isAltOrigin && isAltDest) {
      strategy = "nearby-both";
      description = `Fly ${place.origin} → ${place.destination}`;
    } else if (isAltOrigin) {
      strategy = "nearby-origin";
      description = `Depart from ${place.origin} instead of ${originalOrigin}`;
    } else if (isAltDest) {
      strategy = "nearby-destination";
      description = `Arrive at ${place.destination} instead of ${originalDest}`;
    }

    options.push({
      id: `nearby-${idx}`,
      strategy,
      strategyDescription: description,
      totalPrice: Math.round(place.value),
      perPersonPrice: Math.round(place.value),
      currency: params.currency || "GBP",
      segments: [
        {
          id: `nearby-seg-${idx}`,
          origin: { code: place.origin, name: "", city: "", country: "", lat: 0, lng: 0 },
          destination: { code: place.destination, name: "", city: "", country: "", lat: 0, lng: 0 },
          departureTime: place.depart_date,
          arrivalTime: place.depart_date,
          airline: "MULTI",
          airlineName: "Multiple airlines",
          flightNumber: "",
          duration: "",
          durationMinutes: 0,
          stops: place.number_of_changes,
          aircraft: "",
          cabinClass: params.travelClass || "ECONOMY",
          bookingClass: "",
        },
      ],
      bookingLinks: generateBookingLinks(
        place.origin,
        place.destination,
        place.depart_date,
        place.return_date,
        Math.round(place.value)
      ).map(l => ({ airline: l.provider, price: l.price, url: l.url })),
      savingsVsStandard: 0, // Will be calculated against standard
      risks: isAltOrigin || isAltDest ? ["Factor in ground transport costs"] : [],
      distance: place.distance,
      gate: place.gate,
    });
  });

  return options;
}

// ============================================
// SAMPLE DATA (Fallback)
// ============================================

export function generateSampleDataResults(params: any): any {
  const basePrice = 350 + Math.floor(Math.random() * 400);
  const totalPassengers = (params.adults || 1) + (params.children || 0) + (params.infants || 0);
  const totalPrice = basePrice * totalPassengers;
  
  const origin = params.origin || "LHR";
  const destination = params.destination || "BKK";
  const departureDate = params.departureDate || new Date().toISOString().split('T')[0];
  
  const standardOption = {
    id: "sample-standard",
    strategy: "standard",
    strategyDescription: "Direct return flight",
    totalPrice,
    perPersonPrice: basePrice,
    currency: params.currency || "GBP",
    segments: [
      {
        id: "seg-1",
        origin: { code: origin, name: "", city: "", country: "", lat: 0, lng: 0 },
        destination: { code: destination, name: "", city: "", country: "", lat: 0, lng: 0 },
        departureTime: `${departureDate}T10:00:00`,
        arrivalTime: `${departureDate}T20:00:00`,
        airline: "BA",
        airlineName: "British Airways",
        flightNumber: "BA123",
        duration: "10h 00m",
        durationMinutes: 600,
        stops: 0,
        aircraft: "B787",
        cabinClass: params.travelClass || "ECONOMY",
        bookingClass: "",
      },
    ],
    bookingLinks: generateBookingLinks(origin, destination, departureDate, params.returnDate, basePrice)
      .map(l => ({ airline: l.provider, price: Math.round(l.price), url: l.url })),
    savingsVsStandard: 0,
    risks: [],
  };

  const optimizedOptions: any[] = [];

  // Add split-ticket option
  if (params.returnDate) {
    const splitPrice = Math.round(basePrice * 0.82 * totalPassengers);
    optimizedOptions.push({
      ...standardOption,
      id: "sample-split",
      strategy: "split-ticket",
      strategyDescription: "Book separate one-way tickets",
      totalPrice: splitPrice,
      perPersonPrice: Math.round(splitPrice / totalPassengers),
      savingsVsStandard: totalPrice - splitPrice,
      risks: [
        "If you miss a connection, the airline won't help",
        "You need to collect and re-check baggage",
        "Allow at least 3 hours between separate tickets",
      ],
    });
  }

  // Add nearby origin option
  const nearbyOriginPrice = Math.round(basePrice * 0.88 * totalPassengers);
  optimizedOptions.push({
    ...standardOption,
    id: "sample-nearby-origin",
    strategy: "nearby-origin",
    strategyDescription: `Fly from alternative airport (save £${Math.round(basePrice * 0.12)})`,
    totalPrice: nearbyOriginPrice,
    perPersonPrice: Math.round(nearbyOriginPrice / totalPassengers),
    savingsVsStandard: totalPrice - nearbyOriginPrice,
    risks: ["Factor in transport costs to alternative airport"],
  });

  // Add nearby destination option
  const nearbyDestPrice = Math.round(basePrice * 0.90 * totalPassengers);
  optimizedOptions.push({
    ...standardOption,
    id: "sample-nearby-dest",
    strategy: "nearby-destination",
    strategyDescription: `Fly to nearby airport (save £${Math.round(basePrice * 0.10)})`,
    totalPrice: nearbyDestPrice,
    perPersonPrice: Math.round(nearbyDestPrice / totalPassengers),
    savingsVsStandard: totalPrice - nearbyDestPrice,
    risks: ["Research ground transport options before booking"],
  });

  // Sort by price
  optimizedOptions.sort((a, b) => a.totalPrice - b.totalPrice);

  // Find best option
  const bestOption = optimizedOptions[0]?.savingsVsStandard > 0 
    ? optimizedOptions[0] 
    : standardOption;

  return {
    searchParams: params,
    priceRange: {
      min: Math.min(standardOption.totalPrice, ...optimizedOptions.map(o => o.totalPrice)),
      max: Math.max(standardOption.totalPrice, ...optimizedOptions.map(o => o.totalPrice)),
      currency: params.currency || "GBP",
    },
    bestOption,
    standardOption,
    optimizedOptions: optimizedOptions.filter(o => o.id !== bestOption.id),
    _dataSource: "sample-data",
    _cacheWarning: "Sample data for demonstration",
  };
}
