// Real Arbitrage Engine - Actually searches multiple strategies
// Uses Amadeus API with smart caching and rate limiting

import { searchAmadeusFlights, transformAmadeusResults, AmadeusSearchParams } from "./amadeus-api";

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Rate limiting
let apiCallsThisMonth = 0;
const MAX_API_CALLS = 1800; // Leave buffer below 2,000 limit
const RATE_LIMIT_DELAY = 200; // ms between calls to avoid 429 errors

interface ArbitrageResult {
  strategy: string;
  strategyDescription: string;
  totalPrice: number;
  perPersonPrice: number;
  currency: string;
  segments: any[];
  savingsVsStandard: number;
  risks: string[];
  searchDetails: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
  };
}

interface ComprehensiveSearchResult {
  standardOption: any;
  bestOption: any;
  allOptions: any[];
  priceRange: { min: number; max: number; currency: string };
  searchMetadata: {
    totalApiCalls: number;
    strategiesSearched: string[];
    cacheHits: number;
    timestamp: string;
  };
}

/**
 * Main arbitrage search - searches ALL strategies with real API calls
 */
export async function searchAllStrategies(params: AmadeusSearchParams): Promise<ComprehensiveSearchResult> {
  const startTime = Date.now();
  let apiCalls = 0;
  let cacheHits = 0;
  const strategiesSearched: string[] = [];
  
  console.log("[Arbitrage] Starting comprehensive search...");
  console.log(`[Arbitrage] Route: ${params.origin} → ${params.destination}`);
  console.log(`[Arbitrage] Dates: ${params.departureDate}${params.returnDate ? ' / ' + params.returnDate : ''}`);
  
  const allResults: ArbitrageResult[] = [];
  
  // 1. STANDARD SEARCH (baseline)
  console.log("\n[Arbitrage] 1. Searching STANDARD...");
  const standardResult = await searchWithCache(params, "standard");
  if (standardResult) {
    apiCalls += standardResult._apiCalls || 1;
    cacheHits += standardResult._cacheHits || 0;
    allResults.push({
      ...standardResult.bestOption,
      strategy: "standard",
      strategyDescription: "Standard round-trip booking",
      savingsVsStandard: 0,
      risks: [],
    });
    strategiesSearched.push("standard");
  }
  
  const baselinePrice = standardResult?.bestOption?.totalPrice || Infinity;
  
  // 2. SPLIT TICKET SEARCH (if return date provided)
  if (params.returnDate && checkApiBudget(apiCalls, 2)) {
    console.log("\n[Arbitrage] 2. Searching SPLIT TICKET...");
    const splitResult = await searchSplitTicket(params);
    if (splitResult) {
      apiCalls += splitResult._apiCalls || 2;
      const savings = baselinePrice - splitResult.totalPrice;
      if (savings > 0) {
        allResults.push({
          ...splitResult,
          savingsVsStandard: savings,
          risks: [
            "No airline protection if you miss connections",
            "Must collect and re-check baggage between tickets",
            "Separate check-ins required",
          ],
        });
        strategiesSearched.push("split-ticket");
      }
    }
  }
  
  // 3. NEARBY AIRPORTS SEARCH
  if (checkApiBudget(apiCalls, 4)) {
    console.log("\n[Arbitrage] 3. Searching NEARBY AIRPORTS...");
    const nearbyResults = await searchNearbyAirports(params);
    apiCalls += nearbyResults._apiCalls || 0;
    cacheHits += nearbyResults._cacheHits || 0;
    
    for (const result of nearbyResults.options) {
      const savings = baselinePrice - result.totalPrice;
      if (savings > 0) {
        allResults.push({
          ...result,
          savingsVsStandard: savings,
          risks: [
            `Must travel to/from ${result.searchDetails.origin} instead of ${params.origin}`,
            "Factor in ground transportation costs",
            "More complex itinerary",
          ],
        });
      }
    }
    if (nearbyResults.options.length > 0) {
      strategiesSearched.push("nearby-airports");
    }
  }
  
  // 4. FLEXIBLE DATES SEARCH
  if (checkApiBudget(apiCalls, 6)) {
    console.log("\n[Arbitrage] 4. Searching FLEXIBLE DATES...");
    const flexibleResults = await searchFlexibleDates(params);
    apiCalls += flexibleResults._apiCalls || 0;
    cacheHits += flexibleResults._cacheHits || 0;
    
    for (const result of flexibleResults.options) {
      const savings = baselinePrice - result.totalPrice;
      if (savings > 0 && !allResults.find(r => r.strategy === result.strategy)) {
        allResults.push({
          ...result,
          savingsVsStandard: savings,
          risks: [
            "Date change required",
            "May affect accommodation plans",
          ],
        });
      }
    }
    if (flexibleResults.options.length > 0) {
      strategiesSearched.push("flexible-dates");
    }
  }
  
  // Sort all results by price
  allResults.sort((a, b) => a.totalPrice - b.totalPrice);
  
  const bestOption = allResults[0] || standardResult?.bestOption;
  const standardOption = allResults.find(r => r.strategy === "standard") || standardResult?.bestOption;
  
  // Remove best from optimized options
  const optimizedOptions = allResults.filter(r => r !== bestOption);
  
  const result: ComprehensiveSearchResult = {
    standardOption,
    bestOption,
    allOptions: allResults,
    priceRange: {
      min: Math.min(...allResults.map(r => r.totalPrice)),
      max: Math.max(...allResults.map(r => r.totalPrice)),
      currency: bestOption?.currency || "GBP",
    },
    searchMetadata: {
      totalApiCalls: apiCalls,
      strategiesSearched,
      cacheHits,
      timestamp: new Date().toISOString(),
    },
  };
  
  console.log("\n[Arbitrage] Search complete!");
  console.log(`[Arbitrage] API calls used: ${apiCalls}`);
  console.log(`[Arbitrage] Cache hits: ${cacheHits}`);
  console.log(`[Arbitrage] Strategies: ${strategiesSearched.join(", ")}`);
  console.log(`[Arbitrage] Best price: ${result.priceRange.currency} ${result.priceRange.min}`);
  console.log(`[Arbitrage] Savings found: ${result.priceRange.currency} ${standardOption?.totalPrice - bestOption?.totalPrice || 0}`);
  
  return result;
}

