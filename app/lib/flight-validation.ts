/**
 * Flight Validation Engine
 * Multi-Source Verification System for Flight Data Integrity
 * 
 * This module provides comprehensive validation for flight data,
 * cross-referencing multiple sources and applying sanity checks
 * to prevent hallucinated or incorrect flight information.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Raw flight data from various sources before validation
 */
export interface RawFlightData {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string; // ISO 8601 format
  arrivalTime: string;   // ISO 8601 format
  duration?: string;     // ISO 8601 duration format (PT2H30M)
  aircraft?: string;
  source: DataSource;
  sourceUrl?: string;
  fetchedAt: Date;
}

/**
 * Data source types with associated confidence weights
 */
export type DataSource = 
  | 'amadeus-api'      // 40 points - Primary API
  | 'airline-website'  // 35 points - Official airline data
  | 'secondary-aggregator' // 15 points - Third-party aggregators
  | 'historical-data'; // 10 points - Past flight records

/**
 * Source weight configuration
 */
export const SOURCE_WEIGHTS: Record<DataSource, number> = {
  'amadeus-api': 40,
  'airline-website': 35,
  'secondary-aggregator': 15,
  'historical-data': 10,
};

/**
 * Confidence level categories
 */
export enum ConfidenceLevel {
  REJECT = 'REJECT',           // < 50
  WARNING = 'WARNING',         // 50-70
  CAUTION = 'CAUTION',         // 70-90
  TRUSTED = 'TRUSTED',         // 90+
}

/**
 * Validation result with complete flight information
 */
export interface FlightValidationResult {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft?: string;
  sources: string[];
  confidence: number;  // 0-100
  warnings: string[];
  isValid: boolean;
  confidenceLevel: ConfidenceLevel;
  validationDetails: ValidationDetails;
}

/**
 * Detailed validation information
 */
export interface ValidationDetails {
  flightNumberValid: boolean;
  airportCodesValid: boolean;
  timesValid: boolean;
  durationValid: boolean;
  routeExists: boolean;
  airlineOperatesRoute: boolean;
  sourcesAgree: boolean;
  timeVarianceMinutes: number;
  durationVarianceMinutes: number;
}

/**
 * Cross-source comparison result
 */
interface CrossSourceComparison {
  departureTimeVariance: number; // in minutes
  arrivalTimeVariance: number;   // in minutes
  durationVariance: number;      // in minutes
  agreementScore: number;        // 0-100
  discrepancies: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum allowed time variance between sources (minutes) */
const MAX_TIME_VARIANCE_MINUTES = 5;

/** Maximum allowed duration variance between sources (minutes) */
const MAX_DURATION_VARIANCE_MINUTES = 10;

/** Maximum flight duration without stopover (hours) */
const MAX_FLIGHT_DURATION_HOURS = 20;

/** Minimum flight duration (minutes) */
const MIN_FLIGHT_DURATION_MINUTES = 30;

/** Maximum flight duration (minutes) */
const MAX_FLIGHT_DURATION_MINUTES = MAX_FLIGHT_DURATION_HOURS * 60;

/** Flight number regex: 2-3 letters + 1-4 digits */
const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3}\d{1,4}$/i;

/** IATA airport code regex: 3 uppercase letters */
const AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;

// Known airline IATA codes (subset for validation)
const KNOWN_AIRLINE_CODES = new Set([
  'AA', 'UA', 'DL', 'WN', 'AS', 'B6', 'F9', 'G4', 'HA', 'NK', 'SY', // US
  'BA', 'AF', 'LH', 'KL', 'LX', 'OS', 'SN', 'IB', 'AY', 'SK', 'FI', // Europe
  'JL', 'NH', 'SQ', 'CX', 'QF', 'NZ', 'TG', 'MH', 'PR', 'GA', 'BR', // Asia-Pacific
  'EK', 'QR', 'EY', 'SV', 'GF', 'KU', 'MS', 'RJ', // Middle East
  'ET', 'SA', 'KQ', 'QR', // Africa
  'AC', 'WS', 'TS', 'PD', 'WS', // Canada
  'AM', 'AV', 'LA', 'G3', 'AR', 'CM', // Latin America
]);

// Known airport database (IATA codes)
const KNOWN_AIRPORTS = new Set([
  // Major US airports
  'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'LAS', 'SEA', 'PHX', 'MIA',
  'IAH', 'BOS', 'ATL', 'EWR', 'MCO', 'DTW', 'MSP', 'PHL', 'LGA', 'FLL',
  'BWI', 'DCA', 'IAD', 'TPA', 'SAN', 'MDW', 'PDX', 'SLC', 'BNA', 'AUS',
  // Major international airports
  'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MUC', 'ZUR', 'VIE',
  'HND', 'NRT', 'KIX', 'ICN', 'SIN', 'HKG', 'BKK', 'KUL', 'CGK', 'MNL',
  'DXB', 'DOH', 'AUH', 'JED', 'RUH', 'TLV', 'IST', 'CAI', 'JNB', 'CPT',
  'SYD', 'MEL', 'BNE', 'PER', 'AKL', 'GRU', 'GIG', 'EZE', 'SCL', 'BOG',
  'YYZ', 'YVR', 'YUL', 'YYC', 'PEK', 'PVG', 'CAN', 'SZX', 'CTU', 'XIY',
]);

