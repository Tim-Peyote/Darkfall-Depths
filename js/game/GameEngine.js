/* Darkfall Depths - Игровой движок */

import { gameState, canvas, ctx, minimapCanvas, minimapCtx, DPR, Utils } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';
import { ScreenManager } from '../ui/ScreenManager.js';
import { InputManager } from '../input/InputManager.js';
import { SettingsManager } from '../ui/SettingsManager.js';
import { RecordsManager } from '../ui/RecordsManager.js';
import { LevelManager } from './LevelManager.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { TILE_SIZE, MAP_SIZE, ENEMY_TYPES, FRAME_TIME, CHARACTERS } from '../config/constants.js';
import { PerformanceMonitor } from '../core/PerformanceMonitor.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { WebGLFogOfWar } from '../map/WebGLFogOfWar.js';
import { LightingSystem } from '../map/LightingSystem.js';
import { Logger } from '../utils/Logger.js';
import { PlayerLight } from '../entities/PlayerLight.js';

let lastFrameTime = 0;
let gameLoopId = null;

export class GameEngine {
  static webglRenderer = null;
  static lightingSystem = null;
  static playerLight = null;
  static buffManager = null; // Кешированный BuffManager для избежания повторных импортов
  static inventoryManager = null; // Кешированный InventoryManager
  static inventorySpriteRenderer = null; // Кешированный InventorySpriteRenderer
  
  // Система кеширования тайлов для ускорения рендеринга
  static tileCache = new Map();
  static wallTileCanvas = null;
  static floorTileCanvas = null;
  
  // Переключатели для тестирования производительности
  static enableLighting = true;
  static enableFogOfWar = true;
  static enableParticles = true;
  
  static async init() {
    if (!canvas || !ctx) {
      Logger.error('Canvas elements not found');
      return;
    }
    
    // Инициализация WebGL рендерера
    this.webglRenderer = new WebGLRenderer(canvas);
    
    if (this.webglRenderer.isSupported()) {
      this.webglRenderer.setProjection(canvas.width / DPR, canvas.height / DPR);
    }
    
    // Инициализация системы освещения
    this.lightingSystem = new LightingSystem(this.webglRenderer);
    
    // Инициализация направленного света игрока
    this.playerLight = new PlayerLight(0, 0);
    
    // Инициализация кеширования тайлов для максимальной производительности
    this.initTileCache();
    
    // Инициализация мониторинга производительности
    PerformanceMonitor.init();
    
    // Инициализация ввода
    InputManager.init();

    // Предзагружаем менеджер баффов, чтобы избежать импорта в игровом цикле
    try {
      if (!this.buffManager) {
        const { BuffManager } = await import('../core/BuffManager.js');
        this.buffManager = BuffManager;
      }
    } catch (e) {
      Logger.warn('Ошибка инициализации BuffManager:', e);
    }
    
    // Инициализация менеджера сундуков
    try {
      const { ChestManager } = await import('../ui/ChestManager.js');
      ChestManager.init();
    } catch (e) {
      Logger.warn('Ошибка инициализации ChestManager:', e);
    }
    
    // Загрузка настроек и рекордов
    SettingsManager.loadSettings();
    RecordsManager.loadRecords();
    
    // Настройка обработчиков событий будет выполнена при переключении на экраны
    
    // Настройка обработчиков банок здоровья
    this.setupHealthPotionHandlers();
    
    // Убираем автоматическое переключение на главное меню - это вызывает баг
    // ScreenManager.switchScreen('menu');
    
    // Отложим resizeCanvas до показа игрового экрана
    // this.resizeCanvas();
  }

