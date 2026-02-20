// FlightPath - Travel Intelligence Engine
// Core optimization algorithms for finding the best flight deals

import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "",
  clientSecret: process.env.AMADEUS_API_SECRET || "",
});

// ============================================
// TYPES
// ============================================

export interface SearchParams {
  origin: string;  // Can be city name, airport code, or "London, UK"
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  flexibleDates?: boolean;
  maxStops?: number;
}

export interface Location {
  code: string;  // IATA code
  name: string;  // Airport name
  city: string;
  country: string;
  type: "airport" | "city";
  lat?: number;
  lng?: number;
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
  stops: number;
  aircraft?: string;
  price: number;
  cabinClass: string;
  bookingLink: string;
}

export interface FlightOption {
  id: string;
  strategy: string;
  strategyDescription: string;
  segments: FlightSegment[];
  totalPrice: number;
  perPersonPrice: number;
  totalDuration: string;
  stops: number;
  airlines: string[];
  savingsVsStandard: number;
  risks?: string[];
  bookingLinks: {
    airline: string;
    url: string;
    price: number;
  }[];
}

export interface OptimizationResult {
  searchParams: SearchParams;
  originLocations: Location[];
  destinationLocations: Location[];
  standardOption: FlightOption;
  optimizedOptions: FlightOption[];
  bestOption: FlightOption;
  strategies: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

// ============================================
// LOCATION DATABASE
// ============================================

export const LOCATION_DATABASE: Location[] = [
  // London Area
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "UK", type: "airport", lat: 51.47, lng: -0.46 },
  { code: "LGW", name: "Gatwick Airport", city: "London", country: "UK", type: "airport", lat: 51.15, lng: -0.18 },
  { code: "STN", name: "Stansted Airport", city: "London", country: "UK", type: "airport", lat: 51.89, lng: 0.24 },
  { code: "LTN", name: "Luton Airport", city: "London", country: "UK", type: "airport", lat: 51.87, lng: -0.37 },
  { code: "LCY", name: "London City Airport", city: "London", country: "UK", type: "airport", lat: 51.50, lng: 0.06 },
  { code: "SEN", name: "Southend Airport", city: "London", country: "UK", type: "airport", lat: 51.57, lng: 0.70 },
  