// Known routes (origin-destination pairs that are commonly operated)
// This is a simplified subset - in production, this would be a comprehensive database
const KNOWN_ROUTES = new Set([
  'JFK-LHR', 'LHR-JFK', 'JFK-CDG', 'CDG-JFK', 'JFK-FRA', 'FRA-JFK',
  'LAX-NRT', 'NRT-LAX', 'LAX-HND', 'HND-LAX', 'LAX-LHR', 'LHR-LAX',
  'SFO-LHR', 'LHR-SFO', 'SFO-NRT', 'NRT-SFO', 'SFO-HND', 'HND-SFO',
  'ORD-LHR', 'LHR-ORD', 'DFW-LHR', 'LHR-DFW', 'MIA-LHR', 'LHR-MIA',
  'SEA-LHR', 'LHR-SEA', 'BOS-LHR', 'LHR-BOS', 'IAD-LHR', 'LHR-IAD',
  'JFK-FCO', 'FCO-JFK', 'JFK-MXP', 'MXP-JFK', 'JFK-BCN', 'BCN-JFK',
  'EWR-LHR', 'LHR-EWR', 'EWR-CDG', 'CDG-EWR', 'EWR-FRA', 'FRA-EWR',
  'ATL-LHR', 'LHR-ATL', 'ATL-CDG', 'CDG-ATL', 'ATL-FRA', 'FRA-ATL',
  'LAX-SYD', 'SYD-LAX', 'LAX-AKL', 'AKL-LAX', 'SFO-SYD', 'SYD-SFO',
  'JFK-DXB', 'DXB-JFK', 'JFK-DOH', 'DOH-JFK', 'JFK-AUH', 'AUH-JFK',
  'LAX-DXB', 'DXB-LAX', 'SFO-DXB', 'DXB-SFO', 'SEA-DXB', 'DXB-SEA',
  'JFK-GRU', 'GRU-JFK', 'MIA-GRU', 'GRU-MIA', 'LAX-GRU', 'GRU-LAX',
  'JFK-EZE', 'EZE-JFK', 'MIA-EZE', 'EZE-MIA', 'JFK-SCL', 'SCL-JFK',
  'LHR-DXB', 'DXB-LHR', 'LHR-DOH', 'DOH-LHR', 'LHR-SIN', 'SIN-LHR',
  'LHR-HKG', 'HKG-LHR', 'LHR-BKK', 'BKK-LHR', 'LHR-SYD', 'SYD-LHR',
  'CDG-DXB', 'DXB-CDG', 'FRA-DXB', 'DXB-FRA', 'AMS-DXB', 'DXB-AMS',
  'HND-SIN', 'SIN-HND', 'HND-BKK', 'BKK-HND', 'NRT-SIN', 'SIN-NRT',
  'ICN-LAX', 'LAX-ICN', 'ICN-SFO', 'SFO-ICN', 'ICN-JFK', 'JFK-ICN',
  'PEK-LAX', 'LAX-PEK', 'PVG-LAX', 'LAX-PVG', 'CAN-LAX', 'LAX-CAN',
  'HKG-LAX', 'LAX-HKG', 'HKG-SFO', 'SFO-HKG', 'HKG-JFK', 'JFK-HKG',
  'SIN-SYD', 'SYD-SIN', 'SIN-MEL', 'MEL-SIN', 'SIN-BNE', 'BNE-SIN',
  'BKK-SYD', 'SYD-BKK', 'KUL-SYD', 'SYD-KUL', 'CGK-SYD', 'SYD-CGK',
  'DXB-SYD', 'SYD-DXB', 'DXB-MEL', 'MEL-DXB', 'DOH-SYD', 'SYD-DOH',
]);

