/* Darkfall Depths - Управление настройками */

import { gameState, canvas, DPR } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';

export class SettingsManager {
  static escapeListenerAdded = false;
  static delegatedListenerAdded = false;
  
  static init() {
    this.loadSettings();
    this.setupEventListeners();
  }

  static reinitEventListeners() {
    this.setupEventListeners();
  }

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
    
    // Обработчики для элементов управления звуком в главном меню
    const masterVol = document.getElementById('masterVol');
    const musicVol = document.getElementById('musicVol');
    const sfxVol = document.getElementById('sfxVol');
    const muteToggle = document.getElementById('muteToggle');

    if (masterVol && !masterVol.hasAttribute('data-audio-listener')) {
      masterVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      masterVol.style.touchAction = 'manipulation';
      masterVol.style.webkitTapHighlightColor = 'transparent';
      
      masterVol.addEventListener('input', () => {
        gameState.audio.masterVolume = parseFloat(masterVol.value);
        const masterVolText = document.getElementById('masterVolText');
        if (masterVolText) masterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      masterVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      masterVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      masterVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (musicVol && !musicVol.hasAttribute('data-audio-listener')) {
      musicVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      musicVol.style.touchAction = 'manipulation';
      musicVol.style.webkitTapHighlightColor = 'transparent';
      
      musicVol.addEventListener('input', () => {
        gameState.audio.musicVolume = parseFloat(musicVol.value);
        const musicVolText = document.getElementById('musicVolText');
        if (musicVolText) musicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      musicVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      musicVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      musicVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (sfxVol && !sfxVol.hasAttribute('data-audio-listener')) {
      sfxVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      sfxVol.style.touchAction = 'manipulation';
      sfxVol.style.webkitTapHighlightColor = 'transparent';
      
      sfxVol.addEventListener('input', () => {
        gameState.audio.sfxVolume = parseFloat(sfxVol.value);
        const sfxVolText = document.getElementById('sfxVolText');
        if (sfxVolText) sfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      sfxVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      sfxVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      sfxVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (muteToggle && !muteToggle.hasAttribute('data-audio-listener')) {
      muteToggle.setAttribute('data-audio-listener', 'true');
      
      const handleMuteToggle = () => {
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
      };
      
      // Добавляем обработчики для мыши и touch
      muteToggle.addEventListener('click', handleMuteToggle);
      muteToggle.addEventListener('touchend', handleMuteToggle);
      muteToggle.addEventListener('touchstart', (e) => e.preventDefault());
    }

    // Обработчики для элементов управления звуком в паузе
    const pauseMasterVol = document.getElementById('pauseMasterVol');
    const pauseMusicVol = document.getElementById('pauseMusicVol');
    const pauseSfxVol = document.getElementById('pauseSfxVol');
    const pauseMuteToggle = document.getElementById('pauseMuteToggle');

    if (pauseMasterVol && !pauseMasterVol.hasAttribute('data-audio-listener')) {
      pauseMasterVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      pauseMasterVol.style.touchAction = 'manipulation';
      pauseMasterVol.style.webkitTapHighlightColor = 'transparent';
      
      pauseMasterVol.addEventListener('input', () => {
        gameState.audio.masterVolume = parseFloat(pauseMasterVol.value);
        const pauseMasterVolText = document.getElementById('pauseMasterVolText');
        if (pauseMasterVolText) pauseMasterVolText.textContent = Math.round(gameState.audio.masterVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      pauseMasterVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseMasterVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseMasterVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (pauseMusicVol && !pauseMusicVol.hasAttribute('data-audio-listener')) {
      pauseMusicVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      pauseMusicVol.style.touchAction = 'manipulation';
      pauseMusicVol.style.webkitTapHighlightColor = 'transparent';
      
      pauseMusicVol.addEventListener('input', () => {
        gameState.audio.musicVolume = parseFloat(pauseMusicVol.value);
        const pauseMusicVolText = document.getElementById('pauseMusicVolText');
        if (pauseMusicVolText) pauseMusicVolText.textContent = Math.round(gameState.audio.musicVolume * 100) + '%';
        audioManager.updateMusicVolume();
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      pauseMusicVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseMusicVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseMusicVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (pauseSfxVol && !pauseSfxVol.hasAttribute('data-audio-listener')) {
      pauseSfxVol.setAttribute('data-audio-listener', 'true');
      
      // Добавляем touch поддержку
      pauseSfxVol.style.touchAction = 'manipulation';
      pauseSfxVol.style.webkitTapHighlightColor = 'transparent';
      
      pauseSfxVol.addEventListener('input', () => {
        gameState.audio.sfxVolume = parseFloat(pauseSfxVol.value);
        const pauseSfxVolText = document.getElementById('pauseSfxVolText');
        if (pauseSfxVolText) pauseSfxVolText.textContent = Math.round(gameState.audio.sfxVolume * 100) + '%';
        this.saveSettings();
      });
      
      // Добавляем touch события для лучшей поддержки мобильных
      pauseSfxVol.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseSfxVol.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
      
      pauseSfxVol.addEventListener('touchend', (e) => {
        e.stopPropagation();
        // НЕ блокируем touch события для ползунка
      });
    }

    if (pauseMuteToggle && !pauseMuteToggle.hasAttribute('data-audio-listener')) {
      pauseMuteToggle.setAttribute('data-audio-listener', 'true');
      
      const handlePauseMuteToggle = () => {
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
      };
      
      // Добавляем обработчики для мыши и touch
      pauseMuteToggle.addEventListener('click', handlePauseMuteToggle);
      pauseMuteToggle.addEventListener('touchend', handlePauseMuteToggle);
      pauseMuteToggle.addEventListener('touchstart', (e) => e.preventDefault());
    }
  }

  static setupGameButtonEventListeners() {
    // Кнопка паузы на игровом экране
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      // Удаляем старые обработчики
      const newPauseBtn = pauseBtn.cloneNode(true);
      pauseBtn.parentNode.replaceChild(newPauseBtn, pauseBtn);
      
      // Функция обработчика паузы
      const handlePauseClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
        
        // Инициализируем значения в паузе
        this.initializePauseAudioSettings();
      };
      
      // Добавляем обработчики для мыши и touch
      newPauseBtn.addEventListener('click', handlePauseClick);
      newPauseBtn.addEventListener('touchend', handlePauseClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      newPauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
      
      console.log('🔴 Pause button event listeners set up successfully');
    } else {
      console.error('❌ Pause button not found!');
    }
    
    // Кнопка открытия инвентаря на экране (только в игре)
    const inventoryToggleBtn = document.getElementById('inventoryToggle');

    if (inventoryToggleBtn) {
      // Удаляем старые обработчики
      const newInventoryBtn = inventoryToggleBtn.cloneNode(true);
      inventoryToggleBtn.parentNode.replaceChild(newInventoryBtn, inventoryToggleBtn);
      
      // Функция обработчика инвентаря
      const handleInventoryClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎒 INVENTORY BUTTON CLICKED! Event type:', e.type);
        console.log('🎒 Current gameState.screen:', gameState.screen);
        console.log('🎒 Current gameState.isPaused:', gameState.isPaused);
        
        // Проверяем, что мы в игре и не в паузе
        if (gameState.screen !== 'game') {
          console.log('🎒 Inventory button clicked outside game - ignoring');
          return;
        }
        
        if (gameState.isPaused) {
          console.log('🎒 Inventory button clicked during pause - ignoring');
          return;
        }
        
        console.log('🎒 Opening inventory...');
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      };
      
      // Добавляем обработчики для мыши и touch
      newInventoryBtn.addEventListener('click', handleInventoryClick);
      newInventoryBtn.addEventListener('touchend', handleInventoryClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      newInventoryBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
      
      console.log('🎒 Inventory button event listeners set up successfully');
    } else {
      console.error('❌ Inventory button not found!');
    }
    
    // Кнопка закрытия паузы (крестик)
    const closePauseBtn = document.getElementById('closePause');
    console.log('❌ Close pause button found:', !!closePauseBtn);
    if (closePauseBtn) {
      // Удаляем старые обработчики
      const newClosePauseBtn = closePauseBtn.cloneNode(true);
      closePauseBtn.parentNode.replaceChild(newClosePauseBtn, closePauseBtn);
      
      // Функция обработчика закрытия паузы
      const handleClosePauseClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ CLOSE PAUSE BUTTON CLICKED! Event type:', e.type);
        
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
      };
      
      // Добавляем обработчики для мыши и touch
      newClosePauseBtn.addEventListener('click', handleClosePauseClick);
      newClosePauseBtn.addEventListener('touchend', handleClosePauseClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      newClosePauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
      
      console.log('❌ Close pause button event listeners set up successfully');
    }
    
    // Мобильная кнопка инвентаря (в нижней части экрана)
    const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
    console.log('📱 Mobile inventory button found:', !!mobileInventoryBtn);
    if (mobileInventoryBtn) {
      // Удаляем старые обработчики
      const newMobileInventoryBtn = mobileInventoryBtn.cloneNode(true);
      mobileInventoryBtn.parentNode.replaceChild(newMobileInventoryBtn, mobileInventoryBtn);
      
      // Функция обработчика мобильного инвентаря
      const handleMobileInventoryClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📱 MOBILE INVENTORY BUTTON CLICKED! Event type:', e.type);
        console.log('📱 Current gameState.screen:', gameState.screen);
        console.log('📱 Current gameState.isPaused:', gameState.isPaused);
        
        // Проверяем, что мы в игре и не в паузе
        if (gameState.screen !== 'game') {
          console.log('📱 Mobile inventory button clicked outside game - ignoring');
          return;
        }
        
        if (gameState.isPaused) {
          console.log('📱 Mobile inventory button clicked during pause - ignoring');
          return;
        }
        
        console.log('📱 Opening inventory from mobile button...');
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      };
      
      // Добавляем обработчики для мыши и touch
      newMobileInventoryBtn.addEventListener('click', handleMobileInventoryClick);
      newMobileInventoryBtn.addEventListener('touchend', handleMobileInventoryClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      newMobileInventoryBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
      
      console.log('📱 Mobile inventory button event listeners set up successfully');
    }
  }

  static setupPauseEventListeners() {
    console.log('⏸️ Setting up pause screen event listeners...');
    
    // Убираем фокус со всех ползунков при открытии паузы
    setTimeout(() => {
      const sliders = document.querySelectorAll('.pause-panel input[type="range"]');
      sliders.forEach(slider => {
        slider.blur();
      });
    }, 50);
    
    // Кнопка закрытия паузы (крестик)
    const closePauseBtn = document.getElementById('closePause');
    console.log('❌ Close pause button found:', !!closePauseBtn);
    if (closePauseBtn) {
      // Удаляем старые обработчики
      const newClosePauseBtn = closePauseBtn.cloneNode(true);
      closePauseBtn.parentNode.replaceChild(newClosePauseBtn, closePauseBtn);
      
      const handleClosePauseClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ CLOSE PAUSE BUTTON CLICKED! Event type:', e.type);
        
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
      };
      
      // Добавляем обработчики для мыши и touch
      newClosePauseBtn.addEventListener('click', handleClosePauseClick);
      newClosePauseBtn.addEventListener('touchend', handleClosePauseClick);
      newClosePauseBtn.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('❌ Close pause button event listeners set up successfully');
    }
    
    // Кнопка "В главное меню" в паузе
    const quitBtn = document.getElementById('quitBtn');
    console.log('🏠 Quit button found:', !!quitBtn);
    if (quitBtn) {
      // Удаляем старые обработчики
      const newQuitBtn = quitBtn.cloneNode(true);
      quitBtn.parentNode.replaceChild(newQuitBtn, quitBtn);
      
      const handleQuitClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🏠 QUIT BUTTON CLICKED! Event type:', e.type);
        
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
      };
      
      // Добавляем обработчики для мыши и touch
      newQuitBtn.addEventListener('click', handleQuitClick);
      newQuitBtn.addEventListener('touchend', handleQuitClick);
      newQuitBtn.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('🏠 Quit button event listeners set up successfully');
    }
  }

  static setupRecordsEventListeners() {
    console.log('📊 Setting up records screen event listeners...');
    
    // Кнопка очистки рекордов
    const clearRecords = document.getElementById('clearRecords');
    console.log('🗑️ Clear records button found:', !!clearRecords);
    if (clearRecords) {
      // Удаляем старые обработчики
      const newClearRecords = clearRecords.cloneNode(true);
      clearRecords.parentNode.replaceChild(newClearRecords, clearRecords);
      
      const handleClearRecords = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🗑️ Clear records button clicked! Event type:', e.type);
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        RecordsManager.clearRecords();
      };
      
      // Добавляем обработчики для мыши и touch
      newClearRecords.addEventListener('click', handleClearRecords);
      newClearRecords.addEventListener('touchend', handleClearRecords);
      newClearRecords.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('🗑️ Clear records button event listeners set up successfully');
    }
    
    // Кнопка "Назад" из рекордов
    const backToMenuFromRecords = document.getElementById('backToMenuFromRecords');
    console.log('⬅️ Back from records button found:', !!backToMenuFromRecords);
    if (backToMenuFromRecords) {
      // Удаляем старые обработчики
      const newBackButton = backToMenuFromRecords.cloneNode(true);
      backToMenuFromRecords.parentNode.replaceChild(newBackButton, backToMenuFromRecords);
      
      const handleBackToMenu = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⬅️ Back from records button clicked! Event type:', e.type);
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      };
      
      // Добавляем обработчики для мыши и touch
      newBackButton.addEventListener('click', handleBackToMenu);
      newBackButton.addEventListener('touchend', handleBackToMenu);
      newBackButton.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('⬅️ Back from records button event listeners set up successfully');
    }
  }

  static setupSettingsEventListeners() {
    console.log('⚙️ Setting up settings screen event listeners...');
    
    // Убираем фокус со всех ползунков при открытии настроек
    setTimeout(() => {
      const sliders = document.querySelectorAll('.settings-panel input[type="range"]');
      sliders.forEach(slider => {
        slider.blur();
      });
    }, 50);
    
    // Кнопка "Назад" из настроек
    const backToMenuFromSettings = document.getElementById('backToMenuFromSettings');
    console.log('⬅️ Back from settings button found:', !!backToMenuFromSettings);
    if (backToMenuFromSettings) {
      // Удаляем старые обработчики
      const newBackButton = backToMenuFromSettings.cloneNode(true);
      backToMenuFromSettings.parentNode.replaceChild(newBackButton, backToMenuFromSettings);
      
      const handleBackToMenu = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⬅️ Back from settings button clicked! Event type:', e.type);
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      };
      
      // Добавляем обработчики для мыши и touch
      newBackButton.addEventListener('click', handleBackToMenu);
      newBackButton.addEventListener('touchend', handleBackToMenu);
      newBackButton.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('⬅️ Back from settings button event listeners set up successfully');
    }
    
    // Кнопка "Выключить звук"
    const muteToggle = document.getElementById('muteToggle');
    console.log('🔇 Mute toggle button found:', !!muteToggle);
    if (muteToggle) {
      // Удаляем старые обработчики
      const newMuteToggle = muteToggle.cloneNode(true);
      muteToggle.parentNode.replaceChild(newMuteToggle, muteToggle);
      
      const handleMuteToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔇 Mute toggle button clicked! Event type:', e.type);
        gameState.audio.enabled = !gameState.audio.enabled;
        
        // Обновляем текст кнопки
        newMuteToggle.textContent = gameState.audio.enabled ? '🔇 Выключить звук' : '🔊 Включить звук';
        
        // Управляем музыкой
        if (gameState.audio.enabled) {
          if (gameState.screen === 'menu' || gameState.screen === 'select') {
            audioManager.playMusic('main');
          } else if (gameState.screen === 'game') {
            audioManager.playMusic('stage1');
          }
        } else {
          audioManager.stopMusic();
        }
        
        this.saveSettings();
      };
      
      // Добавляем обработчики для мыши и touch
      newMuteToggle.addEventListener('click', handleMuteToggle);
      newMuteToggle.addEventListener('touchend', handleMuteToggle);
      newMuteToggle.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('🔇 Mute toggle button event listeners set up successfully');
    }
    
    // Настраиваем ползунки с поддержкой touch
    this.setupAudioEventListeners();
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
      const handleStartClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Start button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('select');
        ScreenManager.buildCharacterSelect();
      };
      
      startBtn.addEventListener('click', handleStartClick);
      startBtn.addEventListener('touchend', handleStartClick);
      startBtn.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    if (recordsBtn) {
      const handleRecordsClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Records button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        
        // Обновляем данные на экране рекордов
        RecordsManager.updateTopRecordsScreen();
        
        ScreenManager.switchScreen('records');
      };
      
      recordsBtn.addEventListener('click', handleRecordsClick);
      recordsBtn.addEventListener('touchend', handleRecordsClick);
      recordsBtn.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    if (settingsBtn) {
      const handleSettingsClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Settings button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('settings');
        
        // Инициализируем настройки звука в главном меню
        this.initializeMainMenuAudioSettings();
      };
      
      settingsBtn.addEventListener('click', handleSettingsClick);
      settingsBtn.addEventListener('touchend', handleSettingsClick);
      settingsBtn.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    // Кнопки меню паузы
    const quitBtn = document.getElementById('quitBtn');
    
    console.log('Quit button found:', quitBtn);
    
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
    
    // Кнопка закрытия паузы (крестик) - также настраиваем в основной функции
    const closePauseBtn = document.getElementById('closePause');
    if (closePauseBtn) {
      const handleClosePauseClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Close pause button clicked');
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
      };
      
      closePauseBtn.addEventListener('click', handleClosePauseClick);
      closePauseBtn.addEventListener('touchend', handleClosePauseClick);
      closePauseBtn.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    // Обработчик ESC теперь управляется через MenuNavigationManager
    
    // Кнопка паузы на игровом экране
    const pauseBtn = document.getElementById('pauseBtn');
    console.log('Pause button found:', pauseBtn);
    if (pauseBtn) {
      // Функция обработчика паузы
      const handlePauseClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 PAUSE BUTTON CLICKED! Event type:', e.type);
        console.log('🔴 Current gameState.screen:', gameState.screen);
        console.log('🔴 Current gameState.isPaused:', gameState.isPaused);
        
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        await ScreenManager.togglePause();
        
        // Инициализируем значения в паузе
        this.initializePauseAudioSettings();
      };
      
      // Добавляем обработчики для мыши и touch
      pauseBtn.addEventListener('click', handlePauseClick);
      pauseBtn.addEventListener('touchend', handlePauseClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
    } else {
      console.error('❌ Pause button not found!');
    }
    
    // Кнопка закрытия инвентаря (только в игровом экране)
    const closeInventoryBtn = document.getElementById('closeInventory');
    if (closeInventoryBtn && gameState.screen === 'game') {
      console.log('✅ Кнопка закрытия инвентаря найдена и настроена');
      
      // Удаляем старые обработчики, если они есть
      const newCloseInventoryBtn = closeInventoryBtn.cloneNode(true);
      closeInventoryBtn.parentNode.replaceChild(newCloseInventoryBtn, closeInventoryBtn);
      
      newCloseInventoryBtn.addEventListener('click', async (e) => {
        console.log('🔴 Close inventory button clicked');
        e.preventDefault();
        e.stopPropagation();
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      });
      
      // Обработчик клика на шторку инвентаря для закрытия
      const inventoryOverlay = document.getElementById('inventoryOverlay');
      if (inventoryOverlay) {
        inventoryOverlay.addEventListener('click', async (e) => {
          if (e.target === inventoryOverlay) {
            console.log('🔴 Inventory overlay clicked - closing');
            const { InventoryManager } = await import('../ui/InventoryManager.js');
            InventoryManager.toggleInventory();
          }
        });
      }
      
      // Дополнительные обработчики через делегирование событий
      if (!SettingsManager.delegatedListenerAdded) {
        SettingsManager.delegatedListenerAdded = true;
        document.addEventListener('click', async (e) => {
        if (e.target && e.target.id === 'closeInventory') {
          console.log('🔴 Close inventory button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
          const { InventoryManager } = await import('../ui/InventoryManager.js');
          InventoryManager.toggleInventory();
        } else if (e.target && e.target.id === 'restartBtn') {
          console.log('🔄 Restart button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
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
        } else if (e.target && e.target.id === 'menuBtn') {
          console.log('🏠 Menu button clicked (delegated)');
          e.preventDefault();
          e.stopPropagation();
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
        } else if (e.target && e.target.id === 'nextLevelBtn') {
          // Убираем дублирующий обработчик - используем только прямой обработчик
          console.log('⬇️ Next level button clicked (delegated) - IGNORED');
          // Не выполняем никаких действий - прямой обработчик справится
        }
      });
      

      
      // Обработчик клавиши Escape для закрытия инвентаря
      if (!SettingsManager.escapeListenerAdded) {
        SettingsManager.escapeListenerAdded = true;
        document.addEventListener('keydown', async (e) => {
          if (e.key === 'Escape') {
            const inventoryOverlay = document.getElementById('inventoryOverlay');
            if (inventoryOverlay && !inventoryOverlay.classList.contains('hidden')) {
              console.log('🔴 Escape key pressed - closing inventory');
              const { InventoryManager } = await import('../ui/InventoryManager.js');
              InventoryManager.toggleInventory();
              e.preventDefault(); // Предотвращаем срабатывание других обработчиков Escape
              e.stopPropagation();
              e.stopImmediatePropagation(); // Останавливаем все последующие обработчики
              return false; // Прерываем выполнение, чтобы другие обработчики не сработали
            }
          }
        });
      }
    } else if (closeInventoryBtn && gameState.screen !== 'game') {
      // Кнопка есть, но мы не в игре - это нормально
      console.log('ℹ️ Кнопка закрытия инвентаря найдена, но не в игровом экране - пропускаем');
    } else if (!closeInventoryBtn && gameState.screen === 'game') {
      // Кнопки нет, но мы в игре - это ошибка
      console.error('❌ Кнопка закрытия инвентаря не найдена в игровом экране!');
    } else {
      // Кнопки нет и мы не в игре - это нормально
      console.log('ℹ️ Кнопка закрытия инвентаря не найдена (не в игровом экране)');
    }
    
    // Кнопка открытия инвентаря на экране (только в игре)
    const inventoryToggleBtn = document.getElementById('inventoryToggle');
    if (inventoryToggleBtn) {
      // Функция обработчика инвентаря
      const handleInventoryClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎒 INVENTORY BUTTON CLICKED! Event type:', e.type);
        console.log('🎒 Current gameState.screen:', gameState.screen);
        console.log('🎒 Current gameState.isPaused:', gameState.isPaused);
        
        // Проверяем, что мы в игре и не в паузе
        if (gameState.screen !== 'game') {
          console.log('🎒 Inventory button clicked outside game - ignoring');
          return;
        }
        
        if (gameState.isPaused) {
          console.log('🎒 Inventory button clicked during pause - ignoring');
          return;
        }
        
        console.log('🎒 Opening inventory...');
        const { InventoryManager } = await import('../ui/InventoryManager.js');
        InventoryManager.toggleInventory();
      };
      
      // Добавляем обработчики для мыши и touch
      inventoryToggleBtn.addEventListener('click', handleInventoryClick);
      inventoryToggleBtn.addEventListener('touchend', handleInventoryClick);
      
      // Предотвращаем двойное срабатывание на мобильных
      inventoryToggleBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
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
      console.log('✅ Кнопка следующего уровня найдена и настроена');
      
      // Удаляем старые обработчики, если они есть
      const newNextLevelBtn = nextLevelBtn.cloneNode(true);
      nextLevelBtn.parentNode.replaceChild(newNextLevelBtn, nextLevelBtn);
      
      newNextLevelBtn.addEventListener('click', async () => {
        console.log('🎮 Next level button clicked');
        console.log(`🎮 Button click - level: ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
        
        try {
          const { GameEngine } = await import('../game/GameEngine.js');
          const { LevelManager } = await import('../game/LevelManager.js');
          
          // Закрыть окно статистики
          const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
          if (levelCompleteOverlay) {
            levelCompleteOverlay.classList.add('hidden');
            console.log('🎮 Level complete overlay hidden');
          }
          
          // Переход на следующий уровень через LevelManager
          console.log(`🎮 Before nextLevel: level ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
          await LevelManager.nextLevel();
          console.log(`🎮 After nextLevel: level ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
          
          // Продолжаем игру с новым уровнем
          console.log('🎮 Continuing game...');
          await GameEngine.continueGame();
          console.log('🎮 Game continued successfully');
        } catch (error) {
          console.error('❌ Error in next level button handler:', error);
        }
      });
    } else {
      console.error('❌ Кнопка следующего уровня не найдена!');
    }
    
    // Возвраты в меню с поддержкой touch событий
    const backToMenuFromSelect = document.getElementById('backToMenuFromSelect');
    const backToMenuFromRecords = document.getElementById('backToMenuFromRecords');
    const backToMenuFromSettings = document.getElementById('backToMenuFromSettings');
    
    // Функция-обработчик возврата в меню
    const handleBackToMenu = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { ScreenManager } = await import('../ui/ScreenManager.js');
      ScreenManager.switchScreen('menu');
    };
    
    // Обработчик для backToMenuFromSelect теперь в setupSelectEventListeners
    
    if (backToMenuFromRecords) {
      backToMenuFromRecords.addEventListener('click', handleBackToMenu);
      backToMenuFromRecords.addEventListener('touchend', handleBackToMenu);
      backToMenuFromRecords.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    if (backToMenuFromSettings) {
      backToMenuFromSettings.addEventListener('click', handleBackToMenu);
      backToMenuFromSettings.addEventListener('touchend', handleBackToMenu);
      backToMenuFromSettings.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    // Настройки аудио будут инициализированы при загрузке экранов
    
    // Кнопка очистки рекордов
    const clearRecords = document.getElementById('clearRecords');
    if (clearRecords) {
      const handleClearRecords = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Clear records button clicked');
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        RecordsManager.clearRecords();
      };
      
      clearRecords.addEventListener('click', handleClearRecords);
      clearRecords.addEventListener('touchend', handleClearRecords);
      clearRecords.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    // Кнопки экрана окончания игры
    const restartBtn = document.getElementById('restartBtn');
    const menuBtn = document.getElementById('menuBtn');
    
    if (restartBtn) {
      // Удаляем старые обработчики, если они есть
      const newRestartBtn = restartBtn.cloneNode(true);
      restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
      
      newRestartBtn.addEventListener('click', async () => {
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
      // Удаляем старые обработчики, если они есть
      const newMenuBtn = menuBtn.cloneNode(true);
      menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
      
      newMenuBtn.addEventListener('click', async () => {
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

  static setupSelectEventListeners() {
    console.log('👤 Setting up character select screen event listeners...');
    
    // Кнопка "Назад" из экрана выбора персонажей
    const backToMenuFromSelect = document.getElementById('backToMenuFromSelect');
    console.log('⬅️ Back from select button found:', !!backToMenuFromSelect);
    if (backToMenuFromSelect) {
      // Удаляем старые обработчики
      const newBackButton = backToMenuFromSelect.cloneNode(true);
      backToMenuFromSelect.parentNode.replaceChild(newBackButton, backToMenuFromSelect);
      
      const handleBackToMenu = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⬅️ Back from select button clicked! Event type:', e.type);
        const { ScreenManager } = await import('../ui/ScreenManager.js');
        ScreenManager.switchScreen('menu');
      };
      
      // Добавляем обработчики для мыши и touch
      newBackButton.addEventListener('click', handleBackToMenu);
      newBackButton.addEventListener('touchend', handleBackToMenu);
      newBackButton.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('⬅️ Back from select button event listeners set up successfully');
    }
    
    // Кнопка "Старт" игры
    const startGameBtn = document.getElementById('startGameBtn');
    console.log('🎮 Start game button found:', !!startGameBtn);
    if (startGameBtn) {
      // Удаляем старые обработчики
      const newStartButton = startGameBtn.cloneNode(true);
      startGameBtn.parentNode.replaceChild(newStartButton, startGameBtn);
      
      const handleStartGame = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎮 Start game button clicked! Event type:', e.type);
        
        // Проверяем, что персонаж выбран
        if (!gameState.selectedCharacter) {
          console.log('❌ No character selected!');
          return;
        }
        
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.startGame();
      };
      
      // Добавляем обработчики для мыши и touch
      newStartButton.addEventListener('click', handleStartGame);
      newStartButton.addEventListener('touchend', handleStartGame);
      newStartButton.addEventListener('touchstart', (e) => e.preventDefault());
      
      console.log('🎮 Start game button event listeners set up successfully');
    }
  }
} 