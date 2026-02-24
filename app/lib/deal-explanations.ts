// Specific Deal Recreation Instructions
// Step-by-step with exact booking details

import { getAirportFull } from "./airports-db";

export interface SpecificDealInstructions {
  title: string;
  summary: string;
  bookingMethod: "direct" | "ota" | "split" | "multi-city";
  exactSteps: {
    step: number;
    action: string;
    details: string;
    website?: string;
    searchParams?: Record<string, string>;
  }[];
  whatToBook: {
    leg: string;
    route: string;
    airline: string;
    flightType: string;
    expectedPrice: string;
    whereToBook: string;
  }[];
  totalCost: string;
  savingsVsStandard: string;
  warnings: string[];
  tips: string[];
  alternativeOptions: string[];
}

/**
 * Generate specific instructions for recreating a deal
 */
export function generateSpecificInstructions(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  dealPrice: number,
  strategy: string
): SpecificDealInstructions {
  const originAirport = getAirportFull(origin);
  const destAirport = getAirportFull(destination);
  
  // Format dates for display
  const depDateFormatted = new Date(departureDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const retDateFormatted = returnDate ? new Date(returnDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }) : 'N/A';

  switch(strategy) {
    case "split-ticket":
      return generateSplitTicketInstructions(origin, destination, originAirport, destAirport, departureDate, returnDate, depDateFormatted, retDateFormatted, dealPrice);
    
    case "nearby-origin":
      return generateNearbyOriginInstructions(origin, destination, originAirport, destAirport, departureDate, returnDate, depDateFormatted, retDateFormatted, dealPrice);
    
    case "flexible-dates":
      return generateFlexibleDateInstructions(origin, destination, originAirport, destAirport, departureDate, returnDate, depDateFormatted, retDateFormatted, dealPrice);
    
    case "rss-deal":
    default:
      return generateRSSDealInstructions(origin, destination, originAirport, destAirport, departureDate, returnDate, depDateFormatted, retDateFormatted, dealPrice);
  }
}

function generateRSSDealInstructions(
  origin: string, 
  destination: string, 
  originAirport: any, 
  destAirport: any,
  departureDate: string,
  returnDate: string | undefined,
  depDateFormatted: string,
  retDateFormatted: string,
  dealPrice: number
): SpecificDealInstructions {
  return {
    title: `Flash Deal: ${originAirport.city} → ${destAirport.city} for £${dealPrice}`,
    summary: `Limited-time deal found on deal sites. These expire in 24-48 hours.`,
    bookingMethod: "ota",
    exactSteps: [
      {
        step: 1,
        action: "Go to Google Flights",
        details: "Start here to verify the price is still available",
        website: "flights.google.com"
      },
      {
        step: 2,
        action: "Enter route and dates",
        details: `${origin} → ${destination}, ${returnDate ? 'Round trip' : 'One way'}`,
        searchParams: {
          origin: origin,
          destination: destination,
          departure: departureDate,
          return: returnDate || '',
          passengers: "1"
        }
      },
      {
        step: 3,
        action: "Click 'Search' and view results",
        details: "Look for the cheapest option - should be around £" + dealPrice
      },
      {
        step: 4,
        action: "Click through to book",
        details: "Google Flights will show booking options - pick the cheapest OTA or airline direct"
      },
      {
        step: 5,
        action: "Complete booking on final site",
        details: "Enter passenger details exactly as on passport. Double-check dates before paying."
      }
    ],
    whatToBook: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `${origin} ↔ ${destination}`,
        airline: "Various (whichever is cheapest)",
        flightType: returnDate ? "Return ticket" : "One-way ticket",
        expectedPrice: `£${dealPrice}`,
        whereToBook: "Google Flights → Airline/OTA"
      }
    ],
    totalCost: `£${dealPrice} per person`,
    savingsVsStandard: "£50-150",
    warnings: [
      "Price may change when you select specific dates",
      "Deal expires in 24-48 hours",
      "Baggage not included (add £30-50 if checking bags)",
      "Seat selection may cost extra"
    ],
    tips: [
      "Use incognito mode to avoid price increases",
      "Have passport details ready before starting",
      "Book quickly - prices change every few hours",
      "Screenshot the deal price before booking"
    ],
    alternativeOptions: [
      "Check Skyscanner if Google Flights price is higher",
      "Try Momondo as backup OTA",
      "Check airline direct (sometimes cheaper)"
    ]
  };
}

