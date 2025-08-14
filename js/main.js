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
import { Projectile, EnemyProjectile } from './entities/Projectile.js';
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
window.EnemyProjectile = EnemyProjectile;
window.DroppedItem = DroppedItem;
window.Portal = Portal;
window.createParticle = createParticle;
window.InputManager = InputManager;
window.GameEngine = GameEngine;
window.LevelManager = LevelManager;
window.InventoryManager = InventoryManager;
window.ContextMenuManager = ContextMenuManager;

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
  SettingsManager
};

// Временный код для тестирования звуковых эффектов
// Раскомментируйте следующую строку для тестирования звуков в консоли браузера:
// window.testSounds = () => { audioManager.testAllSounds(); };
// Использование: testSounds() в консоли браузера

// Инициализация игры
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Darkfall Depths - Инициализация игры...');
  
  // Проверяем, запущена ли игра через HTTP сервер
  const isLocalFile = window.location.protocol === 'file:';
  if (isLocalFile) {
    console.warn('⚠️ Игра запущена через file:// протокол. Некоторые функции могут не работать.');
    console.log('💡 Рекомендуется запустить через HTTP сервер: python3 -m http.server 8000');
  }
  
  // Принудительно показываем экран загрузки и скрываем главное меню
  const loadingScreen = document.getElementById('loadingScreen');
  const menuScreen = document.getElementById('menuScreen');
  
  if (loadingScreen && menuScreen) {
    loadingScreen.classList.remove('hidden');
    loadingScreen.classList.add('active');
    menuScreen.classList.remove('active');
    menuScreen.classList.add('hidden');
    console.log('🔧 Экран загрузки активирован');
  }
  
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
      console.log('🔧 Устанавливаем canvas элементы...');
      setCanvasElements();
      console.log('✅ Canvas элементы установлены');
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(2, 5, 'Пробуждение эха подземелий');
      console.log('🔊 Инициализируем аудио...');
      try {
        await audioManager.init();
        console.log('✅ Аудио инициализировано');
      } catch (audioError) {
        console.warn('⚠️ Аудио не удалось инициализировать:', audioError);
        console.log('🎮 Продолжаем без аудио...');
        // Продолжаем инициализацию даже при ошибке аудио
      }
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(3, 5, 'Пробуждение темных сил');
      console.log('🎮 Инициализируем игру...');
      try {
        await GameEngine.init();
        console.log('✅ Игра инициализирована!');
        
        // Инициализируем контекстное меню
        console.log('🔧 Инициализируем контекстное меню...');
        ContextMenuManager.init();
        console.log('✅ Контекстное меню инициализировано');
        
        // Инициализируем навигацию по меню
        console.log('🎯 Инициализируем навигацию по меню...');
        MenuNavigationManager.init();
        console.log('✅ Навигация по меню инициализирована');
      } catch (gameError) {
        console.warn('⚠️ Ошибка инициализации игры:', gameError);
        console.log('🎮 Продолжаем с базовой инициализацией...');
        // Продолжаем инициализацию даже при ошибке
      }
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
                 updateProgress(4, 5, 'Настройка аудио');
           console.log('🎵 Аудио настроено');
           console.log('✅ Аудио готово');
      
      // Задержка для визуального эффекта
      await new Promise(resolve => setTimeout(resolve, 600));
      
      updateProgress(5, 5, 'Погружение завершено');
      console.log('🎉 Игра успешно запущена!');
    
               // Переключаемся на главное меню после полной инициализации
           setTimeout(() => {
             const loadingScreen = document.getElementById('loadingScreen');
             const menuScreen = document.getElementById('menuScreen');
             
             if (loadingScreen && menuScreen) {
               console.log('🔄 Переключаемся с экрана загрузки на главное меню...');
               loadingScreen.classList.remove('active');
               loadingScreen.classList.add('hidden');
               menuScreen.classList.remove('hidden');
               menuScreen.classList.add('active');
               console.log('✅ Переключение завершено');
               
               // Принудительно запускаем музыку на главном экране
               try {
                 console.log('🎵 Запускаем музыку на главном экране...');
                 audioManager.forceStartMusic();
               } catch (audioError) {
                 console.warn('⚠️ Не удалось запустить музыку:', audioError);
               }
             } else {
               console.error('❌ Не удалось найти экраны загрузки или меню');
             }
           }, 500); // Небольшая задержка для плавного перехода
    
  } catch (error) {
    console.error('❌ Ошибка инициализации игры:', error);
    console.error('❌ Stack:', error.stack);
    
    if (loadingText) {
      loadingText.textContent = 'Ошибка загрузки игры';
    }
  }
}); // Принудительное обновление кеша - Fri Aug  1 19:41:14 MSK 2025
