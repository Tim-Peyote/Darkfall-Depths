/* Darkfall Depths - WebGL система тумана войны в стиле Nox */

import { MAP_SIZE, TILE_SIZE } from '../config/constants.js';
import { gameState } from '../core/GameState.js';

export class WebGLFogOfWar {
  constructor(webglRenderer) {
    this.webglRenderer = webglRenderer;
    
    // Получаем динамический размер карты
    const mapWidth = gameState.map && gameState.map[0] ? gameState.map[0].length : MAP_SIZE;
    const mapHeight = gameState.map ? gameState.map.length : MAP_SIZE;
    const maxMapSize = Math.max(mapWidth, mapHeight);
    
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.maxMapSize = maxMapSize;
    
    // Создаем отдельный canvas для тумана войны
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Устанавливаем размер canvas равным размеру игрового поля
    this.canvas.width = maxMapSize * TILE_SIZE;
    this.canvas.height = maxMapSize * TILE_SIZE;
    
    // Двухслойная система как в Nox
    this.visible = new Uint8Array(mapWidth * mapHeight);   // видимые тайлы сейчас
    this.explored = new Uint8Array(mapWidth * mapHeight);  // исследованные тайлы (память)
    this.lightIntensity = new Uint8Array(mapWidth * mapHeight); // интенсивность света для плавности
    
    // Буферы для интерполяции
    this.prevVisible = new Uint8Array(mapWidth * mapHeight);
    this.prevLightIntensity = new Uint8Array(mapWidth * mapHeight);
    this.interpolationProgress = 0;
    
    // Кэш для оптимизации
    this.lastPlayerX = 0;
    this.lastPlayerY = 0;
    this.lastUpdateTime = 0;
    this.updateInterval = 100; // Уменьшили интервал для более плавного обновления
    
    // Параметры тумана
    this.radius = 12;
    this.enabled = true;
    
    // Параметры сглаживания
    this.smoothingPasses = 3; // Увеличили количество проходов
    this.smoothingRadius = 2; // Увеличили радиус сглаживания
    
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
    if (distanceMoved < 16 && currentTime - this.lastUpdateTime < this.updateInterval) {
      // Даже если не обновляем FOV, обновляем интерполяцию
      this.updateInterpolation();
      return;
    }
    
    // Сохраняем предыдущее состояние для интерполяции
    this.prevVisible.set(this.visible);
    this.prevLightIntensity.set(this.lightIntensity);
    this.interpolationProgress = 0;
    
    this.lastPlayerX = playerX;
    this.lastPlayerY = playerY;
    this.lastUpdateTime = currentTime;
    
    // Очищаем видимость и интенсивность света
    this.visible.fill(0);
    this.lightIntensity.fill(0);
    
    const centerTileX = Math.floor(playerX / TILE_SIZE);
    const centerTileY = Math.floor(playerY / TILE_SIZE);
    
    // Вычисляем FOV как в Nox с улучшениями
    this.computeFOV(centerTileX, centerTileY, radius);
    
    // Применяем сглаживание для плавных переходов
    this.applySmoothing();
  }
  
  // Обновление интерполяции для плавных переходов
  updateInterpolation() {
    this.interpolationProgress = Math.min(1.0, this.interpolationProgress + 0.1);
  }
  
  // Получить интерполированное значение интенсивности
  getInterpolatedIntensity(x, y) {
    const idx = y * this.mapWidth + x;
    if (idx < 0 || idx >= this.lightIntensity.length) return 0;
    
    const current = this.lightIntensity[idx];
    const previous = this.prevLightIntensity[idx];
    
    // Плавная интерполяция между предыдущим и текущим состоянием
    return Math.round(previous + (current - previous) * this.interpolationProgress);
  }
  
  // Блокирует ли свет этот тайл
  static blocks(x, y) {
    if (x < 0 || y < 0 || x >= gameState.map[0].length || y >= gameState.map.length) return true;
    return gameState.map[y][x] === 1; // стены непрозрачные
  }
  
