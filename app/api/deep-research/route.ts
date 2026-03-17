import { NextRequest, NextResponse } from 'next/server';
import { 
  deepResearch, 
  multiCitySearch, 
  flexibleDateSearch, 
  closeBrowser,
  MAJOR_AIRPORTS,
  HUBS 
} from '@/lib/deep-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for hobby plan

// Deep research endpoint - comprehensive search across many routes
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('mode') || 'research'; // 'research', 'multicity', 'flexible'
  const departureDate = searchParams.get('departureDate') || '';
  
  console.log(`[DeepResearch API] Mode: ${mode}`);
  
  try {
    // Mode 1: Deep Research (comprehensive route search)
    if (mode === 'research') {
      const originRegion = (searchParams.get('originRegion') || 'europe') as keyof typeof MAJOR_AIRPORTS;
      const destinationRegion = (searchParams.get('destinationRegion') || 'asia') as keyof typeof MAJOR_AIRPORTS;
      const maxRoutes = parseInt(searchParams.get('maxRoutes') || '20');
      
      if (!departureDate) {
        return NextResponse.json({ error: 'departureDate required' }, { status: 400 });
      }
      
      console.log(`[DeepResearch] ${originRegion} → ${destinationRegion}, max ${maxRoutes} routes`);
      
      const results = await deepResearch(originRegion, destinationRegion, departureDate, {
        maxRoutes,
        includeSplitTickets: true,
        errorFareThreshold: 35
      });
      
      return NextResponse.json({
        mode: 'deep_research',
        results,
        airports: {
          originRegion,
          destinationRegion,
          originAirports: MAJOR_AIRPORTS[originRegion] || MAJOR_AIRPORTS.europe,
          destinationAirports: MAJOR_AIRPORTS[destinationRegion] || MAJOR_AIRPORTS.asia,
          hubs: HUBS.global
        },
        meta: {
          searchTime: results.searchStats.searchTime,
          routesSearched: results.searchStats.routesSearched,
          totalResults: results.searchStats.totalResults,
          cheapestFlight: results.cheapestFlights[0] || null,
          bestErrorFare: results.errorFares[0] || null,
          bestSplitTicket: results.splitTicketOpportunities[0] || null
        }
      });
    }
    
    // Mode 2: Multi-city search
    if (mode === 'multicity') {
      const segmentsParam = searchParams.get('segments');
      if (!segmentsParam) {
        return NextResponse.json({ error: 'segments parameter required (JSON array)' }, { status: 400 });
      }
      
      const segments = JSON.parse(segmentsParam);
      console.log(`[MultiCity] ${segments.length} segments`);
      
      const results = await multiCitySearch(segments);
      const totalPrice = results.reduce((sum, r) => sum + r.price, 0);
      
      return NextResponse.json({
        mode: 'multi_city',
        segments: results,
        totalPrice,
        currency: 'GBP',
        meta: {
          segmentCount: segments.length,
          completedSegments: results.length
        }
      });
    }
    
    // Mode 3: Flexible date search
    if (mode === 'flexible') {
      const origin = searchParams.get('origin')?.toUpperCase() || '';
      const destination = searchParams.get('destination')?.toUpperCase() || '';
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      
      if (!origin || !destination || !startDate || !endDate) {
        return NextResponse.json({ 
          error: 'origin, destination, startDate, endDate required' 
        }, { status: 400 });
      }
      
      console.log(`[Flexible] ${origin} → ${destination}, ${startDate} to ${endDate}`);
      
      const results = await flexibleDateSearch(origin, destination, startDate, endDate);
      
      return NextResponse.json({
        mode: 'flexible_dates',
        route: `${origin} → ${destination}`,
        pricesByDate: results,
        bestDate: results[0] || null,
        meta: {
          datesChecked: results.length,
          priceRange: results.length > 0 ? {
            min: Math.min(...results.map(r => r.price)),
            max: Math.max(...results.map(r => r.price))
          } : null
        }
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid mode. Use: research, multicity, flexible',
      availableModes: {
        research: 'Comprehensive search across many routes',
        multicity: 'Multi-city trip planning',
        flexible: 'Find cheapest dates in a range'
      }
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('[DeepResearch API] Error:', error);
    return NextResponse.json(
      { error: 'Deep research failed', message: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint for complex searches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, params } = body;
    
    if (mode === 'research') {
      const results = await deepResearch(
        params.originRegion,
        params.destinationRegion,
        params.departureDate,
        {
          maxRoutes: params.maxRoutes || 20,
          includeSplitTickets: params.includeSplitTickets !== false,
          errorFareThreshold: params.errorFareThreshold || 35
        }
      );
      
      return NextResponse.json({ mode: 'deep_research', results });
    }
    
    if (mode === 'multicity') {
      const results = await multiCitySearch(params.segments);
      return NextResponse.json({ mode: 'multi_city', segments: results });
    }
    
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    
  } catch (error: any) {
    console.error('[DeepResearch API] POST Error:', error);
    return NextResponse.json(
      { error: 'Request failed', message: error.message },
      { status: 500 }
    );
  }
}
