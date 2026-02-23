// Deal Site Scraper + Arbitrage Engine
// Scrapes cheap flight deals and runs them through our arbitrage strategies

import { searchAllStrategies } from "./arbitrage-engine";

interface ScrapedDeal {
  route: string;
  from: string;
  to: string;
  price: number;
  currency: string;
  dates: string;
  source: string;
  url: string;
  confidence: "high" | "medium" | "low";
}

// Cache for scraped deals
const dealCache = new Map<string, { deals: ScrapedDeal[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Main function: Get deals + run arbitrage on them
 */
export async function getDealsWithArbitrage(
  origin?: string,
  destination?: string
): Promise<{
  deals: ScrapedDeal[];
  arbitrageResults: any[];
  metadata: {
    sourcesChecked: string[];
    dealsFound: number;
    arbitrageRuns: number;
    timestamp: string;
  };
}> {
  console.log("[DealScraper] Starting deal scrape + arbitrage...");

  // 1. Scrape deals from multiple sources
  const [secretFlying, jackFlight, fly4free] = await Promise.all([
    scrapeSecretFlying(origin, destination),
    scrapeJackFlight(origin, destination),
    scrapeFly4Free(origin, destination),
  ]);

  const allDeals = [...secretFlying, ...jackFlight, ...fly4free];
  console.log(`[DealScraper] Found ${allDeals.length} total deals`);

  // 2. Run arbitrage on top deals (limit to avoid API quota)
  const topDeals = allDeals
    .filter((d) => d.confidence === "high")
    .slice(0, 3); // Only run arbitrage on 3 best deals

  const arbitrageResults: any[] = [];

  for (const deal of topDeals) {
    try {
      // Parse dates from deal
      const { departureDate, returnDate } = parseDealDates(deal.dates);
      if (!departureDate) continue;

      // Run arbitrage search
      const result = await searchAllStrategies({
        origin: deal.from,
        destination: deal.to,
        departureDate,
        returnDate,
        adults: 1,
        currency: deal.currency,
      });

      arbitrageResults.push({
        deal,
        arbitrage: result,
        savingsVsDeal: result.priceRange.min
          ? deal.price - result.priceRange.min
          : 0,
      });
    } catch (err) {
      console.log(`[DealScraper] Arbitrage failed for ${deal.route}:`, err);
    }
  }

  return {
    deals: allDeals,
    arbitrageResults,
    metadata: {
      sourcesChecked: ["SecretFlying", "JackFlight", "Fly4Free"],
      dealsFound: allDeals.length,
      arbitrageRuns: arbitrageResults.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Scrape Secret Flying deals
 */
async function scrapeSecretFlying(
  originFilter?: string,
  destFilter?: string
): Promise<ScrapedDeal[]> {
  try {
    // Secret Flying RSS feed or API endpoint
    const response = await fetch(
      "https://secretflying.com/feed/",
      { next: { revalidate: 3600 } } // Cache 1 hour
    );

    if (!response.ok) return [];

    const xml = await response.text();

    // Parse RSS XML for deals
    const deals = parseSecretFlyingRSS(xml);

    // Filter if origin/destination specified
    if (originFilter || destFilter) {
      return deals.filter(
        (d) =>
          (!originFilter ||
            d.from.toLowerCase().includes(originFilter.toLowerCase())) &&
          (!destFilter ||
            d.to.toLowerCase().includes(destFilter.toLowerCase()))
      );
    }

    return deals;
  } catch (err) {
    console.log("[DealScraper] SecretFlying failed:", err);
    return [];
  }
}

/**
 * Scrape Jack's Flight Club deals
 */
async function scrapeJackFlight(
  originFilter?: string,
  destFilter?: string
): Promise<ScrapedDeal[]> {
  // Jack's Flight Club requires membership for deals
  // Return sample structure for now
  return [];
}

/**
 * Scrape Fly4Free deals
 */
async function scrapeFly4Free(
  originFilter?: string,
  destFilter?: string
): Promise<ScrapedDeal[]> {
  try {
    const response = await fetch(
      "https://www.fly4free.com/feed/",
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return [];

    const xml = await response.text();
    return parseFly4FreeRSS(xml);
  } catch (err) {
    console.log("[DealScraper] Fly4Free failed:", err);
    return [];
  }
}

/**
 * Parse Secret Flying RSS feed
 */
function parseSecretFlyingRSS(xml: string): ScrapedDeal[] {
  const deals: ScrapedDeal[] = [];

  // Extract items from RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    // Extract title
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "";

    // Extract link
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : "";

    // Parse title for route info
    // Format: "London to Bangkok £299"
    const parsed = parseDealTitle(title);

    if (parsed) {
      deals.push({
        route: title,
        from: parsed.from,
        to: parsed.to,
        price: parsed.price,
        currency: parsed.currency,
        dates: parsed.dates || "Various dates",
        source: "SecretFlying",
        url: link,
        confidence: parsed.confidence,
      });
    }
  }

  return deals;
}

/**
 * Parse Fly4Free RSS feed
 */
function parseFly4FreeRSS(xml: string): ScrapedDeal[] {
  // Similar parsing logic
  return [];
}

/**
 * Parse deal title to extract route and price
 * Examples:
 * - "London to Bangkok £299"
 * - "NYC-Paris $450"
 * - "€99 flights from Dublin to Rome"
 */
function parseDealTitle(title: string): {
  from: string;
  to: string;
  price: number;
  currency: string;
  dates?: string;
  confidence: "high" | "medium" | "low";
} | null {
  // Price patterns
  const pricePatterns = [
    /£(\d+)/, // GBP
    /\$(\d+)/, // USD
    /€(\d+)/, // EUR
  ];

  let price = 0;
  let currency = "GBP";

  for (const pattern of pricePatterns) {
    const match = title.match(pattern);
    if (match) {
      price = parseInt(match[1]);
      currency = pattern.source.includes("£")
        ? "GBP"
        : pattern.source.includes("$")
        ? "USD"
        : "EUR";
      break;
    }
  }

  if (price === 0) return null;

  // Route patterns
  // "London to Bangkok", "London-Bangkok", "from London to Bangkok"
  const routeMatch =
    title.match(/(\w+)\s+(?:to|-)\s+(\w+)/i) ||
    title.match(/from\s+(\w+)\s+to\s+(\w+)/i);

  if (!routeMatch) return null;

  const from = routeMatch[1];
  const to = routeMatch[2];

  // Confidence based on parsing quality
  const confidence: "high" | "medium" | "low" =
    from.length > 2 && to.length > 2 && price > 50 ? "high" : "medium";

  return { from, to, price, currency, confidence };
}

/**
 * Parse deal dates string
 */
function parseDealDates(datesStr: string): {
  departureDate?: string;
  returnDate?: string;
} {
  // Try to extract dates from strings like:
  // "May 2025", "15-22 May", "Various dates in June"

  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  // Find month
  const monthMatch = months.find((m) =>
    datesStr.toLowerCase().includes(m)
  );

  if (!monthMatch) return {};

  const monthIndex = months.indexOf(monthMatch) + 1;
  const year = new Date().getFullYear();

  // Default to 15th of month
  const departureDate = `${year}-${String(monthIndex).padStart(2, "0")}-15`;
  const returnDate = `${year}-${String(monthIndex).padStart(2, "0")}-22`;

  return { departureDate, returnDate };
}

/**
 * Get sample deals for testing (when scraping fails)
 */
export function getSampleDeals(): ScrapedDeal[] {
  return [
    {
      route: "London to Bangkok",
      from: "LHR",
      to: "BKK",
      price: 299,
      currency: "GBP",
      dates: "May 2025",
      source: "SecretFlying",
      url: "https://secretflying.com/london-bangkok-deal",
      confidence: "high",
    },
    {
      route: "Manchester to New York",
      from: "MAN",
      to: "JFK",
      price: 350,
      currency: "GBP",
      dates: "June 2025",
      source: "Fly4Free",
      url: "https://fly4free.com/manchester-nyc-deal",
      confidence: "high",
    },
    {
      route: "Dublin to Tokyo",
      from: "DUB",
      to: "NRT",
      price: 450,
      currency: "EUR",
      dates: "April-May 2025",
      source: "SecretFlying",
      url: "https://secretflying.com/dublin-tokyo-deal",
      confidence: "medium",
    },
  ];
}
