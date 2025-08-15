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
import { TILE_SIZE, MAP_SIZE, ENEMY_TYPES } from '../config/constants.js';
import { PerformanceMonitor } from '../core/PerformanceMonitor.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { WebGLFogOfWar } from '../map/WebGLFogOfWar.js';
import { LightingSystem } from '../map/LightingSystem.js';
import { PlayerLight } from '../entities/PlayerLight.js';

let lastFrameTime = 0;
let gameLoopId = null;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

export class GameEngine {
  static webglRenderer = null;
  static lightingSystem = null;
  static playerLight = null;
  
  static async init() {
    if (!canvas || !ctx) {
      console.error('Canvas elements not found');
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
    
    // Инициализация мониторинга производительности
    PerformanceMonitor.init();
    
    // Инициализация ввода
    InputManager.init();
    
    // Загрузка настроек и рекордов
    SettingsManager.loadSettings();
    RecordsManager.loadRecords();
    
    // Настройка обработчиков событий будет выполнена при переключении на экраны
    
    // Настройка обработчиков банок здоровья
    this.setupHealthPotionHandlers();
    
    // Переключение на главное меню
    ScreenManager.switchScreen('menu');
    
    // Отложим resizeCanvas до показа игрового экрана
    // this.resizeCanvas();
  }

  static async startGame() {
    if (!gameState.selectedCharacter) {
      console.error('❌ No character selected');
      return;
    }
    
    // Проверяем, это новый запуск игры или продолжение
    const isNewGame = !gameState.gameRunning;
    
    if (isNewGame) {
      // Только при новом запуске игры сбрасываем прогрессию
      gameState.level = 1;
      gameState.gameTime = 0;
      gameState.stats.currentSessionKills = 0;
      
      // Сброс инвентаря только при новом запуске
      gameState.inventory.equipment = [null, null, null, null];
      gameState.inventory.backpack = new Array(8).fill(null);
      gameState.inventory.quickSlots = [null, null, null];
      
      // Очищаем все временные баффы при новом запуске
      (async () => {
        const { BuffManager } = await import('../core/BuffManager.js');
        BuffManager.clearAllBuffs();
      })();
    }
    
    gameState.gameRunning = true;
    gameState.isPaused = false;
    
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
      console.error('❌ Error in game loop:', error);
      console.error('❌ Stack:', error.stack);
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
      
          // Обновление тумана войны (максимально оптимизированное)
    if (gameState.fogOfWar) {
      // Обновляем туман войны только каждые 5 кадров для максимальной производительности
      if (Math.floor(gameState.gameTime * 60) % 5 === 0) {
        gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
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
    }
    
    // Обновление сущностей (оптимизированная версия)
    let entityIndex = 0;
    while (entityIndex < gameState.entities.length) {
      const entity = gameState.entities[entityIndex];
      if (entity.isDead) {
        gameState.entities.splice(entityIndex, 1);
      } else {
        entity.update(dt);
        entityIndex++;
      }
    }
    
    // Обновление снарядов (оптимизированная версия)
    let projectileIndex = 0;
    while (projectileIndex < gameState.projectiles.length) {
      const projectile = gameState.projectiles[projectileIndex];
      if (projectile.isDead) {
        gameState.projectiles.splice(projectileIndex, 1);
      } else {
        projectile.update(dt);
        projectileIndex++;
      }
    }
    
    // Обновление частиц (оптимизированная версия)
    let particleIndex = 0;
    while (particleIndex < gameState.particles.length) {
      const particle = gameState.particles[particleIndex];
      if (particle.isDead) {
        gameState.particles.splice(particleIndex, 1);
      } else {
        particle.update(dt);
        particleIndex++;
      }
    }
    
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
    
    // Обновление временных баффов
    (async () => {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.update(dt);
    })();
  }

  static render() {
    if (!ctx) {
      console.error('❌ Canvas context not available');
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
      console.error('❌ Game map not available');
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
    
    // Отрисовка сущностей через Canvas 2D (пока что)
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (!entity.isDead) {
        entity.draw();
      }
    }
    
    // Отрисовка снарядов через Canvas 2D (пока что)
    for (let i = 0; i < gameState.projectiles.length; i++) {
      const projectile = gameState.projectiles[i];
      if (!projectile.isDead) {
        projectile.draw();
      }
    }
    
    // Отрисовка частиц через Canvas 2D (пока что)
    for (let i = 0; i < gameState.particles.length; i++) {
      const particle = gameState.particles[i];
      if (!particle.isDead) {
        particle.draw();
      }
    }
    
    // Отрисовка игрока поверх всего
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Отрисовка освещения
    this.renderLighting();
    
    // Отрисовка тумана войны
    this.renderFogOfWar();
    
    // Отрисовка миникарты
    this.renderMinimap();
    
    // Отрисовка FPS индикатора (только в режиме разработки)
    this.renderFPSIndicator();
  }
  
  static renderCanvas2D() {
    // Очистка экрана
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
    
    if (!gameState.map) {
      console.error('❌ Game map not available');
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
    
    // Отрисовка сущностей (максимально оптимизированная версия)
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (!entity.isDead) {
        // Временно отключаем проверку видимости для отладки
        entity.draw();
      }
    }
    
    // Отрисовка снарядов (максимально оптимизированная версия)
    for (let i = 0; i < gameState.projectiles.length; i++) {
      const projectile = gameState.projectiles[i];
      if (!projectile.isDead) {
        // Временно отключаем проверку видимости для отладки
        projectile.draw();
      }
    }
    
    // Отрисовка частиц (максимально оптимизированная версия)
    for (let i = 0; i < gameState.particles.length; i++) {
      const particle = gameState.particles[i];
      if (!particle.isDead) {
        // Временно отключаем проверку видимости для отладки
        particle.draw();
      }
    }
    
    // Отрисовка игрока поверх всего
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Отрисовка освещения
    this.renderLighting();
    
    // Отрисовка тумана войны
    this.renderFogOfWar();
    
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
    const startX = Math.floor(gameState.camera.x / TILE_SIZE) - 1;
    const endX = Math.floor((gameState.camera.x + canvas.width / DPR) / TILE_SIZE) + 1;
    const startY = Math.floor(gameState.camera.y / TILE_SIZE) - 1;
    const endY = Math.floor((gameState.camera.y + canvas.height / DPR) / TILE_SIZE) + 1;
    
    // Ограничиваем область рендеринга
    const clampedStartX = Math.max(0, startX);
    const clampedEndX = Math.min(MAP_SIZE, endX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndY = Math.min(MAP_SIZE, endY);
    
    // Рендерим карту через WebGL для максимальной производительности
    for (let y = clampedStartY; y < clampedEndY; y++) {
      for (let x = clampedStartX; x < clampedEndX; x++) {
        const screenX = x * TILE_SIZE - gameState.camera.x;
        const screenY = y * TILE_SIZE - gameState.camera.y;
        
        // Проверяем, что тайл находится в видимой области экрана
        if (screenX >= -TILE_SIZE && screenX <= canvas.width / DPR && 
            screenY >= -TILE_SIZE && screenY <= canvas.height / DPR) {
          
          // Временно отключаем проверку видимости для отладки
          if (gameState.map[y][x] === 1) {
            // Стена - очень темная
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.1, g: 0.1, b: 0.1, a: 1.0
            });
          } else {
            // Пол - темный для контраста со светом
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.16, g: 0.16, b: 0.16, a: 1.0
            });
          }
        }
      }
    }
  }
  
  static renderMapCanvas2D() {
    const startX = Math.floor(gameState.camera.x / TILE_SIZE) - 1;
    const endX = Math.floor((gameState.camera.x + canvas.width / DPR) / TILE_SIZE) + 1;
    const startY = Math.floor(gameState.camera.y / TILE_SIZE) - 1;
    const endY = Math.floor((gameState.camera.y + canvas.height / DPR) / TILE_SIZE) + 1;
    
    // Кэшируем цвета для оптимизации - темные для контраста со светом
    const wallColor = '#1a1a1a'; // Очень темные стены
    const floorColor = '#2a2a2a'; // Темный пол
    
    // Ограничиваем область рендеринга
    const clampedStartX = Math.max(0, startX);
    const clampedEndX = Math.min(MAP_SIZE, endX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndY = Math.min(MAP_SIZE, endY);
    
    // Рендерим карту через Canvas 2D
    for (let y = clampedStartY; y < clampedEndY; y++) {
      for (let x = clampedStartX; x < clampedEndX; x++) {
        const screenX = x * TILE_SIZE - gameState.camera.x;
        const screenY = y * TILE_SIZE - gameState.camera.y;
        
        // Проверяем, что тайл находится в видимой области экрана
        if (screenX >= -TILE_SIZE && screenX <= canvas.width / DPR && 
            screenY >= -TILE_SIZE && screenY <= canvas.height / DPR) {
          
          // Временно отключаем проверку видимости для отладки
          if (gameState.map[y][x] === 1) {
            // Стена
            ctx.fillStyle = wallColor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            // Пол
            ctx.fillStyle = floorColor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
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

  static renderMinimap() {
    if (!minimapCtx || !gameState.map) return;
    
    // Оптимизированная отрисовка миникарты - обновляем реже
    if (Math.floor(gameState.gameTime * 30) % 2 !== 0) {
      return;
    }
    
    const minimapSize = 100; // Уменьшил размер с 120 до 100
    const scale = minimapSize / MAP_SIZE;
    
    minimapCtx.fillStyle = '#000';
    minimapCtx.fillRect(0, 0, minimapSize, minimapSize);
    
    // Отрисовка карты только в исследованных областях
    // Источники света НЕ влияют на исследование карты - только игрок может раскрывать туман войны
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        // Показываем только исследованные области (раскрытые игроком)
        if (gameState.fogOfWar && gameState.fogOfWar.explored[y][x]) {
          if (gameState.map[y][x] === 1) {
            minimapCtx.fillStyle = '#1a1a1a'; // Темные стены
            minimapCtx.fillRect(x * scale, y * scale, scale, scale);
          } else {
            minimapCtx.fillStyle = '#2a2a2a'; // Темный пол
            minimapCtx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
    }
    
    // Отрисовка игрока
    if (gameState.player) {
      const playerX = Math.floor(gameState.player.x / TILE_SIZE);
      const playerY = Math.floor(gameState.player.y / TILE_SIZE);
      minimapCtx.fillStyle = '#00ff00';
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
          minimapCtx.fillStyle = '#ff0000';
          minimapCtx.fillRect(enemyX * scale, enemyY * scale, scale, scale);
        }
      }
    });
  }
  
  static renderFPSIndicator() {
    // Показываем FPS всегда без мигания
    

    
    const fps = PerformanceMonitor.getFPS();
    const avgFrameTime = PerformanceMonitor.getAverageFrameTime();
    const isLowMode = PerformanceMonitor.isLowPerformanceMode();
      
    // Определяем размеры экрана и адаптивность
    const canvasWidth = canvas.width / DPR;
    const canvasHeight = canvas.height / DPR;
    const isMobile = window.innerWidth <= 768;
    
    // Размеры и позиции для разных экранов
    let minimapSize, fpsX, fpsY, fpsWidth, fpsHeight, fontSize;
    
          if (isMobile) {
        // Мобильная версия - под миникартой
        minimapSize = 100;
        fpsWidth = 80;
        fpsHeight = 35;
        fontSize = 12;
        fpsX = canvasWidth - fpsWidth - 10; // Выровнено по правому краю экрана
        fpsY = 120 + 24; // Миникарта (100px) + отступ (24px) + дополнительный отступ (20px)
      } else {
        // Десктопная версия - под миникартой
        minimapSize = 100;
        fpsWidth = 90;
        fpsHeight = 45;
        fontSize = 14;
        fpsX = canvasWidth - fpsWidth - 10; // Выровнено по правому краю экрана
        fpsY = 120 + 24; // Миникарта (100px) + отступ (24px) + дополнительный отступ (20px)
      }
    
    // FPS теперь всегда под миникартой, дополнительная проверка не нужна
    
    // Фон для лучшей читаемости
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(fpsX - 5, fpsY - 15, fpsWidth, fpsHeight);
    
    // Рамка
    ctx.strokeStyle = isLowMode ? '#ff4444' : '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(fpsX - 5, fpsY - 15, fpsWidth, fpsHeight);
    
    // Текст
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = isLowMode ? '#ff4444' : '#00ff00';
    ctx.textAlign = 'left';
    
    const fpsText = `FPS: ${fps}`;
    const frameTimeText = `${avgFrameTime.toFixed(1)}ms`;
    const modeText = isLowMode ? 'LOW' : 'OK';
    
    ctx.fillText(fpsText, fpsX, fpsY);
    ctx.fillText(frameTimeText, fpsX, fpsY + (isMobile ? 10 : 12));
    ctx.fillText(modeText, fpsX, fpsY + (isMobile ? 20 : 24));
    

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
        hpTextEl.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
      }
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
      console.error('❌ Canvas not found in resizeCanvas');
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
      minimapCanvas.width = 100 * DPR; // Уменьшил с 120 до 100
      minimapCanvas.height = 100 * DPR; // Уменьшил с 120 до 100
      minimapCanvas.style.width = '100px'; // Уменьшил с 120px до 100px
      minimapCanvas.style.height = '100px'; // Уменьшил с 120px до 100px
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
        // Определяем иконку и цвет в зависимости от типа
        let icon = '🧪';
        let borderColor = '#ff6666';
        
        switch (potionType) {
          case 'potion':
            icon = '❤️';
            borderColor = '#ff6666'; // Красный для здоровья
            break;
          case 'speed_potion':
            icon = '💨';
            borderColor = '#66ff66'; // Зеленый для скорости
            break;
          case 'strength_potion':
            icon = '⚔️';
            borderColor = '#ffaa66'; // Оранжевый для силы
            break;
          case 'defense_potion':
            icon = '🛡️';
            borderColor = '#6666ff'; // Синий для защиты
            break;
          case 'regen_potion':
            icon = '💚';
            borderColor = '#ff66ff'; // Розовый для регенерации
            break;
          case 'combo_potion':
            icon = '✨';
            borderColor = '#ffff66'; // Желтый для комбо
            break;
          default:
            icon = '🧪';
            borderColor = '#ff6666';
        }
        
        // Подсчитываем количество зелий этого типа в рюкзаке
        const count = gameState.inventory.backpack.filter(item => 
          item && item.type === 'consumable' && item.base === potionType
        ).length;
        
        potionIcon.textContent = icon;
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
        potionIcon.textContent = '🧪';
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
  
  static useQuickPotion(slotIndex) {
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
    
    // Применяем эффекты зелья
    (async () => {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.applyConsumableEffects(potion);
    })();
    
    // Удаляем зелье из рюкзака
    gameState.inventory.backpack[potionIndex] = null;
    
    // Воспроизводим звук использования зелья
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playHealthPotion();
    })();
    
    // Обновляем UI
    this.updateQuickPotions();
    
    // Обновляем инвентарь
    (async () => {
      const { InventoryManager } = await import('../ui/InventoryManager.js');
      InventoryManager.renderInventory();
    })();
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
    let abilityIcon = '⚡';
    let abilityName = '';
    
    if (gameState.player.hasDash && gameState.player.dashCooldown > 0) {
      cooldown = gameState.player.dashCooldown;
      maxCooldown = 3.0;
      abilityIcon = '💨';
      abilityName = 'Dash';
    } else if (gameState.player.hasShield && gameState.player.shieldCooldown > 0) {
      cooldown = gameState.player.shieldCooldown;
      maxCooldown = 8.0;
      abilityIcon = '🛡️';
      abilityName = 'Shield';
    } else if (gameState.player.hasBlast && gameState.player.blastCooldown > 0) {
      cooldown = gameState.player.blastCooldown;
      maxCooldown = 12.0;
      abilityIcon = '💥';
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
    
    // Очищаем контейнер
    buffsContainer.innerHTML = '';
    
    // Добавляем активные баффы
    activeBuffs.forEach(buff => {
      const buffElement = document.createElement('div');
      buffElement.className = 'active-buff';
      
      // Добавляем классы предупреждения
      if (buff.remainingTime < 3) {
        buffElement.classList.add('critical');
      } else if (buff.remainingTime < 6) {
        buffElement.classList.add('warning');
      }
      
      const iconElement = document.createElement('span');
      iconElement.textContent = buff.icon;
      iconElement.style.fontSize = '14px';
      
      const timeElement = document.createElement('span');
      timeElement.textContent = `${Math.ceil(buff.remainingTime)}s`;
      timeElement.style.color = buff.remainingTime < 3 ? '#ff4444' : '#ffffff';
      
      // Устанавливаем ширину прогресс-бара через CSS переменную
      const progressPercent = (buff.remainingTime / buff.duration) * 100;
      buffElement.style.setProperty('--progress-width', `${progressPercent}%`);
      
      buffElement.appendChild(iconElement);
      buffElement.appendChild(timeElement);
      buffsContainer.appendChild(buffElement);
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
    
    gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
  }
} 