# Free Scraper Setup Guide

## Quick Start

### 1. Get Your FREE API Keys

#### Kiwi.com (Tequila) - **REQUIRED, Unlimited Free**
1. Go to https://tequila.kiwi.com/
2. Click "Get API Key"
3. Register with your email
4. API key is emailed instantly
5. **Cost: $0**

#### Amadeus (Optional)
1. Go to https://developers.amadeus.com/
2. Create free account
3. Get API Key + Secret from dashboard
4. **Cost: $0** (test environment)

#### Aviation Stack (Optional)
1. Go to https://aviationstack.com/
2. Sign up for free plan
3. Get API key from dashboard
4. **Limit:** 100 calls/month
5. **Cost: $0**

#### ScrapingBee (Optional Fallback)
1. Go to https://www.scrapingbee.com/
2. Sign up
3. Get 1,000 free credits
4. **Cost: $0** (one-time)

---

## Deploy to Vercel (Free)

### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option B: CLI Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd flightpath-free-scraper
vercel --prod

# Set environment variables
vercel env add KIWI_API_KEY
vercel env add AMADEUS_KEY
vercel env add AMADEUS_SECRET
```

### Option C: GitHub Integration
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard

---

## Environment Variables

Create `.env` file for local testing:

```env
# Required - Get from https://tequila.kiwi.com/
KIWI_API_KEY=your_kiwi_api_key

# Optional - Get from https://developers.amadeus.com/
AMADEUS_KEY=your_amadeus_key
AMADEUS_SECRET=your_amadeus_secret

# Optional - Get from https://aviationstack.com/
AVIATION_STACK_KEY=your_aviation_key

# Optional - Fallback scraping APIs
SCRAPERAPI_KEY=your_scraperapi_key
SCRAPINGBEE_KEY=your_scrapingbee_key
SCRAPINGANT_KEY=your_scrapingant_key

# Optional - Upstash Redis for caching
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---

## Test Locally

```bash
# Install dependencies
npm install

# Run test server
npm run dev

# Test health endpoint
curl http://localhost:3002/api/health

# Test search
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"LHR","destination":"JFK","departureDate":"2025-06-15"}'
```

---

## Free Tier Limits Summary

| Service | Free Tier | Renewal |
|---------|-----------|---------|
| **Kiwi.com** | Unlimited | Forever |
| **Amadeus** | Test env | Forever |
| **Aviation Stack** | 100/mo | Monthly |
| **ScraperAPI** | 1,000/mo | Monthly |
| **ScrapingBee** | 1,000 total | One-time |
| **Vercel** | 1M requests | Monthly |
| **GitHub Actions** | 2,000 min | Monthly |

---

## Cost Calculation

**With just Kiwi.com (minimum setup):**
- API: $0
- Hosting (Vercel): $0
- **Total: $0/month**

**With all APIs (maximum reliability):**
- All APIs: $0
- Hosting (Vercel): $0
- Redis (Upstash): $0
- **Total: $0/month**

---

## Troubleshooting

### "No APIs available" in health check
- You haven't set API keys
- Check environment variables are set
- Restart server after adding keys

### "Kiwi API error"
- Check your API key is valid
- Kiwi requires IATA codes (3 letters)
- Try: LHR, JFK, CDG, DXB, SIN

### Empty search results
- Check API rate limits aren't exceeded
- Try different dates (within 1 year)
- Verify airport codes are correct

### Cache not working
- Redis is optional - falls back to local cache
- Local cache clears on server restart
- Redis persists across restarts

---

## Next Steps

1. ✅ Get Kiwi.com API key (5 minutes)
2. ✅ Deploy to Vercel (5 minutes)
3. ✅ Set environment variables
4. ✅ Test the endpoints
5. ⏭️ Add Amadeus for backup (optional)
6. ⏭️ Set up GitHub Actions for scheduled scraping

---

## API Endpoints

Once deployed, your API will be available at:
```
https://your-app.vercel.app/api/health
https://your-app.vercel.app/api/search
https://your-app.vercel.app/api/sources
```

### Example: Search Flights
```bash
curl -X POST https://your-app.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LHR",
    "destination": "JFK", 
    "departureDate": "2025-06-15",
    "returnDate": "2025-06-22",
    "adults": 1,
    "cabin": "economy"
  }'
```

---

**Total Setup Time: ~15 minutes**
**Total Cost: $0**
