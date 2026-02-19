import Amadeus from "amadeus";

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "",
  clientSecret: process.env.AMADEUS_API_SECRET || "",
});

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
}

export interface FlightLeg {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  price: number;
}

export interface FlightOption {
  outbound: FlightLeg;
  inbound: FlightLeg;
  totalPrice: number;
  bookingLink: string;
  strategy: string;
  savingsVsStandard: number;
  risks?: string[];
}

export interface FlightResult {
  standard: FlightOption;
  alternatives: FlightOption[];
  bestOption: FlightOption;
  allStrategies: string[];
}

// Major airports database with coordinates
export const AIRPORTS = [
  { code: "LHR", name: "London Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.46 },
  { code: "LGW", name: "London Gatwick", city: "London", country: "UK", lat: 51.15, lng: -0.18 },
  { code: "STN", name: "London Stansted", city: "London", country: "UK", lat: 51.89, lng: 0.24 },
  { code: "LTN", name: "London Luton", city: "London", country: "UK", lat: 51.87, lng: -0.37 },
  { code: "LCY", name: "London City", city: "London", country: "UK", lat: 51.50, lng: 0.06 },
  { code: "SEN", name: "London Southend", city: "London", country: "UK", lat: 51.57, lng: 0.70 },
  { code: "JFK", name: "John F. Kennedy", city: "New York", country: "USA", lat: 40.64, lng: -73.78 },
  { code: "EWR", name: "Newark", city: "New York", country: "USA", lat: 40.69, lng: -74.17 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", lat: 40.78, lng: -73.87 },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.01, lng: 2.55 },
  { code: "ORY", name: "Orly", city: "Paris", country: "France", lat: 48.73, lng: 2.37 },
  { code: "BVA", name: "Beauvais", city: "Paris", country: "France", lat: 49.45, lng: 2.11 },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.77 },
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", lat: 50.04, lng: 8.57 },
  { code: "MUC", name: "Munich", city: "Munich", country: "Germany", lat: 48.35, lng: 11.79 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", lat: 41.80, lng: 12.25 },
  { code: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", lat: 45.63, lng: 8.72 },
  { code: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", lat: 40.47, lng: -3.57 },
  { code: "BCN", name: "Barcelona", city: "Barcelona", country: "Spain", lat: 41.30, lng: 2.08 },
  { code: "DXB", name: "Dubai", city: "Dubai", country: "UAE", lat: 25.25, lng: 55.36 },
  { code: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", lat: 1.36, lng: 103.99 },
  { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "China", lat: 22.31, lng: 113.92 },
  { code: "NRT", name: "Tokyo Narita", city: "Tokyo", country: "Japan", lat: 35.76, lng: 140.39 },
  { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", lat: 35.55, lng: 139.78 },
  { code: "SYD", name: "Sydney", city: "Sydney", country: "Australia", lat: -33.94, lng: 151.18 },
  { code: "LAX", name: "Los Angeles", city: "Los Angeles", country: "USA", lat: 33.94, lng: -118.41 },
  { code: "SFO", name: "San Francisco", city: "San Francisco", country: "USA", lat: 37.62, lng: -122.38 },
  { code: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "USA", lat: 41.97, lng: -87.91 },
  { code: "MIA", name: "Miami", city: "Miami", country: "USA", lat: 25.80, lng: -80.29 },
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", lat: 43.68, lng: -79.63 },
  { code: "YVR", name: "Vancouver", city: "Vancouver", country: "Canada", lat: 49.20, lng: -123.18 },
  { code: "GRU", name: "São Paulo", city: "São Paulo", country: "Brazil", lat: -23.43, lng: -46.47 },
  { code: "JNB", name: "Johannesburg", city: "Johannesburg", country: "South Africa", lat: -26.14, lng: 28.25 },
  { code: "CAI", name: "Cairo", city: "Cairo", country: "Egypt", lat: 30.12, lng: 31.41 },
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey", lat: 41.26, lng: 28.74 },
  { code: "DOH", name: "Doha", city: "Doha", country: "Qatar", lat: 25.27, lng: 51.61 },
  { code: "BKK", name: "Bangkok", city: "Bangkok", country: "Thailand", lat: 13.69, lng: 100.75 },
  { code: "KUL", name: "Kuala Lumpur", city: "Kuala Lumpur", country: "Malaysia", lat: 2.75, lng: 101.71 },
  { code: "ICN", name: "Seoul Incheon", city: "Seoul", country: "South Korea", lat: 37.46, lng: 126.44 },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", lat: 40.08, lng: 116.58 },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", lat: 31.14, lng: 121.81 },
  { code: "BOM", name: "Mumbai", city: "Mumbai", country: "India", lat: 19.09, lng: 72.87 },
  { code: "DEL", name: "Delhi", city: "Delhi", country: "India", lat: 28.57, lng: 77.10 },
  { code: "ZUR", name: "Zurich", city: "Zurich", country: "Switzerland", lat: 47.46, lng: 8.55 },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", lat: 55.62, lng: 12.66 },
  { code: "OSL", name: "Oslo", city: "Oslo", country: "Norway", lat: 60.20, lng: 11.08 },
  { code: "ARN", name: "Stockholm", city: "Stockholm", country: "Sweden", lat: 59.65, lng: 17.93 },
  { code: "HEL", name: "Helsinki", city: "Helsinki", country: "Finland", lat: 60.32, lng: 24.97 },
  { code: "VIE", name: "Vienna", city: "Vienna", country: "Austria", lat: 48.11, lng: 16.57 },
  { code: "PRG", name: "Prague", city: "Prague", country: "Czech Republic", lat: 50.10, lng: 14.26 },
  { code: "WAW", name: "Warsaw", city: "Warsaw", country: "Poland", lat: 52.17, lng: 20.97 },
  { code: "BUD", name: "Budapest", city: "Budapest", country: "Hungary", lat: 47.43, lng: 19.26 },
  { code: "ATH", name: "Athens", city: "Athens", country: "Greece", lat: 37.94, lng: 23.95 },
  { code: "LIS", name: "Lisbon", city: "Lisbon", country: "Portugal", lat: 38.78, lng: -9.13 },
  { code: "DUB", name: "Dublin", city: "Dublin", country: "Ireland", lat: 53.43, lng: -6.24 },
  { code: "BRU", name: "Brussels", city: "Brussels", country: "Belgium", lat: 50.90, lng: 4.48 },
  { code: "GVA", name: "Geneva", city: "Geneva", country: "Switzerland", lat: 46.24, lng: 6.11 },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "UK", lat: 53.35, lng: -2.28 },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "UK", lat: 55.95, lng: -3.37 },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "UK", lat: 55.87, lng: -4.43 },
  { code: "BHX", name: "Birmingham", city: "Birmingham", country: "UK", lat: 52.45, lng: -1.73 },
  { code: "BRS", name: "Bristol", city: "Bristol", country: "UK", lat: 51.38, lng: -2.72 },
  { code: "NCL", name: "Newcastle", city: "Newcastle", country: "UK", lat: 55.04, lng: -1.69 },
  { code: "LBA", name: "Leeds Bradford", city: "Leeds", country: "UK", lat: 53.87, lng: -1.66 },
  { code: "LPL", name: "Liverpool", city: "Liverpool", country: "UK", lat: 53.33, lng: -2.85 },
];

// Search airports by query
export function searchAirports(query: string) {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return AIRPORTS.filter(airport => 
    airport.code.toLowerCase().includes(lowerQuery) ||
    airport.name.toLowerCase().includes(lowerQuery) ||
    airport.city.toLowerCase().includes(lowerQuery) ||
    airport.country.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

// Get nearby airports within radius (km)
function getNearbyAirports(airportCode: string, radiusKm: number = 100): string[] {
  const airport = AIRPORTS.find(a => a.code === airportCode.toUpperCase());
  if (!airport) return [];
  
  return AIRPORTS
    .filter(a => {
      if (a.code === airportCode) return false;
      const distance = calculateDistance(
        airport.lat, airport.lng,
        a.lat, a.lng
      );
      return distance <= radiusKm;
    })
    .map(a => a.code);
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date.toISOString());
}

function parseFlightOffer(offer: any): { price: number; airline: string; flightNumber: string } | null {
  if (!offer?.price?.total) return null;
  
  const price = parseFloat(offer.price.total);
  const segment = offer.itineraries?.[0]?.segments?.[0];
  const airline = segment?.carrierCode || "Unknown";
  const flightNumber = segment ? `${segment.carrierCode}${segment.number}` : "";
  
  return { price, airline, flightNumber };
}

function generateBookingLink(origin: string, destination: string, departure: string, returnDate?: string): string {
  const dep = formatDate(departure);
  const base = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/`;
  const params = returnDate 
    ? `?adults=1&cabinclass=economy&rtn=1&oym=${dep.slice(0,7)}`
    : `?adults=1&cabinclass=economy&rtn=0&oym=${dep.slice(0,7)}`;
  return base + params;
}

// Search a single route - returns cheapest price
async function searchSingleRoute(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string
): Promise<{ price: number; airline: string; flightNumber: string } | null> {
  try {
    const params: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: formatDate(departureDate),
      adults: "1",
      max: "3",
      currencyCode: "GBP",
    };
    
    if (returnDate) {
      params.returnDate = formatDate(returnDate);
    }
    
    const response = await amadeus.shopping.flightOffersSearch.get(params);
    const offers = response.data || [];
    
    if (offers.length === 0) return null;
    
    return parseFlightOffer(offers[0]);
  } catch (error) {
    console.error(`Search error ${origin}-${destination}:`, error);
    return null;
  }
}

// Main search function with PARALLEL API calls
export async function searchFlights(params: SearchParams): Promise<FlightResult> {
  const { origin, destination, departureDate, returnDate, passengers } = params;
  
  console.log("Starting parallel flight search...", { origin, destination });
  const startTime = Date.now();
  
  // Strategy 1: Standard return flight
  const standardPromise = searchSingleRoute(origin, destination, departureDate, returnDate);
  
  // Strategy 2: Split ticketing (one-ways)
  const outboundPromise = searchSingleRoute(origin, destination, departureDate);
  const inboundPromise = searchSingleRoute(destination, origin, returnDate);
  
  // Strategy 3: Nearby origin airports
  const nearbyOrigins = getNearbyAirports(origin, 150);
  const originPromises = nearbyOrigins.slice(0, 2).map(airport => 
    searchSingleRoute(airport, destination, departureDate, returnDate)
      .then(result => result ? { ...result, airport, type: 'origin' as const } : null)
  );
  
  // Strategy 4: Nearby destination airports
  const nearbyDests = getNearbyAirports(destination, 150);
  const destPromises = nearbyDests.slice(0, 2).map(airport => 
    searchSingleRoute(origin, airport, departureDate, returnDate)
      .then(result => result ? { ...result, airport, type: 'destination' as const } : null)
  );
  
  // Strategy 5: Flexible dates (±2 days)
  const flexPromises = [-2, -1, 1, 2].map(days => {
    const flexDep = addDays(departureDate, days);
    const flexRet = addDays(returnDate, days);
    return searchSingleRoute(origin, destination, flexDep, flexRet)
      .then(result => result ? { ...result, days, type: 'flex' as const } : null);
  });
  
  // Wait for ALL searches in parallel
  const [
    standard,
    outbound,
    inbound,
    ...otherResults
  ] = await Promise.all([
    standardPromise,
    outboundPromise,
    inboundPromise,
    ...originPromises,
    ...destPromises,
    ...flexPromises,
  ]);
  
  const searchTime = Date.now() - startTime;
  console.log(`Search completed in ${searchTime}ms`);
  
  // Separate results by type
  const originResults = otherResults.slice(0, originPromises.length).filter(Boolean);
  const destResults = otherResults.slice(originPromises.length, originPromises.length + destPromises.length).filter(Boolean);
  const flexResults = otherResults.slice(originPromises.length + destPromises.length).filter(Boolean);
  
  // Build standard option
  const standardPrice = standard?.price || 9999;
  const standardOption: FlightOption = {
    outbound: {
      origin,
      destination,
      departureTime: new Date(departureDate).toISOString(),
      arrivalTime: new Date(departureDate).toISOString(),
      airline: standard?.airline || "Unknown",
      flightNumber: standard?.flightNumber || "",
      price: Math.round(standardPrice / 2),
    },
    inbound: {
      origin: destination,
      destination: origin,
      departureTime: new Date(returnDate).toISOString(),
      arrivalTime: new Date(returnDate).toISOString(),
      airline: standard?.airline || "Unknown",
      flightNumber: standard?.flightNumber || "",
      price: Math.round(standardPrice / 2),
    },
    totalPrice: Math.round(standardPrice),
    bookingLink: generateBookingLink(origin, destination, departureDate, returnDate),
    strategy: "Standard Return",
    savingsVsStandard: 0,
  };
  
  const alternatives: FlightOption[] = [];
  
  // Add split-ticket option if cheaper
  if (outbound && inbound) {
    const splitPrice = outbound.price + inbound.price;
    const savings = Math.round(standardPrice - splitPrice);
    
    if (savings > 10) {
      alternatives.push({
        outbound: {
          origin,
          destination,
          departureTime: new Date(departureDate).toISOString(),
          arrivalTime: new Date(departureDate).toISOString(),
          airline: outbound.airline,
          flightNumber: outbound.flightNumber,
          price: Math.round(outbound.price),
        },
        inbound: {
          origin: destination,
          destination: origin,
          departureTime: new Date(returnDate).toISOString(),
          arrivalTime: new Date(returnDate).toISOString(),
          airline: inbound.airline,
          flightNumber: inbound.flightNumber,
          price: Math.round(inbound.price),
        },
        totalPrice: Math.round(splitPrice),
        bookingLink: generateBookingLink(origin, destination, departureDate),
        strategy: "Split Ticketing",
        savingsVsStandard: savings,
        risks: ["Separate tickets - no protection if you miss connection"],
      });
    }
  }
  
  // Add nearby origin options
  originResults.forEach((result: any) => {
    if (!result) return;
    const savings = Math.round(standardPrice - result.price);
    if (savings > 20) {
      alternatives.push({
        outbound: {
          origin: result.airport,
          destination,
          departureTime: new Date(departureDate).toISOString(),
          arrivalTime: new Date(departureDate).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        inbound: {
          origin: destination,
          destination: result.airport,
          departureTime: new Date(returnDate).toISOString(),
          arrivalTime: new Date(returnDate).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        totalPrice: Math.round(result.price),
        bookingLink: generateBookingLink(result.airport, destination, departureDate, returnDate),
        strategy: `Fly from ${result.airport}`,
        savingsVsStandard: savings,
        risks: [`Need to travel to ${result.airport}`],
      });
    }
  });
  
  // Add nearby destination options
  destResults.forEach((result: any) => {
    if (!result) return;
    const savings = Math.round(standardPrice - result.price);
    if (savings > 20) {
      alternatives.push({
        outbound: {
          origin,
          destination: result.airport,
          departureTime: new Date(departureDate).toISOString(),
          arrivalTime: new Date(departureDate).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        inbound: {
          origin: result.airport,
          destination: origin,
          departureTime: new Date(returnDate).toISOString(),
          arrivalTime: new Date(returnDate).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        totalPrice: Math.round(result.price),
        bookingLink: generateBookingLink(origin, result.airport, departureDate, returnDate),
        strategy: `Fly to ${result.airport}`,
        savingsVsStandard: savings,
        risks: [`Need transport from ${result.airport} to ${destination}`],
      });
    }
  });
  
  // Add flexible date options
  flexResults.forEach((result: any) => {
    if (!result) return;
    const savings = Math.round(standardPrice - result.price);
    if (savings > 30) {
      const dayLabel = result.days > 0 ? `+${result.days}` : `${result.days}`;
      alternatives.push({
        outbound: {
          origin,
          destination,
          departureTime: new Date(addDays(departureDate, result.days)).toISOString(),
          arrivalTime: new Date(addDays(departureDate, result.days)).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        inbound: {
          origin: destination,
          destination: origin,
          departureTime: new Date(addDays(returnDate, result.days)).toISOString(),
          arrivalTime: new Date(addDays(returnDate, result.days)).toISOString(),
          airline: result.airline,
          flightNumber: result.flightNumber,
          price: Math.round(result.price / 2),
        },
        totalPrice: Math.round(result.price),
        bookingLink: generateBookingLink(origin, destination, addDays(departureDate, result.days), addDays(returnDate, result.days)),
        strategy: `Flexible dates (${dayLabel} days)`,
        savingsVsStandard: savings,
      });
    }
  });
  
  // Sort alternatives by price
  alternatives.sort((a, b) => a.totalPrice - b.totalPrice);
  
  // Best option is the cheapest
  const bestOption = alternatives.length > 0 && alternatives[0].totalPrice < standardPrice 
    ? alternatives[0] 
    : standardOption;
  
  return {
    standard: standardOption,
    alternatives: alternatives.slice(0, 5), // Top 5 alternatives
    bestOption,
    allStrategies: ["Standard Return", ...alternatives.map(a => a.strategy)],
  };
}
