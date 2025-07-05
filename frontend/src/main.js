import './style.css' // Assuming you have a style.css
import { startGame } from './gameLogic.js';

// Array to keep track of visited scene IDs (history stack)
const sceneHistory = [];

// Flag to indicate if the user wants to skip the typing animation
let skipTypingAnimation = false;

// Function to display messages to the user
function displayMessage(message, type = 'info', duration = 3000) {
  const messageDisplay = document.getElementById('message-display');
  if (messageDisplay) {
    messageDisplay.textContent = message;
    messageDisplay.style.display = 'block';
    messageDisplay.style.opacity = '1'; // Ensure it's fully visible for fade-in

    let bgColor;
    switch (type) {
      case 'success':
        bgColor = 'rgba(46, 204, 113, 0.9)'; // Green
        break;
      case 'warning':
        bgColor = 'rgba(241, 196, 15, 0.9)';  // Yellow
        break;
      case 'error':
        bgColor = 'rgba(231, 76, 60, 0.9)';   // Red
        break;
      default:
        bgColor = 'rgba(0,0,0,0.7)'; // Default black
    }
    messageDisplay.style.backgroundColor = bgColor;

    // Automatically hide after duration
    setTimeout(() => {
      messageDisplay.style.opacity = '0'; // Start fade-out
      setTimeout(() => {
        messageDisplay.style.display = 'none';
      }, 500); // Wait for transition to complete (0.5s fade-out)
    }, duration);
  }
}

// Function to fetch scene data from the backend
async function fetchScene(sceneId) {
  try {
    const response = await fetch(`http://localhost:8080/api/scene/${sceneId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}`, errorText);
      displayMessage(`Ошибка загрузки сцены "${sceneId}": ${response.status} - ${errorText}`, 'error', 5000);
      return null;
    }

    const sceneData = await response.json();
    console.log('Fetched scene:', sceneData);
    return sceneData;

  } catch (error) {
    console.error('Error fetching scene:', error);
    displayMessage(`Error connecting to backend! Details: ${error.message}. Please ensure your Go backend is running at http://localhost:8080.`, 'error', 5000);
    return null;
  }
}

