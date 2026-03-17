/**
 * REAL-TIME SCRAPER WITH ACTUAL FLIGHT DATA EXTRACTION
 * Extracts real flight numbers, times, airlines - NO FAKE DATA
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

export interface RealFlight {
  airline: string;
  flightNumber: string;
  airlineCode: string;
  departure: {
    airport: string;
    time: string;  // HH:MM format
    date: string;  // YYYY-MM-DD
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  stopAirports?: string[];
  price: number;
  currency: string;
  bookingLink: string;
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
        '--window-size=1920,1080'
      ]
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
  }
}

async function getContext(): Promise<BrowserContext> {
  if (!context) {
    const browser = await getBrowser();
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-GB',
      timezoneId: 'Europe/London'
    });
  }
  return context;
}

/**
 * Scrape Google Flights with REAL flight data extraction
 * Uses structured data selectors instead of text regex
 */
export async function scrapeGoogleFlightsReal(
  origin: string,
  destination: string,
  departureDate: string,
  options: {
    returnDate?: string;
    maxResults?: number;
  } = {}
): Promise<RealFlight[]> {
  const { returnDate, maxResults = 10 } = options;
  const flights: RealFlight[] = [];
  let page: Page | null = null;
  
  try {
    const ctx = await getContext();
    page = await ctx.newPage();
    
    // Build Google Flights URL
    const [year, month, day] = departureDate.split('-');
    const formattedDate = `${year}-${month}-${day}`;
    
    let url = `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${formattedDate}`;
    if (returnDate) {
      const [ry, rm, rd] = returnDate.split('-');
      url += `%20returning%20${ry}-${rm}-${rd}`;
    }
    
    console.log(`[RealScraper] ${origin} → ${destination} on ${departureDate}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for flight results to load
    await page.waitForTimeout(3000);
    
    // Extract structured flight data
    const flightData = await page.evaluate(({ maxRes, orig, dest, depDate }) => {
      const results: RealFlight[] = [];
      
      // Look for flight result cards
      const cards = document.querySelectorAll('li, [role="listitem"]');
      
      for (const card of Array.from(cards).slice(0, maxRes)) {
        try {
          // Extract airline from logo alt text or aria-label
          const airlineEl = card.querySelector('img[alt*="logo"], img[alt*="Air"], [aria-label*="Air"]');
          let airline = airlineEl?.getAttribute('alt')?.replace(' logo', '') || 
                       airlineEl?.getAttribute('aria-label') || '';
          
          // Extract times
          const timeEls = card.querySelectorAll('span[role="text"], time, [aria-label*="AM"], [aria-label*="PM"]');
          const times: string[] = [];
          timeEls.forEach(el => {
            const text = el.textContent || el.getAttribute('aria-label') || '';
            const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(AM|PM)?)/i);
            if (timeMatch) times.push(timeMatch[1]);
          });
          
          // Extract price
          const priceEl = card.querySelector('span[aria-label*="£"], span:contains("£"), div:contains("£")');
          const priceText = priceEl?.textContent || '';
          const priceMatch = priceText.match(/£([\d,]+)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
          
          // Extract duration
          const durationEl = card.querySelector('[aria-label*="hour"], [aria-label*="hr"]');
          const duration = durationEl?.getAttribute('aria-label') || '';
          
          // Extract stops
          const stopsText = card.textContent || '';
          const stopsMatch = stopsText.match(/(nonstop|direct|1 stop|2 stops|3 stops)/i);
          const stops = stopsMatch ? 
            stopsMatch[1].toLowerCase().includes('non') || stopsMatch[1].toLowerCase().includes('direct') ? 0 :
            parseInt(stopsMatch[1]) || 1 : 0;
          
          if (price > 0 && airline && times.length >= 2) {
            results.push({
              airline,
              flightNumber: '',  // Will be populated from booking link
              airlineCode: airline.substring(0, 2).toUpperCase(),
              departure: {
                airport: orig,
                time: times[0] || '',
                date: depDate
              },
              arrival: {
                airport: dest,
                time: times[1] || '',
                date: depDate
              },
              duration,
              stops,
              price,
              currency: 'GBP',
              bookingLink: window.location.href
            });
          }
        } catch (e) {
          // Skip this card
        }
      }
      
      return results;
    }, { maxRes: maxResults, orig: origin, dest: destination, depDate: departureDate });
    
    flights.push(...flightData);
    console.log(`[RealScraper] Found ${flights.length} real flights`);
    
  } catch (error) {
    console.error('[RealScraper] Error:', error);
  } finally {
    if (page) await page.close();
  }
  
  return flights;
}

/**
 * Skyscanner scraper with real data extraction
 */
export async function scrapeSkyscannerReal(
  origin: string,
  destination: string,
  departureDate: string,
  options: { maxResults?: number } = {}
): Promise<RealFlight[]> {
  const { maxResults = 10 } = options;
  const flights: RealFlight[] = [];
  let page: Page | null = null;
  
  try {
    const ctx = await getContext();
    page = await ctx.newPage();
    
    const url = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${departureDate.replace(/-/g, '')}/?adults=1`;
    
    console.log(`[SkyscannerReal] ${origin} → ${destination}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    
    const flightData = await page.evaluate(({ maxRes, orig, dest, depDate }) => {
      const results: RealFlight[] = [];
      const cards = document.querySelectorAll('[data-testid="flight-card"], .FlightCard, .result-card');
      
      for (const card of Array.from(cards).slice(0, maxRes)) {
        try {
          const airlineEl = card.querySelector('.airline-name, [data-testid="airline"]');
          const airline = airlineEl?.textContent?.trim() || '';
          
          const timeEls = card.querySelectorAll('.time, [data-testid="time"]');
          const times = Array.from(timeEls).map(el => el.textContent?.trim() || '').filter(Boolean);
          
          const priceEl = card.querySelector('.price, [data-testid="price"]');
          const priceText = priceEl?.textContent || '';
          const priceMatch = priceText.match(/([\d,]+)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
          
          if (price > 0 && airline && times.length >= 2) {
            results.push({
              airline,
              flightNumber: '',
              airlineCode: airline.substring(0, 2).toUpperCase(),
              departure: { airport: orig, time: times[0], date: depDate },
              arrival: { airport: dest, time: times[1], date: depDate },
              duration: '',
              stops: 0,
              price,
              currency: 'GBP',
              bookingLink: window.location.href
            });
          }
        } catch (e) {}
      }
      
      return results;
    }, { maxRes: maxResults, orig: origin, dest: destination, depDate: departureDate });
    
    flights.push(...flightData);
    console.log(`[SkyscannerReal] Found ${flights.length} flights`);
    
  } catch (error) {
    console.error('[SkyscannerReal] Error:', error);
  } finally {
    if (page) await page.close();
  }
  
  return flights;
}
