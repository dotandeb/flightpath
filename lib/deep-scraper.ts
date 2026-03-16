import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { randomInt } from 'crypto';

// Major airports worldwide for comprehensive search
export const MAJOR_AIRPORTS = {
  // Europe
  europe: ['LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN', 'FCO', 'MUC', 'ZUR', 'VIE', 'CPH', 'ARN', 'OSL', 'HEL', 'DUB', 'LIS', 'ATH', 'WAW', 'PRG', 'BUD', 'BRU', 'TXL', 'HAM', 'DUS', 'MXP'],
  
  // North America
  northAmerica: ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'ATL', 'MIA', 'BOS', 'PHL', 'PHX', 'IAH', 'SAN', 'TPA', 'BWI', 'CLT', 'SLC', 'PDX', 'YVR', 'YYZ', 'YUL', 'YVR'],
  
  // Asia
  asia: ['HND', 'NRT', 'ICN', 'SIN', 'HKG', 'BKK', 'KUL', 'TPE', 'PVG', 'PEK', 'CAN', 'DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CGK', 'MNL', 'SGN', 'HAN', 'DPS'],
  
  // Middle East
  middleEast: ['DXB', 'DOH', 'AUH', 'JED', 'RUH', 'KWI', 'BAH', 'MCT', 'AMM', 'BEY', 'TLV'],
  
  // Oceania
  oceania: ['SYD', 'MEL', 'BNE', 'PER', 'AKL', 'CHC', 'WLG'],
  
  // Africa
  africa: ['JNB', 'CPT', 'CAI', 'ADD', 'NBO', 'LOS', 'ACC', 'DAR', 'ZNZ'],
  
  // South America
  southAmerica: ['GRU', 'GIG', 'EZE', 'SCL', 'LIM', 'BOG', 'MDE', 'CCS', 'UIO', 'GYE'],
  
  // UK Domestic
  uk: ['LHR', 'LGW', 'STN', 'LTN', 'MAN', 'EDI', 'GLA', 'BHX', 'BRS', 'NCL', 'LBA', 'ABZ']
};

// All airports flattened
export const ALL_AIRPORTS = Object.values(MAJOR_AIRPORTS).flat();

// Major hubs for split-ticket optimization
export const HUBS = {
  global: ['DXB', 'DOH', 'IST', 'SIN', 'HKG', 'AMS', 'FRA', 'CDG', 'LHR'],
  europe: ['AMS', 'FRA', 'CDG', 'IST', 'MUC', 'ZUR', 'VIE', 'HEL'],
  middleEast: ['DXB', 'DOH', 'AUH', 'IST'],
  asia: ['SIN', 'HKG', 'BKK', 'KUL', 'TPE'],
  northAmerica: ['JFK', 'LAX', 'ORD', 'YYZ', 'YVR']
};

export interface ComprehensiveFlightResult {
  route: string;
  from: string;
  to: string;
  airline: string;
  price: number;
  currency: string;
  departureDate: string;
  bookingLink: string;
  isSplitTicket: boolean;
  legs?: Array<{
    from: string;
    to: string;
    price: number;
    airline: string;
  }>;
  savings?: number;
  vsDirectPrice?: number;
}

export interface ErrorFareCandidate {
  route: string;
  price: number;
  normalPrice: number;
  discount: number;
  from: string;
  to: string;
  airline: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DeepResearchResult {
  cheapestFlights: ComprehensiveFlightResult[];
  errorFares: ErrorFareCandidate[];
  splitTicketOpportunities: ComprehensiveFlightResult[];
  hubAnalysis: Record<string, number>;
  searchStats: {
    routesSearched: number;
    totalResults: number;
    searchTime: number;
  };
}

let browser: Browser | null = null;
let context: BrowserContext | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }
  return browser;
}

async function getContext(): Promise<BrowserContext> {
  if (!context) {
    const browser = await getBrowser();
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-GB',
      timezoneId: 'Europe/London',
    });
  }
  return context;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
  }
}

function formatDateForGoogle(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function randomDelay(min: number, max: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, randomInt(min, max)));
}

