#!/bin/bash
# Deploy Free Scraper to Vercel - One Command

echo "Deploying FlightPath Free Scraper to Vercel..."
echo ""

# Check if logged in
if ! vercel whoami >/dev/null 2>&1; then
    echo "🔑 Please login to Vercel:"
    vercel login
fi

cd flightpath-free-scraper

echo ""
echo "🚀 Deploying..."
vercel --prod --yes

echo ""
echo "✅ Done! Your free scraper is now live."
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard and add these environment variables:"
echo "   - AMADEUS_KEY (optional, from developers.amadeus.com)"
echo "   - AMADEUS_SECRET (optional)"
echo ""
echo "2. Enable GitHub Actions in your repo for automatic scraping"
echo ""
echo "3. Test your API:"
echo "   curl https://your-app.vercel.app/api/health"
