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
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  stopover?: {
    airport: string;
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
  returnDate: string | undefined
): SplitTicketDetails {
  
  // Example: LHR to BKK split ticket via different airlines
  const outboundPrice = 320;
  const returnPrice = returnDate ? 280 : 0;
  const totalPrice = outboundPrice + returnPrice;
  const standardPrice = 750; // Estimated standard price
  
  return {
    strategy: "split-ticket",
    title: `💰 SAVE £${standardPrice - totalPrice}: Book ${returnDate ? 'TWO SINGLE TICKETS' : 'ONE SINGLE TICKET'}`,
    subtitle: returnDate 
      ? `Book TWO SEPARATE ONE-WAY tickets on TWO DIFFERENT airlines. NOT a return ticket.`
      : `Book ONE SINGLE ONE-WAY ticket. NOT a return ticket.`,
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
          time: "12:30",
          date: departureDate
        },
        arrival: {
          airport: "Suvarnabhumi Airport",
          airportCode: "BKK",
          city: "Bangkok",
          time: "06:00",
          date: addDays(departureDate, 1) // Next day
        },
        duration: "11h 30m",
        stops: 0,
        class: "Economy",
        price: outboundPrice,
        currency: "GBP",
        bookingUrl: "https://www.thaiairways.com",
        baggage: {
          carryOn: "7kg included",
          checked: "30kg included"
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
          time: "14:20",
          date: returnDate
        },
        arrival: {
          airport: "Heathrow Airport",
          airportCode: "LHR",
          city: "London",
          time: "20:45",
          date: returnDate // Same day
        },
        duration: "13h 25m",
        stops: 1,
        stopover: {
          airport: "Dubai (DXB)",
          duration: "2h 30m"
        },
        class: "Economy",
        price: returnPrice,
        currency: "GBP",
        bookingUrl: "https://www.emirates.com",
        baggage: {
          carryOn: "7kg included",
          checked: "30kg included"
        }
      }] : [])
    ],
    bookingInstructions: [
      {
        step: 1,
        action: "🎫 Book SINGLE TICKET #1 - Outbound",
        details: `This is a SEPARATE ONE-WAY ticket. Book Thai Airways TG911 from LHR to BKK on ${departureDate}. Price: £${outboundPrice}. You will receive ONE confirmation number for this ticket only.`,
        website: "Thai Airways",
        url: "https://www.thaiairways.com"
      },
      {
        step: 2,
        action: "✅ Complete Ticket #1 Booking",
        details: "Use exact passenger name as on passport. Save confirmation number. This is ONLY for your outbound flight.",
        website: "Thai Airways",
        url: "https://www.thaiairways.com"
      },
      ...(returnDate ? [{
        step: 3,
        action: "🎫 Book SINGLE TICKET #2 - Return (SEPARATE BOOKING)",
        details: `This is a DIFFERENT ONE-WAY ticket from a DIFFERENT AIRLINE. Book Emirates EK374 from BKK to LHR on ${returnDate}. Price: £${returnPrice}. Use EXACT SAME passenger name as Ticket #1. You will receive a SECOND confirmation number.`,
        website: "Emirates",
        url: "https://www.emirates.com"
      },
      {
        step: 4,
        action: "✅ Complete Ticket #2 Booking",
        details: "Save this second confirmation number. You now have TWO SEPARATE SINGLE TICKETS on TWO DIFFERENT AIRLINES. They are NOT connected.",
        website: "Emirates",
        url: "https://www.emirates.com"
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
