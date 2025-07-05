# Railway Deployment Guide for Telegram Bot

## Prerequisites
- GitHub account
- Railway account (free at railway.app)
- Your Telegram bot token

## Step 1: Prepare Your Code

### 1.1 Create a Railway-specific main.go
Your current `main.go` needs a small modification for Railway:

```go
// In main.go, change the CORS origins to include your Railway domain
config.AllowOrigins = []string{
    "http://localhost:5173",
    "http://192.168.10.8:5173",
    "https://your-app-name.railway.app", // Add your Railway domain
    "https://your-frontend-domain.vercel.app", // Add your frontend domain
}
```

### 1.2 Create a Dockerfile (optional but recommended)
```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/scenes ./scenes
COPY --from=builder /app/saves ./saves
EXPOSE 8080
CMD ["./main"]
```

### 1.3 Create railway.json (optional)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "./main",
    "healthcheckPath": "/api/scene/scene_1",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Step 2: Deploy to Railway

### 2.1 Connect GitHub
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### 2.2 Configure Environment Variables
In Railway dashboard:
1. Go to your project → Variables tab
2. Add: `TELEGRAM_BOT_TOKEN=your_bot_token_here`
3. Add: `PORT=8080` (Railway sets this automatically)

### 2.3 Deploy
1. Railway will automatically detect your Go app
2. It will build and deploy automatically
3. Your app will be available at: `https://your-app-name.railway.app`

## Step 3: Update Your Bot Code

### 3.1 Update telegram_webapp.go
Change the web app URL in your bot code:

```go
// In telegram_webapp.go, update the web app URL
webApp, err := NewTelegramWebApp(botToken, "https://your-app-name.railway.app")
```

### 3.2 Update Frontend
Update your frontend to use the Railway backend URL:

```javascript
// In your frontend API calls
const API_BASE_URL = 'https://your-app-name.railway.app';
```

## Step 4: Deploy Frontend to Vercel

### 4.1 Prepare Frontend
1. Push your frontend code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 4.2 Update API URL
In your frontend code, update the API base URL to your Railway backend.

## Step 5: Test Your Bot

1. Restart your bot locally to get the new Railway URL
2. Test the web app button in Telegram
3. Verify it works on both PC and iPhone

## Cost Breakdown
- **Railway**: $5/month free tier (more than enough for your bot)
- **Vercel**: Free tier for frontend
- **Total**: $0/month for basic usage

## Monitoring
Railway provides:
- Real-time logs
- Performance metrics
- Automatic restarts
- Health checks

## Scaling
If you need more resources later:
- Railway: Easy upgrade to paid plans
- Automatic scaling based on traffic
- Database add-ons available 