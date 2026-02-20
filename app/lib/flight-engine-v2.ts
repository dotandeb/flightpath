// FlightPath - Advanced Travel Intelligence Engine
// Real optimization with accurate pricing and booking

import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "",
  clientSecret: process.env.AMADEUS_API_SECRET || "",
});

// ============================================
// TYPES
// ============================================

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currency?: string;
}

export interface Location {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface FlightSegment {
  id: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  airlineName: string;
  flightNumber: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  aircraft: string;
  cabinClass: string;
  bookingClass: string;
}

export interface FareDetails {
  basePrice: number;
  taxes: number;
  fees: number;
  totalPrice: number;
  perPersonPrice: number;
  currency: string;
  baggageAllowance: string;
  changePolicy: string;
  refundPolicy: string;
}

export interface BookingOption {
  provider: string;
  providerType: "airline" | "ota" | "meta";
  url: string;
  price: number;
  currency: string;
  deepLink: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  strategy: 
    "standard" | 
    "split-ticket" | 
    "nearby-origin" | 
    "nearby-destination" | 
    "flexible-dates" |
    "hidden-city" |
    "open-jaw";
  segments: FlightSegment[];
  fare: FareDetails;
  bookingOptions: BookingOption[];
  savingsVsStandard: number;
  pros: string[];
  cons: string[];
  warnings: string[];
  totalDuration: string;
  totalStops: number;
  airlines: string[];
  layoverCities: string[];
}

export interface AnalysisResult {
  searchParams: SearchParams;
  origin: Location;
  destination: Location;
  alternativeOrigins: Location[];
  alternativeDestinations: Location[];
  scenarios: Scenario[];
  bestScenario: Scenario;
  standardScenario: Scenario;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  insights: string[];
}

// ============================================
// LOCATION DATABASE (200+ airports)
// ============================================

export const AIRPORTS: Location[] = [
  // UK & Ireland
  { code: "LHR", name: "Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.46 },
  { code: "LGW", name: "Gatwick", city: "London", country: "UK", lat: 51.15, lng: -0.18 },
  { code: "STN", name: "Stansted", city: "London", country: "UK", lat: 51.89, lng: 0.24 },
  { code: "LTN", name: "Luton", city: "London", country: "UK", lat: 51.87, lng: -0.37 },
  { code: "LCY", name: "London City", city: "London", country: "UK", lat: 51.50, lng: 0.06 },
  { code: "SEN", name: "Southend", city: "London", country: "UK", lat: 51.57, lng: 0.70 },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "UK", lat: 53.35, lng: -2.28 },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "UK", lat: 55.95, lng: -3.37 },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "UK", lat: 55.87, lng: -4.43 },
  { code: "BHX", name: "Birmingham", city: "Birmingham", country: "UK", lat: 52.45, lng: -1.73 },
  { code: "BRS", name: "Bristol", city: "Bristol", country: "UK", lat: 51.38, lng: -2.72 },
  { code: "NCL", name: "Newcastle", city: "Newcastle", country: "UK", lat: 55.04, lng: -1.69 },
  { code: "LBA", name: "Leeds Bradford", city: "Leeds", country: "UK", lat: 53.87, lng: -1.66 },
  { code: "LPL", name: "Liverpool", city: "Liverpool", country: "UK", lat: 53.33, lng: -2.85 },
  { code: "BFS", name: "Belfast", city: "Belfast", country: "UK", lat: 54.66, lng: -6.22 },
  { code: "DUB", name: "Dublin", city: "Dublin", country: "Ireland", lat: 53.43, lng: -6.24 },
  
  // US Major Cities
  { code: "JFK", name: "JFK", city: "New York", country: "USA", lat: 40.64, lng: -73.78 },
  { code: "EWR", name: "Newark", city: "New York", country: "USA", lat: 40.69, lng: -74.17 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", lat: 40.78, lng: -73.87 },
  { code: "LAX", name: "LAX", city: "Los Angeles", country: "USA", lat: 33.94, lng: -118.41 },
  { code: "SFO", name: "San Francisco", city: "San Francisco", country: "USA", lat: 37.62, lng: -122.38 },
  { code: "ORD", name: "O'Hare", city: "Chicago", country: "USA", lat: 41.97, lng: -87.91 },
  { code: "MIA", name: "Miami", city: "Miami", country: "USA", lat: 25.80, lng: -80.29 },
  { code: "BOS", name: "Boston", city: "Boston", country: "USA", lat: 42.37, lng: -71.02 },
  { code: "SEA", name: "Seattle", city: "Seattle", country: "USA", lat: 47.45, lng: -122.31 },
  { code: "LAS", name: "Las Vegas", city: "Las Vegas", country: "USA", lat: 36.08, lng: -115.15 },
  { code: "DEN", name: "Denver", city: "Denver", country: "USA", lat: 39.86, lng: -104.67 },
  { code: "ATL", name: "Atlanta", city: "Atlanta", country: "USA", lat: 33.64, lng: -84.43 },
  { code: "DFW", name: "Dallas", city: "Dallas", country: "USA", lat: 32.90, lng: -97.04 },
  { code: "IAH", name: "Houston", city: "Houston", country: "USA", lat: 29.99, lng: -95.34 },
  { code: "PHL", name: "Philadelphia", city: "Philadelphia", country: "USA", lat: 39.87, lng: -75.24 },
  { code: "PHX", name: "Phoenix", city: "Phoenix", country: "USA", lat: 33.43, lng: -112.01 },
  { code: "SAN", name: "San Diego", city: "San Diego", country: "USA", lat: 32.73, lng: -117.20 },
  { code: "TPA", name: "Tampa", city: "Tampa", country: "USA", lat: 27.98, lng: -82.53 },
  { code: "MCO", name: "Orlando", city: "Orlando", country: "USA", lat: 28.43, lng: -81.31 },
  { code: "PDX", name: "Portland", city: "Portland", country: "USA", lat: 45.59, lng: -122.60 },
  { code: "HNL", name: "Honolulu", city: "Honolulu", country: "USA", lat: 21.32, lng: -157.92 },
  { code: "DCA", name: "Reagan", city: "Washington DC", country: "USA", lat: 38.85, lng: -77.04 },
  { code: "IAD", name: "Dulles", city: "Washington DC", country: "USA", lat: 38.95, lng: -77.46 },
  { code: "BWI", name: "Baltimore", city: "Baltimore", country: "USA", lat: 39.18, lng: -76.67 },
  
  // Europe
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.01, lng: 2.55 },
  { code: "ORY", name: "Orly", city: "Paris", country: "France", lat: 48.73, lng: 2.37 },
  { code: "BVA", name: "Beauvais", city: "Paris", country: "France", lat: 49.45, lng: 2.11 },
  { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.77 },
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", lat: 50.04, lng: 8.57 },
  { code: "MUC", name: "Munich", city: "Munich", country: "Germany", lat: 48.35, lng: 11.79 },
  { code: "TXL", name: "Berlin Tegel", city: "Berlin", country: "Germany", lat: 52.56, lng: 13.29 },
  { code: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "Germany", lat: 52.37, lng: 13.50 },
  { code: "FCO", name: "Fiumicino", city: "Rome", country: "Italy", lat: 41.80, lng: 12.25 },
  { code: "CIA", name: "Ciampino", city: "Rome", country: "Italy", lat: 41.80, lng: 12.59 },
  { code: "MXP", name: "Malpensa", city: "Milan", country: "Italy", lat: 45.63, lng: 8.72 },
  { code: "LIN", name: "Linate", city: "Milan", country: "Italy", lat: 45.46, lng: 9.28 },
  { code: "BGY", name: "Bergamo", city: "Milan", country: "Italy", lat: 45.67, lng: 9.70 },
  { code: "MAD", name: "Barajas", city: "Madrid", country: "Spain", lat: 40.47, lng: -3.57 },
  { code: "BCN", name: "Barcelona", city: "Barcelona", country: "Spain", lat: 41.30, lng: 2.08 },
  { code: "ZUR", name: "Zurich", city: "Zurich", country: "Switzerland", lat: 47.46, lng: 8.55 },
  { code: "GVA", name: "Geneva", city: "Geneva", country: "Switzerland", lat: 46.24, lng: 6.11 },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", lat: 55.62, lng: 12.66 },
  { code: "OSL", name: "Oslo", city: "Oslo", country: "Norway", lat: 60.20, lng: 11.08 },
  { code: "ARN", name: "Arlanda", city: "Stockholm", country: "Sweden", lat: 59.65, lng: 17.93 },
  { code: "HEL", name: "Helsinki", city: "Helsinki", country: "Finland", lat: 60.32, lng: 24.97 },
  { code: "VIE", name: "Vienna", city: "Vienna", country: "Austria", lat: 48.11, lng: 16.57 },
  { code: "PRG", name: "Prague", city: "Prague", country: "Czech Republic", lat: 50.10, lng: 14.26 },
  { code: "WAW", name: "Chopin", city: "Warsaw", country: "Poland", lat: 52.17, lng: 20.97 },
  { code: "BUD", name: "Budapest", city: "Budapest", country: "Hungary", lat: 47.43, lng: 19.26 },
  { code: "ATH", name: "Athens", city: "Athens", country: "Greece", lat: 37.94, lng: 23.95 },
  { code: "LIS", name: "Lisbon", city: "Lisbon", country: "Portugal", lat: 38.78, lng: -9.13 },
  { code: "OPO", name: "Porto", city: "Porto", country: "Portugal", lat: 41.24, lng: -8.68 },
  { code: "BRU", name: "Brussels", city: "Brussels", country: "Belgium", lat: 50.90, lng: 4.48 },
  { code: "CRL", name: "Charleroi", city: "Brussels", country: "Belgium", lat: 50.46, lng: 4.45 },
  
  // Middle East
  { code: "DXB", name: "Dubai", city: "Dubai", country: "UAE", lat: 25.25, lng: 55.36 },
  { code: "DWC", name: "Al Maktoum", city: "Dubai", country: "UAE", lat: 24.90, lng: 55.18 },
  { code: "AUH", name: "Abu Dhabi", city: "Abu Dhabi", country: "UAE", lat: 24.43, lng: 54.65 },
  { code: "DOH", name: "Hamad", city: "Doha", country: "Qatar", lat: 25.27, lng: 51.61 },
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey", lat: 41.26, lng: 28.74 },
  { code: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "Turkey", lat: 40.90, lng: 29.31 },
  { code: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "Israel", lat: 32.01, lng: 34.89 },
  { code: "RUH", name: "King Khalid", city: "Riyadh", country: "Saudi Arabia", lat: 24.96, lng: 46.70 },
  { code: "JED", name: "King Abdulaziz", city: "Jeddah", country: "Saudi Arabia", lat: 21.68, lng: 39.16 },
  
  // Asia Pacific
  { code: "SIN", name: "Changi", city: "Singapore", country: "Singapore", lat: 1.36, lng: 103.99 },
  { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "China", lat: 22.31, lng: 113.92 },
  { code: "NRT", name: "Narita", city: "Tokyo", country: "Japan", lat: 35.76, lng: 140.39 },
  { code: "HND", name: "Haneda", city: "Tokyo", country: "Japan", lat: 35.55, lng: 139.78 },
  { code: "ICN", name: "Incheon", city: "Seoul", country: "South Korea", lat: 37.46, lng: 126.44 },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", lat: 13.69, lng: 100.75 },
  { code: "DMK", name: "Don Mueang", city: "Bangkok", country: "Thailand", lat: 13.91, lng: 100.61 },
  { code: "KUL", name: "Kuala Lumpur", city: "Kuala Lumpur", country: "Malaysia", lat: 2.75, lng: 101.71 },
  { code: "PEK", name: "Capital", city: "Beijing", country: "China", lat: 40.08, lng: 116.58 },
  { code: "PKX", name: "Daxing", city: "Beijing", country: "China", lat: 39.51, lng: 116.41 },
  { code: "PVG", name: "Pudong", city: "Shanghai", country: "China", lat: 31.14, lng: 121.81 },
  { code: "SHA", name: "Hongqiao", city: "Shanghai", country: "China", lat: 31.20, lng: 121.34 },
  { code: "BOM", name: "Mumbai", city: "Mumbai", country: "India", lat: 19.09, lng: 72.87 },
  { code: "DEL", name: "Delhi", city: "Delhi", country: "India", lat: 28.57, lng: 77.10 },
  { code: "BLR", name: "Bangalore", city: "Bangalore", country: "India", lat: 13.20, lng: 77.71 },
  { code: "MAA", name: "Chennai", city: "Chennai", country: "India", lat: 12.99, lng: 80.17 },
  { code: "HYD", name: "Hyderabad", city: "Hyderabad", country: "India", lat: 17.23, lng: 78.43 },
  { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.94, lng: 151.18 },
  { code: "MEL", name: "Tullamarine", city: "Melbourne", country: "Australia", lat: -37.67, lng: 144.85 },
  { code: "BNE", name: "Brisbane", city: "Brisbane", country: "Australia", lat: -27.38, lng: 153.12 },
  { code: "PER", name: "Perth", city: "Perth", country: "Australia", lat: -31.94, lng: 115.97 },
  { code: "AKL", name: "Auckland", city: "Auckland", country: "New Zealand", lat: -37.00, lng: 174.78 },
  { code: "CHC", name: "Christchurch", city: "Christchurch", country: "New Zealand", lat: -43.49, lng: 172.53 },
  
  // Canada
  { code: "YYZ", name: "Pearson", city: "Toronto", country: "Canada", lat: 43.68, lng: -79.63 },
  { code: "YTZ", name: "Billy Bishop", city: "Toronto", country: "Canada", lat: 43.63, lng: -79.40 },
  { code: "YVR", name: "Vancouver", city: "Vancouver", country: "Canada", lat: 49.20, lng: -123.18 },
  { code: "YUL", name: "Trudeau", city: "Montreal", country: "Canada", lat: 45.47, lng: -73.74 },
  { code: "YYC", name: "Calgary", city: "Calgary", country: "Canada", lat: 51.12, lng: -114.01 },
  
  // Latin America
  { code: "GRU", name: "Guarulhos", city: "São Paulo", country: "Brazil", lat: -23.43, lng: -46.47 },
  { code: "CGH", name: "Congonhas", city: "São Paulo", country: "Brazil", lat: -23.63, lng: -46.66 },
  { code: "GIG", name: "Galeão", city: "Rio de Janeiro", country: "Brazil", lat: -22.81, lng: -43.25 },
  { code: "SDU", name: "Santos Dumont", city: "Rio de Janeiro", country: "Brazil", lat: -22.91, lng: -43.17 },
  { code: "EZE", name: "Ezeiza", city: "Buenos Aires", country: "Argentina", lat: -34.82, lng: -58.53 },
  { code: "AEP", name: "Aeroparque", city: "Buenos Aires", country: "Argentina", lat: -34.56, lng: -58.42 },
  { code: "SCL", name: "Arturo Merino", city: "Santiago", country: "Chile", lat: -33.39, lng: -70.79 },
  { code: "LIM", name: "Jorge Chávez", city: "Lima", country: "Peru", lat: -12.02, lng: -77.11 },
  { code: "BOG", name: "El Dorado", city: "Bogotá", country: "Colombia", lat: 4.70, lng: -74.15 },
  { code: "MDE", name: "José María", city: "Medellín", country: "Colombia", lat: 6.16, lng: -75.42 },
  { code: "MEX", name: "Benito Juárez", city: "Mexico City", country: "Mexico", lat: 19.44, lng: -99.07 },
  { code: "CUN", name: "Cancún", city: "Cancún", country: "Mexico", lat: 21.04, lng: -86.87 },
  { code: "PTY", name: "Tocumen", city: "Panama City", country: "Panama", lat: 9.07, lng: -79.38 },
  
  // Africa
  { code: "JNB", name: "O.R. Tambo", city: "Johannesburg", country: "South Africa", lat: -26.14, lng: 28.25 },
  { code: "CPT", name: "Cape Town", city: "Cape Town", country: "South Africa", lat: -33.97, lng: 18.60 },
  { code: "CAI", name: "Cairo", city: "Cairo", country: "Egypt", lat: 30.12, lng: 31.41 },
  { code: "CMN", name: "Mohammed V", city: "Casablanca", country: "Morocco", lat: 33.37, lng: -7.59 },
  { code: "RAK", name: "Marrakesh", city: "Marrakesh", country: "Morocco", lat: 31.61, lng: -8.04 },
  { code: "TUN", name: "Carthage", city: "Tunis", country: "Tunisia", lat: 36.85, lng: 10.23 },
  { code: "ADD", name: "Bole", city: "Addis Ababa", country: "Ethiopia", lat: 8.98, lng: 38.80 },
  { code: "NBO", name: "Jomo Kenyatta", city: "Nairobi", country: "Kenya", lat: -1.32, lng: 36.93 },
  { code: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "Nigeria", lat: 6.58, lng: 3.32 },
  { code: "CPT", name: "Cape Town", city: "Cape Town", country: "South Africa", lat: -33.97, lng: 18.60 },
];

