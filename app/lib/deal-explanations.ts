// Deal Explanation Generator
// Creates detailed, actionable instructions for recreating each deal

import { getAirportFull } from "./airports-db";

export interface DealExplanation {
  title: string;
  summary: string;
  steps: string[];
  tools: string[];
  warnings: string[];
  estimatedSavings: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeRequired: string;
}

/**
 * Generate detailed explanation for a deal
 */
export function generateDealExplanation(
  origin: string,
  destination: string,
  dealPrice: number,
  standardPrice: number,
  strategy: string,
  source: string
): DealExplanation {
  const originAirport = getAirportFull(origin);
  const destAirport = getAirportFull(destination);
  const savings = standardPrice - dealPrice;
  
  // Strategy-specific explanations
  const explanations: Record<string, DealExplanation> = {
    "rss-deal": {
      title: `Flash Deal: ${origin} → ${destination} for £${dealPrice}`,
      summary: `This is a limited-time deal found on ${source}. These deals typically last 24-48 hours and sell out quickly.`,
      steps: [
        `Click the "View Deal" button above to go directly to ${source}`,
        `If the link doesn't work, go to ${source.toLowerCase().replace(/\s/g, '')}.com`,
        `Search for "${origin} to ${destination}" or "${originAirport.city} to ${destAirport.city}"`,
        `Look for the most recent deal posted within the last 24 hours`,
        `Click through to the booking site (usually an OTA like Expedia or the airline direct)`,
        `Enter your exact travel dates: [Your Selected Dates]`,
        `Complete booking quickly - these deals expire fast!`
      ],
      tools: [source, "Web browser", "Credit card ready"],
      warnings: [
        "Deal may expire within hours",
        "Price may change when you select specific dates",
        "Baggage and seat selection may be extra",
        "Check cancellation policy before booking"
      ],
      estimatedSavings: `£${savings}`,
      difficulty: "Easy",
      timeRequired: "5-10 minutes"
    },
    
    "split-ticket": {
      title: `Split Ticket Strategy: Save with Two One-Way Tickets`,
      summary: `Instead of booking a round-trip ticket, book two separate one-way tickets. This often unlocks lower fares from different airlines.`,
      steps: [
        `OUTBOUND: Go to Google Flights (flights.google.com)`,
        `Search one-way: ${origin} → ${destination} on [Your Departure Date]`,
        `Note the cheapest airline and price`,
        ``,
        `RETURN: Search one-way: ${destination} → ${origin} on [Your Return Date]`,
        `Note the cheapest airline and price`,
        ``,
        `Book both tickets separately on their respective airline websites`,
        `Use the same passenger details for both bookings`,
        `Save both confirmation numbers`
      ],
      tools: ["Google Flights", "Airline websites", "Spreadsheet to track"],
      warnings: [
        "If you miss a connection, airlines won't help (separate bookings)",
        "You need to collect and re-check baggage between flights",
        "Allow at least 3 hours between separate tickets",
        "Different cancellation policies for each ticket"
      ],
      estimatedSavings: `£${savings} - £${Math.round(savings * 1.5)}`,
      difficulty: "Medium",
      timeRequired: "20-30 minutes"
    },
    
    "nearby-origin": {
      title: `Nearby Airport Strategy: Fly from ${origin} Alternative`,
      summary: `Flying from a nearby airport can save significant money. Factor in ground transport costs to determine true savings.`,
      steps: [
        `Check transport options to alternative airports near ${originAirport.city}:`,
        `  - ${getNearbyAirports(origin).map(a => a.code).join(', ')}`,
        ``,
        `Calculate total cost: Flight price + Transport + Parking (if driving)`,
        ``,
        `Go to Skyscanner or Google Flights`,
        `Search from alternative airport to ${destination}`,
        `Compare total cost vs flying from ${origin}`,
        `Book if savings exceed £30+ after transport costs`
      ],
      tools: ["Skyscanner", "Google Flights", "Train/bus booking sites", "Parking calculators"],
      warnings: [
        "Factor in all transport costs",
        "Allow extra time to reach alternative airport",
        "Check parking costs if driving",
        "Return journey transport also needed"
      ],
      estimatedSavings: `£${savings} - £${Math.round(savings * 2)}`,
      difficulty: "Medium",
      timeRequired: "30-45 minutes"
    },
    
    "nearby-destination": {
      title: `Nearby Destination Strategy: Fly to Alternative Airport`,
      summary: `Flying into a nearby city and taking ground transport can be significantly cheaper, especially in Europe.`,
      steps: [
        `Check airports near ${destAirport.city}:`,
        `  - ${getNearbyAirports(destination).map(a => a.code).join(', ')}`,
        ``,
        `Search flights to each alternative airport`,
        `Check train/bus connections to final destination`,
        ``,
        `Calculate total journey time and cost`,
        `Book flight + ground transport separately`,
        `Allow 2-3 hours between flight arrival and train/bus`
      ],
      tools: ["Skyscanner", "Rome2Rio", "Trainline", "Rental car sites"],
      warnings: [
        "Journey time will be longer",
        "Separate bookings = no protection if delayed",
        "Language barriers at alternative airports",
        "Luggage handling between flight and ground transport"
      ],
      estimatedSavings: `£${savings} - £${Math.round(savings * 2)}`,
      difficulty: "Hard",
      timeRequired: "45-60 minutes"
    },
    
    "flexible-dates": {
      title: `Flexible Dates Strategy: Shift Your Travel by a Few Days`,
      summary: `Moving your departure or return by 1-3 days can unlock significantly lower fares.`,
      steps: [
        `Go to Google Flights (flights.google.com)`,
        `Search: ${origin} → ${destination}`,
        `Select "Flexible dates" or view price graph`,
        ``,
        `Look at prices for:`,
        `  - 3 days before your preferred date`,
        `  - 3 days after your preferred date`,
        ``,
        `Identify the cheapest date combination`,
        `Check if hotel/activities can be adjusted`,
        `Book the cheaper dates`
      ],
      tools: ["Google Flights", "Skyscanner whole month view", "Hopper app"],
      warnings: [
        "Hotel bookings may need changing",
        "Time off work may need adjusting",
        "Event tickets may be date-specific",
        "Best for leisure travel, not business"
      ],
      estimatedSavings: `£${savings} - £${Math.round(savings * 3)}`,
      difficulty: "Easy",
      timeRequired: "10-15 minutes"
    },
    
    "hidden-city": {
      title: `Hidden City Strategy: Book a Longer Route, Get Off Early`,
      summary: `Book a flight with a connection in your actual destination, then skip the final leg. Use with caution!`,
      steps: [
        `Search flights from ${origin} to various destinations`,
        `Look for routes with a connection IN ${destination}`,
        ``,
        `Example: Book ${origin} → ${destination} → [Another City]`,
        `Get off at ${destination} (don't board final leg)`,
        ``,
        `⚠️ CRITICAL: Only works for one-way or final leg of return`,
        `⚠️ Cannot check bags (they go to final destination)`,
        `⚠️ Airlines may ban you for repeated use`
      ],
      tools: ["Skiplagged.com", "Google Flights", "ExpertFlyer"],
      warnings: [
        "Airlines hate this - use sparingly",
        "Cannot check luggage",
        "Return ticket will be cancelled if you skip leg",
        "May violate airline terms of service",
        "Only for experienced travelers"
      ],
      estimatedSavings: `£${savings} - £${Math.round(savings * 4)}`,
      difficulty: "Hard",
      timeRequired: "20-30 minutes"
    }
  };
  
  // Return specific explanation or generic fallback
  return explanations[strategy] || {
    title: `Deal Found: ${origin} → ${destination}`,
    summary: `We found a deal using our ${strategy} strategy.`,
    steps: [
      `Click the booking link above`,
      `Enter your travel dates: [Your Dates]`,
      `Complete the booking process`
    ],
    tools: ["Web browser"],
    warnings: ["Verify all details before booking"],
    estimatedSavings: `£${savings}`,
    difficulty: "Easy",
    timeRequired: "10 minutes"
  };
}

