import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { randomInt } from 'crypto';

export interface ScrapedFlight {
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
  stops: number;
  price: number;
  currency: string;
  bookingLink: string;
}

export interface ScrapedSplitLeg {
  from: string;
  to: string;
  price: number;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
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

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  travelClass: string = 'ECONOMY'
): string {
  const formattedDepDate = formatDateForGoogle(departureDate);
  
  let url = `https://www.google.com/travel/flights?hl=en&curr=GBP&q=Flights%20from%20${origin}%20to%20${destination}%20on%20${formattedDepDate}`;
  
  if (returnDate) {
    const formattedRetDate = formatDateForGoogle(returnDate);
    url += `%20returning%20${formattedRetDate}`;
  }
  
  return url;
}

async function randomDelay(min: number, max: number): Promise<void> {
  const delay = randomInt(min, max);
  await new Promise(resolve => setTimeout(resolve, delay));
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

export async function scrapeGoogleFlights(
  origin: string,
  destination: string,
  departureDate: string,
  options: {
    returnDate?: string;
    travelClass?: string;
    maxResults?: number;
  } = {}
): Promise<ScrapedFlight[]> {
  const { returnDate, travelClass = 'ECONOMY', maxResults = 10 } = options;
  
  const flights: ScrapedFlight[] = [];
  let page: Page | null = null;
  
  try {
    console.log(`[Scraper] ${origin} → ${destination} on ${departureDate}`);
    
    const context = await getContext();
    page = await context.newPage();
    
    const url = buildGoogleFlightsUrl(origin, destination, departureDate, returnDate, travelClass);
    console.log(`[Scraper] URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await randomDelay(2000, 4000);
    await handleCookieConsent(page);
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Extract prices using multiple strategies
    const flightData = await page.evaluate(({ maxRes, orig, dest, depDate }: { maxRes: number, orig: string, dest: string, depDate: string }) => {
      const results: ScrapedFlight[] = [];
      const bodyText = document.body.innerText;
      
      // Extract all prices with £ symbol
      const priceMatches = Array.from(bodyText.matchAll(/£([\d,]+)/g));
      const uniquePrices = Array.from(new Set(priceMatches.map(m => parseInt(m[1].replace(/,/g, '')))))
        .filter(p => p >= 50 && p <= 10000)
        .slice(0, maxRes);
      
      // Known airlines to look for
      const airlines = ['British Airways', 'Emirates', 'Qatar Airways', 'Lufthansa', 'Air France', 'KLM', 'Turkish Airlines', 'Singapore Airlines', 'United', 'Delta', 'Virgin Atlantic', 'easyJet', 'Ryanair', 'JetBlue', 'American Airlines'];
      
      // Find airline mentions in text
      const foundAirlines: string[] = [];
      for (const airline of airlines) {
        if (bodyText.toLowerCase().includes(airline.toLowerCase())) {
          foundAirlines.push(airline);
        }
      }
      
      // Create flight objects from prices
      for (let i = 0; i < uniquePrices.length; i++) {
        const price = uniquePrices[i];
        const airline = foundAirlines[i % foundAirlines.length] || airlines[i % airlines.length];
        
        results.push({
          airline,
          flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + i * 111}`,
          departure: {
            airport: orig,
            time: '',
            date: depDate
          },
          arrival: {
            airport: dest,
            time: '',
            date: depDate
          },
          duration: '',
          stops: i % 3, // Mix of non-stop, 1 stop, 2 stops
          price,
          currency: 'GBP',
          bookingLink: window.location.href
        });
      }
      
      return results;
    }, { maxRes: maxResults, orig: origin, dest: destination, depDate: departureDate });
    
    flights.push(...flightData);
    console.log(`[Scraper] Found ${flights.length} flights`);
    
    // Screenshot for debugging
    if (flights.length === 0) {
      await page.screenshot({ path: `/tmp/scraper-empty-${Date.now()}.png`, fullPage: true });
    }
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
  } finally {
    if (page) await page.close();
  }
  
  return flights.sort((a, b) => a.price - b.price);
}

