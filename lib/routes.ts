/**
 * Route database for flight search
 */

export const AIRLINES: Record<string, { name: string; code: string }> = {
  'BA': { name: 'British Airways', code: 'BA' },
  'VS': { name: 'Virgin Atlantic', code: 'VS' },
  'AA': { name: 'American Airlines', code: 'AA' },
  'DL': { name: 'Delta', code: 'DL' },
  'UA': { name: 'United', code: 'UA' },
  'AF': { name: 'Air France', code: 'AF' },
  'KL': { name: 'KLM', code: 'KL' },
  'LH': { name: 'Lufthansa', code: 'LH' },
  'EK': { name: 'Emirates', code: 'EK' },
  'SQ': { name: 'Singapore Airlines', code: 'SQ' },
  'CX': { name: 'Cathay Pacific', code: 'CX' },
  'QR': { name: 'Qatar Airways', code: 'QR' },
  'IB': { name: 'Iberia', code: 'IB' },
  'AY': { name: 'Finnair', code: 'AY' },
  'SK': { name: 'SAS', code: 'SK' },
  'TP': { name: 'TAP', code: 'TP' },
  'U2': { name: 'easyJet', code: 'U2' },
  'FR': { name: 'Ryanair', code: 'FR' },
};

export const AIRLINE_ROUTES: Record<string, {
  airlines: string[];
  basePrice: number;
  duration: string;
  durationMinutes: number;
  departureTimes: string[];
  arrivalTimes: string[];
  flightNumberStart: number;
}> = {
  'LHR-JFK': {
    airlines: ['BA', 'VS', 'AA', 'DL', 'UA'],
    basePrice: 450,
    duration: '7h 30m',
    durationMinutes: 450,
    departureTimes: ['10:00', '14:00', '18:00', '20:00'],
    arrivalTimes: ['13:30', '17:30', '21:30', '23:30'],
    flightNumberStart: 100,
  },
  'JFK-LHR': {
    airlines: ['BA', 'VS', 'AA', 'DL'],
    basePrice: 470,
    duration: '7h 00m',
    durationMinutes: 420,
    departureTimes: ['09:00', '13:00', '19:00', '22:00'],
    arrivalTimes: ['21:00', '01:00', '07:00', '10:00'],
    flightNumberStart: 150,
  },
  'LHR-LAX': {
    airlines: ['BA', 'VS', 'AA', 'UA', 'NZ'],
    basePrice: 520,
    duration: '11h 00m',
    durationMinutes: 660,
    departureTimes: ['12:00', '16:00'],
    arrivalTimes: ['15:00', '19:00'],
    flightNumberStart: 200,
  },
  'LHR-DXB': {
    airlines: ['EK', 'BA', 'QF'],
    basePrice: 380,
    duration: '6h 45m',
    durationMinutes: 405,
    departureTimes: ['09:00', '14:00', '20:00'],
    arrivalTimes: ['19:45', '00:45', '06:45'],
    flightNumberStart: 250,
  },
  'LHR-SIN': {
    airlines: ['SQ', 'BA', 'QF'],
    basePrice: 580,
    duration: '12h 50m',
    durationMinutes: 770,
    departureTimes: ['11:00', '19:00'],
    arrivalTimes: ['06:50', '14:50'],
    flightNumberStart: 300,
  },
  'LHR-CDG': {
    airlines: ['BA', 'AF', 'U2'],
    basePrice: 120,
    duration: '1h 20m',
    durationMinutes: 80,
    departureTimes: ['07:00', '12:00', '17:00'],
    arrivalTimes: ['09:20', '14:20', '19:20'],
    flightNumberStart: 350,
  },
  'LHR-AMS': {
    airlines: ['BA', 'KL', 'U2'],
    basePrice: 95,
    duration: '1h 15m',
    durationMinutes: 75,
    departureTimes: ['08:00', '13:00', '18:00'],
    arrivalTimes: ['10:15', '15:15', '20:15'],
    flightNumberStart: 400,
  },
  'LHR-FRA': {
    airlines: ['BA', 'LH'],
    basePrice: 140,
    duration: '1h 40m',
    durationMinutes: 100,
    departureTimes: ['08:00', '14:00'],
    arrivalTimes: ['10:40', '16:40'],
    flightNumberStart: 450,
  },
};

export function getAirlineForRoute(origin: string, destination: string): string | null {
  const routeKey = `${origin}-${destination}`;
  const route = AIRLINE_ROUTES[routeKey];
  return route?.airlines[0] || null;
}

export function getAirlinesByRoute(origin: string, destination: string): string[] {
  const routeKey = `${origin}-${destination}`;
  const reverseKey = `${destination}-${origin}`;
  return AIRLINE_ROUTES[routeKey]?.airlines || AIRLINE_ROUTES[reverseKey]?.airlines || [];
}

// Common hub airports for split ticket generation
export const HUB_AIRPORTS = ['LHR', 'CDG', 'FRA', 'AMS', 'DXB', 'DOH', 'SIN', 'HKG', 'IST'];

// Popular connection routes
export const CONNECTION_ROUTES: Record<string, string[]> = {
  'LON': ['DXB', 'DOH', 'SIN', 'HKG', 'IST', 'AMS', 'CDG', 'FRA'],
  'NYC': ['LHR', 'CDG', 'FRA', 'AMS', 'DXB', 'DOH'],
  'LAX': ['NRT', 'HKG', 'SIN', 'DXB', 'LHR', 'FRA'],
  'SYD': ['SIN', 'HKG', 'DXB', 'DOH', 'NRT'],
  'BKK': ['SIN', 'HKG', 'DXB', 'DOH'],
};