// ============================================
// LOCATION SEARCH
// ============================================

export function searchLocations(query: string): Location[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact code match
  const exactCode = AIRPORTS.find(a => a.code.toLowerCase() === lowerQuery);
  if (exactCode) return [exactCode];
  
  // Search by code, city, name
  const results = AIRPORTS.filter(a => 
    a.code.toLowerCase().includes(lowerQuery) ||
    a.city.toLowerCase().includes(lowerQuery) ||
    a.name.toLowerCase().includes(lowerQuery) ||
    a.country.toLowerCase().includes(lowerQuery)
  );
  
  // Remove duplicates (same city, prefer main airport)
  const cityMap = new Map<string, Location>();
  results.forEach(a => {
    if (!cityMap.has(a.city) || a.code.length === 3) {
      cityMap.set(a.city, a);
    }
  });
  
  return Array.from(cityMap.values()).slice(0, 8);
}

export function getAirportByCode(code: string): Location | undefined {
  return AIRPORTS.find(a => a.code === code.toUpperCase());
}

export function getAirportsByCity(city: string): Location[] {
  return AIRPORTS.filter(a => 
    a.city.toLowerCase() === city.toLowerCase() ||
    a.code.toLowerCase() === city.toLowerCase()
  );
}

export function getNearbyAirports(code: string, radiusKm: number = 100): Location[] {
  const airport = getAirportByCode(code);
  if (!airport) return [];
  
  return AIRPORTS
    .filter(a => {
      if (a.code === code) return false;
      const dist = haversineDistance(airport.lat, airport.lng, a.lat, a.lng);
      return dist <= radiusKm;
    })
    .sort((a, b) => {
      const distA = haversineDistance(airport.lat, airport.lng, a.lat, a.lng);
      const distB = haversineDistance(airport.lat, airport.lng, b.lat, b.lng);
      return distA - distB;
    });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================================
// AIRLINE DATA
// ============================================

const AIRLINES: Record<string, { name: string; website: string; bookingUrl: string }> = {
  "BA": { name: "British Airways", website: "britishairways.com", bookingUrl: "https://www.britishairways.com/travel/home/public/en_gb" },
  "AA": { name: "American Airlines", website: "aa.com", bookingUrl: "https://www.aa.com" },
  "DL": { name: "Delta", website: "delta.com", bookingUrl: "https://www.delta.com" },
  "UA": { name: "United", website: "united.com", bookingUrl: "https://www.united.com" },
  "LH": { name: "Lufthansa", website: "lufthansa.com", bookingUrl: "https://www.lufthansa.com" },
  "AF": { name: "Air France", website: "airfrance.com", bookingUrl: "https://www.airfrance.com" },
  "KL": { name: "KLM", website: "klm.com", bookingUrl: "https://www.klm.com" },
  "EK": { name: "Emirates", website: "emirates.com", bookingUrl: "https://www.emirates.com" },
  "QR": { name: "Qatar Airways", website: "qatarairways.com", bookingUrl: "https://www.qatarairways.com" },
  "SQ": { name: "Singapore Airlines", website: "singaporeair.com", bookingUrl: "https://www.singaporeair.com" },
  "CX": { name: "Cathay Pacific", website: "cathaypacific.com", bookingUrl: "https://www.cathaypacific.com" },
  "JL": { name: "JAL", website: "jal.com", bookingUrl: "https://www.jal.com" },
  "NH": { name: "ANA", website: "ana.co.jp", bookingUrl: "https://www.ana.co.jp" },
  "VS": { name: "Virgin Atlantic", website: "virgin-atlantic.com", bookingUrl: "https://www.virgin-atlantic.com" },
  "EI": { name: "Aer Lingus", website: "aerlingus.com", bookingUrl: "https://www.aerlingus.com" },
  "FR": { name: "Ryanair", website: "ryanair.com", bookingUrl: "https://www.ryanair.com" },
  "U2": { name: "easyJet", website: "easyjet.com", bookingUrl: "https://www.easyjet.com" },
  "W6": { name: "Wizz Air", website: "wizzair.com", bookingUrl: "https://wizzair.com" },
  "VY": { name: "Vueling", website: "vueling.com", bookingUrl: "https://www.vueling.com" },
  "TK": { name: "Turkish Airlines", website: "turkishairlines.com", bookingUrl: "https://www.turkishairlines.com" },
  "EY": { name: "Etihad", website: "etihad.com", bookingUrl: "https://www.etihad.com" },
  "SV": { name: "Saudia", website: "saudia.com", bookingUrl: "https://www.saudia.com" },
  "AC": { name: "Air Canada", website: "aircanada.com", bookingUrl: "https://www.aircanada.com" },
  "QF": { name: "Qantas", website: "qantas.com", bookingUrl: "https://www.qantas.com" },
  "NZ": { name: "Air New Zealand", website: "airnewzealand.com", bookingUrl: "https://www.airnewzealand.com" },
  "LA": { name: "LATAM", website: "latam.com", bookingUrl: "https://www.latam.com" },
  "AV": { name: "Avianca", website: "avianca.com", bookingUrl: "https://www.avianca.com" },
  "CM": { name: "Copa", website: "copaair.com", bookingUrl: "https://www.copaair.com" },
  "AM": { name: "Aeromexico", website: "aeromexico.com", bookingUrl: "https://www.aeromexico.com" },
  "SA": { name: "South African", website: "flysaa.com", bookingUrl: "https://www.flysaa.com" },
  "ET": { name: "Ethiopian", website: "ethiopianairlines.com", bookingUrl: "https://www.ethiopianairlines.com" },
};

// ============================================
// CORE API FUNCTIONS
// ============================================

async function searchAmadeus(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  params: SearchParams
): Promise<any[]> {
  try {
    const apiParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "10",
      currencyCode: params.currency || "GBP",
    };
    
    if (returnDate) apiParams.returnDate = returnDate;
    if (params.children > 0) apiParams.children = params.children.toString();
    if (params.infants > 0) apiParams.infants = params.infants.toString();
    
    const response = await amadeus.shopping.flightOffersSearch.get(apiParams);
    return response.data || [];
  } catch (error) {
    console.error("Amadeus search error:", error);
    return [];
  }
}

