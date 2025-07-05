import { fetchScene, saveGame, loadGame, deleteGame } from './api.js';
import { renderScene, displayMessage } from './ui.js';

const USER_ID = "test_user_123"; // Or fetch dynamically
let currentSceneId = 'scene_1'; // Default starting scene
let sceneHistory = []; // To keep track of visited scenes for a "back" button
let isTyping = false; // Moved from ui.js
let skipTypingAnimation = false; // Moved from ui.js

// Getters and setters for isTyping and skipTypingAnimation
function getIsTyping() {
  return isTyping;
}

function setIsTyping(value) {
  isTyping = value;
}

function getSkipTypingAnimation() {
  return skipTypingAnimation;
}

function setSkipTypingAnimation(value) {
  skipTypingAnimation = value;
}

// Exposed to window for UI elements to call
window.handleChoiceClick = async (currentSceneIdFromChoice, choiceIndex) => {
  console.log(`Choice made in scene ${currentSceneIdFromChoice}, choice index ${choiceIndex}`);
  try {
    // Fetch the current scene to get choice details
    const currentScene = await fetchScene(currentSceneIdFromChoice);
    console.log('Fetched currentScene:', currentScene);
    if (!currentScene) {
      displayMessage("Ошибка: Текущая сцена не найдена для выбора.", 'error');
      return;
    }

    console.log('Current scene choices:', currentScene.choices);
    console.log('Chosen choice object:', currentScene.choices ? currentScene.choices[choiceIndex] : 'Choices array is null/undefined');

    // Corrected: Use 'next_scene' as per backend JSON structure
    const chosenNextSceneId = currentScene.choices[choiceIndex].next_scene;
    if (chosenNextSceneId) {
      currentSceneId = chosenNextSceneId; // Update global currentSceneId
      const nextScene = await fetchScene(chosenNextSceneId);
      await renderScene(nextScene, true, {
        sceneHistory,
        handleChoiceClick: window.handleChoiceClick,
        handlePreviousClick: window.handlePreviousClick,
        handleNewGameClick: window.handleNewGameClick,
        handleSaveGameClick: window.handleSaveGameClick,
        handleLoadGameClick: window.handleLoadGameClick,
        handleDeleteGameClick: window.handleDeleteGameClick,
        getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
      });
    } else {
      displayMessage("Ошибка: Следующая сцена не определена для этого выбора.", 'error');
    }
  } catch (error) {
    displayMessage(`Ошибка при выборе: ${error.message}`, 'error');
    console.error('Error processing choice:', error);
  }
};

window.handlePreviousClick = async () => {
  console.log("Previous button clicked.");
  if (sceneHistory.length > 1) {
    sceneHistory.pop(); // Remove current scene
    const previousSceneId = sceneHistory[sceneHistory.length - 1]; // Get previous scene
    try {
      const previousScene = await fetchScene(previousSceneId);
      // Render without pushing to history to avoid duplicates when going back
      await renderScene(previousScene, false, {
        sceneHistory,
        handleChoiceClick: window.handleChoiceClick,
        handlePreviousClick: window.handlePreviousClick,
        handleNewGameClick: window.handleNewGameClick,
        handleSaveGameClick: window.handleSaveGameClick,
        handleLoadGameClick: window.handleLoadGameClick,
        handleDeleteGameClick: window.handleDeleteGameClick,
        getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
      });
      currentSceneId = previousSceneId; // Update global currentSceneId
    } catch (error) {
      displayMessage(`Ошибка загрузки предыдущей сцены: ${error.message}`, 'error');
      console.error("Error loading previous scene:", error);
    }
  } else {
    displayMessage("Это первая сцена. Некуда возвращаться.", 'warning');
    console.log("No previous scene to go back to.");
  }
};