// Function to render the scene data on the page
async function renderScene(scene, pushToHistory = true) {
  if (!scene) {
    return; // Don't render if scene data is null
  }

   // --- Cleanup state from previous scene ---
   // Remove any lingering dialogue click listener
   const previousDialogueOverlay = document.querySelector('#dialogue-overlay'); // Get element from previous scene HTML
   if (previousDialogueOverlay && window.dialogueClickListener) {
       previousDialogueOverlay.removeEventListener('click', window.dialogueClickListener);
        window.dialogueClickListener = null;
    }
   // Reset dialogue state flags  
    let isTyping = false;
    let dialogueClickResolver = null; // Variable to hold the resolve function for waiting for click
    skipTypingAnimation = false; // Global flag reset
    // --- End Cleanup ---

    // Function to wait for a click on the dialogue overlay
    const waitForClick = () => {
        return new Promise(resolve => {
            // Store the resolver locally (scoped to this renderScene call)
            dialogueClickResolver = resolve;
        });
    };

    // Function to handle clicks on the dialogue overlay
    const handleDialogueClick = () => {
        // Attempt to play music on the first interaction
        const music = document.getElementById('background-music');
        if (music && music.paused) {
            music.play().catch(error => {
                console.log('Autoplay prevented. Music will start after another interaction.', error);
                // Handle cases where autoplay is still blocked
            });
        }

        if (isTyping) {
            // If currently typing, a click skips the typing animation
            skipTypingAnimation = true;
        } else if (dialogueClickResolver) {
            // If not typing, and there's a pending wait, a click advances the dialogue
            dialogueClickResolver(); // Resolve the promise to advance
        }
         // If not typing and no pending wait, this click is ignored
    };


  const app = document.querySelector('#app');

  // --- Fade out the current scene ---
  app.classList.add('fade-out');

  // Wait for the fade-out transition to complete
  // We listen for the 'transitionend' event on the element
  await new Promise(resolve => {
      app.addEventListener('transitionend', resolve, { once: true });
  });
  // --- End Fade Out ---


  // Set the background image using inline style (now after fade out)
  if (scene.background) {
    app.style.backgroundImage = `url(${scene.background})`;
    app.style.backgroundSize = 'cover'; // Optional: make the background cover the entire container
    app.style.backgroundPosition = 'center'; // Optional: center the background image
    app.style.backgroundRepeat = 'no-repeat'; // Optional: prevent tiling
  } else {
    app.style.backgroundImage = ''; // Clear background if no background is specified
  }

  // Push the current scene ID to history, unless specifically told not to (e.g., when going back)
  if (pushToHistory) {
    // Prevent pushing the same scene ID multiple times if just refreshing
    if (sceneHistory.length === 0 || sceneHistory[sceneHistory.length - 1] !== scene.id) {
      sceneHistory.push(scene.id);
      console.log("Scene History:", sceneHistory);
    }
  }

  // Store character data globally or pass it around if needed for animations
  window.currentCharacters = scene.characters; // Simple way to access characters

  // Basic structure with menu button, menu container, character container, dialogue, and choices
  // (This happens after fade out and before fade in)
  app.innerHTML = `
    <button id="menu-toggle-btn" aria-label="Toggle Menu">☰</button>
    <div id="game-menu">
        <h2>Game Menu</h2>
        <button id="previous-scene-btn">Previous Scene</button>
        <button id="start-new-game-btn">Start New Game</button>
        <button id="save-game-btn">Save Game</button>
        <button id="load-game-btn">Load Game</button>
        <button id="delete-game-btn">Delete Save</button>
        <div id="menu-music-controls" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
            <h3>Music</h3>
            <button id="play-pause-music-btn">Play</button>
            <button id="mute-music-btn">Mute</button>
        </div>
    </div>

    <div id="characters-container"></div> <!-- Container for character sprites -->

    <h1>Visual Novel Scene</h1>
    <p><strong>Scene ID:</strong> ${scene.id}</p>
    <div id="dialogue">
      <div id="dialogue-text"></div> <!-- This is where animated text will appear -->
       <div id="dialogue-overlay"></div> <!-- Overlay to capture clicks -->
    </div>
    <div id="choices-container" style="display: none;"> <!-- Hide choices initially -->
      <h2>Choices:</h2>
    </div>
  `;

  // Display characters after setting innerHTML
  const charactersContainer = app.querySelector('#characters-container');
  // Clear previous characters before adding new ones
  charactersContainer.innerHTML = '';
  const characterElements = []; // Store character image elements

  scene.characters.forEach(char => {
      const img = document.createElement('img');
      img.src = `assets/${char.sprite}`; // Assuming sprites are in frontend/assets/
      img.alt = char.name; // Add alt text for accessibility
      img.classList.add('character-sprite'); // Add a class for general styling
      img.classList.add(`character-${char.position}`); // Add a class for positioning
      img.dataset.characterName = char.name; // Add data attribute for easy selection
      // Sprites are initially off-screen and invisible due to CSS
      charactersContainer.appendChild(img);
      characterElements.push(img); // Store the created element
  });

    // --- Trigger character entry animation ---
    // Wait a moment after the scene fades in before characters slide up
    await new Promise(resolve => setTimeout(resolve, 100)); // Short delay (100ms)

    characterElements.forEach(img => {
        img.classList.add('visible'); // Add visible class to trigger CSS transition
    });
    // --- End character entry animation ---


  // Add event listeners for menu buttons
  const previousButton = app.querySelector('#previous-scene-btn');
  previousButton.addEventListener('click', handlePreviousClick);

  // Disable previous button in the first scene or if history is too short
  if (sceneHistory.length <= 1) {
    previousButton.disabled = true;
  }

  app.querySelector('#start-new-game-btn').addEventListener('click', handleNewGameClick);

  // Add event listeners for Save and Load buttons
  const saveGameBtn = app.querySelector('#save-game-btn');
  const loadGameBtn = app.querySelector('#load-game-btn');

  if (saveGameBtn) {
    saveGameBtn.addEventListener('click', handleSaveGameClick);
  }

  if (loadGameBtn) {
    loadGameBtn.addEventListener('click', handleLoadGameClick);
  }

  const deleteGameBtn = app.querySelector('#delete-game-btn');
  if (deleteGameBtn) {
    deleteGameBtn.addEventListener('click', handleDeleteGameClick);
  }

  // Add event listeners for the new music controls (now inside renderScene)
  const backgroundMusic = document.getElementById('background-music');
  const playPauseMusicBtn = app.querySelector('#play-pause-music-btn');
  const muteMusicBtn = app.querySelector('#mute-music-btn');

  if (playPauseMusicBtn && backgroundMusic) {
    playPauseMusicBtn.addEventListener('click', () => {
      if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
          console.log('Music autoplay prevented by browser.', error);
          displayMessage("Music autoplay prevented. Please click again to play.", 'info', 3000);
        });
        playPauseMusicBtn.textContent = 'Pause';
      } else {
        backgroundMusic.pause();
        playPauseMusicBtn.textContent = 'Play';
      }
    });
  }

  if (muteMusicBtn && backgroundMusic) {
    muteMusicBtn.addEventListener('click', () => {
      backgroundMusic.muted = !backgroundMusic.muted;
      muteMusicBtn.textContent = backgroundMusic.muted ? 'Unmute' : 'Mute';
    });
  }

  // Initialize button text based on current state (only if buttons exist)
  if (playPauseMusicBtn && backgroundMusic) {
    playPauseMusicBtn.textContent = backgroundMusic.paused ? 'Play' : 'Pause';
  }
  if (muteMusicBtn && backgroundMusic) {
    muteMusicBtn.textContent = backgroundMusic.muted ? 'Unmute' : 'Mute';
  }

  // Add event listener for the menu toggle button
  app.querySelector('#menu-toggle-btn').addEventListener('click', () => {
      document.querySelector('#game-menu').classList.toggle('visible');
  });

   // Optional: Close menu if clicking outside (simple version)
    app.addEventListener('click', (event) => {
        const menu = document.querySelector('#game-menu');
        const menuToggleBtn = app.querySelector('#menu-toggle-btn'); // Use app.querySelector here
        // Check if the click target is NOT the menu or the toggle button
        if (menu && menuToggleBtn && !menu.contains(event.target) && event.target !== menuToggleBtn && menu.classList.contains('visible')) {
            menu.classList.remove('visible');
        }
    });

    // Prevent clicks inside the menu from closing it (stops propagation)
     const gameMenu = app.querySelector('#game-menu');
     if(gameMenu) {
        gameMenu.addEventListener('click', (event) => {
            event.stopPropagation();
        });
     }

    // --- Fade in the new scene and start dialogue animation ---
    app.classList.remove('fade-out');

    // Wait for the fade-in transition to complete before starting dialogue
     await new Promise(resolve => {
        app.addEventListener('transitionend', function handler(event) {
             // Ensure the transition is for opacity on the target element
             if (event.propertyName === 'opacity' && event.target === app) {
                 app.removeEventListener('transitionend', handler);
                 resolve();
             }
        });
     });
     // --- End Fade In ---


    // --- Dialogue Animation ---
    const dialogueTextElement = app.querySelector('#dialogue-text');
    // Re-get the overlay element as innerHTML was reset
    const currentSceneDialogueOverlay = app.querySelector('#dialogue-overlay');

    // Add the click listener to the overlay AFTER it's created in app.innerHTML
    if (currentSceneDialogueOverlay) {
        // No need to remove old listener here anymore, handled in initial cleanup
        currentSceneDialogueOverlay.addEventListener('click', handleDialogueClick);
        window.dialogueClickListener = handleDialogueClick; // Store the listener globally
    }

    for (const line of scene.dialogue) {
        // Check if the current line is a command
        if (line.command === 'change_sprite') {
            console.log(`Command: Change sprite for ${line.character} to ${line.sprite}`);
            const characterElement = charactersContainer.querySelector(`[data-character-name="${line.character}"]`);
            if (characterElement) {
                characterElement.src = `assets/${line.sprite}`; // Update the sprite source
                 // Optional: Add a brief pause after changing sprite
                await new Promise(resolve => setTimeout(resolve, 200)); // Pause for 200ms
            } else {
                console.warn(`Character element not found for sprite change command: ${line.character}`);
            }
            // After processing a command, we immediately move to the next loop iteration
            continue;
        }

        // If it's a regular dialogue line:
        const speakerSpan = line.speaker ? `<strong>${line.speaker}:</strong> ` : '';
        const fullText = speakerSpan + line.text;
        dialogueTextElement.innerHTML = ''; // Clear for the new line
        let currentText = '';
        skipTypingAnimation = false; // Reset skip flag for the new line
        isTyping = true; // Set typing flag

        // Typing effect for each character
        for (let i = 0; i < fullText.length; i++) {
            if (skipTypingAnimation) { // Check global skip flag
                currentText = fullText; // Show full text immediately
                break; // Exit the typing loop
            }
            currentText += fullText[i];
            dialogueTextElement.innerHTML = currentText;
            await new Promise(resolve => setTimeout(resolve, 30)); // Typing speed
        }
         dialogueTextElement.innerHTML = fullText; // Ensure full text is shown after loop/skip
         isTyping = false; // Typing finished for this line

        // Wait for user click to advance to the next line (or next command)
        await waitForClick();

         // dialogueClickResolver is cleared within handleDialogueClick when resolved
    }

    // --- Display Choices After Dialogue ---
    const choicesContainer = app.querySelector('#choices-container');
    choicesContainer.innerHTML = '<h2>Choices:</h2>';
    scene.choices.map((choice, index) => {
        const button = document.createElement('button');
        button.dataset.choiceIndex = index;
        button.dataset.currentSceneId = scene.id;
        button.textContent = choice.text;
        button.addEventListener('click', handleChoiceClick);
        choicesContainer.appendChild(button);
        return button; // Return button element for potential future use
    });

    choicesContainer.style.display = 'flex'; // Make choices visible

    // Hide the dialogue overlay after choices appear
    const finalDialogueOverlay = app.querySelector('#dialogue-overlay');
    if (finalDialogueOverlay) {
       finalDialogueOverlay.style.display = 'none';
    }

    // Remove the dialogue click listener when dialogue is done
    if (window.dialogueClickListener) {
        // Check if the overlay element still exists before removing listener
         const currentOverlay = document.querySelector('#dialogue-overlay');
         if (currentOverlay) {
             currentOverlay.removeEventListener('click', window.dialogueClickListener);
         }
        window.dialogueClickListener = null;
    }
     skipTypingAnimation = false; // Reset the skip flag
     // isTyping and dialogueClickResolver are local to renderScene and will be garbage collected
     // No need to explicitly reset them here outside their scope.
}

