/* Darkfall Depths - Управление экранами */

import { gameState } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';
import { CHARACTERS } from '../config/constants.js';
import { MenuNavigationManager } from './MenuNavigationManager.js';

export class ScreenManager {
  static switchScreen(screenName) {
    console.log('🖥️ Switching to screen:', screenName);
    
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.add('active');
      gameState.screen = screenName;
      console.log('✅ Screen switched successfully to:', screenName);
      
      // Управление музыкой при переключении экранов
      console.log(`🎵 Switching music for screen: ${screenName}`);
      if (screenName === 'game') {
        // На игровом экране играет stage1
        console.log('🎵 Switching to stage1 music for game screen');
        audioManager.playMusic('stage1');
      } else if (screenName === 'menu' || screenName === 'select') {
        // На главном экране и экране выбора персонажей продолжаем играть Main
        // (не перезапускаем, если уже играет)
        console.log('🎵 Switching to main music for menu/select screen');
        if (!audioManager.currentMusic || audioManager.currentMusic.src !== audioManager.musicTracks.main.src) {
          audioManager.playMusic('main');
        } else {
          console.log('🎵 Main music already playing, not switching');
        }
      } else {
        // На других экранах (records, settings) продолжаем играть Main
        console.log('🎵 Switching to main music for other screen');
        if (!audioManager.currentMusic || audioManager.currentMusic.src !== audioManager.musicTracks.main.src) {
          audioManager.playMusic('main');
        } else {
          console.log('🎵 Main music already playing, not switching');
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
      
      // Обновляем навигацию по клавиатуре при переключении экранов
      setTimeout(() => {
        MenuNavigationManager.refreshNavigation();
      }, 200); // Небольшая задержка для полной загрузки DOM
    } else {
      console.error('Screen not found:', screenName + 'Screen');
    }
  }

  static buildCharacterSelect() {
    const charList = document.getElementById('charList');
    if (!charList) return;
    
    charList.innerHTML = '';
    
    // Принудительное обновление кеша
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
      
      card.addEventListener('click', async () => {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        gameState.selectedCharacter = char;
        
        // Небольшая задержка для анимации выбора
        setTimeout(async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.startGame();
        }, 300);
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
        console.log('Inventory toggle attempted during pause - ignoring');
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
        const healthPotionSlot = document.getElementById('healthPotionSlot');
        
        if (inventoryToggleBtn) inventoryToggleBtn.style.display = '';
        if (pauseBtn) pauseBtn.style.display = '';
        if (desktopAbilityBtn) desktopAbilityBtn.style.display = '';
        if (healthPotionSlot) healthPotionSlot.style.display = '';
      }
    }
  }
  
  static async togglePause() {
    console.log('togglePause called, screen:', gameState.screen, 'isPaused:', gameState.isPaused);
    if (gameState.screen !== 'game') {
      console.log('Not in game screen, ignoring pause toggle');
      return;
    }
    
    gameState.isPaused = !gameState.isPaused;
    const overlay = document.getElementById('pauseOverlay');
    
    if (!overlay) {
      console.error('❌ Pause overlay not found');
      return;
    }
    
    console.log('Pause overlay found, setting isPaused to:', gameState.isPaused);
    
    if (gameState.isPaused) {
      overlay.classList.remove('hidden');
      console.log('Pause overlay shown');
      
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
      const pauseBtn = document.getElementById('pauseBtn');
      const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
      const healthPotionSlot = document.getElementById('healthPotionSlot');
      
      if (inventoryToggleBtn) inventoryToggleBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (desktopAbilityBtn) desktopAbilityBtn.style.display = 'none';
      if (healthPotionSlot) healthPotionSlot.style.display = 'none';
      
      // Инициализируем обработчики клавиатуры для слайдеров
      (async () => {
        const { SettingsManager } = await import('./SettingsManager.js');
        SettingsManager.setupAudioEventListeners();
      })();
      
      // Обновляем навигацию по меню при открытии паузы
      setTimeout(() => {
        MenuNavigationManager.updateFocusableElements();
      }, 100);
      
      // Уменьшаем громкость музыки при паузе
      this.dimMusicOnPause();
    } else {
      overlay.classList.add('hidden');
      console.log('Pause overlay hidden');
      
      // Показываем игровые кнопки при возобновлении
      const inventoryToggleBtn = document.getElementById('inventoryToggle');
      const pauseBtn = document.getElementById('pauseBtn');
      const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
      const healthPotionSlot = document.getElementById('healthPotionSlot');
      
      if (inventoryToggleBtn) inventoryToggleBtn.style.display = '';
      if (pauseBtn) pauseBtn.style.display = '';
      if (desktopAbilityBtn) desktopAbilityBtn.style.display = '';
      if (healthPotionSlot) healthPotionSlot.style.display = '';
      
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
