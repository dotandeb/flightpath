// Manual Booking Guide - Ultra Detailed Fallback
// When links don't work, users can follow these exact steps

export interface ManualBookingGuide {
  scenario: string;
  estimatedTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prerequisites: string[];
  
  // Step-by-step with screenshots-level detail
  steps: {
    stepNumber: number;
    title: string;
    website: string;
    url: string;
    detailedActions: string[];
    whatToEnter: Record<string, string>;
    expectedOutcome: string;
    screenshotDescription: string;
    troubleshooting: string[];
  }[];
  
  // Verification checklist
  verificationSteps: string[];
  
  // Common issues and fixes
  commonProblems: {
    problem: string;
    cause: string;
    solution: string;
  }[];
  
  // Alternative methods if primary fails
  planB: {
    method: string;
    whenToUse: string;
    steps: string[];
  }[];
}

/**
 * Generate ultra-detailed manual booking guide
 */
export function generateManualBookingGuide(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  dealPrice: number,
  strategy: string
): ManualBookingGuide {
  
  const formattedDepDate = formatDateForDisplay(departureDate);
  const formattedRetDate = returnDate ? formatDateForDisplay(returnDate) : null;
  
  switch(strategy) {
    case "split-ticket":
      return generateSplitTicketManualGuide(origin, destination, formattedDepDate, formattedRetDate, dealPrice);
    case "flexible-dates":
      return generateFlexibleDatesManualGuide(origin, destination, formattedDepDate, formattedRetDate, dealPrice);
    case "nearby-origin":
      return generateNearbyAirportManualGuide(origin, destination, formattedDepDate, formattedRetDate, dealPrice);
    default:
      return generateStandardManualGuide(origin, destination, formattedDepDate, formattedRetDate, dealPrice);
  }
}