/**
 * Search with caching
 */
async function searchWithCache(params: AmadeusSearchParams, strategy: string): Promise<any> {
  const cacheKey = `${strategy}:${params.origin}:${params.destination}:${params.departureDate}:${params.returnDate || 'one-way'}:${params.adults}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] Hit for ${strategy}`);
    return { ...cached.data, _cacheHits: 1, _apiCalls: 0 };
  }
  
  // Check API budget
  if (!checkApiBudget(0, 1)) {
    console.log(`[Arbitrage] API budget exhausted, using cached/simulated data`);
    return null;
  }
  
  // Make API call
  try {
    apiCallsThisMonth++;
    const offers = await searchAmadeusFlights(params);
    
    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    
    const transformed = transformAmadeusResults(offers, params);
    
    // Cache result
    cache.set(cacheKey, { data: transformed, timestamp: Date.now() });
    
    return { ...transformed, _apiCalls: 1, _cacheHits: 0 };
  } catch (error) {
    console.error(`[Arbitrage] Search failed for ${strategy}:`, error);
    return null;
  }
}

/**
 * Check if we have API budget remaining
 */
function checkApiBudget(currentCalls: number, needed: number): boolean {
  return (apiCallsThisMonth + currentCalls + needed) <= MAX_API_CALLS;
}

/**
 * Split ticket search - search outbound and return separately
 */
async function searchSplitTicket(params: AmadeusSearchParams): Promise<any> {
  if (!params.returnDate) return null;
  
  // Search outbound one-way
  const outboundParams = { ...params, returnDate: undefined };
  const outboundResult = await searchWithCache(outboundParams, "split-outbound");
  
  // Search return one-way (reverse origin/destination)
  const returnParams = {
    ...params,
    origin: params.destination,
    destination: params.origin,
    departureDate: params.returnDate,
    returnDate: undefined,
  };
  const returnResult = await searchWithCache(returnParams, "split-return");
  
  if (!outboundResult?.bestOption || !returnResult?.bestOption) {
    return null;
  }
  
  // Combine prices
  const totalPrice = outboundResult.bestOption.totalPrice + returnResult.bestOption.totalPrice;
  
  // Combine segments
  const allSegments = [
    ...outboundResult.bestOption.segments.map((s: any) => ({ ...s, direction: "OUTBOUND" })),
    ...returnResult.bestOption.segments.map((s: any) => ({ ...s, direction: "RETURN" })),
  ];
  
  return {
    strategy: "split-ticket",
    strategyDescription: "Book separate one-way tickets (potentially different airlines)",
    totalPrice,
    perPersonPrice: totalPrice / (params.adults + (params.children || 0)),
    currency: outboundResult.bestOption.currency,
    segments: allSegments,
    bookingLinks: [
      ...outboundResult.bestOption.bookingLinks,
      ...returnResult.bestOption.bookingLinks,
    ],
    searchDetails: {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
    },
    _apiCalls: (outboundResult._apiCalls || 0) + (returnResult._apiCalls || 0),
  };
}