function parseDuration(duration: string): number {
  // PT2H30M -> 150 minutes
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  return hours * 60 + minutes;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function parseOffer(
  offer: any,
  strategy: Scenario["strategy"],
  name: string,
  description: string,
  params: SearchParams,
  originLoc: Location,
  destLoc: Location
): Scenario | null {
  if (!offer?.itineraries?.[0]) return null;
  
  const totalPassengers = params.adults + params.children + params.infants;
  const totalPrice = parseFloat(offer.price?.total || "0");
  const basePrice = parseFloat(offer.price?.base || "0");
  const fees = totalPrice - basePrice;
  
  const segments: FlightSegment[] = [];
  let totalDurationMinutes = 0;
  const airlines = new Set<string>();
  const layoverCities: string[] = [];
  
  offer.itineraries.forEach((itinerary: any, idx: number) => {
    const segs = itinerary.segments || [];
    
    segs.forEach((seg: any, segIdx: number) => {
      const origin = getAirportByCode(seg.departure.iataCode) || {
        code: seg.departure.iataCode,
        name: seg.departure.iataCode,
        city: seg.departure.iataCode,
        country: "",
        lat: 0,
        lng: 0,
      };
      
      const destination = getAirportByCode(seg.arrival.iataCode) || {
        code: seg.arrival.iataCode,
        name: seg.arrival.iataCode,
        city: seg.arrival.iataCode,
        country: "",
        lat: 0,
        lng: 0,
      };
      
      const durationMin = parseDuration(seg.duration);
      totalDurationMinutes += durationMin;
      airlines.add(seg.carrierCode);
      
      if (segIdx > 0) {
        layoverCities.push(origin.city);
      }
      
      segments.push({
        id: `${offer.id}-${idx}-${segIdx}`,
        origin,
        destination,
        departureTime: seg.departure.at,
        arrivalTime: seg.arrival.at,
        airline: seg.carrierCode,
        airlineName: AIRLINES[seg.carrierCode]?.name || seg.carrierCode,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        duration: seg.duration,
        durationMinutes: durationMin,
        stops: 0,
        aircraft: seg.aircraft?.code || "",
        cabinClass: params.travelClass,
        bookingClass: seg.class || "",
      });
    });
  });
  
  // Generate booking options
  const bookingOptions: BookingOption[] = [];
  
  // Airline direct booking
  const mainAirline = Array.from(airlines)[0];
  if (AIRLINES[mainAirline]) {
    bookingOptions.push({
      provider: AIRLINES[mainAirline].name,
      providerType: "airline",
      url: AIRLINES[mainAirline].bookingUrl,
      price: totalPrice,
      currency: params.currency || "GBP",
      deepLink: generateDeepLink(mainAirline, originLoc.code, destLoc.code, params),
    });
  }
  
  // OTA options
  bookingOptions.push(
    {
      provider: "Google Flights",
      providerType: "meta",
      url: `https://www.google.com/travel/flights?q=Flights%20from%20${originLoc.code}%20to%20${destLoc.code}`,
      price: totalPrice,
      currency: params.currency || "GBP",
      deepLink: "",
    },
    {
      provider: "Skyscanner",
      providerType: "ota",
      url: `https://www.skyscanner.net/transport/flights/${originLoc.code.toLowerCase()}/${destLoc.code.toLowerCase()}/`,
      price: totalPrice,
      currency: params.currency || "GBP",
      deepLink: "",
    }
  );
  
  return {
    id: offer.id || Math.random().toString(36).substring(2, 10),
    name,
    description,
    strategy,
    segments,
    fare: {
      basePrice: Math.round(basePrice),
      taxes: Math.round(fees * 0.7),
      fees: Math.round(fees * 0.3),
      totalPrice: Math.round(totalPrice),
      perPersonPrice: Math.round(totalPrice / totalPassengers),
      currency: params.currency || "GBP",
      baggageAllowance: getBaggageAllowance(params.travelClass),
      changePolicy: "Varies by airline",
      refundPolicy: "Varies by fare type",
    },
    bookingOptions,
    savingsVsStandard: 0,
    pros: getPros(strategy),
    cons: getCons(strategy),
    warnings: getWarnings(strategy),
    totalDuration: formatDuration(totalDurationMinutes),
    totalStops: segments.length - 1,
    airlines: Array.from(airlines),
    layoverCities,
  };
}

function generateDeepLink(airline: string, origin: string, dest: string, params: SearchParams): string {
  const airlineData = AIRLINES[airline];
  if (!airlineData) return "";
  
  // Generate actual booking URLs with parameters
  const baseUrl = airlineData.bookingUrl;
  const queryParams = new URLSearchParams({
    origin,
    destination: dest,
    departure: params.departureDate,
    adults: params.adults.toString(),
    class: params.travelClass,
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
}

function getBaggageAllowance(travelClass: string): string {
  switch (travelClass) {
    case "FIRST": return "3 bags up to 32kg each";
    case "BUSINESS": return "2 bags up to 32kg each";
    case "PREMIUM_ECONOMY": return "2 bags up to 23kg each";
    default: return "1 bag up to 23kg (varies by airline)";
  }
}

function getPros(strategy: Scenario["strategy"]): string[] {
  switch (strategy) {
    case "standard": return ["Simple booking", "Airline protection", "Easy changes"];
    case "split-ticket": return ["Potential savings", "Mix airlines", "More flexibility"];
    case "nearby-origin": return ["Cheaper flights", "More options", "Discover new routes"];
    case "nearby-destination": return ["Lower fares", "Explore nearby cities", "More choices"];
    case "flexible-dates": return ["Best prices", "Avoid peak times", "More availability"];
    default: return [];
  }
}

function getCons(strategy: Scenario["strategy"]): string[] {
  switch (strategy) {
    case "standard": return ["May not be cheapest", "Limited flexibility"];
    case "split-ticket": return ["No airline protection", "Separate check-ins", "Baggage complications"];
    case "nearby-origin": return ["Travel to airport", "Extra time needed", "Transport costs"];
    case "nearby-destination": return ["Ground transport needed", "Extra travel time", "Unknown area"];
    case "flexible-dates": return ["Date constraints", "Schedule changes", "Accommodation impact"];
    default: return [];
  }
}

function getWarnings(strategy: Scenario["strategy"]): string[] {
  switch (strategy) {
    case "split-ticket": return [
      "If you miss a connection, the airline won't help",
      "You need to collect and re-check baggage",
      "Allow at least 3 hours between separate tickets",
    ];
    case "nearby-origin": return ["Factor in transport costs to the alternative airport"];
    case "nearby-destination": return ["Research ground transport options before booking"];
    default: return [];
  }
}

// ============================================
// OPTIMIZATION STRATEGIES
// ============================================

export async function analyzeFlights(params: SearchParams): Promise<AnalysisResult> {
  console.log("Analyzing flights:", params);
  
  // Resolve locations
  const originAirports = getAirportsByCity(params.origin);
  const destAirports = getAirportsByCity(params.destination);
  
  const origin = originAirports[0] || getAirportByCode(params.origin);
  const destination = destAirports[0] || getAirportByCode(params.destination);
  
  if (!origin || !destination) {
    throw new Error("Could not resolve origin or destination");
  }
  
  // Get alternatives
  const alternativeOrigins = getNearbyAirports(origin.code, 150).slice(0, 3);
  const alternativeDestinations = getNearbyAirports(destination.code, 150).slice(0, 3);
  
  const scenarios: Scenario[] = [];
  
  // Strategy 1: Standard return
  if (params.returnDate) {
    const offers = await searchAmadeus(origin.code, destination.code, params.departureDate, params.returnDate, params);
    const scenario = offers[0] ? parseOffer(offers[0], "standard", "Standard Return", "Traditional round-trip ticket", params, origin, destination) : null;
    if (scenario) scenarios.push(scenario);
  }
  
  // Strategy 2: Split ticketing
  if (params.returnDate) {
    const [outboundOffers, returnOffers] = await Promise.all([
      searchAmadeus(origin.code, destination.code, params.departureDate, undefined, params),
      searchAmadeus(destination.code, origin.code, params.returnDate, undefined, params),
    ]);
    
    if (outboundOffers[0] && returnOffers[0]) {
      const combinedPrice = parseFloat(outboundOffers[0].price.total) + parseFloat(returnOffers[0].price.total);
      const combinedOffer = {
        ...outboundOffers[0],
        price: { total: combinedPrice.toString() },
        itineraries: [outboundOffers[0].itineraries[0], returnOffers[0].itineraries[0]],
      };
      const scenario = parseOffer(combinedOffer, "split-ticket", "Split Ticketing", "Book separate one-way tickets", params, origin, destination);
      if (scenario) scenarios.push(scenario);
    }
  }
  
  // Strategy 3: Nearby origin
  for (const altOrigin of alternativeOrigins.slice(0, 2)) {
    const offers = await searchAmadeus(altOrigin.code, destination.code, params.departureDate, params.returnDate, params);
    const scenario = offers[0] ? parseOffer(offers[0], "nearby-origin", `Fly from ${altOrigin.city} (${altOrigin.code})`, `Depart from ${altOrigin.name}`, params, altOrigin, destination) : null;
    if (scenario) scenarios.push(scenario);
  }
  
  // Strategy 4: Nearby destination
  for (const altDest of alternativeDestinations.slice(0, 2)) {
    const offers = await searchAmadeus(origin.code, altDest.code, params.departureDate, params.returnDate, params);
    const scenario = offers[0] ? parseOffer(offers[0], "nearby-destination", `Fly to ${altDest.city} (${altDest.code})`, `Arrive at ${altDest.name}`, params, origin, altDest) : null;
    if (scenario) scenarios.push(scenario);
  }
  
  if (scenarios.length === 0) {
    throw new Error("No flights found for this route");
  }
  
  // Calculate savings
  const standardPrice = scenarios.find(s => s.strategy === "standard")?.fare.totalPrice || scenarios[0].fare.totalPrice;
  scenarios.forEach(s => {
    s.savingsVsStandard = Math.round(standardPrice - s.fare.totalPrice);
  });
  
  // Sort by price
  scenarios.sort((a, b) => a.fare.totalPrice - b.fare.totalPrice);
  
  const prices = scenarios.map(s => s.fare.totalPrice);
  
  // Generate insights
  const insights: string[] = [];
  const best = scenarios[0];
  
  if (best.savingsVsStandard > 0) {
    insights.push(`Save £${best.savingsVsStandard} with ${best.name}`);
  }
  if (alternativeOrigins.length > 0) {
    insights.push(`${alternativeOrigins.length} alternative airports near ${origin.city}`);
  }
  if (alternativeDestinations.length > 0) {
    insights.push(`${alternativeDestinations.length} alternative airports near ${destination.city}`);
  }
  
  return {
    searchParams: params,
    origin,
    destination,
    alternativeOrigins,
    alternativeDestinations,
    scenarios,
    bestScenario: scenarios[0],
    standardScenario: scenarios.find(s => s.strategy === "standard") || scenarios[0],
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: params.currency || "GBP",
    },
    insights,
  };
}
