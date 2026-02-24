// Real RSS Deal Scraper
// Fetches actual deals from SecretFlying, Fly4Free, and other sources

import { XMLParser } from "fast-xml-parser";

interface RSSDeal {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

interface ParsedDeal {
  route: string;
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  price: number;
  currency: string;
  dates: string;
  source: string;
  url: string;
  publishedAt: string;
  confidence: "high" | "medium" | "low";
}

// Cache for RSS feeds
const rssCache = new Map<string, { deals: ParsedDeal[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch and parse RSS feed
 */
async function fetchRSS(url: string): Promise<RSSDeal[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FlightPath/1.0)",
      },
      next: { revalidate: 1800 }, // 30 min cache
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    
    const result = parser.parse(xml);
    
    // Extract items from RSS
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    
    return items.map((item: any) => ({
      title: item.title || "",
      link: item.link || item["@_href"] || "",
      pubDate: item.pubDate || item.published || new Date().toISOString(),
      description: item.description || item.summary || "",
    }));
  } catch (error) {
    console.error(`[RSS] Failed to fetch ${url}:`, error);
    return [];
  }
}

/**
 * Scrape Secret Flying RSS
 */
export async function scrapeSecretFlying(): Promise<ParsedDeal[]> {
  const cacheKey = "secretflying";
  const cached = rssCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[RSS] Using cached SecretFlying deals");
    return cached.deals;
  }

  console.log("[RSS] Fetching SecretFlying RSS...");
  
  // SecretFlying RSS feeds
  const feeds = [
    "https://secretflying.com/feed/", // Main feed
    "https://secretflying.com/category/europe/feed/",
    "https://secretflying.com/category/asia/feed/",
    "https://secretflying.com/category/north-america/feed/",
  ];

  const allDeals: ParsedDeal[] = [];

  for (const feed of feeds) {
    try {
      const items = await fetchRSS(feed);
      
      for (const item of items.slice(0, 10)) { // Top 10 from each feed
        const parsed = parseSecretFlyingTitle(item.title);
        
        if (parsed) {
          allDeals.push({
            ...parsed,
            source: "SecretFlying",
            url: item.link,
            publishedAt: item.pubDate,
          });
        }
      }
    } catch (e) {
      console.log(`[RSS] Feed failed: ${feed}`);
    }
  }

  // Remove duplicates
  const uniqueDeals = allDeals.filter((deal, index, self) => 
    index === self.findIndex(d => d.route === deal.route && d.price === deal.price)
  );

  rssCache.set(cacheKey, { deals: uniqueDeals, timestamp: Date.now() });
  
  console.log(`[RSS] SecretFlying: ${uniqueDeals.length} deals`);
  return uniqueDeals;
}

/**
 * Scrape Fly4Free RSS
 */
export async function scrapeFly4Free(): Promise<ParsedDeal[]> {
  const cacheKey = "fly4free";
  const cached = rssCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[RSS] Using cached Fly4Free deals");
    return cached.deals;
  }

  console.log("[RSS] Fetching Fly4Free RSS...");
  
  const feeds = [
    "https://www.fly4free.com/feed/",
    "https://www.fly4free.com/flights/flight-deals/feed/",
  ];

  const allDeals: ParsedDeal[] = [];

  for (const feed of feeds) {
    try {
      const items = await fetchRSS(feed);
      
      for (const item of items.slice(0, 10)) {
        const parsed = parseFly4FreeTitle(item.title, item.description);
        
        if (parsed) {
          allDeals.push({
            ...parsed,
            source: "Fly4Free",
            url: item.link,
            publishedAt: item.pubDate,
          });
        }
      }
    } catch (e) {
      console.log(`[RSS] Feed failed: ${feed}`);
    }
  }

  const uniqueDeals = allDeals.filter((deal, index, self) => 
    index === self.findIndex(d => d.route === deal.route && d.price === deal.price)
  );

  rssCache.set(cacheKey, { deals: uniqueDeals, timestamp: Date.now() });
  
  console.log(`[RSS] Fly4Free: ${uniqueDeals.length} deals`);
  return uniqueDeals;
}