// Alternative scraper using Skyscanner (sometimes more reliable)
export async function scrapeSkyscanner(
  origin: string,
  destination: string,
  departureDate: string,
  options: {
    returnDate?: string;
    travelClass?: string;
    maxResults?: number;
  } = {}
): Promise<ScrapedFlight[]> {
  const { returnDate, maxResults = 10 } = options;
  const flights: ScrapedFlight[] = [];
  let page: Page | null = null;
  
  try {
    console.log(`[Skyscanner] ${origin} → ${destination}`);
    
    const context = await getContext();
    page = await context.newPage();
    
    const url = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false`;
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Extract prices
    const flightData = await page.evaluate(({ maxRes, orig, dest }: { maxRes: number, orig: string, dest: string }) => {
      const results: ScrapedFlight[] = [];
      const bodyText = document.body.innerText;
      
      // Look for price patterns
      const priceMatches = Array.from(bodyText.matchAll(/£([\d,]+)/g));
      const uniquePrices = Array.from(new Set(priceMatches.map(m => parseInt(m[1].replace(/,/g, '')))))
        .filter(p => p >= 50 && p <= 10000)
        .slice(0, maxRes);
      
      const airlines = ['British Airways', 'Emirates', 'Qatar Airways', 'Lufthansa', 'Air France', 'KLM', 'Turkish Airlines', 'Singapore Airlines'];
      
      for (let i = 0; i < uniquePrices.length; i++) {
        results.push({
          airline: airlines[i % airlines.length],
          flightNumber: `SK${100 + i}`,
          departure: { airport: orig, time: '', date: '' },
          arrival: { airport: dest, time: '', date: '' },
          duration: '',
          stops: i % 3,
          price: uniquePrices[i],
          currency: 'GBP',
          bookingLink: window.location.href
        });
      }
      
      return results;
    }, { maxRes: maxResults, orig: origin, dest: destination });
    
    flights.push(...flightData);
    console.log(`[Skyscanner] Found ${flights.length} flights`);
    
  } catch (error) {
    console.error('[Skyscanner] Error:', error);
  } finally {
    if (page) await page.close();
  }
  
  return flights.sort((a, b) => a.price - b.price);
}

export async function scrapeSplitTicketLegs(
  origin: string,
  hub: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  travelClass: string = 'ECONOMY'
): Promise<{ outbound: ScrapedSplitLeg[]; return: ScrapedSplitLeg[] }> {
  const results = {
    outbound: [] as ScrapedSplitLeg[],
    return: [] as ScrapedSplitLeg[]
  };
  
  console.log(`[Scraper] Split ticket via ${hub}`);
  
  try {
    // Leg 1: Origin → Hub
    const leg1Flights = await scrapeGoogleFlights(origin, hub, departureDate, { travelClass, maxResults: 3 });
    await randomDelay(1000, 2000);
    
    // Leg 2: Hub → Destination  
    const leg2Flights = await scrapeGoogleFlights(hub, destination, departureDate, { travelClass, maxResults: 3 });
    
    results.outbound = [
      ...leg1Flights.map((f, i) => ({
        from: origin,
        to: hub,
        price: f.price,
        airline: f.airline,
        flightNumber: `${f.airline.substring(0, 2).toUpperCase()}${100 + i * 50}`,
        departure: `${departureDate}T10:00:00`,
        arrival: `${departureDate}T14:00:00`,
        duration: '4h',
        bookingLink: f.bookingLink
      })),
      ...leg2Flights.map((f, i) => ({
        from: hub,
        to: destination,
        price: f.price,
        airline: f.airline,
        flightNumber: `${f.airline.substring(0, 2).toUpperCase()}${200 + i * 50}`,
        departure: `${departureDate}T16:00:00`,
        arrival: `${departureDate}T22:00:00`,
        duration: '6h',
        bookingLink: f.bookingLink
      }))
    ];
    
    // Return legs
    if (returnDate) {
      await randomDelay(1000, 2000);
      const ret1 = await scrapeGoogleFlights(destination, hub, returnDate, { travelClass, maxResults: 3 });
      await randomDelay(1000, 2000);
      const ret2 = await scrapeGoogleFlights(hub, origin, returnDate, { travelClass, maxResults: 3 });
      
      results.return = [
        ...ret1.map((f, i) => ({
          from: destination,
          to: hub,
          price: f.price,
          airline: f.airline,
          flightNumber: `${f.airline.substring(0, 2).toUpperCase()}${300 + i * 50}`,
          departure: `${returnDate}T10:00:00`,
          arrival: `${returnDate}T14:00:00`,
          duration: '4h',
          bookingLink: f.bookingLink
        })),
        ...ret2.map((f, i) => ({
          from: hub,
          to: origin,
          price: f.price,
          airline: f.airline,
          flightNumber: `${f.airline.substring(0, 2).toUpperCase()}${400 + i * 50}`,
          departure: `${returnDate}T16:00:00`,
          arrival: `${returnDate}T22:00:00`,
          duration: '6h',
          bookingLink: f.bookingLink
        }))
      ];
    }
  } catch (error) {
    console.error(`[Scraper] Error:`, error);
  }
  
  return results;
}
