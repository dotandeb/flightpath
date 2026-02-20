// Travelpayouts Flight Search API Integration
// Partner ID: 705007
// Docs: https://www.travelpayouts.com/developers/api

import crypto from "crypto";

// ============================================
// CONFIGURATION
// ============================================

const TP_CONFIG = {
  // Your partner credentials
  MARKER: "705007",
  
  // API endpoints (new version from Nov 2025)
  BASE_URL: "https://tickets-api.travelpayouts.com",
  
  // Headers required for all requests
  HOST: "flightpath.solutions",
};

// ============================================
// TYPES
// ============================================

export interface TPFlightSearchParams {
  origin: string;           // IATA code (e.g., "LHR")
  destination: string;      // IATA code (e.g., "BKK")
  departureDate: string;    // YYYY-MM-DD
  returnDate?: string;      // YYYY-MM-DD (omit for one-way)
  adults: number;           // 1-9
  children?: number;        // 0-6
  infants?: number;         // 0-6
  travelClass: "Y" | "C" | "F" | "W";  // Economy, Business, First, Comfort
  currency?: string;        // e.g., "GBP", "USD"
  locale?: string;          // e.g., "en-gb", "en-us"
  marketCode?: string;      // ISO 3166-1 (e.g., "GB", "US")
}

export interface TPStartSearchResponse {
  search_id: string;
  results_url: string;
}

export interface TPFlightResult {
  search_id: string;
  is_over: boolean;
  last_update_timestamp: number;
  tickets: TPTicket[];
  flight_legs: TPFlightLeg[];
  agents: TPAgent[];
  airlines: TPAirline[];
  boundaries: TPBoundaries;
}

export interface TPTicket {
  id: string;
  segments: TPSegment[];
  proposals: TPProposal[];
  signature: string;
}

export interface TPSegment {
  flights: number[];        // Indexes into flight_legs
  transfers: TPTransfer[];
  tags: string[];
}

export interface TPTransfer {
  night_transfer: boolean;
  recheck_baggage: boolean;
  airport_change: boolean;
  short_layover: boolean;
  visa_rules?: string;
}

export interface TPProposal {
  id: string;
  agent_id: number;
  price: {
    amount: number;
    currency: string;
  };
  price_per_person: {
    amount: number;
    currency: string;
  };
  flight_terms: {
    trip_class: "Y" | "C" | "F" | "W";
    seats_available?: number;
    airline_id: string;
    carrier: string;
    number: string;
    baggage?: TPBaggage;
    handbags?: TPBaggage;
  };
}

export interface TPBaggage {
  count: number;
  weight: number;
  height?: number;
  length?: number;
  width?: number;
  total_weight?: number;
}

export interface TPFlightLeg {
  origin: string;           // IATA
  destination: string;      // IATA
  departure_unix_timestamp: number;
  arrival_unix_timestamp: number;
  local_departure_date_time: string;
  local_arrival_date_time: string;
  operating_carrier_designator: string;
  equipment: string;
  signature: string;
  technical_stops: any[];
}

export interface TPAgent {
  id: number;
  gate_name: string;
  label: string;
  payment_methods: string[];
  airline_iatas: string[];
}

export interface TPAirline {
  iata: string;
  name: string;
  is_lowcost: boolean;
}

export interface TPBoundaries {
  price: { min: number; max: number };
  transfers_count: { min: number; max: number };
  // ... other filter boundaries
}

export interface TPBookingLinkResponse {
  gate_id: number;
  agent_id: number;
  click_id: number;
  str_click_id: string;
  url: string;
  method: "GET";
  params: {
    gate_id: number;
    agent_id: number;
    click_id: number;
  };
  expire_at_unix_sec: number;
}

// ============================================
// SIGNATURE GENERATION
// ============================================

/**
 * Generate signature for Travelpayouts API
 * Signature = MD5(token:marker:sorted_param_values)
 * 
 * Note: You need your API token from Travelpayouts dashboard
 * Get it at: https://www.travelpayouts.com/programs/100/tools/api
 */
