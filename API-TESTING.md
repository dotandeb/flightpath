# Cheapest Flight APIs for Testing - Acid Test Options

## 1. Amadeus Self-Service API (FREE) ⭐ RECOMMENDED
**Cost:** FREE tier - 2,000 API calls/month  
**Signup:** https://developers.amadeus.com  
**Best for:** Real-time testing, no credit card required

### What you get:
- Flight Search (2,000 calls/month free)
- Real prices from airlines
- No caching issues
- Professional-grade data

### Limitations:
- Rate limited (free tier)
- Need to attribute "Powered by Amadeus"
- Production requires paid tier at scale

### Setup:
```bash
AMADEUS_API_KEY=your_key
AMADEUS_API_SECRET=your_secret
```

---

## 2. Travelpayouts Data API (FREE with account)
**Cost:** FREE  
**Signup:** Already have account (Partner 705007)  
**Best for:** Affiliate revenue, cached data

### What you get:
- Cached prices (48h delay)
- Affiliate commission (1.6-2.4%)
- No call limits
- Immediate access

### Already configured in your project!
Just need to add token to `.env.local`

---

## 3. Kiwi.com API (FREE tier)
**Cost:** FREE - 100 calls/day  
**Signup:** https://tequila.kiwi.com  
**Best for:** Alternative data source

### What you get:
- Real-time search
- Baggage info included
- Multi-city support

---

## 4. Cirium (Formerly FlightStats)
**Cost:** FREE trial, then paid  
**Best for:** Schedule data, not prices

---

## ACID TEST RECOMMENDATION

### For Immediate Test (Today):
Use **Amadeus FREE tier** - you already have credentials!

Your `.env.local` already has:
```
AMADEUS_API_KEY=fZFTI63Dm6grAZEcRbG0Afdy56hGJqgP
AMADEUS_API_SECRET=TgGHyeARX63RIxnQ
```

Let me wire this up for a real acid test.

---

## Cost Comparison for Production

| API | Free Tier | Paid Tier | Best For |
|-----|-----------|-----------|----------|
| Amadeus | 2,000/mo | ~€0.005/call | Real-time, accuracy |
| Travelpayouts | Unlimited | FREE | Affiliate revenue |
| Kiwi.com | 100/day | ~€0.003/call | Budget flights |
| Skyscanner | N/A | Partnership only | Scale |

---

## The Acid Test Plan

1. **Wire up Amadeus** (you have credentials)
2. **Test real search** LHR → BKK
3. **Compare with sample data**
4. **Verify affiliate links work**
5. **Document results for thesis**

Total cost: £0  
Time: 30 minutes  
Result: Proof it works with real data