/**
 * Get nearby airports for a given code
 */
function getNearbyAirports(airportCode: string): Array<{ code: string; name: string; distance: string }> {
  const nearbyMap: Record<string, Array<{ code: string; name: string; distance: string }>> = {
    "LHR": [
      { code: "LGW", name: "London Gatwick", distance: "45km" },
      { code: "STN", name: "London Stansted", distance: "65km" },
      { code: "LTN", name: "London Luton", distance: "55km" },
    ],
    "CDG": [
      { code: "ORY", name: "Paris Orly", distance: "35km" },
      { code: "BVA", name: "Paris Beauvais", distance: "85km" },
    ],
    "JFK": [
      { code: "EWR", name: "Newark", distance: "35km" },
      { code: "LGA", name: "LaGuardia", distance: "20km" },
    ],
    "SFO": [
      { code: "OAK", name: "Oakland", distance: "25km" },
      { code: "SJC", name: "San Jose", distance: "50km" },
    ],
    "LAX": [
      { code: "BUR", name: "Burbank", distance: "30km" },
      { code: "LGB", name: "Long Beach", distance: "35km" },
    ],
  };
  
  return nearbyMap[airportCode.toUpperCase()] || [];
}

/**
 * Generate comparison explanation
 */
export function generateComparisonExplanation(
  strategy1: string,
  price1: number,
  strategy2: string,
  price2: number
): string {
  const diff = Math.abs(price1 - price2);
  const cheaper = price1 < price2 ? strategy1 : strategy2;
  
  return `The ${cheaper} strategy saves you £${diff} compared to the alternative. This is because ${getReasonForStrategy(cheaper)}.`;
}

function getReasonForStrategy(strategy: string): string {
  const reasons: Record<string, string> = {
    "rss-deal": "deal sites negotiate bulk discounts or catch error fares",
    "split-ticket": "airlines price one-way tickets differently than round-trips",
    "nearby-origin": "alternative airports have lower landing fees and less demand",
    "nearby-destination": "flying to a nearby city unlocks different airline pricing zones",
    "flexible-dates": "airlines use dynamic pricing based on demand patterns",
    "hidden-city": "airlines price connecting flights cheaper than direct routes"
  };
  
  return reasons[strategy] || "of pricing inefficiencies in the airline industry";
}