function generateStandardManualGuide(
  origin: string,
  destination: string,
  depDate: string,
  retDate: string | null,
  price: number
): ManualBookingGuide {
  return {
    scenario: `Book ${origin} to ${destination} for approximately £${price}`,
    estimatedTime: "15-25 minutes",
    difficulty: "Easy",
    prerequisites: [
      "Passport (for international flights)",
      "Credit/debit card",
      "Email address",
      "Phone number",
      "Passenger full name (exactly as on passport)"
    ],
    
    steps: [
      {
        stepNumber: 1,
        title: "Open Google Flights",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Open your web browser (Chrome, Safari, Firefox, Edge)",
          "In the address bar at the top, type: flights.google.com",
          "Press Enter",
          "Wait for the page to fully load (you'll see a search form with 'Where from?' and 'Where to?' fields)"
        ],
        whatToEnter: {},
        expectedOutcome: "Google Flights homepage loads with empty search form",
        screenshotDescription: "Page shows Google Flights logo, search form with two empty fields",
        troubleshooting: [
          "If page doesn't load: Check internet connection",
          "If page shows error: Clear browser cache and try again",
          "If in wrong country: Look for country selector at bottom of page"
        ]
      },
      {
        stepNumber: 2,
        title: "Enter Departure Airport",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Click on the first text box labeled 'Where from?'",
          "The box will expand and show a cursor",
          "Type the 3-letter airport code or city name",
          "Wait for dropdown suggestions to appear",
          "Click on the correct airport from the dropdown list"
        ],
        whatToEnter: {
          "Field": "Where from?",
          "Value": origin,
          "Example": "LHR or London"
        },
        expectedOutcome: `Dropdown shows matching airports. You select "${origin}" and it appears in the box`,
        screenshotDescription: "Dropdown list appears below the field with airport options",
        troubleshooting: [
          "If airport not found: Try city name instead of airport code",
          "If wrong airport selected: Click the X to clear and try again",
          "If dropdown doesn't appear: Click in the field again and wait 2 seconds"
        ]
      },
      {
        stepNumber: 3,
        title: "Enter Destination Airport",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Click on the second text box labeled 'Where to?'",
          "Type the 3-letter airport code or city name",
          "Wait for dropdown suggestions",
          "Click on the correct airport from the dropdown"
        ],
        whatToEnter: {
          "Field": "Where to?",
          "Value": destination,
          "Example": "BKK or Bangkok"
        },
        expectedOutcome: `${destination} appears in the destination box`,
        screenshotDescription: "Both origin and destination fields now filled",
        troubleshooting: [
          "If airport not found: Check spelling or try alternative airport codes",
          "If selecting wrong country: Look for country flag in dropdown"
        ]
      },
      {
        stepNumber: 4,
        title: "Select Trip Type",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Look for dropdown at top that says 'Round trip'",
          retDate 
            ? "Keep as 'Round trip' (do NOT change)"
            : "Click it and select 'One way' from dropdown"
        ],
        whatToEnter: {
          "Trip Type": retDate ? "Round trip" : "One way"
        },
        expectedOutcome: retDate ? "Stays as Round trip" : "Changes to One way, return date field disappears",
        screenshotDescription: retDate ? "Two date fields visible" : "Only departure date field visible",
        troubleshooting: [
          "If dropdown won't open: Click directly on the text 'Round trip'",
          "If wrong option selected: Click dropdown again and reselect"
        ]
      },
      {
        stepNumber: 5,
        title: "Select Departure Date",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Click on the 'Departure' date field",
          "A calendar popup will appear",
          "Navigate to the correct month using arrows at top",
          `Find and click on ${depDate}`,
          "Calendar will close automatically"
        ],
        whatToEnter: {
          "Departure Date": depDate
        },
        expectedOutcome: `${depDate} appears in the departure field`,
        screenshotDescription: "Calendar popup shows month view with selected date highlighted",
        troubleshooting: [
          "If wrong month showing: Click left/right arrows to navigate",
          "If date unavailable (greyed out): No flights that day, pick nearby date",
          "If calendar won't close: Click outside the calendar area"
        ]
      },
      ...(retDate ? [{
        stepNumber: 6,
        title: "Select Return Date",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Click on the 'Return' date field",
          "Calendar popup appears",
          `Find and click on ${retDate}`,
          "Calendar closes"
        ],
        whatToEnter: {
          "Return Date": retDate
        },
        expectedOutcome: `${retDate} appears in return field`,
        screenshotDescription: "Both departure and return dates now selected",
        troubleshooting: [
          "If return date before departure: System won't allow, pick later date",
          "If date unavailable: Try flexible dates (±3 days)"
        ]
      }] : []),
      {
        stepNumber: retDate ? 7 : 6,
        title: "Start Search",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Look for blue 'Search' button (bottom of form)",
          "Click the 'Search' button",
          "Wait for results to load (5-10 seconds)"
        ],
        whatToEnter: {},
        expectedOutcome: "Page changes to show flight results with prices, airlines, and times",
        screenshotDescription: "List of flights showing airline logos, departure/arrival times, prices",
        troubleshooting: [
          "If button greyed out: Check all fields are filled",
          "If no results: Try different dates or nearby airports",
          "If error message: Refresh page and try again"
        ]
      },
      {
        stepNumber: retDate ? 8 : 7,
        title: "Select Cheapest Flight",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Look at the list of flights",
          "The cheapest option is usually at the top",
          "Look for price around £" + price,
          "Click on the flight row to select it"
        ],
        whatToEnter: {},
        expectedOutcome: "Flight details expand showing booking options from different sites",
        screenshotDescription: "Expanded flight card showing 'Book with Expedia £XXX', 'Book with airline £XXX'",
        troubleshooting: [
          "If price much higher than expected: Deal may have expired, try different dates",
          "If multiple similar prices: Click each to compare total with baggage",
          "If flight unavailable: It will say 'Sold out' - pick next cheapest"
        ]
      },
      {
        stepNumber: retDate ? 9 : 8,
        title: "Choose Booking Site",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Look at booking options listed",
          "Compare prices (may vary by £5-20)",
          "Prefer 'Airline direct' if price similar (better for changes/cancellations)",
          "Click on the cheapest reliable option (Expedia, Kayak, or airline direct)"
        ],
        whatToEnter: {},
        expectedOutcome: "New tab opens with the booking site (Expedia, airline website, etc.)",
        screenshotDescription: "New page loads - either Expedia, Kayak, or airline website with flight pre-selected",
        troubleshooting: [
          "If site won't load: Check popup blocker, allow popups for this site",
          "If price different: Prices change frequently, Google may be cached",
          "If flight not available: Go back to Google Flights and try next option"
        ]
      },
      {
        stepNumber: retDate ? 10 : 9,
        title: "Enter Passenger Details",
        website: "Booking Site (varies)",
        url: "varies",
        detailedActions: [
          "Look for 'Passenger Details' or 'Traveler Information' section",
          "Enter title (Mr/Mrs/Ms)",
          "Enter first name EXACTLY as on passport",
          "Enter last name EXACTLY as on passport",
          "Enter date of birth",
          "Enter passport number (if required for international)",
          "Enter nationality",
          "Enter email address (for confirmations)",
          "Enter phone number (with country code)"
        ],
        whatToEnter: {
          "Title": "As on passport",
          "First Name": "EXACTLY as on passport (no nicknames)",
          "Last Name": "EXACTLY as on passport",
          "Date of Birth": "DD/MM/YYYY",
          "Passport Number": "If international flight",
          "Nationality": "Your citizenship",
          "Email": "Your active email",
          "Phone": "With +44 or country code"
        },
        expectedOutcome: "All fields filled, no red error messages",
        screenshotDescription: "Form shows all passenger details filled in",
        troubleshooting: [
          "If name error: Check spelling matches passport EXACTLY including middle names",
          "If passport error: Check expiry date is 6+ months after travel",
          "If email error: Check format is correct (name@domain.com)"
        ]
      },
      {
        stepNumber: retDate ? 11 : 10,
        title: "Select Add-ons (Optional)",
        website: "Booking Site",
        url: "varies",
        detailedActions: [
          "BAGGAGE: Select checked bags if needed (usually £30-50 per bag)",
          "SEATS: Skip unless specific seat needed (usually £10-30 extra)",
          "MEALS: Pre-order if dietary requirements (usually free or £10-15)",
          "INSURANCE: Consider travel insurance (usually £15-30)",
          "Look for 'Continue' or 'Next' button"
        ],
        whatToEnter: {
          "Checked Bags": "Select if needed (0-2 bags typical)",
          "Seat Selection": "Skip to save money",
          "Travel Insurance": "Optional but recommended"
        },
        expectedOutcome: "Add-ons selected, total price updated",
        screenshotDescription: "Page shows baggage options, seat map, insurance checkbox",
        troubleshooting: [
          "If baggage price seems high: Some airlines cheaper at airport (risky)",
          "If seat selection expensive: Skip and check in early (24hrs before) for free seats",
          "If insurance offered: Compare with standalone travel insurance"
        ]
      },
      {
        stepNumber: retDate ? 12 : 11,
        title: "Enter Payment Details",
        website: "Booking Site",
        url: "varies",
        detailedActions: [
          "Enter card number (16 digits, no spaces)",
          "Enter expiry date (MM/YY)",
          "Enter CVV (3 digits on back, 4 on front for Amex)",
          "Enter cardholder name (as on card)",
          "Enter billing address",
          "Check 'Save card' is UNCHECKED (for security)",
          "Look for 'Pay Now' or 'Complete Booking' button"
        ],
        whatToEnter: {
          "Card Number": "16 digits",
          "Expiry": "MM/YY",
          "CVV": "3 or 4 digits",
          "Cardholder Name": "As printed on card",
          "Billing Address": "Your registered address"
        },
        expectedOutcome: "All payment fields filled, total amount shown",
        screenshotDescription: "Payment form with card details, billing address, total price",
        troubleshooting: [
          "If card declined: Check balance, try different card, or call bank",
          "If 3D Secure fails: Check phone for SMS code, enter it quickly",
          "If price changed: Go back and check what was added"
        ]
      },
      {
        stepNumber: retDate ? 13 : 12,
        title: "Complete Booking",
        website: "Booking Site",
        url: "varies",
        detailedActions: [
          "Review all details one final time",
          "Check passenger names are correct",
          "Check dates are correct",
          "Check total price",
          "Click 'Pay Now' or 'Complete Booking'",
          "Wait for processing (10-30 seconds)",
          "DO NOT refresh or close browser"
        ],
        whatToEnter: {},
        expectedOutcome: "Page shows 'Booking Confirmed' or 'Success' with confirmation number",
        screenshotDescription: "Confirmation page with booking reference, e-ticket, 'Print' button",
        troubleshooting: [
          "If page freezes: Wait 2 minutes, check email for confirmation",
          "If error after payment: Check if charged, contact site immediately",
          "If no confirmation: Check spam folder, contact booking site"
        ]
      },
      {
        stepNumber: retDate ? 14 : 13,
        title: "Save Confirmation",
        website: "Email / Booking Site",
        url: "varies",
        detailedActions: [
          "Screenshot the confirmation page",
          "Write down the booking reference (6-character code like 'ABC123')",
          "Check email for confirmation (arrives within 5 minutes)",
          "Save email in 'Travel' folder",
          "Download e-ticket if available",
          "Add flight to calendar (link usually in email)"
        ],
        whatToEnter: {},
        expectedOutcome: "You have booking reference saved in multiple places",
        screenshotDescription: "Email inbox shows booking confirmation, calendar shows flight",
        troubleshooting: [
          "If no email after 10 minutes: Check spam/junk folder",
          "If email wrong: Contact booking site to update",
          "If booking reference lost: Log into booking site account"
        ]
      }
    ],
    
    verificationSteps: [
      "Booking reference number received",
      "Confirmation email in inbox (not spam)",
      "Passenger names match passport exactly",
      "Dates are correct (departure and return)",
      "Airports are correct (origin and destination)",
      "Total amount charged matches expected",
      "E-ticket downloaded or accessible",
      "Flight added to calendar"
    ],
    
    commonProblems: [
      {
        problem: "Price higher than shown on FlightPath",
        cause: "Deal expired or sold out",
        solution: "Try different dates (±3 days) or check back tomorrow for new deals"
      },
      {
        problem: "Flight not available after clicking",
        cause: "Someone else booked the last seat",
        solution: "Go back to results and select next cheapest option"
      },
      {
        problem: "Payment declined",
        cause: "Bank blocking international transaction",
        solution: "Call bank to authorize, or try different card"
      },
      {
        problem: "Name doesn't match passport",
        cause: "Typo or nickname used",
        solution: "Contact airline IMMEDIATELY (within 24 hours) to correct - may cost £50+"
      },
      {
        problem: "No confirmation email",
        cause: "Email in spam or typo in address",
        solution: "Check spam folder, log into booking site to view reservation"
      }
    ],
    
    planB: [
      {
        method: "Try Skyscanner instead",
        whenToUse: "If Google Flights price is higher than expected",
        steps: [
          "Go to skyscanner.net",
          "Enter same route and dates",
          "Compare prices",
          "Book through Skyscanner if cheaper"
        ]
      },
      {
        method: "Book directly with airline",
        whenToUse: "If OTA (Expedia, etc.) has issues",
        steps: [
          "Identify airline from Google Flights results",
          "Go to airline website directly",
          "Search same flight",
          "Book direct (often same price, better service)"
        ]
      },
      {
        method: "Use travel agent",
        whenToUse: "If online booking keeps failing",
        steps: [
          "Find local travel agent",
          "Give them flight details and dates",
          "They book for small fee (£20-50)",
          "You pay them, they give you ticket"
        ]
      }
    ]
  };
}

