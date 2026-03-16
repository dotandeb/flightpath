// Quick test of the scraper
const { scrapeGoogleFlights, closeBrowser } = require('./lib/scraper-v2');

async function test() {
  console.log('Testing scraper...');
  try {
    const flights = await scrapeGoogleFlights('LHR', 'JFK', '2025-04-15', { maxResults: 3 });
    console.log('Results:', JSON.stringify(flights, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

test();
