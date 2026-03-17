/**
 * PARALLEL SPLIT-TICKET ENGINE
 * Searches all hubs simultaneously for maximum speed
 */

import { scrapeGoogleFlightsReal, RealFlight } from './scraper-real';

export interface SplitTicketLeg {
  from: string;
  to: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  price: number;
  currency: string;
  bookingLink: string;
}

export interface SplitTicketOption {
  id: string;
  legs: SplitTicketLeg[];
  totalPrice: number;
  directPrice: number;
  savings: number;
  currency: string;
  transferTime: number;
  riskScore: number;
  feasibility: 'good' | 'tight' | 'risky';
  warnings: string[];
}

const HUBS = [
  { code: 'DXB', name: 'Dubai', region: 'ME' },
  { code: 'DOH', name: 'Doha', region: 'ME' },
  { code: 'IST', name: 'Istanbul', region: 'EU' },
  { code: 'AMS', name: 'Amsterdam', region: 'EU' },
  { code: 'CDG', name: 'Paris', region: 'EU' },
  { code: 'FRA', name: 'Frankfurt', region: 'EU' },
  { code: 'SIN', name: 'Singapore', region: 'AS' },
  { code: 'HKG', name: 'Hong Kong', region: 'AS' },
  { code: 'BKK', name: 'Bangkok', region: 'AS' },
  { code: 'LHR', name: 'London', region: 'EU' }
];

const MIN_CONNECTION_TIMES: Record<string, number> = {
  'DXB': 90, 'DOH': 90, 'IST': 90, 'AMS': 60, 'CDG': 75,
  'FRA': 60, 'SIN': 60, 'HKG': 60, 'BKK': 90, 'LHR': 90,
  'JFK': 120, 'LAX': 90, 'DEFAULT': 90
};

/**
 * Find split tickets in PARALLEL
 * All hubs searched simultaneously
 */
export async function findSplitTicketsParallel(
  origin: string,
  destination: string,
  departureDate: string,
  directPrice: number,
  options: { maxHubs?: number } = {}
): Promise<SplitTicketOption[]> {
  const { maxHubs = 5 } = options;
  
  const relevantHubs = HUBS
    .filter(h => h.code !== origin && h.code !== destination)
    .slice(0, maxHubs);
  
  console.log(`[SplitEngine] Parallel search across ${relevantHubs.length} hubs`);
  
  // Search ALL hubs in parallel
  const hubPromises = relevantHubs.map(hub => 
    searchHubWithTimeout(origin, destination, departureDate, hub.code, directPrice, 8000)
  );
  
  // Wait for all to complete (success or timeout)
  const hubResults = await Promise.allSettled(hubPromises);
  
  // Collect successful results
  const allOptions: SplitTicketOption[] = [];
  hubResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      allOptions.push(...result.value);
      console.log(`[SplitEngine] Hub ${relevantHubs[index].code}: ${result.value.length} options`);
    } else {
      console.log(`[SplitEngine] Hub ${relevantHubs[index].code}: failed or timeout`);
    }
  });
  
  // Sort by savings, then by risk
  allOptions.sort((a, b) => {
    if (b.savings !== a.savings) return b.savings - a.savings;
    return a.riskScore - b.riskScore;
  });
  
  console.log(`[SplitEngine] Total valid splits: ${allOptions.length}`);
  return allOptions.slice(0, 5);
}

/**
 * Search a single hub with timeout
 * Returns null on failure (doesn't kill the whole search)
 */
async function searchHubWithTimeout(
  origin: string,
  destination: string,
  date: string,
  hub: string,
  directPrice: number,
  timeoutMs: number
): Promise<SplitTicketOption[] | null> {
  return Promise.race([
    searchHub(origin, destination, date, hub, directPrice),
    new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]).catch(() => null);  // Return null on timeout/error
}

/**
 * Search flights via a specific hub
 */
