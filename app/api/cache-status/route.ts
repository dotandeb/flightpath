import { NextResponse } from 'next/server';
import { flightCache } from '@/lib/flight-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = flightCache.getStats();
  const routes = flightCache.getRoutes();
  
  return NextResponse.json({
    status: 'ok',
    cache: {
      stats,
      routes,
      routeCount: routes.length,
    },
    timestamp: new Date().toISOString(),
  });
}
