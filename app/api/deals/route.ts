import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSDeals, searchDeals } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  
  try {
    let deals;
    
    if (origin && destination) {
      deals = await searchDeals(origin, destination);
    } else {
      deals = await fetchRSSDeals();
    }
    
    return NextResponse.json({
      deals,
      count: deals.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error fetching deals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}