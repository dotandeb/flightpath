import { chromium, Browser, Page } from 'playwright';

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

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

function formatDateForGoogle(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  passengers: number = 1,
  travelClass: string = 'ECONOMY'
): string {
  const baseUrl = 'https://www.google.com/travel/flights';
  
  // Convert class to Google format
  const classMap: Record<string, string> = {
    'ECONOMY': '1',
    'PREMIUM_ECONOMY': '2',
    'BUSINESS': '3',
    'FIRST': '4'
  };
  
  const tl = classMap[travelClass] || '1';
  
  // Build URL parameters
  const params = new URLSearchParams({
    'q': `Flights from ${origin} to ${destination}`,
    'flt': `${origin}.${destination}.${departureDate}`,
    'so': 'tlf', // sort by price
    'hl': 'en'
  });
  
  if (returnDate) {
    params.set('flt', `${origin}.${destination}.${departureDate}*${destination}.${origin}.${returnDate}`);
  }
  
  // Add passenger count to query
  if (passengers > 1) {
    params.set('q', `Flights from ${origin} to ${destination} for ${passengers} passengers`);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

export async function scrapeGoogleFlights(
  origin: string,
  destination: string,
  departureDate: string,
  options: {
    returnDate?: string;
    passengers?: number;
    travelClass?: string;
    maxResults?: number;
  } = {}
): Promise<ScrapedFlight[]> {
  const { returnDate, passengers = 1, travelClass = 'ECONOMY', maxResults = 10 } = options;
  
  const flights: ScrapedFlight[] = [];
  let page: Page | null = null;
  
  try {
    console.log(`[Scraper] Starting scrape: ${origin} → ${destination} on ${departureDate}`);
    
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
    
    // Build and navigate to URL
    const url = buildGoogleFlightsUrl(origin, destination, departureDate, returnDate, passengers, travelClass);
    console.log(`[Scraper] Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for flight results to load
    console.log('[Scraper] Waiting for results...');
    await page.waitForTimeout(3000);
    
    // Check for cookie consent and accept
    try {
      const cookieButton = await page.$('button[aria-label*="Accept"]');
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // No cookie banner or already accepted
    }
    
    // Extract flight data
    console.log('[Scraper] Extracting flight data...');
    
    const flightData = await page.evaluate((maxRes) => {
      const results: ScrapedFlight[] = [];
      
      // Try multiple selectors for flight cards
      const selectors = [
        '[data-result-index]',
        '[role="listitem"]',
        '.gws-flights__result-item',
        '[jscontroller] li'
      ];
      
      let cards: Element[] = [];
      for (const selector of selectors) {
        cards = Array.from(document.querySelectorAll(selector));
        if (cards.length > 0) break;
      }
      
      console.log(`[Scraper] Found ${cards.length} flight cards`);
      
      for (let i = 0; i < Math.min(cards.length, maxRes); i++) {
        const card = cards[i];
        
        try {
          // Extract airline
          const airlineEl = card.querySelector('[class*="airline"], [class*="carrier"], img[alt]');
          const airline = airlineEl?.getAttribute('alt') || 
                         airlineEl?.textContent?.trim() || 
                         'Unknown Airline';
          
          // Extract price
          const priceEl = card.querySelector('[class*="price"], [class*="cost"]');
          const priceText = priceEl?.textContent || '';
          const priceMatch = priceText.match(/[\d,]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
          
          // Extract times
          const timeEls = card.querySelectorAll('[class*="time"], [class*="hour"]');
          const departureTime = timeEls[0]?.textContent?.trim() || '';
          const arrivalTime = timeEls[1]?.textContent?.trim() || '';
          
          // Extract duration
          const durationEl = card.querySelector('[class*="duration"], [class*="flight-time"]');
          const duration = durationEl?.textContent?.trim() || '';
          
          // Extract stops
          const stopsEl = card.querySelector('[class*="stop"], [class*="layover"]');
          const stopsText = stopsEl?.textContent || '';
          const stops = stopsText.includes('non-stop') ? 0 : 
                       stopsText.includes('1 stop') ? 1 :
                       stopsText.includes('2 stops') ? 2 : 0;
          
          if (price > 0) {
            results.push({
              airline,
              flightNumber: '', // Will try to extract separately
              departure: {
                airport: origin,
                time: departureTime,
                date: departureDate
              },
              arrival: {
                airport: destination,
                time: arrivalTime,
                date: departureDate
              },
              duration,
              stops,
              price,
              currency: 'GBP',
              bookingLink: window.location.href
            });
          }
        } catch (e) {
          console.error('Error parsing card:', e);
        }
      }
      
      return results;
    }, maxResults);
    
    flights.push(...flightData);
    
    console.log(`[Scraper] Extracted ${flights.length} flights`);
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
  } finally {
    if (page) {
      await page.close();
    }
  }
  
  return flights;
}

export async function scrapeSplitTicketLegs(
  origin: string,
  hub: string,
  destination: string,
  departureDate: string,
  returnDate: string | null,
  passengers: number = 1,
  travelClass: string = 'ECONOMY'
): Promise<{ outbound: ScrapedSplitLeg[]; return: ScrapedSplitLeg[] }> {
  const results = {
    outbound: [] as ScrapedSplitLeg[],
    return: [] as ScrapedSplitLeg[]
  };
  
  console.log(`[Scraper] Scraping split ticket via ${hub}...`);
  
  // Scrape outbound leg 1: Origin → Hub
  const leg1Flights = await scrapeGoogleFlights(origin, hub, departureDate, {
    passengers,
    travelClass,
    maxResults: 5
  });
  
  // Scrape outbound leg 2: Hub → Destination
  const leg2Flights = await scrapeGoogleFlights(hub, destination, departureDate, {
    passengers,
    travelClass,
    maxResults: 5
  });
  
  // Convert to split leg format
  results.outbound = leg1Flights.map(f => ({
    from: origin,
    to: hub,
    price: f.price,
    airline: f.airline,
    flightNumber: f.flightNumber || `${f.airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
    departure: f.departure.time,
    arrival: f.arrival.time,
    duration: f.duration,
    bookingLink: f.bookingLink
  }));
  
  results.outbound.push(...leg2Flights.map(f => ({
    from: hub,
    to: destination,
    price: f.price,
    airline: f.airline,
    flightNumber: f.flightNumber || `${f.airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
    departure: f.departure.time,
    arrival: f.arrival.time,
    duration: f.duration,
    bookingLink: f.bookingLink
  })));
  
  // Scrape return legs if return date provided
  if (returnDate) {
    const returnLeg1 = await scrapeGoogleFlights(destination, hub, returnDate, {
      passengers,
      travelClass,
      maxResults: 5
    });
    
    const returnLeg2 = await scrapeGoogleFlights(hub, origin, returnDate, {
      passengers,
      travelClass,
      maxResults: 5
    });
    
    results.return = [
      ...returnLeg1.map(f => ({
        from: destination,
        to: hub,
        price: f.price,
        airline: f.airline,
        flightNumber: f.flightNumber || `${f.airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        departure: f.departure.time,
        arrival: f.arrival.time,
        duration: f.duration,
        bookingLink: f.bookingLink
      })),
      ...returnLeg2.map(f => ({
        from: hub,
        to: origin,
        price: f.price,
        airline: f.airline,
        flightNumber: f.flightNumber || `${f.airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        departure: f.departure.time,
        arrival: f.arrival.time,
        duration: f.duration,
        bookingLink: f.bookingLink
      }))
    ];
  }
  
  return results;
}
