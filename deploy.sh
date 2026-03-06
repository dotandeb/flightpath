#!/bin/bash
# Deploy FlightPath to Vercel

echo "Deploying FlightPath to Vercel..."
echo ""
echo "You will need to:"
echo "1. Login to Vercel when prompted"
echo "2. Link this project"
echo "3. Deploy"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy
cd /root/.openclaw/workspace/flightpath
vercel --prod

echo ""
echo "Deployment complete!"
echo "Next steps:"
echo "1. Add custom domain (flightpath.solutions) in Vercel dashboard"
echo "2. Point DNS to Vercel"
echo "3. Add Amadeus API credentials as env vars"