async function handleCookieConsent(page: Page): Promise<void> {
  try {
    const cookieButton = await page.$('button:has-text("Accept all")');
    if (cookieButton) {
      await cookieButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    // Ignore
  }
}

// Extract prices from Google Flights
export async function scrapePrices(
  origin: string,
  destination: string,
  departureDate: string
): Promise<number[]> {
  let page: Page | null = null;
  const prices: number[] = [];
  
  try {
    const ctx = await getContext();
    page = await ctx.newPage();
    
    const url = `https://www.google.com/travel/flights?hl=en&curr=GBP&q=Flights%20from%20${origin}%20to%20${destination}%20on%20${formatDateForGoogle(departureDate)}`;
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 4000);
    await handleCookieConsent(page);
    await page.waitForTimeout(4000);
    
    // Extract all prices
    const pagePrices = await page.evaluate(() => {
      const text = document.body.innerText;
      const matches = Array.from(text.matchAll(/£([\d,]+)/g));
      return Array.from(new Set(matches.map(m => parseInt(m[1].replace(/,/g, '')))))
        .filter(p => p >= 50 && p <= 20000);
    });
    
    prices.push(...pagePrices);
    
  } catch (error) {
    console.error(`[DeepScraper] Error scraping ${origin}-${destination}:`, error);
  } finally {
    if (page) await page.close();
  }
  
  return prices.sort((a, b) => a - b);
}

