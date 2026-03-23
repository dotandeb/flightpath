/**
 * Vercel Edge Function: Search Flights (FREE VERSION)
 * POST /api/search
 * 
 * Uses only free data sources:
 * 1. GitHub Actions scraped data
 * 2. Amadeus free tier (optional)
 * 3. Local cache
 */

import { searchFree, SearchParams } from '../src/apis/free-orchestrator.js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const params: SearchParams = {
      origin: body.origin?.toUpperCase(),
      destination: body.destination?.toUpperCase(),
      departureDate: body.departureDate,
      returnDate: body.returnDate,
      adults: body.adults || 1,
      cabin: body.cabin || 'economy',
    };

    if (!params.origin || !params.destination || !params.departureDate) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: origin, destination, departureDate' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Vercel] Search: ${params.origin} → ${params.destination}`);

    const result = await searchFree(params);

    return new Response(
      JSON.stringify({
        ...result,
        free_mode: true,
        timestamp: new Date().toISOString(),
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Vercel] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date().toISOString(),
        flights: [],
        sources: [],
        totalResults: 0,
      }, null, 2),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
