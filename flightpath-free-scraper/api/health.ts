/**
 * Vercel Edge Function: Health Check (FREE VERSION)
 * GET /api/health
 */

import { getFreeSourcesStatus } from '../src/apis/free-orchestrator.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const sources = getFreeSourcesStatus();

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0-free',
      mode: '100% FREE - No paid APIs required',
      cost: '$0/month',
      sources,
      env: {
        has_amadeus: !!(process.env.AMADEUS_KEY && process.env.AMADEUS_SECRET),
        node_env: process.env.NODE_ENV || 'development',
      },
      how_it_works: {
        step1: 'GitHub Actions runs scraper every 6 hours (FREE tier)',
        step2: 'Data stored in repo/data/ directory',
        step3: 'Vercel serves data via API (FREE tier)',
        step4: 'Optional: Amadeus free tier for real-time',
        cost: 'GitHub Actions (2,000 min/mo) + Vercel (1M requests/mo) = $0',
      },
    }, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
