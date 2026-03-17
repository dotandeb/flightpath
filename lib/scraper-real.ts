/**
 * REAL-TIME SCRAPER WITH BROWSER POOL
 * Parallel scraping with proper resource management
 */

import { Page } from 'playwright';
import { globalPool } from './browser-pool';

export interface RealFlight {
  airline: string;
  flightNumber: string;
  airlineCode: string;
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
  stops: number;
  stopAirports?: string[];
  price: number;
  currency: string;
  bookingLink: string;
}

/**
 * Scrape Google Flights with parallel browser pool
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
  
  return globalPool.execute(async (page) => {
    const flights: RealFlight[] = [];
    
    try {
      // Build Google Flights URL
      const [year, month, day] = departureDate.split('-');
      const formattedDate = `${year}-${month}-${day}`;
      
      let url = `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${formattedDate}`;
      if (returnDate) {
        const [ry, rm, rd] = returnDate.split('-');
        url += `%20returning%20${ry}-${rm}-${rd}`;
      }
      
      console.log(`[RealScraper] ${origin} → ${destination} on ${departureDate}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(3000);
      
      // Extract flight data
      const flightData = await page.evaluate(({ maxRes, orig, dest, depDate }) => {
        const results: any[] = [];
        const cards = document.querySelectorAll('li, [role="listitem"]');
        
        for (const card of Array.from(cards).slice(0, maxRes)) {
          try {
            const airlineEl = card.querySelector('img[alt*="logo"], img[alt*="Air"], [aria-label*="Air"]');
            let airline = airlineEl?.getAttribute('alt')?.replace(' logo', '') || 
                         airlineEl?.getAttribute('aria-label') || '';
            
            const timeEls = card.querySelectorAll('span[role="text"], time, [aria-label*="AM"], [aria-label*="PM"]');
            const times: string[] = [];
            timeEls.forEach(el => {
              const text = el.textContent || el.getAttribute('aria-label') || '';
              const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(AM|PM)?)/i);
              if (timeMatch) times.push(timeMatch[1]);
            });
            
            const priceEl = card.querySelector('span[aria-label*="£"]');
            const priceText = priceEl?.textContent || '';
            const priceMatch = priceText.match(/£([\d,]+)/);
            const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
            
            const durationEl = card.querySelector('[aria-label*="hour"], [aria-label*="hr"]');
            const duration = durationEl?.getAttribute('aria-label') || '';
            
            const stopsText = card.textContent || '';
            const stopsMatch = stopsText.match(/(nonstop|direct|1 stop|2 stops|3 stops)/i);
            const stops = stopsMatch ? 
              stopsMatch[1].toLowerCase().includes('non') || stopsMatch[1].toLowerCase().includes('direct') ? 0 :
              parseInt(stopsMatch[1]) || 1 : 0;
            
            if (price > 0 && airline && times.length >= 2) {
              results.push({
                airline,
                flightNumber: '',
                airlineCode: airline.substring(0, 2).toUpperCase(),
                departure: { airport: orig, time: times[0] || '', date: depDate },
                arrival: { airport: dest, time: times[1] || '', date: depDate },
                duration,
                stops,
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
      console.log(`[RealScraper] Found ${flights.length} real flights`);
      
    } catch (error) {
      console.error('[RealScraper] Error:', error);
    }
    
    return flights;
  });
}

/**
 * Skyscanner scraper with browser pool
 */
export async function scrapeSkyscannerReal(
  origin: string,
  destination: string,
  departureDate: string,
  options: { maxResults?: number } = {}
): Promise<RealFlight[]> {
  const { maxResults = 10 } = options;
  
  return globalPool.execute(async (page) => {
    const flights: RealFlight[] = [];
    
    try {
      const url = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${departureDate.replace(/-/g, '')}/?adults=1`;
      
      console.log(`[SkyscannerReal] ${origin} → ${destination}`);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(4000);
      
      const flightData = await page.evaluate(({ maxRes, orig, dest, depDate }) => {
        const results: any[] = [];
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
    }
    
    return flights;
  });
}

/**
 * Close all browser resources
 */
export async function closeBrowser(): Promise<void> {
  await globalPool.closeAll();
}
