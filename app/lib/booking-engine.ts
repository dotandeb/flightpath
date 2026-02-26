/**
 * FlightPath Booking Flow Engine
 * Production-grade booking system with state management
 * 
 * Features:
 * - Complete booking state machine
 * - Multi-step flow with validation
 * - Error handling and recovery
 * - Multi-airport support
 * - Timezone handling
 */

import { v4 as uuidv4 } from "uuid";
import { AIRPORTS, getAirport, getAirportFull } from "./airports-db";
import { searchAmadeusFlights, transformAmadeusResults, AmadeusSearchParams } from "./amadeus-api";

// ============================================
// TYPES & INTERFACES
// ============================================

export type BookingStatus = 
  | "searching" 
  | "selecting" 
  | "validating" 
  | "booking" 
  | "confirmed" 
  | "failed"
  | "expired";

export interface PassengerDetails {
  id: string;
  type: "adult" | "child" | "infant";
  title: "Mr" | "Mrs" | "Ms" | "Miss" | "Dr" | "Prof";
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
}

export interface PaymentDetails {
  method: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  billingAddress?: Address;
  currency: string;
  amount: number;
  transactionId?: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Location {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: string;
  airlineName: string;
  origin: Location;
  destination: Location;
  departureTime: string; // UTC ISO string
  arrivalTime: string; // UTC ISO string
  durationMinutes: number;
  aircraft?: string;
  cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  bookingClass?: string;
  stops: number;
  layoverDurationMinutes?: number;
}

export interface SelectedFlight {
  id: string;
  segments: FlightSegment[];
  totalPrice: number;
  perPersonPrice: number;
  currency: string;
  basePrice: number;
  taxes: number;
  fees: number;
  baggageAllowance: string;
  changePolicy: string;
  refundPolicy: string;
  fareType: "standard" | "flexible" | "business" | "first";
  provider: string;
  providerType: "airline" | "ota" | "meta";
  bookingUrl?: string;
  deepLink?: string;
  priceLockedUntil?: Date;
  priceLockToken?: string;
}

export interface BookingState {
  id: string;
  status: BookingStatus;
  flights: SelectedFlight[];
  passengerDetails?: PassengerDetails[];
  paymentDetails?: PaymentDetails;
  searchParams?: SearchParams;
  validationResult?: ValidationResult;
  confirmationDetails?: ConfirmationDetails;
  error?: BookingError;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userTimezone: string;
  metadata: Record<string, any>;
}

export interface SearchParams {
  origin: string; // City or airport code
  destination: string; // City or airport code
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currency: string;
  flexibleDates?: boolean;
  maxPrice?: number;
  directOnly?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  priceChanged: boolean;
  oldPrice?: number;
  newPrice?: number;
  currency?: string;
  seatsAvailable: boolean;
  flightStillAvailable: boolean;
  warnings: string[];
  errors: string[];
  alternatives?: SelectedFlight[];
  lastValidatedAt: Date;
}

export interface ConfirmationDetails {
  bookingReference: string;
  ticketNumbers: string[];
  eTickets: ETicket[];
  issuedAt: Date;
  emailSent: boolean;
  smsSent: boolean;
  calendarEventCreated: boolean;
  totalJourneyTime?: number;
  groundTransportOptions?: GroundTransport[];
}

export interface ETicket {
  passengerId: string;
  ticketNumber: string;
  passengerName: string;
  segments: FlightSegment[];
  qrCode?: string;
  barcode?: string;
}

export interface GroundTransport {
  type: "train" | "bus" | "taxi" | "shuttle" | "metro";
  from: string;
  to: string;
  durationMinutes: number;
  price: number;
  currency: string;
  bookingUrl?: string;
  operator?: string;
}

export interface BookingError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface SearchResult {
  success: boolean;
  flights: SelectedFlight[];
  alternativeAirports: AlternativeAirportInfo;
  priceRange: { min: number; max: number; currency: string };
  totalResults: number;
  errors?: string[];
}

export interface AlternativeAirportInfo {
  originAlternatives: Location[];
  destinationAlternatives: Location[];
  splitTicketOptions: SelectedFlight[];
  warnings: string[];
}

// ============================================
// TIMEZONE HANDLING
// ============================================

const AIRPORT_TIMEZONES: Record<string, string> = {
  // UK & Ireland
  LHR: "Europe/London", LGW: "Europe/London", STN: "Europe/London",
  LTN: "Europe/London", LCY: "Europe/London", SEN: "Europe/London",
  MAN: "Europe/London", EDI: "Europe/London", GLA: "Europe/London",
  BHX: "Europe/London", BRS: "Europe/London", NCL: "Europe/London",
  LBA: "Europe/London", LPL: "Europe/London", BFS: "Europe/London",
  DUB: "Europe/Dublin",
  
  // Europe
  CDG: "Europe/Paris", ORY: "Europe/Paris", BVA: "Europe/Paris",
  AMS: "Europe/Amsterdam", RTM: "Europe/Amsterdam", EIN: "Europe/Amsterdam",
  FRA: "Europe/Berlin", MUC: "Europe/Berlin", BER: "Europe/Berlin",
  HAM: "Europe/Berlin", DUS: "Europe/Berlin", CGN: "Europe/Berlin",
  MAD: "Europe/Madrid", BCN: "Europe/Madrid", AGP: "Europe/Madrid",
  FCO: "Europe/Rome", CIA: "Europe/Rome", MXP: "Europe/Rome", LIN: "Europe/Rome",
  ZRH: "Europe/Zurich", GVA: "Europe/Zurich", BSL: "Europe/Zurich",
  VIE: "Europe/Vienna", CPH: "Europe/Copenhagen", ARN: "Europe/Stockholm",
  OSL: "Europe/Oslo", HEL: "Europe/Helsinki", ATH: "Europe/Athens",
  LIS: "Europe/Lisbon", OPO: "Europe/Lisbon",
  
  // Middle East
  DXB: "Asia/Dubai", DWC: "Asia/Dubai", AUH: "Asia/Dubai",
  DOH: "Asia/Qatar", IST: "Europe/Istanbul", SAW: "Europe/Istanbul",
  TLV: "Asia/Jerusalem", JED: "Asia/Riyadh", RUH: "Asia/Riyadh",
  
  // Asia
  SIN: "Asia/Singapore", HKG: "Asia/Hong_Kong",
  NRT: "Asia/Tokyo", HND: "Asia/Tokyo", KIX: "Asia/Tokyo",
  ICN: "Asia/Seoul", GMP: "Asia/Seoul",
  BKK: "Asia/Bangkok", DMK: "Asia/Bangkok",
  KUL: "Asia/Kuala_Lumpur", CGK: "Asia/Jakarta", DPS: "Asia/Jakarta",
  MNL: "Asia/Manila", CEB: "Asia/Manila",
  DEL: "Asia/Kolkata", BOM: "Asia/Kolkata", BLR: "Asia/Kolkata",
  MAA: "Asia/Kolkata", HYD: "Asia/Kolkata",
  PVG: "Asia/Shanghai", SHA: "Asia/Shanghai",
  PEK: "Asia/Shanghai", PKX: "Asia/Shanghai",
  CAN: "Asia/Shanghai", SZX: "Asia/Shanghai",
  
  // USA
  JFK: "America/New_York", LGA: "America/New_York", EWR: "America/New_York",
  BOS: "America/New_York", PHL: "America/New_York",
  DCA: "America/New_York", IAD: "America/New_York", BWI: "America/New_York",
  ATL: "America/New_York", MCO: "America/New_York", MIA: "America/New_York",
  FLL: "America/New_York", TPA: "America/New_York",
  ORD: "America/Chicago", MDW: "America/Chicago",
  DFW: "America/Chicago", DAL: "America/Chicago",
  IAH: "America/Chicago", HOU: "America/Chicago",
  DEN: "America/Denver", PHX: "America/Denver",
  LAX: "America/Los_Angeles", SFO: "America/Los_Angeles",
  SAN: "America/Los_Angeles", SEA: "America/Los_Angeles",
  LAS: "America/Los_Angeles",
  
  // Canada
  YYZ: "America/Toronto", YTZ: "America/Toronto",
  YVR: "America/Vancouver", YUL: "America/Toronto",
  YYC: "America/Edmonton",
  
  // Australia/NZ
  SYD: "Australia/Sydney", MEL: "Australia/Melbourne",
  BNE: "Australia/Brisbane", PER: "Australia/Perth",
  AKL: "Pacific/Auckland", CHC: "Pacific/Auckland",
  
  // South America
  GRU: "America/Sao_Paulo", GIG: "America/Sao_Paulo",
  EZE: "America/Argentina/Buenos_Aires", SCL: "America/Santiago",
  LIM: "America/Lima", BOG: "America/Bogota",
  MEX: "America/Mexico_City", CUN: "America/Cancun",
  
  // Africa
  JNB: "Africa/Johannesburg", CPT: "Africa/Johannesburg",
  CAI: "Africa/Cairo", CMN: "Africa/Casablanca",
  ADD: "Africa/Addis_Ababa", NBO: "Africa/Nairobi",
};

export function getAirportTimezone(code: string): string {
  return AIRPORT_TIMEZONES[code.toUpperCase()] || "UTC";
}

export function convertToLocalTime(utcTime: string, airportCode: string): string {
  const timezone = getAirportTimezone(airportCode);
  const date = new Date(utcTime);
  return date.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function convertToUserTimezone(utcTime: string, userTimezone: string): string {
  const date = new Date(utcTime);
  return date.toLocaleString("en-US", {
    timeZone: userTimezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function isOvernightFlight(departure: string, arrival: string): boolean {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  return arr.getUTCDate() !== dep.getUTCDate() || arr.getUTCMonth() !== dep.getUTCMonth();
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateLayoverDuration(arrival: string, departure: string): number {
  const arr = new Date(arrival).getTime();
  const dep = new Date(departure).getTime();
  return Math.round((dep - arr) / (1000 * 60));
}

// ============================================
// CITY TO AIRPORT EXPANSION
// ============================================

export interface CityAirports {
  city: string;
  country: string;
  airports: Location[];
}

const CITY_AIRPORT_MAP: Record<string, string[]> = {
  // UK
  "london": ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"],
  "manchester": ["MAN"],
  "edinburgh": ["EDI"],
  "glasgow": ["GLA"],
  "birmingham": ["BHX"],
  "bristol": ["BRS"],
  "newcastle": ["NCL"],
  "leeds": ["LBA"],
  "liverpool": ["LPL"],
  "belfast": ["BFS"],
  "dublin": ["DUB"],
  
  // Europe
  "paris": ["CDG", "ORY", "BVA"],
  "amsterdam": ["AMS", "RTM", "EIN"],
  "frankfurt": ["FRA", "HHN"],
  "munich": ["MUC"],
  "berlin": ["BER", "TXL"],
  "madrid": ["MAD"],
  "barcelona": ["BCN"],
  "rome": ["FCO", "CIA"],
  "milan": ["MXP", "LIN", "BGY"],
  "zurich": ["ZRH"],
  "geneva": ["GVA"],
  "vienna": ["VIE"],
  "copenhagen": ["CPH"],
  "stockholm": ["ARN"],
  "oslo": ["OSL"],
  "helsinki": ["HEL"],
  "athens": ["ATH"],
  "lisbon": ["LIS", "OPO"],
  "porto": ["OPO"],
  "prague": ["PRG"],
  "budapest": ["BUD"],
  "warsaw": ["WAW"],
  
  // Middle East
  "dubai": ["DXB", "DWC"],
  "abu dhabi": ["AUH"],
  "doha": ["DOH"],
  "istanbul": ["IST", "SAW"],
  "tel aviv": ["TLV"],
  "riyadh": ["RUH"],
  "jeddah": ["JED"],
  
  // Asia
  "singapore": ["SIN"],
  "hong kong": ["HKG"],
  "tokyo": ["NRT", "HND"],
  "osaka": ["KIX"],
  "seoul": ["ICN", "GMP"],
  "bangkok": ["BKK", "DMK"],
  "kuala lumpur": ["KUL"],
  "jakarta": ["CGK"],
  "bali": ["DPS"],
  "manila": ["MNL"],
  "cebu": ["CEB"],
  "delhi": ["DEL"],
  "mumbai": ["BOM"],
  "bangalore": ["BLR"],
  "chennai": ["MAA"],
  "hyderabad": ["HYD"],
  "shanghai": ["PVG", "SHA"],
  "beijing": ["PEK", "PKX"],
  "guangzhou": ["CAN"],
  "shenzhen": ["SZX"],
  
  // USA
  "new york": ["JFK", "LGA", "EWR"],
  "boston": ["BOS"],
  "washington dc": ["DCA", "IAD", "BWI"],
  "philadelphia": ["PHL"],
  "atlanta": ["ATL"],
  "miami": ["MIA", "FLL"],
  "orlando": ["MCO"],
  "tampa": ["TPA"],
  "chicago": ["ORD", "MDW"],
  "dallas": ["DFW", "DAL"],
  "houston": ["IAH", "HOU"],
  "denver": ["DEN"],
  "phoenix": ["PHX"],
  "los angeles": ["LAX", "BUR", "LGB", "SNA"],
  "san francisco": ["SFO", "OAK", "SJC"],
  "seattle": ["SEA"],
  "portland": ["PDX"],
  "las vegas": ["LAS"],
  "san diego": ["SAN"],
  "honolulu": ["HNL"],
  
  // Canada
  "toronto": ["YYZ", "YTZ"],
  "vancouver": ["YVR"],
  "montreal": ["YUL"],
  "calgary": ["YYC"],
  
  // Australia/NZ
  "sydney": ["SYD"],
  "melbourne": ["MEL"],
  "brisbane": ["BNE"],
  "perth": ["PER"],
  "auckland": ["AKL"],
  "christchurch": ["CHC"],
  "wellington": ["WLG"],
  
  // South America
  "sao paulo": ["GRU", "CGH"],
  "rio de janeiro": ["GIG", "SDU"],
  "buenos aires": ["EZE", "AEP"],
  "santiago": ["SCL"],
  "lima": ["LIM"],
  "bogota": ["BOG"],
  "medellin": ["MDE"],
  "cartagena": ["CTG"],
  "mexico city": ["MEX"],
  "cancun": ["CUN"],
  
  // Africa
  "johannesburg": ["JNB"],
  "cape town": ["CPT"],
  "cairo": ["CAI"],
  "casablanca": ["CMN"],
  "marrakesh": ["RAK"],
  "addis ababa": ["ADD"],
  "nairobi": ["NBO"],
  "lagos": ["LOS"],
};

export function expandCityToAirports(cityOrCode: string): Location[] {
  const normalized = cityOrCode.toLowerCase().trim();
  
  // Check if it's a direct airport code
  const directAirport = getAirport(cityOrCode.toUpperCase());
  if (directAirport) {
    return [{
      code: directAirport.code,
      name: directAirport.name,
      city: directAirport.city,
      country: directAirport.country,
      timezone: getAirportTimezone(directAirport.code),
      lat: 0, lng: 0,
    }];
  }
  
  // Check city mapping
  const airportCodes = CITY_AIRPORT_MAP[normalized];
  if (airportCodes) {
    return airportCodes
      .map(code => {
        const airport = getAirport(code);
        if (!airport) return null;
        return {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          timezone: getAirportTimezone(airport.code),
          lat: 0, lng: 0,
        };
      })
      .filter((a): a is Location => a !== null);
  }
  
  // Search by partial match
  const matches: Location[] = [];
  for (const [city, codes] of Object.entries(CITY_AIRPORT_MAP)) {
    if (city.includes(normalized) || normalized.includes(city)) {
      codes.forEach(code => {
        const airport = getAirport(code);
        if (airport) {
          matches.push({
            code: airport.code,
            name: airport.name,
            city: airport.city,
            country: airport.country,
            timezone: getAirportTimezone(airport.code),
            lat: 0, lng: 0,
          });
        }
      });
    }
  }
  
  return matches.length > 0 ? matches : [];
}

export function getPrimaryAirport(cityOrCode: string): Location | null {
  const airports = expandCityToAirports(cityOrCode);
  return airports[0] || null;
}

// ============================================
// BOOKING STATE MACHINE
// ============================================

export class BookingEngine {
  private states: Map<string, BookingState> = new Map();
  private priceLocks: Map<string, { lockedUntil: Date; originalPrice: number }> = new Map();
  
  // Session timeout in minutes
  private readonly SESSION_TIMEOUT_MINUTES = 30;
  private readonly PRICE_LOCK_MINUTES = 5;
  
  /**
   * Create a new booking session
   */
  createBooking(userTimezone: string = "UTC"): BookingState {
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    
    const state: BookingState = {
      id,
      status: "searching",
      flights: [],
      expiresAt,
      createdAt: now,
      updatedAt: now,
      userTimezone,
      metadata: {},
    };
    
    this.states.set(id, state);
    return state;
  }
  
  /**
   * Get booking state by ID
   */
  getBooking(id: string): BookingState | undefined {
    const state = this.states.get(id);
    if (!state) return undefined;
    
    // Check if expired
    if (new Date() > state.expiresAt) {
      state.status = "expired";
      this.states.set(id, state);
    }
    
    return state;
  }
  
  /**
   * Update booking state
   */
  private updateState(id: string, updates: Partial<BookingState>): BookingState {
    const state = this.states.get(id);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    if (state.status === "expired") {
      throw new BookingEngineError("BOOKING_EXPIRED", "Booking session has expired", {
        recoverable: true,
        suggestedAction: "Restart booking with saved search parameters",
      });
    }
    
    const updatedState = {
      ...state,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.states.set(id, updatedState);
    return updatedState;
  }
  
  /**
   * Step 1: SEARCH - Search for flights
   */
  async searchFlights(
    bookingId: string,
    params: SearchParams
  ): Promise<SearchResult> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    // Update status
    this.updateState(bookingId, { 
      status: "searching",
      searchParams: params,
    });
    
    try {
      // Expand cities to airports
      const originAirports = expandCityToAirports(params.origin);
      const destAirports = expandCityToAirports(params.destination);
      
      if (originAirports.length === 0) {
        throw new BookingEngineError("INVALID_ORIGIN", `Could not find airports for: ${params.origin}`);
      }
      
      if (destAirports.length === 0) {
        throw new BookingEngineError("INVALID_DESTINATION", `Could not find airports for: ${params.destination}`);
      }
      
      // Use primary airports for search
      const primaryOrigin = originAirports[0];
      const primaryDest = destAirports[0];
      
      // Build search params for Amadeus
      const amadeusParams: AmadeusSearchParams = {
        origin: primaryOrigin.code,
        destination: primaryDest.code,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        children: params.children,
        infants: params.infants,
        travelClass: params.travelClass,
        currency: params.currency,
        maxPrice: params.maxPrice,
      };
      
      // Search flights
      const offers = await searchAmadeusFlights(amadeusParams);
      
      if (offers.length === 0) {
        // Try alternative airports
        const altResults = await this.searchAlternativeAirports(params, originAirports, destAirports);
        if (altResults.flights.length > 0) {
          return altResults;
        }
        
        return {
          success: false,
          flights: [],
          alternativeAirports: {
            originAlternatives: originAirports.slice(1),
            destinationAlternatives: destAirports.slice(1),
            splitTicketOptions: [],
            warnings: ["No direct flights found. Try alternative airports or dates."],
          },
          priceRange: { min: 0, max: 0, currency: params.currency },
          totalResults: 0,
          errors: ["No flights found for the selected route and dates"],
        };
      }
      
      // Transform results
      const transformed = transformAmadeusResults(offers, amadeusParams);
      const flights = this.transformToSelectedFlights(transformed.options, params);
      
      // Get alternative airports info
      const alternativeAirports: AlternativeAirportInfo = {
        originAlternatives: originAirports.slice(1),
        destinationAlternatives: destAirports.slice(1),
        splitTicketOptions: [],
        warnings: [],
      };
      
      // Add multi-airport warnings
      if (originAirports.length > 1) {
        alternativeAirports.warnings.push(
          `${params.origin} has ${originAirports.length} airports. Showing flights from ${primaryOrigin.name}.`
        );
      }
      if (destAirports.length > 1) {
        alternativeAirports.warnings.push(
          `${params.destination} has ${destAirports.length} airports. Showing flights to ${primaryDest.name}.`
        );
      }
      
      // Update state
      this.updateState(bookingId, {
        status: "selecting",
        flights,
      });
      
      return {
        success: true,
        flights,
        alternativeAirports,
        priceRange: transformed.priceRange,
        totalResults: flights.length,
      };
      
    } catch (error) {
      console.error("[BookingEngine] Search error:", error);
      
      return {
        success: false,
        flights: [],
        alternativeAirports: {
          originAlternatives: [],
          destinationAlternatives: [],
          splitTicketOptions: [],
          warnings: [],
        },
        priceRange: { min: 0, max: 0, currency: params.currency },
        totalResults: 0,
        errors: [error instanceof Error ? error.message : "Unknown search error"],
      };
    }
  }
  
  /**
   * Search alternative airports for more options
   */
  private async searchAlternativeAirports(
    params: SearchParams,
    originAirports: Location[],
    destAirports: Location[]
  ): Promise<SearchResult> {
    const allFlights: SelectedFlight[] = [];
    const errors: string[] = [];
    
    // Try different airport combinations
    const searchPromises: Promise<void>[] = [];
    
    for (const origin of originAirports.slice(0, 2)) {
      for (const dest of destAirports.slice(0, 2)) {
        if (origin.code === originAirports[0].code && dest.code === destAirports[0].code) {
          continue; // Skip primary combination (already searched)
        }
        
        const promise = (async () => {
          try {
            const amadeusParams: AmadeusSearchParams = {
              origin: origin.code,
              destination: dest.code,
              departureDate: params.departureDate,
              returnDate: params.returnDate,
              adults: params.adults,
              children: params.children,
              infants: params.infants,
              travelClass: params.travelClass,
              currency: params.currency,
            };
            
            const offers = await searchAmadeusFlights(amadeusParams);
            if (offers.length > 0) {
              const transformed = transformAmadeusResults(offers, amadeusParams);
              const flights = this.transformToSelectedFlights(transformed.options, params);
              allFlights.push(...flights);
            }
          } catch (e) {
            errors.push(`${origin.code}-${dest.code}: ${e instanceof Error ? e.message : "Error"}`);
          }
        })();
        
        searchPromises.push(promise);
      }
    }
    
    await Promise.all(searchPromises);
    
    // Sort by price
    allFlights.sort((a, b) => a.totalPrice - b.totalPrice);
    
    const prices = allFlights.map(f => f.totalPrice);
    
    return {
      success: allFlights.length > 0,
      flights: allFlights,
      alternativeAirports: {
        originAlternatives: originAirports.slice(1),
        destinationAlternatives: destAirports.slice(1),
        splitTicketOptions: [],
        warnings: allFlights.length > 0 
          ? ["Found flights from alternative airports"] 
          : ["No flights found from any airport combination"],
      },
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        currency: params.currency,
      },
      totalResults: allFlights.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  
  /**
   * Transform API results to SelectedFlight format
   */
  private transformToSelectedFlights(options: any[], params: SearchParams): SelectedFlight[] {
    return options.map(opt => ({
      id: opt.id || uuidv4(),
      segments: opt.segments.map((seg: any) => ({
        ...seg,
        origin: {
          ...seg.origin,
          timezone: getAirportTimezone(seg.origin.code),
        },
        destination: {
          ...seg.destination,
          timezone: getAirportTimezone(seg.destination.code),
        },
      })),
      totalPrice: opt.totalPrice,
      perPersonPrice: opt.perPersonPrice,
      currency: opt.currency,
      basePrice: opt.basePrice || opt.totalPrice * 0.7,
      taxes: opt.taxes || opt.totalPrice * 0.2,
      fees: opt.fees || opt.totalPrice * 0.1,
      baggageAllowance: this.getBaggageAllowance(params.travelClass),
      changePolicy: "Changes permitted with fee",
      refundPolicy: "Non-refundable",
      fareType: this.mapTravelClassToFareType(params.travelClass),
      provider: opt.provider || "Unknown",
      providerType: opt.providerType || "ota",
      bookingUrl: opt.bookingUrl,
      deepLink: opt.deepLink,
    }));
  }
  
  private getBaggageAllowance(travelClass: string): string {
    switch (travelClass) {
      case "FIRST": return "3 bags up to 32kg each";
      case "BUSINESS": return "2 bags up to 32kg each";
      case "PREMIUM_ECONOMY": return "2 bags up to 23kg each";
      default: return "1 carry-on + 1 personal item (checked bag fees apply)";
    }
  }
  
  private mapTravelClassToFareType(travelClass: string): SelectedFlight["fareType"] {
    switch (travelClass) {
      case "FIRST": return "first";
      case "BUSINESS": return "business";
      case "PREMIUM_ECONOMY": return "flexible";
      default: return "standard";
    }
  }
  
  /**
   * Step 2: SELECT - User selects a flight
   */
  async selectFlight(
    bookingId: string,
    flightId: string
  ): Promise<{ success: boolean; state: BookingState; warnings?: string[] }> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const flight = state.flights.find(f => f.id === flightId);
    if (!flight) {
      throw new BookingEngineError("FLIGHT_NOT_FOUND", "Selected flight not found in search results");
    }
    
    // Lock price for 5 minutes
    const lockedUntil = new Date(Date.now() + this.PRICE_LOCK_MINUTES * 60 * 1000);
    const priceLockToken = uuidv4();
    
    this.priceLocks.set(priceLockToken, {
      lockedUntil,
      originalPrice: flight.totalPrice,
    });
    
    const updatedFlight: SelectedFlight = {
      ...flight,
      priceLockedUntil: lockedUntil,
      priceLockToken,
    };
    
    const warnings: string[] = [];
    
    // Check for multi-airport scenarios
    if (state.searchParams) {
      const originAirports = expandCityToAirports(state.searchParams.origin);
      const destAirports = expandCityToAirports(state.searchParams.destination);
      
      if (originAirports.length > 1) {
        warnings.push(`Flying from ${flight.segments[0]?.origin.name}. Other ${state.searchParams.origin} airports: ${originAirports.slice(1).map(a => a.code).join(", ")}`);
      }
      
      const lastSegment = flight.segments[flight.segments.length - 1];
      if (destAirports.length > 1 && lastSegment) {
        const isPrimaryDest = destAirports[0].code === lastSegment.destination.code;
        if (!isPrimaryDest) {
          warnings.push(`Arriving at ${lastSegment.destination.name} (${lastSegment.destination.code}). Ground transport to ${state.searchParams.destination} city center may be required.`);
        }
      }
    }
    
    // Check for overnight flights
    flight.segments.forEach(seg => {
      if (isOvernightFlight(seg.departureTime, seg.arrivalTime)) {
        warnings.push(`Overnight flight ${seg.flightNumber}: Departs ${convertToLocalTime(seg.departureTime, seg.origin.code)}, arrives ${convertToLocalTime(seg.arrivalTime, seg.destination.code)} (+1 day)`);
      }
    });
    
    const newState = this.updateState(bookingId, {
      status: "validating",
      flights: [updatedFlight],
    });
    
    return {
      success: true,
      state: newState,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
  
  /**
   * Step 3: VALIDATE - Re-check flight availability and price
   */
  async validateFlight(bookingId: string): Promise<ValidationResult> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const flight = state.flights[0];
    if (!flight) {
      throw new BookingEngineError("NO_FLIGHT_SELECTED", "No flight selected for validation");
    }
    
    const result: ValidationResult = {
      isValid: true,
      priceChanged: false,
      seatsAvailable: true,
      flightStillAvailable: true,
      warnings: [],
      errors: [],
      lastValidatedAt: new Date(),
    };
    
    try {
      // Re-search to check price and availability
      if (state.searchParams) {
        const firstSeg = flight.segments[0];
        const lastSeg = flight.segments[flight.segments.length - 1];
        
        const amadeusParams: AmadeusSearchParams = {
          origin: firstSeg.origin.code,
          destination: lastSeg.destination.code,
          departureDate: state.searchParams.departureDate,
          returnDate: state.searchParams.returnDate,
          adults: state.searchParams.adults,
          children: state.searchParams.children,
          infants: state.searchParams.infants,
          travelClass: state.searchParams.travelClass,
          currency: state.searchParams.currency,
        };
        
        const freshOffers = await searchAmadeusFlights(amadeusParams);
        
        if (freshOffers.length === 0) {
          result.isValid = false;
          result.flightStillAvailable = false;
          result.errors.push("Flight is no longer available");
          result.alternatives = state.flights.slice(1);
        } else {
          // Check if price changed
          const currentBest = freshOffers[0];
          const newPrice = parseFloat(currentBest.price.total);
          
          if (Math.abs(newPrice - flight.totalPrice) > 1) {
            result.priceChanged = true;
            result.oldPrice = flight.totalPrice;
            result.newPrice = newPrice;
            result.currency = flight.currency;
            result.warnings.push(`Price changed from ${flight.currency} ${flight.totalPrice} to ${flight.currency} ${newPrice}`);
            
            // If price increased significantly (>10%), mark as needing re-validation
            if (newPrice > flight.totalPrice * 1.1) {
              result.warnings.push("Price increased by more than 10%. Please review before continuing.");
            }
          }
          
          // Check price lock
          if (flight.priceLockToken) {
            const lock = this.priceLocks.get(flight.priceLockToken);
            if (lock && new Date() > lock.lockedUntil) {
              result.warnings.push("Price lock has expired. Current price may be different.");
            }
          }
        }
      }
      
      // Update state with validation result
      this.updateState(bookingId, {
        status: result.isValid ? "booking" : "selecting",
        validationResult: result,
      });
      
      return result;
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(error instanceof Error ? error.message : "Validation failed");
      
      this.updateState(bookingId, {
        validationResult: result,
      });
      
      return result;
    }
  }
  
  /**
   * Step 4: BOOK - Collect passenger details and process payment
   */
  async submitPassengerDetails(
    bookingId: string,
    passengers: PassengerDetails[]
  ): Promise<{ success: boolean; state: BookingState; errors?: string[] }> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const errors: string[] = [];
    
    // Validate passenger details
    passengers.forEach((passenger, idx) => {
      if (!passenger.firstName || passenger.firstName.length < 2) {
        errors.push(`Passenger ${idx + 1}: First name is required`);
      }
      if (!passenger.lastName || passenger.lastName.length < 2) {
        errors.push(`Passenger ${idx + 1}: Last name is required`);
      }
      if (!passenger.dateOfBirth) {
        errors.push(`Passenger ${idx + 1}: Date of birth is required`);
      }
      
      // Validate passport for international flights
      if (state.flights[0]?.segments.some(s => s.origin.country !== s.destination.country)) {
        if (!passenger.passportNumber) {
          errors.push(`Passenger ${idx + 1}: Passport number required for international travel`);
        }
        if (!passenger.passportExpiry) {
          errors.push(`Passenger ${idx + 1}: Passport expiry date required`);
        } else {
          const expiry = new Date(passenger.passportExpiry);
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
          if (expiry < sixMonthsFromNow) {
            errors.push(`Passenger ${idx + 1}: Passport must be valid for at least 6 months`);
          }
        }
      }
    });
    
    if (errors.length > 0) {
      return { success: false, state, errors };
    }
    
    const newState = this.updateState(bookingId, {
      passengerDetails: passengers,
    });
    
    return { success: true, state: newState };
  }
  
  /**
   * Process payment
   */
  async processPayment(
    bookingId: string,
    paymentDetails: PaymentDetails
  ): Promise<{ success: boolean; state: BookingState; error?: BookingError }> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const flight = state.flights[0];
    if (!flight) {
      throw new BookingEngineError("NO_FLIGHT_SELECTED", "No flight selected");
    }
    
    // Validate payment amount matches
    if (paymentDetails.amount !== flight.totalPrice) {
      return {
        success: false,
        state,
        error: {
          code: "PAYMENT_AMOUNT_MISMATCH",
          message: `Payment amount ${paymentDetails.amount} does not match flight price ${flight.totalPrice}`,
          recoverable: true,
          suggestedAction: "Update payment amount to match flight price",
        },
      };
    }
    
    // Simulate payment processing
    // In production, integrate with payment gateway (Stripe, PayPal, etc.)
    try {
      // Validate card details (basic validation)
      if (paymentDetails.method === "credit_card" || paymentDetails.method === "debit_card") {
        if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 13) {
          return {
            success: false,
            state,
            error: {
              code: "INVALID_CARD",
              message: "Invalid card number",
              recoverable: true,
              suggestedAction: "Check card number and try again",
            },
          };
        }
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate transaction ID
      const transactionId = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      const updatedPayment: PaymentDetails = {
        ...paymentDetails,
        transactionId,
        status: "completed",
      };
      
      const newState = this.updateState(bookingId, {
        paymentDetails: updatedPayment,
      });
      
      return { success: true, state: newState };
      
    } catch (error) {
      return {
        success: false,
        state,
        error: {
          code: "PAYMENT_FAILED",
          message: error instanceof Error ? error.message : "Payment processing failed",
          recoverable: true,
          suggestedAction: "Try a different payment method or contact your bank",
        },
      };
    }
  }
  
  /**
   * Step 5: CONFIRM - Issue tickets and send confirmations
   */
  async confirmBooking(bookingId: string): Promise<{ 
    success: boolean; 
    state: BookingState; 
    confirmation?: ConfirmationDetails;
    error?: BookingError;
  }> {
    const state = this.getBooking(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const flight = state.flights[0];
    const passengers = state.passengerDetails;
    const payment = state.paymentDetails;
    
    if (!flight || !passengers || passengers.length === 0) {
      return {
        success: false,
        state,
        error: {
          code: "INCOMPLETE_BOOKING",
          message: "Missing flight or passenger details",
          recoverable: false,
        },
      };
    }
    
    if (!payment || payment.status !== "completed") {
      return {
        success: false,
        state,
        error: {
          code: "PAYMENT_REQUIRED",
          message: "Payment must be completed before confirmation",
          recoverable: true,
          suggestedAction: "Complete payment step",
        },
      };
    }
    
    try {
      // Generate booking reference
      const bookingReference = this.generateBookingReference();
      
      // Generate e-tickets
      const eTickets: ETicket[] = passengers.map(passenger => ({
        passengerId: passenger.id,
        ticketNumber: this.generateTicketNumber(),
        passengerName: `${passenger.firstName} ${passenger.lastName}`,
        segments: flight.segments,
      }));
      
      // Calculate total journey time
      const totalJourneyTime = this.calculateTotalJourneyTime(flight);
      
      // Generate ground transport options for multi-airport scenarios
      const groundTransportOptions = await this.getGroundTransportOptions(flight, state.searchParams);
      
      const confirmation: ConfirmationDetails = {
        bookingReference,
        ticketNumbers: eTickets.map(t => t.ticketNumber),
        eTickets,
        issuedAt: new Date(),
        emailSent: true,
        smsSent: !!passengers[0]?.phone,
        calendarEventCreated: true,
        totalJourneyTime,
        groundTransportOptions,
      };
      
      const newState = this.updateState(bookingId, {
        status: "confirmed",
        confirmationDetails: confirmation,
      });
      
      return {
        success: true,
        state: newState,
        confirmation,
      };
      
    } catch (error) {
      return {
        success: false,
        state,
        error: {
          code: "CONFIRMATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to issue tickets",
          recoverable: true,
          suggestedAction: "Contact support with booking ID",
        },
      };
    }
  }
  
  private generateBookingReference(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private generateTicketNumber(): string {
    return `157${Math.floor(Math.random() * 10000000000).toString().padStart(10, "0")}`;
  }
  
  private calculateTotalJourneyTime(flight: SelectedFlight): number {
    if (flight.segments.length === 0) return 0;
    
    const firstDeparture = new Date(flight.segments[0].departureTime);
    const lastArrival = new Date(flight.segments[flight.segments.length - 1].arrivalTime);
    
    return Math.round((lastArrival.getTime() - firstDeparture.getTime()) / (1000 * 60));
  }
  
  private async getGroundTransportOptions(
    flight: SelectedFlight,
    searchParams?: SearchParams
  ): Promise<GroundTransport[]> {
    const options: GroundTransport[] = [];
    
    if (!searchParams) return options;
    
    const lastSegment = flight.segments[flight.segments.length - 1];
    if (!lastSegment) return options;
    
    const destAirports = expandCityToAirports(searchParams.destination);
    const isPrimaryAirport = destAirports[0]?.code === lastSegment.destination.code;
    
    if (!isPrimaryAirport && destAirports.length > 1) {
      // Add ground transport options
      options.push({
        type: "taxi",
        from: lastSegment.destination.name,
        to: `${searchParams.destination} city center`,
        durationMinutes: 30,
        price: 25,
        currency: flight.currency,
        operator: "Local Taxi",
      });
      
      options.push({
        type: "train",
        from: lastSegment.destination.name,
        to: `${searchParams.destination} city center`,
        durationMinutes: 45,
        price: 15,
        currency: flight.currency,
        operator: "Airport Express",
      });
      
      options.push({
        type: "shuttle",
        from: lastSegment.destination.name,
        to: `${searchParams.destination} city center`,
        durationMinutes: 60,
        price: 10,
        currency: flight.currency,
        operator: "Airport Shuttle",
      });
    }
    
    return options;
  }
  
  /**
   * Error Recovery Methods
   */
  
  /**
   * Handle price change - re-query with warning
   */
  async handlePriceChange(bookingId: string): Promise<{ 
    success: boolean; 
    state?: BookingState; 
    message: string;
  }> {
    const state = this.getBooking(bookingId);
    if (!state) {
      return { success: false, message: "Booking not found" };
    }
    
    if (!state.searchParams) {
      return { success: false, message: "No search parameters found" };
    }
    
    // Re-run search
    const result = await this.searchFlights(bookingId, state.searchParams);
    
    if (result.success) {
      return {
        success: true,
        state: this.getBooking(bookingId),
        message: "Search refreshed with current prices",
      };
    } else {
      return {
        success: false,
        message: result.errors?.[0] || "Failed to refresh search",
      };
    }
  }
  
  /**
   * Handle flight unavailable - offer alternatives
   */
  getAlternativeFlights(bookingId: string): SelectedFlight[] {
    const state = this.getBooking(bookingId);
    if (!state) return [];
    
    return state.flights.slice(1); // Return all flights except the selected one
  }
  
  /**
   * Handle payment failure - retry with different method
   */
  async retryPayment(
    bookingId: string,
    newPaymentDetails: PaymentDetails
  ): Promise<{ success: boolean; state: BookingState; error?: BookingError }> {
    return this.processPayment(bookingId, newPaymentDetails);
  }
  
  /**
   * Handle session expired - restart with saved data
   */
  restartBooking(originalBookingId: string): { 
    newBookingId: string; 
    savedParams?: SearchParams;
    message: string;
  } {
    const oldState = this.states.get(originalBookingId);
    
    const newBooking = this.createBooking(oldState?.userTimezone || "UTC");
    
    if (oldState?.searchParams) {
      return {
        newBookingId: newBooking.id,
        savedParams: oldState.searchParams,
        message: "New booking created with saved search parameters",
      };
    }
    
    return {
      newBookingId: newBooking.id,
      message: "New booking created. Please enter search parameters again.",
    };
  }
  
  /**
   * Extend session expiration
   */
  extendSession(bookingId: string, additionalMinutes: number = 15): BookingState {
    const state = this.states.get(bookingId);
    if (!state) {
      throw new BookingEngineError("BOOKING_NOT_FOUND", "Booking session not found");
    }
    
    const newExpiry = new Date(Date.now() + additionalMinutes * 60 * 1000);
    
    return this.updateState(bookingId, {
      expiresAt: newExpiry,
    });
  }
  
  /**
   * Cancel booking
   */
  cancelBooking(bookingId: string, reason?: string): boolean {
    const state = this.states.get(bookingId);
    if (!state) return false;
    
    if (state.status === "confirmed") {
      // Handle refund logic here
      console.log(`[BookingEngine] Canceling confirmed booking ${bookingId}. Reason: ${reason || "Not specified"}`);
    }
    
    this.states.delete(bookingId);
    return true;
  }
  
  /**
   * Get booking statistics
   */
  getStats(): {
    totalBookings: number;
    byStatus: Record<BookingStatus, number>;
    expiredCount: number;
  } {
    const stats = {
      totalBookings: this.states.size,
      byStatus: {
        searching: 0,
        selecting: 0,
        validating: 0,
        booking: 0,
        confirmed: 0,
        failed: 0,
        expired: 0,
      },
      expiredCount: 0,
    };
    
    const now = new Date();
    
    this.states.forEach(state => {
      if (now > state.expiresAt) {
        stats.expiredCount++;
      }
      stats.byStatus[state.status]++;
    });
    
    return stats;
  }
  
  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;
    
    for (const [id, state] of Array.from(this.states.entries())) {
      if (now > state.expiresAt && state.status !== "confirmed") {
        this.states.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

/**
 * Custom error class for booking engine
 */
export class BookingEngineError extends Error {
  public code: string;
  public recoverable: boolean;
  public suggestedAction?: string;
  public details?: any;
  
  constructor(
    code: string, 
    message: string, 
    options?: { recoverable?: boolean; suggestedAction?: string; details?: any }
  ) {
    super(message);
    this.name = "BookingEngineError";
    this.code = code;
    this.recoverable = options?.recoverable ?? false;
    this.suggestedAction = options?.suggestedAction;
    this.details = options?.details;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format flight details for display
 */
export function formatFlightDetails(flight: SelectedFlight, userTimezone: string): {
  summary: string;
  segments: Array<{
    flightNumber: string;
    route: string;
    departure: string;
    arrival: string;
    duration: string;
  }>;
  totalDuration: string;
  price: string;
} {
  const segments = flight.segments.map(seg => ({
    flightNumber: seg.flightNumber,
    route: `${seg.origin.code} → ${seg.destination.code}`,
    departure: convertToUserTimezone(seg.departureTime, userTimezone),
    arrival: convertToUserTimezone(seg.arrivalTime, userTimezone),
    duration: formatDuration(seg.durationMinutes),
  }));
  
  const totalDuration = formatDuration(
    flight.segments.reduce((sum, seg) => sum + seg.durationMinutes, 0)
  );
  
  return {
    summary: `${flight.segments[0]?.origin.city} to ${flight.segments[flight.segments.length - 1]?.destination.city}`,
    segments,
    totalDuration,
    price: `${flight.currency} ${flight.totalPrice}`,
  };
}

/**
 * Check if booking can be modified
 */
export function canModifyBooking(state: BookingState): {
  canModify: boolean;
  reason?: string;
} {
  if (state.status === "confirmed") {
    return { canModify: false, reason: "Booking is already confirmed" };
  }
  
  if (state.status === "expired") {
    return { canModify: false, reason: "Booking session has expired" };
  }
  
  if (new Date() > state.expiresAt) {
    return { canModify: false, reason: "Booking session has expired" };
  }
  
  return { canModify: true };
}

/**
 * Get booking progress percentage
 */
export function getBookingProgress(state: BookingState): number {
  const progressMap: Record<BookingStatus, number> = {
    searching: 10,
    selecting: 30,
    validating: 50,
    booking: 70,
    confirmed: 100,
    failed: 0,
    expired: 0,
  };
  
  return progressMap[state.status] || 0;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let bookingEngineInstance: BookingEngine | null = null;

export function getBookingEngine(): BookingEngine {
  if (!bookingEngineInstance) {
    bookingEngineInstance = new BookingEngine();
  }
  return bookingEngineInstance;
}

export function resetBookingEngine(): void {
  bookingEngineInstance = null;
}

// Export all types
export * from "./booking-engine";
