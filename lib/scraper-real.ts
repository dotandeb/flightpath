/**
 * SIMPLIFIED SCRAPER - No Playwright on Vercel
 * Uses HTTP requests to flight APIs or returns empty for now
 * Can be replaced with a real scraping service later
 */

export interface RealFlight {
  id: string;
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
  price: number;
  currency: string;
  bookingLink: string;
  source: string;
}

/**
 * Placeholder scraper - returns empty
 * In production, replace with:
 * 1. A real flight API (Skyscanner, Kayak, etc.)
 * 2. A separate scraping microservice
 * 3. Browserless.io or similar remote browser service
 */
export async function scrapeGoogleFlightsReal(
  origin: string,
  destination: string,
  departureDate: string,
  options: { returnDate?: string; maxResults?: number } = {}
): Promise<RealFlight[]> {
  console.log(`[Scraper] Skipping Google scrape for ${origin}→${destination} - no Playwright on Vercel`);
  return [];
}

export async function scrapeSkyscannerReal(
  origin: string,
  destination: string,
  departureDate: string,
  options: { maxResults?: number } = {}
): Promise<RealFlight[]> {
  console.log(`[Scraper] Skipping Skyscanner scrape for ${origin}→${destination} - no Playwright on Vercel`);
  return [];
}

export async function closeBrowser(): Promise<void> {
  // No-op
}