function generateSplitTicketInstructions(
  origin: string, 
  destination: string, 
  originAirport: any, 
  destAirport: any,
  departureDate: string,
  returnDate: string | undefined,
  depDateFormatted: string,
  retDateFormatted: string,
  dealPrice: number
): SpecificDealInstructions {
  if (!returnDate) {
    return generateRSSDealInstructions(origin, destination, originAirport, destAirport, departureDate, returnDate, depDateFormatted, retDateFormatted, dealPrice);
  }

  const outboundPrice = Math.round(dealPrice * 0.55);
  const returnPrice = Math.round(dealPrice * 0.5);

  return {
    title: `Split Ticket: Two One-Way Flights for £${dealPrice}`,
    summary: `Book outbound and return separately. Often cheaper than round-trip.`,
    bookingMethod: "split",
    exactSteps: [
      {
        step: 1,
        action: "BOOK OUTBOUND FIRST",
        details: "Go to Google Flights",
        website: "flights.google.com"
      },
      {
        step: 2,
        action: "Search ONE-WAY",
        details: `${origin} → ${destination} on ${depDateFormatted}`,
        searchParams: {
          origin: origin,
          destination: destination,
          departure: departureDate,
          tripType: "one-way"
        }
      },
      {
        step: 3,
        action: "Note the cheapest airline and price",
        details: `Should be around £${outboundPrice}. Write down the airline name.`
      },
      {
        step: 4,
        action: "Click through and BOOK OUTBOUND NOW",
        details: "Complete this booking before searching return. Use exact passenger name as on passport."
      },
      {
        step: 5,
        action: "SAVE confirmation number",
        details: "Screenshot or write down the booking reference. You'll get this via email too."
      },
      {
        step: 6,
        action: "NOW BOOK RETURN",
        details: "Go back to Google Flights (new tab)"
      },
      {
        step: 7,
        action: "Search ONE-WAY return",
        details: `${destination} → ${origin} on ${retDateFormatted}`,
        searchParams: {
          origin: destination,
          destination: origin,
          departure: returnDate,
          tripType: "one-way"
        }
      },
      {
        step: 8,
        action: "Note cheapest airline (may be different)",
        details: `Should be around £${returnPrice}. Could be different airline than outbound - that's fine!`
      },
      {
        step: 9,
        action: "Click through and BOOK RETURN",
        details: "Use EXACT same passenger details as outbound booking."
      },
      {
        step: 10,
        action: "SAVE second confirmation number",
        details: "You now have two separate bookings. Keep both confirmation emails."
      }
    ],
    whatToBook: [
      {
        leg: "OUTBOUND",
        route: `${origin} → ${destination}`,
        airline: "Cheapest available (varies)",
        flightType: "One-way ticket",
        expectedPrice: `£${outboundPrice}`,
        whereToBook: "Google Flights → Airline direct"
      },
      {
        leg: "RETURN",
        route: `${destination} → ${origin}`,
        airline: "Cheapest available (may differ)",
        flightType: "One-way ticket",
        expectedPrice: `£${returnPrice}`,
        whereToBook: "Google Flights → Airline direct"
      }
    ],
    totalCost: `£${outboundPrice} + £${returnPrice} = £${dealPrice} per person`,
    savingsVsStandard: "£30-80",
    warnings: [
      "⚠️ CRITICAL: These are SEPARATE bookings - airlines won't help if you miss connections",
      "If outbound is delayed/cancelled, return ticket is NOT protected",
      "You must collect and re-check baggage at destination",
      "Allow 3+ hours between flights if connecting",
      "Different cancellation policies for each ticket"
    ],
    tips: [
      "Book outbound first, return second - don't wait between bookings",
      "Use exact same name spelling on both bookings",
      "Set calendar reminders for both check-ins (24 hours before each flight)",
      "Download both airline apps for check-in",
      "Consider travel insurance that covers separate bookings"
    ],
    alternativeOptions: [
      "If prices similar, book round-trip for protection",
      "Try booking both legs with same airline via their website",
      "Check if airline offers 'multi-city' booking (sometimes cheaper)"
    ]
  };
}

