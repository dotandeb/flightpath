import { NextRequest, NextResponse } from "next/server";
import {
  searchAmadeusFlights,
  transformAmadeusResults,
  runAcidTest,
} from "@/app/lib/amadeus-api";
import {
  searchAllStrategies,
  getApiUsageStats,
} from "@/app/lib/arbitrage-engine";
import {
  generateSampleDataResults,
} from "@/app/lib/travelpayouts-data-api";
import { getSampleDeals } from "@/app/lib/deal-scraper";
import { getAllRSSDeals, getDealsForRoute } from "@/app/lib/rss-scraper";
import { getAirportFull, getAirportDisplay } from "@/app/lib/airports-db";
import { generateSplitTicketExample, generateNearbyAirportExample, generateFlexibleDatesExample } from "@/app/lib/enhanced-deals";

// ============================================
// FLIGHT SEARCH API - RSS DEALS + ARBITRAGE
// ============================================
// 1. Fetches real deals from RSS (SecretFlying, Fly4Free, HolidayPirates)
// 2. Runs arbitrage strategies on deals
// 3. Falls back to Amadeus if env vars set
// 4. Final fallback to sample data

const USE_AMADEUS = process.env.USE_AMADEUS === "true";
const USE_ARBITRAGE = process.env.USE_ARBITRAGE !== "false";

/**
 * Generate "how to find" instructions for broken links
 */
function generateHowToFindText(origin: string, destination: string, source: string): string {
  const instructions: Record<string, string> = {
    "SecretFlying": `Go to secretflying.com and search for "${origin} to ${destination}". Sort by most recent.`,
    "Fly4Free": `Go to fly4free.com and use their search box for "${origin}-${destination}". Check the flight deals section.`,
    "HolidayPirates": `Go to holidaypirates.com and search for flights from ${origin} to ${destination}.`,
    "AirfareWatchdog": `Go to airfarewatchdog.com and set up a fare alert for ${origin} to ${destination}.`,
    "ThriftyTraveler": `Go to thriftytraveler.com and search their deals for ${origin} to ${destination}.`,
    "Skyscanner": `Go to skyscanner.net, enter ${origin} to ${destination}, and use their "whole month" view to find cheapest dates.`,
    "GoogleFlights": `Go to flights.google.com, search ${origin} to ${destination}, and track prices for your dates.`,
    "Kayak": `Go to kayak.com and search ${origin} to ${destination}. Use their price forecast feature.`,
  };
  
  return instructions[source] || `Go to ${source.toLowerCase().replace(/\s/g, '')}.com and search for flights from ${origin} to ${destination}.`;
}

/**
 * POST /api/search
 * Main search with RSS deals + arbitrage
 */
