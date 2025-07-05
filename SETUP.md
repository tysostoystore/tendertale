# Quick Setup Guide

## 🚀 Running Your Telegram Bot

Your visual novel webapp is now integrated with a Telegram bot! Here's how to get it running:

### Step 1: Start the Backend Server
```bash
cd backend
run_bot.bat
```

This will:
- Start the web server on port 8080
- Start the Telegram bot with your token
- Load all your story scenes

### Step 2: Test Your Bot
1. Open Telegram
2. Search for `@TendertaleBot` or visit `t.me/TendertaleBot`
3. Send `/start` to begin your adventure!

### Step 3: Try the Web Interface (Optional)
In a new terminal:
```bash
cd frontend
npm run dev
```
Then open `http://localhost:5173` in your browser.

## 🎮 How to Play via Telegram

- **Start**: Send `/start` to begin
- **Read**: The bot shows you the story and dialogue
- **Choose**: Type `1`, `2`, `3`, etc. to make choices
- **Continue**: Your progress is automatically saved
- **Restart**: Send `/restart` anytime

## 📱 Bot Features

✅ **Automatic Save System** - Your progress is saved automatically
✅ **Multiple Endings** - Different choices lead to different paths
✅ **Easy Navigation** - Simple number-based choice system
✅ **Command System** - `/start`, `/restart`, `/help` commands

## 🔧 Troubleshooting

**Bot not responding?**
- Check that `run_bot.bat` is running
- Look for error messages in the console
- Make sure port 8080 is available

**Can't find the bot?**
- Search for `@TendertaleBot` in Telegram
- Or visit `t.me/TendertaleBot`

**Want to modify the story?**
- Edit files in `backend/scenes/` directory
- Restart the bot to see changes

## 🎯 Your Bot Token
Your bot token is already configured: `7786905461:AAEDev57BnxI9wp4o5gv77YRNPROu7b-qpI`

The bot is ready to use! Just run `run_bot.bat` and start playing on Telegram. 