/* Darkfall Depths - WebGL система тумана войны */

import { MAP_SIZE, TILE_SIZE } from '../config/constants.js';
import { gameState } from '../core/GameState.js';

export class WebGLFogOfWar {
  constructor(webglRenderer) {
    this.webglRenderer = webglRenderer;
    this.explored = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
    this.visible = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
    
    // Создаем отдельный canvas для тумана войны
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Устанавливаем размер canvas равным размеру игрового поля
    this.canvas.width = MAP_SIZE * TILE_SIZE;
    this.canvas.height = MAP_SIZE * TILE_SIZE;
    
    // Кэш для оптимизации
    this.lastPlayerX = 0;
    this.lastPlayerY = 0;
    this.lastUpdateTime = 0;
    this.updateInterval = 300; // Обновляем каждые 300мс
    
    // Инициализируем туман войны
    this.initializeFog();
  }
  
  initializeFog() {
    // Заполняем весь canvas черным цветом (неисследованная область)
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  updateVisibility(playerX, playerY, radius = 12) {
    const currentTime = Date.now();
    
    // Проверяем, нужно ли обновлять туман войны
    const distanceMoved = Math.hypot(playerX - this.lastPlayerX, playerY - this.lastPlayerY);
    if (distanceMoved < 48 && currentTime - this.lastUpdateTime < this.updateInterval) {
      return; // Не обновляем, если игрок не двигался достаточно или прошло мало времени
    }
    
    this.lastPlayerX = playerX;
    this.lastPlayerY = playerY;
    this.lastUpdateTime = currentTime;
    
    // Очищаем видимость
    this.visible.forEach(row => row.fill(false));
    
    const centerTileX = Math.floor(playerX / TILE_SIZE);
    const centerTileY = Math.floor(playerY / TILE_SIZE);
    
    // Используем направленный алгоритм луча для эффекта фонарика
    this.calculateDirectionalVisibility(centerTileX, centerTileY, radius);
    
    // Добавляем видимость от источников света
    this.updateLightSourceVisibility();
  }
  
  updateLightSourceVisibility() {
    if (!gameState.lightSources) return;
    
    gameState.lightSources.forEach(lightSource => {
      if (lightSource.active) {
        const lightX = Math.floor(lightSource.x / TILE_SIZE);
        const lightY = Math.floor(lightSource.y / TILE_SIZE);
        const lightRadius = lightSource.radius;
        
        // Источники света НЕ раскрывают туман войны для миникарты
        // Они только влияют на видимость в реальном времени
        // Только игрок может исследовать карту
      }
    });
  }
  
  calculateDirectionalVisibility(centerX, centerY, radius) {
    // Получаем направление движения игрока
    const playerDirection = gameState.player.direction;
    
    // Если игрок не двигается, используем круговой свет
    if (playerDirection.x === 0 && playerDirection.y === 0) {
      this.calculateSimpleVisibility(centerX, centerY, radius);
      return;
    }
    
    // Вычисляем основной угол направления
    const mainAngle = Math.atan2(playerDirection.y, playerDirection.x);
    
    // Создаем конус света в направлении движения
    const coneAngle = Math.PI / 2; // 90 градусов (шире конус)
    const directions = 32; // Больше лучей для плавности
    const angleStep = (coneAngle * 2) / directions;
    
    for (let i = 0; i < directions; i++) {
      const angle = mainAngle - coneAngle + i * angleStep;
      this.castRay(centerX, centerY, angle, radius);
    }
    
    // Добавляем небольшой круговой свет вокруг игрока
    const baseDirections = 16;
    const baseAngleStep = (2 * Math.PI) / baseDirections;
    for (let i = 0; i < baseDirections; i++) {
      const angle = i * baseAngleStep;
      this.castRay(centerX, centerY, angle, radius * 0.5); // Увеличили радиус базового света
    }
  }
  
  calculateSimpleVisibility(centerX, centerY, radius) {
    // Алгоритм луча для создания эффекта фонарика
    const directions = 32; // Количество лучей для плавности
    const angleStep = (2 * Math.PI) / directions;
    
    for (let i = 0; i < directions; i++) {
      const angle = i * angleStep;
      this.castRay(centerX, centerY, angle, radius);
    }
  }
  
  castRay(startX, startY, angle, maxDistance) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    let tilesHit = 0;
    for (let distance = 0; distance <= maxDistance; distance++) {
      const x = Math.floor(startX + cos * distance);
      const y = Math.floor(startY + sin * distance);
      
      // Проверяем границы карты
      if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
        break;
      }
      
      // Отмечаем тайл как видимый и исследованный
      this.visible[y][x] = true;
      this.explored[y][x] = true;
      tilesHit++;
      
      // Если наткнулись на стену, прекращаем луч
      if (gameState.map && gameState.map[y] && gameState.map[y][x] === 1) {
        break;
      }
    }
  }
  
  render(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Используем WebGL для отрисовки тумана войны
    if (this.webglRenderer && this.webglRenderer.isSupported()) {
      this.renderWebGL(cameraX, cameraY, canvasWidth, canvasHeight);
    } else {
      return this.renderCanvas2D(cameraX, cameraY, canvasWidth, canvasHeight);
    }
  }
  
  renderWebGL(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Отрисовываем неисследованные области через WebGL
    this.webglRenderer.drawRect(0, 0, canvasWidth, canvasHeight, {
      r: 0.0, g: 0.0, b: 0.0, a: 1.0
    });
    
    // Отрисовываем исследованные области (полупрозрачные)
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.explored[y][x] && !this.visible[y][x]) {
          const screenX = x * TILE_SIZE - cameraX;
          const screenY = y * TILE_SIZE - cameraY;
          
          if (screenX >= -TILE_SIZE && screenX <= canvasWidth && 
              screenY >= -TILE_SIZE && screenY <= canvasHeight) {
            
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.0, g: 0.0, b: 0.0, a: 0.6
            });
          }
        }
      }
    }
    
    // Отрисовываем видимые области с градиентом (эффект фонарика)
    const playerX = Math.floor(gameState.player.x / TILE_SIZE);
    const playerY = Math.floor(gameState.player.y / TILE_SIZE);
    
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.visible[y][x]) {
          const screenX = x * TILE_SIZE - cameraX;
          const screenY = y * TILE_SIZE - cameraY;
          
          if (screenX >= -TILE_SIZE && screenX <= canvasWidth && 
              screenY >= -TILE_SIZE && screenY <= canvasHeight) {
            
            const distance = Math.hypot(x - playerX, y - playerY);
            const maxDistance = 12;
            // Делаем свет ярким в центре и постепенно затухающим к краям
            const brightness = Math.max(0, 1 - (distance / maxDistance));
            const alpha = Math.max(0, 0.3 - (brightness * 0.3)); // От 0 до 0.3 прозрачности
            
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.0, g: 0.0, b: 0.0, a: alpha
            });
          }
        }
      }
    }
  }
  
  renderCanvas2D(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Fallback: если WebGL недоступен, используем простую отрисовку без артефактов
    
    // Очищаем canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Отрисовываем неисследованные области (полностью черные)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Отрисовываем исследованные области (полупрозрачные)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.explored[y][x] && !this.visible[y][x]) {
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    
    // Отрисовываем видимые области с градиентом (эффект фонарика)
    const playerX = Math.floor(gameState.player.x / TILE_SIZE);
    const playerY = Math.floor(gameState.player.y / TILE_SIZE);
    
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.visible[y][x]) {
          const distance = Math.hypot(x - playerX, y - playerY);
          const maxDistance = 12;
          // Делаем свет ярким в центре и постепенно затухающим к краям
          const brightness = Math.max(0, 1 - (distance / maxDistance));
          const alpha = Math.max(0, 0.3 - (brightness * 0.3)); // От 0 до 0.3 прозрачности
          
          // Используем режим "destination-out" для создания "дырки" в тумане
          this.ctx.globalCompositeOperation = 'destination-out';
          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - alpha})`; // Инвертируем прозрачность
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          this.ctx.globalCompositeOperation = 'source-over'; // Возвращаем нормальный режим
        }
      }
    }
    
    return this.canvas;
  }
  
  // Метод для получения состояния видимости тайла
  isVisible(x, y) {
    return this.visible[y] && this.visible[y][x];
  }
  
  isExplored(x, y) {
    return this.explored[y] && this.explored[y][x];
  }
}