  // Пометить тайл как видимый с интенсивностью
  markVisible(x, y, intensity = 255) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return;
    const idx = y * this.mapWidth + x;
    this.visible[idx] = Math.max(this.visible[idx], intensity);
    this.lightIntensity[idx] = Math.max(this.lightIntensity[idx], intensity);
    this.explored[idx] = Math.max(this.explored[idx], 200); // сохраняем "осмотрено"
  }
  
  computeFOV(px, py, radius) {
    this.markVisible(px, py, 255);
    
    // Улучшенный алгоритм с учетом углов и направления движения
    const playerDirection = gameState.player.direction;
    const self = this;
    
    function castLight(row, start, end, xx, xy, yx, yy) {
      if (start < end) return;
      const r2 = radius * radius;
      for (let i = row; i <= radius; i++) {
        let dx = -i, dy = -i;
        let blocked = false;
        let newStart = start;
        while (dx <= 0) {
          const X = px + dx * xx + dy * xy;
          const Y = py + dx * yx + dy * yy;
          const lSlope = (dx - 0.5) / (dy + 0.5);
          const rSlope = (dx + 0.5) / (dy - 0.5);
          if (start < rSlope) { dx++; continue; }
          if (end > lSlope) break;
          const dist2 = dx * dx + dy * dy;
          if (X >= 0 && Y >= 0 && X < self.mapWidth && Y < self.mapHeight) {
            if (dist2 <= r2) {
              // Вычисляем интенсивность света с приоритетом на близкие области
              const distance = Math.sqrt(dist2);
              
              // Базовое затухание с приоритетом на близкие области
              let baseIntensity;
              if (distance <= 2) {
                // Очень близко к персонажу - максимальная яркость
                baseIntensity = 255;
              } else if (distance <= 4) {
                // Близко к персонажу - высокая яркость
                baseIntensity = 255 - (distance - 2) * 20;
              } else {
                // Дальше - постепенное затухание
                baseIntensity = Math.max(0, 175 - (distance - 4) * 25);
              }
              
              // Добавляем направленное затухание для более плавного конуса
              const angle = Math.atan2(dy, dx);
              const directionAngle = Math.atan2(playerDirection.y, playerDirection.x);
              const angleDiff = Math.abs(angle - directionAngle);
              
              // Направленный фактор с приоритетом на направление фонаря
              let directionFactor;
              if (distance <= 3) {
                // Близко к персонажу - меньше влияния направления
                directionFactor = Math.max(0.8, 1.0 - (angleDiff / Math.PI) * 0.2);
              } else {
                // Дальше - больше влияния направления
                directionFactor = Math.max(0.4, 1.0 - (angleDiff / Math.PI) * 0.6);
              }
              
              const intensity = Math.round(baseIntensity * directionFactor);
              self.markVisible(X, Y, intensity);
            }
            const blockedHere = WebGLFogOfWar.blocks(X, Y);
            if (blocked) {
              if (blockedHere) {
                newStart = rSlope;
              } else {
                blocked = false; start = newStart;
              }
            } else {
              if (blockedHere && i < radius) {
                blocked = true;
                castLight(i + 1, start, lSlope, xx, xy, yx, yy);
                newStart = rSlope;
              }
            }
          }
          dx++;
        }
        if (blocked) break;
      }
    }
    
    // 8 октантов с улучшенной точностью
    castLight(1, 1.0, 0.0, 1, 0, 0, 1);
    castLight(1, 1.0, 0.0, 1, 0, 0, -1);
    castLight(1, 1.0, 0.0, -1, 0, 0, 1);
    castLight(1, 1.0, 0.0, -1, 0, 0, -1);
    castLight(1, 1.0, 0.0, 0, 1, 1, 0);
    castLight(1, 1.0, 0.0, 0, 1, -1, 0);
    castLight(1, 1.0, 0.0, 0, -1, 1, 0);
    castLight(1, 1.0, 0.0, 0, -1, -1, 0);
    
    // Дополнительные лучи для лучшего покрытия углов
    this.castAdditionalRays(px, py, radius);
  }
  
  // Дополнительные лучи для лучшего покрытия углов
  castAdditionalRays(px, py, radius) {
    const directions = 48; // Увеличили количество направлений
    const angleStep = (2 * Math.PI) / directions;
    const playerDirection = gameState.player.direction;
    
    for (let i = 0; i < directions; i++) {
      const angle = i * angleStep;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      for (let distance = 1; distance <= radius; distance++) {
        const x = Math.floor(px + cos * distance);
        const y = Math.floor(py + sin * distance);
        
        if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) break;
        
        // Вычисляем интенсивность света с приоритетом на близкие области
        let baseIntensity;
        if (distance <= 2) {
          // Очень близко к персонажу - максимальная яркость
          baseIntensity = 255;
        } else if (distance <= 4) {
          // Близко к персонажу - высокая яркость
          baseIntensity = 255 - (distance - 2) * 20;
        } else {
          // Дальше - постепенное затухание
          baseIntensity = Math.max(0, 175 - (distance - 4) * 25);
        }
        
        // Направленное затухание с приоритетом на направление фонаря
        const directionAngle = Math.atan2(playerDirection.y, playerDirection.x);
        const angleDiff = Math.abs(angle - directionAngle);
        
        let directionFactor;
        if (distance <= 3) {
          // Близко к персонажу - меньше влияния направления
          directionFactor = Math.max(0.8, 1.0 - (angleDiff / Math.PI) * 0.2);
        } else {
          // Дальше - больше влияния направления
          directionFactor = Math.max(0.4, 1.0 - (angleDiff / Math.PI) * 0.6);
        }
        
        const intensity = Math.round(baseIntensity * directionFactor);
        this.markVisible(x, y, intensity);
        
        // Проверяем стену
        if (WebGLFogOfWar.blocks(x, y)) break;
      }
    }
  }
  
  // Сглаживание для плавных переходов
  applySmoothing() {
    const tempIntensity = new Uint8Array(this.lightIntensity);
    
    for (let pass = 0; pass < this.smoothingPasses; pass++) {
      for (let y = 0; y < this.mapHeight; y++) {
        for (let x = 0; x < this.mapWidth; x++) {
          const idx = y * this.mapWidth + x;
          if (this.visible[idx] > 0) {
            let sum = 0;
            let count = 0;
            
            // Собираем значения соседних тайлов
            for (let dy = -this.smoothingRadius; dy <= this.smoothingRadius; dy++) {
              for (let dx = -this.smoothingRadius; dx <= this.smoothingRadius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
                  const nIdx = ny * this.mapWidth + nx;
                  sum += tempIntensity[nIdx];
                  count++;
                }
              }
            }
            
            // Применяем сглаженное значение
            if (count > 0) {
              this.lightIntensity[idx] = sum / count;
            }
          }
        }
      }
      
      // Копируем для следующего прохода
      if (pass < this.smoothingPasses - 1) {
        tempIntensity.set(this.lightIntensity);
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
    // Рендерим туман войны как в Nox - двухслойная система с плавными переходами
    
    // Слой 1: Неисследованные области (черные)
    this.webglRenderer.drawRect(0, 0, canvasWidth, canvasHeight, {
      r: 0.0, g: 0.0, b: 0.0, a: 1.0
    });
    
    // Слой 2: Исследованные, но не видимые области (серые)
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        const explored = this.explored[idx] > 0;
        const visible = this.visible[idx] > 0;
        
        if (explored && !visible) {
          const screenX = x * TILE_SIZE - cameraX;
          const screenY = y * TILE_SIZE - cameraY;
          
          if (screenX >= -TILE_SIZE && screenX <= canvasWidth && 
              screenY >= -TILE_SIZE && screenY <= canvasHeight) {
            
            // Серый туман для исследованных областей
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.0, g: 0.0, b: 0.0, a: 0.8
            });
          }
        }
      }
    }
    
    // Слой 3: Видимые области с интерполированными переходами и увеличенным контрастом
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        const visible = this.visible[idx] > 0;
        
        if (visible) {
          const screenX = x * TILE_SIZE - cameraX;
          const screenY = y * TILE_SIZE - cameraY;
          
          if (screenX >= -TILE_SIZE && screenX <= canvasWidth && 
              screenY >= -TILE_SIZE && screenY <= canvasHeight) {
            
            // Используем интерполированную интенсивность для плавных переходов с увеличенным контрастом
            const interpolatedIntensity = this.getInterpolatedIntensity(x, y);
            const intensity = interpolatedIntensity / 255;
            
            // Увеличиваем контраст: более светлые области возле персонажа, более темные на краях
            let contrastIntensity;
            if (intensity > 0.8) {
              // Очень близко к персонажу - максимальная яркость (убрали градиент)
              contrastIntensity = 1.0;
            } else if (intensity > 0.6) {
              // Близко к персонажу - высокая яркость
              contrastIntensity = 0.9 + (intensity - 0.6) * 0.5;
            } else {
              // Дальше - стандартное затухание с повышенным контрастом
              contrastIntensity = Math.pow(intensity, 0.4);
            }
            
            const alpha = Math.max(0, 0.99 - (contrastIntensity * 0.99)); // Увеличили диапазон прозрачности
            
            this.webglRenderer.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE, {
              r: 0.0, g: 0.0, b: 0.0, a: alpha
            });
          }
        }
      }
    }
  }
  
  renderCanvas2D(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Fallback: Canvas2D версия в стиле Nox с интерполированными переходами
    
    // Очищаем canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Слой 1: Неисследованные области (черные)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Слой 2: Исследованные, но не видимые области (серые)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        const explored = this.explored[idx] > 0;
        const visible = this.visible[idx] > 0;
        
        if (explored && !visible) {
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;
          this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    
    // Слой 3: Видимые области с интерполированными переходами и увеличенным контрастом
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        const visible = this.visible[idx] > 0;
        
        if (visible) {
          const screenX = x * TILE_SIZE;
          const screenY = y * TILE_SIZE;
          
          // Используем интерполированную интенсивность для плавных переходов с увеличенным контрастом
          const interpolatedIntensity = this.getInterpolatedIntensity(x, y);
          const intensity = interpolatedIntensity / 255;
          
          // Увеличиваем контраст: более светлые области возле персонажа, более темные на краях
          let contrastIntensity;
          if (intensity > 0.8) {
            // Очень близко к персонажу - максимальная яркость (убрали градиент)
            contrastIntensity = 1.0;
          } else if (intensity > 0.6) {
            // Близко к персонажу - высокая яркость
            contrastIntensity = 0.9 + (intensity - 0.6) * 0.5;
          } else {
            // Дальше - стандартное затухание с повышенным контрастом
            contrastIntensity = Math.pow(intensity, 0.4);
          }
          
          const alpha = Math.max(0, 0.99 - (contrastIntensity * 0.99)); // Увеличили диапазон прозрачности
          
          this.ctx.globalCompositeOperation = 'destination-out';
          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - alpha})`;
          this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          this.ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    
    return this.canvas;
  }
  
  // Метод для получения состояния видимости тайла
  isVisible(x, y) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return false;
    const idx = y * this.mapWidth + x;
    return this.visible[idx] > 0;
  }
  
  isExplored(x, y) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return false;
    const idx = y * this.mapWidth + x;
    return this.explored[idx] > 0;
  }
  
  // Метод для миникарты - возвращает исследованные области
  getExploredForMinimap() {
    const minimapData = [];
    
    for (let y = 0; y < this.mapHeight; y++) {
      const row = [];
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        row.push(this.explored[idx] > 0);
      }
      minimapData.push(row);
    }
    
    return minimapData;
  }
  
  // Метод для миникарты - возвращает видимые области
  getVisibleForMinimap() {
    const minimapData = [];
    
    for (let y = 0; y < this.mapHeight; y++) {
      const row = [];
      for (let x = 0; x < this.mapWidth; x++) {
        const idx = y * this.mapWidth + x;
        row.push(this.visible[idx] > 0);
      }
      minimapData.push(row);
    }
    
    return minimapData;
  }
}
