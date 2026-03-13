# Vercel Deployment - Automated Setup

## ✅ Status: GitHub Actions Configured

I've set up automatic deployment to Vercel. Here's what's been done:

### ✅ Completed
- [x] GitHub Actions workflow created (`.github/workflows/deploy.yml`)
- [x] Amadeus API secrets set on GitHub
  - `AMADEUS_API_KEY`
  - `AMADEUS_API_SECRET`  
  - `NEXT_PUBLIC_APP_URL`

### ⏳ Remaining (One-time setup)

**Step 1: Import Project on Vercel**
1. Go to https://vercel.com/new
2. Import Git Repository → Select **dotandeb/flightpath**
3. Vercel will auto-detect Next.js
4. Click **Deploy**

**Step 2: Get Vercel IDs**
After import, go to your project **Settings → General**:
- Copy **Project ID**
- Copy **Team ID** (or Personal Account ID under "Root Directory")

**Step 3: Create Vercel Token**
1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `github-actions`
4. Copy the token

**Step 4: Set Vercel Secrets on GitHub**

Run this command (with your actual values):

```bash
export GITHUB_TOKEN=$(git remote get-url origin | grep -o 'ghp_[A-Za-z0-9]*')
export VERCEL_TOKEN="your_vercel_token_here"
export VERCEL_ORG_ID="your_team_id_here"
export VERCEL_PROJECT_ID="your_project_id_here"

node set-vercel-secrets.js
```

Or if you prefer, manually add them at:
https://github.com/dotandeb/flightpath/settings/secrets/actions

Secrets needed:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 🚀 After Setup

**Every push to `main` branch will automatically deploy to Vercel!**

### Add Custom Domain (flightpath.solutions)

1. In Vercel project, go to **Settings → Domains**
2. Enter: `flightpath.solutions`
3. Click **Add**
4. Vercel will show DNS records — add them at your domain registrar:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`

Or use Vercel nameservers:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Wait 5-30 minutes for DNS propagation.

---

## 🧪 Test the Deployment

Once deployed, test at:
- **Vercel URL**: `https://flightpath-[random].vercel.app`
- **Custom Domain**: `https://flightpath.solutions`

Test search:
- From: LHR
- To: JFK  
- Dates: Any future dates

---

## 📁 Files Added

- `.github/workflows/deploy.yml` - Auto-deploy on push
- `setup-github-secrets.js` - Helper to set GitHub secrets
- `set-vercel-secrets.js` - Helper to set Vercel secrets
- `set-vercel-secrets.sh` - Shell version of above

---

## 🔧 Troubleshooting

**Build fails?**
- Check secrets are set correctly at https://github.com/dotandeb/flightpath/settings/secrets/actions
- Verify Amadeus API keys are active: https://developers.amadeus.com/my-apps

**Domain not working?**
- DNS can take up to 48 hours (usually 5-30 minutes)
- Check propagation: https://dnschecker.org

**Auto-deploy not triggering?**
- Make sure you're pushing to the `main` branch
- Check GitHub Actions tab for errors: https://github.com/dotandeb/flightpath/actions

---

**Ready to go live?** Complete Step 1-4 above and your site will be live at flightpath.solutions!
