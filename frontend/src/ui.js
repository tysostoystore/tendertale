// frontend/src/ui.js
import { fetchScene } from './api.js';
import { initAudioControls } from './audio.js';

// Function to display messages to the user
export function displayMessage(message, type = 'info', duration = 3000) {
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

export async function renderScene(scene, pushToHistory = true, { sceneHistory, handleChoiceClick, handlePreviousClick, handleNewGameClick, handleSaveGameClick, handleLoadGameClick, handleDeleteGameClick, getIsTyping, setIsTyping, getSkipTypingAnimation, setSkipTypingAnimation }) {
    console.log(`Rendering scene: ${scene.id}`);
    console.log(`Scene dialogue length: ${scene.dialogue.length}`);
    console.log(`Full scene dialogue:`, JSON.stringify(scene.dialogue, null, 2));
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
   // Reset dialogue state flags - these are now handled by getters/setters passed from gameLogic.js
    let dialogueClickResolver = null; // Variable to hold the resolve function for waiting for click
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
        // Attempt to play music on the first interaction (logic moved to audio.js now, but can keep this as initial trigger)
        const music = document.getElementById('background-music');
        if (music && music.paused) {
            music.play().catch(error => {
                console.log('Autoplay prevented. Music will start after another interaction.', error);
                displayMessage("Автовоспроизведение музыки заблокировано. Нажмите еще раз для воспроизведения.", 'warning', 3000);
            });
        }

        if (getIsTyping()) {
            // If currently typing, a click skips the typing animation
            setSkipTypingAnimation(true);
            // The dialogue will advance when typeCharacter resolves its promise
            return; // Exit here to prevent premature dialogue advancement
        } else if (dialogueClickResolver) {
            // If not typing, and there's a pending wait, a click advances the dialogue
            dialogueClickResolver(); // Resolve the promise to advance
            dialogueClickResolver = null; // Clear the resolver after use
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

  // Set the background image using inline style (now after innerHTML is set)
  if (scene.background) {
    console.log(`Setting background image to: url(${scene.background})`);
    app.style.backgroundImage = `url(/assets/${scene.background})`;
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
      charactersContainer.appendChild(img);
      characterElements.push(img); // Store the created element
  });

    // --- Trigger character entry animation ---
    await new Promise(resolve => setTimeout(resolve, 100)); // Short delay (100ms)

    characterElements.forEach(img => {
        img.classList.add('visible'); // Add visible class to trigger CSS transition
    });
    // --- End character entry animation ---


  // Add event listeners for menu buttons (these will be moved to gameLogic.js soon)
  // For now, they remain here as `renderScene` is responsible for attaching them
  const previousButton = app.querySelector('#previous-scene-btn');
  previousButton.addEventListener('click', () => handlePreviousClick());

  // Disable previous button in the first scene or if history is too short
  if (sceneHistory.length <= 1) { // sceneHistory will be from gameLogic
    previousButton.disabled = true;
  }

  app.querySelector('#start-new-game-btn').addEventListener('click', () => handleNewGameClick());

  // Add event listeners for Save and Load buttons
  const saveGameBtn = app.querySelector('#save-game-btn');
  const loadGameBtn = app.querySelector('#load-game-btn');
  const deleteGameBtn = app.querySelector('#delete-game-btn');

  if (saveGameBtn) {
    saveGameBtn.addEventListener('click', () => handleSaveGameClick());
  }

  if (loadGameBtn) {
    loadGameBtn.addEventListener('click', () => handleLoadGameClick());
  }

  if (deleteGameBtn) {
    deleteGameBtn.addEventListener('click', () => handleDeleteGameClick());
  }

  // Add event listeners for the new music controls (now inside renderScene)
  initAudioControls(app); // Call initAudioControls from audio.js

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
    if (currentSceneDialogueOverlay) {
        // No need to remove old listener here anymore, handled in initial cleanup
        currentSceneDialogueOverlay.addEventListener('click', handleDialogueClick);
        window.dialogueClickListener = handleDialogueClick; // Store the listener globally
    }

    const getRandomChar = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]|\\\":;'<>?,./";
        return chars.charAt(Math.floor(Math.random() * chars.length));
    };

    let fullDialogueLine = ''; // Defined here to be accessible within the loop
    let charIndex = 0; // Defined here to be accessible within the loop
    const typingSpeed = 25; // Milliseconds per character (ускорено)
    const scrambleEffectDuration = 10; // ms per scramble char (increased)
    const scrambleIterations = 3; // How many random chars to show before the real one

    // Цвета персонажей (легко расширять)
    const characterColors = {
        'Алиса': '#FFD700', // жёлтый
        // 'Май': '#2196F3', // пример для будущего
    };

    for (const line of scene.dialogue) {
        console.log(`Processing line:`, line);
        console.log(`Line has command:`, !!line.command);
        console.log(`Line command:`, line.command);
        
        // Check if the current line is a command
        if (line.command === 'change_sprite') {
            console.log(`Command: Change sprite for ${line.character} to ${line.sprite}`);
            const characterElement = charactersContainer.querySelector(`[data-character-name="${line.character}"]`);
            if (characterElement) {
                characterElement.src = `assets/${line.sprite}`; // Update the sprite source
                 // Optional: Add a brief pause after changing sprite
                await new Promise(resolve => setTimeout(resolve, 200)); // Pause for 200ms
            } else {
                console.warn(`Character element not found for: ${line.character}`);
            }
        } else if (line.command === 'add_character') {
            console.log(`Command: Add character ${line.character.name}`);
            const img = document.createElement('img');
            img.src = `assets/${line.character.sprite}`;
            img.alt = line.character.name;
            img.classList.add('character-sprite');
            img.classList.add(`character-${line.character.position}`);
            img.dataset.characterName = line.character.name;
            
            // Add error handling for image loading
            img.onerror = () => {
                console.error(`Failed to load sprite: assets/${line.character.sprite}`);
            };
            img.onload = () => {
                console.log(`Successfully loaded sprite: assets/${line.character.sprite}`);
            };
            
            charactersContainer.appendChild(img);
            
            // Add visible class immediately to show the character
            img.classList.add('visible');
            
            console.log(`Added character ${line.character.name} with sprite ${line.character.sprite}`);
            console.log(`Element classes:`, img.classList.toString());
            console.log(`Element position:`, img.offsetLeft, img.offsetTop);
            console.log(`Element size:`, img.offsetWidth, img.offsetHeight);
            
            // Add a brief pause after adding character
            await new Promise(resolve => setTimeout(resolve, 200));
        } else if (line.command === 'remove_character') {
            console.log(`Command: Remove character ${line.character_name}`);
            const characterElement = charactersContainer.querySelector(`[data-character-name="${line.character_name}"]`);
            if (characterElement) {
                characterElement.remove();
                // Add a brief pause after removing character
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                console.warn(`Character element not found for: ${line.character_name}`);
            }
        } else if (line.text) {
            // Цветное имя персонажа
            let speakerHtml = '';
            if (line.speaker) {
                const color = characterColors[line.speaker] || '#fff';
                speakerHtml = `<strong style="color: ${color}">${line.speaker}:</strong> `;
            }
            // Вставляем имя сразу, до анимации текста
            dialogueTextElement.innerHTML = speakerHtml;
            fullDialogueLine = line.text; // Только текст реплики анимируется
            charIndex = 0; // Reset for each new line

            let resolveLine;
            let currentTypingTimeout = null;
            let completedTypingAndResolved = false;

            const finishTyping = () => {
                if (completedTypingAndResolved) return;
                completedTypingAndResolved = true;
                // Показываем имя + всю реплику
                dialogueTextElement.innerHTML = speakerHtml + fullDialogueLine;
                if (currentTypingTimeout) {
                    clearTimeout(currentTypingTimeout);
                    currentTypingTimeout = null;
                }
                setIsTyping(false);
                setSkipTypingAnimation(false);
                resolveLine();
            };

            const typeCharacter = () => {
                if (getSkipTypingAnimation()) {
                    finishTyping();
                    return;
                }
                if (charIndex < fullDialogueLine.length) {
                    const char = fullDialogueLine.charAt(charIndex);
                    setIsTyping(true);
                    // Создаём span для символа и анимируем его
                    const currentCharSpan = document.createElement('span');
                    currentCharSpan.textContent = char;
                    currentCharSpan.classList.add('fade-in-char');
                    dialogueTextElement.appendChild(currentCharSpan);
                    charIndex++;
                    if (!getSkipTypingAnimation() && charIndex < fullDialogueLine.length) {
                        currentTypingTimeout = setTimeout(typeCharacter, typingSpeed);
                    } else {
                        finishTyping();
                    }
                } else {
                    finishTyping();
                }
            };
            await new Promise(resolve => { resolveLine = resolve; typeCharacter(); });
        }
        await waitForClick(); // Wait for click after each dialogue line
    }

    // --- Display Choices ---
    const choicesContainer = app.querySelector('#choices-container');
    choicesContainer.innerHTML = ''; // Clear previous choices
    if (scene.choices && scene.choices.length > 0) {
        choicesContainer.style.display = 'block'; // Show choices container
        scene.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.classList.add('choice-button'); // Add a class for styling
            button.addEventListener('click', () => handleChoiceClick(scene.id, index));
            choicesContainer.appendChild(button);
        });
    } else {
        choicesContainer.style.display = 'none'; // Hide choices if none
    }
}