// Skyscanner Pre-populated Links Generator
// Creates direct search URLs with all parameters filled in

interface SkyscannerParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  cabinClass?: string; // economy, premiumeconomy, business, first
}

/**
 * Generate a pre-populated Skyscanner search URL
 * This opens Skyscanner with all fields already filled in
 */
export function generateSkyscannerUrl(params: SkyscannerParams): string {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    children = 0,
    cabinClass = "economy"
  } = params;

  // Format dates for Skyscanner (YYYY-MM-DD)
  const depDate = departureDate;
  const retDate = returnDate || "";
  
  // Map cabin class to Skyscanner format
  const cabinMap: Record<string, string> = {
    "ECONOMY": "economy",
    "PREMIUM_ECONOMY": "premiumeconomy",
    "BUSINESS": "business",
    "FIRST": "first"
  };
  
  const skyscannerCabin = cabinMap[cabinClass] || "economy";
  
  // Build the URL
  // Format: https://www.skyscanner.net/transport/flights/{origin}/{destination}/?adults={n}&children={n}&adultsv2={n}&childrenv2=&inboundaltsen...&outboundaltsen...&oym={YYYY-MM}&preferdirects=false&outboundym={YYYY-MM}&inboundym={YYYY-MM}&ref=home&rtn={0|1}
  
  const baseUrl = "https://www.skyscanner.net/transport/flights";
  const route = `${origin.toLowerCase()}/${destination.toLowerCase()}`;
  
  const queryParams = new URLSearchParams({
    adults: adults.toString(),
    children: children.toString(),
    adultsv2: adults.toString(),
    childrenv2: "",
    ref: "home",
    rtn: returnDate ? "1" : "0",
    preferdirects: "false"
  });
  
  // Add cabin class if not economy
  if (skyscannerCabin !== "economy") {
    queryParams.append("cabinclass", skyscannerCabin);
  }
  
  return `${baseUrl}/${route}/?${queryParams.toString()}`;
}

/**
 * Generate Google Flights pre-populated URL
 */
export function generateGoogleFlightsUrl(params: SkyscannerParams): string {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    cabinClass = "ECONOMY"
  } = params;

  // Google Flights uses a different format
  // https://www.google.com/travel/flights?q=Flights%20from%20{origin}%20to%20{destination}%20on%20{date}
  
  const cabinMap: Record<string, string> = {
    "ECONOMY": "1",
    "PREMIUM_ECONOMY": "2",
    "BUSINESS": "3",
    "FIRST": "4"
  };
  
  const baseUrl = "https://www.google.com/travel/flights";
  
  // Build search query
  let searchQuery = `Flights from ${origin} to ${destination} on ${departureDate}`;
  if (returnDate) {
    searchQuery += ` through ${returnDate}`;
  }
  
  const queryParams = new URLSearchParams({
    q: searchQuery,
    tfs: "CBwQAhooagwIAxIIL20vMDJfMjgqCggCEgQvbS8wNDgQAhooagwIAxIIL20vMDRfNDgqCggCEgQvbS8wNDg"
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generate Kayak pre-populated URL
 */
export function generateKayakUrl(params: SkyscannerParams): string {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    cabinClass = "economy"
  } = params;

  // Kayak URL format
  // https://www.kayak.co.uk/flights/{origin}-{destination}/{departureDate}/{returnDate}?sort=bestflight_a
  
  const baseUrl = "https://www.kayak.co.uk/flights";
  const route = `${origin}-${destination}`;
  const dates = returnDate 
    ? `${departureDate}/${returnDate}`
    : departureDate;
  
  const queryParams = new URLSearchParams({
    sort: "bestflight_a",
    adults: adults.toString()
  });
  
  // Add cabin class
  const cabinMap: Record<string, string> = {
    "ECONOMY": "economy",
    "PREMIUM_ECONOMY": "premium",
    "BUSINESS": "business",
    "FIRST": "first"
  };
  
  if (cabinMap[cabinClass] && cabinMap[cabinClass] !== "economy") {
    queryParams.append("cabin", cabinMap[cabinClass]);
  }
  
  return `${baseUrl}/${route}/${dates}?${queryParams.toString()}`;
}

/**
 * Generate all booking links for a route
 */
export function generateAllBookingLinks(params: SkyscannerParams) {
  return {
    skyscanner: {
      name: "Skyscanner",
      url: generateSkyscannerUrl(params),
      description: "Compare prices across all airlines"
    },
    googleFlights: {
      name: "Google Flights",
      url: generateGoogleFlightsUrl(params),
      description: "Track prices and explore dates"
    },
    kayak: {
      name: "Kayak",
      url: generateKayakUrl(params),
      description: "Price forecasting and predictions"
    }
  };
}

/**
 * Generate detailed step-by-step with clickable links
 */
export function generateDetailedBookingSteps(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string | undefined,
  cabinClass: string = "ECONOMY"
) {
  const links = generateAllBookingLinks({
    origin,
    destination,
    departureDate,
    returnDate,
    cabinClass
  });
  
  const className = cabinClass === "BUSINESS" ? "Business" : 
                    cabinClass === "FIRST" ? "First" : 
                    cabinClass === "PREMIUM_ECONOMY" ? "Premium Economy" : "Economy";
  
  return {
    className,
    links,
    steps: [
      {
        step: 1,
        title: "Open Skyscanner (Pre-filled)",
        description: `Click the link below. Skyscanner will open with ${origin} → ${destination} already filled in for ${departureDate}.`,
        action: "Click to open Skyscanner",
        url: links.skyscanner.url,
        fallback: `If link doesn't work: Go to skyscanner.net and search ${origin} to ${destination}`
      },
      {
        step: 2,
        title: "Verify Search Details",
        description: `Check that Skyscanner shows:\n• From: ${origin}\n• To: ${destination}\n• Depart: ${departureDate}${returnDate ? `\n• Return: ${returnDate}` : ''}\n• Class: ${className}\n• Passengers: 1 adult`,
        action: "Confirm details match",
        url: null,
        fallback: null
      },
      {
        step: 3,
        title: "Click Search",
        description: "Click the orange 'Search' button. Wait for results to load.",
        action: "Search for flights",
        url: null,
        fallback: null
      },
      {
        step: 4,
        title: "Select Your Flight",
        description: `Look for ${className} class options. Compare prices and flight times. Click 'Select' on your preferred flight.`,
        action: "Choose best flight",
        url: null,
        fallback: null
      },
      {
        step: 5,
        title: "Complete Booking",
        description: "Follow the prompts to enter passenger details and payment. Double-check all dates before paying.",
        action: "Enter details and pay",
        url: null,
        fallback: null
      }
    ]
  };
}
