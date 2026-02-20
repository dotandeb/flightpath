# Travelpayouts Data API Setup Guide

## Partner ID: 705007

---

## ✅ GOOD NEWS: Data API Works Immediately!

Unlike the Search API (which requires 50k MAU), the **Data API** has:
- ❌ No MAU requirement
- ❌ No approval needed
- ✅ Immediate access with your token
- ✅ Affiliate commission works
- ✅ Sufficient for thesis/demo

**Trade-off:** Prices are cached ~48 hours (not real-time)

---

## Step 1: Get Your API Token

1. Go to: https://www.travelpayouts.com/programs/100/tools/api
2. Log in with your partner account (ID: 705007)
3. Copy your **"Data Access API Token"**

---

## Step 2: Configure Environment

Edit `.env.local`:

```bash
# Add your token
TRAVELPAYOUTS_TOKEN=your_token_here

# Set to false to use real API
USE_SAMPLE_DATA=false
```

---

## Step 3: Deploy

```bash
vercel --prod
```

---

## API Endpoints Used

| Endpoint | Purpose | Data Freshness |
|----------|---------|----------------|
| `/v1/prices/cheap` | Cheapest flights | ~48h cached |
| `/v2/prices/nearest-places-matrix` | Nearby airports | ~48h cached |
| `/v1/prices/calendar` | Flexible dates | ~48h cached |

---

## Affiliate Links

Booking links use your marker (705007) and redirect to:
- Aviasales/Skyscanner search results
- Google Flights (reference)
- Direct airline sites

**Commission:** 1.6-2.4% per booking

---

## For Your Thesis

### What Works:
- ✅ Price comparison across strategies
- ✅ Split-ticket arbitrage logic
- ✅ Nearby airport suggestions
- ✅ Affiliate revenue model
- ✅ Working booking flow

### Limitations to Mention:
- ⚠️ Data cached ~48 hours (not real-time)
- ⚠️ For production: would upgrade to Search API at 50k MAU
- ⚠️ Prices shown are indicative; final price at checkout

### This is NORMAL:
Most flight comparison sites start with cached data. Real-time APIs are expensive and have high barriers.

---

## Future Upgrade Path

When you hit 50k MAU:
1. Email support@travelpayouts.com
2. Request Search API access
3. Update code to use real-time endpoints
4. Keep Data API as fallback

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid token" | Check token at travelpayouts.com |
| No results | Try different dates (future dates work better) |
| Prices seem old | Expected - data is cached |
| CORS errors | API calls are server-side (correct) |

---

## Support

- Travelpayouts: support@travelpayouts.com
- Partner ID: 705007
