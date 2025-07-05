package models

// SaveState represents the user's progress in the game.
// For now, we'll just save the current scene ID.
// You can add more fields here later for player variables, flags, etc.
type SaveState struct {
	CurrentSceneID string `json:"current_scene_id"`
	// Add other game state variables here later, e.g.:
	// PlayerName string `json:"player_name"`
	// Inventory []string `json:"inventory"`
	// Flags map[string]bool `json:"flags"`
}