// Function to handle choice clicks
async function handleChoiceClick(event) {
    // Hide choices immediately after a choice is made
    document.querySelector('#choices-container').style.display = 'none';
    // Show the dialogue overlay again while next scene loads/types
    // The overlay will be recreated and listeners re-added in the next renderScene call
    const dialogueOverlay = document.querySelector('#dialogue-overlay');
    if (dialogueOverlay) {
       dialogueOverlay.style.display = 'block';
    }

    // Removed cleanup lines as they are now handled at the start of renderScene
    // if (window.dialogueClickListener) {
    //    document.querySelector('#dialogue-overlay').removeEventListener('click', window.dialogueClickListener);
    //     window.dialogueClickListener = null;
    // }
    // skipTypingAnimation = false;
    // isTyping = false;
    // dialogueClickResolver = null; // This was the main error cause

    const choiceIndex = parseInt(event.target.dataset.choiceIndex); // Get index from data attribute
    const currentSceneId = event.target.dataset.currentSceneId; // Get current scene ID
    const dummyUserId = "test_user_123"; // Use the same dummy ID

    console.log(`Choice ${choiceIndex} clicked in scene ${currentSceneId}. Sending to backend.`);

    try {
        // Send choice data to the backend
        const response = await fetch(`http://localhost:8080/api/choice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: dummyUserId,
                current_scene_id: currentSceneId,
                choice_index: choiceIndex
            })
        });

        if (!response.ok) {
             const errorText = await response.text();
             console.error(`HTTP error processing choice! status: ${response.status}`, errorText);
             displayMessage(`Failed to process choice: ${errorText}`, 'error');
             return;
        }

        // Get the next scene data from the response
        const nextScene = await response.json();
        console.log('Received next scene:', nextScene);

        // Render the next scene (pushToHistory is true by default)
        await renderScene(nextScene);

    } catch (error) {
        console.error('Error sending choice to backend:', error);
        displayMessage(`Error processing choice: ${error.message}`, 'error');
    }
}

// Function to handle going back to the previous scene
async function handlePreviousClick() {
    console.log("Previous Scene button clicked.");

    // Need at least two scenes in history to go back (current + previous)
    if (sceneHistory.length < 2) {
        console.warn("Cannot go back. History too short.");
        return;
    }

    // Pop the current scene
    sceneHistory.pop();
    // Get the ID of the previous scene
    const previousSceneId = sceneHistory[sceneHistory.length - 1];

    console.log("Going back to scene:", previousSceneId);
    console.log("Scene History after pop:", sceneHistory);

    // Fetch and render the previous scene, but DO NOT push it back to history
    const previousScene = await fetchScene(previousSceneId);
    if (previousScene) {
         await renderScene(previousScene, false); // Pass false to prevent pushing to history
    }
}

// Function to handle starting a new game (optional, clears save)
async function handleNewGameClick() {
    console.log("Start New Game button clicked.");
     displayMessage("Starting a new game!", 'info');

     // Clear history on new game
     sceneHistory.length = 0;
     console.log("Scene History cleared.");

     const initialScene = await fetchScene('scene_1');
     await renderScene(initialScene);

     // TODO: Implement backend call to delete save file for dummy_user_123
     // This would require a new endpoint on the backend, e.g., DELETE /api/save/:user_id
}

// --- Save/Load Game Functions ---
async function handleSaveGameClick() {
  const userID = "test_user_123"; // Or retrieve from a user session/login
  // The current scene ID is the last one in the history stack
  const currentSceneID = sceneHistory[sceneHistory.length - 1];

  if (!currentSceneID) {
    console.warn("No scene to save. Play the game first!");
    displayMessage("No game progress to save. Play the game first!", 'info');
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/api/save/${userID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ CurrentSceneID: currentSceneID }),
    });

    if (response.ok) {
      console.log("Game saved successfully!");
      displayMessage("Game Saved!", 'info');
    } else {
      const errorText = await response.text();
      console.error(`Error saving game: ${response.status}`, errorText);
      displayMessage(`Failed to save game: ${errorText}`, 'error');
    }
  } catch (error) {
    console.error("Network error during save:", error);
    displayMessage("Could not connect to the backend to save the game.", 'error', 5000);
  }
}

async function handleLoadGameClick() {
  const userID = "test_user_123"; // Or retrieve from a user session/login

  try {
    const response = await fetch(`http://localhost:8080/api/load/${userID}`);

    if (response.ok) {
      const saveState = await response.json();
      console.log("Loaded save state:", saveState);
      displayMessage("Game Loaded!", 'info');
      // Render the scene from the loaded save state
      // Clear history and push the loaded scene, so 'Previous Scene' works correctly
      sceneHistory.length = 0; // Clear history
      const loadedScene = await fetchScene(saveState.current_scene_id);
      renderScene(loadedScene, true); // Push to history
    } else if (response.status === 404) {
      console.log("No save game found for this user.");
      displayMessage("No saved game found! Starting new game.", 'info');
      // Optionally, load a default scene or guide the user to start a new game
      const initialScene = await fetchScene("scene_1"); // Fallback to scene_1
      renderScene(initialScene, true);
    } else {
      const errorText = await response.text();
      console.error(`Error loading game: ${response.status}`, errorText);
      displayMessage(`Failed to load game: ${errorText}`, 'error');
    }
  } catch (error) {
    console.error("Network error during load:", error);
    displayMessage("Could not connect to the backend to load the game.", 'error', 5000);
  }
}

// --- Delete Game Function ---
async function handleDeleteGameClick() {
  const userID = "test_user_123"; // Or retrieve from a user session/login

  if (!confirm("Вы уверены, что хотите удалить сохраненную игру? Это действие необратимо!")) {
    return; // User cancelled
  }

  try {
    const response = await fetch(`http://localhost:8080/api/save/${userID}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log("Game save deleted successfully!");
      displayMessage("Сохранение удалено! Начинаем новую игру.", 'success');
      // After deleting save, reset to the first scene
      sceneHistory.length = 0; // Clear history
      const initialScene = await fetchScene("scene_1");
      renderScene(initialScene, true);
    } else if (response.status === 404) {
      console.log("No save game found to delete for this user.");
      displayMessage("Нет сохранения для удаления.", 'info');
    } else {
      const errorText = await response.text();
      console.error(`Error deleting game save: ${response.status}`, errorText);
      displayMessage(`Не удалось удалить сохранение: ${errorText}`, 'error');
    }
  } catch (error) {
    console.error("Network error during delete:", error);
    displayMessage("Не удалось подключиться к бэкенду для удаления сохранения.", 'error', 5000);
  }
}

// Initial scene load when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  startGame();
});

