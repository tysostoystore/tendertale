package models

type Choice struct {
	Text      string `json:"text"`
	NextScene string `json:"next_scene"`
}

type DialogueLine struct {
	Speaker string `json:"speaker"`
	Text    string `json:"text"`
}

type Character struct {
	Name     string `json:"name"`
	Sprite   string `json:"sprite"`
	Position string `json:"position"`
}

type Scene struct {
	ID         string         `json:"id"`
	Background string         `json:"background"`
	Characters []Character    `json:"characters"`
	Dialogue   []DialogueLine `json:"dialogue"`
	Choices    []Choice       `json:"choices"`
}