export async function POST(request: NextRequest) {
  try {
    const params = await request.json();

    // Validate required fields
    if (!params.origin || !params.destination || !params.departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, departureDate" },
        { status: 400 }
      );
    }

    // Get airport details
    const originAirport = getAirportFull(params.origin);
    const destAirport = getAirportFull(params.destination);

    // 1. Try RSS deal sites first (real deals)
    console.log("[Search] Fetching RSS deals...");
    let rssDeals: any[] = [];
    
    try {
      rssDeals = await getDealsForRoute(params.origin, params.destination);
      console.log(`[Search] Found ${rssDeals.length} RSS deals`);
    } catch (rssError) {
      console.log("[Search] RSS fetch failed, using sample deals");
    }

    // If no RSS deals, use sample deals that MATCH the route
    let deals = rssDeals;
    if (deals.length === 0) {
      const sampleDeals = getSampleDeals().filter(d => 
        d.from === params.origin && d.to === params.destination
      );
      
      if (sampleDeals.length > 0) {
        deals = sampleDeals;
      } else {
        // Generate example split ticket for this route
        console.log("[Search] No deals found, generating example split ticket");
      }
    }

    const allOptions: any[] = [];

    // Add RSS/sample deals
    if (deals.length > 0) {
      const dealOptions = deals.map(deal => {
        const fromAirport = getAirportFull(deal.fromCode || deal.from);
        const toAirport = getAirportFull(deal.toCode || deal.to);
        
        return {
          id: `deal-${deal.source}-${Date.now()}`,
          strategy: "rss-deal",
          strategyDescription: `${deal.source}: ${deal.route} ${deal.currency}${deal.price}`,
          totalPrice: deal.price,
          perPersonPrice: deal.price,
          currency: deal.currency,
          segments: [{
            id: `deal-segment-1`,
            origin: { 
              code: fromAirport.code, 
              name: fromAirport.name, 
              city: fromAirport.city, 
              country: fromAirport.country, 
              lat: 0, 
              lng: 0 
            },
            destination: { 
              code: toAirport.code, 
              name: toAirport.name, 
              city: toAirport.city, 
              country: toAirport.country, 
              lat: 0, 
              lng: 0 
            },
            departureTime: `${params.departureDate}T10:00:00`,
            arrivalTime: `${params.departureDate}T14:00:00`,
            airline: "Various",
            airlineName: deal.source,
            flightNumber: "DEAL001",
            duration: "PT4H",
            durationMinutes: 240,
            stops: 0,
            aircraft: "",
            cabinClass: params.travelClass || "ECONOMY",
            bookingClass: "",
          }],
          bookingLinks: [{
            airline: deal.source,
            price: deal.price,
            url: deal.url,
          }],
          savingsVsStandard: 0,
          risks: ["Deal may expire quickly", "Verify dates before booking"],
          _source: "rss-deal",
          _dealUrl: deal.url,
          _publishedAt: deal.publishedAt,
          _howToFind: generateHowToFindText(params.origin, params.destination, deal.source),
        };
      });
      
      allOptions.push(...dealOptions);
    }

    // 2. Generate enhanced split ticket example
    if (params.returnDate) {
      const splitTicketDetails = generateSplitTicketExample(
        params.origin,
        params.destination,
        params.departureDate,
        params.returnDate
      );
      
      allOptions.push({
        id: `split-ticket-${Date.now()}`,
        strategy: "split-ticket-detailed",
        strategyDescription: `Split Ticket: Book ${splitTicketDetails.legs.length} separate one-way tickets`,
        totalPrice: splitTicketDetails.totalPrice,
        perPersonPrice: splitTicketDetails.totalPrice,
        currency: splitTicketDetails.currency,
        segments: splitTicketDetails.legs.map(leg => ({
          id: `split-${leg.leg}`,
          origin: {
            code: leg.departure.airportCode,
            name: leg.departure.airport,
            city: leg.departure.city,
            country: "",
            lat: 0,
            lng: 0
          },
          destination: {
            code: leg.arrival.airportCode,
            name: leg.arrival.airport,
            city: leg.arrival.city,
            country: "",
            lat: 0,
            lng: 0
          },
          departureTime: `${leg.departure.date}T${leg.departure.time}`,
          arrivalTime: `${leg.arrival.date}T${leg.arrival.time}`,
          airline: leg.airlineCode,
          airlineName: leg.airline,
          flightNumber: leg.flightNumber,
          duration: leg.duration,
          durationMinutes: parseDuration(leg.duration),
          stops: leg.stops,
          aircraft: leg.aircraft || "",
          cabinClass: leg.class,
          bookingClass: "",
        })),
        bookingLinks: splitTicketDetails.legs.map(leg => ({
          airline: leg.airline,
          price: leg.price,
          url: leg.bookingUrl
        })),
        savingsVsStandard: splitTicketDetails.savingsVsStandard,
        risks: splitTicketDetails.risks,
        _source: "split-ticket-example",
        _splitTicketDetails: splitTicketDetails,
        _howToFind: "Follow the step-by-step instructions below",
      });
    }

    // 3. Try Amadeus arbitrage for comparison
    if (USE_AMADEUS && USE_ARBITRAGE) {
      try {
        const arbitrageResult = await searchAllStrategies({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults || 1,
          currency: params.currency || "GBP",
        });

        if (arbitrageResult.allOptions && arbitrageResult.allOptions.length > 0) {
          const arbitrageOptions = arbitrageResult.allOptions.map((opt: any) => ({
            ...opt,
            strategy: `amadeus-${opt.strategy}`,
          }));
          allOptions.push(...arbitrageOptions);
        }
      } catch (e) {
        console.log("[Search] Amadeus arbitrage failed");
      }
    }

    // Sort all options by price
    allOptions.sort((a, b) => a.totalPrice - b.totalPrice);

    if (allOptions.length > 0) {
      const bestOption = allOptions[0];
      
      return NextResponse.json({
        standardOption: allOptions.find(o => o.strategy === "rss-deal") || allOptions[0],
        bestOption,
        allOptions,
        optimizedOptions: allOptions.filter(o => o !== bestOption),
        priceRange: {
          min: Math.min(...allOptions.map(o => o.totalPrice)),
          max: Math.max(...allOptions.map(o => o.totalPrice)),
          currency: params.currency || "GBP",
        },
        searchParams: {
          ...params,
          originDisplay: getAirportDisplay(params.origin),
          destinationDisplay: getAirportDisplay(params.destination),
        },
        _dataSource: rssDeals.length > 0 ? "rss-deals" : "generated-examples",
        _realTimeData: rssDeals.length > 0,
      });
    }

    // 4. Final fallback to sample data
    console.log("[Search] Using sample data fallback");
    const sampleResult = generateSampleDataResults(params);
    
    return NextResponse.json({
      ...sampleResult,
      searchParams: {
        ...params,
        originDisplay: getAirportDisplay(params.origin),
        destinationDisplay: getAirportDisplay(params.destination),
      },
      _dataSource: "sample-data",
      _cacheWarning: "Demo data - No real deals found",
    });

  } catch (error: any) {
    console.error("[Search] Error:", error);
    
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

function parseDuration(duration: string): number {
  // Parse "11h 30m" to minutes
  const match = duration.match(/(\d+)h\s*(\d+)m/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/**
 * GET /api/search/test
 * Run acid test to verify Amadeus API works
 */
export async function GET(request: NextRequest) {
  const testResult = await runAcidTest();
  return NextResponse.json(testResult);
}
