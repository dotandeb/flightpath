// Ultra-Specific Booking Instructions
// Click-by-click guidance for each strategy

import { getAirportFull } from "./airports-db";

export interface ClickByClickInstructions {
  title: string;
  summary: string;
  totalPrice: string;
  bookings: {
    leg: string;
    route: string;
    price: string;
    where: string;
    exactSteps: {
      step: number;
      website: string;
      url: string;
      action: string;
      whatToClick: string;
      whatToType: string;
      expectedResult: string;
    }[];
  }[];
  // Compatibility properties for old code
  whatToBook?: {
    leg: string;
    route: string;
    airline: string;
    flightType: string;
    expectedPrice: string;
    whereToBook: string;
  }[];
  exactSteps?: {
    step: number;
    action: string;
    details: string;
    website?: string;
  }[];
  totalCost?: string;
  savingsVsStandard?: string;
  alternativeOptions?: string[];
  warnings: string[];
  tips: string[];
}

/**
 * Generate click-by-click instructions
 */
export function generateClickByClickInstructions(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  strategy: string,
  price: number
): ClickByClickInstructions {
  const originAirport = getAirportFull(origin);
  const destAirport = getAirportFull(destination);
  
  // Format dates
  const depDateObj = new Date(departureDate);
  const retDateObj = returnDate ? new Date(returnDate) : null;
  
  const depDay = depDateObj.getDate();
  const depMonth = depDateObj.getMonth() + 1;
  const depYear = depDateObj.getFullYear();
  
  const retDay = retDateObj ? retDateObj.getDate() : null;
  const retMonth = retDateObj ? retDateObj.getMonth() + 1 : null;
  const retYear = retDateObj ? retDateObj.getFullYear() : null;

  // Build Google Flights URL
  const googleFlightsBase = "https://www.google.com/travel/flights";
  const gfSearchUrl = returnDate 
    ? `${googleFlightsBase}?hl=en#flt=${origin}.${destination}.${departureDate}*${destination}.${origin}.${returnDate};c:GBP;e:1;sd:1;t:f;tt:o`
    : `${googleFlightsBase}?hl=en#flt=${origin}.${destination}.${departureDate};c:GBP;e:1;sd:1;t:o;tt:o`;

  // Build Skyscanner URL
  const skyscannerUrl = returnDate
    ? `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&inboundaltsen` // truncated for brevity
    : `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&outboundaltsen`;

  // Build Kayak URL
  const kayakUrl = returnDate
    ? `https://www.kayak.co.uk/flights/${origin}-${destination}/${departureDate}/${returnDate}?sort=bestflight_a`
    : `https://www.kayak.co.uk/flights/${origin}-${destination}/${departureDate}?sort=bestflight_a`;

  switch(strategy) {
    case "split-ticket":
    case "amadeus-split-ticket":
      return addCompatibilityProps(generateSplitTicketClicks(origin, destination, originAirport, destAirport, departureDate, returnDate, depDay, depMonth, depYear, retDay, retMonth, retYear, price, googleFlightsBase));
    
    case "flexible-dates":
    case "amadeus-flexible-departure--2":
    case "amadeus-flexible-departure--1":
    case "amadeus-flexible-departure-1":
    case "amadeus-flexible-departure-2":
    case "amadeus-flexible-departure-3":
      return addCompatibilityProps(generateFlexibleDateClicks(origin, destination, originAirport, destAirport, departureDate, returnDate, depDay, depMonth, depYear, retDay, retMonth, retYear, price, googleFlightsBase, gfSearchUrl));
    
    case "nearby-origin":
    case "amadeus-nearby-origin":
      return addCompatibilityProps(generateNearbyOriginClicks(origin, destination, originAirport, destAirport, departureDate, returnDate, depDay, depMonth, depYear, retDay, retMonth, retYear, price, googleFlightsBase));
    
    default:
      return addCompatibilityProps(generateStandardClicks(origin, destination, originAirport, destAirport, departureDate, returnDate, depDay, depMonth, depYear, retDay, retMonth, retYear, price, googleFlightsBase, gfSearchUrl, skyscannerUrl, kayakUrl));
  }
}

