/**
 * Vercel Edge Function: Get Cached Flight
 * GET /api/cached/:route
 * 
 * Returns cached results for a specific route
 * Route format: LHR-JFK-2024-12-25
 */

import { cache } from '../src/cache/index.js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const routeKey = pathParts[pathParts.length - 1];

    if (!routeKey || routeKey === 'cached') {
      return new Response(
        JSON.stringify({ error: 'Route key required (format: LHR-JFK-2024-12-25)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse route key
    const parts = routeKey.split('-');
    if (parts.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid route format. Use: LHR-JFK-2024-12-25' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = parts[0].toUpperCase();
    const destination = parts[1].toUpperCase();
    const departureDate = parts.slice(2).join('-');

    const cacheKey = cache.generateKey({ origin, destination, departureDate });
    const cached = await cache.get(cacheKey);

    if (!cached) {
      return new Response(
        JSON.stringify({
          error: 'No cached data found',
          route: { origin, destination, departureDate },
          cacheKey,
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        flights: cached,
        route: { origin, destination, departureDate },
        cacheKey,
        timestamp: new Date().toISOString(),
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
