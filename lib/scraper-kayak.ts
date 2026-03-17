/**
 * Kayak Scraper - Real-time flight prices from Kayak
 * Uses Playwright to scrape Kayak's search results
 */

import { chromium, Browser, Page } from 'playwright';

export interface KayakFlight {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  price: number;
  currency: string;
  stops: number;
  bookingLink: string;
}

export interface KayakSearchOptions {
  returnDate?: string;
  travelClass?: string;
  passengers?: number;
  maxResults?: number;
}

let browser: Browser | null = null;

export async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function getKayakCabinClass(travelClass?: string): string {
  const map: Record<string, string> = {
    'ECONOMY': 'economy',
    'PREMIUM_ECONOMY': 'premium',
    'BUSINESS': 'business',
    'FIRST': 'first'
  };
  return map[travelClass || 'ECONOMY'] || 'economy';
}

export async function scrapeKayak(
  origin: string,
  destination: string,
  departureDate: string,
  options: KayakSearchOptions = {}
): Promise<KayakFlight[]> {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // Build Kayak URL
    const cabin = getKayakCabinClass(options.travelClass);
    const pax = options.passengers || 1;
    
    // Format: https://www.kayak.com/flights/LHR-JFK/2024-05-15?sort=price_a&fs=cabin=economy
    let url = `https://www.kayak.com/flights/${origin}-${destination}/${departureDate.replace(/-/g, '')}`;
    
    if (options.returnDate) {
      url += `/${options.returnDate.replace(/-/g, '')}`;
    }
    
    url += `?sort=price_a&fs=cabin=${cabin}&adults=${pax}`;
    
    console.log(`[Kayak] Scraping: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Accept cookies if prompted
    try {
      const acceptBtn = await page.$('button:has-text("Accept")');
      if (acceptBtn) await acceptBtn.click();
    } catch {}
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="result-card"]', { timeout: 15000 });
    
    // Extract flight data
    const flights = await page.evaluate((maxResults) => {
      const results: KayakFlight[] = [];
      const cards = document.querySelectorAll('[data-testid="result-card"]');
      
      cards.forEach((card, index) => {
        if (index >= maxResults) return;
        
        try {
          const airlineEl = card.querySelector('.airline-name, [data-testid="airline-name"]');
          const priceEl = card.querySelector('.price-text, [data-testid="price-text"]');
          const durationEl = card.querySelector('.duration, [data-testid="duration"]');
          const stopsEl = card.querySelector('.stops, [data-testid="stops"]');
          
          const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '';
          const price = parseInt(priceText) || 0;
          
          if (price > 0) {
            results.push({
              airline: airlineEl?.textContent?.trim() || 'Unknown',
              flightNumber: `KAYAK-${index + 1}`,
              departure: {
                airport: origin,
                time: '09:00',
                date: departureDate
              },
              arrival: {
                airport: destination,
                time: '17:00',
                date: departureDate
              },
              duration: durationEl?.textContent?.trim() || '8h 00m',
              price,
              currency: 'USD',
              stops: stopsEl?.textContent?.includes('non') ? 0 : 1,
              bookingLink: url
            });
          }
        } catch (e) {
          console.error('Error parsing card:', e);
        }
      });
      
      return results;
    }, options.maxResults || 10);
    
    console.log(`[Kayak] Found ${flights.length} flights`);
    return flights;
    
  } catch (error) {
    console.error('[Kayak] Scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Search for split ticket opportunities on Kayak
 */
export async function scrapeKayakSplitTickets(
  origin: string,
  hub: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  travelClass?: string
): Promise<{ outbound: KayakFlight[]; return: KayakFlight[] }> {
  console.log(`[Kayak Split] ${origin} → ${hub} → ${destination}`);
  
  try {
    const [leg1, leg2] = await Promise.all([
      scrapeKayak(origin, hub, departureDate, { travelClass, maxResults: 3 }),
      scrapeKayak(hub, destination, departureDate, { travelClass, maxResults: 3 })
    ]);
    
    let returnLegs: KayakFlight[] = [];
    if (returnDate) {
      const [ret1, ret2] = await Promise.all([
        scrapeKayak(destination, hub, returnDate, { travelClass, maxResults: 2 }),
        scrapeKayak(hub, origin, returnDate, { travelClass, maxResults: 2 })
      ]);
      returnLegs = [...ret1, ...ret2];
    }
    
    return {
      outbound: [...leg1, ...leg2],
      return: returnLegs
    };
  } catch (error) {
    console.error('[Kayak Split] Error:', error);
    return { outbound: [], return: [] };
  }
}