// Helper functions for other strategies...
function generateSplitTicketManualGuide(origin: string, destination: string, depDate: string, retDate: string | null, price: number): ManualBookingGuide {
  const standard = generateStandardManualGuide(origin, destination, depDate, retDate, price);
  
  return {
    ...standard,
    scenario: `Split Ticket: Book ${origin}→${destination} and ${destination}→${origin} separately for £${price}`,
    estimatedTime: "30-45 minutes",
    difficulty: "Medium",
    prerequisites: [
      ...standard.prerequisites,
      "Spreadsheet or paper to track two bookings",
      "Calendar to set two check-in reminders"
    ],
    steps: [
      {
        stepNumber: 1,
        title: "⚠️ READ THIS FIRST - Critical Information",
        website: "Important",
        url: "",
        detailedActions: [
          "These are TWO SEPARATE bookings",
          "Airlines will NOT help if you miss connections",
          "You must collect and re-check baggage",
          "Use EXACT same passenger name on both bookings",
          "Book OUTBOUND first, RETURN second - don't wait between"
        ],
        whatToEnter: {},
        expectedOutcome: "You understand the risks and process",
        screenshotDescription: "N/A - Read carefully",
        troubleshooting: [
          "If this seems too risky: Book round-trip instead for protection"
        ]
      },
      ...standard.steps.map(s => ({...s, stepNumber: s.stepNumber + 1})),
      {
        stepNumber: standard.steps.length + 2,
        title: "IMMEDIATELY Book Return Flight (New Tab)",
        website: "Google Flights (New Tab)",
        url: "https://flights.google.com",
        detailedActions: [
          "Open NEW browser tab",
          "Go to flights.google.com",
          "Repeat entire booking process for RETURN",
          "Origin becomes destination, destination becomes origin",
          "Use EXACT same passenger details",
          "Book immediately - don't delay"
        ],
        whatToEnter: {
          "Origin": destination,
          "Destination": origin,
          "Date": retDate || "N/A"
        },
        expectedOutcome: "Both outbound and return flights booked",
        screenshotDescription: "Two confirmation pages in two tabs",
        troubleshooting: [
          "If return price changed: That's the risk of split ticketing",
          "If return unavailable: You have outbound but no return - book quickly!"
        ]
      }
    ],
    verificationSteps: [
      ...standard.verificationSteps,
      "TWO booking references (one for each direction)",
      "Both bookings have EXACT same passenger name",
      "Calendar reminders set for BOTH check-ins (24hrs before each flight)"
    ],
    commonProblems: [
      ...standard.commonProblems,
      {
        problem: "Outbound flight delayed/cancelled",
        cause: "Separate bookings = no protection",
        solution: "You're on your own - may need to buy new return ticket"
      },
      {
        problem: "Different names on two bookings",
        cause: "Typo or different spelling",
        solution: "Contact airline within 24hrs to correct - £50+ fee likely"
      }
    ],
    planB: [
      {
        method: "Book round-trip instead",
        whenToUse: "If split ticket seems too risky",
        steps: [
          "Abandon split ticket idea",
          "Book normal round-trip on Google Flights",
          "Pay slightly more for peace of mind"
        ]
      }
    ]
  };
}

