# 🚀 Complete Free Deployment Guide for RAG Chat

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│   🌐 Vercel    │  HTTP   │   🏠 Hugging     │  TCP    │   🍃 MongoDB    │
│   (Frontend)   │ ──────► │   Face Spaces    │ ──────► │   Atlas (DB)    │
│   Free Tier    │         │   (Backend API)  │         │   Free Tier     │
│                 │         │   16GB RAM Free  │         │   512MB Free     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Cost: $0/month for all three services!**

---

## 📋 PREREQUISITES (What you need before starting)

1. **GitHub account** → https://github.com (to host your code)
2. **Git installed** → Check with: `git --version`
3. **Node.js installed** → Check with: `node --version` (needed for frontend)

---

## 🗺️ STEP-BY-STEP ROADMAP

| Step | What | Where | Time |
|------|------|-------|------|
| 1 | Push code to GitHub | Your computer | 5 min |
| 2 | Create cloud database | MongoDB Atlas | 10 min |
| 3 | Deploy backend API | Hugging Face Spaces | 15 min |
| 4 | Deploy frontend | Vercel | 10 min |
| 5 | Connect everything | Dashboard settings | 5 min |

---

## STEP 1: Push Your Code to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. Repository name: `y-trag` (or any name)
3. Keep **Public** (free)
4. DO NOT check "Add README" or ".gitignore"
5. Click **Create repository**

### 1.2 Push Your Local Code
Open a terminal in your project folder:

```bash
# Go to your project
cd C:\Users\91986\Desktop\Shivaram -RAG\YTRAG

# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - RAG Chat app"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/y-trag.git

# Push code
git push -u origin main
```

✅ **Done!** Your code is now on GitHub.

---

## STEP 2: Create Free Cloud Database (MongoDB Atlas)

MongoDB Atlas gives you **512MB free cloud database**.

### 2.1 Sign Up
1. Go to https://www.mongodb.com/atlas
2. Click **"Try Free"**
3. Sign up with Google or email