window.handleNewGameClick = async () => {
  console.log("Start New Game button clicked.");
  sceneHistory = []; // Clear history
  currentSceneId = 'scene_1'; // Reset to initial scene
  try {
    const initialScene = await fetchScene(currentSceneId);
    await renderScene(initialScene, true, {
      sceneHistory,
      handleChoiceClick: window.handleChoiceClick,
      handlePreviousClick: window.handlePreviousClick,
      handleNewGameClick: window.handleNewGameClick,
      handleSaveGameClick: window.handleSaveGameClick,
      handleLoadGameClick: window.handleLoadGameClick,
      handleDeleteGameClick: window.handleDeleteGameClick,
      getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
    });
    displayMessage("Новая игра начата!", 'success');
  } catch (error) {
    displayMessage(`Ошибка при запуске новой игры: ${error.message}`, 'error');
    console.error("Error starting new game:", error);
  }
};

window.handleSaveGameClick = async () => {
  console.log("Save Game button clicked.");
  if (currentSceneId) {
    const result = await saveGame(USER_ID, currentSceneId);
    if (result.success) {
      displayMessage(result.message, 'success');
    } else {
      displayMessage(result.message, 'error');
    }
  } else {
    displayMessage("Невозможно сохранить: текущая сцена не определена.", 'warning');
  }
};

window.handleLoadGameClick = async () => {
  console.log("Load Game button clicked.");
  const result = await loadGame(USER_ID);
  if (result.success) {
    const saveState = result.saveState;
    if (saveState && saveState.current_scene_id) {
      currentSceneId = saveState.current_scene_id; // Update global currentSceneId
      try {
        const loadedScene = await fetchScene(currentSceneId);
        sceneHistory = saveState.scene_history || []; // Load scene history as well
        await renderScene(loadedScene, false, {
          sceneHistory,
          handleChoiceClick: window.handleChoiceClick,
          handlePreviousClick: window.handlePreviousClick,
          handleNewGameClick: window.handleNewGameClick,
          handleSaveGameClick: window.handleSaveGameClick,
          handleLoadGameClick: window.handleLoadGameClick,
          handleDeleteGameClick: window.handleDeleteGameClick,
          getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
        });
        displayMessage("Предыдущая игра загружена!", 'success');
      } catch (error) {
        displayMessage(`Ошибка загрузки сцены из сохранения: ${error.message}`, 'error');
        console.error("Error loading scene from save state:", error);
      }
    } else {
      displayMessage("Загруженное состояние сохранения недействительно.", 'error');
    }
  } else {
    displayMessage(result.message, 'warning');
  }
};

window.handleDeleteGameClick = async () => {
  console.log("Delete Save button clicked.");
  const result = await deleteGame(USER_ID);
  if (result.success) {
    displayMessage(result.message, 'success');
    // Reset game state after deletion
    sceneHistory = [];
    currentSceneId = 'scene_1';
    try {
      const initialScene = await fetchScene(currentSceneId);
      await renderScene(initialScene, true, {
        sceneHistory,
        handleChoiceClick: window.handleChoiceClick,
        handlePreviousClick: window.handlePreviousClick,
        handleNewGameClick: window.handleNewGameClick,
        handleSaveGameClick: window.handleSaveGameClick,
        handleLoadGameClick: window.handleLoadGameClick,
        handleDeleteGameClick: window.handleDeleteGameClick,
        getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
      });
    } catch (error) {
      displayMessage(`Ошибка сброса игры после удаления сохранения: ${error.message}`, 'error');
      console.error("Error resetting game after save deletion:", error);
    }
  } else {
    displayMessage(result.message, 'error');
  }
};

// Initial game load logic
export async function startGame() {
  try {
    const initialScene = await fetchScene(currentSceneId);
    // Pass all necessary functions explicitly to renderScene
    await renderScene(initialScene, true, {
      sceneHistory,
      handleChoiceClick: window.handleChoiceClick,
      handlePreviousClick: window.handlePreviousClick,
      handleNewGameClick: window.handleNewGameClick,
      handleSaveGameClick: window.handleSaveGameClick,
      handleLoadGameClick: window.handleLoadGameClick,
      handleDeleteGameClick: window.handleDeleteGameClick,
      getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation
    });
  } catch (error) {
    displayMessage(`Ошибка при загрузке начальной сцены: ${error.message}`, 'error');
    console.error('Error loading initial scene:', error);
  }
} 