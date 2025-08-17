/* Darkfall Depths - Управление экранами */

import { gameState } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';
import { CHARACTERS } from '../config/constants.js';
import { MenuNavigationManager } from './MenuNavigationManager.js';

export class ScreenManager {
  static lastSwitchTime = 0;
  static switchDebounceMs = 300; // Защита от быстрых переключений

  static init() {
    // Принудительно очищаем все экраны при запуске
    this.forceClearAllScreens();
    
    // Устанавливаем экран загрузки как активный
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      loadingScreen.classList.add('active');
      loadingScreen.style.display = 'flex';
    }
  }

  static forceClearAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
      screen.style.display = 'none';
    });
  }

  static switchScreen(screenName) {
    // Защита от быстрых переключений
    const now = Date.now();
    if (now - this.lastSwitchTime < this.switchDebounceMs) {
      return;
    }
    this.lastSwitchTime = now;
    
    // Защита от повторного переключения на тот же экран
    if (gameState.screen === screenName) {
      return;
    }
    
    // Скрываем ВСЕ экраны принудительно
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
      screen.style.display = 'none';
    });
    
    // Показываем только целевой экран
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.add('active');
      targetScreen.style.display = 'flex';
      gameState.screen = screenName;
      
      // Дополнительная проверка - убеждаемся, что только один экран активен
      setTimeout(() => {
        document.querySelectorAll('.screen').forEach(screen => {
          if (screen !== targetScreen) {
            screen.classList.add('hidden');
            screen.classList.remove('active');
            screen.style.display = 'none';
          }
        });
      }, 50);
      
      // Управление музыкой при переключении экранов
      if (screenName === 'game') {
        audioManager.playMusic('stage1');
      } else if (screenName === 'menu' || screenName === 'select') {
        if (!audioManager.currentMusic || audioManager.currentMusic.src !== audioManager.musicTracks.main.src) {
          audioManager.playMusic('main');
        }
      } else {
        if (!audioManager.currentMusic || audioManager.currentMusic.src !== audioManager.musicTracks.main.src) {
          audioManager.playMusic('main');
        }
      }

      // Инициализируем настройки звука при переключении на экран настроек
      if (screenName === 'settings') {
        (async () => {
          const { SettingsManager } = await import('./SettingsManager.js');
          SettingsManager.initializeMainMenuAudioSettings();
        })();
      }

      // Настраиваем обработчики событий при переключении на главное меню
      if (screenName === 'menu') {
        (async () => {
          const { SettingsManager } = await import('./SettingsManager.js');
          SettingsManager.setupEventListeners();
        })();
      }
      
      // Настраиваем обработчики событий при переключении на экран рекордов
      if (screenName === 'records') {
        setTimeout(() => {
          (async () => {
            const { SettingsManager } = await import('./SettingsManager.js');
            SettingsManager.setupRecordsEventListeners();
          })();
        }, 100);
      }
      
      // Настраиваем обработчики событий при переключении на экран настроек
      if (screenName === 'settings') {
        setTimeout(() => {
          (async () => {
            const { SettingsManager } = await import('./SettingsManager.js');
            SettingsManager.setupSettingsEventListeners();
          })();
        }, 100);
      }
      
      // Настраиваем обработчики событий при переключении на экран выбора персонажей
      if (screenName === 'select') {
        setTimeout(() => {
          (async () => {
            const { SettingsManager } = await import('./SettingsManager.js');
            SettingsManager.setupSelectEventListeners();
          })();
        }, 100);
      }
      
      // Обновляем быстрые слоты при переключении на игровой экран
      if (screenName === 'game') {
        setTimeout(() => {
          (async () => {
            const { GameEngine } = await import('../game/GameEngine.js');
            GameEngine.updateQuickPotions();
            
            const { SettingsManager } = await import('./SettingsManager.js');
            SettingsManager.setupGameButtonEventListeners();
          })();
        }, 100);
      }
      
      // Обновляем навигацию по клавиатуре при переключении экранов
      setTimeout(() => {
        MenuNavigationManager.refreshNavigation();
      }, 200);
    } else {
      console.error('Screen not found:', screenName + 'Screen');
    }
  }

  static buildCharacterSelect() {
    const charList = document.getElementById('charList');
    if (!charList) return;
    
    charList.innerHTML = '';
    
    // Скрываем кнопку "Старт" при загрузке экрана
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
      startGameBtn.style.display = 'none';
    }
    
    // Убираем автоматический фокус на всех устройствах
    setTimeout(() => {
      const characterCards = document.querySelectorAll('.character-card');
      characterCards.forEach(card => {
        card.classList.remove('keyboard-focus');
        card.blur();
      });
    }, 50);
    
    // Принудительно обновление кеша
    CHARACTERS.forEach(char => {
      const card = document.createElement('div');
      card.className = 'character-card';
      
      // Определяем иконку способности
      let abilityIcon = '';
      let abilityName = '';
      if (char.hasDash) {
        abilityIcon = '💨';
        abilityName = 'Dash';
      } else if (char.hasShield) {
        abilityIcon = '🛡️';
        abilityName = 'Щит';
      } else if (char.hasBlast) {
        abilityIcon = '💥';
        abilityName = 'Взрыв';
      }
      
      card.innerHTML = `
        <div class="character-avatar">
          <div class="character-sprite">${char.sprite}</div>
          <div class="character-ability-icon">${abilityIcon}</div>
        </div>
        <div class="character-name">${char.name}</div>
        <div class="character-class">${char.class}</div>
        <div class="character-description">${char.description}</div>
        <div class="character-stats">
          <div class="stat-item">
            <span>HP:</span>
            <span class="stat-value">${char.hp}</span>
          </div>
          <div class="stat-item">
            <span>Урон:</span>
            <span class="stat-value">${char.damage}</span>
          </div>
          <div class="stat-item">
            <span>Скорость:</span>
            <span class="stat-value">${char.moveSpeed}</span>
          </div>
          <div class="stat-item">
            <span>Дальность:</span>
            <span class="stat-value">${char.attackRadius}px</span>
          </div>
          <div class="stat-item">
            <span>Скор. атаки:</span>
            <span class="stat-value">${char.attackSpeed}с</span>
          </div>
          <div class="stat-item">
            <span>Тип:</span>
            <span class="stat-value">${char.type === 'melee' ? 'Ближний' : 'Дальний'}</span>
          </div>
          <div class="stat-item">
            <span>Способность:</span>
            <span class="stat-value">${abilityName}</span>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        gameState.selectedCharacter = char;
        
        // Показываем кнопку "Старт" после выбора персонажа
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
          startGameBtn.style.display = 'block';
        }
      });
      
      charList.appendChild(card);
    });
  }

  static async toggleInventory() {
    const overlay = document.getElementById('inventoryOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('hidden')) {
      // Проверяем, что игра не в паузе перед открытием инвентаря
      if (gameState.isPaused) {
        return;
      }
      
      const { InventoryManager } = await import('./InventoryManager.js');
      InventoryManager.renderInventory();
      overlay.classList.remove('hidden');
      if (gameState.screen === 'game' && !gameState.isPaused) {
        gameState.isPaused = true;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
      }
    } else {
      overlay.classList.add('hidden');
      // Сбрасываем паузу при закрытии инвентаря, если игра была поставлена на паузу из-за инвентаря
      if (gameState.screen === 'game' && gameState.isPaused) {
        gameState.isPaused = false;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        
        // Показываем игровые кнопки при возобновлении
        const inventoryToggleBtn = document.getElementById('inventoryToggle');
        const pauseBtn = document.getElementById('pauseBtn');
        const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
        const quickPotionsContainer = document.querySelector('.quick-potions-container');
        
        if (inventoryToggleBtn) inventoryToggleBtn.style.display = '';
        if (pauseBtn) pauseBtn.style.display = '';
        if (desktopAbilityBtn) desktopAbilityBtn.style.display = '';
        if (quickPotionsContainer) quickPotionsContainer.style.display = '';
      }
    }
  }
  
  static async togglePause() {
    if (gameState.screen !== 'game') {
      return;
    }
    
    gameState.isPaused = !gameState.isPaused;
    const overlay = document.getElementById('pauseOverlay');
    
    if (!overlay) {
      console.error('❌ Pause overlay not found');
      return;
    }
    
    if (gameState.isPaused) {
      overlay.classList.remove('hidden');
      
      // Закрываем инвентарь при открытии паузы
      const inventoryOverlay = document.getElementById('inventoryOverlay');
      if (inventoryOverlay && !inventoryOverlay.classList.contains('hidden')) {
        (async () => {
          const { InventoryManager } = await import('./InventoryManager.js');
          InventoryManager.toggleInventory();
        })();
      }
      
      // Скрываем игровые кнопки во время паузы
      const inventoryToggleBtn = document.getElementById('inventoryToggle');
      const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
      const pauseBtn = document.getElementById('pauseBtn');
      const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
      const quickPotionsContainer = document.querySelector('.quick-potions-container');
      
      if (inventoryToggleBtn) inventoryToggleBtn.style.display = 'none';
      if (mobileInventoryBtn) mobileInventoryBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (desktopAbilityBtn) desktopAbilityBtn.style.display = 'none';
      if (quickPotionsContainer) quickPotionsContainer.style.display = 'none';
      
      // Инициализируем обработчики клавиатуры для слайдеров
      (async () => {
        const { SettingsManager } = await import('./SettingsManager.js');
        SettingsManager.setupAudioEventListeners();
        
        // Также инициализируем обработчики для кнопок паузы
        setTimeout(() => {
          SettingsManager.setupPauseEventListeners();
        }, 100);
      })();
      
      // Обновляем навигацию по меню при открытии паузы
      setTimeout(() => {
        MenuNavigationManager.updateFocusableElements();
      }, 100);
      
      // Уменьшаем громкость музыки при паузе
      this.dimMusicOnPause();
    } else {
      overlay.classList.add('hidden');
      
      // Показываем игровые кнопки при возобновлении
      const inventoryToggleBtn = document.getElementById('inventoryToggle');
      const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
      const pauseBtn = document.getElementById('pauseBtn');
      const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
      const quickPotionsContainer = document.querySelector('.quick-potions-container');
      
      if (inventoryToggleBtn) inventoryToggleBtn.style.display = '';
      if (mobileInventoryBtn) mobileInventoryBtn.style.display = '';
      if (pauseBtn) pauseBtn.style.display = '';
      if (desktopAbilityBtn) desktopAbilityBtn.style.display = '';
      if (quickPotionsContainer) quickPotionsContainer.style.display = '';
      
      // Восстанавливаем громкость музыки при возобновлении
      this.restoreMusicOnResume();
    }
  }
  
  static dimMusicOnPause() {
    // Асинхронно уменьшаем громкость музыки до 10%
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      if (audioManager.currentMusic) {
        audioManager.currentMusic.volume = gameState.audio.musicVolume * gameState.audio.masterVolume * 0.1;
      }
    })();
  }
  
  static restoreMusicOnResume() {
    // Асинхронно восстанавливаем громкость музыки
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      if (audioManager.currentMusic) {
        audioManager.currentMusic.volume = gameState.audio.musicVolume * gameState.audio.masterVolume;
      }
    })();
  }
} // Принудительное обновление кеша - Fri Aug  1 19:39:05 MSK 2025
