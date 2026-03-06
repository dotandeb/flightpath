import Parser from 'rss-parser';
import { Deal } from '@/types';

const rssParser = new Parser();

const RSS_FEEDS = [
  { name: 'Secret Flying', url: 'https://secretflying.com/feed/', region: 'global' },
  { name: 'Fly4Free', url: 'https://www.fly4free.com/feed/', region: 'global' },
  { name: 'Jack\'s Flight Club', url: 'https://jacksflightclub.com/feed', region: 'global' }
];

const STATIC_DEALS: Deal[] = [
  {
    id: 'static-1',
    title: 'London to New York from £299',
    route: 'London → New York',
    from: 'London',
    to: 'New York',
    price: 299,
    originalPrice: 450,
    currency: 'GBP',
    departureDate: 'Mar - May 2025',
    airline: 'British Airways',
    bookingLink: 'https://www.britishairways.com',
    source: 'Deal Database',
    publishedAt: new Date().toISOString(),
    tags: ['error-fare', 'premium-economy'],
    discount: 34
  },
  {
    id: 'static-2',
    title: 'London to Bangkok from £399',
    route: 'London → Bangkok',
    from: 'London',
    to: 'Bangkok',
    price: 399,
    originalPrice: 650,
    currency: 'GBP',
    departureDate: 'Apr - Jun 2025',
    airline: 'Emirates',
    bookingLink: 'https://www.emirates.com',
    source: 'Deal Database',
    publishedAt: new Date().toISOString(),
    tags: ['business-class'],
    discount: 39
  },
  {
    id: 'static-3',
    title: 'London to Dubai from £249',
    route: 'London → Dubai',
    from: 'London',
    to: 'Dubai',
    price: 249,
    originalPrice: 380,
    currency: 'GBP',
    departureDate: 'Various dates',
    airline: 'Qatar Airways',
    bookingLink: 'https://www.qatarairways.com',
    source: 'Deal Database',
    publishedAt: new Date().toISOString(),
    tags: ['error-fare'],
    discount: 34
  },
  {
    id: 'static-4',
    title: 'London to Singapore from £449',
    route: 'London → Singapore',
    from: 'London',
    to: 'Singapore',
    price: 449,
    originalPrice: 720,
    currency: 'GBP',
    departureDate: 'May - Jul 2025',
    airline: 'Singapore Airlines',
    bookingLink: 'https://www.singaporeair.com',
    source: 'Deal Database',
    publishedAt: new Date().toISOString(),
    tags: ['premium-economy'],
    discount: 38
  },
  {
    id: 'static-5',
    title: 'London to Sydney from £699',
    route: 'London → Sydney',
    from: 'London',
    to: 'Sydney',
    price: 699,
    originalPrice: 1100,
    currency: 'GBP',
    departureDate: 'Jun - Aug 2025',
    airline: 'Qantas',
    bookingLink: 'https://www.qantas.com',
    source: 'Deal Database',
    publishedAt: new Date().toISOString(),
    tags: ['round-the-world'],
    discount: 36
  }
];

function parseDealFromItem(item: any, source: string): Deal | null {
  try {
    const title = item.title || '';
    const content = item['content:encoded'] || item.content || item.description || '';
    
    const routePatterns = [
      /([^\-–—→]+)\s*(?:to|→|\-|–|—)\s*([^\(]+)/i,
      /([^\-–—]+)[\-–—]\s*([^\(]+)/i,
      /from\s+(.+?)\s+to\s+(.+?)(?:\s|$)/i
    ];
    
    let from = '', to = '';
    for (const pattern of routePatterns) {
      const match = title.match(pattern);
      if (match) {
        from = match[1].trim();
        to = match[2].trim();
        break;
      }
    }
    
    const priceMatch = title.match(/[£€$](\d+(?:,\d{3})*)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : 0;
    const currency = priceMatch ? (priceMatch[0][0] === '£' ? 'GBP' : priceMatch[0][0] === '€' ? 'EUR' : 'USD') : 'GBP';
    
    const originalPriceMatch = content.match(/(?:was|original|rrp)\s*[£€$]?(\d+(?:,\d{3})*)/i);
    const originalPrice = originalPriceMatch ? parseInt(originalPriceMatch[1].replace(',', '')) : undefined;
    
    const datePatterns = [
      /(\w+\s+\d{1,2}[\w\s]*,?\s+202[4-9])/gi,
      /(\d{1,2}\/\d{1,2}\/202[4-9])/g,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+202[4-9]/gi
    ];
    
    let dates = '';
    for (const pattern of datePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        dates = matches.slice(0, 2).join(' - ');
        break;
      }
    }
    
    const airlines = ['British Airways', 'Virgin Atlantic', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 
                      'Lufthansa', 'KLM', 'Air France', 'United', 'Delta', 'American Airlines', 'Cathay Pacific',
                      'Etihad', 'Turkish Airlines', 'Qantas', 'Japan Airlines', 'ANA'];
    let airline = '';
    for (const a of airlines) {
      if (title.toLowerCase().includes(a.toLowerCase()) || content.toLowerCase().includes(a.toLowerCase())) {
        airline = a;
        break;
      }
    }
    
    const tags: string[] = [];
    if (title.toLowerCase().includes('error') || content.toLowerCase().includes('error')) tags.push('error-fare');
    if (title.toLowerCase().includes('business') || content.toLowerCase().includes('business')) tags.push('business-class');
    if (title.toLowerCase().includes('first') || content.toLowerCase().includes('first class')) tags.push('first-class');
    if (title.toLowerCase().includes('premium') || content.toLowerCase().includes('premium')) tags.push('premium-economy');
    if (title.toLowerCase().includes('round') || content.toLowerCase().includes('round the world')) tags.push('round-the-world');
    
    if (!from || !to || price === 0) return null;
    
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    
    return {
      id: `rss-${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      route: `${from} → ${to}`,
      from,
      to,
      price,
      originalPrice,
      currency,
      departureDate: dates || 'Various dates',
      airline,
      bookingLink: item.link || '',
      source,
      publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      tags: tags.length > 0 ? tags : undefined,
      discount
    };
  } catch (error) {
    return null;
  }
}

export async function fetchRSSDeals(): Promise<Deal[]> {
  const allDeals: Deal[] = [];
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[RSS] Fetching from ${feed.name}...`);
      const feedData = await rssParser.parseURL(feed.url);
      
      if (feedData.items && Array.isArray(feedData.items)) {
        for (const item of feedData.items.slice(0, 15)) {
          const deal = parseDealFromItem(item, feed.name);
          if (deal) allDeals.push(deal);
        }
      }
    } catch (error) {
      console.error(`[RSS] Error fetching from ${feed.name}:`, error);
    }
  }
  
  if (allDeals.length === 0) {
    console.log('[RSS] No deals from RSS, using static database');
    return STATIC_DEALS;
  }
  
  return allDeals.sort((a, b) => a.price - b.price);
}

export async function searchDeals(origin: string, destination: string): Promise<Deal[]> {
  const allDeals = await fetchRSSDeals();
  
  const normalizedOrigin = origin.toLowerCase();
  const normalizedDest = destination.toLowerCase();
  
  return allDeals.filter(deal => {
    const dealFrom = deal.from.toLowerCase();
    const dealTo = deal.to.toLowerCase();
    
    return (
      (dealFrom.includes(normalizedOrigin) || normalizedOrigin.includes(dealFrom)) &&
      (dealTo.includes(normalizedDest) || normalizedDest.includes(dealTo))
    );
  });
}

export function getStaticDeals(): Deal[] {
  return STATIC_DEALS;
}