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
  // Проверяем, запущена ли игра через HTTP сервер
  const isLocalFile = window.location.protocol === 'file:';
  if (isLocalFile) {
    console.warn('⚠️ Игра запущена через file:// протокол. Некоторые функции могут не работать.');
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
      try {
        await audioManager.init();
      } catch (audioError) {
        console.warn('⚠️ Аудио не удалось инициализировать:', audioError);
        // Продолжаем инициализацию даже при ошибке аудио
      }
      
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
      } catch (gameError) {
        console.warn('⚠️ Ошибка инициализации игры:', gameError);
        // Продолжаем инициализацию даже при ошибке
      }
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
                 updateProgress(4, 5, 'Настройка аудио');
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(5, 5, 'Погружение завершено');
    
      // Переключаемся на главное меню после полной инициализации
      try {
        ScreenManager.switchScreen('menu');
        
        // Принудительно запускаем музыку на главном экране
        try {
          audioManager.forceStartMusic();
        } catch (audioError) {
          console.warn('⚠️ Не удалось запустить музыку:', audioError);
        }
      } catch (switchError) {
        console.error('❌ Ошибка переключения на главное меню:', switchError);
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
      
      // Принудительное переключение через 3 секунды, если что-то пошло не так
      setTimeout(() => {
        if (gameState.screen === 'loading') {
          const loadingScreen = document.getElementById('loadingScreen');
          const menuScreen = document.getElementById('menuScreen');
          if (loadingScreen && menuScreen) {
            loadingScreen.classList.add('hidden');
            loadingScreen.classList.remove('active');
            menuScreen.classList.remove('hidden');
            menuScreen.classList.add('active');
            gameState.screen = 'menu';
          }
        }
      }, 3000);
    
  } catch (error) {
    console.error('❌ Ошибка инициализации игры:', error);
    console.error('❌ Stack:', error.stack);
    
    if (loadingText) {
      loadingText.textContent = 'Ошибка загрузки игры';
    }
  }
}); // Принудительное обновление кеша - Fri Aug  1 19:41:14 MSK 2025