### 2.2 Create Cluster
1. Click **"Create Cluster"**
2. Select **M0 Free** tier (it's highlighted as FREE)
3. Choose any region (e.g., **Mumbai** - closest to India)
4. Click **"Create Cluster"** (takes 1-3 minutes)

### 2.3 Set Up Access
1. In **"Security Quickstart"**:
   - **Username**: `rag_admin`
   - **Password**: Click **"Autogenerate Secure Password"** → Copy it somewhere safe!
   - Click **"Create User"**
2. **Where would you like to connect from?**
   - Click **"Add My Current IP Address"** (for local testing)
   - Also add: `0.0.0.0/0` (allows the cloud server to connect)
   - Click **"Finish and Close"**

### 2.4 Get Connection String
1. Click **"Connect"** button
2. Select **"Drivers"**
3. Copy the connection string (looks like this):
   ```
   mongodb+srv://rag_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. **Replace `<password>`** with the password you saved earlier
5. Also change the database name at the end to `rag_chat`:
   ```
   mongodb+srv://rag_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/rag_chat?retryWrites=true&w=majority
   ```
6. **Save this string** — you'll need it for the backend!

✅ **Done!** You now have a cloud database.

---

## STEP 3: Deploy Backend (Hugging Face Spaces — 16GB RAM FREE!)

Hugging Face Spaces is **great for ML apps** because it gives **16GB RAM free** (perfect for sentence-transformers and FAISS).

### 3.1 Create Hugging Face Account
1. Go to https://huggingface.co/join
2. Sign up (free)

### 3.2 Create a Space
1. Click your profile picture → **"New Space"**
2. Fill in:
   - **Space Name**: `y-trag-api`
   - **License**: `MIT`
   - **Space SDK**: Select **Docker**
   - **Docker template**: **Blank**
   - **Space Hardware**: **CPU basic** (free)
3. Click **"Create Space"**

### 3.3 Connect Your GitHub Repo (Best Method)
1. In your Space, go to **Settings** → **GitHub Sync**
2. Click **"Connect GitHub Repository"**
3. Authorize Hugging Face to access your GitHub
4. Select your `y-trag` repository
5. Set **Branch**: `main`
6. Set **Directory**: `/` (root)
7. Click **Save**

### 3.4 Add Environment Variables
In your Space's **Settings** → **Repository Secrets**:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `MONGO_DB_NAME` | `rag_chat` |
| `GROQ_API_KEY` | Your Groq API key |

### 3.5 Wait for Build (5-10 minutes)
- The Space will detect the `Dockerfile`
- It will build and install all dependencies
- Watch the **logs** tab for progress

### 3.6 Get Your Backend URL
Once built, your backend URL will be:
```
https://YOUR_USERNAME-y-trag-api.hf.space
```
**Save this URL!** You'll need it for the frontend.

✅ **Done!** Your backend is live.

---

## STEP 4: Deploy Frontend (Vercel — FREE)

### 4.1 Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

### 4.2 Import Your Repository
1. Click **"Add New"** → **"Project"**
2. Find and select `y-trag` from the list
3. Click **"Import"**

### 4.3 Configure Deployment
Set these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` (click the dropdown and select frontend/) |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |

### 4.4 Add Environment Variable
Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR_USERNAME-y-trag-api.hf.space` |

⚠️ Replace `YOUR_USERNAME` with your Hugging Face username!

### 4.5 Deploy
1. Click **"Deploy"** button
2. Wait ~1 minute for build
3. You'll get a URL like: `https://y-trag.vercel.app`

✅ **Done!** Your frontend is live.

---

## STEP 5: Test Everything

1. **Open** `https://y-trag.vercel.app` in your browser
2. **Check** the green "Connected" indicator in the top-right
3. **Type** a question like "What documents are available?"
4. **Verify** you get an AI answer

If you see **"Offline"** in red → The backend can't reach MongoDB:
   - Double-check the `MONGO_URI` in Hugging Face Spaces settings
   - Make sure you added `0.0.0.0/0` to MongoDB Atlas network access
   - Check Hugging Face Space logs for errors

---

## 🎯 SUMMARY

| Service | URL | Free Tier |
|---------|-----|-----------|
| **Code** | `https://github.com/YOUR_USERNAME/y-trag` | ✅ Unlimited |
| **Database** | MongoDB Atlas | ✅ **512MB** |
| **Backend API** | `https://YOUR_USERNAME-y-trag-api.hf.space` | ✅ **16GB RAM** |
| **Frontend** | `https://y-trag.vercel.app` | ✅ **100GB bandwidth** |
| **Total Cost** | **$0/month** | 🎉 |

---

## ❗ TROUBLESHOOTING

### Problem: "Offline" in the header
**Cause:** Backend can't connect to MongoDB Atlas
**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Make sure `0.0.0.0/0` is in the whitelist
3. Verify the `MONGO_URI` is correct in Hugging Face secrets

### Problem: "Error processing your request"
**Cause:** Missing `GROQ_API_KEY` or API limit reached
**Fix:**
1. Check `GROQ_API_KEY` is set in Hugging Face secrets
2. Go to https://console.groq.com to check your API key

### Problem: Hugging Face Space failed to build
**Cause:** Memory limit during pip install
**Fix:**
1. Go to Space Settings → **Change hardware** → Still on **CPU basic**
2. Retry the build from **Settings** → **Factory rebuild**

### Problem: "No relevant documents found"
**Cause:** Your `data/` folder was empty when built on the server
**Fix:**
1. Make sure your PDFs are committed to GitHub in the `data/` folder
2. Or rebuild the vector store: restart your Hugging Face Space

---

## 📱 Quick Commands Reference

```bash
# Check if Git is installed
git --version

# Check if Node.js is installed (for frontend)
node --version

# Push code to GitHub (when you make changes)
cd C:\Users\91986\Desktop\Shivaram -RAG\YTRAG
git add .
git commit -m "Describe your changes"
git push

# The backend on Hugging Face will auto-rebuild when you push!
# The frontend on Vercel will auto-rebuild when you push!