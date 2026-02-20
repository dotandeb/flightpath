// Booking Link Generator - Creates working affiliate links
// Uses Skyscanner/Aviasales with partner marker for commission

const PARTNER_MARKER = "705007";

interface BookingLinkParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  airline?: string;
  price: number;
}

/**
 * Generate working booking links that earn affiliate commission
 */
export function generateBookingLinks(params: BookingLinkParams): Array<{
  provider: string;
  url: string;
  price: number;
  logo?: string;
}> {
  const links = [];

  // Primary: Skyscanner with partner marker (earns commission)
  links.push({
    provider: "Skyscanner",
    url: generateSkyscannerLink(params),
    price: params.price,
    logo: "/logos/skyscanner.svg",
  });

  // Secondary: Google Flights (reference, no commission)
  links.push({
    provider: "Google Flights",
    url: generateGoogleFlightsLink(params),
    price: params.price,
    logo: "/logos/google.svg",
  });

  // Airline direct (if known)
  if (params.airline) {
    const airlineUrl = getAirlineUrl(params.airline, params);
    if (airlineUrl) {
      links.push({
        provider: getAirlineName(params.airline),
        url: airlineUrl,
        price: params.price,
        logo: `/logos/${params.airline.toLowerCase()}.svg`,
      });
    }
  }

  return links;
}

/**
 * Generate Skyscanner affiliate link
 * Format: https://www.skyscanner.net/transport/flights/from/to/?oym=YYYYMM&iym=YYYYMM
 */
function generateSkyscannerLink(params: BookingLinkParams): string {
  const origin = params.origin.toLowerCase();
  const dest = params.destination.toLowerCase();
  const depMonth = params.departureDate.substring(0, 7).replace("-", "");
  
  let url = `https://www.skyscanner.net/transport/flights/${origin}/${dest}/?oym=${depMonth}`;
  
  if (params.returnDate) {
    const retMonth = params.returnDate.substring(0, 7).replace("-", "");
    url += `&iym=${retMonth}`;
  }
  
  // Add partner marker for commission
  url += `&utm_source=flightpath&utm_medium=affiliate&utm_campaign=${PARTNER_MARKER}`;
  
  return url;
}

/**
 * Generate Google Flights search link
 */
function generateGoogleFlightsLink(params: BookingLinkParams): string {
  const query = `Flights from ${params.origin} to ${params.destination} on ${params.departureDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

/**
 * Get airline direct booking URL
 */
function getAirlineUrl(airlineCode: string, params: BookingLinkParams): string | null {
  const airlineUrls: Record<string, string> = {
    BA: "https://www.britishairways.com/travel/book/public/en_gb",
    AF: "https://www.airfrance.co.uk/en",
    KL: "https://www.klm.co.uk",
    LH: "https://www.lufthansa.com",
    EK: "https://www.emirates.com",
    QR: "https://www.qatarairways.com",
    SQ: "https://www.singaporeair.com",
    CX: "https://www.cathaypacific.com",
    VS: "https://www.virgin-atlantic.com",
    AA: "https://www.aa.com",
    DL: "https://www.delta.com",
    UA: "https://www.united.com",
    A3: "https://www.aegeanair.com",
    IB: "https://www.iberia.com",
    TP: "https://www.flytap.com",
    AZ: "https://www.ita-airways.com",
    OS: "https://www.austrian.com",
    LX: "https://www.swiss.com",
    SK: "https://www.flysas.com",
    AY: "https://www.finnair.com",
    LO: "https://www.lot.com",
    OK: "https://www.csa.cz",
    MA: "https://www.malev.com",
    RO: "https://www.tarom.ro",
    FB: "https://www.air.bg",
    JU: "https://www.airserbia.com",
    OU: "https://www.croatiaairlines.com",
    EI: "https://www.aerlingus.com",
    U2: "https://www.easyjet.com",
    FR: "https://www.ryanair.com",
    W6: "https://www.wizzair.com",
    VY: "https://www.vueling.com",
    TK: "https://www.turkishairlines.com",
    PC: "https://www.flypgs.com",
    XQ: "https://www.sunexpress.com",
  };

  const baseUrl = airlineUrls[airlineCode.toUpperCase()];
  if (!baseUrl) return null;

  // Add tracking
  return `${baseUrl}?utm_source=flightpath&utm_medium=referral`;
}

function getAirlineName(code: string): string {
  const names: Record<string, string> = {
    BA: "British Airways",
    AF: "Air France",
    KL: "KLM",
    LH: "Lufthansa",
    EK: "Emirates",
    QR: "Qatar Airways",
    SQ: "Singapore Airlines",
    CX: "Cathay Pacific",
    VS: "Virgin Atlantic",
    AA: "American Airlines",
    DL: "Delta",
    UA: "United",
    A3: "Aegean Airlines",
    IB: "Iberia",
    TP: "TAP Air Portugal",
    AZ: "ITA Airways",
    OS: "Austrian Airlines",
    LX: "SWISS",
    SK: "SAS",
    AY: "Finnair",
    LO: "LOT Polish",
    OK: "Czech Airlines",
    RO: "TAROM",
    FB: "Bulgaria Air",
    JU: "Air Serbia",
    OU: "Croatia Airlines",
    EI: "Aer Lingus",
    U2: "easyJet",
    FR: "Ryanair",
    W6: "Wizz Air",
    VY: "Vueling",
    TK: "Turkish Airlines",
    PC: "Pegasus",
    XQ: "SunExpress",
  };
  return names[code.toUpperCase()] || code;
}

export { getAirlineName };