function generateNearbyOriginInstructions(
  origin: string, 
  destination: string, 
  originAirport: any, 
  destAirport: any,
  departureDate: string,
  returnDate: string | undefined,
  depDateFormatted: string,
  retDateFormatted: string,
  dealPrice: number
): SpecificDealInstructions {
  const transportCost = 30;
  const flightPrice = dealPrice - transportCost;

  return {
    title: `Nearby Airport: Fly from Alternative London Airport`,
    summary: `Gatwick (LGW) or Stansted (STN) often cheaper than Heathrow.`,
    bookingMethod: "direct",
    exactSteps: [
      {
        step: 1,
        action: "Check transport to alternative airports",
        details: "Compare costs: Gatwick Express (£20), Stansted Express (£20), Uber (£40-60), Drive (parking £50-80/week)"
      },
      {
        step: 2,
        action: "Go to Skyscanner",
        details: "Best for comparing alternative airports",
        website: "skyscanner.net"
      },
      {
        step: 3,
        action: "Enter departure: 'London (Any)'",
        details: "This searches LHR, LGW, STN, LTN all at once"
      },
      {
        step: 4,
        action: `Enter destination: ${destination}`,
        details: "Keep same destination"
      },
      {
        step: 5,
        action: "Compare prices from each London airport",
        details: "Look at LHR vs LGW vs STN prices"
      },
      {
        step: 6,
        action: "Calculate TOTAL cost",
        details: `Flight price + Transport (£20-60) + Parking (if driving, £50-80/week)`
      },
      {
        step: 7,
        action: "Book if savings exceed £30",
        details: "Only worth it if total savings > £30 after transport costs"
      }
    ],
    whatToBook: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `LGW/STN ↔ ${destination}`,
        airline: "Various",
        flightType: returnDate ? "Return from alternative airport" : "One-way from alternative",
        expectedPrice: `£${flightPrice} (flight) + £${transportCost} (transport)`,
        whereToBook: "Skyscanner → Airline direct"
      }
    ],
    totalCost: `£${dealPrice} per person (including transport)`,
    savingsVsStandard: "£40-100 (after transport)",
    warnings: [
      "Factor in ALL costs: train/bus/taxi + parking + time",
      "Journey to airport takes 45-90 minutes from central London",
      "Return journey also needed",
      "Gatwick/Stansted have fewer flight options than Heathrow"
    ],
    tips: [
      "Gatwick Express: 30 mins from Victoria, £20",
      "Stansted Express: 45 mins from Liverpool St, £20",
      "Book trains in advance for discounts",
      "If driving, compare airport parking prices on comparison sites",
      "Allow extra time - alternative airports are farther"
    ],
    alternativeOptions: [
      "Luton (LTN) - budget airlines, 1 hour from London",
      "Southend (SEN) - smallest, limited routes",
      "Check if flying from Birmingham/Bristol is cheaper (train from London)"
    ]
  };
}

function generateFlexibleDateInstructions(
  origin: string, 
  destination: string, 
  originAirport: any, 
  destAirport: any,
  departureDate: string,
  returnDate: string | undefined,
  depDateFormatted: string,
  retDateFormatted: string,
  dealPrice: number
): SpecificDealInstructions {
  return {
    title: `Flexible Dates: Shift Travel by 1-3 Days`,
    summary: `Tuesday/Wednesday flights often cheaper than Friday/Sunday.`,
    bookingMethod: "direct",
    exactSteps: [
      {
        step: 1,
        action: "Go to Google Flights",
        details: "Best tool for flexible date viewing",
        website: "flights.google.com"
      },
      {
        step: 2,
        action: "Enter your route",
        details: `${origin} → ${destination}`
      },
      {
        step: 3,
        action: "Click 'Date grid' or 'Price graph'",
        details: "Shows prices across different dates"
      },
      {
        step: 4,
        action: "Look at prices for:",
        details: "• 3 days before your preferred date\n• 3 days after your preferred date\n• Different return date combinations"
      },
      {
        step: 5,
        action: "Identify cheapest combination",
        details: "Usually Tuesday/Wednesday departures are cheapest"
      },
      {
        step: 6,
        action: "Check if you can adjust travel",
        details: "Can you shift dates? Is hotel flexible?"
      },
      {
        step: 7,
        action: "Book the cheaper dates",
        details: "Click through to airline/OTA and complete booking"
      }
    ],
    whatToBook: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `${origin} ↔ ${destination}`,
        airline: "Various",
        flightType: returnDate ? "Flexible date return" : "Flexible date one-way",
        expectedPrice: `£${dealPrice}`,
        whereToBook: "Google Flights → Airline/OTA"
      }
    ],
    totalCost: `£${dealPrice} per person`,
    savingsVsStandard: "£50-200",
    warnings: [
      "Hotel bookings may need changing (check cancellation policy)",
      "Time off work may need adjusting",
      "Event tickets may be date-specific",
      "Best for leisure travel, not business trips"
    ],
    tips: [
      "Tuesday/Wednesday departures usually cheapest",
      "Avoid Friday departures and Sunday returns (most expensive)",
      "Shoulder season (just before/after peak) has best prices",
      "Set up Google Flights price tracking for your dates",
      "Book 6-8 weeks in advance for international flights"
    ],
    alternativeOptions: [
      "Use Hopper app for price predictions",
      "Check Skyscanner 'whole month' view",
      "Consider flying into different return city (open-jaw)"
    ]
  };
}

/**
 * Get quick summary for display
 */
export function getQuickSummary(instructions: SpecificDealInstructions): string {
  const steps = instructions.whatToBook.map(w => w.leg).join(' + ');
  return `${steps}: ${instructions.totalCost} • ${instructions.savingsVsStandard} savings`;
}