export function generateSignature(
  token: string,
  marker: string,
  params: Record<string, any>
): string {
  // Sort params alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  
  // Build string: token:marker:value1:value2:value3...
  const values = sortedKeys.map(key => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
  
  const signatureString = [token, marker, ...values].join(":");
  
  // Generate MD5 hash
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

// ============================================
// API CLIENT
// ============================================

export class TravelpayoutsAPI {
  private token: string;
  private marker: string;
  private host: string;

  constructor(token: string) {
    this.token = token;
    this.marker = TP_CONFIG.MARKER;
    this.host = TP_CONFIG.HOST;
  }

  /**
   * Start a new flight search
   * Returns search_id and results_url for polling
   */
  async startSearch(params: TPFlightSearchParams): Promise<TPStartSearchResponse> {
    const directions: any[] = [
      {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        date: params.departureDate,
      },
    ];

    if (params.returnDate) {
      directions.push({
        origin: params.destination.toUpperCase(),
        destination: params.origin.toUpperCase(),
        date: params.returnDate,
      });
    }

    const bodyParams = {
      signature: "", // Will be set below
      marker: this.marker,
      locale: params.locale || "en-gb",
      currency_code: params.currency || "GBP",
      market_code: params.marketCode || "GB",
      search_params: {
        trip_class: params.travelClass,
        passengers: {
          adults: params.adults,
          children: params.children || 0,
          infants: params.infants || 0,
        },
        directions,
      },
    };

    // Generate signature for body params
    const signatureParams = {
      currency_code: bodyParams.currency_code,
      locale: bodyParams.locale,
      market_code: bodyParams.market_code,
      marker: bodyParams.marker,
    };
    
    const signature = generateSignature(this.token, this.marker, signatureParams);
    bodyParams.signature = signature;

    const response = await fetch(`${TP_CONFIG.BASE_URL}/search/affiliate/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-host": this.host,
        "x-user-ip": await this.getUserIP(),
        "x-signature": signature,
        "x-affiliate-user-id": this.token,
      },
      body: JSON.stringify(bodyParams),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Search start failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Poll for search results
   * Call repeatedly until is_over = true
   */
  async getResults(
    resultsUrl: string,
    searchId: string,
    lastUpdateTimestamp: number = 0
  ): Promise<TPFlightResult> {
    const url = `${resultsUrl}/search/affiliate/results`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-host": this.host,
        "x-user-ip": await this.getUserIP(),
        "x-signature": generateSignature(this.token, this.marker, { search_id: searchId }),
        "x-affiliate-user-id": this.token,
      },
      body: JSON.stringify({
        search_id: searchId,
        last_update_timestamp: lastUpdateTimestamp,
      }),
    });

    if (response.status === 304) {
      // No new results yet
      return {
        search_id: searchId,
        is_over: false,
        last_update_timestamp: lastUpdateTimestamp,
        tickets: [],
        flight_legs: [],
        agents: [],
        airlines: [],
        boundaries: {} as TPBoundaries,
      };
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get results failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Generate booking link when user clicks "Book"
   * This must ONLY be called on user action (required by API terms)
   */
  async getBookingLink(
    resultsUrl: string,
    searchId: string,
    proposalId: string
  ): Promise<TPBookingLinkResponse> {
    const url = `https://${resultsUrl}/searches/${searchId}/clicks/${proposalId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-host": this.host,
        "x-user-ip": await this.getUserIP(),
        "x-signature": generateSignature(this.token, this.marker, {
          search_id: searchId,
          proposal_id: proposalId,
        }),
        "x-affiliate-user-id": this.token,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get booking link failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Poll until search is complete
   * Convenience method that handles polling logic
   */
  async waitForResults(
    resultsUrl: string,
    searchId: string,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      onProgress?: (result: TPFlightResult) => void;
    } = {}
  ): Promise<TPFlightResult> {
    const { maxAttempts = 30, delayMs = 2000, onProgress } = options;
    
    let lastUpdateTimestamp = 0;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getResults(resultsUrl, searchId, lastUpdateTimestamp);
      
      lastUpdateTimestamp = result.last_update_timestamp;
      
      if (onProgress) {
        onProgress(result);
      }
      
      if (result.is_over) {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error("Search timed out - too many polling attempts");
  }

  private async getUserIP(): Promise<string> {
    // In production, get this from the incoming request
    // For now, return a placeholder (server will use request IP)
    return "0.0.0.0";
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert our app's SearchParams to Travelpayouts format
 */
export function convertToTPParams(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: string;
  currency?: string;
}): TPFlightSearchParams {
  const classMap: Record<string, "Y" | "C" | "F" | "W"> = {
    "ECONOMY": "Y",
    "PREMIUM_ECONOMY": "W",
    "BUSINESS": "C",
    "FIRST": "F",
  };

  return {
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    travelClass: classMap[params.travelClass] || "Y",
    currency: params.currency || "GBP",
    locale: "en-gb",
    marketCode: "GB",
  };
}

/**
 * Transform Travelpayouts results to our app's format
 */
export function transformTPResults(
  result: TPFlightResult,
  searchParams: TPFlightSearchParams
): any {
  const totalPassengers = searchParams.adults + (searchParams.children || 0) + (searchParams.infants || 0);
  
  const options = result.tickets.map((ticket, idx) => {
    const bestProposal = ticket.proposals[0];
    if (!bestProposal) return null;

    // Build segments from flight legs
    const segments = ticket.segments.map((seg, segIdx) => {
      const legs = seg.flights.map(flightIdx => result.flight_legs[flightIdx]);
      
      return {
        id: `${ticket.id}-${segIdx}`,
        origin: {
          code: legs[0]?.origin || "",
          name: "",
          city: "",
          country: "",
          lat: 0,
          lng: 0,
        },
        destination: {
          code: legs[legs.length - 1]?.destination || "",
          name: "",
          city: "",
          country: "",
          lat: 0,
          lng: 0,
        },
        departureTime: legs[0]?.local_departure_date_time || "",
        arrivalTime: legs[legs.length - 1]?.local_arrival_date_time || "",
        airline: bestProposal.flight_terms.carrier,
        airlineName: result.airlines.find(a => a.iata === bestProposal.flight_terms.carrier)?.name || "",
        flightNumber: bestProposal.flight_terms.number,
        duration: "",
        durationMinutes: 0,
        stops: legs.length - 1,
        aircraft: legs[0]?.equipment || "",
        cabinClass: searchParams.travelClass,
        bookingClass: "",
      };
    });

    const agent = result.agents.find(a => a.id === bestProposal.agent_id);

    return {
      id: ticket.id,
      strategy: "standard" as const,
      strategyDescription: `Book via ${agent?.label || "partner"}`,
      totalPrice: Math.round(bestProposal.price.amount),
      perPersonPrice: Math.round(bestProposal.price_per_person.amount),
      currency: bestProposal.price.currency,
      segments,
      bookingLinks: ticket.proposals.slice(0, 4).map(p => {
        const a = result.agents.find(agent => agent.id === p.agent_id);
        return {
          airline: a?.label || "Partner",
          price: Math.round(p.price.amount),
          url: "#", // Will be generated on click
          proposalId: p.id,
        };
      }),
      savingsVsStandard: 0,
      risks: [],
    };
  }).filter(Boolean);

  // Find price range
  const prices = options.map((o: any) => o.totalPrice);
  
  return {
    searchParams,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: searchParams.currency,
    },
    bestOption: options[0],
    optimizedOptions: options.slice(1),
    standardOption: options[0],
    raw: result, // Keep raw data for booking link generation
  };
}

// ============================================
// USAGE EXAMPLE (when approved)
// ============================================

/*
// In your API route:

import { TravelpayoutsAPI, convertToTPParams, transformTPResults } from "@/app/lib/travelpayouts-api";

const tpApi = new TravelpayoutsAPI(process.env.TRAVELPAYOUTS_API_TOKEN!);

export async function POST(request: Request) {
  const params = await request.json();
  
  // 1. Start search
  const tpParams = convertToTPParams(params);
  const { search_id, results_url } = await tpApi.startSearch(tpParams);
  
  // 2. Poll for results (with loading state)
  const results = await tpApi.waitForResults(results_url, search_id, {
    onProgress: (partial) => {
      console.log(`Found ${partial.tickets.length} tickets so far...`);
    },
  });
  
  // 3. Transform to our format
  const transformed = transformTPResults(results, tpParams);
  
  return Response.json(transformed);
}

// In your booking button handler:
async function handleBookClick(proposalId: string, rawResult: any) {
  const tpApi = new TravelpayoutsAPI(process.env.TRAVELPAYOUTS_API_TOKEN!);
  
  const { url } = await tpApi.getBookingLink(
    rawResult.results_url,
    rawResult.search_id,
    proposalId
  );
  
  window.open(url, "_blank");
}
*/

// ============================================
// FALLBACK: Sample Data Mode
// ============================================

/**
 * When API is not yet approved, use this for development
 */
export function generateSampleResults(params: TPFlightSearchParams): any {
  const basePrice = 450 + Math.random() * 600;
  const totalPassengers = params.adults + (params.children || 0) + (params.infants || 0);
  
  return {
    searchParams: params,
    priceRange: {
      min: Math.round(basePrice),
      max: Math.round(basePrice * 1.4),
      currency: params.currency,
    },
    bestOption: {
      id: "sample-1",
      strategy: "standard",
      strategyDescription: "Direct flight with partner airline",
      totalPrice: Math.round(basePrice * totalPassengers),
      perPersonPrice: Math.round(basePrice),
      currency: params.currency,
      segments: [
        {
          id: "seg-1",
          origin: { code: params.origin, name: "", city: "", country: "", lat: 0, lng: 0 },
          destination: { code: params.destination, name: "", city: "", country: "", lat: 0, lng: 0 },
          departureTime: `${params.departureDate}T10:00:00`,
          arrivalTime: `${params.departureDate}T18:00:00`,
          airline: "BA",
          airlineName: "British Airways",
          flightNumber: "BA123",
          duration: "8h 00m",
          durationMinutes: 480,
          stops: 0,
          aircraft: "B787",
          cabinClass: params.travelClass,
          bookingClass: "",
        },
      ],
      bookingLinks: [
        { airline: "British Airways", price: Math.round(basePrice), url: "#", proposalId: "p1" },
        { airline: "Skyscanner", price: Math.round(basePrice * 0.95), url: "#", proposalId: "p2" },
      ],
      savingsVsStandard: 0,
      risks: [],
    },
    optimizedOptions: [],
    standardOption: null,
    _note: "SAMPLE DATA - Replace with real API when approved",
  };
}
