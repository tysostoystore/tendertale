# Tendertale Visual Novel - Telegram Bot

A visual novel/interactive story webapp that can be played both through a web interface and a Telegram bot.

## Features

- **Web Interface**: Full visual novel experience with graphics, audio, and animations
- **Telegram Bot**: Text-based version of the same story accessible through Telegram
- **Save System**: Progress is automatically saved and can be resumed
- **Multiple Endings**: Different choices lead to different story paths

## Quick Start

### Running the Telegram Bot

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the bot using the provided script:**
   ```bash
   run_bot.bat
   ```
   
   Or manually:
   ```bash
   set TELEGRAM_BOT_TOKEN=7786905461:AAEDev57BnxI9wp4o5gv77YRNPROu7b-qpI
   go run .
   ```

3. **Find your bot on Telegram:**
   - Search for `@TendertaleBot` or visit `t.me/TendertaleBot`
   - Send `/start` to begin your adventure

### Running the Web Interface

1. **Start the backend server:**
   ```bash
   cd backend
   go run .
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:5173`

## Telegram Bot Commands

- `/start` - Start a new game
- `/restart` - Restart your current game
- `/help` - Show available commands

### How to Play via Telegram

1. **Start the game** by sending `/start`
2. **Read the story** - the bot will show you the current scene and dialogue
3. **Make choices** by typing the number of your choice (1, 2, 3, etc.)
4. **Continue the story** - your progress is automatically saved
5. **Restart anytime** with `/restart`

## Story Overview

The visual novel follows the story of Alice and her journey. Players make choices that affect the story's progression and can lead to different endings.

## Technical Details

### Backend (Go)
- **Framework**: Gin web framework
- **API**: RESTful API for scene management and save states
- **Telegram Bot**: Uses go-telegram-bot-api library
- **Port**: 8080

### Frontend (JavaScript/Vite)
- **Framework**: Vanilla JavaScript with Vite
- **Features**: Visual novel interface with sprites, backgrounds, and audio
- **Port**: 5173

### File Structure
```
├── backend/
│   ├── main.go              # Main server and bot
│   ├── telegram_bot.go      # Telegram bot logic
│   ├── scenes/              # Story scene files
│   ├── models/              # Data models
│   └── saves/               # User save files
├── frontend/
│   ├── src/                 # Frontend source code
│   ├── assets/              # Images and audio
│   └── public/              # Static files
└── README.md
```

## API Endpoints

- `GET /api/scene/:id` - Get a specific scene
- `POST /api/choice` - Make a choice and get next scene
- `GET /api/load/:user_id` - Load user's save state
- `POST /api/save/:user_id` - Save user's game state
- `DELETE /api/save/:user_id` - Delete user's save state

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (already configured)

## Development

### Adding New Scenes

1. Create a new JSON file in `backend/scenes/`
2. Follow the scene format:
   ```json
   {
     "id": "scene_id",
     "background": "bg_image.png",
     "characters": [
       {"name": "Character", "sprite": "sprite.png", "position": "left"}
     ],
     "dialogue": [
       {"speaker": "Character", "text": "Dialogue text"}
     ],
     "choices": [
       {"text": "Choice text", "next_scene": "next_scene_id"}
     ]
   }
   ```

### Modifying the Bot

The bot logic is in `backend/telegram_bot.go`. Key functions:
- `handleMessage()` - Processes incoming messages
- `showScene()` - Displays scenes in Telegram format
- `handleChoice()` - Processes user choices

## Troubleshooting

### Bot not responding
- Check that the backend server is running
- Verify the bot token is correct
- Check the console for error messages

### Web interface not loading
- Ensure both backend and frontend are running
- Check that ports 8080 and 5173 are available
- Clear browser cache if needed

## License

This project is for educational and entertainment purposes.
