# FlightPath Scraper Setup

## Problem: Vercel Limitations

Vercel's free tier has constraints that prevent the Playwright scraper from working:
- **Max execution time**: 60 seconds (scraper needs 90-120s)
- **No browser binaries**: Serverless functions can't run Chromium

## Solutions

### Option 1: Self-Host on VPS (Recommended for POC)

Deploy on a VPS (DigitalOcean, Hetzner, etc.) where you have full control:

```bash
# On your server
git clone https://github.com/dotandeb/flightpath.git
cd flightpath
npm install
npx playwright install chromium
npm run build
npm start
```

The scraper will work fully with 1-2 minute searches.

---

### Option 2: Use Browserless.io (Cloud Browser)

Sign up at https://browserless.io (free tier: 1,000 requests/month)

Update `lib/scraper.ts`:
```typescript
const browser = await chromium.connect(
  'wss://chrome.browserless.io?token=YOUR_TOKEN'
);
```

This runs the browser in the cloud, works on Vercel.

---

### Option 3: Keep Current Hybrid Approach

The code now includes both:
1. **Amadeus API** (fast, works on Vercel, limited routes)
2. **Scraper** (slow, needs VPS, all routes)

Fallback logic: Try Amadeus first → if no results, show message to use scraper mode.

---

### Option 4: Serverless-Compatible Scraper

Use an external scraping service:
- **ScrapingBee**: $49/month, handles browsers
- **ScrapingAnt**: $19/month
- **Bright Data**: Pay per use

---

## Current Implementation

The scraper is ready and will work when deployed on a server with:
- Node.js 18+
- Playwright browsers installed
- 2+ GB RAM
- No execution timeout

## Quick Test Locally

```bash
cd flightpath
npm install
npx playwright install chromium
npm run dev

# In another terminal, test the scraper:
curl "http://localhost:3000/api/scrape-flights?origin=LHR&destination=JFK&departureDate=2026-04-15&passengers=1&travelClass=ECONOMY&includeSplit=true"
```

This will take 1-2 minutes but return real prices from Google Flights.

---

## Recommendation for POC

1. **Keep Vercel deployment** for the landing page + basic Amadeus search
2. **Add a "Deep Search" button** that calls your VPS endpoint
3. **Run scraper on VPS** for users who want real split-ticket prices

This gives you:
- Fast, free basic search (Vercel + Amadeus)
- Real prices on demand (VPS scraper)
- Proof of concept without $500/month enterprise APIs