async function searchHub(
  origin: string,
  destination: string,
  date: string,
  hub: string,
  directPrice: number
): Promise<SplitTicketOption[]> {
  const results: SplitTicketOption[] = [];
  
  try {
    // Search both legs in parallel
    const [leg1Flights, leg2Flights] = await Promise.all([
      scrapeGoogleFlightsReal(origin, hub, date, { maxResults: 3 }),
      scrapeGoogleFlightsReal(hub, destination, date, { maxResults: 3 })
    ]);
    
    if (leg1Flights.length === 0 || leg2Flights.length === 0) {
      return results;
    }
    
    // Find valid combinations
    for (const leg1 of leg1Flights) {
      for (const leg2 of leg2Flights) {
        const option = createSplitOption(leg1, leg2, hub, directPrice);
        if (option) {
          results.push(option);
        }
      }
    }
    
  } catch (error) {
    console.error(`[SplitEngine] Error searching hub ${hub}:`, error);
  }
  
  return results;
}

/**
 * Create a split ticket option if the connection is valid
 */
function createSplitOption(
  leg1: RealFlight,
  leg2: RealFlight,
  hub: string,
  directPrice: number
): SplitTicketOption | null {
  // Parse times
  const leg1Arrival = parseTime(leg1.arrival.time, leg1.arrival.date);
  const leg2Departure = parseTime(leg2.departure.time, leg2.departure.date);
  
  if (!leg1Arrival || !leg2Departure) return null;
  
  const transferTime = Math.round((leg2Departure.getTime() - leg1Arrival.getTime()) / 60000);
  const minRequired = MIN_CONNECTION_TIMES[hub] || MIN_CONNECTION_TIMES['DEFAULT'];
  
  // Skip impossible connections
  if (transferTime < minRequired - 30) return null;
  
  const riskScore = calculateRiskScore(transferTime, minRequired);
  
  // Skip very high risk
  if (riskScore > 80) return null;
  
  const totalPrice = leg1.price + leg2.price;
  const savings = directPrice - totalPrice;
  
  // Must save money
  if (savings <= 0) return null;
  
  const warnings: string[] = [];
  if (riskScore > 50) warnings.push('Tight connection - risk of missing flight');
  if (leg1.airline !== leg2.airline) warnings.push('Self-transfer - collect and re-check bags');
  if (transferTime > 480) warnings.push('Long layover - consider exploring the city');
  
  return {
    id: `split-${hub}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    legs: [
      {
        from: leg1.departure.airport,
        to: leg1.arrival.airport,
        airline: leg1.airline,
        flightNumber: leg1.flightNumber || `${leg1.airlineCode}XXX`,
        departure: `${leg1.departure.date}T${leg1.departure.time}`,
        arrival: `${leg1.arrival.date}T${leg1.arrival.time}`,
        price: leg1.price,
        currency: leg1.currency,
        bookingLink: leg1.bookingLink
      },
      {
        from: leg2.departure.airport,
        to: leg2.arrival.airport,
        airline: leg2.airline,
        flightNumber: leg2.flightNumber || `${leg2.airlineCode}XXX`,
        departure: `${leg2.departure.date}T${leg2.departure.time}`,
        arrival: `${leg2.arrival.date}T${leg2.arrival.time}`,
        price: leg2.price,
        currency: leg2.currency,
        bookingLink: leg2.bookingLink
      }
    ],
    totalPrice,
    directPrice,
    savings,
    currency: 'GBP',
    transferTime,
    riskScore,
    feasibility: getFeasibility(riskScore),
    warnings
  };
}

function parseTime(timeStr: string, dateStr: string): Date | null {
  if (!timeStr || !dateStr) return null;
  
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  let adjustedHours = hours;
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) adjustedHours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) adjustedHours = 0;
  }
  
  const date = new Date(dateStr);
  date.setHours(adjustedHours, minutes, 0, 0);
  return date;
}

function calculateRiskScore(transferTime: number, minRequired: number): number {
  const buffer = transferTime - minRequired;
  
  if (buffer >= 120) return 10;
  if (buffer >= 60) return 25;
  if (buffer >= 30) return 50;
  if (buffer >= 0) return 75;
  return 100;
}

function getFeasibility(riskScore: number): 'good' | 'tight' | 'risky' {
  if (riskScore <= 25) return 'good';
  if (riskScore <= 50) return 'tight';
  return 'risky';
}

// Backward compatibility
export async function findSplitTickets(
  origin: string,
  destination: string,
  departureDate: string,
  directPrice: number,
  options?: { maxHubs?: number }
): Promise<SplitTicketOption[]> {
  return findSplitTicketsParallel(origin, destination, departureDate, directPrice, options);
}