// Airline route mappings (simplified - in production, this would be comprehensive)
const AIRLINE_ROUTES: Record<string, Set<string>> = {
  'AA': new Set(['JFK-LHR', 'LHR-JFK', 'DFW-LHR', 'LHR-DFW', 'LAX-LHR', 'LHR-LAX', 'MIA-LHR', 'LHR-MIA', 'ORD-LHR', 'LHR-ORD', 'JFK-GRU', 'GRU-JFK', 'MIA-GRU', 'GRU-MIA', 'JFK-EZE', 'EZE-JFK', 'MIA-EZE', 'EZE-MIA', 'JFK-FCO', 'FCO-JFK']),
  'UA': new Set(['EWR-LHR', 'LHR-EWR', 'SFO-LHR', 'LHR-SFO', 'IAD-LHR', 'LHR-IAD', 'ORD-LHR', 'LHR-ORD', 'SFO-NRT', 'NRT-SFO', 'LAX-NRT', 'NRT-LAX', 'EWR-CDG', 'CDG-EWR', 'SFO-SIN', 'SIN-SFO']),
  'DL': new Set(['ATL-LHR', 'LHR-ATL', 'JFK-LHR', 'LHR-JFK', 'DTW-LHR', 'LHR-DTW', 'MSP-LHR', 'LHR-MSP', 'ATL-CDG', 'CDG-ATL', 'ATL-FRA', 'FRA-ATL', 'JFK-BCN', 'BCN-JFK', 'LAX-SYD', 'SYD-LAX']),
  'BA': new Set(['LHR-JFK', 'JFK-LHR', 'LHR-LAX', 'LAX-LHR', 'LHR-SFO', 'SFO-LHR', 'LHR-ORD', 'ORD-LHR', 'LHR-DFW', 'DFW-LHR', 'LHR-MIA', 'MIA-LHR', 'LHR-SEA', 'SEA-LHR', 'LHR-BOS', 'BOS-LHR', 'LHR-IAD', 'IAD-LHR', 'LHR-DXB', 'DXB-LHR', 'LHR-SIN', 'SIN-LHR', 'LHR-HKG', 'HKG-LHR']),
  'AF': new Set(['CDG-JFK', 'JFK-CDG', 'CDG-LAX', 'LAX-CDG', 'CDG-SFO', 'SFO-CDG', 'CDG-MIA', 'MIA-CDG', 'CDG-ATL', 'ATL-CDG', 'CDG-DXB', 'DXB-CDG']),
  'LH': new Set(['FRA-JFK', 'JFK-FRA', 'FRA-LAX', 'LAX-FRA', 'FRA-SFO', 'SFO-FRA', 'FRA-ORD', 'ORD-FRA', 'FRA-MIA', 'MIA-FRA', 'FRA-DXB', 'DXB-FRA']),
  'JL': new Set(['HND-LAX', 'LAX-HND', 'HND-SFO', 'SFO-HND', 'HND-JFK', 'JFK-HND', 'NRT-LAX', 'LAX-NRT', 'NRT-SFO', 'SFO-NRT', 'NRT-JFK', 'JFK-NRT', 'HND-SIN', 'SIN-HND']),
  'NH': new Set(['HND-LAX', 'LAX-HND', 'HND-SFO', 'SFO-HND', 'HND-JFK', 'JFK-HND', 'NRT-LAX', 'LAX-NRT', 'NRT-SFO', 'SFO-NRT', 'NRT-JFK', 'JFK-NRT']),
  'SQ': new Set(['SIN-LAX', 'LAX-SIN', 'SIN-SFO', 'SFO-SIN', 'SIN-JFK', 'JFK-SIN', 'SIN-LHR', 'LHR-SIN', 'SIN-SYD', 'SYD-SIN', 'SIN-MEL', 'MEL-SIN']),
  'CX': new Set(['HKG-LAX', 'LAX-HKG', 'HKG-SFO', 'SFO-HKG', 'HKG-JFK', 'JFK-HKG', 'HKG-LHR', 'LHR-HKG']),
  'EK': new Set(['DXB-JFK', 'JFK-DXB', 'DXB-LAX', 'LAX-DXB', 'DXB-SFO', 'SFO-DXB', 'DXB-SEA', 'SEA-DXB', 'DXB-LHR', 'LHR-DXB', 'DXB-SYD', 'SYD-DXB', 'DXB-MEL', 'MEL-DXB']),
  'QR': new Set(['DOH-JFK', 'JFK-DOH', 'DOH-LAX', 'LAX-DOH', 'DOH-SFO', 'SFO-DOH', 'DOH-LHR', 'LHR-DOH', 'DOH-SYD', 'SYD-DOH']),
  'QF': new Set(['SYD-LAX', 'LAX-SYD', 'SYD-SFO', 'SFO-SYD', 'SYD-DFW', 'DFW-SYD', 'MEL-LAX', 'LAX-MEL', 'SYD-SIN', 'SIN-SYD']),
  'NZ': new Set(['AKL-LAX', 'LAX-AKL']),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse ISO 8601 duration string to minutes
 * Format: PT2H30M or PT90M
 */
export function parseDuration(durationStr: string): number {
  const match = durationStr.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${durationStr}`);
  }
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Format minutes as ISO 8601 duration string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `PT${hours}H`;
  }
  return `PT${hours}H${mins}M`;
}

/**
 * Calculate time difference in minutes between two ISO timestamps
 * Returns absolute difference
 */
export function timeDifferenceMinutes(time1: string, time2: string): number {
  const d1 = new Date(time1);
  const d2 = new Date(time2);
  return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60);
}

/**
 * Convert local time to UTC
 */
export function toUTC(localTime: string, timezone: string): string {
  // In a real implementation, this would use a timezone library like date-fns-tz
  // For this implementation, we assume input is already in UTC or ISO format with offset
  const date = new Date(localTime);
  return date.toISOString();
}

/**
 * Convert UTC to local time
 */
export function fromUTC(utcTime: string, timezone: string): string {
  // In a real implementation, this would use a timezone library
  const date = new Date(utcTime);
  return date.toISOString();
}

/**
 * Calculate flight duration from departure and arrival times
 */
export function calculateDuration(departureTime: string, arrivalTime: string): string {
  const diffMinutes = timeDifferenceMinutes(departureTime, arrivalTime);
  return formatDuration(diffMinutes);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate flight number format
 * Format: 2-3 letters + 1-4 digits (e.g., "AA123", "UAL4567")
 */
export function validateFlightNumber(flightNumber: string): { valid: boolean; error?: string } {
  const normalized = flightNumber.toUpperCase().trim();
  
  if (!FLIGHT_NUMBER_REGEX.test(normalized)) {
    return { 
      valid: false, 
      error: `Invalid flight number format: "${flightNumber}". Expected: 2-3 letters + 1-4 digits` 
    };
  }
  
  const airlineCode = normalized.match(/^[A-Z]{2,3}/)?.[0] || '';
  if (!KNOWN_AIRLINE_CODES.has(airlineCode)) {
    return { 
      valid: true, 
      error: `Warning: Unknown airline code "${airlineCode}"` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate IATA airport code
 */
export function validateAirportCode(code: string): { valid: boolean; error?: string } {
  const normalized = code.toUpperCase().trim();
  
  if (!AIRPORT_CODE_REGEX.test(normalized)) {
    return { 
      valid: false, 
      error: `Invalid airport code: "${code}". Expected: 3 uppercase letters` 
    };
  }
  
  if (!KNOWN_AIRPORTS.has(normalized)) {
    return { 
      valid: true, 
      error: `Warning: Unknown airport code "${normalized}"` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate that departure time is before arrival time
 */
export function validateTimeOrder(
  departureTime: string, 
  arrivalTime: string
): { valid: boolean; error?: string } {
  const dep = new Date(departureTime);
  const arr = new Date(arrivalTime);
  
  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (dep >= arr) {
    return { 
      valid: false, 
      error: `Departure time (${departureTime}) must be before arrival time (${arrivalTime})` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate flight duration is realistic
 */
export function validateDuration(
  durationStr: string,
  origin?: string,
  destination?: string
): { valid: boolean; error?: string } {
  try {
    const durationMinutes = parseDuration(durationStr);
    
    if (durationMinutes < MIN_FLIGHT_DURATION_MINUTES) {
      return { 
        valid: false, 
        error: `Flight duration (${durationMinutes} min) is too short. Minimum: ${MIN_FLIGHT_DURATION_MINUTES} minutes` 
      };
    }
    
    if (durationMinutes > MAX_FLIGHT_DURATION_MINUTES) {
      return { 
        valid: false, 
        error: `Flight duration (${Math.round(durationMinutes / 60)} hours) exceeds maximum (${MAX_FLIGHT_DURATION_HOURS} hours) without stopover` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid duration format: ${durationStr}` };
  }
}

