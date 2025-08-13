/* Darkfall Depths - Управление настройками */

import { gameState, canvas, DPR } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';

export class SettingsManager {
  static saveSettings() {
    const settings = {
      enabled: gameState.audio.enabled,
      masterVolume: gameState.audio.masterVolume,
      musicVolume: gameState.audio.musicVolume,
      sfxVolume: gameState.audio.sfxVolume
    };
    localStorage.setItem('darkfall_settings', JSON.stringify(settings));
  }

  static loadSettings() {
    const saved = localStorage.getItem('darkfall_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      gameState.audio = { ...gameState.audio, ...settings };
      
      // Инициализируем настройки в главном меню
      this.initializeMainMenuAudioSettings();
    }
  }

  static setupAudioEventListeners() {
    console.log('🔧 Setting up audio event listeners...');
    
    // Обработчики для элементов управления звуком в главном меню
    const masterVol = document.getElementById('masterVol');
    const musicVol = document.getElementById('musicVol');
    const sfxVol = document.getElementById('sfxVol');
    const muteToggle = document.getElementById('muteToggle');

    if (masterVol && !masterVol.hasAttribute('data-audio-listener')) {
      masterVol.setAttribute('data-audio-listener', 'true');
      masterVol.addEventListener('input', () => {
        gameState.audio.masterVolume = parseFloat(masterVol.value);
        const masterVolText = document.getElementById('masterVolText');
        if (masterVolText) masterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
    }

    if (musicVol && !musicVol.hasAttribute('data-audio-listener')) {
      musicVol.setAttribute('data-audio-listener', 'true');
      musicVol.addEventListener('input', () => {
        gameState.audio.musicVolume = parseFloat(musicVol.value);
        const musicVolText = document.getElementById('musicVolText');
        if (musicVolText) musicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
    }

    if (sfxVol && !sfxVol.hasAttribute('data-audio-listener')) {
      sfxVol.setAttribute('data-audio-listener', 'true');
      sfxVol.addEventListener('input', () => {
        gameState.audio.sfxVolume = parseFloat(sfxVol.value);
        const sfxVolText = document.getElementById('sfxVolText');
        if (sfxVolText) sfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
        this.saveSettings();
      });
    }

    if (muteToggle && !muteToggle.hasAttribute('data-audio-listener')) {
      muteToggle.setAttribute('data-audio-listener', 'true');
      muteToggle.addEventListener('click', () => {
        gameState.audio.enabled = !gameState.audio.enabled;
        muteToggle.textContent = gameState.audio.enabled ? '🔇 Выключить звук' : '🔊 Включить звук';
        
        if (gameState.audio.enabled) {
          // Resume music if enabled
          if (gameState.screen === 'menu' || gameState.screen === 'select') {
            audioManager.playMusic('main');
          } else if (gameState.screen === 'game') {
            audioManager.playMusic('stage1');
          }
        } else {
          // Stop music if disabled
          audioManager.stopMusic();
        }
        
        this.saveSettings();
      });
    }

    // Обработчики для элементов управления звуком в паузе
    const pauseMasterVol = document.getElementById('pauseMasterVol');
    const pauseMusicVol = document.getElementById('pauseMusicVol');
    const pauseSfxVol = document.getElementById('pauseSfxVol');
    const pauseMuteToggle = document.getElementById('pauseMuteToggle');

    if (pauseMasterVol && !pauseMasterVol.hasAttribute('data-audio-listener')) {
      pauseMasterVol.setAttribute('data-audio-listener', 'true');
      pauseMasterVol.addEventListener('input', () => {
        gameState.audio.masterVolume = parseFloat(pauseMasterVol.value);
        const pauseMasterVolText = document.getElementById('pauseMasterVolText');
        if (pauseMasterVolText) pauseMasterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Поддержка клавиатуры для слайдера теперь управляется через MenuNavigationManager
    }

    if (pauseMusicVol && !pauseMusicVol.hasAttribute('data-audio-listener')) {
      pauseMusicVol.setAttribute('data-audio-listener', 'true');
      pauseMusicVol.addEventListener('input', () => {
        gameState.audio.musicVolume = parseFloat(pauseMusicVol.value);
        const pauseMusicVolText = document.getElementById('pauseMusicVolText');
        if (pauseMusicVolText) pauseMusicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Поддержка клавиатуры для слайдера теперь управляется через MenuNavigationManager
    }

    if (pauseSfxVol && !pauseSfxVol.hasAttribute('data-audio-listener')) {
      pauseSfxVol.setAttribute('data-audio-listener', 'true');
      pauseSfxVol.addEventListener('input', () => {
        gameState.audio.sfxVolume = parseFloat(pauseSfxVol.value);
        const pauseSfxVolText = document.getElementById('pauseSfxVolText');
        if (pauseSfxVolText) pauseSfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
        this.saveSettings();
      });
      
      // Поддержка клавиатуры для слайдера теперь управляется через MenuNavigationManager
    }

    if (pauseMuteToggle && !pauseMuteToggle.hasAttribute('data-audio-listener')) {
      pauseMuteToggle.setAttribute('data-audio-listener', 'true');
      pauseMuteToggle.addEventListener('click', () => {
        gameState.audio.enabled = !gameState.audio.enabled;
        pauseMuteToggle.textContent = gameState.audio.enabled ? '🔇 Выключить звук' : '🔊 Включить звук';
        
        if (gameState.audio.enabled) {
          // Resume music if enabled
          if (gameState.screen === 'game') {
            audioManager.playMusic('stage1');
          }
        } else {
          // Stop music if disabled
          audioManager.stopMusic();
        }
        
        this.saveSettings();
      });
    }
  }

  static setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    try {
    
    // Главное меню
    const startBtn = document.getElementById('startBtn');
    const recordsBtn = document.getElementById('recordsBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    console.log('🔍 Найденные кнопки:', {
      startBtn: !!startBtn,
      recordsBtn: !!recordsBtn,
      settingsBtn: !!settingsBtn
    });
    
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        console.log('Start button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('select');
        ScreenManager.buildCharacterSelect();
      });
    }
    
    if (recordsBtn) {
      recordsBtn.addEventListener('click', async () => {
        console.log('Records button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        
        // Обновляем данные на экране рекордов
        RecordsManager.updateTopRecordsScreen();
        
        ScreenManager.switchScreen('records');
      });
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', async () => {
        console.log('Settings button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('settings');
        
        // Инициализируем настройки звука в главном меню
        this.initializeMainMenuAudioSettings();
      });
    }
    
    // Кнопки меню паузы
    const resumeBtn = document.getElementById('resumeBtn');
    const quitBtn = document.getElementById('quitBtn');
    
    console.log('Resume button found:', resumeBtn);
    console.log('Quit button found:', quitBtn);
    
    if (resumeBtn) {
      resumeBtn.addEventListener('click', async () => {
        console.log('Resume button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause(); // Закрыть паузу
      });
    } else {
      console.error('❌ Resume button not found!');
    }
    
    if (quitBtn) {
      quitBtn.addEventListener('click', async () => {
        console.log('Quit to main menu button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        const { GameEngine } = await import('../game/GameEngine.js');
        
        // Остановить игру
        GameEngine.stopGame();
        
        // Сбросить состояние паузы
        gameState.isPaused = false;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        
        // Переключиться в главное меню
        ScreenManager.switchScreen('menu');
      });
    } else {
      console.error('❌ Quit button not found!');
    }
    
    // Обработчик ESC теперь управляется через MenuNavigationManager
    
    // Кнопка паузы на игровом экране
    const pauseBtn = document.getElementById('pauseBtn');
    console.log('Pause button found:', pauseBtn);
    if (pauseBtn) {
      pauseBtn.addEventListener('click', async () => {
        console.log('Pause button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
        
        // Инициализируем значения в паузе
        this.initializePauseAudioSettings();
      });
    } else {
      console.error('❌ Pause button not found!');
    }
    
    // Кнопка закрытия инвентаря
    const closeInventoryBtn = document.getElementById('closeInventory');
    if (closeInventoryBtn) {
      closeInventoryBtn.addEventListener('click', async () => {
        console.log('Close inventory button clicked');
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      });
    }
    
    // Кнопка открытия инвентаря на экране (только в игре)
    const inventoryToggleBtn = document.getElementById('inventoryToggle');
    if (inventoryToggleBtn) {
      inventoryToggleBtn.addEventListener('click', async () => {
        // Проверяем, что мы в игре и не в паузе
        if (gameState.screen !== 'game') {
          console.log('Inventory button clicked outside game - ignoring');
          return;
        }
        
        if (gameState.isPaused) {
          console.log('Inventory button clicked during pause - ignoring');
          return;
        }
        
        console.log('Inventory toggle button clicked');
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      });
    }
    
    // Десктопная кнопка способности
    const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
    if (desktopAbilityBtn) {
      desktopAbilityBtn.addEventListener('click', async () => {
        // Проверяем, что мы в игре, не в паузе и у игрока есть способность
        if (gameState.screen !== 'game' || !gameState.player) {
          console.log('Ability button clicked outside game - ignoring');
          return;
        }
        
        if (gameState.isPaused) {
          console.log('Ability button clicked during pause - ignoring');
          return;
        }
        
        console.log('Desktop ability button clicked');
        
        // Активируем способность в зависимости от персонажа
        if (gameState.player.hasDash && gameState.player.dashCooldown <= 0) {
          gameState.player.performDash();
        } else if (gameState.player.hasShield && gameState.player.shieldCooldown <= 0) {
          gameState.player.performShield();
        } else if (gameState.player.hasBlast && gameState.player.blastCooldown <= 0) {
          gameState.player.performBlast();
        }
      });
    }
    
    // Кнопка следующего уровня
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', async () => {
        console.log('Next level button clicked');
        console.log(`🎮 Button click - level: ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
        const { GameEngine } = await import('../game/GameEngine.js');
        const { LevelManager } = await import('../game/LevelManager.js');
        
        // Закрыть окно статистики
        const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
        if (levelCompleteOverlay) {
          levelCompleteOverlay.classList.add('hidden');
        }
        
        // Переход на следующий уровень через LevelManager
        console.log(`🎮 Before nextLevel: level ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
        await LevelManager.nextLevel();
        console.log(`🎮 After nextLevel: level ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
        
        // Продолжаем игру с новым уровнем
        await GameEngine.continueGame();
      });
    }
    
    // Возвраты в меню
    const backToMenuFromSelect = document.getElementById('backToMenuFromSelect');
    const backToMenuFromRecords = document.getElementById('backToMenuFromRecords');
    const backToMenuFromSettings = document.getElementById('backToMenuFromSettings');
    
    if (backToMenuFromSelect) {
      backToMenuFromSelect.addEventListener('click', async () => {
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      });
    }
    
    if (backToMenuFromRecords) {
      backToMenuFromRecords.addEventListener('click', async () => {
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      });
    }
    
    if (backToMenuFromSettings) {
      backToMenuFromSettings.addEventListener('click', async () => {
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      });
    }
    
    // Настройки аудио будут инициализированы при загрузке экранов
    
    // Кнопка очистки рекордов
    const clearRecords = document.getElementById('clearRecords');
    if (clearRecords) {
      clearRecords.addEventListener('click', async () => {
        console.log('Clear records button clicked');
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        RecordsManager.clearRecords();
      });
    }
    
    // Кнопки экрана окончания игры
    const restartBtn = document.getElementById('restartBtn');
    const menuBtn = document.getElementById('menuBtn');
    
    if (restartBtn) {
      restartBtn.addEventListener('click', async () => {
        console.log('Restart button clicked');
        const { GameEngine } = await import('../game/GameEngine.js');
        const { LevelManager } = await import('../game/LevelManager.js');
        
        // Закрыть экран окончания игры
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
          gameOverOverlay.classList.add('hidden');
        }
        
        // Сбросить игру и начать заново
        LevelManager.endGame();
        GameEngine.startGame();
      });
    }
    
    if (menuBtn) {
      menuBtn.addEventListener('click', async () => {
        console.log('Menu button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        const { LevelManager } = await import('../game/LevelManager.js');
        
        // Закрыть экран окончания игры
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
          gameOverOverlay.classList.add('hidden');
        }
        
        // Сбросить игру и перейти в меню
        LevelManager.endGame();
        ScreenManager.switchScreen('menu');
      });
    }
    } catch (error) {
      console.error('❌ Error in setupEventListeners:', error);
    }
  }

  static initializePauseAudioSettings() {
    // Инициализируем значения слайдеров в паузе
    const pauseMasterVol = document.getElementById('pauseMasterVol');
    const pauseMusicVol = document.getElementById('pauseMusicVol');
    const pauseSfxVol = document.getElementById('pauseSfxVol');
    const pauseMuteToggle = document.getElementById('pauseMuteToggle');

    if (pauseMasterVol) {
      pauseMasterVol.value = gameState.audio.masterVolume;
      const pauseMasterVolText = document.getElementById('pauseMasterVolText');
      if (pauseMasterVolText) pauseMasterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
    }

    if (pauseMusicVol) {
      pauseMusicVol.value = gameState.audio.musicVolume;
      const pauseMusicVolText = document.getElementById('pauseMusicVolText');
      if (pauseMusicVolText) pauseMusicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
    }

    if (pauseSfxVol) {
      pauseSfxVol.value = gameState.audio.sfxVolume;
      const pauseSfxVolText = document.getElementById('pauseSfxVolText');
      if (pauseSfxVolText) pauseSfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
    }

    if (pauseMuteToggle) {
      pauseMuteToggle.textContent = gameState.audio.enabled ? '🔇 Выключить звук' : '🔊 Включить звук';
    }

    // Настраиваем обработчики событий для паузы
    this.setupAudioEventListeners();
  }

  static initializeMainMenuAudioSettings() {
    // Инициализируем значения слайдеров в главном меню
    const masterVol = document.getElementById('masterVol');
    const musicVol = document.getElementById('musicVol');
    const sfxVol = document.getElementById('sfxVol');
    const muteToggle = document.getElementById('muteToggle');

    if (masterVol) {
      masterVol.value = gameState.audio.masterVolume;
      const masterVolText = document.getElementById('masterVolText');
      if (masterVolText) masterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
    }

    if (musicVol) {
      musicVol.value = gameState.audio.musicVolume;
      const musicVolText = document.getElementById('musicVolText');
      if (musicVolText) musicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
    }

    if (sfxVol) {
      sfxVol.value = gameState.audio.sfxVolume;
      const sfxVolText = document.getElementById('sfxVolText');
      if (sfxVolText) sfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
    }

    if (muteToggle) {
      muteToggle.textContent = gameState.audio.enabled ? '🔇 Выключить звук' : '🔊 Включить звук';
    }

    // Настраиваем обработчики событий
    this.setupAudioEventListeners();
  }
} 