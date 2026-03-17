/**
 * REAL SPLIT-TICKET ENGINE
 * Combines real flights with transfer feasibility analysis
 */

import { scrapeGoogleFlightsReal } from './scraper-real';
import { validateFlight, ValidatedFlight } from './validation';

export interface SplitTicketLeg {
  from: string;
  to: string;
  airline: string;
  flightNumber: string;
  departure: string;  // ISO datetime
  arrival: string;    // ISO datetime
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
  transferTime: number;  // minutes
  riskScore: number;     // 0-100 (lower is better)
  feasibility: 'good' | 'tight' | 'risky';
  warnings: string[];
}

// Major hubs for split ticketing
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

// Minimum connection times by airport (minutes)
const MIN_CONNECTION_TIMES: Record<string, number> = {
  'DXB': 90,
  'DOH': 90,
  'IST': 90,
  'AMS': 60,
  'CDG': 75,
  'FRA': 60,
  'SIN': 60,
  'HKG': 60,
  'BKK': 90,
  'LHR': 90,
  'JFK': 120,
  'LAX': 90,
  'DEFAULT': 90
};

function getMinConnectionTime(airport: string): number {
  return MIN_CONNECTION_TIMES[airport] || MIN_CONNECTION_TIMES['DEFAULT'];
}

function parseTime(timeStr: string, dateStr: string): Date {
  // Handle various time formats
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function calculateTransferTime(arrival: string, nextDeparture: string): number {
  const arr = new Date(arrival);
  const dep = new Date(nextDeparture);
  return Math.round((dep.getTime() - arr.getTime()) / 60000); // minutes
}

function calculateRiskScore(transferTime: number, minRequired: number): number {
  const buffer = transferTime - minRequired;
  
  if (buffer >= 120) return 10;  // 2+ hours - very safe
  if (buffer >= 60) return 25;   // 1-2 hours - safe
  if (buffer >= 30) return 50;   // 30-60 min - tight
  if (buffer >= 0) return 75;    // 0-30 min - risky
  return 100;                      // Negative - impossible
}

function getFeasibility(riskScore: number): 'good' | 'tight' | 'risky' {
  if (riskScore <= 25) return 'good';
  if (riskScore <= 50) return 'tight';
  return 'risky';
}

/**
 * Find real split-ticket combinations
 */
export async function findSplitTickets(
  origin: string,
  destination: string,
  departureDate: string,
  directPrice: number,
  options: {
    maxHubs?: number;
    returnDate?: string;
  } = {}
): Promise<SplitTicketOption[]> {
  const { maxHubs = 5, returnDate } = options;
  const results: SplitTicketOption[] = [];
  
  console.log(`[SplitEngine] Finding splits ${origin} → ${destination} vs direct £${directPrice}`);
  
  // Filter relevant hubs (not origin/destination)
  const relevantHubs = HUBS.filter(h => h.code !== origin && h.code !== destination).slice(0, maxHubs);
  
  for (const hub of relevantHubs) {
    try {
      // Search leg 1: Origin → Hub
      const leg1Flights = await scrapeGoogleFlightsReal(origin, hub.code, departureDate, { maxResults: 3 });
      
      // Search leg 2: Hub → Destination
      const leg2Flights = await scrapeGoogleFlightsReal(hub.code, destination, departureDate, { maxResults: 3 });
      
      if (leg1Flights.length === 0 || leg2Flights.length === 0) continue;
      
      // Find valid combinations
      for (const leg1 of leg1Flights) {
        for (const leg2 of leg2Flights) {
          // Calculate transfer time
          const leg1Arrival = `${leg1.departure.date}T${leg1.departure.time}`;
          const leg2Departure = `${leg2.departure.date}T${leg2.departure.time}`;
          
          const transferTime = calculateTransferTime(leg1Arrival, leg2Departure);
          const minRequired = getMinConnectionTime(hub.code);
          
          // Skip if impossible connection
          if (transferTime < minRequired - 30) continue;  // Allow 30 min buffer for delays
          
          const riskScore = calculateRiskScore(transferTime, minRequired);
          
          // Skip high-risk connections
          if (riskScore > 80) continue;
          
          const totalPrice = leg1.price + leg2.price;
          const savings = directPrice - totalPrice;
          
          // Only include if saves money
          if (savings <= 0) continue;
          
          const warnings: string[] = [];
          if (riskScore > 50) warnings.push('Tight connection - risk of missing flight');
          if (leg1.airline !== leg2.airline) warnings.push('Self-transfer - collect and re-check bags');
          
          results.push({
            id: `split-${hub.code}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            legs: [
              {
                from: leg1.departure.airport,
                to: leg1.arrival.airport,
                airline: leg1.airline,
                flightNumber: leg1.flightNumber || `${leg1.airlineCode}XXX`,
                departure: leg1Arrival,
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
                departure: leg2Departure,
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
          });
        }
      }
      
      // Add return legs if requested
      if (returnDate) {
        // Similar logic for return - simplified for now
        // Full implementation would search return flights too
      }
      
    } catch (error) {
      console.error(`[SplitEngine] Error with hub ${hub.code}:`, error);
    }
  }
  
  // Sort by savings, then by risk score
  results.sort((a, b) => {
    if (b.savings !== a.savings) return b.savings - a.savings;
    return a.riskScore - b.riskScore;
  });
  
  console.log(`[SplitEngine] Found ${results.length} valid split options`);
  return results.slice(0, 5);  // Top 5
}
