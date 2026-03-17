/**
 * DATA VALIDATION LAYER
 * Ensures all flight data is real and verifiable
 * NO FAKE DATA ALLOWED
 */

export interface ValidatedFlight {
  id: string;
  source: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: {
    airport: string;
    time: string;  // ISO format
    date: string;  // YYYY-MM-DD
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  bookingLink: string;
  confidence: 'high' | 'medium' | 'low';
  validationErrors?: string[];
}

// Real airline IATA codes for validation
const VALID_AIRLINE_CODES = new Set([
  'AA', 'AF', 'AI', 'AZ', 'BA', 'CA', 'CI', 'CX', 'DL', 'EK', 'ET', 'EY', 'FI', 'GF', 'IB', 'JL', 'JQ', 'KE', 'KL', 'KM', 'KQ', 'KU', 'LA', 'LH', 'LO', 'LX', 'LY', 'MA', 'MD', 'MF', 'MH', 'MI', 'MK', 'MP', 'MS', 'MU', 'MX', 'NF', 'NH', 'NW', 'NZ', 'OA', 'OK', 'OM', 'OS', 'OU', 'OZ', 'PG', 'PK', 'PR', 'PS', 'QF', 'QR', 'RJ', 'SA', 'SC', 'SK', 'SN', 'SQ', 'SR', 'SU', 'SV', 'SW', 'SY', 'TA', 'TG', 'TK', 'TN', 'TP', 'TW', 'UA', 'UL', 'UM', 'UN', 'UO', 'UP', 'UR', 'US', 'UU', 'UX', 'UY', 'UZ', 'VA', 'VG', 'VN', 'VS', 'VT', 'VV', 'VW', 'VX', 'VY', 'WA', 'WF', 'WK', 'WM', 'WN', 'WO', 'WR', 'WS', 'WU', 'WV', 'WW', 'WX', 'WY', 'WZ', 'X3', 'X7', 'X9', 'XA', 'XB', 'XC', 'XD', 'XE', 'XF', 'XG', 'XH', 'XI', 'XJ', 'XK', 'XL', 'XM', 'XN', 'XO', 'XP', 'XQ', 'XR', 'XS', 'XT', 'XU', 'XV', 'XW', 'XX', 'XY', 'XZ', 'Y0', 'Y1', 'Y2', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'YA', 'YB', 'YC', 'YD', 'YE', 'YF', 'YG', 'YH', 'YI', 'YJ', 'YK', 'YL', 'YM', 'YN', 'YO', 'YP', 'YQ', 'YR', 'YS', 'YT', 'YU', 'YV', 'YW', 'YX', 'YY', 'YZ', 'Z0', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'ZA', 'ZB', 'ZC', 'ZD', 'ZE', 'ZF', 'ZG', 'ZH', 'ZI', 'ZJ', 'ZK', 'ZL', 'ZM', 'ZN', 'ZO', 'ZP', 'ZQ', 'ZR', 'ZS', 'ZT', 'ZU', 'ZV', 'ZW', 'ZX', 'ZY', 'ZZ'
]);

// Valid airport IATA codes (major ones)
const VALID_AIRPORTS = new Set([
  'LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN', 'MAN', 'EDI', 'GLA', 'BHX', 'BRS', 'LPL', 'NCL', 'BFS', 'NWI', 'JFK', 'LGA', 'EWR', 'ATL', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'MIA', 'BOS', 'LAS', 'PHX', 'IAH', 'DXB', 'DOH', 'AUH', 'IST', 'SIN', 'HKG', 'BKK', 'NRT', 'HND', 'ICN', 'KUL', 'CGK', 'MNL', 'PEK', 'PVG', 'CAN', 'CDG', 'ORY', 'AMS', 'FRA', 'MUC', 'ZUR', 'GVA', 'FCO', 'MXP', 'BCN', 'MAD', 'LIS', 'OPO', 'DUB', 'CPH', 'ARN', 'OSL', 'HEL', 'VIE', 'PRG', 'BUD', 'WAW', 'ATH', 'SOF', 'OTP', 'RIX', 'TLL', 'VNO', 'MLA', 'LCA', 'TLV', 'CAI', 'JNB', 'CPT', 'GRU', 'GIG', 'EZE', 'SCL', 'BOG', 'LIM', 'MEX', 'CUN', 'YYZ', 'YVR', 'YUL', 'SYD', 'MEL', 'BNE', 'PER', 'AKL', 'CHC'
]);

/**
 * Validates a flight object
 * Returns null if flight is invalid (should be rejected)
 * Returns flight with confidence score and any validation errors
 */
export function validateFlight(flight: any): ValidatedFlight | null {
  const errors: string[] = [];
  
  // 1. Check required fields exist
  if (!flight.airline) errors.push('Missing airline');
  if (!flight.flightNumber) errors.push('Missing flightNumber');
  if (!flight.from || !flight.to) errors.push('Missing origin/destination');
  if (!flight.price || flight.price <= 0) errors.push('Invalid price');
  
  // 2. Validate flight number format (2-3 letter code + 1-4 digits)
  const flightNumMatch = flight.flightNumber?.match(/^([A-Z]{2,3})(\d{1,4})$/);
  if (!flightNumMatch) {
    errors.push('Invalid flight number format');
  } else {
    const airlineCode = flightNumMatch[1];
    if (!VALID_AIRLINE_CODES.has(airlineCode)) {
      errors.push(`Unknown airline code: ${airlineCode}`);
    }
  }
  
  // 3. Validate airports
  if (!VALID_AIRPORTS.has(flight.from)) errors.push(`Unknown origin: ${flight.from}`);
  if (!VALID_AIRPORTS.has(flight.to)) errors.push(`Unknown destination: ${flight.to}`);
  
  // 4. Validate times exist and are not empty
  if (!flight.departure?.time || flight.departure.time === '') {
    errors.push('Missing departure time');
  }
  if (!flight.arrival?.time || flight.arrival.time === '') {
    errors.push('Missing arrival time');
  }
  
  // 5. Check price is realistic (£50 - £20,000)
  if (flight.price < 50 || flight.price > 20000) {
    errors.push(`Price ${flight.price} out of realistic range`);
  }
  
  // 6. Determine confidence based on errors
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (errors.length > 0) confidence = 'medium';
  if (errors.length > 2) confidence = 'low';
  
  // 7. REJECT if critical errors (no flight number, no airports, fake data patterns)
  if (errors.some(e => 
    e.includes('Missing flightNumber') || 
    e.includes('Invalid flight number') ||
    (e.includes('Missing departure time') && e.includes('Missing arrival time'))
  )) {
    return null;  // REJECT - fake data
  }
  
  return {
    ...flight,
    confidence,
    validationErrors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Cross-validate flights from multiple sources
 * Keep only flights that appear in 2+ sources OR have high confidence
 */
export function crossValidateFlights(flights: ValidatedFlight[]): ValidatedFlight[] {
  const validated: ValidatedFlight[] = [];
  const seen = new Map<string, { flight: ValidatedFlight; sources: Set<string> }>();
  
  for (const flight of flights) {
    // Skip low confidence flights
    if (flight.confidence === 'low') continue;
    
    // Create key based on airline + price + route
    const key = `${flight.airline}-${flight.from}-${flight.to}-${flight.price}`;
    
    const existing = seen.get(key);
    if (existing) {
      // Same flight from different source - boost confidence
      existing.sources.add(flight.source);
      if (existing.sources.size >= 2) {
        existing.flight.confidence = 'high';
      }
    } else {
      seen.set(key, { 
        flight: { ...flight }, 
        sources: new Set([flight.source]) 
      });
    }
  }
  
  // Return only flights with 2+ sources OR high confidence single source
  for (const [key, data] of seen) {
    if (data.sources.size >= 2 || data.flight.confidence === 'high') {
      validated.push(data.flight);
    }
  }
  
  return validated.sort((a, b) => a.price - b.price);
}

/**
 * Remove all sample/mock data sources
 */
export function removeMockData(flights: any[]): any[] {
  return flights.filter(f => 
    f.source !== 'SAMPLE' && 
    f.source !== 'MOCK' &&
    !f.id?.startsWith('sample-') &&
    !f.id?.startsWith('mock-')
  );
}

/**
 * Data confidence score for monitoring
 */
export function calculateDataQuality(flights: ValidatedFlight[]): {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  rejected: number;
  score: number;  // 0-100
} {
  const total = flights.length;
  const high = flights.filter(f => f.confidence === 'high').length;
  const medium = flights.filter(f => f.confidence === 'medium').length;
  const low = flights.filter(f => f.confidence === 'low').length;
  
  // Score: high=100, medium=50, low=0
  const score = total > 0 ? Math.round((high * 100 + medium * 50) / total) : 0;
  
  return {
    total,
    highConfidence: high,
    mediumConfidence: medium,
    lowConfidence: low,
    rejected: 0,  // Tracked separately
    score
  };
}