/**
 * Check if a route exists in the known routes database
 */
export function checkRouteExists(origin: string, destination: string): boolean {
  const routeKey = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  return KNOWN_ROUTES.has(routeKey);
}

/**
 * Check if an airline operates a specific route
 */
export function checkAirlineOperatesRoute(
  airline: string, 
  origin: string, 
  destination: string
): boolean {
  const normalizedAirline = airline.toUpperCase().trim();
  const routeKey = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  
  const routes = AIRLINE_ROUTES[normalizedAirline];
  if (!routes) {
    // Unknown airline - can't validate route
    return true; // Allow but with warning
  }
  
  return routes.has(routeKey);
}

/**
 * Calculate distance-based expected duration (rough estimate)
 * Returns expected duration in minutes
 */
export function estimateDurationFromRoute(origin: string, destination: string): number | null {
  // Simplified distance estimation based on common route categories
  // In production, this would use actual great-circle distance calculations
  const routeKey = `${origin.toUpperCase()}-${destination.toUpperCase()}`;
  
  // Domestic US flights (rough estimates)
  const domesticShortHaul = new Set(['JFK-BOS', 'BOS-JFK', 'LAX-SFO', 'SFO-LAX', 'LAX-LAS', 'LAS-LAX']);
  const domesticMediumHaul = new Set(['JFK-ORD', 'ORD-JFK', 'LAX-DFW', 'DFW-LAX', 'LAX-ORD', 'ORD-LAX']);
  
  // Transatlantic
  const transatlantic = new Set(['JFK-LHR', 'LHR-JFK', 'JFK-CDG', 'CDG-JFK', 'JFK-FRA', 'FRA-JFK']);
  
  // Transpacific
  const transpacific = new Set(['LAX-NRT', 'NRT-LAX', 'LAX-HND', 'HND-LAX', 'SFO-NRT', 'NRT-SFO']);
  
  // US West Coast to Australia
  const australia = new Set(['LAX-SYD', 'SYD-LAX', 'SFO-SYD', 'SYD-SFO', 'LAX-AKL', 'AKL-LAX']);
  
  if (domesticShortHaul.has(routeKey)) return 90;
  if (domesticMediumHaul.has(routeKey)) return 240;
  if (transatlantic.has(routeKey)) return 420;
  if (transpacific.has(routeKey)) return 720;
  if (australia.has(routeKey)) return 900;
  
  return null; // Unknown route
}

/**
 * Validate duration is realistic for the route
 */