function generateStandardClicks(
  origin: string, destination: string, originAirport: any, destAirport: any,
  departureDate: string, returnDate: string | undefined,
  depDay: number, depMonth: number, depYear: number,
  retDay: number | null, retMonth: number | null, retYear: number | null,
  price: number, googleFlightsBase: string, gfSearchUrl: string, skyscannerUrl: string, kayakUrl: string
): ClickByClickInstructions {
  
  return {
    title: `${origin} → ${destination} for £${price}`,
    summary: `Book this route using Google Flights or Skyscanner. Both show the same flights, but prices may vary slightly.`,
    totalPrice: `£${price} per person`,
    bookings: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `${origin} ↔ ${destination}`,
        price: `£${price}`,
        where: "Google Flights (recommended)",
        exactSteps: [
          {
            step: 1,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Open Google Flights",
            whatToClick: "Go to google.com and search 'Google Flights' OR click the button above",
            whatToType: "",
            expectedResult: "Google Flights page loads with empty search form"
          },
          {
            step: 2,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter departure airport",
            whatToClick: "Click the 'Where from?' box (top left)",
            whatToType: `Type: ${origin}`,
            expectedResult: `Dropdown shows "${originAirport.name}" - click it`
          },
          {
            step: 3,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter destination airport",
            whatToClick: "Click the 'Where to?' box (next to departure)",
            whatToType: `Type: ${destination}`,
            expectedResult: `Dropdown shows "${destAirport.name}" - click it`
          },
          {
            step: 4,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select departure date",
            whatToClick: "Click the departure date box",
            whatToType: `Select: ${depDay} ${getMonthName(depMonth)} ${depYear}`,
            expectedResult: "Calendar closes, date appears in box"
          },
          ...(returnDate ? [{
            step: 5,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select return date",
            whatToClick: "Click the return date box",
            whatToType: `Select: ${retDay} ${getMonthName(retMonth!)} ${retYear}`,
            expectedResult: "Calendar closes, both dates selected"
          }] : []),
          {
            step: returnDate ? 6 : 5,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Start search",
            whatToClick: "Click the blue 'Search' button",
            whatToType: "",
            expectedResult: "Flight results load with prices and airlines"
          },
          {
            step: returnDate ? 7 : 6,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select cheapest flight",
            whatToClick: "Click the top result (usually cheapest)",
            whatToType: "",
            expectedResult: "Flight details expand, showing booking options"
          },
          {
            step: returnDate ? 8 : 7,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Choose booking site",
            whatToClick: "Click the cheapest booking option (usually airline direct or Expedia)",
            whatToType: "",
            expectedResult: "Opens airline/OTA website in new tab"
          },
          {
            step: returnDate ? 9 : 8,
            website: "Airline/OTA Site",
            url: "varies",
            action: "Enter passenger details",
            whatToClick: "Fill in all passenger fields",
            whatToType: "EXACT name as on passport, email, phone",
            expectedResult: "All fields filled, no red error messages"
          },
          {
            step: returnDate ? 10 : 9,
            website: "Airline/OTA Site",
            url: "varies",
            action: "Complete payment",
            whatToClick: "Enter credit card details",
            whatToType: "Card number, expiry, CVV, billing address",
            expectedResult: "Payment processes, confirmation page shows"
          }
        ]
      }
    ],
    warnings: [
      "Price may change during booking - screenshot the price first",
      "Baggage not included - add £30-50 if checking a bag",
      "Seat selection costs extra on most airlines",
      "Book within 24 hours - prices change frequently"
    ],
    tips: [
      "Use incognito/private browser mode to avoid price increases",
      "Have passport ready - name must match EXACTLY",
      "Check cancellation policy before paying",
      "Screenshot the flight details before booking"
    ]
  };
}

