# RaagaReel — Free-First Production Setup & Deployment Guide

This guide provides instructions for deploying **RaagaReel** on a production-ready infrastructure using **free tiers** across all services.

---

## 🏗️ Production Architecture Overview

- **Frontend**: [Vercel](https://vercel.com) (Free Hobby Tier)
- **Backend API & Queue**: [Render](https://render.com) Web Service (Free Tier)
- **Primary AI Director**: [Google Gemini 2.5 Flash API](https://aistudio.google.com) (Free Tier: 15 Requests/Min)
- **Voiceover Engine**: [ElevenLabs Multilingual V2 API](https://elevenlabs.io) (Free Tier: 10,000 Characters/Month)
- **Object Storage**: [Cloudflare R2](https://dash.cloudflare.com) (Free Tier: 10 GB Storage, 1,000,000 Operations/Month) or Local Fallback
- **Media Engine**: Native FFmpeg (Bundled inside Render server environment)

---

## 🔑 1. Gemini API Setup (Free AI Director)

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy your API key.
4. On your Render dashboard under **Environment Variables**, add:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 🎙️ 2. ElevenLabs API Setup (Free Voiceovers)

1. Register at [ElevenLabs.io](https://elevenlabs.io).
2. Click your profile icon -> **Profile + API Keys**.
3. Copy your API Key.
4. On your Render dashboard under **Environment Variables**, add:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

---

## 📦 3. Cloudflare R2 Setup (Free 10GB Object Storage)

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **R2** in the left sidebar and click **Create Bucket**.
3. Name your bucket `raagareel-media` and select **Default Location**.
4. Go to **R2 -> Manage R2 API Tokens** and click **Create API Token**.
5. Select permissions: **Object Read & Write**.
6. Copy the `Access Key ID`, `Secret Access Key`, and `Endpoint URL`.
7. Configure in Render environment variables:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   R2_BUCKET_NAME=raagareel-media
   R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
   ```
*(Note: If R2 credentials are not set, RaagaReel automatically falls back to Render's local `/outputs` directory so the app remains 100% functional).*

---

## ⚡ 4. Free-Tier Quota & Safety Limits

To prevent free-tier container overload, the following environment variables are configurable:

```env
MAX_UPLOAD_SIZE_MB=100
MAX_CLIPS_COUNT=10
MAX_VIDEO_DURATION_SEC=60
MAX_CONCURRENT_JOBS=3
```

---

## 🌐 5. Deployment Instructions

### A. Deploy Backend to Render
1. Connect your GitHub repository `vamshikrishna72/Raga-reel-Video-Editor-for-the-passion` to [Render](https://render.com).
2. Select **Web Service**.
3. Set **Build Command**: `cd backend && npm install`
4. Set **Start Command**: `node backend/server.js`
5. Add all Environment Variables listed above.
6. Copy your Render URL: `https://raga-reel-video-editor-for-the-passion.onrender.com`

### B. Deploy Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Set **Environment Variable**:
   ```env
   VITE_API_URL=https://raga-reel-video-editor-for-the-passion.onrender.com
   ```
4. Deploy!

---

## ✅ 6. Diagnostic Health Check Verification

Test your live backend health diagnostic by visiting:
`https://your-render-url.onrender.com/api/health`

Expected JSON output:
```json
{
  "gemini": "working",
  "elevenlabs": "working",
  "r2": "working",
  "ffmpeg": "working",
  "geminiDetails": "CONNECTED (gemini-2.5-flash operational)",
  "elevenlabsDetails": "CONNECTED (Voiceover Engine operational)",
  "r2Details": "CONNECTED (Bucket: raagareel-media)",
  "limits": {
    "maxUploadSizeMb": 100,
    "maxClipsCount": 10,
    "maxVideoDurationSec": 60,
    "maxConcurrentJobs": 3
  }
}
```
