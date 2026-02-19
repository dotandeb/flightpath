# FlightPath - Smart Flight Search
## Deployment Package

---

## What's New (The Smart Stuff)

Unlike Skyscanner/Kayak, FlightPath now searches **6 different strategies** to find you the best deal:

### 1. Standard Return Flight
Baseline comparison - what you'd find on any other site.

### 2. Split Ticketing ⭐
Books outbound and return as **separate one-way tickets**, often with different airlines. This exploits pricing differences where budget carriers have cheap one-ways but expensive returns.

**Example:** BA return LHR-JFK = £800
- EasyJet one-way LHR-JFK = £280
- Norwegian one-way JFK-LHR = £240
- **Total: £520 (save £280)**

### 3. Nearby Origin Airports ⭐
Checks airports near your departure city. London has 5 airports - sometimes Gatwick is £100+ cheaper than Heathrow.

**Example:** LHR-CDG = £150, LGW-CDG = £85

### 4. Nearby Destination Airports ⭐
Same idea for arrival. Flying to Beauvais instead of CDG can save £50+.

### 5. Flexible Dates ⭐
Searches ±3 days from your selected dates. Tuesday flights are often £30-100 cheaper than Fridays.

### 6. Open-Jaw / Multi-City ⭐
Fly into one city, out of another. Great for road trips or when nearby airports have big price differences.

**Example:** LHR-CDG, then BVA-LHR (instead of CDG-LHR)

---

## How It Works

1. User searches LHR → JFK, June 15-22
2. We call Amadeus API **10-15 times** in parallel:
   - Standard return
   - Separate one-ways (outbound + return)
   - Nearby origins (LGW, STN, LTN)
   - Nearby destinations (EWR, LGA)
   - Flexible dates (±3 days)
   - Open-jaw combinations
3. We rank all results by total price
4. Show the best deal + all alternatives with savings

---

## Deployment Instructions

### Step 1: Upload to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository" → "Upload"
4. Upload `flightpath-deploy.tar.gz`
5. Select "Next.js" as framework
6. Click "Deploy"

### Step 2: Add Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```
AMADEUS_API_KEY = fZFTI63Dm6grAZEcRbG0Afdy56hGJqgP
AMADEUS_API_SECRET = TgGHyeARX63RIxnQ
NEXT_PUBLIC_APP_URL = https://flightpath.solutions
```

Click "Save" and redeploy.

### Step 3: Add Custom Domain

1. In Vercel dashboard → Project → Domains
2. Add `flightpath.solutions`
3. Follow DNS instructions (add CNAME record)
4. Wait 5-30 minutes for propagation

### Step 4: Test

Visit https://flightpath.solutions and search:
- Origin: LHR
- Destination: JFK
- Dates: Any future dates

You should see multiple options with different strategies and savings.

---

## File Structure

```
flightpath/
├── app/
│   ├── api/search/route.ts      # API endpoint
│   ├── components/
│   │   ├── SearchForm.tsx       # Search UI
│   │   └── ResultsList.tsx      # Results display
│   ├── lib/
│   │   └── flight-api.ts        # Smart search logic
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Styles
├── types/
│   └── amadeus.d.ts             # Type definitions
├── .env.local                   # API keys (not in deploy)
├── next.config.ts               # Next.js config
├── package.json                 # Dependencies
└── DEPLOY.md                    # This file
```

---

## API Usage

Each search makes 10-15 API calls to Amadeus:
- Free tier: 2,000 calls/month
- Estimated: ~150-200 user searches/month

If you hit limits, upgrade to paid tier (~€0.002 per call).

---

## What's Next (After Launch)

1. **Price alerts** - Monitor routes and notify when prices drop
2. **User accounts** - Save searches, track savings
3. **More strategies:**
   - Hidden city ticketing (with warnings)
   - Self-transfer optimization
   - Currency arbitrage (pay in different currencies)
   - Error fare detection
4. **Mobile app** (React Native)
5. **Affiliate revenue** - Skyscanner/Booking.com commissions

---

## Support

If deployment fails:
1. Check Vercel build logs
2. Verify environment variables are set
3. Test API keys at https://developers.amadeus.com

---

**Ready to deploy!**