/**
 * Scrape Jack's Flight Club (if available)
 */
export async function scrapeJacksFlightClub(): Promise<ParsedDeal[]> {
  // Jack's Flight Club requires membership
  // Return empty for now
  return [];
}

/**
 * Scrape Holiday Pirates
 */
export async function scrapeHolidayPirates(): Promise<ParsedDeal[]> {
  const cacheKey = "holidaypirates";
  const cached = rssCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.deals;
  }

  console.log("[RSS] Fetching Holiday Pirates RSS...");
  
  try {
    const items = await fetchRSS("https://www.holidaypirates.com/feed");
    const deals: ParsedDeal[] = [];
    
    for (const item of items.slice(0, 15)) {
      const parsed = parseHolidayPiratesTitle(item.title);
      
      if (parsed) {
        deals.push({
          ...parsed,
          source: "HolidayPirates",
          url: item.link,
          publishedAt: item.pubDate,
        });
      }
    }

    rssCache.set(cacheKey, { deals, timestamp: Date.now() });
    console.log(`[RSS] Holiday Pirates: ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.log("[RSS] Holiday Pirates failed");
    return [];
  }
}

/**
 * Scrape Airfare Watchdog deals
 */
export async function scrapeAirfareWatchdog(): Promise<ParsedDeal[]> {
  // Airfare Watchdog RSS feed
  const cacheKey = "airfarewatchdog";
  const cached = rssCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.deals;
  }

  console.log("[RSS] Fetching Airfare Watchdog...");
  
  try {
    const items = await fetchRSS("https://www.airfarewatchdog.com/rss/feed/");
    const deals: ParsedDeal[] = [];
    
    for (const item of items.slice(0, 10)) {
      const parsed = parseAirfareWatchdogTitle(item.title, item.description);
      
      if (parsed) {
        deals.push({
          ...parsed,
          source: "AirfareWatchdog",
          url: item.link,
          publishedAt: item.pubDate,
        });
      }
    }

    rssCache.set(cacheKey, { deals, timestamp: Date.now() });
    console.log(`[RSS] Airfare Watchdog: ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.log("[RSS] Airfare Watchdog failed");
    return [];
  }
}

/**
 * Scrape Thrifty Traveler deals
 */
export async function scrapeThriftyTraveler(): Promise<ParsedDeal[]> {
  const cacheKey = "thriftytraveler";
  const cached = rssCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.deals;
  }

  console.log("[RSS] Fetching Thrifty Traveler...");
  
  try {
    const items = await fetchRSS("https://thriftytraveler.com/feed/");
    const deals: ParsedDeal[] = [];
    
    for (const item of items.slice(0, 10)) {
      const parsed = parseThriftyTravelerTitle(item.title);
      
      if (parsed) {
        deals.push({
          ...parsed,
          source: "ThriftyTraveler",
          url: item.link,
          publishedAt: item.pubDate,
        });
      }
    }

    rssCache.set(cacheKey, { deals, timestamp: Date.now() });
    console.log(`[RSS] Thrifty Traveler: ${deals.length} deals`);
    return deals;
  } catch (e) {
    console.log("[RSS] Thrifty Traveler failed");
    return [];
  }
}

/**
 * Scrape Dollar Flight Club deals
 */
export async function scrapeDollarFlightClub(): Promise<ParsedDeal[]> {
  // Dollar Flight Club requires subscription for RSS
  return [];
}

/**
 * Parse Airfare Watchdog title
 */
function parseAirfareWatchdogTitle(title: string, description?: string): Omit<ParsedDeal, "source" | "url" | "publishedAt"> | null {
  const priceMatch = title.match(/\$(\d+)/);
  if (!priceMatch) return null;
  
  const price = parseInt(priceMatch[1]);
  const currency = "USD";

  const routeMatch = title.match(/(\w+(?:\s+\w+)?)\s+(?:to|-)\s+(\w+(?:\s+\w+)?)/i);
  if (!routeMatch) return null;
  
  const from = routeMatch[1].trim();
  const to = routeMatch[2].trim();
  
  return {
    route: `${from} to ${to}`,
    from,
    to,
    fromCode: cityToAirportCode(from),
    toCode: cityToAirportCode(to),
    price,
    currency,
    dates: "Check link for dates",
    confidence: "medium",
  };
}