function generateFlexibleDatesManualGuide(origin: string, destination: string, depDate: string, retDate: string | null, price: number): ManualBookingGuide {
  const standard = generateStandardManualGuide(origin, destination, depDate, retDate, price);
  
  return {
    ...standard,
    scenario: `Flexible Dates: Find cheapest dates around ${depDate} for ${origin}→${destination}`,
    steps: [
      {
        stepNumber: 1,
        title: "Open Google Flights Date Grid",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Go to flights.google.com",
          "Enter origin and destination",
          "Enter rough dates (within same week)",
          "Click 'Search'",
          "Look for 'Date grid' tab at top",
          "Click 'Date grid'"
        ],
        whatToEnter: {},
        expectedOutcome: "Calendar grid shows prices for different date combinations",
        screenshotDescription: "Grid with dates and prices, green = cheapest",
        troubleshooting: [
          "If 'Date grid' not visible: Try 'Price graph' instead"
        ]
      },
      {
        stepNumber: 2,
        title: "Identify Cheapest Date Combination",
        website: "Google Flights",
        url: "https://flights.google.com",
        detailedActions: [
          "Look for green-colored prices (cheapest)",
          "Compare different departure dates",
          "Compare different return dates",
          "Note the cheapest combination",
          "Check if you can travel those dates"
        ],
        whatToEnter: {},
        expectedOutcome: "You've identified the cheapest viable dates",
        screenshotDescription: "Specific dates selected, price shown",
        troubleshooting: [
          "If cheapest dates don't work: Find next best option",
          "If all dates expensive: Try different week"
        ]
      },
      ...standard.steps.slice(2)
    ]
  };
}

