# 🚀 Deploy from GitHub (No Terminal Needed)

## Easiest Method: Vercel Website (2 minutes)

### Step 1: Go to Vercel
1. Open https://vercel.com/new
2. Sign in with your GitHub account

### Step 2: Import Your Repo
1. Find `dotandeb/flightpath` in the list
2. Click **Import**

### Step 3: Configure
1. **Project Name**: `flightpath-free-scraper`
2. **Framework Preset**: Select "Other"
3. **Root Directory**: Click "Edit" and type: `flightpath-free-scraper`
4. **Build Command**: leave empty
5. **Output Directory**: leave empty

### Step 4: Deploy
Click **Deploy**

Wait 1 minute. Done! ✅

---

## Your URL Will Be
`https://flightpath-free-scraper-[random].vercel.app`

---

## Test It
Open this in your browser:
```
https://YOUR-URL.vercel.app/api/health
```

You should see:
```json
{
  "status": "ok",
  "mode": "100% FREE"
}
```

---

## Enable Auto-Scraping (1 minute)

1. Go to https://github.com/dotandeb/flightpath/actions
2. Click the green button: **"I understand my workflows, go ahead and enable them"**
3. Done! It will scrape flights every 6 hours automatically.

---

## What You Get

| Feature | Cost |
|---------|------|
| Flight scraping | $0 |
| API hosting | $0 |
| Auto-deployment | $0 |
| **Total** | **$0** |

---

## Troubleshooting

**"Build failed"?**
- Make sure Root Directory is set to `flightpath-free-scraper`
- Not the root of the repo

**"404 on /api/search"?**
- Wait 2 minutes for deployment to finish
- Check Vercel dashboard for errors

**Need help?**
- Check Vercel dashboard logs
- Or run locally: `npm run dev` in the `flightpath-free-scraper` folder
