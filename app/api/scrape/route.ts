import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSDeals } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const deals = await fetchRSSDeals();
    
    return NextResponse.json({
      deals,
      count: deals.length,
      scrapedAt: new Date().toISOString(),
      sources: ['Secret Flying', 'Fly4Free', 'Jack\'s Flight Club']
    });
  } catch (error: any) {
    console.error('[API] Error scraping deals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape deals' },
      { status: 500 }
    );
  }
}