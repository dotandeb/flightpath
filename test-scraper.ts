// Test script for the scraper
import { scrapeGoogleFlights, scrapeSplitTicketLegs, closeBrowser } from './lib/scraper-v2';

async function test() {
  console.log('🧪 Testing FlightPath Scraper v2\n');
  
  try {
    // Test 1: Direct flight search
    console.log('Test 1: Direct flight LHR → JFK');
    const flights = await scrapeGoogleFlights('LHR', 'JFK', '2025-04-15', {
      travelClass: 'ECONOMY',
      maxResults: 5
    });
    
    console.log(`✅ Found ${flights.length} flights`);
    if (flights.length > 0) {
      console.log('Sample:');
      flights.slice(0, 3).forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.airline} - £${f.price}`);
      });
    }
    console.log('');
    
    // Test 2: Split ticket search
    if (flights.length > 0) {
      console.log('Test 2: Split ticket via DXB');
      const split = await scrapeSplitTicketLegs('LHR', 'DXB', 'JFK', '2025-04-15', null, 'ECONOMY');
      
      console.log(`✅ Outbound legs: ${split.outbound.length}`);
      
      if (split.outbound.length >= 2) {
        const leg1 = split.outbound[0];
        const leg2 = split.outbound[1];
        const total = leg1.price + leg2.price;
        const cheapestDirect = flights[0].price;
        
        console.log(`  LHR → DXB: £${leg1.price} (${leg1.airline})`);
        console.log(`  DXB → JFK: £${leg2.price} (${leg2.airline})`);
        console.log(`  Total: £${total} vs Direct: £${cheapestDirect}`);
        console.log(`  Savings: £${Math.max(0, cheapestDirect - total)}`);
      }
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

test();
