const API_BASE_URL = 'https://tendertale-production.up.railway.app';

export async function fetchScene(sceneId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scene/${sceneId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}`, errorText);
      // displayMessage is defined in ui.js, so we need to import it or pass it
      throw new Error(`Ошибка загрузки сцены "${sceneId}": ${response.status} - ${errorText}`);
    }

    const sceneData = await response.json();
    console.log('Fetched scene:', sceneData);
    return sceneData;

  } catch (error) {
    console.error('Error fetching scene:', error);
    throw new Error(`Error connecting to backend! Details: ${error.message}. Please ensure your Go backend is running at ${API_BASE_URL}.`);
  }
}

export async function saveGame(userID, currentSceneID) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save/${userID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ CurrentSceneID: currentSceneID }),
    });

    if (response.ok) {
      console.log("Game saved successfully!");
      return { success: true, message: "Игра сохранена!" };
    } else {
      const errorText = await response.text();
      console.error(`Error saving game: ${response.status}`, errorText);
      return { success: false, message: `Не удалось сохранить игру: ${errorText}` };
    }
  } catch (error) {
    console.error("Network error during save:", error);
    return { success: false, message: "Не удалось подключиться к бэкенду для сохранения игры." };
  }
}

export async function loadGame(userID) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/load/${userID}`);

    if (response.ok) {
      const saveState = await response.json();
      console.log("Game loaded successfully:", saveState);
      return { success: true, saveState: saveState, message: "Игра загружена!" };
    } else if (response.status === 404) {
      console.log("No save game found for this user.");
      return { success: false, message: "Сохраненная игра не найдена." };
    } else {
      const errorText = await response.text();
      console.error(`Error loading game: ${response.status}`, errorText);
      return { success: false, message: `Не удалось загрузить игру: ${errorText}` };
    }
  } catch (error) {
    console.error("Network error during load:", error);
    return { success: false, message: "Не удалось подключиться к бэкенду для загрузки игры." };
  }
}

export async function deleteGame(userID) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save/${userID}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log("Game save deleted successfully!");
      return { success: true, message: "Сохранение удалено! Начинаем новую игру." };
    } else if (response.status === 404) {
      console.log("No save game found to delete for this user.");
      return { success: false, message: "Нет сохранения для удаления." };
    } else {
      const errorText = await response.text();
      console.error(`Error deleting game save: ${response.status}`, errorText);
      return { success: false, message: `Не удалось удалить сохранение: ${errorText}` };
    }
  } catch (error) {
    console.error("Network error during delete:", error);
    return { success: false, message: "Не удалось подключиться к бэкенду для удаления сохранения." };
  }
} 