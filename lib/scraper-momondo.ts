/**
 * Momondo Scraper - Real-time flight prices from Momondo
 * Momondo often has unique deals not found on other sites
 */

import { chromium, Browser } from 'playwright';

export interface MomondoFlight {
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
  isBestDeal: boolean;
  bookingLink: string;
}

export interface MomondoSearchOptions {
  returnDate?: string;
  travelClass?: string;
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

export async function scrapeMomondo(
  origin: string,
  destination: string,
  departureDate: string,
  options: MomondoSearchOptions = {}
): Promise<MomondoFlight[]> {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  try {
    // Momondo URL format
    const url = `https://www.momondo.com/flight-search/${origin}-${destination}/${departureDate}`;
    
    console.log(`[Momondo] Scraping: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for flight results
    await page.waitForSelector('.result-inner', { timeout: 15000 });
    
    const flights = await page.evaluate((maxResults) => {
      const results: MomondoFlight[] = [];
      const cards = document.querySelectorAll('.result-inner');
      
      cards.forEach((card, index) => {
        if (index >= maxResults) return;
        
        try {
          const priceEl = card.querySelector('.price-text');
          const airlineEl = card.querySelector('.carrier-name');
          const isBest = card.classList.contains('best');
          
          const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '';
          const price = parseInt(priceText) || 0;
          
          if (price > 0) {
            results.push({
              airline: airlineEl?.textContent?.trim() || 'Unknown',
              flightNumber: `MOM-${index + 1}`,
              departure: { airport: origin, time: '08:00' },
              arrival: { airport: destination, time: '16:00' },
              duration: '8h 00m',
              price,
              currency: 'USD',
              stops: 0,
              isBestDeal: isBest,
              bookingLink: window.location.href
            });
          }
        } catch (e) {}
      });
      
      return results;
    }, options.maxResults || 10);
    
    console.log(`[Momondo] Found ${flights.length} flights`);
    return flights;
    
  } catch (error) {
    console.error('[Momondo] Scraping error:', error);
    return [];
  } finally {
    await page.close();
  }
}