// Deep research: Search multiple routes comprehensively
export async function deepResearch(
  originRegion: 'europe' | 'northAmerica' | 'asia' | 'middleEast' | 'oceania' | 'africa' | 'southAmerica' | 'uk' | 'all',
  destinationRegion: 'europe' | 'northAmerica' | 'asia' | 'middleEast' | 'oceania' | 'africa' | 'southAmerica' | 'uk' | 'all',
  departureDate: string,
  options: {
    maxRoutes?: number;
    includeSplitTickets?: boolean;
    errorFareThreshold?: number; // % below average to flag as error fare
  } = {}
): Promise<DeepResearchResult> {
  const { maxRoutes = 50, includeSplitTickets = true, errorFareThreshold = 40 } = options;
  
  const startTime = Date.now();
  const results: DeepResearchResult = {
    cheapestFlights: [],
    errorFares: [],
    splitTicketOpportunities: [],
    hubAnalysis: {},
    searchStats: {
      routesSearched: 0,
      totalResults: 0,
      searchTime: 0
    }
  };
  
  // Get airport lists
  const origins = originRegion === 'all' 
    ? ALL_AIRPORTS 
    : MAJOR_AIRPORTS[originRegion] || MAJOR_AIRPORTS.europe;
    
  const destinations = destinationRegion === 'all'
    ? ALL_AIRPORTS
    : MAJOR_AIRPORTS[destinationRegion] || MAJOR_AIRPORTS.asia;
  
  // Generate route combinations (limit to maxRoutes)
  const routes: Array<{from: string, to: string}> = [];
  for (const from of origins.slice(0, 10)) {
    for (const to of destinations.slice(0, 10)) {
      if (from !== to && !routes.find(r => r.from === from && r.to === to)) {
        routes.push({ from, to });
      }
    }
  }
  
  const limitedRoutes = routes.slice(0, maxRoutes);
  console.log(`[DeepResearch] Searching ${limitedRoutes.length} routes...`);
  
  // Search routes in batches (to avoid overwhelming)
  const batchSize = 5;
  const allResults: ComprehensiveFlightResult[] = [];
  
  for (let i = 0; i < limitedRoutes.length; i += batchSize) {
    const batch = limitedRoutes.slice(i, i + batchSize);
    console.log(`[DeepResearch] Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(limitedRoutes.length/batchSize)}`);
    
    for (const route of batch) {
      try {
        const prices = await scrapePrices(route.from, route.to, departureDate);
        await randomDelay(1500, 3000);
        
        if (prices.length > 0) {
          const cheapestPrice = prices[0];
          allResults.push({
            route: `${route.from} → ${route.to}`,
            from: route.from,
            to: route.to,
            airline: 'Various',
            price: cheapestPrice,
            currency: 'GBP',
            departureDate,
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${route.from}%20to%20${route.to}%20on%20${departureDate}`,
            isSplitTicket: false
          });
          
          // Check for split ticket opportunities via major hubs
          if (includeSplitTickets) {
            for (const hub of HUBS.global.slice(0, 3)) {
              if (hub === route.from || hub === route.to) continue;
              
              const leg1Prices = await scrapePrices(route.from, hub, departureDate);
              await randomDelay(1000, 2000);
              const leg2Prices = await scrapePrices(hub, route.to, departureDate);
              await randomDelay(1000, 2000);
              
              if (leg1Prices.length > 0 && leg2Prices.length > 0) {
                const splitTotal = leg1Prices[0] + leg2Prices[0];
                const savings = cheapestPrice - splitTotal;
                
                if (savings > 30) {
                  results.splitTicketOpportunities.push({
                    route: `${route.from} → ${route.to} (via ${hub})`,
                    from: route.from,
                    to: route.to,
                    airline: 'Split Ticket',
                    price: splitTotal,
                    currency: 'GBP',
                    departureDate,
                    bookingLink: `https://www.google.com/travel/flights`,
                    isSplitTicket: true,
                    legs: [
                      { from: route.from, to: hub, price: leg1Prices[0], airline: 'Various' },
                      { from: hub, to: route.to, price: leg2Prices[0], airline: 'Various' }
                    ],
                    savings,
                    vsDirectPrice: cheapestPrice
                  });
                  
                  // Track hub usage
                  results.hubAnalysis[hub] = (results.hubAnalysis[hub] || 0) + 1;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(`[DeepResearch] Error on ${route.from}-${route.to}:`, e);
      }
    }
    
    // Longer delay between batches
    await randomDelay(3000, 5000);
  }
  
  // Sort and deduplicate
  allResults.sort((a, b) => a.price - b.price);
  results.cheapestFlights = allResults.slice(0, 20);
  
  // Find error fares (unusually cheap)
  const avgPrice = allResults.reduce((sum, r) => sum + r.price, 0) / allResults.length;
  const stdDev = Math.sqrt(allResults.reduce((sum, r) => sum + Math.pow(r.price - avgPrice, 2), 0) / allResults.length);
  
  for (const flight of allResults) {
    const discount = ((avgPrice - flight.price) / avgPrice) * 100;
    if (discount > errorFareThreshold) {
      results.errorFares.push({
        route: flight.route,
        price: flight.price,
        normalPrice: Math.round(avgPrice),
        discount: Math.round(discount),
        from: flight.from,
        to: flight.to,
        airline: flight.airline,
        confidence: discount > 60 ? 'high' : discount > 50 ? 'medium' : 'low',
        reason: `${Math.round(discount)}% below average (£${Math.round(avgPrice)})`
      });
    }
  }
  
  // Sort split tickets by savings
  results.splitTicketOpportunities.sort((a, b) => (b.savings || 0) - (a.savings || 0));
  
  results.searchStats = {
    routesSearched: limitedRoutes.length,
    totalResults: allResults.length,
    searchTime: Date.now() - startTime
  };
  
  console.log(`[DeepResearch] Completed in ${results.searchStats.searchTime}ms`);
  console.log(`[DeepResearch] Found ${results.cheapestFlights.length} cheap flights, ${results.errorFares.length} error fares, ${results.splitTicketOpportunities.length} split tickets`);
  
  return results;
}

// Multi-city search (for round-the-world or complex trips)
export async function multiCitySearch(
  segments: Array<{from: string, to: string, date: string}>,
  options: {
    flexibleDates?: boolean;
    nearbyAirports?: boolean;
  } = {}
): Promise<ComprehensiveFlightResult[]> {
  const results: ComprehensiveFlightResult[] = [];
  
  for (const segment of segments) {
    const prices = await scrapePrices(segment.from, segment.to, segment.date);
    await randomDelay(1500, 3000);
    
    if (prices.length > 0) {
      results.push({
        route: `${segment.from} → ${segment.to}`,
        from: segment.from,
        to: segment.to,
        airline: 'Various',
        price: prices[0],
        currency: 'GBP',
        departureDate: segment.date,
        bookingLink: `https://www.google.com/travel/flights?q=Flights%20from%20${segment.from}%20to%20${segment.to}%20on%20${segment.date}`,
        isSplitTicket: false
      });
    }
  }
  
  return results;
}

// Find cheapest dates for a route (flexible date search)
export async function flexibleDateSearch(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string
): Promise<Array<{date: string, price: number}>> {
  const results: Array<{date: string, price: number}> = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check every 3 days in range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 3)) {
    const dateStr = d.toISOString().split('T')[0];
    const prices = await scrapePrices(origin, destination, dateStr);
    
    if (prices.length > 0) {
      results.push({ date: dateStr, price: prices[0] });
    }
    
    await randomDelay(2000, 4000);
  }
  
  return results.sort((a, b) => a.price - b.price);
}
