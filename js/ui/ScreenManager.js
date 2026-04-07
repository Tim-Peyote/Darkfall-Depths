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
      targetScreen.classList.add('active', 'screen-fade-in');
      targetScreen.style.display = 'flex';
      gameState.screen = screenName;

      // Убираем класс анимации после завершения
      targetScreen.addEventListener('animationend', () => {
        targetScreen.classList.remove('screen-fade-in');
      }, { once: true });
      
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
            
            // Дополнительная проверка кнопок через 500мс
            setTimeout(() => {
              const pauseBtn = document.getElementById('pauseBtn');
              const inventoryBtn = document.getElementById('inventoryToggle');
              const mobileControls = document.getElementById('mobileControls');
              const joystick = document.getElementById('joystickContainer');
              const abilityBtn = document.getElementById('abilityBtn');
              const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
              
              if (pauseBtn && inventoryBtn) {
                // Logger.debug('✅ Game buttons found and initialized');
                // Принудительно показываем кнопки
                pauseBtn.style.display = 'flex';
                inventoryBtn.style.display = 'flex';
              } else {
                import('../utils/Logger.js').then(({ Logger }) => Logger.warn('⚠️ Some game buttons not found, retrying...'));
                SettingsManager.setupGameButtonEventListeners();
              }
              
              // Проверяем мобильные элементы управления
              if (window.innerWidth <= 768) {
                if (mobileControls) {
                  mobileControls.classList.remove('hidden');
                  // Logger.debug('✅ Mobile controls enabled');
                }
                if (joystick) {
                  joystick.style.display = 'flex';
                  // Logger.debug('✅ Joystick enabled');
                }
                if (abilityBtn) {
                  abilityBtn.style.display = 'flex';
                  // Logger.debug('✅ Mobile ability button enabled');
                }
                if (mobileInventoryBtn) {
                  mobileInventoryBtn.style.display = 'flex';
                  // Logger.debug('✅ Mobile inventory button enabled');
                }
              } else {
                if (mobileControls) {
                  mobileControls.classList.add('hidden');
                  // Logger.debug('✅ Mobile controls disabled on desktop');
                }
              }
            }, 500);
          })();
        }, 100);
      }
      
      // Обновляем навигацию по клавиатуре при переключении экранов
      setTimeout(() => {
        MenuNavigationManager.refreshNavigation();
      }, 200);
    } else {
      import('../utils/Logger.js').then(({ Logger }) => Logger.error('Screen not found:', screenName + 'Screen'));
    }
  }

  static buildCharacterSelect() {
    const charList = document.getElementById('charList');
    const characterAvatars = document.getElementById('characterAvatars');
    const characterDetails = document.getElementById('characterDetails');
    
    if (!charList || !characterAvatars) return;
    
    // Очищаем контейнеры
    charList.innerHTML = '';
    characterAvatars.innerHTML = '';
    
    // Скрываем кнопку "Старт" при загрузке экрана
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
      startGameBtn.style.display = 'none';
    }
    
    // Скрываем детали персонажа
    if (characterDetails) {
      characterDetails.style.display = 'none';
    }
    
    // Убираем автоматический фокус на всех устройствах
    setTimeout(() => {
      const characterCards = document.querySelectorAll('.character-card');
      characterCards.forEach(card => {
        card.classList.remove('keyboard-focus');
        card.blur();
      });
    }, 50);
    
    // Добавляем обработчик изменения размера окна для перестройки карточек
    const handleResize = () => {
      if (gameState.screen === 'select') {
        this.buildCharacterSelect();
      }
    };
    
    // Удаляем старый обработчик, если он есть
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    // Проверяем, является ли устройство мобильным
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Мобильная версия с аватарами и деталями
      // Logger.debug('📱 Building mobile version...');
      this.buildMobileCharacterSelect();
      
      // Скрываем десктопный контейнер
      const charList = document.getElementById('charList');
      if (charList) {
        charList.style.display = 'none';
        // Logger.debug('🔧 Hidden charList (desktop container)');
      }
    } else {
      // Десктопная версия с карточками
              // Logger.debug('🖥️ Building desktop version...');
      this.buildDesktopCharacterSelect();
      
      // Скрываем мобильный контейнер
      const characterAvatars = document.getElementById('characterAvatars');
      if (characterAvatars) {
        characterAvatars.style.display = 'none';
        // Logger.debug('🔧 Hidden characterAvatars (mobile container)');
      }
    }
  }
  
  static buildMobileCharacterSelect() {
    const characterAvatars = document.getElementById('characterAvatars');
    const characterDetails = document.getElementById('characterDetails');
    
          // Logger.debug('🔍 Building mobile character select...');
      // Logger.debug('characterAvatars element:', characterAvatars);
      // Logger.debug('characterDetails element:', characterDetails);
    
    // Принудительно показываем контейнер аватаров
    if (characterAvatars) {
      characterAvatars.style.display = 'flex';
      characterAvatars.style.visibility = 'visible';
      characterAvatars.style.opacity = '1';
      // Logger.debug('🔧 Forced characterAvatars to display: flex');
    }
    
    // Скрываем детали персонажа по умолчанию
    if (characterDetails) {
      characterDetails.style.display = 'none';
      characterDetails.style.opacity = '0';
      characterDetails.style.transform = 'translateY(20px)';
      characterDetails.style.visibility = 'hidden';
      // Logger.debug('🔧 Hidden characterDetails by default');
    }
    
    CHARACTERS.forEach((char, index) => {
      // Определяем иконку способности
      let abilityIcon = '';
      if (char.hasDash) {
        abilityIcon = '💨';
      } else if (char.hasShield) {
        abilityIcon = '🛡️';
      } else if (char.hasBlast) {
        abilityIcon = '💥';
      }
      
      // Создаем контейнер аватара
      const avatarContainer = document.createElement('div');
      avatarContainer.className = 'character-avatar-container';
      avatarContainer.style.animationDelay = `${index * 0.1}s`;
      avatarContainer.dataset.characterId = char.id;
      
      avatarContainer.innerHTML = `
        <div class="character-avatar-small">
          <div class="character-sprite-small">${char.sprite}</div>
          <div class="character-ability-icon-small">${abilityIcon}</div>
        </div>
        <div class="character-avatar-info">
          <div class="character-avatar-name">${char.name}</div>
          <div class="character-avatar-class">${char.class}</div>
        </div>
      `;
      
      avatarContainer.addEventListener('click', () => {
        // Logger.debug('🎯 Avatar clicked:', char.name);
        
        // Убираем выделение со всех аватаров
        document.querySelectorAll('.character-avatar-container').forEach(a => a.classList.remove('selected'));
        avatarContainer.classList.add('selected');
        
        // Устанавливаем выбранного персонажа
        gameState.selectedCharacter = char;
        
        // Показываем детали персонажа сразу
        this.showCharacterDetails(char);
        
        // Показываем кнопку "Старт"
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
          startGameBtn.style.display = 'block';
        }
      });
      
      // Добавляем также обработчик для touch событий
      avatarContainer.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Logger.debug('🎯 Avatar touched:', char.name);
        
        // Убираем выделение со всех аватаров
        document.querySelectorAll('.character-avatar-container').forEach(a => a.classList.remove('selected'));
        avatarContainer.classList.add('selected');
        
        // Устанавливаем выбранного персонажа
        gameState.selectedCharacter = char;
        
        // Показываем детали персонажа сразу
        this.showCharacterDetails(char);
        
        // Показываем кнопку "Старт"
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
          startGameBtn.style.display = 'block';
        }
      });
      
      characterAvatars.appendChild(avatarContainer);
    });
    
          // Logger.debug('✅ Mobile character select built. Total avatars:', characterAvatars.children.length);
      // Logger.debug('characterAvatars display style:', characterAvatars.style.display);
      // Logger.debug('characterAvatars computed style:', window.getComputedStyle(characterAvatars).display);
    
    // Принудительно показываем все аватары
    const avatarContainers = characterAvatars.querySelectorAll('.character-avatar-container');
    avatarContainers.forEach((container, index) => {
      container.style.display = 'flex';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
              // Logger.debug(`🔧 Forced avatar ${index + 1} to display: flex`);
      
      // Принудительно показываем элементы внутри аватара
      const avatarSmall = container.querySelector('.character-avatar-small');
      const avatarInfo = container.querySelector('.character-avatar-info');
      const spriteSmall = container.querySelector('.character-sprite-small');
      const abilityIcon = container.querySelector('.character-ability-icon-small');
      const avatarName = container.querySelector('.character-avatar-name');
      const avatarClass = container.querySelector('.character-avatar-class');
      
      if (avatarSmall) {
        avatarSmall.style.display = 'flex';
        avatarSmall.style.visibility = 'visible';
        avatarSmall.style.opacity = '1';
      }
      if (avatarInfo) {
        avatarInfo.style.display = 'flex';
        avatarInfo.style.visibility = 'visible';
        avatarInfo.style.opacity = '1';
      }
      if (spriteSmall) {
        spriteSmall.style.visibility = 'visible';
        spriteSmall.style.opacity = '1';
      }
      if (abilityIcon) {
        abilityIcon.style.display = 'flex';
        abilityIcon.style.visibility = 'visible';
        abilityIcon.style.opacity = '1';
      }
      if (avatarName) {
        avatarName.style.visibility = 'visible';
        avatarName.style.opacity = '1';
      }
      if (avatarClass) {
        avatarClass.style.visibility = 'visible';
        avatarClass.style.opacity = '1';
      }
    });
  }
  
  static buildDesktopCharacterSelect() {
    const charList = document.getElementById('charList');
    
    CHARACTERS.forEach((char, index) => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.style.animationDelay = `${index * 0.1}s`;
      
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
      
      // Полная версия для десктопа
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
  
  static showCharacterDetails(char) {
    const characterDetails = document.getElementById('characterDetails');
    const detailsSprite = document.getElementById('detailsSprite');
    const detailsName = document.getElementById('detailsName');
    const detailsClass = document.getElementById('detailsClass');
    const detailsDescription = document.getElementById('detailsDescription');
    const detailsStats = document.getElementById('detailsStats');
    
    if (!characterDetails) return;
    
    // Logger.debug('🎯 Showing character details for:', char.name);
    // Logger.debug('Character data:', char);
    // Logger.debug('detailsSprite element:', detailsSprite);
    // Logger.debug('detailsName element:', detailsName);
    // Logger.debug('detailsClass element:', detailsClass);
    // Logger.debug('detailsDescription element:', detailsDescription);
    // Logger.debug('detailsStats element:', detailsStats);
    
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
    
    // Обновляем детали персонажа
    if (detailsSprite) {
      detailsSprite.textContent = char.sprite;
      // Logger.debug('✅ Updated detailsSprite with:', char.sprite);
    }
    if (detailsName) {
      detailsName.textContent = char.name;
      // Logger.debug('✅ Updated detailsName with:', char.name);
    }
    if (detailsClass) {
      detailsClass.textContent = char.class;
      // Logger.debug('✅ Updated detailsClass with:', char.class);
    }
    if (detailsDescription) {
      detailsDescription.textContent = char.description;
      // Logger.debug('✅ Updated detailsDescription with:', char.description);
    }
    
    // Обновляем статистику
    if (detailsStats) {
      // Logger.debug('✅ Updating detailsStats with character stats');
      detailsStats.innerHTML = `
        <div class="character-details-stat">
          <div class="character-details-stat-label">HP</div>
          <div class="character-details-stat-value">${char.hp}</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Урон</div>
          <div class="character-details-stat-value">${char.damage}</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Скорость</div>
          <div class="character-details-stat-value">${char.moveSpeed}</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Дальность</div>
          <div class="character-details-stat-value">${char.attackRadius}</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Атака</div>
          <div class="character-details-stat-value">${char.attackSpeed}с</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Тип</div>
          <div class="character-details-stat-value">${char.type === 'melee' ? 'Ближний' : 'Дальний'}</div>
        </div>
        <div class="character-details-stat">
          <div class="character-details-stat-label">Способность</div>
          <div class="character-details-stat-value">${abilityName}</div>
        </div>
      `;
    }
    
    // Показываем детали с плавной анимацией
    characterDetails.style.display = 'flex';
    characterDetails.style.visibility = 'visible';
    characterDetails.style.opacity = '0';
    characterDetails.style.transform = 'translateY(20px) scale(0.98)';
    characterDetails.style.zIndex = '1000';
    characterDetails.style.position = 'relative';
    characterDetails.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Logger.debug('🎯 Showing character details for:', char.name);
    
    // Запускаем плавную анимацию с задержкой
    setTimeout(() => {
      characterDetails.style.opacity = '1';
      characterDetails.style.transform = 'translateY(0) scale(1)';
      // Logger.debug('🎯 Smooth animation started');
    }, 50);
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
      import('../utils/Logger.js').then(({ Logger }) => Logger.error('❌ Pause overlay not found'));
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