/**
 * Parse Thrifty Traveler title
 */
function parseThriftyTravelerTitle(title: string): Omit<ParsedDeal, "source" | "url" | "publishedAt"> | null {
  const priceMatch = title.match(/\$(\d+)/);
  if (!priceMatch) return null;
  
  const price = parseInt(priceMatch[1]);
  const currency = "USD";

  const routeMatch = title.match(/(\w+)\s+to\s+(\w+)/i);
  if (!routeMatch) return null;
  
  const from = routeMatch[1];
  const to = routeMatch[2];
  
  return {
    route: `${from} to ${to}`,
    from,
    to,
    fromCode: cityToAirportCode(from),
    toCode: cityToAirportCode(to),
    price,
    currency,
    dates: "Various",
    confidence: "medium",
  };
}

/**
 * Parse SecretFlying title format
 * Examples:
 * - "London to Bangkok £299 return"
 * - "ERROR FARE: NYC to Paris $350"
 * - "London to Dubai £245"
 */
function parseSecretFlyingTitle(title: string): Omit<ParsedDeal, "source" | "url" | "publishedAt"> | null {
  // Price patterns
  const priceMatch = title.match(/[£€$](\d+)/);
  if (!priceMatch) return null;
  
  const price = parseInt(priceMatch[1]);
  const currency = priceMatch[0].includes("£") ? "GBP" : 
                   priceMatch[0].includes("€") ? "EUR" : "USD";

  // Route patterns
  // "London to Bangkok", "ERROR FARE: London to Bangkok", "NYC to Paris"
  const routeMatch = title.match(/(?:ERROR FARE:\s*)?(\w+(?:\s+\w+)?)\s+to\s+(\w+(?:\s+\w+)?)/i);
  
  if (!routeMatch) return null;
  
  const from = routeMatch[1].trim();
  const to = routeMatch[2].trim();
  
  // Map city names to airport codes
  const fromCode = cityToAirportCode(from);
  const toCode = cityToAirportCode(to);
  
  // Extract dates if present
  const dateMatch = title.match(/(\w+\s+\d{4}|\w+\s*-\s*\w+|error fare)/i);
  const dates = dateMatch ? dateMatch[1] : "Various dates";
  
  // Confidence based on deal type
  const confidence: "high" | "medium" | "low" = 
    title.toLowerCase().includes("error fare") ? "low" :
    title.toLowerCase().includes("flash sale") ? "medium" : "high";

  return {
    route: `${from} to ${to}`,
    from,
    to,
    fromCode,
    toCode,
    price,
    currency,
    dates,
    confidence,
  };
}

/**
 * Parse Fly4Free title format
 */
function parseFly4FreeTitle(title: string, description?: string): Omit<ParsedDeal, "source" | "url" | "publishedAt"> | null {
  // Similar to SecretFlying but may have different format
  const priceMatch = title.match(/[£€$](\d+)/);
  if (!priceMatch) return null;
  
  const price = parseInt(priceMatch[1]);
  const currency = priceMatch[0].includes("£") ? "GBP" : 
                   priceMatch[0].includes("€") ? "EUR" : "USD";

  // Try to extract route
  const routeMatch = title.match(/(\w+)\s*(?:-|to)\s*(\w+)/i);
  
  if (!routeMatch) return null;
  
  const from = routeMatch[1];
  const to = routeMatch[2];
  
  return {
    route: `${from} to ${to}`,
    from,
    to,
    fromCode: cityToAirportCode(from),
    toCode: cityToAirportCode(to),
    price,
    currency,
    dates: "Check link for dates",
    confidence: "medium",
  };
}

/**
 * Parse Holiday Pirates title
 */
