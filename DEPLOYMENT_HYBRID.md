# Hybrid Deployment Guide: Vercel (Frontend) + Render (Backend)

## Architecture

```
Frontend (Vercel)          Backend (Render)
- React apps               - Flask API
- Static files             - Database connection
- CDN globally             - Groq AI processing
```

---

## Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (authorize as GeneralGunfire)

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect repo: **GeneralGunfire/Montridge**
3. Select **main** branch

### Step 3: Configure Settings
```
Name:              montridge-backend
Root Directory:    montridge_flask
Build Command:     pip install -r requirements.txt
Start Command:     gunicorn app:app
Instance Type:     Free
```

### Step 4: Add Environment Variables
```
GROQ_API_KEY       = your_groq_key_here
GROQ_API_KEY_2     = your_second_key_here
DB_HOST            = your_database_host
DB_NAME            = montridge_db
DB_USER            = postgres
DB_PASSWORD        = your_db_password
DB_PORT            = 5432
JWT_SECRET_KEY     = generate_random_32_chars
FLASK_ENV          = production
FRONTEND_URL       = https://montridge.vercel.app
```

### Step 5: Deploy
- Click **"Create Web Service"**
- Wait for deployment (2-3 min)
- Your backend URL: `https://montridge-backend.onrender.com`

---

## Part 2: Deploy Frontend to Vercel

### Option A: Deploy Single Frontend App (Simple)

If you just want ONE frontend app (e.g., landing page):

1. **Create new GitHub repo:** `Montridge-Frontend`
2. **Copy frontend app files:**
   ```bash
   # Copy just the landing page app
   cp -r montridge_flask/newlandingpage Montridge-Frontend/
   ```
3. **Go to https://vercel.com**
4. **Click "New Project"**
5. **Import GitHub repo:** `Montridge-Frontend`
6. **Build settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. **Environment Variables:**
   ```
   VITE_API_URL = https://montridge-backend.onrender.com
   ```
8. **Deploy** → Your URL: `https://montridge.vercel.app`

### Option B: Deploy All Frontends (Monorepo)

For all React apps in one Vercel deployment:

1. **Create new GitHub repo:** `Montridge-Frontend`
2. **Create monorepo structure:**
   ```
   Montridge-Frontend/
   ├── package.json (root)
   ├── apps/
   │   ├── landing/      (newlandingpage)
   │   ├── dashboard/    (newdashboard)
   │   ├── login/        (login-app)
   │   ├── map/          (map)
   │   ├── intelligence/ (intelligence)
   │   ├── onboarding/   (onboarding)
   │   ├── settings/     (settings)
   │   └── 404/          (pagenotfound)
   └── vercel.json
   ```
3. **In each app's package.json:**
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```
4. **Root package.json:**
   ```json
   {
     "private": true,
     "workspaces": ["apps/*"],
     "scripts": {
       "build": "npm run build --workspace=apps/landing"
     }
   }
   ```
5. **vercel.json (use the one in frontend/ folder):**
   - Points each route to correct app
   - Proxies /api/* to Render backend

---

## Part 3: Update Frontend Code

### In each React app, add API base URL:

**Frontend app (e.g., src/main.tsx or src/api/client.ts):**

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 
                 (import.meta.env.DEV ? 'http://localhost:5000' : 'https://montridge-backend.onrender.com');

// Use in all API calls:
fetch(`${API_BASE}/api/articles`)
```

### Update Login/Auth Requests:

**Before:**
```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

**After:**
```typescript
const response = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

---

## Part 4: Database Setup

⚠️ **Your local PostgreSQL won't work in production!**

### Create Hosted Database

Choose ONE:

#### Option 1: Neon (Recommended)
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project
4. Copy connection string
5. Extract: `host`, `user`, `password`, `database`
6. Add to Render env vars

#### Option 2: Render PostgreSQL
1. In Render dashboard, click **"New"** → **"PostgreSQL"**
2. Create database
3. Copy credentials
4. Add to Render env vars

#### Option 3: Supabase
1. Go to https://supabase.com
2. Create project
3. Copy connection string
4. Add to Render env vars

---

## Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Backend URL obtained: `https://montridge-backend.onrender.com`
- [ ] Frontend repo created (GitHub)
- [ ] Frontend deployed on Vercel
- [ ] Frontend URL obtained: `https://montridge.vercel.app`
- [ ] Env vars set in Render (FRONTEND_URL = Vercel URL)
- [ ] Env vars set in Vercel (VITE_API_URL = Render URL)
- [ ] Database hosted (Neon/Render/Supabase)
- [ ] API calls updated in frontend code
- [ ] CORS working (test in browser dev tools)

---

## Testing Deployment

### Test API from Frontend
```javascript
// In browser console:
fetch('https://montridge-backend.onrender.com/api/articles')
  .then(r => r.json())
  .then(console.log)
```

### Test Frontend Calling Backend
1. Open `https://montridge.vercel.app`
2. Open DevTools Network tab
3. Navigate around the app
4. Verify API requests go to `https://montridge-backend.onrender.com/api/*`

---

## Common Issues

### CORS Error
- Check `FRONTEND_URL` env var in Render matches your Vercel URL
- Verify Vercel URL doesn't have trailing slash

### 404 on Frontend Routes
- Vercel needs `vercel.json` with catch-all route
- Check that routes point to `/index.html`

### API Calls Timeout
- Verify Render backend is running (check Render dashboard)
- Check internet connection
- Verify API URL in frontend code is correct

### Database Connection Failed
- Check DB credentials in Render env vars
- Verify database is running and accessible
- Test connection: `psql -h host -U user -d database`

---

## Costs

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | 100GB/month bandwidth | $0 |
| Render | 750 hours/month compute | Free, then ~$7/mo |
| Neon | 3GB storage, 3GB/month transfer | Free, then $0.12/GB |
| Supabase | 500MB storage | Free, then ~$25/mo |

---

## Next Steps

1. **Now:** Commit and push this file to GitHub
2. **Create Render account** and deploy backend
3. **Note backend URL**
4. **Create frontend GitHub repo**
5. **Copy frontend apps there**
6. **Deploy to Vercel**
7. **Test API calls**

Ready to proceed! 🚀
