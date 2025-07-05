export function initAudioControls(app) {
  const backgroundMusic = document.getElementById('background-music');
  const playPauseMusicBtn = app.querySelector('#play-pause-music-btn');
  const muteMusicBtn = app.querySelector('#mute-music-btn');

  if (playPauseMusicBtn && backgroundMusic) {
    playPauseMusicBtn.addEventListener('click', () => {
      if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
          console.log('Music autoplay prevented by browser.', error);
          // displayMessage is in ui.js, will need to be passed or imported
          if (window.displayMessage) window.displayMessage("Автовоспроизведение музыки заблокировано. Нажмите еще раз для воспроизведения.", 'warning', 3000);
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
} 