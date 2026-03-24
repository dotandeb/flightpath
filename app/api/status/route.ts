/**
 * API Status Endpoint
 * Shows which data sources are configured and available
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = {
    kiwi: {
      name: 'Kiwi.com (Tequila)',
      available: !!process.env.KIWI_API_KEY,
      description: 'Free tier: Unlimited searches with API key',
      signupUrl: 'https://tequila.kiwi.com/portal/docs/tequila_api',
    },
    amadeus: {
      name: 'Amadeus',
      available: !!(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET),
      description: 'Production flight data API',
      signupUrl: 'https://developers.amadeus.com/',
    },
    skyscanner: {
      name: 'Skyscanner',
      available: !!process.env.SKYSCANNER_API_KEY,
      description: 'Meta-search API',
      signupUrl: 'https://partners.skyscanner.net/',
    },
  };

  const availableSources = Object.entries(sources)
    .filter(([, v]) => v.available)
    .map(([k]) => k);

  return NextResponse.json({
    status: availableSources.length > 0 ? 'ready' : 'limited',
    sources,
    availableCount: availableSources.length,
    message: availableSources.length === 0 
      ? 'Add KIWI_API_KEY to enable real flight data' 
      : `Active sources: ${availableSources.join(', ')}`,
  });
}
