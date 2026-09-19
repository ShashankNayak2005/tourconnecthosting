# Deploy: Railway (Backend) + Firebase (Frontend)

## Architecture

```
User Browser
     │
     ▼
Firebase Hosting          Railway
(index.html, map.html)  ──────────────────────
                         │ Node.js (server.js) │
                         │ MySQL database      │
                         └────────────────────┘
```

---

## PART 1: Deploy Backend to Railway (FREE)

### Step 1: Push code to GitHub

Railway deploys from GitHub.

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/tour-connect.git
git push -u origin main
```

> ⚠️ Make sure `.gitignore` has `.env` so you don't push secrets!

---

### Step 2: Create Railway account

1. Go to https://railway.app
2. Sign up with GitHub (easiest)

---

### Step 3: Deploy Node.js Backend

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `tour-connect` repo
4. Railway auto-detects Node.js and runs `npm start`

Wait for deploy. You'll get a URL like:
```
https://tour-connect-production.up.railway.app
```

---

### Step 4: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MySQL"**
3. Railway creates a MySQL instance and auto-links it

Railway automatically sets these env vars in your service:
```
MYSQLHOST=...
MYSQLPORT=...
MYSQLUSER=...
MYSQLPASSWORD=...
MYSQLDATABASE=...
```

Your `server.js` already reads these. ✅

---

### Step 5: Add Environment Variables in Railway

In your Railway Node.js service → **Variables** tab, add:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | `any_long_random_string_here` |
| `NODE_ENV` | `production` |

> DB variables are automatically injected by Railway. You don't need to add them manually.

---

### Step 6: Import Your Database Schema

1. In Railway, click your **MySQL** service
2. Go to **"Connect"** tab
3. Use the connection details to connect with MySQL Workbench or TablePlus
4. Run your existing schema SQL to create tables

Or use Railway's query interface directly.

---

### Step 7: Get Your Railway URL

1. Go to your Node.js service in Railway
2. Click **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL, e.g.:
   ```
   https://tour-connect-production.up.railway.app
   ```

---

## PART 2: Update Frontend with Railway URL

Open `public/index.html` and update line near the top:

```javascript
const API_BASE = 'https://tour-connect-production.up.railway.app';
```

Replace `tour-connect-production.up.railway.app` with your actual Railway URL.

---

## PART 3: Deploy Frontend to Firebase (FREE)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name: `tour-connect`
4. Disable Google Analytics (optional)
5. Copy your **Project ID** (e.g. `tour-connect-abc12`)

### Step 4: Update `.firebaserc`

```json
{
  "projects": {
    "default": "tour-connect-abc12"
  }
}
```

### Step 5: Deploy to Firebase

```bash
firebase deploy --only hosting
```

Your site will be live at:
```
https://tour-connect-abc12.web.app
```

---

## Final Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created from GitHub repo
- [ ] Railway MySQL database added
- [ ] `JWT_SECRET` set in Railway variables
- [ ] Database schema imported
- [ ] Admin passwords fixed (`node fix_admin_passwords.js`)
- [ ] `public/index.html` updated with Railway URL
- [ ] `.firebaserc` updated with Firebase Project ID
- [ ] Firebase deployed

---

## After Deployment - Test

1. Open `https://YOUR_PROJECT.web.app`
2. Register a new user
3. Login as admin:
   - Email: `admin@tourconnect.com`
   - Password: `admin123`
   - ✅ Check "Login as Admin"
4. Test weather search
5. Test booking functionality

---

## Re-deploying After Code Changes

```bash
# Backend (Railway auto-deploys on git push)
git add .
git commit -m "update"
git push

# Frontend (manual deploy)
firebase deploy --only hosting
```

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Railway | $5 credit/month (enough for small projects) |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer |
| Firebase (overall) | Very generous free tier |

---

## Troubleshooting

### CORS error in browser
- Make sure `server.js` CORS includes your Firebase domain
- The current code allows `*.web.app` and `*.firebaseapp.com` ✅

### Database connection failed on Railway
- Check Railway MySQL service is running
- Verify env vars are set (Railway does this automatically)
- Check server logs in Railway dashboard

### 404 on page refresh
- `firebase.json` already has a rewrite to `index.html` ✅

### API calls failing
- Double-check `API_BASE` in `public/index.html` matches your Railway URL exactly
- No trailing slash: `https://your-app.up.railway.app` ✅
