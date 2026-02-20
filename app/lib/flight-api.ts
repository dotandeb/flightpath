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
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
}

export interface FlightLeg {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  duration: string;
  stops: number;
  price: number;
}

export interface FlightOption {
  id: string;
  outbound: FlightLeg;
  inbound: FlightLeg;
  totalPrice: number;
  perPersonPrice: number;
  bookingLink: string;
  strategy: string;
  savingsVsStandard: number;
  risks?: string[];
}

export interface FlightResult {
  searchParams: SearchParams;
  standard: FlightOption;
  alternatives: FlightOption[];
  bestOption: FlightOption;
  allStrategies: string[];
}

// Airport database
export const AIRPORTS = [
  { code: "LHR", name: "London Heathrow", city: "London", country: "UK" },
  { code: "LGW", name: "London Gatwick", city: "London", country: "UK" },
  { code: "STN", name: "London Stansted", city: "London", country: "UK" },
  { code: "LTN", name: "London Luton", city: "London", country: "UK" },
  { code: "JFK", name: "John F. Kennedy", city: "New York", country: "USA" },
  { code: "EWR", name: "Newark", city: "New York", country: "USA" },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  { code: "ORY", name: "Orly", city: "Paris", country: "France" },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany" },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy" },
  { code: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain" },
  { code: "BCN", name: "Barcelona", city: "Barcelona", country: "Spain" },
  { code: "DXB", name: "Dubai", city: "Dubai", country: "UAE" },
  { code: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore" },
  { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "China" },
  { code: "NRT", name: "Tokyo Narita", city: "Tokyo", country: "Japan" },
  { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan" },
  { code: "SYD", name: "Sydney", city: "Sydney", country: "Australia" },
  { code: "LAX", name: "Los Angeles", city: "Los Angeles", country: "USA" },
  { code: "SFO", name: "San Francisco", city: "San Francisco", country: "USA" },
  { code: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "USA" },
  { code: "MIA", name: "Miami", city: "Miami", country: "USA" },
  { code: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada" },
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey" },
  { code: "DOH", name: "Doha", city: "Doha", country: "Qatar" },
  { code: "BKK", name: "Bangkok", city: "Bangkok", country: "Thailand" },
  { code: "ICN", name: "Seoul Incheon", city: "Seoul", country: "South Korea" },
  { code: "PEK", name: "Beijing Capital", city: "Beijing", country: "China" },
  { code: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China" },
  { code: "BOM", name: "Mumbai", city: "Mumbai", country: "India" },
  { code: "DEL", name: "Delhi", city: "Delhi", country: "India" },
  { code: "ZUR", name: "Zurich", city: "Zurich", country: "Switzerland" },
  { code: "CPH", name: "Copenhagen", city: "Copenhagen", country: "Denmark" },
  { code: "VIE", name: "Vienna", city: "Vienna", country: "Austria" },
  { code: "ATH", name: "Athens", city: "Athens", country: "Greece" },
  { code: "LIS", name: "Lisbon", city: "Lisbon", country: "Portugal" },
  { code: "DUB", name: "Dublin", city: "Dublin", country: "Ireland" },
  { code: "BRU", name: "Brussels", city: "Brussels", country: "Belgium" },
  { code: "MAN", name: "Manchester", city: "Manchester", country: "UK" },
  { code: "EDI", name: "Edinburgh", city: "Edinburgh", country: "UK" },
  { code: "GLA", name: "Glasgow", city: "Glasgow", country: "UK" },
  { code: "BHX", name: "Birmingham", city: "Birmingham", country: "UK" },
];

export function searchAirports(query: string) {
  if (!query || query.length < 2) return [];
  const lowerQuery = query.toLowerCase();
  return AIRPORTS.filter(airport => 
    airport.code.toLowerCase().includes(lowerQuery) ||
    airport.name.toLowerCase().includes(lowerQuery) ||
    airport.city.toLowerCase().includes(lowerQuery)
  ).slice(0, 8);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Parse Amadeus flight offer into our format
function parseFlightOffer(offer: any, origin: string, destination: string): FlightLeg | null {
  if (!offer?.itineraries?.[0]?.segments?.[0]) return null;
  
  const segment = offer.itineraries[0].segments[0];
  const price = parseFloat(offer.price?.total || "0");
  
  return {
    origin: segment.departure?.iataCode || origin,
    destination: segment.arrival?.iataCode || destination,
    departureTime: segment.departure?.at || new Date().toISOString(),
    arrivalTime: segment.arrival?.at || new Date().toISOString(),
    airline: segment.carrierCode || "Unknown",
    flightNumber: `${segment.carrierCode || ""}${segment.number || ""}`,
    duration: segment.duration || "PT0H",
    stops: (offer.itineraries[0].segments?.length || 1) - 1,
    price: Math.round(price),
  };
}

// Search flights with Amadeus API
async function searchRoute(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  params: SearchParams
): Promise<FlightOption | null> {
  try {
    const apiParams: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: formatDate(departureDate),
      adults: params.adults.toString(),
      children: params.children > 0 ? params.children.toString() : undefined,
      infants: params.infants > 0 ? params.infants.toString() : undefined,
      travelClass: params.travelClass,
      max: "5",
      currencyCode: "GBP",
    };
    
    if (returnDate) {
      apiParams.returnDate = formatDate(returnDate);
    }
    
    const response = await amadeus.shopping.flightOffersSearch.get(apiParams);
    const offers = response.data || [];
    
    if (offers.length === 0) return null;
    
    const offer = offers[0];
    const totalPrice = parseFloat(offer.price?.total || "0");
    const itineraries = offer.itineraries || [];
    
    const outbound = parseFlightOffer({ 
      itineraries: [itineraries[0]], 
      price: { total: (totalPrice / 2).toString() } 
    }, origin, destination);
    
    const inbound = returnDate && itineraries[1] 
      ? parseFlightOffer({ 
          itineraries: [itineraries[1]], 
          price: { total: (totalPrice / 2).toString() } 
        }, destination, origin)
      : outbound;
    
    if (!outbound) return null;
    
    const totalPassengers = params.adults + params.children + params.infants;
    
    return {
      id: generateId(),
      outbound,
      inbound: inbound || outbound,
      totalPrice: Math.round(totalPrice),
      perPersonPrice: Math.round(totalPrice / totalPassengers),
      bookingLink: `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/`,
      strategy: "Standard",
      savingsVsStandard: 0,
    };
  } catch (error) {
    console.error(`Search error ${origin}-${destination}:`, error);
    return null;
  }
}

// Main search function
export async function searchFlights(params: SearchParams): Promise<FlightResult> {
  const { origin, destination, departureDate, returnDate, adults, children, infants } = params;
  const totalPassengers = adults + children + infants;
  
  console.log("Starting flight search...", { origin, destination, totalPassengers });
  
  // Strategy 1: Standard return flight
  const standardPromise = searchRoute(origin, destination, departureDate, returnDate, params);
  
  // Strategy 2: Split ticketing (separate one-ways)
  const outboundPromise = searchRoute(origin, destination, departureDate, undefined, params);
  const inboundPromise = searchRoute(destination, origin, returnDate, undefined, params);
  
  // Wait for core searches
  const [standard, outbound, inbound] = await Promise.all([
    standardPromise,
    outboundPromise,
    inboundPromise,
  ]);
  
  if (!standard) {
    throw new Error("No flights found for this route");
  }
  
  const alternatives: FlightOption[] = [];
  
  // Add split-ticket option if cheaper
  if (outbound && inbound) {
    const splitTotal = outbound.totalPrice + inbound.totalPrice;
    const savings = standard.totalPrice - splitTotal;
    
    if (savings > 20 * totalPassengers) {
      alternatives.push({
        id: generateId(),
        outbound: outbound.outbound,
        inbound: inbound.outbound,
        totalPrice: Math.round(splitTotal),
        perPersonPrice: Math.round(splitTotal / totalPassengers),
        bookingLink: outbound.bookingLink,
        strategy: "Split Ticketing",
        savingsVsStandard: Math.round(savings),
        risks: [
          "Separate tickets - no airline protection if you miss connections",
          "Check baggage policies for each ticket",
        ],
      });
    }
  }
  
  // Sort by price
  alternatives.sort((a, b) => a.totalPrice - b.totalPrice);
  
  // Best option is cheapest with meaningful savings
  const bestOption = alternatives.length > 0 && alternatives[0].savingsVsStandard > 20
    ? alternatives[0]
    : standard;
  
  return {
    searchParams: params,
    standard,
    alternatives: alternatives.slice(0, 3),
    bestOption,
    allStrategies: ["Standard", ...alternatives.map(a => a.strategy)],
  };
}