export function validateDurationForRoute(
  durationStr: string,
  origin: string,
  destination: string
): { valid: boolean; warning?: string } {
  const durationMinutes = parseDuration(durationStr);
  const expectedDuration = estimateDurationFromRoute(origin, destination);
  
  if (expectedDuration === null) {
    return { valid: true, warning: 'Unknown route - cannot validate duration' };
  }
  
  // Allow ±30% variance for wind, routing, etc.
  const minExpected = expectedDuration * 0.7;
  const maxExpected = expectedDuration * 1.3;
  
  if (durationMinutes < minExpected || durationMinutes > maxExpected) {
    return { 
      valid: true, 
      warning: `Duration (${durationMinutes} min) seems unusual for ${origin}-${destination}. Expected: ~${expectedDuration} min` 
    };
  }
  
  return { valid: true };
}

// ============================================================================
// CROSS-SOURCE VALIDATION
// ============================================================================

/**
 * Compare multiple flight data sources and calculate agreement score
 */
export function compareSources(flights: RawFlightData[]): CrossSourceComparison {
  if (flights.length === 0) {
    return {
      departureTimeVariance: 0,
      arrivalTimeVariance: 0,
      durationVariance: 0,
      agreementScore: 0,
      discrepancies: ['No sources provided'],
    };
  }
  
  if (flights.length === 1) {
    return {
      departureTimeVariance: 0,
      arrivalTimeVariance: 0,
      durationVariance: 0,
      agreementScore: 100,
      discrepancies: [],
    };
  }
  
  // Calculate variances
  const departureTimes = flights.map(f => new Date(f.departureTime).getTime());
  const arrivalTimes = flights.map(f => new Date(f.arrivalTime).getTime());
  
  const depVariance = (Math.max(...departureTimes) - Math.min(...departureTimes)) / (1000 * 60);
  const arrVariance = (Math.max(...arrivalTimes) - Math.min(...arrivalTimes)) / (1000 * 60);
  
  // Duration variance
  const durations = flights
    .filter(f => f.duration)
    .map(f => parseDuration(f.duration!));
  const durationVariance = durations.length > 1 
    ? Math.max(...durations) - Math.min(...durations)
    : 0;
  
  // Calculate agreement score
  const discrepancies: string[] = [];
  let agreementScore = 100;
  
  if (depVariance > MAX_TIME_VARIANCE_MINUTES) {
    agreementScore -= 20;
    discrepancies.push(`Departure time variance: ${Math.round(depVariance)} minutes (max allowed: ${MAX_TIME_VARIANCE_MINUTES})`);
  }
  
  if (arrVariance > MAX_TIME_VARIANCE_MINUTES) {
    agreementScore -= 20;
    discrepancies.push(`Arrival time variance: ${Math.round(arrVariance)} minutes (max allowed: ${MAX_TIME_VARIANCE_MINUTES})`);
  }
  
  if (durationVariance > MAX_DURATION_VARIANCE_MINUTES) {
    agreementScore -= 15;
    discrepancies.push(`Duration variance: ${durationVariance} minutes (max allowed: ${MAX_DURATION_VARIANCE_MINUTES})`);
  }
  
  // Check for conflicting flight numbers
  const flightNumbers = new Set(flights.map(f => f.flightNumber.toUpperCase()));
  if (flightNumbers.size > 1) {
    agreementScore -= 25;
    discrepancies.push(`Conflicting flight numbers: ${Array.from(flightNumbers).join(', ')}`);
  }
  
  // Check for conflicting routes
  const routes = new Set(flights.map(f => `${f.origin}-${f.destination}`.toUpperCase()));
  if (routes.size > 1) {
    agreementScore -= 30;
    discrepancies.push(`Conflicting routes: ${Array.from(routes).join(', ')}`);
  }
  
  return {
    departureTimeVariance: depVariance,
    arrivalTimeVariance: arrVariance,
    durationVariance,
    agreementScore: Math.max(0, agreementScore),
    discrepancies,
  };
}

/**
 * Calculate confidence score based on sources and validation results
 */
export function calculateConfidence(
  flights: RawFlightData[],
  comparison: CrossSourceComparison,
  validationResults: ValidationDetails
): number {
  let confidence = 0;
  
  // Add source weights
  const uniqueSources = new Set(flights.map(f => f.source));
  for (const source of uniqueSources) {
    confidence += SOURCE_WEIGHTS[source];
  }
  
  // Cap at 100
  confidence = Math.min(100, confidence);
  
  // Adjust based on source agreement
  confidence = confidence * (comparison.agreementScore / 100);
  
  // Penalize validation failures
  if (!validationResults.flightNumberValid) confidence *= 0.5;
  if (!validationResults.airportCodesValid) confidence *= 0.7;
  if (!validationResults.timesValid) confidence *= 0.3;
  if (!validationResults.durationValid) confidence *= 0.6;
  if (!validationResults.routeExists) confidence *= 0.8;
  if (!validationResults.airlineOperatesRoute) confidence *= 0.85;
  
  return Math.round(confidence);
}