function parseHolidayPiratesTitle(title: string): Omit<ParsedDeal, "source" | "url" | "publishedAt"> | null {
  const priceMatch = title.match(/[£€$](\d+)/);
  if (!priceMatch) return null;
  
  const price = parseInt(priceMatch[1]);
  const currency = priceMatch[0].includes("£") ? "GBP" : 
                   priceMatch[0].includes("€") ? "EUR" : "USD";

  const routeMatch = title.match(/(\w+)\s+to\s+(\w+)/i);
  if (!routeMatch) return null;
  
  const from = routeMatch[1];
  const to = routeMatch[2];
  
  return {
    route: `${from} to ${to}`,
    from,
    to,
    fromCode: cityToAirportCode(from),
    toCode: cityToAirportCode(to),
    price,
    currency,
    dates: "Various",
    confidence: "medium",
  };
}

/**
 * Map city names to IATA codes
 */
function cityToAirportCode(city: string): string {
  const mappings: Record<string, string> = {
    // UK
    "london": "LHR",
    "manchester": "MAN",
    "birmingham": "BHX",
    "edinburgh": "EDI",
    "glasgow": "GLA",
    "bristol": "BRS",
    "dublin": "DUB",
    "belfast": "BFS",
    "newcastle": "NCL",
    "leeds": "LBA",
    "liverpool": "LPL",
    
    // Europe
    "paris": "CDG",
    "amsterdam": "AMS",
    "frankfurt": "FRA",
    "munich": "MUC",
    "berlin": "BER",
    "rome": "FCO",
    "milan": "MXP",
    "madrid": "MAD",
    "barcelona": "BCN",
    "lisbon": "LIS",
    "zurich": "ZUR",
    "vienna": "VIE",
    "copenhagen": "CPH",
    "stockholm": "ARN",
    "oslo": "OSL",
    "helsinki": "HEL",
    "athens": "ATH",
    "prague": "PRG",
    "budapest": "BUD",
    "warsaw": "WAW",
    "brussels": "BRU",
    "dusseldorf": "DUS",
    "hamburg": "HAM",
    "stuttgart": "STR",
    "venice": "VCE",
    "naples": "NAP",
    "malaga": "AGP",
    "seville": "SVQ",
    "porto": "OPO",
    "nice": "NCE",
    "lyon": "LYS",
    "marseille": "MRS",
    "toulouse": "TLS",
    "bordeaux": "BOD",
    "nantes": "NTE",
    "strasbourg": "SXB",
    "geneva": "GVA",
    "basel": "BSL",
    "luxembourg": "LUX",
    
    // US
    "new york": "JFK",
    "nyc": "JFK",
    "los angeles": "LAX",
    "la": "LAX",
    "san francisco": "SFO",
    "chicago": "ORD",
    "miami": "MIA",
    "boston": "BOS",
    "seattle": "SEA",
    "las vegas": "LAS",
    "washington": "DCA",
    "dc": "DCA",
    "philadelphia": "PHL",
    "phoenix": "PHX",
    "san diego": "SAN",
    "denver": "DEN",
    "austin": "AUS",
    "nashville": "BNA",
    "new orleans": "MSY",
    "portland": "PDX",
    "atlanta": "ATL",
    "dallas": "DFW",
    "houston": "IAH",
    "detroit": "DTW",
    "minneapolis": "MSP",
    "salt lake city": "SLC",
    "honolulu": "HNL",
    "orlando": "MCO",
    "tampa": "TPA",
    "fort lauderdale": "FLL",
    "san jose": "SJC",
    "oakland": "OAK",
    "burbank": "BUR",
    "long beach": "LGB",
    
    // Asia
    "bangkok": "BKK",
    "singapore": "SIN",
    "tokyo": "NRT",
    "hong kong": "HKG",
    "dubai": "DXB",
    "kuala lumpur": "KUL",
    "seoul": "ICN",
    "beijing": "PEK",
    "shanghai": "PVG",
    "taipei": "TPE",
    "manila": "MNL",
    "jakarta": "CGK",
    "bali": "DPS",
    "phuket": "HKT",
    "chiang mai": "CNX",
    "ho chi minh": "SGN",
    "hanoi": "HAN",
    "delhi": "DEL",
    "mumbai": "BOM",
    "chennai": "MAA",
    "bangalore": "BLR",
    "hyderabad": "HYD",
    "kolkata": "CCU",
    "colombo": "CMB",
    "male": "MLE",
    "kathmandu": "KTM",
    
    // Australia/NZ
    "sydney": "SYD",
    "melbourne": "MEL",
    "brisbane": "BNE",
    "perth": "PER",
    "adelaide": "ADL",
    "auckland": "AKL",
    "wellington": "WLG",
    "christchurch": "CHC",
    
    // Middle East
    "abu dhabi": "AUH",
    "doha": "DOH",
    "riyadh": "RUH",
    "jeddah": "JED",
    "kuwait": "KWI",
    "muscat": "MCT",
    "bahrain": "BAH",
    "amman": "AMM",
    "beirut": "BEY",
    "tel aviv": "TLV",
    "istanbul": "IST",
    
    // Africa
    "cairo": "CAI",
    "casablanca": "CMN",
    "marrakech": "RAK",
    "tunis": "TUN",
    "algiers": "ALG",
    "johannesburg": "JNB",
    "cape town": "CPT",
    "nairobi": "NBO",
    "addis ababa": "ADD",
    "lagos": "LOS",
    "accra": "ACC",
    
    // South America
    "sao paulo": "GRU",
    "rio": "GIG",
    "buenos aires": "EZE",
    "santiago": "SCL",
    "lima": "LIM",
    "bogota": "BOG",
    "cartagena": "CTG",
    "medellin": "MDE",
    "quito": "UIO",
    "la paz": "LPB",
    "cusco": "CUZ",
    
    // Canada
    "toronto": "YYZ",
    "vancouver": "YVR",
    "montreal": "YUL",
    "calgary": "YYC",
    "ottawa": "YOW",
    "edmonton": "YEG",
    "winnipeg": "YWG",
    "halifax": "YHZ",
    
    // Mexico/Caribbean
    "mexico city": "MEX",
    "cancun": "CUN",
    "puerto vallarta": "PVR",
    "cabos": "SJD",
    "jamaica": "MBJ",
    "barbados": "BGI",
    "bahamas": "NAS",
    "bermuda": "BDA",
  };
  
  const normalizedCity = city.toLowerCase().trim();
  return mappings[normalizedCity] || "XXX";
}

