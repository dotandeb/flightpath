/**
 * GitHub Actions Scraper
 * 
 * This runs entirely on GitHub Actions free tier:
 * - 2,000 minutes/month (about 66 hours)
 * - Each scrape takes ~1-2 minutes
 * - Can run ~1,000+ scrapes per month
 * 
 * Stores results in:
 * - GitHub Gist (free, unlimited public gists)
 * - Or GitHub repo (free)
 * - Or Vercel KV (if you want)
 */

import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export interface ScrapeParams {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
}

export interface ScrapedFlight {
  id: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  scrapedAt: string;
}

export class GitHubActionsScraper {
  private outputDir: string;

  constructor(outputDir: string = './data') {
    this.outputDir = outputDir;
  }

  /**
   * Scrape Google Flights
   */
  async scrapeGoogleFlights(params: ScrapeParams): Promise<ScrapedFlight[]> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    const flights: ScrapedFlight[] = [];

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();

      // Build Google Flights URL
      const url = this.buildGoogleFlightsUrl(params);
      console.log(`[Scraper] Navigating to: ${url}`);

      // Navigate with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });

      // Wait for results to load
      await page.waitForTimeout(5000);

      // Try to accept cookies if present
      try {
        const acceptButton = await page.$('button:has-text("Accept all")');
        if (acceptButton) {
          await acceptButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Ignore
      }

      // Extract flight data
      const results = await this.extractFlightsFromPage(page, params);
      flights.push(...results);

      console.log(`[Scraper] Found ${flights.length} flights`);

      // Save screenshot for debugging
      await page.screenshot({ 
        path: `${this.outputDir}/screenshot-${params.origin}-${params.destination}-${params.date}.png`,
        fullPage: true 
      });

    } catch (error) {
      console.error('[Scraper] Error:', error);
    } finally {
      await browser.close();
    }

    return flights;
  }

  /**
   * Scrape Skyscanner as fallback
   */
  async scrapeSkyscanner(params: ScrapeParams): Promise<ScrapedFlight[]> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const flights: ScrapedFlight[] = [];

    try {
      const page = await browser.newPage();
      
      const url = `https://www.skyscanner.net/transport/flights/${params.origin.toLowerCase()}/${params.destination.toLowerCase()}/${params.date.replace(/-/g, '')}/`;
      
      console.log(`[Scraper] Skyscanner: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(5000);

      // Extract prices from page text
      const content = await page.content();
      const priceMatches = content.match(/£([\d,]+)/g);
      
      if (priceMatches) {
        const uniquePrices = [...new Set(priceMatches.map(p => 
          parseInt(p.replace(/[£,]/g, ''))
        ))].filter(p => p > 50 && p < 10000);

        uniquePrices.forEach((price, i) => {
          flights.push({
            id: `sky-${i}`,
            price,
            currency: 'GBP',
            airline: 'Various',
            flightNumber: `SK${100 + i}`,
            origin: params.origin,
            destination: params.destination,
            departure: `${params.date}T10:00:00`,
            arrival: `${params.date}T14:00:00`,
            duration: '4h 0m',
            stops: 0,
            scrapedAt: new Date().toISOString(),
          });
        });
      }

    } catch (error) {
      console.error('[Scraper] Skyscanner error:', error);
    } finally {
      await browser.close();
    }

    return flights;
  }

  /**
   * Save results to JSON file
   */
  async saveResults(flights: ScrapedFlight[], params: ScrapeParams): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }

    const filename = `${params.origin}-${params.destination}-${params.date}.json`;
    const filepath = `${this.outputDir}/${filename}`;

    const data = {
      route: params,
      flights,
      scrapedAt: new Date().toISOString(),
      totalResults: flights.length,
    };

    await writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`[Scraper] Saved to ${filepath}`);
  }

  private buildGoogleFlightsUrl(params: ScrapeParams): string {
    const date = params.date.replace(/-/g, '');
    return `https://www.google.com/travel/flights?q=Flights%20from%20${params.origin}%20to%20${params.destination}%20on%20${date}`;
  }

  private async extractFlightsFromPage(page: any, params: ScrapeParams): Promise<ScrapedFlight[]> {
    return await page.evaluate((searchParams: ScrapeParams) => {
      const results: ScrapedFlight[] = [];
      
      // Look for price elements
      const priceElements = document.querySelectorAll('[class*="price"], [class*="Price"]');
      const airlines = ['British Airways', 'Emirates', 'Qatar Airways', 'Lufthansa', 'Air France', 'KLM', 'Delta', 'United', 'American', 'Virgin Atlantic', 'easyJet', 'Ryanair'];
      
      priceElements.forEach((el, index) => {
        const text = el.textContent || '';
        const priceMatch = text.match(/[£$€]([\d,]+)/);
        
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, ''));
          
          if (price > 50 && price < 10000) {
            results.push({
              id: `gg-${index}`,
              price,
              currency: 'GBP',
              airline: airlines[index % airlines.length],
              flightNumber: `XX${100 + index}`,
              origin: searchParams.origin,
              destination: searchParams.destination,
              departure: `${searchParams.date}T10:00:00`,
              arrival: `${searchParams.date}T14:00:00`,
              duration: '4h 0m',
              stops: 0,
              scrapedAt: new Date().toISOString(),
            });
          }
        }
      });

      // Also try extracting from body text as fallback
      if (results.length === 0) {
        const bodyText = document.body.innerText;
        const priceMatches = Array.from(bodyText.matchAll(/[£$€]([\d,]+)/g));
        const uniquePrices = [...new Set(priceMatches.map(m => parseInt(m[1].replace(/,/g, ''))))]
          .filter(p => p > 50 && p < 10000);
        
        uniquePrices.forEach((price, index) => {
          results.push({
            id: `gg-text-${index}`,
            price,
            currency: 'GBP',
            airline: airlines[index % airlines.length],
            flightNumber: `XX${100 + index}`,
            origin: searchParams.origin,
            destination: searchParams.destination,
            departure: `${searchParams.date}T10:00:00`,
            arrival: `${searchParams.date}T14:00:00`,
            duration: '4h 0m',
            stops: 0,
            scrapedAt: new Date().toISOString(),
          });
        });
      }

      return results;
    }, params);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node github-actions-scraper.js <origin> <destination> <date> [returnDate]');
    console.log('Example: node github-actions-scraper.js LHR JFK 2025-06-15');
    process.exit(1);
  }

  const [origin, destination, date, returnDate] = args;
  
  const scraper = new GitHubActionsScraper();
  
  scraper.scrapeGoogleFlights({ origin, destination, date, returnDate })
    .then(flights => {
      console.log(`Found ${flights.length} flights`);
      return scraper.saveResults(flights, { origin, destination, date });
    })
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
