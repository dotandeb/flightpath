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

// Major airports database
export const AIRPORTS = [
  { code: "LHR", name: "London Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.46 },
  { code: "LGW", name: "London Gatwick", city: "London", country: "UK", lat: 51.15, lng: -0.18 },
  { code: "STN", name: "London Stansted", city: "London", country: "UK", lat: 51.89, lng: 0.24 },
  { code: "LTN", name: "London Luton", city: "London", country: "UK", lat: 51.87, lng: -0.37 },
  { code: "LCY", name: "London City", city: "London", country: "UK", lat: 51.50, lng: 0.06 },
  { code: "JFK", name: "John F. Kennedy", city: "New York", country: "USA", lat: 40.64, lng: -73.78 },
  { code: "EWR", name: "Newark", city: "New York", country: "USA", lat: 40.69, lng: -74.17 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", lat: 40.78, lng: -73.87 },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.01, lng: 2.55 },
  { code: "ORY", name: "Orly", city: "Paris", country: "France", lat: 48.73, lng: 2.37 },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.31, lng: 4.77 },
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", lat: 50.04, lng: 8.57 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", lat: 41.80, lng: 12.25 },
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
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey", lat: 41.26, lng: 28.74 },
  { code: "DOH", name: "Doha", city: "Doha", country: "Qatar", lat: 25.27, lng: 51.61 },
  { code: "BKK", name: "Bangkok", city: "Bangkok", country: "Thailand", lat: 13.69, lng: 100.75 },
  { code: "ICN", name: "Seoul Incheon", city: "Seoul", country: "South Korea", lat: 37.46, lng: 126.44 },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", lat: 40.08, lng: 116.58 },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", lat: 31.14, lng: 121.81 },
  { code: "BOM", name: "Mumbai", city: "Mumbai", country: "India", lat: 19.09, lng: 72.87 },
  { code: "DEL", name: "Delhi", city: "Delhi", country: "India", lat: 28.57, lng: 77.10 },
  { code: "ZUR", name: "Zurich", city: "Zurich", country: "Switzerland", lat: 47.46, lng: 8.55 },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", lat: 55.62, lng: 12.66 },
  { code: "VIE", name: "Vienna", city: "Vienna", country: "Austria", lat: 48.11, lng: 16.57 },
  { code: "ATH", name: "Athens", city: "Athens", country: "Greece", lat: 37.94, lng: 23.95 },
  { code: "LIS", name: "Lisbon", city: "Lisbon", country: "Portugal", lat: 38.78, lng: -9.13 },
  { code: "DUB", name: "Dublin", city: "Dublin", country: "Ireland", lat: 53.43, lng: -6.24 },
  { code: "BRU", name: "Brussels", city: "Brussels", country: "Belgium", lat: 50.90, lng: 4.48 },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "UK", lat: 53.35, lng: -2.28 },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "UK", lat: 55.95, lng: -3.37 },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "UK", lat: 55.87, lng: -4.43 },
  { code: "BHX", name: "Birmingham", city: "Birmingham", country: "UK", lat: 52.45, lng: -1.73 },
  { code: "BRS", name: "Bristol", city: "Bristol", country: "UK", lat: 51.38, lng: -2.72 },
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
  ).slice(0, 8);
}

// Get nearby airports
function getNearbyAirports(airportCode: string): string[] {
  const airport = AIRPORTS.find(a => a.code === airportCode.toUpperCase());
  if (!airport) return [];
  
  // Simple distance check
  return AIRPORTS
    .filter(a => {
      if (a.code === airportCode) return false;
      if (a.city === airport.city) return true; // Same city
      const distance = Math.sqrt(
        Math.pow(a.lat - airport.lat, 2) + Math.pow(a.lng - airport.lng, 2)
      );
      return distance < 15; // Roughly 150km
    })
    .map(a => a.code);
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

// Search with timeout and error handling
async function searchWithTimeout(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  timeoutMs: number = 5000
): Promise<{ price: number; airline: string; flightNumber: string } | null> {
  return Promise.race([
    (async () => {
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
    })(),
    new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    ).catch(() => null)
  ]);
}

// Main search - simplified for reliability
export async function searchFlights(params: SearchParams): Promise<FlightResult> {
  const { origin, destination, departureDate, returnDate, passengers } = params;
  
  console.log("Starting flight search...", { origin, destination });
  const startTime = Date.now();
  
  // Core searches only (reduced for reliability)
  const [standard, outbound, inbound] = await Promise.all([
    // Strategy 1: Standard return
    searchWithTimeout(origin, destination, departureDate, returnDate, 8000),
    // Strategy 2: Outbound one-way
    searchWithTimeout(origin, destination, departureDate, undefined, 5000),
    // Strategy 3: Return one-way
    searchWithTimeout(destination, origin, returnDate, undefined, 5000),
  ]);
  
  // Get nearby airports (limited)
  const nearbyOrigins = getNearbyAirports(origin).slice(0, 1);
  const nearbyDests = getNearbyAirports(destination).slice(0, 1);
  
  // Search nearby airports (sequential to avoid rate limits)
  const originResults = [];
  for (const airport of nearbyOrigins) {
    const result = await searchWithTimeout(airport, destination, departureDate, returnDate, 4000);
    if (result) originResults.push({ ...result, airport, type: 'origin' });
  }
  
  const destResults = [];
  for (const airport of nearbyDests) {
    const result = await searchWithTimeout(origin, airport, departureDate, returnDate, 4000);
    if (result) destResults.push({ ...result, airport, type: 'destination' });
  }
  
  const searchTime = Date.now() - startTime;
  console.log(`Search completed in ${searchTime}ms`);
  
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
  
  // Add split-ticket option
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
  
  // Add nearby origin
  originResults.forEach((result: any) => {
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
  
  // Add nearby destination
  destResults.forEach((result: any) => {
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
  
  // Sort by price
  alternatives.sort((a, b) => a.totalPrice - b.totalPrice);
  
  // Best option
  const bestOption = alternatives.length > 0 && alternatives[0].totalPrice < standardPrice 
    ? alternatives[0] 
    : standardOption;
  
  return {
    standard: standardOption,
    alternatives: alternatives.slice(0, 3),
    bestOption,
    allStrategies: ["Standard Return", ...alternatives.map(a => a.strategy)],
  };
}
