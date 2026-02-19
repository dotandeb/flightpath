# FlightPath Deployment Guide

## Prerequisites

1. Vercel account: dotandb@gmail.com ✅
2. Domain: flightpath.solutions ✅
3. Amadeus API keys: ✅

## Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: GitHub + Vercel Integration

1. Push this repo to GitHub
2. Connect GitHub repo in Vercel dashboard
3. Auto-deploy on every push

### Option C: Manual Upload

1. Run `npm run build` locally
2. Zip the `.next` folder + required files
3. Upload via Vercel dashboard

## Post-Deployment Setup

### 1. Add Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

```
AMADEUS_API_KEY = fZFTI63Dm6grAZEcRbG0Afdy56hGJqgP
AMADEUS_API_SECRET = TgGHyeARX63RIxnQ
NEXT_PUBLIC_APP_URL = https://flightpath.solutions
```

### 2. Add Custom Domain

In Vercel dashboard → Domains:
- Add `flightpath.solutions`
- Follow DNS instructions to point domain to Vercel

### 3. Test the API

```bash
curl -X POST https://flightpath.solutions/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LHR",
    "destination": "JFK",
    "departureDate": "2025-06-15",
    "returnDate": "2025-06-22",
    "passengers": 1
  }'
```

## Monitoring

- Vercel Analytics: Built-in
- Amadeus API usage: https://developers.amadeus.com/my-apps

## Troubleshooting

### Build fails
```bash
npm run build
```
Check for TypeScript errors.

### API errors
Check Vercel logs: Dashboard → Functions → Logs

### Domain not working
- DNS propagation can take 24-48 hours
- Check Vercel's domain troubleshooting guide

---

## Current Status

✅ App built and tested
✅ Amadeus API integrated
✅ Environment variables configured
⏳ Ready for deployment

**Next step:** Run `vercel --prod` or deploy via dashboard.