  // New York Area
  { code: "JFK", name: "John F. Kennedy", city: "New York", country: "USA", type: "airport", lat: 40.64, lng: -73.78 },
  { code: "EWR", name: "Newark Liberty", city: "New York", country: "USA", type: "airport", lat: 40.69, lng: -74.17 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", type: "airport", lat: 40.78, lng: -73.87 },
  
  // Paris Area
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", type: "airport", lat: 49.01, lng: 2.55 },
  { code: "ORY", name: "Orly Airport", city: "Paris", country: "France", type: "airport", lat: 48.73, lng: 2.37 },
  { code: "BVA", name: "Beauvais", city: "Paris", country: "France", type: "airport", lat: 49.45, lng: 2.11 },
  
  // Major European Hubs
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", type: "airport", lat: 52.31, lng: 4.77 },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", type: "airport", lat: 50.04, lng: 8.57 },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", type: "airport", lat: 48.35, lng: 11.79 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", type: "airport", lat: 41.80, lng: 12.25 },
  { code: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", type: "airport", lat: 45.63, lng: 8.72 },
  { code: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", type: "airport", lat: 40.47, lng: -3.57 },
  { code: "BCN", name: "Barcelona Airport", city: "Barcelona", country: "Spain", type: "airport", lat: 41.30, lng: 2.08 },
  { code: "ZUR", name: "Zurich Airport", city: "Zurich", country: "Switzerland", type: "airport", lat: 47.46, lng: 8.55 },
  { code: "VIE", name: "Vienna Airport", city: "Vienna", country: "Austria", type: "airport", lat: 48.11, lng: 16.57 },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", type: "airport", lat: 55.62, lng: 12.66 },
  { code: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norway", type: "airport", lat: 60.20, lng: 11.08 },
  { code: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", type: "airport", lat: 59.65, lng: 17.93 },
  { code: "HEL", name: "Helsinki Airport", city: "Helsinki", country: "Finland", type: "airport", lat: 60.32, lng: 24.97 },
  { code: "ATH", name: "Athens Airport", city: "Athens", country: "Greece", type: "airport", lat: 37.94, lng: 23.95 },
  { code: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", type: "airport", lat: 38.78, lng: -9.13 },
  { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", type: "airport", lat: 53.43, lng: -6.24 },
  { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", type: "airport", lat: 50.90, lng: 4.48 },
  { code: "PRG", name: "Prague Airport", city: "Prague", country: "Czech Republic", type: "airport", lat: 50.10, lng: 14.26 },
  { code: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", type: "airport", lat: 52.17, lng: 20.97 },
  { code: "BUD", name: "Budapest Airport", city: "Budapest", country: "Hungary", type: "airport", lat: 47.43, lng: 19.26 },
  
  // UK Regional
  { code: "MAN", name: "Manchester Airport", city: "Manchester", country: "UK", type: "airport", lat: 53.35, lng: -2.28 },
  { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "UK", type: "airport", lat: 55.95, lng: -3.37 },
  { code: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "UK", type: "airport", lat: 55.87, lng: -4.43 },
  { code: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "UK", type: "airport", lat: 52.45, lng: -1.73 },
  { code: "BRS", name: "Bristol Airport", city: "Bristol", country: "UK", type: "airport", lat: 51.38, lng: -2.72 },
  { code: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "UK", type: "airport", lat: 55.04, lng: -1.69 },
  { code: "LBA", name: "Leeds Bradford", city: "Leeds", country: "UK", type: "airport", lat: 53.87, lng: -1.66 },
  { code: "LPL", name: "Liverpool Airport", city: "Liverpool", country: "UK", type: "airport", lat: 53.33, lng: -2.85 },
  
  // US Major Cities
  { code: "LAX", name: "Los Angeles", city: "Los Angeles", country: "USA", type: "airport", lat: 33.94, lng: -118.41 },
  { code: "SFO", name: "San Francisco", city: "San Francisco", country: "USA", type: "airport", lat: 37.62, lng: -122.38 },
  { code: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "USA", type: "airport", lat: 41.97, lng: -87.91 },
  { code: "MIA", name: "Miami Airport", city: "Miami", country: "USA", type: "airport", lat: 25.80, lng: -80.29 },
  { code: "BOS", name: "Boston Logan", city: "Boston", country: "USA", type: "airport", lat: 42.37, lng: -71.02 },
  { code: "SEA", name: "Seattle Tacoma", city: "Seattle", country: "USA", type: "airport", lat: 47.45, lng: -122.31 },
  { code: "LAS", name: "Las Vegas", city: "Las Vegas", country: "USA", type: "airport", lat: 36.08, lng: -115.15 },
  { code: "DEN", name: "Denver Airport", city: "Denver", country: "USA", type: "airport", lat: 39.86, lng: -104.67 },
  { code: "ATL", name: "Atlanta Airport", city: "Atlanta", country: "USA", type: "airport", lat: 33.64, lng: -84.43 },
  { code: "DFW", name: "Dallas Fort Worth", city: "Dallas", country: "USA", type: "airport", lat: 32.90, lng: -97.04 },
  { code: "IAH", name: "Houston Airport", city: "Houston", country: "USA", type: "airport", lat: 29.99, lng: -95.34 },
  { code: "PHL", name: "Philadelphia", city: "Philadelphia", country: "USA", type: "airport", lat: 39.87, lng: -75.24 },
  { code: "PHX", name: "Phoenix Airport", city: "Phoenix", country: "USA", type: "airport", lat: 33.43, lng: -112.01 },
  { code: "SAN", name: "San Diego", city: "San Diego", country: "USA", type: "airport", lat: 32.73, lng: -117.20 },
  { code: "TPA", name: "Tampa Airport", city: "Tampa", country: "USA", type: "airport", lat: 27.98, lng: -82.53 },
  { code: "MCO", name: "Orlando Airport", city: "Orlando", country: "USA", type: "airport", lat: 28.43, lng: -81.31 },
  { code: "PDX", name: "Portland Airport", city: "Portland", country: "USA", type: "airport", lat: 45.59, lng: -122.60 },
  { code: "HNL", name: "Honolulu Airport", city: "Honolulu", country: "USA", type: "airport", lat: 21.32, lng: -157.92 },
  
  // Asia Pacific
  { code: "DXB", name: "Dubai Airport", city: "Dubai", country: "UAE", type: "airport", lat: 25.25, lng: 55.36 },
  { code: "DOH", name: "Doha Airport", city: "Doha", country: "Qatar", type: "airport", lat: 25.27, lng: 51.61 },
  { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", type: "airport", lat: 1.36, lng: 103.99 },
  { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "China", type: "airport", lat: 22.31, lng: 113.92 },
  { code: "NRT", name: "Narita Airport", city: "Tokyo", country: "Japan", type: "airport", lat: 35.76, lng: 140.39 },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", type: "airport", lat: 35.55, lng: 139.78 },
  { code: "ICN", name: "Incheon Airport", city: "Seoul", country: "South Korea", type: "airport", lat: 37.46, lng: 126.44 },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", type: "airport", lat: 13.69, lng: 100.75 },
  { code: "KUL", name: "Kuala Lumpur", city: "Kuala Lumpur", country: "Malaysia", type: "airport", lat: 2.75, lng: 101.71 },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", type: "airport", lat: 40.08, lng: 116.58 },
  { code: "PVG", name: "Pudong Airport", city: "Shanghai", country: "China", type: "airport", lat: 31.14, lng: 121.81 },
  { code: "BOM", name: "Mumbai Airport", city: "Mumbai", country: "India", type: "airport", lat: 19.09, lng: 72.87 },
  { code: "DEL", name: "Delhi Airport", city: "Delhi", country: "India", type: "airport", lat: 28.57, lng: 77.10 },
  { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia", type: "airport", lat: -33.94, lng: 151.18 },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", type: "airport", lat: -37.67, lng: 144.85 },
  { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", type: "airport", lat: -27.38, lng: 153.12 },
  { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", type: "airport", lat: -37.00, lng: 174.78 },
  
  // Other Global Hubs
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", type: "airport", lat: 43.68, lng: -79.63 },
  { code: "YVR", name: "Vancouver Airport", city: "Vancouver", country: "Canada", type: "airport", lat: 49.20, lng: -123.18 },
  { code: "YUL", name: "Montreal Airport", city: "Montreal", country: "Canada", type: "airport", lat: 45.47, lng: -73.74 },
  { code: "GRU", name: "São Paulo", city: "São Paulo", country: "Brazil", type: "airport", lat: -23.43, lng: -46.47 },
  { code: "GIG", name: "Rio de Janeiro", city: "Rio de Janeiro", country: "Brazil", type: "airport", lat: -22.81, lng: -43.25 },
  { code: "EZE", name: "Buenos Aires", city: "Buenos Aires", country: "Argentina", type: "airport", lat: -34.82, lng: -58.53 },
  { code: "SCL", name: "Santiago Airport", city: "Santiago", country: "Chile", type: "airport", lat: -33.39, lng: -70.79 },
  { code: "LIM", name: "Lima Airport", city: "Lima", country: "Peru", type: "airport", lat: -12.02, lng: -77.11 },
  { code: "BOG", name: "Bogotá Airport", city: "Bogotá", country: "Colombia", type: "airport", lat: 4.70, lng: -74.15 },
  { code: "MEX", name: "Mexico City", city: "Mexico City", country: "Mexico", type: "airport", lat: 19.44, lng: -99.07 },
  { code: "CUN", name: "Cancún Airport", city: "Cancún", country: "Mexico", type: "airport", lat: 21.04, lng: -86.87 },
  { code: "JNB", name: "Johannesburg", city: "Johannesburg", country: "South Africa", type: "airport", lat: -26.14, lng: 28.25 },
  { code: "CPT", name: "Cape Town", city: "Cape Town", country: "South Africa", type: "airport", lat: -33.97, lng: 18.60 },
  { code: "CAI", name: "Cairo Airport", city: "Cairo", country: "Egypt", type: "airport", lat: 30.12, lng: 31.41 },
  { code: "CMN", name: "Casablanca", city: "Casablanca", country: "Morocco", type: "airport", lat: 33.37, lng: -7.59 },
  { code: "TUN", name: "Tunis Airport", city: "Tunis", country: "Tunisia", type: "airport", lat: 36.85, lng: 10.23 },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", type: "airport", lat: 41.26, lng: 28.74 },
  { code: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "Turkey", type: "airport", lat: 40.90, lng: 29.31 },
  { code: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "Israel", type: "airport", lat: 32.01, lng: 34.89 },
  { code: "RUH", name: "Riyadh Airport", city: "Riyadh", country: "Saudi Arabia", type: "airport", lat: 24.96, lng: 46.70 },
  { code: "JED", name: "Jeddah Airport", city: "Jeddah", country: "Saudi Arabia", type: "airport", lat: 21.68, lng: 39.16 },
  { code: "KWI", name: "Kuwait Airport", city: "Kuwait City", country: "Kuwait", type: "airport", lat: 29.24, lng: 47.97 },
  { code: "BAH", name: "Bahrain Airport", city: "Manama", country: "Bahrain", type: "airport", lat: 26.27, lng: 50.63 },
  { code: "MCT", name: "Muscat Airport", city: "Muscat", country: "Oman", type: "airport", lat: 23.59, lng: 58.28 },
];

// ============================================
// LOCATION SEARCH
// ============================================

export function searchLocations(query: string): Location[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  // Search by code, city, or airport name
  const results = LOCATION_DATABASE.filter(loc => 
    loc.code.toLowerCase().includes(lowerQuery) ||
    loc.name.toLowerCase().includes(lowerQuery) ||
    loc.city.toLowerCase().includes(lowerQuery) ||
    loc.country.toLowerCase().includes(lowerQuery)
  );
  
  // Sort: exact code match first, then city match, then name match
  return results.sort((a, b) => {
    const aCodeMatch = a.code.toLowerCase() === lowerQuery;
    const bCodeMatch = b.code.toLowerCase() === lowerQuery;
    if (aCodeMatch && !bCodeMatch) return -1;
    if (!aCodeMatch && bCodeMatch) return 1;
    
    const aCityMatch = a.city.toLowerCase().includes(lowerQuery);
    const bCityMatch = b.city.toLowerCase().includes(lowerQuery);
    if (aCityMatch && !bCityMatch) return -1;
    if (!aCityMatch && bCityMatch) return 1;
    
    return 0;
  }).slice(0, 10);
}

// Get all airports for a city
export function getAirportsForCity(cityName: string): Location[] {
  const lowerCity = cityName.toLowerCase();
  return LOCATION_DATABASE.filter(loc => 
    loc.city.toLowerCase() === lowerCity ||
    loc.code.toLowerCase() === lowerCity
  );
}

// Get nearby airports within radius (km)
export function getNearbyAirports(airportCode: string, radiusKm: number = 150): Location[] {
  const airport = LOCATION_DATABASE.find(a => a.code === airportCode.toUpperCase());
  if (!airport || !airport.lat || !airport.lng) return [];
  
  return LOCATION_DATABASE
    .filter(a => {
      if (a.code === airportCode) return false;
      if (!a.lat || !a.lng) return false;
      
      // Haversine distance
      const R = 6371;
      const dLat = (a.lat! - airport.lat!) * Math.PI / 180;
      const dLon = (a.lng! - airport.lng!) * Math.PI / 180;
      const lat1 = airport.lat! * Math.PI / 180;
      const lat2 = a.lat! * Math.PI / 180;
      
      const a1 = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1-a1));
      const distance = R * c;
      
      return distance <= radiusKm;
    })
    .sort((a, b) => {
      // Sort by distance
      const distA = Math.sqrt(Math.pow(a.lat! - airport.lat!, 2) + Math.pow(a.lng! - airport.lng!, 2));
      const distB = Math.sqrt(Math.pow(b.lat! - airport.lat!, 2) + Math.pow(b.lng! - airport.lng!, 2));
      return distA - distB;
    });
}

// ============================================
// OPTIMIZATION STRATEGIES
// ============================================

// Strategy 1: Standard Return Flight
async function searchStandardReturn(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  params: SearchParams
): Promise<FlightOption | null> {
  try {
    const apiParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "3",
      currencyCode: "GBP",
    };
    
    if (params.children > 0) apiParams.children = params.children.toString();
    if (params.infants > 0) apiParams.infants = params.infants.toString();
    
    const response = await amadeus.shopping.flightOffersSearch.get(apiParams);
    const offers = response.data || [];
    
    if (offers.length === 0) return null;
    
    return parseAmadeusOffer(offers[0], "Standard Return", "Regular round-trip ticket", params);
  } catch (error) {
    console.error("Standard search error:", error);
    return null;
  }
}

// Strategy 2: Split Ticketing (separate one-ways)
async function searchSplitTicketing(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  params: SearchParams
): Promise<FlightOption | null> {
  try {
    // Search outbound one-way
    const outboundParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "3",
      currencyCode: "GBP",
    };
    
    // Search return one-way
    const inboundParams: any = {
      originLocationCode: destination,
      destinationLocationCode: origin,
      departureDate: returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "3",
      currencyCode: "GBP",
    };
    
    const [outboundResponse, inboundResponse] = await Promise.all([
      amadeus.shopping.flightOffersSearch.get(outboundParams),
      amadeus.shopping.flightOffersSearch.get(inboundParams),
    ]);
    
    const outboundOffers = outboundResponse.data || [];
    const inboundOffers = inboundResponse.data || [];
    
    if (outboundOffers.length === 0 || inboundOffers.length === 0) return null;
    
    // Combine best outbound + best inbound
    const combinedOffer = {
      ...outboundOffers[0],
      itineraries: [
        outboundOffers[0].itineraries[0],
        inboundOffers[0].itineraries[0],
      ],
      price: {
        total: (
          parseFloat(outboundOffers[0].price.total) + 
          parseFloat(inboundOffers[0].price.total)
        ).toString(),
      },
    };
    
    return parseAmadeusOffer(combinedOffer, "Split Ticketing", "Book separate one-way tickets for potential savings", params, [
      "Separate tickets - no airline protection if you miss connections",
      "Check baggage policies for each ticket separately",
      "Allow extra time between separate bookings",
    ]);
  } catch (error) {
    console.error("Split ticketing error:", error);
    return null;
  }
}

// Strategy 3: Nearby Origin Airport
async function searchNearbyOrigin(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  params: SearchParams
): Promise<FlightOption | null> {
  const nearbyAirports = getNearbyAirports(origin, 150);
  if (nearbyAirports.length === 0) return null;
  
  // Try the closest alternative airport
  const alternativeOrigin = nearbyAirports[0];
  
  try {
    const apiParams: any = {
      originLocationCode: alternativeOrigin.code,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "2",
      currencyCode: "GBP",
    };
    
    const response = await amadeus.shopping.flightOffersSearch.get(apiParams);
    const offers = response.data || [];
    
    if (offers.length === 0) return null;
    
    const option = parseAmadeusOffer(offers[0], `Fly from ${alternativeOrigin.code}`, `Depart from ${alternativeOrigin.name} instead`, params, [
      `You need to travel to ${alternativeOrigin.name} (${alternativeOrigin.code})`,
      `Add transport costs to ${alternativeOrigin.city} in your calculation`,
    ]);
    
    // Update origin in segments
    option.segments.forEach(seg => {
      if (seg.origin.code === origin) {
        seg.origin = alternativeOrigin;
      }
    });
    
    return option;
  } catch (error) {
    return null;
  }
}

// Strategy 4: Nearby Destination Airport
async function searchNearbyDestination(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  params: SearchParams
): Promise<FlightOption | null> {
  const nearbyAirports = getNearbyAirports(destination, 150);
  if (nearbyAirports.length === 0) return null;
  
  const alternativeDest = nearbyAirports[0];
  
  try {
    const apiParams: any = {
      originLocationCode: origin,
      destinationLocationCode: alternativeDest.code,
      departureDate,
      returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      max: "2",
      currencyCode: "GBP",
    };
    
    const response = await amadeus.shopping.flightOffersSearch.get(apiParams);
    const offers = response.data || [];
    
    if (offers.length === 0) return null;
    
    const option = parseAmadeusOffer(offers[0], `Fly to ${alternativeDest.code}`, `Arrive at ${alternativeDest.name} instead`, params, [
      `You land at ${alternativeDest.name} (${alternativeDest.code})`,
      `Add transport costs from ${alternativeDest.city} to your destination`,
    ]);
    
    // Update destination in segments
    option.segments.forEach(seg => {
      if (seg.destination.code === destination) {
        seg.destination = alternativeDest;
      }
    });
    
    return option;
  } catch (error) {
    return null;
  }
}

// Strategy 5: Flexible Dates (±3 days)
async function searchFlexibleDates(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  params: SearchParams
): Promise<FlightOption | null> {
  const offsets = [-3, -2, -1, 1, 2, 3];
  const searches = offsets.map(offset => {
    const dep = new Date(departureDate);
    dep.setDate(dep.getDate() + offset);
    const ret = new Date(returnDate);
    ret.setDate(ret.getDate() + offset);
    
    return searchStandardReturn(
      origin,
      destination,
      dep.toISOString().split("T")[0],
      ret.toISOString().split("T")[0],
      params
    ).then(result => result ? { result, offset } : null);
  });
  
  const results = await Promise.all(searches);
  const validResults = results.filter(r => r !== null);
  
  if (validResults.length === 0) return null;
  
  // Find cheapest
  const best = validResults.reduce((min, curr) => 
    curr!.result.totalPrice < min!.result.totalPrice ? curr : min
  );
  
  const offsetLabel = best!.offset > 0 ? `+${best!.offset}` : `${best!.offset}`;
  best!.result.strategy = `Flexible Dates (${offsetLabel} days)`;
  best!.result.strategyDescription = `Depart ${Math.abs(best!.offset)} days ${best!.offset > 0 ? 'later' : 'earlier'}`;
  
  return best!.result;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseAmadeusOffer(
  offer: any,
  strategy: string,
  description: string,
  params: SearchParams,
  risks?: string[]
): FlightOption {
  const totalPrice = parseFloat(offer.price?.total || "0");
  const totalPassengers = params.adults + params.children + params.infants;
  
  const segments: FlightSegment[] = [];
  const itineraries = offer.itineraries || [];
  
  itineraries.forEach((itinerary: any, idx: number) => {
    const segs = itinerary.segments || [];
    segs.forEach((seg: any) => {
      const originLoc = LOCATION_DATABASE.find(l => l.code === seg.departure.iataCode) || {
        code: seg.departure.iataCode,
        name: seg.departure.iataCode,
        city: seg.departure.iataCode,
        country: "",
        type: "airport",
      };
      
      const destLoc = LOCATION_DATABASE.find(l => l.code === seg.arrival.iataCode) || {
        code: seg.arrival.iataCode,
        name: seg.arrival.iataCode,
        city: seg.arrival.iataCode,
        country: "",
        type: "airport",
      };
      
      segments.push({
        id: `${offer.id}-${idx}-${seg.number}`,
        origin: originLoc,
        destination: destLoc,
        departureTime: seg.departure.at,
        arrivalTime: seg.arrival.at,
        airline: seg.carrierCode,
        airlineName: seg.carrierCode,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        duration: seg.duration || "PT0H",
        stops: 0,
        aircraft: seg.aircraft?.code,
        price: Math.round(totalPrice / totalPassengers),
        cabinClass: params.travelClass,
        bookingLink: generateBookingLink(seg.carrierCode, seg.departure.iataCode, seg.arrival.iataCode, seg.departure.at),
      });
    });
  });
  
  const airlines = [...new Set(segments.map(s => s.airline))];
  
  return {
    id: offer.id || Math.random().toString(36).substring(2, 9),
    strategy,
    strategyDescription: description,
    segments,
    totalPrice: Math.round(totalPrice),
    perPersonPrice: Math.round(totalPrice / totalPassengers),
    totalDuration: itineraries[0]?.duration || "PT0H",
    stops: segments.length - 1,
    airlines,
    savingsVsStandard: 0, // Will be calculated later
    risks,
    bookingLinks: airlines.map(airline => ({
      airline,
      url: `https://www.google.com/travel/flights?q=Flights%20to%20${segments[0]?.destination.city}`,
      price: Math.round(totalPrice),
    })),
  };
}

function generateBookingLink(airline: string, origin: string, dest: string, date: string): string {
  // Generate direct airline or OTA links
  const airlineBookingUrls: Record<string, string> = {
    "BA": "https://www.britishairways.com",
    "AA": "https://www.aa.com",
    "DL": "https://www.delta.com",
    "UA": "https://www.united.com",
    "LH": "https://www.lufthansa.com",
    "AF": "https://www.airfrance.com",
    "KL": "https://www.klm.com",
    "EK": "https://www.emirates.com",
    "QR": "https://www.qatarairways.com",
    "SQ": "https://www.singaporeair.com",
    "CX": "https://www.cathaypacific.com",
    "JL": "https://www.jal.com",
    "NH": "https://www.ana.co.jp",
  };
  
  return airlineBookingUrls[airline] || `https://www.google.com/travel/flights`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

export async function optimizeFlights(params: SearchParams): Promise<OptimizationResult> {
  console.log("Starting flight optimization...", params);
  
  // Resolve locations
  const originAirports = getAirportsForCity(params.origin);
  const destAirports = getAirportsForCity(params.destination);
  
  // Use first airport if multiple found
  const originCode = originAirports[0]?.code || params.origin.toUpperCase();
  const destCode = destAirports[0]?.code || params.destination.toUpperCase();
  
  // Run all optimization strategies in parallel
  const [
    standard,
    splitTicket,
    nearbyOrigin,
    nearbyDest,
    flexibleDates,
  ] = await Promise.all([
    searchStandardReturn(originCode, destCode, params.departureDate, params.returnDate || params.departureDate, params),
    searchSplitTicketing(originCode, destCode, params.departureDate, params.returnDate || params.departureDate, params),
    searchNearbyOrigin(originCode, destCode, params.departureDate, params.returnDate || params.departureDate, params),
    searchNearbyDestination(originCode, destCode, params.departureDate, params.returnDate || params.departureDate, params),
    params.flexibleDates ? searchFlexibleDates(originCode, destCode, params.departureDate, params.returnDate || params.departureDate, params) : Promise.resolve(null),
  ]);
  
  const allOptions: FlightOption[] = [];
  
  if (standard) allOptions.push(standard);
  if (splitTicket) allOptions.push(splitTicket);
  if (nearbyOrigin) allOptions.push(nearbyOrigin);
  if (nearbyDest) allOptions.push(nearbyDest);
  if (flexibleDates) allOptions.push(flexibleDates);
  
  if (allOptions.length === 0) {
    throw new Error("No flights found for this route");
  }
  
  // Calculate savings vs standard
  const baselinePrice = standard?.totalPrice || allOptions[0].totalPrice;
  allOptions.forEach(opt => {
    opt.savingsVsStandard = Math.round(baselinePrice - opt.totalPrice);
  });
  
  // Sort by price
  allOptions.sort((a, b) => a.totalPrice - b.totalPrice);
  
  const bestOption = allOptions[0];
  const optimizedOptions = allOptions.filter(o => o.id !== bestOption.id);
  
  const prices = allOptions.map(o => o.totalPrice);
  
  return {
    searchParams: params,
    originLocations: originAirports,
    destinationLocations: destAirports,
    standardOption: standard || allOptions[0],
    optimizedOptions,
    bestOption,
    strategies: allOptions.map(o => o.strategy),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
  };
}
