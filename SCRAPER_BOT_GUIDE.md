# FlightPath Scraper Bot - Setup Guide

## What Was Built

A **real-time flight price scraper** that:
1. Scrapes Google Flights for actual prices (not mock data)
2. Searches multiple hub airports for split ticket combinations
3. Calculates real savings vs direct flights
4. Falls back to Skyscanner if Google blocks the request

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Search   │────▶│  Next.js API     │────▶│  Scraper Bot    │
│   (Frontend)    │     │  /api/scrape-v2  │     │  (Playwright)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                           │
                              ▼                           ▼
                        ┌──────────┐              ┌──────────────┐
                        │  Results │◀─────────────│ Google Flights│
                        │  (JSON)  │              │  (Real Data) │
                        └──────────┘              └──────────────┘
```

## Files Created/Modified

### New Files:
- `lib/scraper-v2.ts` - Improved scraper with stealth techniques
- `app/api/scrape-v2/route.ts` - API endpoint for the new scraper
- `test-scraper.ts` - Test script

### Modified:
- `app/page.tsx` - Added "Deep Search" button + results display

## How It Works

1. **Deep Search Button**: User clicks → triggers `/api/scrape-v2`
2. **Google Flights Scraping**: Playwright opens Google Flights, extracts prices
3. **Split Ticket Algorithm**: Searches via hubs (DXB, DOH, IST, AMS, CDG, FRA, SIN)
4. **Price Comparison**: Combines legs, calculates savings vs direct
5. **Fallback**: If Google blocks, tries Skyscanner

## Key Features

### 1. Anti-Detection (Stealth)
- Realistic user agent (Chrome on Mac)
- Proper viewport and locale settings
- Random delays between requests
- Cookie consent handling

### 2. Price Extraction
```typescript
// Extracts prices from page text using regex
const priceMatches = [...bodyText.matchAll(/£([\d,]+)/g)];
```

### 3. Split Ticket Algorithm
```
LHR → JFK direct: £800

LHR → DXB → JFK (split):
  LHR → DXB: £400
  DXB → JFK: £250
  Total: £650
  Savings: £150
```

## Running Locally

```bash
cd flightpath

# Install Playwright browsers
npx playwright install chromium

# Run dev server
npm run dev

# In another terminal, test the scraper:
curl "http://localhost:3000/api/scrape-v2?origin=LHR&destination=JFK&departureDate=2025-04-15&includeSplit=true"
```

## Deployment Options

### Option 1: VPS/Server (Recommended for POC)
Deploy on any server with:
- Node.js 18+
- Playwright browsers installed
- 2GB+ RAM
- No execution timeout

```bash
# On server
git clone https://github.com/dotandeb/flightpath.git
cd flightpath
npm install
npx playwright install chromium
npm run build
npm start
```

### Option 2: Keep Vercel + Add VPS Endpoint
- Frontend on Vercel (fast, free)
- Scraper on VPS (real data)
- Update `page.tsx` to call VPS endpoint

### Option 3: Browserless.io
Use cloud browser service (~$30/month) - works on Vercel but costs money.

## Limitations

1. **Speed**: Takes 1-2 minutes (scraping 5+ pages sequentially)
2. **Blocking**: Google may block IPs that scrape too much
3. **Rate Limits**: Should add delays between user requests
4. **ToS**: Against Google's ToS (use for POC only)

## Next Steps for Production

1. **Add caching**: Redis/Memcached to store prices for 1-6 hours
2. **Queue system**: Bull/Redis queue for search jobs
3. **Rate limiting**: Max 1 search per IP per 5 minutes
4. **Proxy rotation**: Residential proxies to avoid blocks
5. **Paid API**: Migrate to Kiwi API ($0.003/search) for production

## Testing

```bash
# Test direct flight search
curl "http://localhost:3000/api/scrape-v2?origin=LHR&destination=JFK&departureDate=2025-04-15"

# Test with split tickets
curl "http://localhost:3000/api/scrape-v2?origin=LHR&destination=BKK&departureDate=2025-04-15&includeSplit=true"

# Test return flight
curl "http://localhost:3000/api/scrape-v2?origin=LHR&destination=JFK&departureDate=2025-04-15&returnDate=2025-04-22&includeSplit=true"
```

## Troubleshooting

### No prices found:
- Check screenshot: `/tmp/scraper-*.png`
- Google may have changed layout
- Try Skyscanner fallback

### Browser crashes:
- Ensure Playwright browsers installed: `npx playwright install chromium`
- Check RAM: Needs 2GB+ for Chromium

### Blocked by Google:
- Add delays between requests
- Use proxy/VPN
- Try different user agents
