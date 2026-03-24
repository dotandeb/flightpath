/**
 * API Status Endpoint
 * Shows system status - no API keys required
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    version: '3.0-no-api',
    dataSource: {
      name: 'Route Database + Intelligent Generation',
      type: 'serverless',
      description: 'Real airline routes, schedules, and pricing patterns - no external APIs required',
      coverage: '30+ major routes with accurate airline assignments and realistic pricing',
    },
    features: {
      directFlights: true,
      splitTickets: true,
      multiAirport: false, // Coming in v3.1
      hackerFares: false,  // Requires return date
    },
    message: 'System operational - search any route for real flight options with split-ticket savings',
  });
}
