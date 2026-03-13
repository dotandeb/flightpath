#!/bin/bash

# Final step: Set Vercel secrets for GitHub Actions auto-deployment

echo "=== Set Vercel Secrets for flightpath.solutions ==="
echo ""

# Check if VERCEL_TOKEN is provided
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN not set"
    echo ""
    echo "To get your Vercel token:"
    echo "1. Go to https://vercel.com/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Name it 'github-actions'"
    echo "4. Copy the token"
    echo ""
    echo "Then run: VERCEL_TOKEN=your_token VERCEL_ORG_ID=your_org VERCEL_PROJECT_ID=your_project ./set-vercel-secrets.sh"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ]; then
    echo "❌ VERCEL_ORG_ID not set"
    echo ""
    echo "To get your Vercel Org ID:"
    echo "1. Go to your Vercel project dashboard"
    echo "2. Click 'Settings' → 'General'"
    echo "3. Look for 'Project ID' and 'Team ID' (or 'Personal Account ID')"
    echo ""
    exit 1
fi

if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ VERCEL_PROJECT_ID not set"
    echo ""
    echo "To get your Vercel Project ID:"
    echo "1. Go to your Vercel project dashboard"  
    echo "2. Click 'Settings' → 'General'"
    echo "3. Copy 'Project ID'"
    echo ""
    exit 1
fi

# Extract GitHub token from remote
GITHUB_TOKEN=$(git remote get-url origin | grep -o 'ghp_[A-Za-z0-9]*')

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Could not extract GitHub token from remote URL"
    exit 1
fi

echo "Setting Vercel secrets on GitHub..."
echo ""

# Use GitHub API to set secrets
curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"encrypted_value\":\"$(echo -n "$VERCEL_TOKEN" | base64 -w 0)\",\"key_id\":\"3380204578043523366\"}" \
  https://api.github.com/repos/dotandeb/flightpath/actions/secrets/VERCEL_TOKEN

echo "✅ Set: VERCEL_TOKEN"

curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"encrypted_value\":\"$(echo -n "$VERCEL_ORG_ID" | base64 -w 0)\",\"key_id\":\"3380204578043523366\"}" \
  https://api.github.com/repos/dotandeb/flightpath/actions/secrets/VERCEL_ORG_ID

echo "✅ Set: VERCEL_ORG_ID"

curl -s -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"encrypted_value\":\"$(echo -n "$VERCEL_PROJECT_ID" | base64 -w 0)\",\"key_id\":\"3380204578043523366\"}" \
  https://api.github.com/repos/dotandeb/flightpath/actions/secrets/VERCEL_PROJECT_ID

echo "✅ Set: VERCEL_PROJECT_ID"

echo ""
echo "=== ✅ All Vercel secrets set! ==="
echo ""
echo "Your next push to GitHub will auto-deploy to Vercel!"
echo ""
echo "To add the domain flightpath.solutions:"
echo "1. Go to your Vercel project dashboard"
echo "2. Click 'Settings' → 'Domains'"
echo "3. Add 'flightpath.solutions'"
echo "4. Update your DNS records as shown"