function generateSplitTicketClicks(
  origin: string, destination: string, originAirport: any, destAirport: any,
  departureDate: string, returnDate: string | undefined,
  depDay: number, depMonth: number, depYear: number,
  retDay: number | null, retMonth: number | null, retYear: number | null,
  price: number, googleFlightsBase: string
): ClickByClickInstructions {
  
  const outboundPrice = Math.round(price * 0.55);
  const returnPrice = Math.round(price * 0.45);
  
  return {
    title: `Split Ticket: ${origin} → ${destination} for £${price}`,
    summary: `Book OUTBOUND and RETURN as separate one-way tickets. This often unlocks cheaper fares.`,
    totalPrice: `£${outboundPrice} + £${returnPrice} = £${price} per person`,
    bookings: [
      {
        leg: "OUTBOUND",
        route: `${origin} → ${destination}`,
        price: `£${outboundPrice}`,
        where: "Google Flights - One Way",
        exactSteps: [
          {
            step: 1,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Open Google Flights",
            whatToClick: "Go to flights.google.com",
            whatToType: "",
            expectedResult: "Google Flights loads"
          },
          {
            step: 2,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Switch to ONE-WAY",
            whatToClick: "Click 'Round trip' dropdown at top, select 'One way'",
            whatToType: "",
            expectedResult: "Form changes to show only departure date"
          },
          {
            step: 3,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter departure",
            whatToClick: "Click 'Where from?' box",
            whatToType: origin,
            expectedResult: `Select "${originAirport.name}"`
          },
          {
            step: 4,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter destination",
            whatToClick: "Click 'Where to?' box",
            whatToType: destination,
            expectedResult: `Select "${destAirport.name}"`
          },
          {
            step: 5,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select departure date",
            whatToClick: "Click departure date box",
            whatToType: `${depDay} ${getMonthName(depMonth)}`,
            expectedResult: "Date selected"
          },
          {
            step: 6,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Search flights",
            whatToClick: "Click 'Search'",
            whatToType: "",
            expectedResult: "One-way flight results show"
          },
          {
            step: 7,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select cheapest flight",
            whatToClick: "Click top (cheapest) result",
            whatToType: "",
            expectedResult: "Booking options appear"
          },
          {
            step: 8,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Book outbound flight NOW",
            whatToClick: "Click cheapest booking option",
            whatToType: "",
            expectedResult: "Opens airline/OTA site - COMPLETE THIS BOOKING"
          },
          {
            step: 9,
            website: "Airline/OTA",
            url: "varies",
            action: "Save confirmation",
            whatToClick: "Screenshot or write down confirmation number",
            whatToType: "",
            expectedResult: "You have outbound ticket booked"
          }
        ]
      },
      {
        leg: "RETURN",
        route: `${destination} → ${origin}`,
        price: `£${returnPrice}`,
        where: "Google Flights - One Way (NEW TAB)",
        exactSteps: [
          {
            step: 1,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Open NEW tab for return flight",
            whatToClick: "Open new browser tab, go to flights.google.com",
            whatToType: "",
            expectedResult: "Fresh Google Flights page"
          },
          {
            step: 2,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Switch to ONE-WAY",
            whatToClick: "Click 'Round trip', select 'One way'",
            whatToType: "",
            expectedResult: "One-way form shown"
          },
          {
            step: 3,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter departure (now the destination)",
            whatToClick: "Click 'Where from?' box",
            whatToType: destination,
            expectedResult: `Select "${destAirport.name}"`
          },
          {
            step: 4,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter destination (now the origin)",
            whatToClick: "Click 'Where to?' box",
            whatToType: origin,
            expectedResult: `Select "${originAirport.name}"`
          },
          {
            step: 5,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select return date",
            whatToClick: "Click departure date box",
            whatToType: `${retDay} ${getMonthName(retMonth!)}`,
            expectedResult: "Date selected"
          },
          {
            step: 6,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Search and book",
            whatToClick: "Click 'Search', select cheapest, book",
            whatToType: "",
            expectedResult: "Return flight booked - you now have 2 separate tickets!"
          }
        ]
      }
    ],
    warnings: [
      "⚠️ CRITICAL: These are SEPARATE bookings - airlines won't help if you miss connections",
      "If outbound is delayed, your return ticket is NOT protected",
      "You must collect and re-check baggage",
      "Different cancellation policies for each ticket",
      "Use EXACT same passenger name on both bookings"
    ],
    tips: [
      "Book outbound first, return second - don't wait between",
      "Screenshot both confirmation numbers",
      "Set calendar reminders for both check-ins (24hrs before each)",
      "Download both airline apps",
      "Allow 3+ hours between flights if connecting"
    ]
  };
}

function generateFlexibleDateClicks(
  origin: string, destination: string, originAirport: any, destAirport: any,
  departureDate: string, returnDate: string | undefined,
  depDay: number, depMonth: number, depYear: number,
  retDay: number | null, retMonth: number | null, retYear: number | null,
  price: number, googleFlightsBase: string, gfSearchUrl: string
): ClickByClickInstructions {
  
  return {
    title: `Flexible Dates: ${origin} → ${destination} for £${price}`,
    summary: `Shift your travel by 1-3 days to unlock cheaper fares. Tuesday/Wednesday flights are often cheapest.`,
    totalPrice: `£${price} per person`,
    bookings: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `${origin} ↔ ${destination}`,
        price: `£${price}`,
        where: "Google Flights - Date Grid",
        exactSteps: [
          {
            step: 1,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Open Google Flights",
            whatToClick: "Go to flights.google.com",
            whatToType: "",
            expectedResult: "Google Flights loads"
          },
          {
            step: 2,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter route",
            whatToClick: "Enter departure and destination",
            whatToType: `${origin} to ${destination}`,
            expectedResult: "Both airports selected"
          },
          {
            step: 3,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Enter rough dates",
            whatToClick: "Select dates around your preferred time",
            whatToType: "Any date in the same week",
            expectedResult: "Dates selected"
          },
          {
            step: 4,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Search to load price calendar",
            whatToClick: "Click 'Search'",
            whatToType: "",
            expectedResult: "Results load with price graph"
          },
          {
            step: 5,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "View date grid",
            whatToClick: "Click 'Date grid' tab (top of results)",
            whatToType: "",
            expectedResult: "Calendar shows prices for different date combinations"
          },
          {
            step: 6,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Find cheapest combination",
            whatToClick: "Look for green/lowest prices in grid",
            whatToType: "",
            expectedResult: "Identify cheapest departure and return dates"
          },
          {
            step: 7,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Select cheapest dates",
            whatToClick: "Click the cheapest date combination",
            whatToType: "",
            expectedResult: "Flights update for those dates"
          },
          {
            step: 8,
            website: "Google Flights",
            url: googleFlightsBase,
            action: "Book the flights",
            whatToClick: "Select cheapest flight, click through to book",
            whatToType: "",
            expectedResult: "Opens booking site - complete purchase"
          }
        ]
      }
    ],
    warnings: [
      "Hotel bookings may need changing",
      "Time off work may need adjusting",
      "Tuesday/Wednesday usually cheapest, Friday/Sunday most expensive"
    ],
    tips: [
      "Green prices in date grid = cheapest",
      "Tuesday departures often 20-30% cheaper",
      "Avoid Friday departures and Sunday returns",
      "Set up price tracking before booking"
    ]
  };
}

