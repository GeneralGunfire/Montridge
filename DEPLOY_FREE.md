# Free Deployment Guide - Render + Vercel

Deploy your entire Montridge app for FREE using Render (backend) + Vercel (frontend) + Neon (database).

## Prerequisites

- GitHub account (repo already pushed)
- Neon account (database already set up)
- Render account (free)
- Vercel account (free)

## Part 1: Deploy Flask Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Click "Connect GitHub" to authorize access

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repo: `GeneralGunfire/Montridge`
3. **Settings:**
   - Name: `montridge-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r montridge_flask/requirements.txt`
   - Start Command: `gunicorn -w 4 -b 0.0.0.0:$PORT montridge_flask.app:app`
   - Plan: **Free** (select this!)

### Step 3: Set Environment Variables
In Render dashboard, go to your service → Environment:

```
DATABASE_URL = postgresql://neondb_owner:npg_j19OHrdYEDQk@ep-young-cherry-alzxb96l-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
FLASK_ENV = production
```

If you have Groq API keys:
```
GROQ_API_KEY = your-key-here
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy from GitHub
3. Get your URL: `https://montridge-api.onrender.com` (similar)
4. Wait ~2-3 minutes for first deploy

### Verify Backend Works
```bash
curl https://montridge-api.onrender.com/api/articles
curl https://montridge-api.onrender.com/api/status
```

---

## Part 2: Deploy React Frontends to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project" → Select `GeneralGunfire/Montridge`

### Step 2: Configure Project
1. **Framework Preset:** Select "Other"
2. **Root Directory:** Leave blank (monorepo at root)
3. **Build Command:** `npm install && npm run build`
4. **Output Directory:** Leave blank
5. Click "Deploy"

### Step 3: Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://montridge-api.onrender.com
```

Then redeploy.

### Step 4: Configure CORS
Your Flask backend needs to allow Vercel frontend requests.

In `montridge_flask/app.py`, update CORS:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://*.vercel.app"  # Vercel domains
        ]
    }
})
```

Commit and Vercel will auto-redeploy.

---

## Part 3: Update Frontend to Use Backend

Each React app needs to know where the API is.

### For each React app (landing, login, dashboard, etc):

Edit `src/services/api.ts` or `src/api.js`:

```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const fetchArticles = async () => {
  const response = await fetch(`${API_URL}/api/articles`);
  return response.json();
};
```

---

## Deployment Checklist

- [ ] Created Render account
- [ ] Deployed Flask backend to Render
- [ ] Got Render API URL (e.g., `https://montridge-api.onrender.com`)
- [ ] Set `DATABASE_URL` in Render environment
- [ ] Created Vercel account
- [ ] Deployed Montridge repo to Vercel
- [ ] Set `VITE_API_URL` in Vercel environment
- [ ] Updated CORS in Flask for Vercel domains
- [ ] Updated React apps to use backend API URL
- [ ] Tested API endpoints

---

## Troubleshooting

**Backend not responding?**
- Check Render logs: Dashboard → Logs
- Verify DATABASE_URL is set correctly
- Check Flask app starts: `gunicorn montridge_flask.app:app`

**Frontend can't reach backend?**
- Check CORS headers in Flask
- Verify API URL in environment variables
- Check browser console for CORS errors

**Database connection fails?**
- Verify Neon DATABASE_URL
- Check database still exists in Neon dashboard
- Try connecting locally first: `psql $DATABASE_URL`

---

## Free Tier Limits

**Render Free:**
- Web Service: 1 free instance (hibernates after 15 min inactivity)
- Starts up when accessed (may take 30 seconds)

**Vercel Free:**
- 6000 serverless function hours/month
- Unlimited deployments
- Automatic HTTPS

**Neon Free:**
- 3 projects
- Unlimited databases
- 3GB storage
- Always active (no hibernation)

---

## After Deployment

### Keep Services Running
- Render free tier hibernates after 15 min inactivity
- Add a cron job to ping the API every 10 minutes:

```bash
# Add to GitHub Actions or external service
curl -X GET https://montridge-api.onrender.com/api/status
```

### Monitor
- Render: Check logs for errors
- Vercel: Check deployment status
- Neon: Monitor database usage

### Upgrade Later (if needed)
All three services have paid tiers when you're ready to scale.

---

## Summary

You now have:
- ✅ Backend: `https://montridge-api.onrender.com`
- ✅ Frontend: `https://montridge.vercel.app` (or custom domain)
- ✅ Database: Neon (always running)
- ✅ All FREE with no credit card

**Total cost: $0/month** (until you scale beyond free tiers)