function generateNearbyAirportManualGuide(origin: string, destination: string, depDate: string, retDate: string | null, price: number): ManualBookingGuide {
  return {
    scenario: `Nearby Airport: Check LGW, STN, LTN vs ${origin} for flights to ${destination}`,
    estimatedTime: "45-60 minutes",
    difficulty: "Medium",
    prerequisites: [
      "Research transport options to alternative airports",
      "Check train times and prices",
      "Calculate total journey time"
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Check Transport to Alternative Airports",
        website: "Various",
        url: "",
        detailedActions: [
          "Gatwick (LGW): Check Gatwick Express (gatwickexpress.com)",
          "Stansted (STN): Check Stansted Express (stanstedexpress.com)",
          "Luton (LTN): Check Thameslink or National Express",
          "Calculate cost and time for each option"
        ],
        whatToEnter: {},
        expectedOutcome: "You know transport cost and time to each airport",
        screenshotDescription: "Train booking sites showing prices and times",
        troubleshooting: [
          "If trains expensive: Check Uber/taxi costs (may be similar for groups)"
        ]
      },
      {
        stepNumber: 2,
        title: "Search All London Airports",
        website: "Skyscanner",
        url: "https://skyscanner.net",
        detailedActions: [
          "Go to skyscanner.net",
          "Enter 'From: London (Any)'",
          `Enter 'To: ${destination}'`,
          "Enter your dates",
          "Click Search"
        ],
        whatToEnter: {},
        expectedOutcome: "Results show flights from LHR, LGW, STN, LTN with prices",
        screenshotDescription: "Results page with 'From' column showing different airports",
        troubleshooting: [
          "If 'London (Any)' not working: Search each airport separately"
        ]
      }
      // ... more steps
    ],
    verificationSteps: [],
    commonProblems: [],
    planB: []
  } as ManualBookingGuide;
}

function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Export for use in components
export { formatDateForDisplay };
