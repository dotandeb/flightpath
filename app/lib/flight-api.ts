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

// Major airports by region for nearby airport search
const NEARBY_AIRPORTS: Record<string, string[]> = {
  // London
  "LHR": ["LGW", "STN", "LTN", "LCY", "SEN"],
  "LGW": ["LHR", "STN", "LTN", "LCY"],
  "STN": ["LHR", "LGW", "LTN"],
  "LTN": ["LHR", "LGW", "STN"],
  // New York
  "JFK": ["EWR", "LGA"],
  "EWR": ["JFK", "LGA"],
  "LGA": ["JFK", "EWR"],
  // Paris
  "CDG": ["ORY", "BVA"],
  "ORY": ["CDG", "BVA"],
  // Amsterdam
  "AMS": ["RTM", "EIN"],
  // Frankfurt
  "FRA": ["HHN", "CGN"],
  // Dubai
  "DXB": ["DWC", "SHJ"],
  // Singapore
  "SIN": ["XSP", "JHB"],
  // Hong Kong
  "HKG": ["SZX", "MFM"],
  // Sydney
  "SYD": ["BWU", "CBR"],
  // Los Angeles
  "LAX": ["BUR", "LGB", "SNA"],
  // San Francisco
  "SFO": ["OAK", "SJC"],
  // Chicago
  "ORD": ["MDW"],
  // Toronto
  "YYZ": ["YTZ", "YHM"],
  // Tokyo
  "NRT": ["HND"],
  "HND": ["NRT"],
};

// Budget airlines that often have cheaper one-way fares
const BUDGET_AIRLINES = ["FR", "U2", "W6", "VY", "NK", "F9", "G4", "WS", "D8", "DY"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date.toISOString());
}

// Get nearby airports
function getNearbyAirports(airport: string): string[] {
  return NEARBY_AIRPORTS[airport.toUpperCase()] || [];
}

// Parse Amadeus flight offer
function parseFlightOffer(offer: any, origin: string, destination: string): { outbound: FlightLeg; inbound: FlightLeg; price: number } | null {
  if (!offer.itineraries || offer.itineraries.length === 0) return null;
  
  const outboundItinerary = offer.itineraries[0];
  const inboundItinerary = offer.itineraries[1];
  
  if (!outboundItinerary?.segments?.[0]) return null;
  
  const outboundSegment = outboundItinerary.segments[0];
  const price = parseFloat(offer.price.total);
  
  const outbound: FlightLeg = {
    origin: outboundSegment.departure.iataCode,
    destination: outboundSegment.arrival.iataCode,
    departureTime: outboundSegment.departure.at,
    arrivalTime: outboundSegment.arrival.at,
    airline: outboundSegment.carrierCode,
    flightNumber: `${outboundSegment.carrierCode}${outboundSegment.number}`,
    price: Math.round(price / 2), // Approximate split
  };
  
  let inbound: FlightLeg;
  if (inboundItinerary?.segments?.[0]) {
    const inboundSegment = inboundItinerary.segments[0];
    inbound = {
      origin: inboundSegment.departure.iataCode,
      destination: inboundSegment.arrival.iataCode,
      departureTime: inboundSegment.departure.at,
      arrivalTime: inboundSegment.arrival.at,
      airline: inboundSegment.carrierCode,
      flightNumber: `${inboundSegment.carrierCode}${inboundSegment.number}`,
      price: Math.round(price / 2),
    };
  } else {
    // One-way flight - create placeholder
    inbound = { ...outbound, origin: destination, destination: origin };
  }
  
  return { outbound, inbound, price };
}