  static async startGame() {
    if (!gameState.selectedCharacter) {
      Logger.error('❌ No character selected');
      return;
    }
    
    // Проверяем, это новый запуск игры или продолжение
    const isNewGame = !gameState.gameRunning;
    
    if (isNewGame) {
      // Только при новом запуске игры сбрасываем прогрессию
      gameState.level = 1;
      gameState.gameTime = 0;
      
      // Инициализируем новую сессию
      (async () => {
        const { RecordsManager } = await import('../ui/RecordsManager.js');
        RecordsManager.startNewSession();
      })();
      
      // Сброс инвентаря только при новом запуске
      gameState.inventory.equipment = new Array(9).fill(null); // 9 слотов экипировки
      gameState.inventory.backpack = new Array(42).fill(null); // 42 слота рюкзака
      gameState.inventory.quickSlots = [null, null, null];
    } else {
      // При рестарте (после смерти) сбрасываем selectedCharacter к исходным значениям
      gameState.isRestart = true;
      gameState.isLevelTransition = false; // Это НЕ переход на следующий уровень
      if (gameState.selectedCharacter) {
        const originalChar = CHARACTERS.find(char => char.id === gameState.selectedCharacter.id);
        if (originalChar) {
          gameState.selectedCharacter = { ...originalChar };
        }
      }
    }
    
    // ВСЕГДА очищаем все временные баффы при запуске игры (новой или респауне)
    (async () => {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.clearAllBuffs();
      BuffManager.clearAllDebuffs();
    })();
    
    gameState.gameRunning = true;
    gameState.isPaused = false;
    
    // Останавливаем любую текущую музыку и запускаем музыку уровня
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.stopMusic(); // Останавливаем любую текущую музыку (включая levelComplete)
      audioManager.stopLevelComplete(); // Принудительно останавливаем levelComplete
      audioManager.playMusic('stage1'); // Запускаем музыку уровня
    })();
    
    await LevelManager.generateLevel();
    
    // Передаем карту в систему освещения после генерации уровня
    if (gameState.map && this.lightingSystem) {
      this.lightingSystem.setGameMap(gameState.map);
    }
    
    // Принудительно центрируем камеру на игроке
    if (gameState.player) {
      const canvasWidth = canvas ? canvas.width / DPR : 800;
      const canvasHeight = canvas ? canvas.height / DPR : 600;
      // Немедленно устанавливаем камеру без плавного перехода
      gameState.camera.x = gameState.player.x - canvasWidth / 2;
      gameState.camera.y = gameState.player.y - canvasHeight / 2;


    }
    
    ScreenManager.switchScreen('game');
    
    // Теперь, когда игровой экран видим, настраиваем canvas
    this.resizeCanvas();
    
    // Принудительно обновляем UI после запуска игры
    this.updateUI();
    this.updateQuickPotions();
    
    // Запускаем игровой цикл
    gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  static gameLoop(currentTime) {
    if (!gameState.gameRunning) {
      return;
    }
    
    // Ограничение FPS
    if (currentTime - lastFrameTime < FRAME_TIME) {
      gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
      return;
    }
    
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 1/30);
    lastFrameTime = currentTime;
    
    // Обновляем мониторинг производительности
    PerformanceMonitor.update(currentTime);
    
    try {
      if (!gameState.isPaused) {
        this.update(deltaTime);
      }
      
      this.render();
      gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    } catch (error) {
      Logger.error('❌ Error in game loop:', error);
      Logger.error('❌ Stack:', error.stack);
    }
  }

  static update(dt) {
    gameState.gameTime += dt;
    
    // Передаем карту в систему освещения если она еще не передана
    if (gameState.map && this.lightingSystem && !this.lightingSystem.gameMap) {
      this.lightingSystem.setGameMap(gameState.map);
    }
    
    // Обновление игрока
    if (gameState.player) {
      gameState.player.update(dt);
      
          // Обновление тумана войны (ультра оптимизированное)
    if (gameState.fogOfWar) {
      // Обновляем туман войны только каждые 10 кадров для максимальной производительности
      // и только если игрок существенно сдвинулся
      const frameCount = Math.floor(gameState.gameTime * 60);
      if (frameCount % 10 === 0) {
        const playerMoved = !this.lastFogUpdatePos || 
          Math.abs(gameState.player.x - this.lastFogUpdatePos.x) > 16 ||
          Math.abs(gameState.player.y - this.lastFogUpdatePos.y) > 16;
          
        if (playerMoved) {
          gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
          this.lastFogUpdatePos = { x: gameState.player.x, y: gameState.player.y };
        }
      }
    }
      
      // Обновление камеры (стабильное следование за игроком)
      const targetX = gameState.player.x - canvas.width / (2 * DPR);
      const targetY = gameState.player.y - canvas.height / (2 * DPR);
      
      // Используем более медленную интерполяцию для стабильности
      const cameraSpeed = 3; // Уменьшили с 5 до 3
      gameState.camera.x = Utils.lerp(gameState.camera.x, targetX, dt * cameraSpeed);
      gameState.camera.y = Utils.lerp(gameState.camera.y, targetY, dt * cameraSpeed);

      // Ограничиваем минимальное движение камеры для устранения дрожания
      const minMovement = 0.1;
      if (Math.abs(gameState.camera.x - targetX) < minMovement) {
        gameState.camera.x = targetX;
      }
      if (Math.abs(gameState.camera.y - targetY) < minMovement) {
        gameState.camera.y = targetY;
      }

      // Ограничиваем камеру размерами карты чтобы не было видно фон за пределами
      const mapWidth = gameState.map[0] ? gameState.map[0].length * TILE_SIZE : MAP_SIZE * TILE_SIZE;
      const mapHeight = gameState.map.length * TILE_SIZE;
      const viewWidth = canvas.width / DPR;
      const viewHeight = canvas.height / DPR;
      gameState.camera.x = Utils.clamp(gameState.camera.x, 0, Math.max(0, mapWidth - viewWidth));
      gameState.camera.y = Utils.clamp(gameState.camera.y, 0, Math.max(0, mapHeight - viewHeight));
      
      // Обновляем область видимости в системе освещения для оптимизации
      if (this.lightingSystem) {
        this.lightingSystem.updateCameraViewport(
          gameState.camera.x,
          gameState.camera.y,
          canvas.width / DPR,
          canvas.height / DPR
        );
      }
    }
    
    // Обновление сущностей (высоко оптимизированная версия без splice)
    this.updateEntitiesArray(gameState.entities, dt);
    
    // Обновление снарядов (высоко оптимизированная версия без splice)
    this.updateEntitiesArray(gameState.projectiles, dt);
    
    // Обновление частиц (высоко оптимизированная версия без splice)
    this.updateEntitiesArray(gameState.particles, dt);
    
    // Обновление источников света
    if (gameState.lightSources) {
      for (let i = 0; i < gameState.lightSources.length; i++) {
        const lightSource = gameState.lightSources[i];
        if (lightSource.active) {
          lightSource.update(dt);
        }
      }
    }
    
    // Обновляем UI только раз в 2 секунды для экономии ресурсов
    if (Math.floor(gameState.gameTime * 0.5) !== Math.floor((gameState.gameTime - dt) * 0.5)) {
      this.updateUI();
    }
    
    // Обновление временных баффов (оптимизированная версия)
    if (this.buffManager) {
      this.buffManager.update(dt);
    }
  }

  static render() {
    if (!ctx) {
      Logger.error('❌ Canvas context not available');
      return;
    }
    
    // Используем WebGL рендерер если доступен
    if (this.webglRenderer && this.webglRenderer.isSupported()) {
      this.renderWebGL();
    } else {
      this.renderCanvas2D();
    }
  }
  
  static renderWebGL() {
    // Очистка экрана через WebGL
    this.webglRenderer.clear();
    
    if (!gameState.map) {
      Logger.error('❌ Game map not available');
      return;
    }
    
    // Отрисовка карты через WebGL
    this.renderMap();
    
    // Отрисовка источников света
    if (gameState.lightSources) {
      for (let i = 0; i < gameState.lightSources.length; i++) {
        const lightSource = gameState.lightSources[i];
        if (lightSource.active) {
          lightSource.render(ctx, gameState.camera.x, gameState.camera.y);
        }
      }
    }
    
    // Отрисовка сущностей с culling (только видимые объекты)
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (!entity.isDead && this.isEntityVisible(entity)) {
        entity.draw();
      }
    }
    
    // Отрисовка снарядов с culling (только видимые объекты)
    for (let i = 0; i < gameState.projectiles.length; i++) {
      const projectile = gameState.projectiles[i];
      if (!projectile.isDead && this.isEntityVisible(projectile)) {
        projectile.draw();
      }
    }
    
    // Отрисовка частиц с culling (только видимые объекты)
    for (let i = 0; i < gameState.particles.length; i++) {
      const particle = gameState.particles[i];
      if (!particle.isDead && this.isEntityVisible(particle)) {
        particle.draw();
      }
    }
    
    // Отрисовка игрока поверх всего
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Отрисовка освещения (только если включено)
    if (this.enableLighting) {
      this.renderLighting();
    }
    
    // Отрисовка тумана войны (только если включено)
    if (this.enableFogOfWar) {
      this.renderFogOfWar();
    }
    
    // Отрисовка миникарты
    this.renderMinimap();
    
    // Отрисовка FPS индикатора (только в режиме разработки)
    this.renderFPSIndicator();
  }
  
  static renderCanvas2D() {
    // Очистка экрана
    ctx.fillStyle = '#0a0908';
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
    
    if (!gameState.map) {
      Logger.error('❌ Game map not available');
      return;
    }
    
    // Отрисовка карты
    this.renderMap();
    
    // Отрисовка источников света
    if (gameState.lightSources) {
      for (let i = 0; i < gameState.lightSources.length; i++) {
        const lightSource = gameState.lightSources[i];
        if (lightSource.active) {
          lightSource.render(ctx, gameState.camera.x, gameState.camera.y);
        }
      }
    }
    
    // Отрисовка сущностей с culling (максимально оптимизированная версия)
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (!entity.isDead && this.isEntityVisible(entity)) {
        entity.draw();
      }
    }
    
    // Отрисовка снарядов с culling (максимально оптимизированная версия)
    for (let i = 0; i < gameState.projectiles.length; i++) {
      const projectile = gameState.projectiles[i];
      if (!projectile.isDead && this.isEntityVisible(projectile)) {
        projectile.draw();
      }
    }
    
    // Отрисовка частиц с culling (максимально оптимизированная версия)
    for (let i = 0; i < gameState.particles.length; i++) {
      const particle = gameState.particles[i];
      if (!particle.isDead && this.isEntityVisible(particle)) {
        particle.draw();
      }
    }
    
    // Отрисовка игрока поверх всего
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Отрисовка освещения (только если включено)
    if (this.enableLighting) {
      this.renderLighting();
    }
    
    // Отрисовка тумана войны (только если включено)
    if (this.enableFogOfWar) {
      this.renderFogOfWar();
    }
    
    // Отрисовка миникарты
    this.renderMinimap();
    
    // Отрисовка FPS индикатора (только в режиме разработки)
    this.renderFPSIndicator();
  }

  static renderMap() {
    if (!gameState.map) {
      return;
    }
    
    // Используем WebGL рендерер если доступен
    if (this.webglRenderer && this.webglRenderer.isSupported()) {
      this.renderMapWebGL();
    } else {
      this.renderMapCanvas2D();
    }
  }
  
  static renderMapWebGL() {
    if (!gameState.map) return;
    
    // Используем динамический размер карты
    const mapWidth = gameState.map[0] ? gameState.map[0].length : MAP_SIZE;
    const mapHeight = gameState.map.length;
    
    const startX = Math.floor(gameState.camera.x / TILE_SIZE) - 1;
    const endX = Math.floor((gameState.camera.x + canvas.width / DPR) / TILE_SIZE) + 1;
    const startY = Math.floor(gameState.camera.y / TILE_SIZE) - 1;
    const endY = Math.floor((gameState.camera.y + canvas.height / DPR) / TILE_SIZE) + 1;
    
    // Ограничиваем область рендеринга динамическим размером карты
    const clampedStartX = Math.max(0, startX);
    const clampedEndX = Math.min(mapWidth, endX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndY = Math.min(mapHeight, endY);
    
    // Для WebGL используем стилизованные тайлы через Canvas 2D
    // так как WebGL не поддерживает сложные градиенты и текстуры
    for (let y = clampedStartY; y < clampedEndY; y++) {
      for (let x = clampedStartX; x < clampedEndX; x++) {
        const screenX = x * TILE_SIZE - gameState.camera.x;
        const screenY = y * TILE_SIZE - gameState.camera.y;
        
        // Проверяем, что тайл находится в видимой области экрана
        if (screenX >= -TILE_SIZE && screenX <= canvas.width / DPR && 
            screenY >= -TILE_SIZE && screenY <= canvas.height / DPR) {
          
          if (gameState.map[y][x] === 1) {
            // Стилизованная стена
            this.renderWallTile(ctx, screenX, screenY, x, y);
          } else {
            // Стилизованный пол
            this.renderFloorTile(ctx, screenX, screenY, x, y);
          }
        }
      }
    }
  }
  
  static renderMapCanvas2D() {
    if (!gameState.map) return;
    
    // Используем динамический размер карты
    const mapWidth = gameState.map[0] ? gameState.map[0].length : MAP_SIZE;
    const mapHeight = gameState.map.length;
    
    const startX = Math.floor(gameState.camera.x / TILE_SIZE) - 1;
    const endX = Math.floor((gameState.camera.x + canvas.width / DPR) / TILE_SIZE) + 1;
    const startY = Math.floor(gameState.camera.y / TILE_SIZE) - 1;
    const endY = Math.floor((gameState.camera.y + canvas.height / DPR) / TILE_SIZE) + 1;
    
    // Ограничиваем область рендеринга динамическим размером карты
    const clampedStartX = Math.max(0, startX);
    const clampedEndX = Math.min(mapWidth, endX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndY = Math.min(mapHeight, endY);
    
    // Рендерим карту через Canvas 2D
    for (let y = clampedStartY; y < clampedEndY; y++) {
      for (let x = clampedStartX; x < clampedEndX; x++) {
        const screenX = x * TILE_SIZE - gameState.camera.x;
        const screenY = y * TILE_SIZE - gameState.camera.y;
        
        // Проверяем, что тайл находится в видимой области экрана
        if (screenX >= -TILE_SIZE && screenX <= canvas.width / DPR && 
            screenY >= -TILE_SIZE && screenY <= canvas.height / DPR) {
          
          if (gameState.map[y][x] === 1) {
            // Стилизованная стена
            this.renderWallTile(ctx, screenX, screenY, x, y);
          } else {
            // Стилизованный пол
            this.renderFloorTile(ctx, screenX, screenY, x, y);
          }
        }
      }
    }
  }
  
  // УЛЬТРАБЫСТРЫЙ рендеринг стены через кеш (в 10-20 раз быстрее!)
  static renderWallTile(ctx, x, y, tileX, tileY) {
    // Используем предрендеренный тайл из кеша - одна операция drawImage вместо 10+ операций
    if (this.wallTileCanvas) {
      ctx.drawImage(this.wallTileCanvas, x, y);
    } else {
      // Fallback на простой тайл если кеш не инициализирован
      ctx.fillStyle = '#0d0b09';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  // УЛЬТРАБЫСТРЫЙ рендеринг пола через кеш (в 10-20 раз быстрее!)
  static renderFloorTile(ctx, x, y, tileX, tileY) {
    // Используем предрендеренный тайл из кеша - одна операция drawImage вместо 15+ операций
    if (this.floorTileCanvas) {
      ctx.drawImage(this.floorTileCanvas, x, y);
    } else {
      // Fallback на простой тайл если кеш не инициализирован
      ctx.fillStyle = '#1a1612';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
  
  // Рендеринг стилизованной стены на миникарте
  static renderMinimapWallTile(ctx, x, y, size, tileX, tileY) {
    // Базовый цвет стены
    ctx.fillStyle = '#3d3328';
    ctx.fillRect(x, y, size, size);

    // Добавляем простую текстуру
    ctx.strokeStyle = '#2a2218';
    ctx.lineWidth = 0.5;
    
    // Центральная линия
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.stroke();
    
    // Горизонтальная линия
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size, y + size / 2);
    ctx.stroke();
  }
  
  // Рендеринг стилизованного пола на миникарте
  static renderMinimapFloorTile(ctx, x, y, size, tileX, tileY) {
    // Базовый цвет пола
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(x, y, size, size);

    // Добавляем простой узор
    ctx.strokeStyle = '#151210';
    ctx.lineWidth = 0.3;
    
    // Диагональные линии для эффекта плитки
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
  }
  
  static renderFogOfWar() {
    if (!gameState.fogOfWar) return;
    
    // Отрисовка тумана войны
    const fogCanvas = gameState.fogOfWar.render(
      gameState.camera.x, 
      gameState.camera.y, 
      canvas.width / DPR, 
      canvas.height / DPR
    );
    
    // Если вернулся canvas, отрисовываем его
    if (fogCanvas) {
      ctx.drawImage(
        fogCanvas,
        gameState.camera.x,
        gameState.camera.y,
        canvas.width / DPR,
        canvas.height / DPR,
        0,
        0,
        canvas.width / DPR,
        canvas.height / DPR
      );
    }
  }
  
  static renderLighting() {
    if (!this.lightingSystem) return;
    
    // Передаем карту в систему освещения для проверки препятствий
    if (gameState.map && !this.lightingSystem.gameMap) {
      this.lightingSystem.setGameMap(gameState.map);
    }
    
    // Обновляем источники света
    this.lightingSystem.updateLightSources();
    this.lightingSystem.updateLightMap();
    
    // Добавляем источники света из игрового состояния
    if (gameState.lightSources) {
      gameState.lightSources.forEach(lightSource => {
        if (lightSource.active) {
          const lightData = lightSource.getLightData();
          if (lightData) {
            this.lightingSystem.addLightSource(
              lightData.id,
              lightData.x,
              lightData.y,
              lightData.radius,
              lightData.color,
              lightData.intensity,
              lightData.flicker,
              lightData.pulse
            );
          }
        }
      });
    }
    
    // Добавляем направленный свет игрока
    if (gameState.player && this.playerLight) {
      // Обновляем позицию и направление света игрока
      this.playerLight.x = gameState.player.x;
      this.playerLight.y = gameState.player.y;
      
      // Обновляем направление света на основе движения игрока
      // Берем направление напрямую от игрока
      const directionX = gameState.player.direction.x;
      const directionY = gameState.player.direction.y;
      
      this.playerLight.updateDirection(directionX, directionY);
      
      // Добавляем свет игрока в систему освещения
      const lightData = this.playerLight.getLightData();
      if (lightData) {
        this.lightingSystem.addLightSource(
          'player_light',
          lightData.x,
          lightData.y,
          lightData.radius,
          lightData.color,
          lightData.intensity,
          lightData.flicker,
          lightData.pulse,
          lightData.direction,
          lightData.coneAngle
        );
      }
    }
    
    // Отрисовка освещения
    const lightingCanvas = this.lightingSystem.render(
      gameState.camera.x,
      gameState.camera.y,
      canvas.width / DPR,
      canvas.height / DPR
    );
    
    // Если вернулся canvas, отрисовываем его
    if (lightingCanvas) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; // Режим наложения для света
      ctx.drawImage(
        lightingCanvas,
        0,
        0,
        canvas.width / DPR,
        canvas.height / DPR
      );
      ctx.restore();
    }
    
    // Рендерим направленный свет игрока отдельно
    if (gameState.player && this.playerLight) {
      this.playerLight.render(ctx, gameState.camera.x, gameState.camera.y);
    }
  }

  static getMinimapSize() {
    // Адаптивные размеры миникарты в зависимости от разрешения экрана
    if (window.innerWidth >= 3840) {
      return 400; // Очень большие экраны (4K+)
    } else if (window.innerWidth >= 2560) {
      return 300; // 4K мониторы
    } else if (window.innerWidth >= 1920) {
      return 200; // Full HD и выше
    }
    return 100; // Базовый размер
  }

  static renderMinimap() {
    if (!minimapCtx || !gameState.map) return;
    
    // Оптимизированная отрисовка миникарты - обновляем реже
    if (Math.floor(gameState.gameTime * 30) % 2 !== 0) {
      return;
    }
    
    // Используем динамический размер карты
    const mapWidth = gameState.map[0] ? gameState.map[0].length : MAP_SIZE;
    const mapHeight = gameState.map.length;
    const maxMapSize = Math.max(mapWidth, mapHeight);
    
    const minimapSize = this.getMinimapSize();
    const scale = minimapSize / maxMapSize;
    
    minimapCtx.fillStyle = '#0a0908';
    minimapCtx.fillRect(0, 0, minimapSize, minimapSize);
    
    // Отрисовка карты только в исследованных областях
    // Источники света НЕ влияют на исследование карты - только игрок может раскрывать туман войны
    if (gameState.fogOfWar) {
      const exploredData = gameState.fogOfWar.getExploredForMinimap();
      const visibleData = gameState.fogOfWar.getVisibleForMinimap();
      
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          // Показываем только исследованные области (раскрытые игроком)
          if (exploredData[y] && exploredData[y][x]) {
            if (gameState.map[y][x] === 1) {
              // Стилизованная стена на миникарте
              this.renderMinimapWallTile(minimapCtx, x * scale, y * scale, scale, x, y);
            } else {
              // Стилизованный пол на миникарте
              this.renderMinimapFloorTile(minimapCtx, x * scale, y * scale, scale, x, y);
            }
          }
        }
      }
    }
    
    // Отрисовка игрока
    if (gameState.player) {
      const playerX = Math.floor(gameState.player.x / TILE_SIZE);
      const playerY = Math.floor(gameState.player.y / TILE_SIZE);
      minimapCtx.fillStyle = '#c9a84c';
      minimapCtx.fillRect(playerX * scale, playerY * scale, scale, scale);
    }
    
    // Отрисовка врагов только в исследованных областях
    // Враги видны только там, где игрок уже побывал
    gameState.entities.forEach(entity => {
      if (entity.constructor.name === 'Enemy' && !entity.isDead) {
        const enemyX = Math.floor(entity.x / TILE_SIZE);
        const enemyY = Math.floor(entity.y / TILE_SIZE);
        
        // Показываем врага только если область исследована игроком
        if (gameState.fogOfWar && gameState.fogOfWar.explored[enemyY] && gameState.fogOfWar.explored[enemyY][enemyX]) {
          minimapCtx.fillStyle = '#8b1a1a';
          minimapCtx.fillRect(enemyX * scale, enemyY * scale, scale, scale);
        }
      }
    });
  }
  
  static renderFPSIndicator() {
    // Скрываем FPS на мобильных устройствах
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      return; // Не отображаем FPS на мобильных
    }

    
    const fps = PerformanceMonitor.getFPS();
    const avgFrameTime = PerformanceMonitor.getAverageFrameTime();
    const isLowMode = PerformanceMonitor.isLowPerformanceMode();
      
    // Определяем размеры экрана и адаптивность
    const canvasWidth = canvas.width / DPR;
    const canvasHeight = canvas.height / DPR;
    
    // Адаптивные размеры миникарты в зависимости от разрешения экрана
    const minimapSize = this.getMinimapSize();
    
    // Адаптивные размеры счетчика FPS в зависимости от размера миникарты
    let fpsWidth = 90;
    let fpsHeight = 45;
    if (minimapSize >= 300) {
      fpsWidth = 120;
      fpsHeight = 60;
    } else if (minimapSize >= 200) {
      fpsWidth = 100;
      fpsHeight = 50;
    }
    
    // Адаптивный размер шрифта в зависимости от размера миникарты
    let fontSize = 14;
    if (minimapSize >= 300) {
      fontSize = 18; // Больший шрифт для больших миникарт
    } else if (minimapSize >= 200) {
      fontSize = 16; // Средний шрифт для средних миникарт
    }
    const fpsX = canvasWidth - fpsWidth - 10; // Выровнено по правому краю экрана
    const fpsY = minimapSize + 80; // Миникарта + увеличенный отступ (80px) для лучшей видимости
    
    // FPS теперь всегда под миникартой, дополнительная проверка не нужна
    
    // Фон для лучшей читаемости
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(fpsX - 5, fpsY - 15, fpsWidth, fpsHeight);
    
    // Рамка
    ctx.strokeStyle = isLowMode ? '#8b1a1a' : '#2d5a1e';
    ctx.lineWidth = 1;
    ctx.strokeRect(fpsX - 5, fpsY - 15, fpsWidth, fpsHeight);

    // Текст
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = isLowMode ? '#8b1a1a' : '#2d5a1e';
    ctx.textAlign = 'left';
    
    const fpsText = `FPS: ${fps}`;
    const frameTimeText = `${avgFrameTime.toFixed(1)}ms`;
    const modeText = isLowMode ? 'LOW' : 'OK';
    
    ctx.fillText(fpsText, fpsX, fpsY);
    ctx.fillText(frameTimeText, fpsX, fpsY + 12);
    ctx.fillText(modeText, fpsX, fpsY + 24);
    

  }

  static updateUI() {
    // Обновление UI элементов
    const levelEl = document.getElementById('levelText');
    const killsEl = document.getElementById('kills');
    const timeEl = document.getElementById('time');
    
    if (levelEl) levelEl.textContent = gameState.level;
    if (killsEl) killsEl.textContent = gameState.stats.currentSessionKills;
    if (timeEl) timeEl.textContent = Utils.formatTime(gameState.gameTime);
    
    // Обновляем полоску здоровья
    if (gameState.player) {
      const hpFillEl = document.getElementById('hpFill');
      const hpTextEl = document.getElementById('hpText');
      
      if (hpFillEl && hpTextEl) {
        const healthPercent = gameState.player.hp / gameState.player.maxHp;
        hpFillEl.style.width = `${healthPercent * 100}%`;
        hpTextEl.textContent = `${Math.ceil(gameState.player.hp)}/${gameState.player.maxHp}`;
        // Пульсация при низком здоровье
        hpFillEl.classList.toggle('hp-low', healthPercent < 0.25);
      }
    }
    
    // Обновляем отображение золота
    const goldTextEl = document.getElementById('goldText');
    if (goldTextEl) {
      goldTextEl.textContent = gameState.player?.gold || 0;
    }

    // Обновляем HP бар босса
    if (gameState.currentBoss && !gameState.currentBoss.isDead) {
      const bossHpFill = document.getElementById('bossHpFill');
      if (bossHpFill) {
        const bossHpPercent = Math.max(0, gameState.currentBoss.hp / gameState.currentBoss.maxHp);
        bossHpFill.style.width = `${bossHpPercent * 100}%`;
      }
    } else if (gameState.currentBoss?.isDead) {
      const bossBar = document.getElementById('bossHealthBar');
      if (bossBar) bossBar.classList.add('hidden');
      gameState.currentBoss = null;
    }

    // Обновляем банки здоровья
    this.updateHealthPotions();
    
    // Обновляем откат способности
    this.updateAbilityCooldown();
    
    // Обновляем активные баффы
    this.updateActiveBuffs();
  }

  static resizeCanvas() {
    if (!canvas) {
      Logger.error('❌ Canvas not found in resizeCanvas');
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    // Если canvas скрыт, используем размеры окна
    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : window.innerHeight;
    
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    
    if (minimapCanvas) {
      // Адаптивные размеры миникарты в зависимости от разрешения экрана
      const minimapSize = this.getMinimapSize();
      
      minimapCanvas.width = minimapSize * DPR;
      minimapCanvas.height = minimapSize * DPR;
      minimapCanvas.style.width = minimapSize + 'px';
      minimapCanvas.style.height = minimapSize + 'px';
      if (minimapCtx) {
        minimapCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }
    
    // Перенастраиваем контекст
    if (ctx) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
  }
  
  static updateQuickPotions() {
    // Обновляем все быстрые слоты
    for (let i = 1; i <= 3; i++) {
      const potionSlot = document.getElementById(`quickPotionSlot${i}`);
      const potionIcon = potionSlot?.querySelector('.potion-icon');
      const potionCount = potionSlot?.querySelector('.potion-count');
      
      if (!potionSlot || !potionIcon || !potionCount) {
        continue;
      }
      
      const potionType = gameState.inventory.quickSlots[i - 1];
      
      if (potionType) {
        // Слот с назначенным типом зелья
        // Определяем цвет в зависимости от типа
        let borderColor = '#ff6666';
        
        switch (potionType) {
          case 'potion':
            borderColor = '#ff6666'; // Красный для здоровья
            break;
          case 'speed_potion':
            borderColor = '#66ff66'; // Зеленый для скорости
            break;
          case 'strength_potion':
            borderColor = '#ffaa66'; // Оранжевый для силы
            break;
          case 'defense_potion':
            borderColor = '#6666ff'; // Синий для защиты
            break;
          case 'regen_potion':
            borderColor = '#ff66ff'; // Розовый для регенерации
            break;
          case 'combo_potion':
            borderColor = '#ffff66'; // Желтый для комбо
            break;
          case 'mystery_potion':
            borderColor = '#8e44ad'; // Фиолетовый для тайной банки
            break;
          case 'purification_potion':
            borderColor = '#f39c12'; // Золотой для очищения
            break;
          // Свитки
          case 'scroll_werewolf':
            borderColor = '#8b4513'; // Коричневый для оборотня
            break;
          case 'scroll_stone':
            borderColor = '#7f8c8d'; // Серый для камня
            break;
          case 'scroll_fire_explosion':
            borderColor = '#e74c3c'; // Красный для огня
            break;
          case 'scroll_ice_storm':
            borderColor = '#3498db'; // Синий для льда
            break;
          case 'scroll_lightning':
            borderColor = '#f1c40f'; // Желтый для молнии
            break;
          case 'scroll_earthquake':
            borderColor = '#8b4513'; // Коричневый для землетрясения
            break;
          case 'scroll_clone':
            borderColor = '#9b59b6'; // Фиолетовый для клона
            break;
          case 'scroll_teleport':
            borderColor = '#e67e22'; // Оранжевый для телепорта
            break;
          case 'scroll_invisibility':
            borderColor = '#95a5a6'; // Серый для невидимости
            break;
          case 'scroll_time':
            borderColor = '#34495e'; // Темно-серый для времени
            break;
          case 'scroll_curse':
            borderColor = '#2c3e50'; // Темный для проклятия
            break;
          case 'scroll_chaos':
            borderColor = '#e74c3c'; // Красный для хаоса
            break;
          case 'scroll_fear':
            borderColor = '#8e44ad'; // Фиолетовый для страха
            break;
          case 'scroll_smoke':
            borderColor = '#7f8c8d'; // Серый для дыма
            break;
          case 'scroll_meteor':
            borderColor = '#e67e22'; // Оранжевый для метеорита
            break;
          case 'scroll_barrier':
            borderColor = '#3498db'; // Синий для барьера
            break;
          case 'scroll_rage':
            borderColor = '#e74c3c'; // Красный для ярости
            break;
          case 'scroll_invulnerability':
            borderColor = '#f1c40f'; // Желтый для неуязвимости
            break;
          case 'scroll_vampirism':
            borderColor = '#8e44ad'; // Фиолетовый для вампиризма
            break;
          case 'mystery_scroll':
            borderColor = '#8e44ad'; // Фиолетовый для тайного свитка
            break;
          default:
            borderColor = '#ff6666';
        }
        
        // Подсчитываем количество зелий этого типа в рюкзаке
        const count = gameState.inventory.backpack.filter(item => 
          item && item.type === 'consumable' && item.base === potionType
        ).length;
        
        // Создаем спрайт зелья
        const potionItem = { base: potionType, type: 'consumable', rarity: 'common' };
        
        // Импортируем рендерер спрайтов асинхронно
        // Оптимизированная версия с кешированием
        if (!this.inventorySpriteRenderer) {
          import('../ui/InventorySpriteRenderer.js').then(module => {
            this.inventorySpriteRenderer = module.InventorySpriteRenderer;
            try {
              const spriteElement = this.inventorySpriteRenderer.createSpriteElement(potionItem, 32);
              if (spriteElement) {
                potionIcon.innerHTML = '';
                potionIcon.appendChild(spriteElement);
              } else {
                this.setPotionIconFallback(potionIcon, potionType);
              }
            } catch (error) {
              Logger.warn('Не удалось загрузить рендерер спрайтов:', error);
              this.setPotionIconFallback(potionIcon, potionType);
            }
          });
        } else {
          try {
            const spriteElement = this.inventorySpriteRenderer.createSpriteElement(potionItem, 32);
            if (spriteElement) {
              potionIcon.innerHTML = '';
              potionIcon.appendChild(spriteElement);
            } else {
              this.setPotionIconFallback(potionIcon, potionType);
            }
          } catch (error) {
            Logger.warn('Не удалось создать спрайт зелья:', error);
            this.setPotionIconFallback(potionIcon, potionType);
          }
        }
        
        potionCount.textContent = count.toString();
        
        // Если зелья закончились, показываем "пустое" состояние
        if (count === 0) {
          potionSlot.classList.add('empty');
          potionSlot.style.borderColor = '#666666';
          potionIcon.style.opacity = '0.5';
          potionCount.style.opacity = '0.5';
        } else {
          potionSlot.classList.remove('empty');
          potionSlot.style.borderColor = borderColor;
          potionIcon.style.opacity = '1';
          potionCount.style.opacity = '1';
        }
      } else {
        // Пустой слот
        potionIcon.textContent = '';
        potionCount.textContent = '0';
        potionSlot.classList.add('empty');
        potionSlot.style.borderColor = '#666666';
        potionIcon.style.opacity = '0.5';
        potionCount.style.opacity = '0.5';
      }
    }
  }
  
  static updateHealthPotions() {
    // Для обратной совместимости - обновляем быстрые слоты
    this.updateQuickPotions();
  }
  
  static setupHealthPotionHandlers() {
    // Настраиваем обработчики для всех быстрых слотов
    for (let i = 1; i <= 3; i++) {
      const potionSlot = document.getElementById(`quickPotionSlot${i}`);
      
      if (potionSlot) {
        potionSlot.addEventListener('click', () => {
          // Проверяем, что игра не в паузе
          if (gameState.isPaused) {
            return;
          }
          this.useQuickPotion(i - 1); // i-1 потому что индексы с 0
        });
      }
    }
  }
  
  static async useQuickPotion(slotIndex) {
    if (!gameState.player) return;
    
    // Дополнительная проверка на паузу
    if (gameState.isPaused) {
      return;
    }
    
    // Проверяем быстрый слот - теперь там хранится тип зелья
    const potionType = gameState.inventory.quickSlots[slotIndex];
    if (!potionType) {
      return;
    }
    
    // Ищем зелье нужного типа в рюкзаке
    const potionIndex = gameState.inventory.backpack.findIndex(item => 
      item && item.type === 'consumable' && item.base === potionType
    );
    
    if (potionIndex === -1) {
      // Обновляем UI, чтобы показать "пустое" состояние
      this.updateQuickPotions();
      return;
    }
    
    const potion = gameState.inventory.backpack[potionIndex];
    
    // Применяем эффекты зелья (оптимизированная версия)
    if (!this.buffManager) {
      try {
        const { BuffManager } = await import('../core/BuffManager.js');
        this.buffManager = BuffManager;
      } catch (error) {
        Logger.error('❌ Не удалось загрузить BuffManager для зелий:', error);
        return;
      }
    }

    await this.buffManager.applyConsumableEffects(potion);
    
    // Удаляем зелье из рюкзака
    gameState.inventory.backpack[potionIndex] = null;
    
    // Воспроизводим звук использования зелья
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playHealthPotion();
    })();
    
    // Обновляем UI
    this.updateQuickPotions();
    
    // Обновляем инвентарь (оптимизированная версия)
    if (!this.inventoryManager) {
      import('../ui/InventoryManager.js').then(module => {
        this.inventoryManager = module.InventoryManager;
        this.inventoryManager.renderInventory();
      });
    } else {
      this.inventoryManager.renderInventory();
    }
  }
  
  static useHealthPotion() {
    // Для обратной совместимости - используем первый быстрый слот
    this.useQuickPotion(0);
  }
  
  static updateAbilityCooldown() {
    if (!gameState.player) return;
    
    const cooldownUI = document.getElementById('abilityCooldownUI');
    const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
    
    let cooldown = 0;
    let maxCooldown = 1;
    let abilityIcon = 'Q';
    let abilityName = '';

    if (gameState.player.hasDash && gameState.player.dashCooldown > 0) {
      cooldown = gameState.player.dashCooldown;
      maxCooldown = 3.0;
      abilityIcon = 'Q';
      abilityName = 'Dash';
    } else if (gameState.player.hasShield && gameState.player.shieldCooldown > 0) {
      cooldown = gameState.player.shieldCooldown;
      maxCooldown = 8.0;
      abilityIcon = 'Q';
      abilityName = 'Shield';
    } else if (gameState.player.hasBlast && gameState.player.blastCooldown > 0) {
      cooldown = gameState.player.blastCooldown;
      maxCooldown = 12.0;
      abilityIcon = 'Q';
      abilityName = 'Blast';
    }
    
    // Обновляем мобильный UI
    if (cooldownUI) {
      if (cooldown > 0) {
        cooldownUI.classList.remove('hidden');
        const cooldownPercent = (cooldown / maxCooldown) * 100;
        
        const iconEl = cooldownUI.querySelector('.ability-icon');
        const textEl = cooldownUI.querySelector('.cooldown-text');
        
        if (iconEl) iconEl.textContent = abilityIcon;
        if (textEl) textEl.textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s` : '';
        
        // Устанавливаем высоту заполнения
        cooldownUI.style.setProperty('--cooldown-width', cooldownPercent + '%');
      } else {
        cooldownUI.classList.add('hidden');
        cooldownUI.style.setProperty('--cooldown-width', '0%');
      }
    }
    
    // Обновляем мобильную кнопку способности
    const mobileAbilityBtn = document.getElementById('abilityBtn');
    if (mobileAbilityBtn) {
      const cooldownPercent = (cooldown / maxCooldown) * 100;
      mobileAbilityBtn.style.setProperty('--cooldown-width', cooldownPercent + '%');
      
      // Обновляем иконку способности
      mobileAbilityBtn.textContent = abilityIcon;
      
      mobileAbilityBtn.disabled = cooldown > 0;
      
      // Показываем кнопку только если у игрока есть способность
      if (gameState.player.hasDash || gameState.player.hasShield || gameState.player.hasBlast) {
        mobileAbilityBtn.style.display = 'flex';
      } else {
        mobileAbilityBtn.style.display = 'none';
      }
    }
    
    // Обновляем десктопную кнопку
    if (desktopAbilityBtn) {
      const cooldownPercent = (cooldown / maxCooldown) * 100;
      desktopAbilityBtn.style.setProperty('--cooldown-width', cooldownPercent + '%');
      
      const cooldownText = desktopAbilityBtn.querySelector('.cooldown-text');
      if (cooldownText) {
        cooldownText.textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s` : '';
      }
      
      const abilityIconElement = desktopAbilityBtn.querySelector('.ability-icon');
      if (abilityIconElement) {
        abilityIconElement.textContent = abilityIcon;
      }
      
      desktopAbilityBtn.disabled = cooldown > 0;
      
      // Показываем кнопку только если у игрока есть способность
      if (gameState.player.hasDash || gameState.player.hasShield || gameState.player.hasBlast) {
        desktopAbilityBtn.style.display = 'flex';
      } else {
        desktopAbilityBtn.style.display = 'none';
      }
    }
  }
  
  static updateActiveBuffs() {
    const buffsContainer = document.getElementById('activeBuffsContainer');
    if (!buffsContainer) return;

    const activeBuffs = gameState.buffs.active;
    const activeDebuffs = gameState.debuffs.active;

    // Собираем все уникальные ключи (тип + startTime) для существующих элементов
    const existingElements = new Map();
    buffsContainer.querySelectorAll('.active-buff, .active-debuff').forEach(el => {
      const key = el.dataset.buffKey;
      if (key) existingElements.set(key, el);
    });

    // Собираем новые ключи
    const newKeys = new Set();
    const generateKey = (effect) => `${effect.type}_${effect.startTime}`;

    activeBuffs.forEach(buff => {
      const key = generateKey(buff);
      newKeys.add(key);

      let buffElement = existingElements.get(key);

      if (!buffElement) {
        // Создаём новый элемент
        buffElement = document.createElement('div');
        buffElement.className = 'active-buff';
        buffElement.dataset.buffKey = key;

        const iconElement = document.createElement('span');
        iconElement.className = 'buff-icon';
        iconElement.style.fontSize = '14px';

        const timeElement = document.createElement('span');
        timeElement.className = 'buff-time';
        timeElement.style.fontSize = '12px';

        buffElement.appendChild(iconElement);
        buffElement.appendChild(timeElement);
        buffsContainer.appendChild(buffElement);
      }

      // Обновляем классы предупреждения
      buffElement.className = 'active-buff';
      if (buff.remainingTime < 3) {
        buffElement.classList.add('critical');
      } else if (buff.remainingTime < 6) {
        buffElement.classList.add('warning');
      }

      // Обновляем содержимое
      const iconEl = buffElement.querySelector('.buff-icon');
      if (iconEl) iconEl.textContent = buff.icon;

      const timeEl = buffElement.querySelector('.buff-time');
      if (timeEl) {
        timeEl.textContent = `${Math.ceil(buff.remainingTime)}s`;
        timeEl.style.color = buff.remainingTime < 3 ? '#ff4444' : '#ffffff';
      }

      // Обновляем прогресс-бар
      const progressPercent = (buff.remainingTime / buff.duration) * 100;
      buffElement.style.setProperty('--progress-width', `${progressPercent}%`);
    });

    activeDebuffs.forEach(debuff => {
      const key = generateKey(debuff);
      newKeys.add(key);

      let debuffElement = existingElements.get(key);

      if (!debuffElement) {
        debuffElement = document.createElement('div');
        debuffElement.className = 'active-debuff';
        debuffElement.dataset.buffKey = key;

        const iconElement = document.createElement('span');
        iconElement.className = 'debuff-icon';
        iconElement.style.fontSize = '14px';

        const timeElement = document.createElement('span');
        timeElement.className = 'debuff-time';
        timeElement.style.fontSize = '12px';

        debuffElement.appendChild(iconElement);
        debuffElement.appendChild(timeElement);
        buffsContainer.appendChild(debuffElement);
      }

      // Обновляем классы предупреждения
      debuffElement.className = 'active-debuff';
      if (debuff.remainingTime < 3) {
        debuffElement.classList.add('critical');
      } else if (debuff.remainingTime < 6) {
        debuffElement.classList.add('warning');
      }

      // Обновляем содержимое
      const iconEl = debuffElement.querySelector('.debuff-icon');
      if (iconEl) iconEl.textContent = debuff.icon;

      const timeEl = debuffElement.querySelector('.debuff-time');
      if (timeEl) {
        timeEl.textContent = `${Math.ceil(debuff.remainingTime)}s`;
        timeEl.style.color = debuff.remainingTime < 3 ? '#ff4444' : '#ff6666';
      }

      // Обновляем прогресс-бар
      const progressPercent = (debuff.remainingTime / debuff.duration) * 100;
      debuffElement.style.setProperty('--progress-width', `${progressPercent}%`);
    });

    // Удаляем элементы, которых больше нет
    existingElements.forEach((el, key) => {
      if (!newKeys.has(key)) {
        el.remove();
      }
    });
  }
  
  static stopGame() {
    // Остановить игровой цикл
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }
    
    // Сбросить состояние игры
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.map = null;
    gameState.rooms = [];
    gameState.fogOfWar = null;
    gameState.isPaused = false;
    gameState.gameRunning = false;
    
    // Очистить canvas
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (minimapCtx) {
      minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    }
  }

  static async continueGame() {
    gameState.gameRunning = true;
    gameState.isPaused = false;
    
    // Принудительно центрируем камеру на игроке
    if (gameState.player) {
      const canvasWidth = canvas ? canvas.width / DPR : 800;
      const canvasHeight = canvas ? canvas.height / DPR : 600;
      gameState.camera.x = gameState.player.x - canvasWidth / 2;
      gameState.camera.y = gameState.player.y - canvasHeight / 2;
    }
    
    // Переключаемся на игровой экран
    const { ScreenManager } = await import('../ui/ScreenManager.js');
    ScreenManager.switchScreen('game');
    
    // Настраиваем canvas и запускаем игровой цикл
    this.resizeCanvas();
    this.updateUI();
    this.updateQuickPotions();
    
    // Убеждаемся, что игровой цикл запускается
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
    }
    
    gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Высокопроизводительное обновление массивов сущностей без использования splice
  static updateEntitiesArray(entities, dt) {
    let writeIndex = 0;
    
    // Проходим по всем элементам и обновляем живые, удаляем мертвые
    for (let readIndex = 0; readIndex < entities.length; readIndex++) {
      const entity = entities[readIndex];
      
      if (!entity.isDead) {
        entity.update(dt);
        
        // Если сущность все еще жива после обновления, оставляем её
        if (!entity.isDead) {
          entities[writeIndex] = entity;
          writeIndex++;
        }
      }
    }
    
    // Обрезаем массив до нужной длины (удаляем лишние элементы)
    entities.length = writeIndex;
  }
  
  // Проверка видимости объекта (culling для оптимизации рендеринга)
  static isEntityVisible(entity) {
    if (!entity || !canvas) return false;
    
    // Получаем размеры экрана с учетом DPR
    const screenWidth = canvas.width / DPR;
    const screenHeight = canvas.height / DPR;
    
    // Базовый буфер для объектов за краем экрана
    const baseBuffer = 100;
    
    // Динамический буфер, который растет вместе с картой
    // Карта растет на 1.5 тайла за уровень, игровая зона должна расти пропорционально
    const level = gameState.level || 1;
    const dynamicBuffer = baseBuffer + (level - 1) * 24; // 24 пикселя = 0.75 тайла за уровень
    
    // Проверяем, находится ли объект в области видимости с учетом динамического буфера
    const entityScreenX = entity.x - gameState.camera.x;
    const entityScreenY = entity.y - gameState.camera.y;
    
    return entityScreenX >= -dynamicBuffer &&
           entityScreenX <= screenWidth + dynamicBuffer &&
           entityScreenY >= -dynamicBuffer &&
           entityScreenY <= screenHeight + dynamicBuffer;
  }
  
  // Инициализация кеша тайлов для максимального ускорения рендеринга
  static initTileCache() {
    // Создаем предрендеренные тайлы стен
    this.wallTileCanvas = document.createElement('canvas');
    this.wallTileCanvas.width = TILE_SIZE;
    this.wallTileCanvas.height = TILE_SIZE;
    const wallCtx = this.wallTileCanvas.getContext('2d');
    this.renderWallTileToCache(wallCtx, 0, 0);
    
    // Создаем предрендеренные тайлы пола
    this.floorTileCanvas = document.createElement('canvas');
    this.floorTileCanvas.width = TILE_SIZE;
    this.floorTileCanvas.height = TILE_SIZE;
    const floorCtx = this.floorTileCanvas.getContext('2d');
    this.renderFloorTileToCache(floorCtx, 0, 0);
  }
  
  // Вспомогательная функция для fallback иконок зелий
  static setPotionIconFallback(potionIcon, potionType) {
    let icon = 'P';
    switch (potionType) {
      case 'potion': icon = 'HP'; break;
      case 'speed_potion': icon = 'SP'; break;
      case 'strength_potion': icon = 'ST'; break;
      case 'defense_potion': icon = 'DF'; break;
      case 'regen_potion': icon = 'RG'; break;
      case 'combo_potion': icon = 'CB'; break;
      case 'mystery_potion': icon = '?'; break;
      case 'purification_potion': icon = 'PR'; break;
      // Свитки
      case 'scroll_werewolf': icon = 'W'; break;
      case 'scroll_stone': icon = 'S'; break;
      case 'scroll_fire_explosion': icon = 'F'; break;
      case 'scroll_ice_storm': icon = 'I'; break;
      case 'scroll_lightning': icon = 'L'; break;
      case 'scroll_earthquake': icon = 'E'; break;
      case 'scroll_clone': icon = 'C'; break;
      case 'scroll_teleport': icon = 'T'; break;
      case 'scroll_invisibility': icon = 'V'; break;
      case 'scroll_time': icon = 'TM'; break;
      case 'scroll_curse': icon = 'CR'; break;
      case 'scroll_chaos': icon = 'CH'; break;
      case 'scroll_fear': icon = 'FR'; break;
      case 'scroll_smoke': icon = 'SM'; break;
      case 'scroll_meteor': icon = 'MT'; break;
      case 'scroll_barrier': icon = 'BR'; break;
      case 'scroll_rage': icon = 'RG'; break;
      case 'scroll_invulnerability': icon = 'IV'; break;
      case 'scroll_vampirism': icon = 'VA'; break;
      case 'mystery_scroll': icon = '?'; break;
    }
    potionIcon.textContent = icon;
  }
  
  // Предрендеринг тайла стены в кеш
  static renderWallTileToCache(ctx, x, y) {
    // Градиент — тёмный камень с коричневым оттенком
    const gradient = ctx.createLinearGradient(x, y, x + TILE_SIZE, y + TILE_SIZE);
    gradient.addColorStop(0, '#0d0b09');
    gradient.addColorStop(0.3, '#181410');
    gradient.addColorStop(0.7, '#1e1a14');
    gradient.addColorStop(1, '#151210');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Текстура камня
    ctx.strokeStyle = '#0a0908';
    ctx.lineWidth = 1;

    for (let i = 0; i < 2; i++) {
      const lineY = y + (i + 1) * TILE_SIZE / 3;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + TILE_SIZE, lineY);
      ctx.stroke();
    }

    for (let i = 0; i < 2; i++) {
      const lineX = x + (i + 1) * TILE_SIZE / 3;
      ctx.beginPath();
      ctx.moveTo(lineX, y);
      ctx.lineTo(lineX, y + TILE_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#0a0908';
    for (let i = 0; i < 3; i++) {
      const pointX = x + (i * 7) % TILE_SIZE;
      const pointY = y + (i * 11) % TILE_SIZE;
      ctx.fillRect(pointX, pointY, 1, 1);
    }
  }

  // Предрендеринг тайла пола в кеш
  static renderFloorTileToCache(ctx, x, y) {
    // Градиент — тёплый каменный пол
    const gradient = ctx.createLinearGradient(x, y, x + TILE_SIZE, y + TILE_SIZE);
    gradient.addColorStop(0, '#1a1612');
    gradient.addColorStop(0.5, '#201c16');
    gradient.addColorStop(1, '#2a2218');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Линии текстуры
    ctx.strokeStyle = '#151210';
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    ctx.moveTo(x, y + TILE_SIZE / 2);
    ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE / 2, y);
    ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE);
    ctx.stroke();

    ctx.fillStyle = '#1e1a14';
    for (let i = 0; i < 2; i++) {
      const pointX = x + (i * 13) % TILE_SIZE;
      const pointY = y + (i * 17) % TILE_SIZE;
      ctx.fillRect(pointX, pointY, 1, 1);
    }
  }
} 
