/**
 * Flight Scraper - Scrapes Google Flights for real prices
 * Stores results in JSON files for the API to serve
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Popular routes to scrape
const ROUTES = [
  { from: 'LHR', to: 'JFK', name: 'London to New York' },
  { from: 'LHR', to: 'LAX', name: 'London to Los Angeles' },
  { from: 'LHR', to: 'DXB', name: 'London to Dubai' },
  { from: 'LHR', to: 'SIN', name: 'London to Singapore' },
  { from: 'JFK', to: 'LHR', name: 'New York to London' },
  { from: 'LAX', to: 'LHR', name: 'Los Angeles to London' },
  { from: 'CDG', to: 'JFK', name: 'Paris to New York' },
  { from: 'FRA', to: 'JFK', name: 'Frankfurt to New York' },
  { from: 'DXB', to: 'LHR', name: 'Dubai to London' },
  { from: 'SIN', to: 'LHR', name: 'Singapore to London' },
];

// Dates to scrape (next 30, 60, 90 days)
function getTargetDates() {
  const dates = [];
  const now = new Date();
  [30, 60, 90].forEach(days => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    dates.push(d.toISOString().split('T')[0]);
  });
  return dates;
}

async function scrapeGoogleFlights(page, origin, destination, date) {
  const url = `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${date}`;
  
  console.log(`[Scraper] Navigating: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for flight results to load
    await page.waitForSelector('li[role="listitem"]', { timeout: 15000 });
    
    // Extract flight data
    const flights = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('li[role="listitem"]');
      
      items.forEach((item, index) => {
        try {
          // Price
          const priceEl = item.querySelector('[data-price] span, .OMOBOQD-u-d, span[data-gs]');
          const priceText = priceEl?.textContent || '';
          const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
          
          // Airline
          const airlineEl = item.querySelector('img[alt]');
          const airline = airlineEl?.alt?.replace(' logo', '') || 'Unknown';
          
          // Times
          const times = item.querySelectorAll('[data-time] span, .OMOBOQD-u-c');
          const departureTime = times[0]?.textContent || '';
          const arrivalTime = times[1]?.textContent || '';
          
          // Duration
          const durationEl = item.querySelector('[data-duration], .OMOBOQD-u-l');
          const duration = durationEl?.textContent || '';
          
          // Stops
          const stopsEl = item.querySelector('[data-stops], .OMOBOQD-u-m');
          const stopsText = stopsEl?.textContent || 'Nonstop';
          const stops = stopsText.includes('Nonstop') ? 0 : parseInt(stopsText) || 0;
          
          if (price > 0) {
            results.push({
              id: `gf-${index}`,
              airline,
              price,
              currency: 'GBP',
              departureTime,
              arrivalTime,
              duration,
              stops,
              source: 'Google Flights'
            });
          }
        } catch (e) {
          // Skip problematic items
        }
      });
      
      return results.slice(0, 10); // Top 10 results
    });
    
    return flights;
  } catch (error) {
    console.error(`[Scraper] Error scraping ${origin}-${destination}:`, error.message);
    return [];
  }
}

async function scrapeRoute(browser, route, date) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Block images and CSS to speed up
  await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
  
  const flights = await scrapeGoogleFlights(page, route.from, route.to, date);
  
  await context.close();
  
  return {
    route: `${route.from}-${route.to}`,
    date,
    flights,
    scrapedAt: new Date().toISOString()
  };
}

async function main() {
  console.log('[Scraper] Starting flight scraper...');
  
  const dates = getTargetDates();
  const dataDir = path.join(__dirname, '..', 'data');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  
  const allResults = [];
  
  for (const route of ROUTES) {
    for (const date of dates) {
      console.log(`[Scraper] ${route.name} on ${date}`);
      
      try {
        const result = await scrapeRoute(browser, route, date);
        allResults.push(result);
        
        // Save individual route file
        const filename = `${route.from}-${route.to}_${date}.json`;
        fs.writeFileSync(
          path.join(dataDir, filename),
          JSON.stringify(result, null, 2)
        );
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
      } catch (error) {
        console.error(`[Scraper] Failed ${route.from}-${route.to}:`, error.message);
      }
    }
  }
  
  await browser.close();
  
  // Save combined index
  const index = {
    lastUpdated: new Date().toISOString(),
    routes: ROUTES.map(r => `${r.from}-${r.to}`),
    dates,
    totalResults: allResults.reduce((sum, r) => sum + r.flights.length, 0)
  };
  
  fs.writeFileSync(
    path.join(dataDir, 'index.json'),
    JSON.stringify(index, null, 2)
  );
  
  console.log('[Scraper] Complete!');
  console.log(`[Scraper] Indexed ${index.totalResults} flights across ${ROUTES.length} routes`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeRoute, ROUTES };
