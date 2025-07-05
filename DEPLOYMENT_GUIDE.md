# Complete Deployment Guide for Telegram Visual Novel Bot

## Overview
This guide will help you deploy your Telegram bot to Railway (backend) and Vercel (frontend) for free.

## Prerequisites
- GitHub account
- Railway account (free at railway.app)
- Vercel account (free at vercel.com)
- Your Telegram bot token

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 1.2 Repository Structure
Your repository should look like this:
```
tg_visual/
├── backend/
│   ├── main.go
│   ├── telegram_webapp.go
│   ├── Dockerfile
│   ├── railway.json
│   ├── .dockerignore
│   ├── env.example
│   ├── go.mod
│   ├── go.sum
│   ├── scenes/
│   ├── saves/
│   ├── models/
│   └── handlers/
├── frontend/
│   ├── package.json
│   ├── vercel.json
│   ├── index.html
│   ├── src/
│   └── public/
└── README.md
```

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 2.2 Configure Environment Variables
In Railway dashboard:
1. Go to your project → Variables tab
2. Add these variables:
   ```
   TELEGRAM_BOT_TOKEN=your_actual_bot_token
   FRONTEND_URL=https://your-frontend-domain.vercel.app (we'll add this later)
   GIN_MODE=release
   ```

### 2.3 Deploy
1. Railway will automatically detect your Go app
2. It will build using the Dockerfile
3. Your app will be available at: `https://your-app-name.railway.app`

### 2.4 Test Backend
Test your API endpoints:
```bash
curl https://your-app-name.railway.app/api/scene/scene_1
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure build settings:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.2 Update API URL
In your frontend code, update the API base URL to your Railway backend:
```javascript
// In your API configuration
const API_BASE_URL = 'https://your-app-name.railway.app';
```

### 3.3 Deploy
1. Vercel will build and deploy automatically
2. Your frontend will be available at: `https://your-project-name.vercel.app`

## Step 4: Connect Frontend and Backend

### 4.1 Update Railway Environment Variables
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-project-name.vercel.app
   ```

### 4.2 Update Frontend API Calls
Make sure your frontend is calling the Railway backend URL.

## Step 5: Test Your Bot

### 5.1 Restart Your Bot
Your bot will automatically use the new Railway URL.

### 5.2 Test on Different Devices
1. Test on PC browser
2. Test on iPhone/Android
3. Test through Telegram Web App

## Step 6: Monitor and Debug

### 6.1 Railway Monitoring
- Go to Railway dashboard → Deployments
- Check logs for any errors
- Monitor resource usage

### 6.2 Vercel Monitoring
- Go to Vercel dashboard → Functions
- Check function logs
- Monitor performance

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check that `FRONTEND_URL` is set correctly in Railway
   - Verify the URL in your frontend API calls

2. **Bot Not Responding**
   - Check Railway logs for errors
   - Verify `TELEGRAM_BOT_TOKEN` is correct
   - Ensure the bot is running (check Railway logs)

3. **Frontend Not Loading**
   - Check Vercel deployment logs
   - Verify build completed successfully
   - Check browser console for errors

4. **API Calls Failing**
   - Verify Railway URL is correct
   - Check CORS configuration
   - Test API endpoints directly

## Cost Breakdown
- **Railway**: $5/month free tier (sufficient for your bot)
- **Vercel**: Free tier (unlimited for personal projects)
- **Total**: $0/month for basic usage

## Scaling Up
When you need more resources:
- **Railway**: Upgrade to paid plan ($20/month)
- **Vercel**: Pro plan ($20/month) for more features
- **Database**: Add PostgreSQL to Railway ($5/month)

## Security Notes
- Never commit your bot token to git
- Use environment variables for all secrets
- Enable HTTPS everywhere (Railway and Vercel do this automatically)
- Regularly update dependencies

## Next Steps
1. Set up monitoring and alerts
2. Add a database for persistent storage
3. Implement user analytics
4. Add more visual novel content
5. Consider adding multiplayer features 