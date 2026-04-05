# Deploy to Vercel (One Click)

## Prerequisites

You'll need:
1. Groq API keys (from console.groq.com)
2. Database credentials (PostgreSQL host, user, password, database name)
3. JWT Secret (any random 32-character string)

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Convert to Next.js for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign up or login with GitHub
3. Click **"New Project"**
4. Select: **GeneralGunfire/Montridge**
5. Click **"Import"**

### Configure Build Settings (Leave Defaults)
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`

### Add Environment Variables

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_API_KEY_2` | Your second Groq key |
| `DB_HOST` | Your database host |
| `DB_NAME` | montridge_db |
| `DB_USER` | postgres |
| `DB_PASSWORD` | Your DB password |
| `DB_PORT` | 5432 |
| `JWT_SECRET_KEY` | Any random 32 characters |

## Step 3: Deploy

Click **"Deploy"** → Wait 3-5 minutes → ✅ **Live!**

Your app will be at: `https://montridge.vercel.app` (or similar)

---

## Database Setup

### Option A: Neon (Recommended - Free)
1. Go to https://neon.tech
2. Create new project
3. Copy connection details:
   - Host
   - User
   - Password
   - Database name
4. Add to Vercel env vars

### Option B: Render PostgreSQL
1. Go to https://render.com
2. Create PostgreSQL database
3. Copy credentials
4. Add to Vercel env vars

### Option C: Self-Hosted
Use your existing local PostgreSQL if it's accessible

---

## Verify Deployment

Once deployed:

1. Open your Vercel URL
2. Open DevTools (F12)
3. Go to **Console**
4. Run:
   ```javascript
   fetch('/api/health').then(r => r.json()).then(console.log)
   ```
5. Should see: `{ status: "ok", timestamp: "..." }`

---

## If It Fails

**Build Error?**
- Check that all env vars are set in Vercel dashboard
- Make sure DB is accessible from Vercel

**Runtime Error?**
- Check Vercel logs: Dashboard → Project → Deployments → View Logs
- Verify all environment variables are correct

**Database Connection Failed?**
- Test connection locally: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`
- Whitelist Vercel IPs in your firewall if needed

---

## That's It!

Your Montridge app is now live on Vercel with Next.js. 🚀

No servers to manage. Auto-scales globally. Deploys on every git push.
