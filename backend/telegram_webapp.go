package main

import (
	"fmt"
	"os"
	"strings"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type TelegramWebApp struct {
	bot    *tgbotapi.BotAPI
	apiURL string
}

func NewTelegramWebApp(token, apiURL string) (*TelegramWebApp, error) {
	bot, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}

	return &TelegramWebApp{
		bot:    bot,
		apiURL: apiURL,
	}, nil
}

func (tw *TelegramWebApp) Start() {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := tw.bot.GetUpdatesChan(u)

	fmt.Println("Telegram Web App bot started...")

	for update := range updates {
		if update.Message == nil {
			continue
		}

		go tw.handleMessage(update.Message)
	}
}

func (tw *TelegramWebApp) handleMessage(message *tgbotapi.Message) {
	text := message.Text
	chatID := message.Chat.ID

	if strings.HasPrefix(text, "/") {
		tw.handleCommand(message)
		return
	}

	// Default: show web app button
	tw.sendWebAppButton(chatID)
}

func (tw *TelegramWebApp) handleCommand(message *tgbotapi.Message) {
	text := message.Text
	chatID := message.Chat.ID

	switch text {
	case "/start":
		tw.sendWelcomeMessage(chatID)
		tw.sendWebAppButton(chatID)
	case "/help":
		tw.sendHelpMessage(chatID)
	default:
		tw.sendMessage(chatID, "Unknown command. Use /help to see available commands.")
	}
}

func (tw *TelegramWebApp) sendWelcomeMessage(chatID int64) {
	welcomeText := `🎮 Welcome to Tendertale Visual Novel!

This is a Telegram Web App - a mini webapp that runs directly in Telegram.

Click the button below to open the visual novel in Telegram!`

	tw.sendMessage(chatID, welcomeText)
}

func (tw *TelegramWebApp) sendHelpMessage(chatID int64) {
	helpText := `📖 Available Commands:

/start - Start the visual novel web app
/help - Show this help message

The visual novel runs as a web app directly in Telegram!`

	tw.sendMessage(chatID, helpText)
}

func (tw *TelegramWebApp) sendWebAppButton(chatID int64) {
	// Get frontend URL from environment or use default
	frontendURL := tw.apiURL
	if envURL := os.Getenv("FRONTEND_URL"); envURL != "" {
		frontendURL = envURL
	}

	// Create inline keyboard with URL button
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonURL(
				"🎮 Play Visual Novel",
				frontendURL,
			),
		),
	)

	msg := tgbotapi.NewMessage(chatID, "Click the button below to open the visual novel in your browser!")
	msg.ReplyMarkup = keyboard

	if _, err := tw.bot.Send(msg); err != nil {
		fmt.Printf("Error sending web app button: %v\n", err)
	}
}

func (tw *TelegramWebApp) sendMessage(chatID int64, text string) {
	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"

	if _, err := tw.bot.Send(msg); err != nil {
		fmt.Printf("Error sending message: %v\n", err)
	}
}