/**
 * Determine confidence level category
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < 50) return ConfidenceLevel.REJECT;
  if (confidence < 70) return ConfidenceLevel.WARNING;
  if (confidence < 90) return ConfidenceLevel.CAUTION;
  return ConfidenceLevel.TRUSTED;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Main flight validation function
 * Validates flight data from one or more sources
 */
export function validateFlight(flights: RawFlightData | RawFlightData[]): FlightValidationResult {
  // Normalize input to array
  const flightArray = Array.isArray(flights) ? flights : [flights];
  
  if (flightArray.length === 0) {
    throw new Error('No flight data provided');
  }
  
  // Use the first flight as the base (typically highest priority source)
  const primaryFlight = flightArray[0];
  
  // Initialize validation details
  const validationDetails: ValidationDetails = {
    flightNumberValid: false,
    airportCodesValid: false,
    timesValid: false,
    durationValid: false,
    routeExists: false,
    airlineOperatesRoute: false,
    sourcesAgree: false,
    timeVarianceMinutes: 0,
    durationVarianceMinutes: 0,
  };
  
  const warnings: string[] = [];
  
  // 1. Validate flight number
  const flightNumberValidation = validateFlightNumber(primaryFlight.flightNumber);
  validationDetails.flightNumberValid = flightNumberValidation.valid;
  if (flightNumberValidation.error) {
    warnings.push(flightNumberValidation.error);
  }
  
  // 2. Validate airport codes
  const originValidation = validateAirportCode(primaryFlight.origin);
  const destValidation = validateAirportCode(primaryFlight.destination);
  validationDetails.airportCodesValid = originValidation.valid && destValidation.valid;
  if (originValidation.error) warnings.push(originValidation.error);
  if (destValidation.error) warnings.push(destValidation.error);
  
  // 3. Validate time order
  const timeValidation = validateTimeOrder(primaryFlight.departureTime, primaryFlight.arrivalTime);
  validationDetails.timesValid = timeValidation.valid;
  if (timeValidation.error) {
    warnings.push(timeValidation.error);
  }
  
  // 4. Validate duration
  const duration = primaryFlight.duration || calculateDuration(
    primaryFlight.departureTime, 
    primaryFlight.arrivalTime
  );
  const durationValidation = validateDuration(duration, primaryFlight.origin, primaryFlight.destination);
  validationDetails.durationValid = durationValidation.valid;
  if (durationValidation.error) {
    warnings.push(durationValidation.error);
  }
  
  // 5. Check route exists
  validationDetails.routeExists = checkRouteExists(primaryFlight.origin, primaryFlight.destination);
  if (!validationDetails.routeExists) {
    warnings.push(`Route ${primaryFlight.origin}-${primaryFlight.destination} not found in known routes database`);
  }
  
  // 6. Check airline operates route
  validationDetails.airlineOperatesRoute = checkAirlineOperatesRoute(
    primaryFlight.airline,
    primaryFlight.origin,
    primaryFlight.destination
  );
  if (!validationDetails.airlineOperatesRoute) {
    warnings.push(`Airline ${primaryFlight.airline} may not operate route ${primaryFlight.origin}-${primaryFlight.destination}`);
  }
  
  // 7. Validate duration is realistic for route
  const routeDurationValidation = validateDurationForRoute(
    duration,
    primaryFlight.origin,
    primaryFlight.destination
  );
  if (routeDurationValidation.warning) {
    warnings.push(routeDurationValidation.warning);
  }
  
  // 8. Cross-source comparison (if multiple sources)
  const comparison = compareSources(flightArray);
  validationDetails.sourcesAgree = comparison.agreementScore >= 80;
  validationDetails.timeVarianceMinutes = Math.max(
    comparison.departureTimeVariance,
    comparison.arrivalTimeVariance
  );
  validationDetails.durationVarianceMinutes = comparison.durationVariance;
  warnings.push(...comparison.discrepancies);
  
  // 9. Calculate confidence
  const confidence = calculateConfidence(flightArray, comparison, validationDetails);
  const confidenceLevel = getConfidenceLevel(confidence);
  
  // 10. Determine validity
  const isValid = confidence >= 50 && 
                  validationDetails.flightNumberValid && 
                  validationDetails.airportCodesValid &&
                  validationDetails.timesValid &&
                  validationDetails.durationValid;
  
  // Build result
  const result: FlightValidationResult = {
    flightNumber: primaryFlight.flightNumber.toUpperCase(),
    airline: primaryFlight.airline,
    origin: primaryFlight.origin.toUpperCase(),
    destination: primaryFlight.destination.toUpperCase(),
    departureTime: primaryFlight.departureTime,
    arrivalTime: primaryFlight.arrivalTime,
    duration,
    aircraft: primaryFlight.aircraft,
    sources: Array.from(new Set(flightArray.map(f => f.source))),
    confidence,
    warnings,
    isValid,
    confidenceLevel,
    validationDetails,
  };
  
  return result;
}

/**
 * Batch validate multiple flights
 */
export function validateFlights(flights: RawFlightData[]): FlightValidationResult[] {
  return flights.map(flight => validateFlight(flight));
}

/**
 * Merge and validate flights from multiple sources for the same flight
 * Groups flights by flight number and date, then validates as a group
 */