/**
 * Get all deals from all sources
 */
export async function getAllRSSDeals(): Promise<ParsedDeal[]> {
  console.log("[RSS] Fetching all deal sources...");
  
  const [secretFlying, fly4Free, holidayPirates, airfareWatchdog, thriftyTraveler] = await Promise.all([
    scrapeSecretFlying(),
    scrapeFly4Free(),
    scrapeHolidayPirates(),
    scrapeAirfareWatchdog(),
    scrapeThriftyTraveler(),
  ]);
  
  const allDeals = [...secretFlying, ...fly4Free, ...holidayPirates, ...airfareWatchdog, ...thriftyTraveler];
  
  // Sort by price
  allDeals.sort((a, b) => a.price - b.price);
  
  // Remove duplicates
  const uniqueDeals = allDeals.filter((deal, index, self) => 
    index === self.findIndex(d => 
      d.fromCode === deal.fromCode && 
      d.toCode === deal.toCode && 
      d.price === deal.price
    )
  );
  
  console.log(`[RSS] Total unique deals: ${uniqueDeals.length}`);
  return uniqueDeals;
}

/**
 * Get deals for specific route
 */
export async function getDealsForRoute(
  origin: string, 
  destination: string
): Promise<ParsedDeal[]> {
  const allDeals = await getAllRSSDeals();
  
  return allDeals.filter(deal => 
    (deal.fromCode === origin || deal.from.toLowerCase().includes(origin.toLowerCase())) &&
    (deal.toCode === destination || deal.to.toLowerCase().includes(destination.toLowerCase()))
  );
}

/**
 * Clear RSS cache
 */
export function clearRSSCache(): void {
  rssCache.clear();
  console.log("[RSS] Cache cleared");
}