// Generate booking link
function generateBookingLink(origin: string, destination: string, departure: string, returnDate?: string): string {
  const dep = formatDate(departure);
  const ret = returnDate ? formatDate(returnDate) : "";
  const base = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/`;
  const params = returnDate 
    ? `?adults=1&cabinclass=economy&rtn=1&oym=${dep.slice(0,7)}&iym=${ret.slice(0,7)}`
    : `?adults=1&cabinclass=economy&rtn=0&oym=${dep.slice(0,7)}`;
  return base + params;
}

// Search flights for a specific route
async function searchRoute(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  passengers: number = 1
): Promise<Array<{ outbound: FlightLeg; inbound: FlightLeg; price: number }>> {
  try {
    const params: any = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: formatDate(departureDate),
      adults: passengers.toString(),
      max: "10",
      currencyCode: "GBP",
    };
    
    if (returnDate) {
      params.returnDate = formatDate(returnDate);
    }
    
    const response = await amadeus.shopping.flightOffersSearch.get(params);
    const offers = response.data || [];
    
    return offers
      .map((offer: any) => parseFlightOffer(offer, origin, destination))
      .filter((result: any): result is { outbound: FlightLeg; inbound: FlightLeg; price: number } => result !== null)
      .sort((a: any, b: any) => a.price - b.price);
  } catch (error) {
    console.error(`Search error for ${origin}-${destination}:`, error);
    return [];
  }
}

// Main search function with multiple strategies
export async function searchFlights(params: SearchParams): Promise<FlightResult> {
  const { origin, destination, departureDate, returnDate, passengers } = params;
  
  const allOptions: FlightOption[] = [];
  
  // Strategy 1: Standard return flight (baseline)
  console.log("Strategy 1: Standard return flight...");
  const standardResults = await searchRoute(origin, destination, departureDate, returnDate, passengers);
  
  if (standardResults.length === 0) {
    throw new Error("No flights found for this route");
  }
  
  const standardPrice = standardResults[0].price;
  const standard: FlightOption = {
    outbound: standardResults[0].outbound,
    inbound: standardResults[0].inbound,
    totalPrice: Math.round(standardPrice),
    bookingLink: generateBookingLink(origin, destination, departureDate, returnDate),
    strategy: "Standard Return",
    savingsVsStandard: 0,
  };
  
  allOptions.push(standard);
  
  // Strategy 2: Split ticketing (different airlines for each leg)
  console.log("Strategy 2: Split ticketing...");
  const outboundOneWay = await searchRoute(origin, destination, departureDate, undefined, passengers);
  const inboundOneWay = await searchRoute(destination, origin, returnDate, undefined, passengers);
  
  if (outboundOneWay.length > 0 && inboundOneWay.length > 0) {
    // Try top 3 combinations
    for (let i = 0; i < Math.min(3, outboundOneWay.length); i++) {
      for (let j = 0; j < Math.min(3, inboundOneWay.length); j++) {
        const splitPrice = outboundOneWay[i].price + inboundOneWay[j].price;
        const savings = Math.round(standardPrice - splitPrice);
        
        if (savings > 10) { // Only add if meaningful savings
          allOptions.push({
            outbound: { ...outboundOneWay[i].outbound, price: Math.round(outboundOneWay[i].price) },
            inbound: { ...inboundOneWay[j].outbound, price: Math.round(inboundOneWay[j].price) },
            totalPrice: Math.round(splitPrice),
            bookingLink: generateBookingLink(origin, destination, departureDate),
            strategy: "Split Ticketing",
            savingsVsStandard: savings,
            risks: ["Separate tickets - no protection if you miss connection"],
          });
        }
      }
    }
  }
  
  // Strategy 3: Nearby origin airports
  console.log("Strategy 3: Nearby origin airports...");
  const nearbyOrigins = getNearbyAirports(origin);
  for (const nearbyOrigin of nearbyOrigins.slice(0, 2)) {
    const nearbyResults = await searchRoute(nearbyOrigin, destination, departureDate, returnDate, passengers);
    if (nearbyResults.length > 0) {
      const nearbyPrice = nearbyResults[0].price;
      const savings = Math.round(standardPrice - nearbyPrice);
      
      if (savings > 20) {
        allOptions.push({
          outbound: nearbyResults[0].outbound,
          inbound: nearbyResults[0].inbound,
          totalPrice: Math.round(nearbyPrice),
          bookingLink: generateBookingLink(nearbyOrigin, destination, departureDate, returnDate),
          strategy: `Fly from ${nearbyOrigin}`,
          savingsVsStandard: savings,
          risks: [`Need to get to ${nearbyOrigin} (${getAirportDistance(origin, nearbyOrigin)}km from ${origin})`],
        });
      }
    }
  }
  
  // Strategy 4: Nearby destination airports
  console.log("Strategy 4: Nearby destination airports...");
  const nearbyDests = getNearbyAirports(destination);
  for (const nearbyDest of nearbyDests.slice(0, 2)) {
    const nearbyResults = await searchRoute(origin, nearbyDest, departureDate, returnDate, passengers);
    if (nearbyResults.length > 0) {
      const nearbyPrice = nearbyResults[0].price;
      const savings = Math.round(standardPrice - nearbyPrice);
      
      if (savings > 20) {
        allOptions.push({
          outbound: nearbyResults[0].outbound,
          inbound: nearbyResults[0].inbound,
          totalPrice: Math.round(nearbyPrice),
          bookingLink: generateBookingLink(origin, nearbyDest, departureDate, returnDate),
          strategy: `Fly to ${nearbyDest}`,
          savingsVsStandard: savings,
          risks: [`Need transport from ${nearbyDest} to ${destination} (${getAirportDistance(destination, nearbyDest)}km)`],
        });
      }
    }
  }
  
  // Strategy 5: Date flexibility (±3 days)
  console.log("Strategy 5: Date flexibility...");
  const flexDates = [-3, -2, -1, 1, 2, 3];
  for (const dayOffset of flexDates.slice(0, 3)) {
    const flexDeparture = addDays(departureDate, dayOffset);
    const flexReturn = addDays(returnDate, dayOffset);
    
    const flexResults = await searchRoute(origin, destination, flexDeparture, flexReturn, passengers);
    if (flexResults.length > 0) {
      const flexPrice = flexResults[0].price;
      const savings = Math.round(standardPrice - flexPrice);
      
      if (savings > 30) {
        allOptions.push({
          outbound: flexResults[0].outbound,
          inbound: flexResults[0].inbound,
          totalPrice: Math.round(flexPrice),
          bookingLink: generateBookingLink(origin, destination, flexDeparture, flexReturn),
          strategy: `Flexible dates (${dayOffset > 0 ? '+' : ''}${dayOffset} days)`,
          savingsVsStandard: savings,
        });
      }
    }
  }
  
  // Strategy 6: Hidden city (one-way only - return from different city)
  // This is more complex and risky, but can yield big savings
  console.log("Strategy 6: Open-jaw combinations...");
  if (nearbyDests.length > 0) {
    const openJawDest = nearbyDests[0];
    const openJawResults = await searchRoute(origin, destination, departureDate, undefined, passengers);
    const returnFromOther = await searchRoute(openJawDest, origin, returnDate, undefined, passengers);
    
    if (openJawResults.length > 0 && returnFromOther.length > 0) {
      const openJawPrice = openJawResults[0].price + returnFromOther[0].price;
      const savings = Math.round(standardPrice - openJawPrice);
      
      if (savings > 50) {
        allOptions.push({
          outbound: openJawResults[0].outbound,
          inbound: returnFromOther[0].outbound,
          totalPrice: Math.round(openJawPrice),
          bookingLink: generateBookingLink(origin, destination, departureDate),
          strategy: "Open-jaw (multi-city)",
          savingsVsStandard: savings,
          risks: [`Return from ${openJawDest} instead of ${destination}`, "Need transport between cities"],
        });
      }
    }
  }
  
  // Remove duplicates and sort by total price
  const uniqueOptions = allOptions.filter((option, index, self) => 
    index === self.findIndex((o) => 
      o.strategy === option.strategy && 
      o.totalPrice === option.totalPrice
    )
  );
  
  const sortedOptions = uniqueOptions.sort((a, b) => a.totalPrice - b.totalPrice);
  
  // Update savings for all options relative to cheapest
  const cheapestPrice = sortedOptions[0].totalPrice;
  const updatedOptions = sortedOptions.map(option => ({
    ...option,
    savingsVsStandard: Math.round(standardPrice - option.totalPrice),
  }));
  
  return {
    standard: updatedOptions.find(o => o.strategy === "Standard Return") || updatedOptions[0],
    alternatives: updatedOptions.filter(o => o.strategy !== "Standard Return"),
    bestOption: updatedOptions[0],
    allStrategies: [...new Set(updatedOptions.map(o => o.strategy))],
  };
}

// Helper function for airport distances (approximate)
function getAirportDistance(airport1: string, airport2: string): number {
  const distances: Record<string, Record<string, number>> = {
    "LHR": { "LGW": 45, "STN": 65, "LTN": 55, "LCY": 35, "SEN": 80 },
    "LGW": { "LHR": 45, "STN": 70, "LTN": 75, "LCY": 50 },
    "JFK": { "EWR": 35, "LGA": 15 },
    "EWR": { "JFK": 35, "LGA": 30 },
    "CDG": { "ORY": 35, "BVA": 85 },
    "DXB": { "DWC": 60, "SHJ": 25 },
  };
  
  return distances[airport1]?.[airport2] || distances[airport2]?.[airport1] || 50;
}
