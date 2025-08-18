/* Darkfall Depths - Главный файл игры */

// Импорты конфигурации
import { TILE_SIZE, MAP_SIZE, CHARACTERS, ENEMY_TYPES, generateRandomItem } from './config/constants.js';

// Импорты ядра
import { gameState, setCanvasElements } from './core/GameState.js';

// Импорты аудио
import { audioManager } from './audio/AudioManager.js';

// Импорты карты
import { MapGenerator } from './map/MapGenerator.js';
import { WebGLFogOfWar } from './map/WebGLFogOfWar.js';

// Импорты сущностей
import { Entity } from './entities/Entity.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Projectile, FireballProjectile, EnemyProjectile } from './entities/Projectile.js';
import { DroppedItem } from './entities/DroppedItem.js';
import { Portal } from './entities/Portal.js';

// Импорты эффектов
import { createParticle } from './effects/Particle.js';

// Импорты ввода
import { InputManager } from './input/InputManager.js';

// Импорты UI
import { ScreenManager } from './ui/ScreenManager.js';
import { InventoryManager } from './ui/InventoryManager.js';
import { RecordsManager } from './ui/RecordsManager.js';
import { SettingsManager } from './ui/SettingsManager.js';
import { ContextMenuManager } from './ui/ContextMenuManager.js';
import { MenuNavigationManager } from './ui/MenuNavigationManager.js';
import { InventorySpriteRenderer } from './ui/InventorySpriteRenderer.js';

// Импорты утилит
import { Utils } from './utils/Utils.js';
import { Logger } from './utils/Logger.js';

// Импорты игры
import { GameEngine } from './game/GameEngine.js';
import { LevelManager } from './game/LevelManager.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';

// Глобальные переменные для совместимости
window.gameState = gameState;
window.TILE_SIZE = TILE_SIZE;
window.MAP_SIZE = MAP_SIZE;
window.CHARACTERS = CHARACTERS;
window.ENEMY_TYPES = ENEMY_TYPES;
window.generateRandomItem = generateRandomItem;
window.Utils = Utils;
window.Logger = Logger;
window.PerformanceMonitor = PerformanceMonitor;
window.audioManager = audioManager;
window.MapGenerator = MapGenerator;
window.WebGLFogOfWar = WebGLFogOfWar;
window.Entity = Entity;
window.Player = Player;
window.Enemy = Enemy;
window.Projectile = Projectile;
window.FireballProjectile = FireballProjectile;
window.EnemyProjectile = EnemyProjectile;
window.DroppedItem = DroppedItem;
window.Portal = Portal;
window.createParticle = createParticle;
window.InputManager = InputManager;
window.GameEngine = GameEngine;
window.LevelManager = LevelManager;
window.InventoryManager = InventoryManager;
window.ContextMenuManager = ContextMenuManager;
window.InventorySpriteRenderer = InventorySpriteRenderer;

// Экспортируем все для использования в других модулях
export {
  gameState,
  TILE_SIZE,
  MAP_SIZE,
  CHARACTERS,
  ENEMY_TYPES,
  generateRandomItem,
  Utils,
  Logger,
  PerformanceMonitor,
  audioManager,
  MapGenerator,
  WebGLFogOfWar,
  Entity,
  Player,
  Enemy,
  Projectile,
  FireballProjectile,
  EnemyProjectile,
  DroppedItem,
  Portal,
  createParticle,
  InputManager,
  GameEngine,
  LevelManager,
  ScreenManager,
  InventoryManager,
  RecordsManager,
  SettingsManager,
  InventorySpriteRenderer
};

// Временный код для тестирования звуковых эффектов
// Раскомментируйте следующую строку для тестирования звуков в консоли браузера:
// window.testSounds = () => { audioManager.testAllSounds(); };
// Использование: testSounds() в консоли браузера



