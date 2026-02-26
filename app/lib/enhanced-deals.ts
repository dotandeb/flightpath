// Enhanced Deal Display with Exact Flight Details
// Shows specific flights, times, airlines for split tickets

export interface ExactFlightDetails {
  leg: string; // "OUTBOUND" | "RETURN" | "LEG 1" | "LEG 2"
  flightNumber: string;
  airline: string;
  airlineCode: string;
  departure: {
    airport: string;
    airportCode: string;
    city: string;
    country: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    city: string;
    country: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  stopover?: {
    airport: string;
    city: string;
    country: string;
    duration: string;
  };
  aircraft?: string;
  class: string;
  price: number;
  currency: string;
  bookingUrl: string;
  baggage: {
    carryOn: string;
    checked: string;
  };
}

export interface SplitTicketDetails {
  strategy: "split-ticket";
  title: string;
  subtitle: string;
  totalPrice: number;
  currency: string;
  savingsVsStandard: number;
  legs: ExactFlightDetails[];
  bookingInstructions: {
    step: number;
    action: string;
    details: string;
    website: string;
    url: string;
  }[];
  risks: string[];
  tips: string[];
}

/**
 * Generate exact flight details for split ticket example
 * This would normally come from Amadeus API
 */
export function generateSplitTicketExample(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  cabinClass: string = "ECONOMY"
): SplitTicketDetails {
  
  // Determine class display name and price multiplier
  const isBusiness = cabinClass === "BUSINESS" || cabinClass === "FIRST";
  const className = isBusiness ? "Business" : "Economy";
  const priceMultiplier = isBusiness ? 3.5 : 1; // Business is ~3.5x economy price
  
  // Example: LHR to BKK split ticket via different airlines
  const baseOutboundPrice = 320;
  const baseReturnPrice = returnDate ? 280 : 0;
  const outboundPrice = Math.round(baseOutboundPrice * priceMultiplier);
  const returnPrice = returnDate ? Math.round(baseReturnPrice * priceMultiplier) : 0;
  const totalPrice = outboundPrice + returnPrice;
  const standardPrice = Math.round(750 * priceMultiplier); // Estimated standard price
  
  return {
    strategy: "split-ticket",
    title: `💰 SAVE £${standardPrice - totalPrice}: Book ${returnDate ? 'TWO SINGLE TICKETS' : 'ONE SINGLE TICKET'}`,
    subtitle: returnDate 
      ? `Book TWO SEPARATE ONE-WAY ${className.toUpperCase()} tickets on TWO DIFFERENT airlines. NOT a return ticket.`
      : `Book ONE SINGLE ONE-WAY ${className.toUpperCase()} ticket. NOT a return ticket.`,
    totalPrice,
    currency: "GBP",
    savingsVsStandard: standardPrice - totalPrice,
    legs: [
      {
        leg: "OUTBOUND - Ticket 1",
        flightNumber: "TG911",
        airline: "Thai Airways",
        airlineCode: "TG",
        departure: {
          airport: "Heathrow Airport",
          airportCode: "LHR",
          city: "London",
          country: "United Kingdom",
          time: "12:30",
          date: departureDate
        },
        arrival: {
          airport: "Suvarnabhumi Airport",
          airportCode: "BKK",
          city: "Bangkok",
          country: "Thailand",
          time: "06:00",
          date: addDays(departureDate, 1) // Next day
        },
        duration: "11h 30m",
        stops: 0,
        class: className,
        price: outboundPrice,
        currency: "GBP",
        bookingUrl: "https://www.thaiairways.com/en/book.html",
        baggage: {
          carryOn: isBusiness ? "14kg included" : "7kg included",
          checked: isBusiness ? "40kg included" : "30kg included"
        }
      },
      ...(returnDate ? [{
        leg: "RETURN - Ticket 2",
        flightNumber: "EK374",
        airline: "Emirates",
        airlineCode: "EK",
        departure: {
          airport: "Suvarnabhumi Airport",
          airportCode: "BKK",
          city: "Bangkok",
          country: "Thailand",
          time: "14:20",
          date: returnDate
        },
        arrival: {
          airport: "Heathrow Airport",
          airportCode: "LHR",
          city: "London",
          country: "United Kingdom",
          time: "20:45",
          date: returnDate // Same day
        },
        duration: "13h 25m",
        stops: 1,
        stopover: {
          airport: "Dubai International (DXB)",
          city: "Dubai",
          country: "United Arab Emirates",
          duration: "2h 30m"
        },
        class: className,
        price: returnPrice,
        currency: "GBP",
        bookingUrl: "https://www.emirates.com/uk/english/book/",
        baggage: {
          carryOn: isBusiness ? "14kg included" : "7kg included",
          checked: isBusiness ? "40kg included" : "30kg included"
        }
      }] : [])
    ],
    bookingInstructions: [
      {
        step: 1,
        action: `🎫 Book SINGLE ${className.toUpperCase()} TICKET #1 - Outbound`,
        details: `Book this ONE-WAY ${className.toUpperCase()} ticket FIRST:\n\n` +
                 `✈️ Flight: Thai Airways TG911\n` +
                 `📍 Route: London (LHR), United Kingdom → Bangkok (BKK), Thailand\n` +
                 `📅 Date: ${departureDate}\n` +
                 `🕐 Time: 12:30 → 06:00+1 (next day)\n` +
                 `💺 Class: ${className}\n` +
                 `💰 Price: £${outboundPrice}\n\n` +
                 `⚠️ You will receive ONE confirmation number for THIS ticket only.`,
        website: "Thai Airways Official",
        url: "https://www.thaiairways.com/en/book.html"
      },
      {
        step: 2,
        action: "✅ Confirm Ticket #1 Before Proceeding",
        details: `WAIT for email confirmation from Thai Airways before booking ticket #2.\n\n` +
                 `Check your email for:\n` +
                 `• Confirmation number (6 characters)\n` +
                 `• Flight details match: TG911 on ${departureDate}\n` +
                 `• Passenger name is EXACTLY as on passport`,
        website: "Check Email",
        url: ""
      },
      ...(returnDate ? [{
        step: 3,
        action: `🎫 Book SINGLE ${className.toUpperCase()} TICKET #2 - Return`,
        details: `Book this SECOND ONE-WAY ${className.toUpperCase()} ticket:\n\n` +
                 `✈️ Flight: Emirates EK374\n` +
                 `📍 Route: Bangkok (BKK), Thailand → London (LHR), United Kingdom\n` +
                 `📅 Date: ${returnDate}\n` +
                 `🕐 Time: 14:20 → 20:45 (same day)\n` +
                 `⏱️ Stopover: Dubai (DXB), UAE - 2h 30m\n` +
                 `💺 Class: ${className}\n` +
                 `💰 Price: £${returnPrice}\n\n` +
                 `⚠️ Use EXACT SAME passenger name as Ticket #1`,
        website: "Emirates Official",
        url: "https://www.emirates.com/uk/english/book/"
      },
      {
        step: 4,
        action: "✅ Save Both Confirmation Numbers",
        details: `You now have TWO COMPLETELY SEPARATE TICKETS:\n\n` +
                 `Ticket #1: Thai Airways (Outbound)\n` +
                 `Ticket #2: Emirates (Return)\n\n` +
                 `⚠️ These airlines do NOT know about each other.\n` +
                 `⚠️ If one flight is cancelled, the other airline will NOT help you.`,
        website: "Save Confirmations",
        url: ""
      }] : [])
    ],
    risks: [
      "⚠️ CRITICAL: These are TWO SEPARATE SINGLE TICKETS - not a return ticket",
      "⚠️ The airlines do NOT know about each other - you are booking independently",
      "If outbound flight is cancelled, Emirates will NOT rebook your return",
      "You must collect and re-check baggage in Bangkok (not through-checked)",
      "Different cancellation/change policies for each single ticket",
      "No airline assistance if delays cause missed connections",
      "You need TWO separate check-ins (24hrs before each flight)"
    ],
    tips: [
      "Book outbound SINGLE TICKET first, wait for email confirmation",
      "Use EXACT same passenger name spelling on BOTH single tickets",
      "You will have TWO confirmation numbers - save both",
      "Set TWO calendar reminders: 24hrs before EACH flight for check-in",
      "Download BOTH airline apps (Thai Airways AND Emirates)",
      "At airport: Check in for each flight separately",
      "In Bangkok: Collect bags, exit, re-check with other airline",
      "Consider travel insurance covering separate single tickets"
    ]
  };
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Generate nearby airport example with transport details
 */
export function generateNearbyAirportExample(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined
) {
  const nearbyAirports: Record<string, Array<{code: string, name: string, transport: string, cost: number, time: string}>> = {
    "LHR": [
      { code: "LGW", name: "Gatwick", transport: "Gatwick Express train", cost: 20, time: "30 mins from Victoria" },
      { code: "STN", name: "Stansted", transport: "Stansted Express train", cost: 20, time: "45 mins from Liverpool St" },
      { code: "LTN", name: "Luton", transport: "Thameslink train", cost: 15, time: "40 mins from St Pancras" }
    ],
    "JFK": [
      { code: "EWR", name: "Newark", transport: "AirTrain + NJ Transit", cost: 15, time: "45 mins from Manhattan" }
    ]
  };
  
  const alternatives = nearbyAirports[origin] || [];
  
  return {
    strategy: "nearby-origin",
    alternatives: alternatives.map(alt => ({
      airport: alt,
      flightPrice: 380, // Example cheaper price
      transportCost: alt.cost,
      totalCost: 380 + alt.cost,
      savings: 100 // vs flying from original airport
    })),
    instructions: [
      "Check train times to alternative airport",
      "Book train ticket in advance for discount",
      "Arrive at alternative airport 2 hours early",
      "Factor in transport time to total journey"
    ]
  };
}

/**
 * Generate flexible dates example
 */
export function generateFlexibleDatesExample(
  origin: string,
  destination: string,
  preferredDate: string
) {
  const preferred = new Date(preferredDate);
  
  // Generate prices for nearby dates
  const dateGrid = [];
  for (let i = -3; i <= 3; i++) {
    const date = new Date(preferred);
    date.setDate(date.getDate() + i);
    
    // Simulate cheaper prices on Tue/Wed
    const dayOfWeek = date.getDay();
    const isCheapDay = dayOfWeek === 2 || dayOfWeek === 3; // Tue or Wed
    const price = isCheapDay ? 420 : 550;
    
    dateGrid.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      price,
      isCheapest: isCheapDay
    });
  }
  
  const cheapest = dateGrid.find(d => d.isCheapest);
  
  return {
    strategy: "flexible-dates",
    dateGrid,
    cheapestDate: cheapest,
    savings: 550 - (cheapest?.price || 550),
    instructions: [
      `Shift your departure to ${cheapest?.dayOfWeek} ${cheapest?.date} to save £${550 - (cheapest?.price || 550)}`,
      "Use Google Flights date grid to visualize prices",
      "Tuesday and Wednesday departures are usually cheapest",
      "Avoid Friday departures and Sunday returns (most expensive)"
    ]
  };
}
