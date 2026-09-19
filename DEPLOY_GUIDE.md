# Firebase + Cloud Run Deployment Guide

## Architecture

```
User Browser
     │
     ▼
Firebase Hosting (index.html, map.html, images)
     │
     │ /api/** rewrites to Cloud Run
     ▼
Google Cloud Run (server.js - Node.js backend)
     │
     ▼
Cloud SQL - MySQL (database)
```

---

## Prerequisites

Install these tools first:

```bash
# 1. Node.js (already installed)
node --version

# 2. Google Cloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# 3. Firebase CLI
npm install -g firebase-tools

# 4. Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

---

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it: `tour-connect` (or any name you like)
4. Disable Google Analytics (optional)
5. Click "Create Project"
6. Copy your **Project ID** (e.g. `tour-connect-abc12`)

Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID_HERE"
  }
}
```

---

## Step 2: Create Cloud SQL (MySQL Database)

1. Go to https://console.cloud.google.com
2. Search for **"Cloud SQL"** → Click "Create Instance"
3. Choose **MySQL**
4. Settings:
   - Instance ID: `tour-connect-db`
   - Password: (create a strong password, save it!)
   - Region: `us-central1`
   - Machine: `db-f1-micro` (cheapest, ~$7/month) or use free trial
5. Click **"Create Instance"** (takes ~5 minutes)

After creation:
- Go to your instance → **Databases** → Create database named `auth_system`
- Go to **Users** → Create user `tour_user` with a password

Import your schema:
- Go to **Overview** → **Import**
- Or connect via Cloud Shell and run your SQL

---

## Step 3: Set Up Cloud Run Backend

### 3a. Enable APIs

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 3b. Build and Deploy to Cloud Run

```bash
# Build the Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/tour-connect-backend

# Deploy to Cloud Run
gcloud run deploy tour-connect-backend \
  --image gcr.io/YOUR_PROJECT_ID/tour-connect-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DB_HOST=/cloudsql/YOUR_PROJECT_ID:us-central1:tour-connect-db" \
  --set-env-vars="DB_USER=tour_user" \
  --set-env-vars="DB_PASSWORD=YOUR_DB_PASSWORD" \
  --set-env-vars="DB_NAME=auth_system" \
  --set-env-vars="JWT_SECRET=YOUR_STRONG_JWT_SECRET" \
  --set-env-vars="NODE_ENV=production" \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:tour-connect-db
```

After deploy, you'll get a URL like:
```
https://tour-connect-backend-xxxxxxx-uc.a.run.app
```

Save this URL — you'll need it.

### 3c. Update server.js for Cloud SQL

The server.js already uses `process.env.DB_HOST` so it will pick up the Cloud Run env vars automatically.

---

## Step 4: Deploy Firebase Hosting (Frontend)

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init hosting

# Deploy frontend
firebase deploy --only hosting
```

After deploy, your site will be at:
```
https://YOUR_PROJECT_ID.web.app
```

---

## Step 5: Test Everything

1. Open `https://YOUR_PROJECT_ID.web.app`
2. Try registering a new user
3. Try logging in as admin
4. Test weather search

---

## Environment Variables Summary

Set these in Cloud Run:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `/cloudsql/PROJECT:REGION:INSTANCE` |
| `DB_USER` | `tour_user` |
| `DB_PASSWORD` | Your Cloud SQL password |
| `DB_NAME` | `auth_system` |
| `JWT_SECRET` | Any random strong string |
| `NODE_ENV` | `production` |
| `PORT` | `8080` (set automatically by Cloud Run) |

---

## Quick Deploy Commands (After Setup)

Every time you update code:

```bash
# Redeploy backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/tour-connect-backend
gcloud run deploy tour-connect-backend --image gcr.io/YOUR_PROJECT_ID/tour-connect-backend --region us-central1

# Redeploy frontend
firebase deploy --only hosting
```

---

## Cost Estimate

| Service | Free Tier | After Free Tier |
|---------|-----------|----------------|
| Firebase Hosting | 10GB/month | ~$0.026/GB |
| Cloud Run | 2M requests/month | ~$0.40/1M requests |
| Cloud SQL | 90 days free trial | ~$7-10/month |
| Cloud Build | 120 min/day | ~$0.003/min |

**For a small project:** Essentially free (except Cloud SQL after trial)

---

## Troubleshooting

### Cloud Run can't connect to database
- Make sure Cloud SQL instance is in same region
- Check `--add-cloudsql-instances` flag is set
- Verify env vars are correct

### Firebase Hosting not routing /api to Cloud Run
- Check `firebase.json` rewrite rules
- Make sure `serviceId` matches your Cloud Run service name

### CORS errors
- server.js already has `app.use(cors())` so this should be fine
- If issues, add your Firebase domain to CORS config

---

## Files Created

- `Dockerfile` - Containerizes the Node.js backend
- `.dockerignore` - Excludes unnecessary files from Docker
- `firebase.json` - Firebase Hosting config with Cloud Run rewrites
- `.firebaserc` - Links to your Firebase project
- `public/` - Frontend files ready for Firebase Hosting