/**
 * Nearby airports search
 */
async function searchNearbyAirports(params: AmadeusSearchParams): Promise<{ options: any[], _apiCalls: number, _cacheHits: number }> {
  const nearbyOrigins = getNearbyAirports(params.origin);
  const nearbyDestinations = getNearbyAirports(params.destination);
  
  const options: any[] = [];
  let apiCalls = 0;
  let cacheHits = 0;
  
  // Search alternative origins
  for (const airport of nearbyOrigins) {
    const altParams = { ...params, origin: airport.code };
    const result = await searchWithCache(altParams, `nearby-origin-${airport.code}`);
    
    if (result?.bestOption) {
      apiCalls += result._apiCalls || 0;
      cacheHits += result._cacheHits || 0;
      
      options.push({
        ...result.bestOption,
        strategy: `nearby-origin-${airport.code}`,
        strategyDescription: `Fly from ${airport.name} (${airport.code}) - save vs ${params.origin}`,
        searchDetails: {
          origin: airport.code,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
        },
      });
    }
  }
  
  // Search alternative destinations
  for (const airport of nearbyDestinations) {
    const altParams = { ...params, destination: airport.code };
    const result = await searchWithCache(altParams, `nearby-dest-${airport.code}`);
    
    if (result?.bestOption) {
      apiCalls += result._apiCalls || 0;
      cacheHits += result._cacheHits || 0;
      
      options.push({
        ...result.bestOption,
        strategy: `nearby-dest-${airport.code}`,
        strategyDescription: `Fly to ${airport.name} (${airport.code}) - save vs ${params.destination}`,
        searchDetails: {
          origin: params.origin,
          destination: airport.code,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
        },
      });
    }
  }
  
  return { options, _apiCalls: apiCalls, _cacheHits: cacheHits };
}

/**
 * Get nearby airports for a given airport
 */