function generateNearbyOriginClicks(
  origin: string, destination: string, originAirport: any, destAirport: any,
  departureDate: string, returnDate: string | undefined,
  depDay: number, depMonth: number, depYear: number,
  retDay: number | null, retMonth: number | null, retYear: number | null,
  price: number, googleFlightsBase: string
): ClickByClickInstructions {
  
  return {
    title: `Nearby Airport: Alternative to ${origin} for £${price}`,
    summary: `Check Gatwick (LGW), Stansted (STN), or Luton (LTN) - often cheaper than Heathrow.`,
    totalPrice: `£${price} + transport costs per person`,
    bookings: [
      {
        leg: returnDate ? "Round Trip" : "One Way",
        route: `LGW/STN/LTN ↔ ${destination}`,
        price: `£${price}`,
        where: "Skyscanner - London Any",
        exactSteps: [
          {
            step: 1,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Open Skyscanner",
            whatToClick: "Go to skyscanner.net",
            whatToType: "",
            expectedResult: "Skyscanner homepage loads"
          },
          {
            step: 2,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Enter departure",
            whatToClick: "Click 'From' box",
            whatToType: "London (Any)",
            expectedResult: "Select 'London (Any) - All airports'"
          },
          {
            step: 3,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Enter destination",
            whatToClick: "Click 'To' box",
            whatToType: destination,
            expectedResult: `Select "${destAirport.name}"`
          },
          {
            step: 4,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Select dates",
            whatToClick: "Click 'Depart' and 'Return' boxes",
            whatToType: `${depDay}/${depMonth}/${depYear}`,
            expectedResult: "Dates selected"
          },
          {
            step: 5,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Search flights",
            whatToClick: "Click 'Search' button",
            whatToType: "",
            expectedResult: "Results show flights from all London airports"
          },
          {
            step: 6,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Compare airports",
            whatToClick: "Look at 'From' column in results",
            whatToType: "",
            expectedResult: "See prices from LHR, LGW, STN, LTN"
          },
          {
            step: 7,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Calculate total cost",
            whatToClick: "Note flight price + transport",
            whatToType: "",
            expectedResult: "LGW flight £50 cheaper but £20 train = £30 net saving"
          },
          {
            step: 8,
            website: "Skyscanner",
            url: "https://www.skyscanner.net",
            action: "Book if saving >£30",
            whatToClick: "Select cheapest viable option, click 'Select' then 'Book'",
            whatToType: "",
            expectedResult: "Opens booking site - complete purchase"
          }
        ]
      }
    ],
    warnings: [
      "Factor in ALL costs: train/taxi + parking + extra time",
      "Gatwick: 30 min from Victoria (£20)",
      "Stansted: 45 min from Liverpool St (£20)",
      "Luton: 1 hour from St Pancras (£15-25)"
    ],
    tips: [
      "Book trains in advance for discounts",
      "If driving, compare parking on airport websites",
      "Allow extra 1-2 hours vs Heathrow",
      "Gatwick has most flight options after Heathrow"
    ]
  };
}

function addCompatibilityProps(result: ClickByClickInstructions): ClickByClickInstructions {
  return {
    ...result,
    whatToBook: result.bookings.map(b => ({
      leg: b.leg,
      route: b.route,
      airline: "Various",
      flightType: b.leg.includes("Round") ? "Return" : "One-way",
      expectedPrice: b.price,
      whereToBook: b.where
    })),
    exactSteps: result.bookings[0]?.exactSteps.map(s => ({
      step: s.step,
      action: s.action,
      details: s.whatToClick + (s.whatToType ? ` - Type: ${s.whatToType}` : ""),
      website: s.website
    })) || [],
    totalCost: result.totalPrice,
    savingsVsStandard: "Varies"
  };
}

function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1];
}
