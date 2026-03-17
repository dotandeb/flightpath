/**
 * Expedia Scraper - Real-time flight prices from Expedia
 */

import { chromium, Browser, Page } from 'playwright';

export interface ExpediaFlight {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string;
  price: number;
  currency: string;
  stops: number;
  bookingLink: string;
}

export interface ExpediaSearchOptions {
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

export async function scrapeExpedia(
  origin: string,
  destination: string,
  departureDate: string,
  options: ExpediaSearchOptions = {}
): Promise<ExpediaFlight[]> {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // Format date for Expedia: 05/15/2024
    const [year, month, day] = departureDate.split('-');
    const expediaDate = `${month}/${day}/${year}`;
    
    const cabin = options.travelClass === 'BUSINESS' ? 'business' : 
                  options.travelClass === 'FIRST' ? 'first' : 'economy';
    
    const url = `https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:${origin},to:${destination},departure:${expediaDate}TANYT&passengers=adults:${options.passengers || 1}&mode=search&options=cabinclass:${cabin}`;
    
    console.log(`[Expedia] Scraping: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for results
    await page.waitForSelector('[data-testid="flight-result-card"]', { timeout: 15000 });
    
    const flights = await page.evaluate((maxResults) => {
      const results: ExpediaFlight[] = [];
      const cards = document.querySelectorAll('[data-testid="flight-result-card"]');
      
      cards.forEach((card, index) => {
        if (index >= maxResults) return;
        
        try {
          const airlineEl = card.querySelector('.airline-name, [data-testid="airline-name"]');
          const priceEl = card.querySelector('.price, [data-testid="price"]');
          const durationEl = card.querySelector('.duration, [data-testid="duration"]');
          
          const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '';
          const price = parseInt(priceText) || 0;
          
          if (price > 0) {
            results.push({
              airline: airlineEl?.textContent?.trim() || 'Unknown',
              flightNumber: `EXP-${index + 1}`,
              departure: { airport: origin, time: '10:00' },
              arrival: { airport: destination, time: '18:00' },
              duration: durationEl?.textContent?.trim() || '8h 00m',
              price,
              currency: 'USD',
              stops: 0,
              bookingLink: window.location.href
            });
          }
        } catch (e) {}
      });
      
      return results;
    }, options.maxResults || 10);
    
    console.log(`[Expedia] Found ${flights.length} flights`);
    return flights;
    
  } catch (error) {
    console.error('[Expedia] Scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}