function getNearbyAirports(airportCode: string): Array<{ code: string; name: string; distance: string }> {
  const nearbyMap: Record<string, Array<{ code: string; name: string; distance: string }>> = {
    // London
    "LHR": [
      { code: "LGW", name: "London Gatwick", distance: "45km" },
      { code: "STN", name: "London Stansted", distance: "65km" },
      { code: "LTN", name: "London Luton", distance: "55km" },
    ],
    "LGW": [
      { code: "LHR", name: "London Heathrow", distance: "45km" },
      { code: "STN", name: "London Stansted", distance: "85km" },
    ],
    // Paris
    "CDG": [
      { code: "ORY", name: "Paris Orly", distance: "35km" },
      { code: "BVA", name: "Paris Beauvais", distance: "85km" },
    ],
    // New York
    "JFK": [
      { code: "EWR", name: "Newark", distance: "35km" },
      { code: "LGA", name: "LaGuardia", distance: "20km" },
    ],
    // Amsterdam
    "AMS": [
      { code: "RTM", name: "Rotterdam", distance: "60km" },
      { code: "EIN", name: "Eindhoven", distance: "110km" },
    ],
    // Frankfurt
    "FRA": [
      { code: "HHN", name: "Frankfurt Hahn", distance: "120km" },
      { code: "CGN", name: "Cologne", distance: "150km" },
    ],
    // Dubai
    "DXB": [
      { code: "DWC", name: "Dubai Al Maktoum", distance: "60km" },
      { code: "SHJ", name: "Sharjah", distance: "25km" },
    ],
    // Singapore
    "SIN": [
      { code: "JHB", name: "Johor Bahru", distance: "55km" },
    ],
    // Bangkok
    "BKK": [
      { code: "DMK", name: "Don Mueang", distance: "30km" },
    ],
    // Tokyo
    "NRT": [
      { code: "HND", name: "Haneda", distance: "60km" },
    ],
    "HND": [
      { code: "NRT", name: "Narita", distance: "60km" },
    ],
    // Sydney
    "SYD": [
      { code: "BWU", name: "Bankstown", distance: "25km" },
    ],
    // Los Angeles
    "LAX": [
      { code: "BUR", name: "Burbank", distance: "30km" },
      { code: "LGB", name: "Long Beach", distance: "35km" },
      { code: "SNA", name: "Orange County", distance: "50km" },
    ],
    // San Francisco
    "SFO": [
      { code: "OAK", name: "Oakland", distance: "25km" },
      { code: "SJC", name: "San Jose", distance: "50km" },
    ],
    // Chicago
    "ORD": [
      { code: "MDW", name: "Midway", distance: "25km" },
    ],
    // Miami
    "MIA": [
      { code: "FLL", name: "Fort Lauderdale", distance: "40km" },
    ],
    // Toronto
    "YYZ": [
      { code: "YTZ", name: "Billy Bishop", distance: "25km" },
    ],
    // Vancouver
    "YVR": [
      { code: "YXX", name: "Abbotsford", distance: "65km" },
    ],
    // Hong Kong
    "HKG": [
      { code: "SZX", name: "Shenzhen", distance: "45km" },
      { code: "MFM", name: "Macau", distance: "65km" },
    ],
  };
  
  return nearbyMap[airportCode.toUpperCase()] || [];
}

/**
 * Flexible dates search - check +/- 3 days
 */
async function searchFlexibleDates(params: AmadeusSearchParams): Promise<{ options: any[], _apiCalls: number, _cacheHits: number }> {
  const options: any[] = [];
  let apiCalls = 0;
  let cacheHits = 0;
  
  // Check +/- 3 days for departure
  for (const offset of [-3, -2, -1, 1, 2, 3]) {
    const altDate = addDays(params.departureDate, offset);
    const altParams = { ...params, departureDate: altDate };
    
    const result = await searchWithCache(altParams, `flex-dep-${offset}`);
    
    if (result?.bestOption) {
      apiCalls += result._apiCalls || 0;
      cacheHits += result._cacheHits || 0;
      
      const dayLabel = offset > 0 ? `+${offset}` : `${offset}`;
      options.push({
        ...result.bestOption,
        strategy: `flexible-departure-${offset}`,
        strategyDescription: `Depart ${offset > 0 ? offset + ' days later' : Math.abs(offset) + ' days earlier'} (${altDate})`,
        searchDetails: {
          origin: params.origin,
          destination: params.destination,
          departureDate: altDate,
          returnDate: params.returnDate,
        },
      });
    }
  }
  
  // If return date provided, check +/- 2 days for return
  if (params.returnDate && checkApiBudget(apiCalls, 4)) {
    for (const offset of [-2, -1, 1, 2]) {
      const altDate = addDays(params.returnDate, offset);
      const altParams = { ...params, returnDate: altDate };
      
      const result = await searchWithCache(altParams, `flex-ret-${offset}`);
      
      if (result?.bestOption) {
        apiCalls += result._apiCalls || 0;
        cacheHits += result._cacheHits || 0;
        
        options.push({
          ...result.bestOption,
          strategy: `flexible-return-${offset}`,
          strategyDescription: `Return ${offset > 0 ? offset + ' days later' : Math.abs(offset) + ' days earlier'} (${altDate})`,
          searchDetails: {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: altDate,
          },
        });
      }
    }
  }
  
  return { options, _apiCalls: apiCalls, _cacheHits: cacheHits };
}

/**
 * Add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get API usage stats
 */
export function getApiUsageStats(): { used: number; remaining: number; max: number } {
  return {
    used: apiCallsThisMonth,
    remaining: MAX_API_CALLS - apiCallsThisMonth,
    max: MAX_API_CALLS,
  };
}

/**
 * Clear cache (for testing)
 */
export function clearArbitrageCache(): void {
  cache.clear();
  console.log("[Arbitrage] Cache cleared");
}