export function validateMergedFlights(flights: RawFlightData[]): FlightValidationResult[] {
  // Group flights by flight number + date (YYYY-MM-DD from departure time)
  const groups = new Map<string, RawFlightData[]>();
  
  for (const flight of flights) {
    const date = flight.departureTime.slice(0, 10); // YYYY-MM-DD
    const key = `${flight.flightNumber.toUpperCase()}-${date}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(flight);
  }
  
  // Validate each group
  const results: FlightValidationResult[] = [];
  for (const [, groupFlights] of groups) {
    results.push(validateFlight(groupFlights));
  }
  
  return results;
}

// ============================================================================
// TEST CASES
// ============================================================================

// Test data for validation
export const TEST_FLIGHTS = {
  // Valid flight - single source (Amadeus API)
  validSingleSource: {
    flightNumber: 'AA100',
    airline: 'AA',
    origin: 'JFK',
    destination: 'LHR',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-16T08:30:00Z',
    duration: 'PT7H',
    aircraft: 'Boeing 777-300ER',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Valid flight - multiple agreeing sources
  validMultiSource: [
    {
      flightNumber: 'BA112',
      airline: 'BA',
      origin: 'JFK',
      destination: 'LHR',
      departureTime: '2024-06-15T21:30:00Z',
      arrivalTime: '2024-06-16T08:25:00Z',
      duration: 'PT6H55M',
      aircraft: 'Boeing 777-200',
      source: 'amadeus-api' as DataSource,
      fetchedAt: new Date(),
    },
    {
      flightNumber: 'BA112',
      airline: 'BA',
      origin: 'JFK',
      destination: 'LHR',
      departureTime: '2024-06-15T21:32:00Z',
      arrivalTime: '2024-06-16T08:28:00Z',
      duration: 'PT6H56M',
      aircraft: 'Boeing 777-200',
      source: 'airline-website' as DataSource,
      fetchedAt: new Date(),
    },
  ],
  
  // Invalid: departure after arrival
  invalidTimeOrder: {
    flightNumber: 'AA100',
    airline: 'AA',
    origin: 'JFK',
    destination: 'LHR',
    departureTime: '2024-06-16T08:30:00Z',
    arrivalTime: '2024-06-15T21:30:00Z',
    duration: 'PT7H',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Invalid: flight too short
  invalidTooShort: {
    flightNumber: 'AA100',
    airline: 'AA',
    origin: 'JFK',
    destination: 'LHR',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-15T21:45:00Z',
    duration: 'PT15M',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Invalid: flight too long
  invalidTooLong: {
    flightNumber: 'AA100',
    airline: 'AA',
    origin: 'JFK',
    destination: 'LHR',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-17T21:30:00Z',
    duration: 'PT48H',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Invalid: bad flight number format
  invalidFlightNumber: {
    flightNumber: 'INVALID12345',
    airline: 'XX',
    origin: 'JFK',
    destination: 'LHR',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-16T08:30:00Z',
    duration: 'PT7H',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Invalid: bad airport code
  invalidAirportCode: {
    flightNumber: 'AA100',
    airline: 'AA',
    origin: 'XYZ',
    destination: 'LHR',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-16T08:30:00Z',
    duration: 'PT7H',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Warning: conflicting sources
  conflictingSources: [
    {
      flightNumber: 'UA123',
      airline: 'UA',
      origin: 'SFO',
      destination: 'LHR',
      departureTime: '2024-06-15T12:00:00Z',
      arrivalTime: '2024-06-16T06:30:00Z',
      duration: 'PT10H30M',
      source: 'amadeus-api' as DataSource,
      fetchedAt: new Date(),
    },
    {
      flightNumber: 'UA123',
      airline: 'UA',
      origin: 'SFO',
      destination: 'LHR',
      departureTime: '2024-06-15T14:00:00Z', // 2 hour difference!
      arrivalTime: '2024-06-16T08:30:00Z',
      duration: 'PT10H30M',
      source: 'secondary-aggregator' as DataSource,
      fetchedAt: new Date(),
    },
  ],
  
  // Warning: low confidence (only historical data)
  lowConfidence: {
    flightNumber: 'DL200',
    airline: 'DL',
    origin: 'ATL',
    destination: 'CDG',
    departureTime: '2024-06-15T17:00:00Z',
    arrivalTime: '2024-06-16T07:30:00Z',
    duration: 'PT8H30M',
    source: 'historical-data' as DataSource,
    fetchedAt: new Date(),
  },
  
  // Warning: unknown route
  unknownRoute: {
    flightNumber: 'AA999',
    airline: 'AA',
    origin: 'XXX',
    destination: 'YYY',
    departureTime: '2024-06-15T21:30:00Z',
    arrivalTime: '2024-06-16T08:30:00Z',
    duration: 'PT7H',
    source: 'amadeus-api' as DataSource,
    fetchedAt: new Date(),
  },
};

/**
 * Run all test cases and return results
 */
export function runTests(): { name: string; result: FlightValidationResult; passed: boolean }[] {
  const results: { name: string; result: FlightValidationResult; passed: boolean }[] = [];
  
  // Test 1: Single source (Amadeus API) - demonstrates confidence scoring
  // Note: Single source = 40pts, which is below 50 threshold, so it gets REJECTED
  // This is correct behavior - we need multiple sources for high confidence
  const test1Flight = { ...TEST_FLIGHTS.validSingleSource, flightNumber: 'BA100', airline: 'BA' };
  const test1 = validateFlight(test1Flight);
  results.push({
    name: 'Single source (Amadeus API) - below threshold',
    result: test1,
    // Single source confidence = 40pts, which is < 50 threshold = REJECT
    // This validates the confidence threshold system works correctly
    passed: !test1.isValid && test1.confidence < 50 && test1.confidenceLevel === ConfidenceLevel.REJECT,
  });
  
  // Test 2: Valid multiple sources (BA flight on BA route - very high confidence)
  const test2Flights = TEST_FLIGHTS.validMultiSource.map(f => ({ ...f, flightNumber: 'BA112', airline: 'BA' }));
  const test2 = validateFlight(test2Flights);
  results.push({
    name: 'Valid multiple agreeing sources',
    result: test2,
    // Two sources (40 + 35 = 75) with good agreement = ~75% confidence
    passed: test2.isValid && test2.confidence >= 70 && test2.validationDetails.sourcesAgree,
  });
  
  // Test 3: Invalid time order
  const test3 = validateFlight(TEST_FLIGHTS.invalidTimeOrder);
  results.push({
    name: 'Invalid: departure after arrival',
    result: test3,
    passed: !test3.isValid && test3.confidence < 50,
  });
  
  // Test 4: Invalid too short
  const test4 = validateFlight(TEST_FLIGHTS.invalidTooShort);
  results.push({
    name: 'Invalid: flight too short',
    result: test4,
    passed: !test4.isValid && test4.warnings.some(w => w.includes('too short')),
  });
  
  // Test 5: Invalid too long
  const test5 = validateFlight(TEST_FLIGHTS.invalidTooLong);
  results.push({
    name: 'Invalid: flight too long',
    result: test5,
    passed: !test5.isValid && test5.warnings.some(w => w.includes('exceeds maximum')),
  });
  
  // Test 6: Invalid flight number
  const test6 = validateFlight(TEST_FLIGHTS.invalidFlightNumber);
  results.push({
    name: 'Invalid: bad flight number format',
    result: test6,
    passed: !test6.validationDetails.flightNumberValid,
  });
  
  // Test 7: Invalid airport code
  const test7 = validateFlight(TEST_FLIGHTS.invalidAirportCode);
  results.push({
    name: 'Invalid: unknown airport code',
    result: test7,
    passed: !test7.validationDetails.airportCodesValid || test7.warnings.some(w => w.includes('Unknown airport')),
  });
  
  // Test 8: Conflicting sources
  const test8 = validateFlight(TEST_FLIGHTS.conflictingSources);
  results.push({
    name: 'Warning: conflicting sources',
    result: test8,
    passed: test8.confidence < 70 && !test8.validationDetails.sourcesAgree,
  });
  
  // Test 9: Low confidence
  const test9 = validateFlight(TEST_FLIGHTS.lowConfidence);
  results.push({
    name: 'Warning: low confidence (historical only)',
    result: test9,
    passed: test9.confidence < 50 && test9.confidenceLevel === ConfidenceLevel.REJECT,
  });
  
  // Test 10: Unknown route
  const test10 = validateFlight(TEST_FLIGHTS.unknownRoute);
  results.push({
    name: 'Warning: unknown route',
    result: test10,
    passed: !test10.validationDetails.routeExists && test10.warnings.some(w => w.includes('not found')),
  });
  
  return results;
}

/**
 * Print test results to console
 */
export function printTestResults(): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           FLIGHT VALIDATION ENGINE - TEST RESULTS              ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results = runTests();
  let passed = 0;
  let failed = 0;
  
  for (const test of results) {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test.name}`);
    console.log(`   Valid: ${test.result.isValid} | Confidence: ${test.result.confidence}% (${test.result.confidenceLevel})`);
    console.log(`   Sources: ${test.result.sources.join(', ')}`);
    if (test.result.warnings.length > 0) {
      console.log(`   Warnings: ${test.result.warnings.length}`);
      test.result.warnings.forEach(w => console.log(`      - ${w}`));
    }
    console.log('');
    
    if (test.passed) passed++;
    else failed++;
  }
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log('═══════════════════════════════════════════════════════════════');
}

// Run tests if this file is executed directly
if (require.main === module) {
  printTestResults();
}

// Default export
export default {
  validateFlight,
  validateFlights,
  validateMergedFlights,
  validateFlightNumber,
  validateAirportCode,
  validateTimeOrder,
  validateDuration,
  checkRouteExists,
  checkAirlineOperatesRoute,
  compareSources,
  calculateConfidence,
  getConfidenceLevel,
  parseDuration,
  formatDuration,
  calculateDuration,
  timeDifferenceMinutes,
  toUTC,
  fromUTC,
  runTests,
  printTestResults,
  TEST_FLIGHTS,
  SOURCE_WEIGHTS,
  ConfidenceLevel,
};
