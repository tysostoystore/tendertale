# 🎮 Telegram Web App Guide

## ✅ Your Visual Novel is Now a Telegram Web App!

### 🚀 How to Use:

1. **Find your bot on Telegram:**
   - Search for `@TendertaleBot` 
   - Or visit `t.me/TendertaleBot`

2. **Start the Web App:**
   - Send `/start` to the bot
   - Click the "🎮 Play Visual Novel" button
   - The visual novel will open in your phone's browser

3. **Play the game:**
   - Full visual novel experience with graphics, sprites, and animations
   - Click to advance dialogue
   - Make choices to progress the story
   - Save/load your progress

### 📱 What You Get:

✅ **Full Visual Novel Experience** - Same as the web version with graphics and animations
✅ **Mobile Optimized** - Works perfectly on phones
✅ **Easy Access** - One click from Telegram to start playing
✅ **Save System** - Your progress is saved automatically
✅ **Multiple Endings** - Different choices lead to different story paths

### 🔧 Technical Details:

- **Web App URL**: `http://192.168.10.8:5174`
- **Backend API**: `http://192.168.10.8:8080`
- **Network**: Both devices must be on the same WiFi network

### 🎯 How It Works:

1. **Bot sends a button** with the web app URL
2. **You click the button** and it opens in your phone's browser
3. **The visual novel loads** with full graphics and animations
4. **You play normally** - click to advance, make choices, etc.

### 🔄 Alternative: Direct URL

You can also access the visual novel directly by opening this URL on your phone:
```
http://192.168.10.8:5174
```

### 🛠️ Troubleshooting:

**Button doesn't work?**
- Make sure both backend and frontend are running
- Check that your phone and computer are on the same WiFi
- Try the direct URL: `http://192.168.10.8:5174`

**Can't find the bot?**
- Search for `@TendertaleBot` in Telegram
- Or visit `t.me/TendertaleBot`

**Want to change the IP?**
- Run `ipconfig` to get your current IP
- Update the URL in `backend/telegram_webapp.go`

Your visual novel is now accessible as a web app through Telegram! 🎉 