# FlightPath 100% FREE Scraper

**Zero cost. No paid APIs. Real flight data.**

## Architecture (All Free)

```
┌─────────────────────────────────────────────────────────────────┐
│                    100% FREE STACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Data Sources                                                │
│  ├── GitHub Actions (2,000 min/mo FREE)                         │
│  │   └── Runs Playwright scraper every 6 hours                  │
│  │   └── Scrapes Google Flights, Skyscanner                     │
│  │   └── Stores results in data/ directory                      │
│  │                                                              │
│  ├── Amadeus API (FREE test environment)                        │
│  │   └── Optional real-time fallback                            │
│  │   └── Register free at developers.amadeus.com                │
│  │                                                              │
│  └── Local Cache                                                │
│      └── Reduces repeated requests                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🚀 Hosting                                                     │
│  ├── Vercel Edge Functions (1M requests/mo FREE)                │
│  └── Serves scraped data via REST API                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💰 COST: $0/month                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

1. **GitHub Actions** runs the scraper every 6 hours (FREE)
   - Uses Playwright to scrape Google Flights
   - Saves results to `data/` directory
   - Pushes data to `data` branch

2. **Vercel** serves the data via API (FREE)
   - Reads from `data/` directory
   - Serves cached results instantly
   - Falls back to Amadeus free tier if available

3. **Your App** queries the API
   - Gets real scraped flight prices
   - Zero latency (pre-scraped data)
   - Completely free

## Quick Start

### 1. Fork & Deploy

```bash
# Fork this repo to your GitHub account
# Then deploy to Vercel:
npx vercel --prod
```

### 2. Enable GitHub Actions

1. Go to your forked repo on GitHub
2. Click **Actions** tab
3. Click "I understand my workflows, go ahead and enable them"

The scraper will run automatically every 6 hours.

### 3. Test the API

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Search flights (reads from scraped data)
curl -X POST https://your-app.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"LHR","destination":"JFK","departureDate":"2025-06-15"}'
```

### 4. Optional: Add Amadeus for Real-Time

For real-time searches (not pre-scraped):

1. Register free at https://developers.amadeus.com/
2. Add to Vercel environment variables:
   - `AMADEUS_KEY`
   - `AMADEUS_SECRET`

## Available Routes

By default, these routes are scraped every 6 hours:

- LHR ↔ JFK (London ↔ New York)
- LAX ↔ LHR (Los Angeles ↔ London)
- LHR ↔ DXB (London ↔ Dubai)
- LHR ↔ CDG (London ↔ Paris)
- CDG ↔ JFK (Paris ↔ New York)
- DXB ↔ LHR (Dubai ↔ London)
- SIN ↔ LHR (Singapore ↔ London)

**To add more routes**, edit `.github/workflows/scraper.yml`:

```yaml
matrix:
  route:
    - { origin: 'YOUR', destination: 'CODE', date: '2025-06-15' }
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Search Flights
```bash
POST /api/search
Content-Type: application/json

{
  "origin": "LHR",
  "destination": "JFK",
  "departureDate": "2025-06-15",
  "returnDate": "2025-06-22",
  "adults": 1,
  "cabin": "economy"
}
```

### List Available Sources
```bash
GET /api/sources
```

### List Scraped Routes
```bash
GET /api/data-status
```

## Response Format

```json
{
  "flights": [
    {
      "id": "gg-0",
      "price": 450,
      "currency": "GBP",
      "airline": "British Airways",
      "flightNumber": "BA178",
      "origin": "LHR",
      "destination": "JFK",
      "departure": "2025-06-15T10:30:00",
      "arrival": "2025-06-15T13:45:00",
      "duration": "8h 15m",
      "stops": 0,
      "source": "github-actions",
      "scrapedAt": "2025-03-23T12:00:00Z"
    }
  ],
  "sources": ["github-actions"],
  "totalResults": 1,
  "cached": false,
  "free_mode": true
}
```

## Manual Scrape

To scrape a specific route on demand:

```bash
# Using GitHub Actions (recommended)
1. Go to GitHub repo → Actions → "Scheduled Flight Scraper"
2. Click "Run workflow"
3. Enter origin, destination, date
4. Click "Run workflow"

# Results will be saved to data/ directory
```

## Local Development

```bash
npm install
npm run dev

# Test health
curl http://localhost:3002/api/health

# Test search
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"LHR","destination":"JFK","departureDate":"2025-06-15"}'
```

## Integration with FlightPath

```typescript
// In your FlightPath app
const response = await fetch('https://your-scraper.vercel.app/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: 'LHR',
    destination: 'JFK',
    departureDate: '2025-06-15',
  }),
});

const data = await response.json();
// data.flights contains real scraped prices
```

## Free Tier Limits

| Service | Free Tier | This Project Uses |
|---------|-----------|-------------------|
| GitHub Actions | 2,000 min/mo | ~200 min/mo (10 routes × 4 runs/day × 5 min) |
| Vercel | 1M requests/mo | ~10K/mo (estimated) |
| Amadeus | Test env | Optional fallback |
| **Total Cost** | | **$0/month** |

## Troubleshooting

### "No data available for this route"
- The route hasn't been scraped yet
- Either:
  1. Wait for next scheduled run (every 6h)
  2. Run manual scrape via GitHub Actions
  3. Add route to `.github/workflows/scraper.yml`

### "Amadeus not available"
- Amadeus is optional
- Add keys to get real-time results
- Without it, only pre-scraped data is available

### Data is stale
- Scraped data older than 24h is marked stale
- Still returned but flagged
- Trigger new scrape via GitHub Actions

## Cost Breakdown

| Component | Provider | Monthly Cost |
|-----------|----------|--------------|
| Scraping | GitHub Actions | **$0** |
| Hosting | Vercel | **$0** |
| Real-time API | Amadeus (test) | **$0** |
| Cache | Local/Vercel KV | **$0** |
| **TOTAL** | | **$0** |

## Files Overview

```
flightpath-free-scraper/
├── .github/workflows/
│   ├── scraper.yml          # GitHub Actions scraper (FREE)
│   └── test-and-deploy.yml  # CI/CD
├── api/
│   ├── health.ts            # Health check
│   ├── search.ts            # Search endpoint
│   └── cached/
│       └── [route].ts       # Get cached route
├── src/
│   ├── apis/
│   │   ├── free-orchestrator.ts   # Main search logic
│   │   ├── amadeus.ts             # Amadeus free tier
│   │   └── ...
│   ├── scrapers/
│   │   └── github-actions-scraper.ts  # Playwright scraper
│   ├── cache/
│   │   └── index.ts         # Caching layer
│   └── test-server.ts       # Local dev server
└── data/                    # Scraped data storage
    └── LHR-JFK-2025-06-15.json
```

## Credits

- **Data**: Scraped from Google Flights via Playwright
- **Hosting**: Vercel Edge Functions
- **CI/CD**: GitHub Actions
- **Cost**: $0

---

**Built for FlightPath.solutions | Zero Cost | Real Data**