// Инициализация игры
document.addEventListener('DOMContentLoaded', async () => {
  // Настройка логирования для продакшена (только критические ошибки)
  Logger.enableProduction();
  
  // Проверяем, запущена ли игра через HTTP сервер
  const isLocalFile = window.location.protocol === 'file:';
  if (isLocalFile) {
    Logger.warn('Игра запущена через file:// протокол. Некоторые функции могут не работать.');
  }
  
  // Инициализация экранов теперь происходит в ScreenManager.init()
  
  const loadingProgress = document.getElementById('loadingProgress');
  const loadingText = document.querySelector('.loading-text');
  
  const updateProgress = (step, total = 5, description = '') => {
    const progress = Math.round((step / total) * 100);
    const loadingBar = document.getElementById('loadingBar');
    
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
    
    if (loadingProgress) {
      loadingProgress.textContent = `${progress}%`;
    }
    
    if (loadingText) {
      const text = description ? `${description}...` : 'Погружение в бездну...';
      loadingText.textContent = text;
    }
  };
  
      try {
      updateProgress(1, 5, 'Пробуждение древних руин');
      setCanvasElements();
      
      // Инициализируем систему экранов
      ScreenManager.init();
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(2, 5, 'Пробуждение эха подземелий');
      
      // Предварительно загружаем все аудио файлы с отображением прогресса
      // Ждем полной загрузки всех файлов перед продолжением
      const audioLoaded = await audioManager.preloadAllAudio((progress, description) => {
        updateProgress(2 + (progress / 100), 5, description);
      });
      
      // Проверяем, что все файлы загружены
      if (!audioLoaded) {
        throw new Error('Не удалось загрузить все аудио файлы');
      }
      
      // Инициализируем аудио систему
      await audioManager.init();
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(3, 5, 'Пробуждение темных сил');
      try {
        await GameEngine.init();
        
        // Инициализируем контекстное меню
        ContextMenuManager.init();
        
        // Инициализируем навигацию по меню
        MenuNavigationManager.init();
        
        // Инициализируем рендерер спрайтов для инвентаря
        InventorySpriteRenderer.init();
        
        // Инициализируем менеджер настроек
        SettingsManager.init();
        
        // Инициализируем менеджер инвентаря
        InventoryManager.init();
        
        // Дополнительная инициализация мобильных элементов управления
        setTimeout(() => {
          const mobileControls = document.getElementById('mobileControls');
          const joystick = document.getElementById('joystickContainer');
          const abilityBtn = document.getElementById('abilityBtn');
          const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
          
          if (window.innerWidth <= 768) {
            // Мобильная версия
            if (mobileControls) {
              mobileControls.classList.remove('hidden');
            }
            if (joystick) {
              joystick.style.display = 'flex';
            }
            if (abilityBtn) {
              abilityBtn.style.display = 'flex';
            }
            if (mobileInventoryBtn) {
              mobileInventoryBtn.style.display = 'flex';
            }
          } else {
            // Десктопная версия
            if (mobileControls) {
              mobileControls.classList.add('hidden');
            }
          }
        }, 1000);
      } catch (gameError) {
        Logger.warn('Ошибка инициализации игры:', gameError);
        // Продолжаем инициализацию даже при ошибке
      }
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(4, 5, 'Настройка игровых систем');
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(5, 5, 'Погружение завершено');
      
      // Добавляем обработчик изменения размера окна для мобильных элементов управления
      window.addEventListener('resize', () => {
        const mobileControls = document.getElementById('mobileControls');
        const joystick = document.getElementById('joystickContainer');
        const abilityBtn = document.getElementById('abilityBtn');
        const mobileInventoryBtn = document.getElementById('mobileInventoryBtn');
        
        if (window.innerWidth <= 768) {
          // Мобильная версия
          if (mobileControls) {
            mobileControls.classList.remove('hidden');
          }
          if (joystick) {
            joystick.style.display = 'flex';
          }
          if (abilityBtn) {
            abilityBtn.style.display = 'flex';
          }
          if (mobileInventoryBtn) {
            mobileInventoryBtn.style.display = 'flex';
          }
        } else {
          // Десктопная версия
          if (mobileControls) {
            mobileControls.classList.add('hidden');
          }
        }
      });
    
      // Переключаемся на главное меню после полной инициализации
      try {
        ScreenManager.switchScreen('menu');
        
        // Принудительно запускаем музыку на главном экране
        try {
          audioManager.forceStartMusic();
        } catch (audioError) {
          Logger.warn('Не удалось запустить музыку:', audioError);
        }
      } catch (switchError) {
        Logger.error('Ошибка переключения на главное меню:', switchError);
        // Принудительно показываем главное меню
        const loadingScreen = document.getElementById('loadingScreen');
        const menuScreen = document.getElementById('menuScreen');
        if (loadingScreen && menuScreen) {
          loadingScreen.classList.add('hidden');
          loadingScreen.classList.remove('active');
          menuScreen.classList.remove('hidden');
          menuScreen.classList.add('active');
        }
      }
      

    
  } catch (error) {
    Logger.error('Ошибка инициализации игры:', error);
    Logger.error('❌ Stack:', error.stack);
    
    if (loadingText) {
      if (error.message.includes('аудио') || error.message.includes('Аудио')) {
        loadingText.textContent = 'Ошибка загрузки аудио файлов. Перезагрузите страницу.';
      } else {
        loadingText.textContent = 'Ошибка загрузки игры. Перезагрузите страницу.';
      }
    }
    
    // Показываем кнопку перезагрузки
    const loadingContent = document.querySelector('.loading-content');
    if (loadingContent) {
      const reloadBtn = document.createElement('button');
      reloadBtn.textContent = '🔄 Перезагрузить';
      reloadBtn.className = 'btn btn--primary gothic-btn mt-4';
      reloadBtn.onclick = () => window.location.reload();
      loadingContent.appendChild(reloadBtn);
    }
  }
}); // Принудительное обновление кеша - Fri Aug  1 19:41:14 MSK 2025
