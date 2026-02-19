// Flight API Module
// Uses simulated data for MVP - replace with Amadeus integration

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
}

export interface FlightResult {
  standard: FlightOption;
  splitTicket: FlightOption;
  savings: {
    amount: number;
    percentage: number;
  };
}

// Simulated airline database
const AIRLINES = [
  "British Airways",
  "EasyJet",
  "Ryanair",
  "Lufthansa",
  "Air France",
  "KLM",
  "Emirates",
  "Qatar Airways",
  "United",
  "Delta",
  "American Airlines",
  "JetBlue",
  "Southwest",
  "Norwegian",
  "Virgin Atlantic",
];

// Generate realistic flight data based on route
function generateFlightPrice(origin: string, destination: string, isReturn: boolean): number {
  const basePrices: Record<string, number> = {
    "LHR-JFK": 450,
    "JFK-LHR": 420,
    "LHR-CDG": 120,
    "CDG-LHR": 110,
    "LHR-DXB": 380,
    "DXB-LHR": 360,
    "LHR-LAX": 520,
    "LAX-LHR": 480,
    "LHR-FCO": 150,
    "FCO-LHR": 140,
    "LHR-AMS": 95,
    "AMS-LHR": 90,
    "LHR-BKK": 580,
    "BKK-LHR": 560,
    "LHR-SIN": 620,
    "SIN-LHR": 600,
    "LHR-SYD": 850,
    "SYD-LHR": 820,
    "LHR-HKG": 680,
    "HKG-LHR": 650,
  };

  const route = `${origin}-${destination}`;
  const base = basePrices[route] || 250;
  
  const variance = base * 0.3;
  const randomFactor = Math.random() * variance * 2 - variance;
  const multiplier = isReturn ? 1.8 : 1;
  
  return Math.round((base + randomFactor) * multiplier);
}

function getRandomAirline(): string {
  return AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
}

function generateFlightLeg(
  origin: string,
  destination: string,
  date: string,
  price: number
): FlightLeg {
  const departureHour = 6 + Math.floor(Math.random() * 14);
  const duration = 2 + Math.floor(Math.random() * 10);
  
  const departure = new Date(date);
  departure.setHours(departureHour, 0);
  
  const arrival = new Date(departure);
  arrival.setHours(arrival.getHours() + duration);
  
  return {
    origin,
    destination,
    departureTime: departure.toISOString(),
    arrivalTime: arrival.toISOString(),
    airline: getRandomAirline(),
    flightNumber: `${getRandomAirline().slice(0, 2).toUpperCase()}${Math.floor(100 + Math.random() * 8999)}`,
    price,
  };
}

export async function searchFlights(params: SearchParams): Promise<FlightResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const { origin, destination, departureDate, returnDate } = params;

  const standardOutboundPrice = generateFlightPrice(origin, destination, false);
  const standardInboundPrice = generateFlightPrice(destination, origin, false);
  const standardTotal = Math.round((standardOutboundPrice + standardInboundPrice) * 0.85);

  const splitOutboundPrice = generateFlightPrice(origin, destination, false);
  const splitInboundPrice = generateFlightPrice(destination, origin, false);
  const splitTotal = splitOutboundPrice + splitInboundPrice;

  const finalSplitTotal = Math.min(splitTotal, Math.round(standardTotal * 0.85));
  const finalSplitOutbound = Math.round(finalSplitTotal * (splitOutboundPrice / (splitOutboundPrice + splitInboundPrice)));
  const finalSplitInbound = finalSplitTotal - finalSplitOutbound;

  const standard: FlightOption = {
    outbound: generateFlightLeg(origin, destination, departureDate, Math.round(standardTotal / 2)),
    inbound: generateFlightLeg(destination, origin, returnDate, Math.round(standardTotal / 2)),
    totalPrice: standardTotal,
    bookingLink: "#",
  };

  const splitTicket: FlightOption = {
    outbound: generateFlightLeg(origin, destination, departureDate, finalSplitOutbound),
    inbound: generateFlightLeg(destination, origin, returnDate, finalSplitInbound),
    totalPrice: finalSplitTotal,
    bookingLink: "#",
  };

  const savings = {
    amount: standardTotal - finalSplitTotal,
    percentage: Math.round(((standardTotal - finalSplitTotal) / standardTotal) * 100),
  };

  return {
    standard,
    splitTicket,
    savings,
  };
}
