package main

import (
	"encoding/json"
	"fmt"       // Import fmt for error printing
	"io/ioutil" // Import ioutil for reading the request body
	"net/http"
	"os"
	"path/filepath" // Import filepath for joining paths

	"tg_visual_backend/models" // Assuming tg_visual_backend is your module name

	"github.com/gin-contrib/cors" // Import the cors middleware
	"github.com/gin-gonic/gin"
)

// Struct to hold the request body for the /api/choice endpoint
type ChoiceRequest struct {
	UserID         string `json:"user_id"` // User ID is needed for saving
	CurrentSceneID string `json:"current_scene_id"`
	ChoiceIndex    int    `json:"choice_index"`
}

func loadScene(sceneID string) (*models.Scene, error) {
	filePath := filepath.Join("scenes", sceneID+".json") // Use filepath.Join for safety
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("scene file not found: %w", err)
	}
	defer file.Close()

	var scene models.Scene
	if err := json.NewDecoder(file).Decode(&scene); err != nil {
		return nil, fmt.Errorf("failed to parse scene JSON: %w", err)
	}
	return &scene, nil
}

// saveState writes a SaveState struct to a JSON file for the given user ID.
func saveState(userID string, state *models.SaveState) error {
	// Ensure the saves directory exists
	if _, err := os.Stat("saves"); os.IsNotExist(err) {
		os.Mkdir("saves", os.ModePerm) // Create the directory if it doesn't exist
	}

	filePath := filepath.Join("saves", userID+".json")
	data, err := json.MarshalIndent(state, "", "  ") // Use MarshalIndent for readability
	if err != nil {
		return fmt.Errorf("failed to marshal save state: %w", err)
	}

	err = ioutil.WriteFile(filePath, data, 0644) // 0644 is standard permission
	if err != nil {
		return fmt.Errorf("failed to write save file: %w", err)
	}
	return nil
}

// loadState reads a SaveState struct from a JSON file for the given user ID.
func loadState(userID string) (*models.SaveState, error) {
	filePath := filepath.Join("saves", userID+".json")
	file, err := os.Open(filePath)
	if err != nil {
		// It's okay if the file doesn't exist, means no save state yet
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("no save state found for user %s", userID)
		}
		return nil, fmt.Errorf("failed to open save file: %w", err)
	}
	defer file.Close()

	var state models.SaveState
	if err := json.NewDecoder(file).Decode(&state); err != nil {
		return nil, fmt.Errorf("failed to parse save state JSON: %w", err)
	}
	return &state, nil
}

func main() {
	r := gin.Default()

	// Configure and apply the CORS middleware
	// This allows requests from your frontend's origin
	config := cors.DefaultConfig()

	// Get allowed origins from environment variable or use defaults
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://192.168.10.8:5173",
	}

	// Add production origins if set
	if frontendUrl := os.Getenv("FRONTEND_URL"); frontendUrl != "" {
		allowedOrigins = append(allowedOrigins, frontendUrl)
	}

	// Add Vercel preview URLs (for development)
	allowedOrigins = append(allowedOrigins,
		"https://*.vercel.app",
		"https://*.railway.app",
	)

	config.AllowOrigins = allowedOrigins
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true

	r.Use(cors.New(config)) // Apply the CORS middleware to the router

	// Endpoint to get a specific scene by ID
	r.GET("/api/scene/:id", func(c *gin.Context) {
		id := c.Param("id")
		scene, err := loadScene(id)
		if err != nil {
			// Check if it's a file not found error specifically
			if os.IsNotExist(err) {
				c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Scene '%s' not found", id)})
			} else {
				// Log the error for debugging
				fmt.Printf("Error loading scene %s: %v\n", id, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load scene"})
			}
			return
		}
		c.JSON(http.StatusOK, scene)
	})

	// Endpoint to handle a user's choice and automatically save
	r.POST("/api/choice", func(c *gin.Context) {
		var req ChoiceRequest
		// Read the request body
		body, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
			return
		}
		// Bind the JSON body to the struct
		if err := json.Unmarshal(body, &req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
			return
		}

		// Load the current scene to validate the choice and find the next scene ID
		currentScene, err := loadScene(req.CurrentSceneID)
		if err != nil {
			if os.IsNotExist(err) {
				c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Current scene '%s' not found", req.CurrentSceneID)})
			} else {
				fmt.Printf("Error loading current scene %s: %v\n", req.CurrentSceneID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process choice"})
			}
			return
		}

		// Check if the choice index is valid
		if req.ChoiceIndex < 0 || req.ChoiceIndex >= len(currentScene.Choices) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid choice index"})
			return
		}

		// Get the ID of the next scene
		nextSceneID := currentScene.Choices[req.ChoiceIndex].NextScene

		// --- Save the state before loading the next scene ---
		stateToSave := &models.SaveState{
			CurrentSceneID: nextSceneID, // Save the ID of the scene they are *going to*
		}
		if err := saveState(req.UserID, stateToSave); err != nil {
			fmt.Printf("Warning: Failed to save state for user %s: %v\n", req.UserID, err)
			// Continue processing the choice even if save fails, but log the warning
		}
		// --- End Save ---

		// Load the next scene
		nextScene, err := loadScene(nextSceneID)
		if err != nil {
			// This is a critical error - a next scene is defined but doesn't exist
			fmt.Printf("Error loading next scene %s (from choice %d in scene %s): %v\n", nextSceneID, req.ChoiceIndex, req.CurrentSceneID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error loading next scene '%s'", nextSceneID)})
			return
		}

		// Return the next scene data
		c.JSON(http.StatusOK, nextScene)
	})

	// Endpoint to load a user's save state
	r.GET("/api/load/:user_id", func(c *gin.Context) {
		userID := c.Param("user_id")
		state, err := loadState(userID)
		if err != nil {
			// If no save state is found, return a specific status
			if err.Error() == fmt.Sprintf("no save state found for user %s", userID) {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			} else {
				fmt.Printf("Error loading state for user %s: %v\n", userID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load save state"})
			}
			return
		}
		// Return the loaded state, which includes the CurrentSceneID
		c.JSON(http.StatusOK, state)
	})

	// Endpoint to save a user's game state
	r.POST("/api/save/:user_id", func(c *gin.Context) {
		userID := c.Param("user_id")
		var req models.SaveState // Use SaveState model directly for the request body
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := saveState(userID, &req); err != nil {
			fmt.Printf("Error saving state for user %s: %v\n", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save game state"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Game state saved successfully"})
	})

	// Endpoint to delete a user's save state
	r.DELETE("/api/save/:user_id", func(c *gin.Context) {
		userID := c.Param("user_id")
		filePath := filepath.Join("saves", userID+".json")

		// Check if the file exists before attempting to delete
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("No save state found for user %s", userID)})
			return
		}

		if err := os.Remove(filePath); err != nil {
			fmt.Printf("Error deleting save state for user %s: %v\n", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete save state"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Save state deleted successfully"})
	})

	// Start Telegram Web App bot in a goroutine
	go func() {
		botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
		if botToken == "" {
			fmt.Println("Warning: TELEGRAM_BOT_TOKEN not set, Telegram Web App bot will not start")
			return
		}

		webApp, err := NewTelegramWebApp(botToken, "http://localhost:8080")
		if err != nil {
			fmt.Printf("Error creating Telegram Web App bot: %v\n", err)
			return
		}

		fmt.Println("Starting Telegram Web App bot...")
		webApp.Start()
	}()

	// Get port from environment variable (Railway sets this)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server is running on :%s\n", port)
	r.Run(":" + port)
}
