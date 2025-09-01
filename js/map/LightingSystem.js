/* Darkfall Depths - Продвинутая система освещения */

import { TILE_SIZE, MAP_SIZE } from '../config/constants.js';
import { Logger } from '../utils/Logger.js';

export class LightingSystem {
  constructor(webglRenderer) {
    this.webglRenderer = webglRenderer;
    this.lightSources = new Map(); // ID источника -> данные источника
    this.lightMap = null; // Карта освещения для каждого тайла
    this.ambientLight = 0.05; // Очень темное фоновое освещение для контраста
    this.maxLightIntensity = 1.0;
    this.gameMap = null; // Карта для проверки препятствий
    
    // Настройки производительности (ультра оптимизация)
    this.updateInterval = 150; // Увеличили с 100 до 150мс для экономии ресурсов
    this.lastUpdateTime = 0;
    this.lightMapSize = MAP_SIZE;
    
    // Кеширование для оптимизации
    this.lightCache = new Map(); // Кеш просчитанного освещения
    this.cameraViewport = { x: 0, y: 0, width: 0, height: 0 }; // Область видимости камеры
    this.visibleLights = new Set(); // Только видимые источники света
    
    // Инициализация карты освещения
    this.initializeLightMap();
    
    // Создаем WebGL шейдеры для освещения
    this.createLightingShaders();
  }
  
  initializeLightMap() {
    // Создаем карту освещения: [r, g, b, intensity] для каждого тайла
    this.lightMap = new Float32Array(this.lightMapSize * this.lightMapSize * 4);
    this.lightMap.fill(0);
  }
  
  createLightingShaders() {
    if (!this.webglRenderer || !this.webglRenderer.gl) return;
    
    // Вершинный шейдер для освещения
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      uniform mat3 u_matrix;
      uniform vec2 u_lightPosition;
      uniform float u_lightRadius;
      uniform vec3 u_lightColor;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_distance;
      varying vec3 v_lightColor;
      
      void main() {
        gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
        
        // Вычисляем расстояние до источника света
        vec2 pixelPos = a_position;
        v_distance = distance(pixelPos, u_lightPosition) / u_lightRadius;
        v_lightColor = u_lightColor;
      }
    `;
    
    // Фрагментный шейдер для освещения
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      varying float v_distance;
      varying vec3 v_lightColor;
      
      uniform sampler2D u_texture;
      uniform float u_ambientLight;
      uniform float u_maxIntensity;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        vec4 baseColor = v_color * texColor;
        
        // Вычисляем интенсивность освещения
        float lightIntensity = 1.0 - smoothstep(0.0, 1.0, v_distance);
        lightIntensity = min(lightIntensity, u_maxIntensity);
        
        // Применяем цветное освещение
        vec3 lightEffect = v_lightColor * lightIntensity;
        
        // Комбинируем с фоновым освещением
        vec3 finalColor = baseColor.rgb * (lightEffect + u_ambientLight);
        
        gl_FragColor = vec4(finalColor, baseColor.a);
      }
    `;
    
    // Компилируем шейдеры
    this.lightingProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    
    if (this.lightingProgram) {
      // Получаем униформы
      this.lightingUniforms = {
        matrix: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_matrix'),
        lightPosition: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_lightPosition'),
        lightRadius: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_lightRadius'),
        lightColor: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_lightColor'),
        ambientLight: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_ambientLight'),
        maxIntensity: this.webglRenderer.gl.getUniformLocation(this.lightingProgram, 'u_maxIntensity')
      };
    }
  }
  
  createShaderProgram(vertexSource, fragmentSource) {
    const gl = this.webglRenderer.gl;
    
    const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      Logger.error('Ошибка линковки программы освещения:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  compileShader(source, type) {
    const gl = this.webglRenderer.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      Logger.error('Ошибка компиляции шейдера освещения:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // Добавление источника света
  addLightSource(id, x, y, radius, color = [1, 1, 1], intensity = 1.0, flicker = 0, pulse = 0, direction = null, coneAngle = null) {
    this.lightSources.set(id, {
      x: x * TILE_SIZE + TILE_SIZE / 2, // Центр тайла
      y: y * TILE_SIZE + TILE_SIZE / 2,
      radius: radius * TILE_SIZE,
      color: color,
      baseIntensity: intensity,
      currentIntensity: intensity,
      flicker: flicker, // Амплитуда мерцания (0-1)
      pulse: pulse, // Скорость пульсации (0-1)
      startTime: Date.now(),
      direction: direction, // Направление для направленного света
      coneAngle: coneAngle // Угол конуса для направленного света
    });
  }
  
  // Удаление источника света
  removeLightSource(id) {
    this.lightSources.delete(id);
  }
  
  // Обновление источников света
  updateLightSources() {
    const currentTime = Date.now();
    
    // Проверяем, нужно ли обновлять
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    
    // Обновляем каждый источник света
    for (const [id, light] of this.lightSources) {
      let intensity = light.baseIntensity;
      
      // Применяем мерцание
      if (light.flicker > 0) {
        const flickerTime = (currentTime - light.startTime) * 0.01;
        const flickerValue = Math.sin(flickerTime * 10) * light.flicker;
        intensity += flickerValue;
      }
      
      // Применяем пульсацию
      if (light.pulse > 0) {
        const pulseTime = (currentTime - light.startTime) * 0.002;
        const pulseValue = Math.sin(pulseTime) * light.pulse * 0.5;
        intensity += pulseValue;
      }
      
      // Ограничиваем интенсивность
      light.currentIntensity = Math.max(0, Math.min(this.maxLightIntensity, intensity));
    }
  }
  
  // Обновление карты освещения (ультра оптимизированное)
  updateLightMap() {
    // Обновляем список видимых источников света
    this.updateVisibleLights();
    
    // Очищаем только видимую область карты освещения
    this.clearVisibleLightMap();
    
    // Применяем фоновое освещение только в видимой области
    this.applyAmbientLightToViewport();
    
    // Применяем только видимые источники света
    for (const lightId of this.visibleLights) {
      const light = this.lightSources.get(lightId);
      if (light) {
        this.applyLightSource(light);
      }
    }
  }
  
  // Обновляем список источников света в области видимости
  updateVisibleLights() {
    this.visibleLights.clear();
    
    for (const [id, light] of this.lightSources) {
      // Проверяем, находится ли источник света в области видимости + буфер
      const buffer = light.radius + 100; // Буфер для плавности
      if (light.x >= this.cameraViewport.x - buffer &&
          light.x <= this.cameraViewport.x + this.cameraViewport.width + buffer &&
          light.y >= this.cameraViewport.y - buffer &&
          light.y <= this.cameraViewport.y + this.cameraViewport.height + buffer) {
        this.visibleLights.add(id);
      }
    }
  }
  
  // Очищаем только видимую область карты освещения
  clearVisibleLightMap() {
    const startX = Math.max(0, Math.floor(this.cameraViewport.x / TILE_SIZE));
    const endX = Math.min(this.lightMapSize, Math.ceil((this.cameraViewport.x + this.cameraViewport.width) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(this.cameraViewport.y / TILE_SIZE));
    const endY = Math.min(this.lightMapSize, Math.ceil((this.cameraViewport.y + this.cameraViewport.height) / TILE_SIZE));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = (y * this.lightMapSize + x) * 4;
        this.lightMap[index] = 0;     // R
        this.lightMap[index + 1] = 0; // G
        this.lightMap[index + 2] = 0; // B
        this.lightMap[index + 3] = 0; // Intensity
      }
    }
  }
  
  // Применяем фоновое освещение только в видимой области
  applyAmbientLightToViewport() {
    const startX = Math.max(0, Math.floor(this.cameraViewport.x / TILE_SIZE));
    const endX = Math.min(this.lightMapSize, Math.ceil((this.cameraViewport.x + this.cameraViewport.width) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(this.cameraViewport.y / TILE_SIZE));
    const endY = Math.min(this.lightMapSize, Math.ceil((this.cameraViewport.y + this.cameraViewport.height) / TILE_SIZE));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = (y * this.lightMapSize + x) * 4;
        this.lightMap[index] = this.ambientLight;     // R
        this.lightMap[index + 1] = this.ambientLight; // G
        this.lightMap[index + 2] = this.ambientLight; // B
        this.lightMap[index + 3] = this.ambientLight; // Intensity
      }
    }
  }
  
  // Применение одного источника света к карте
  applyLightSource(light) {
    const centerX = Math.floor(light.x / TILE_SIZE);
    const centerY = Math.floor(light.y / TILE_SIZE);
    const radiusInTiles = Math.ceil(light.radius / TILE_SIZE);
    
    // Проходим по всем тайлам в радиусе света
    for (let y = centerY - radiusInTiles; y <= centerY + radiusInTiles; y++) {
      for (let x = centerX - radiusInTiles; x <= centerX + radiusInTiles; x++) {
        if (x < 0 || x >= this.lightMapSize || y < 0 || y >= this.lightMapSize) {
          continue;
        }
        
        // Вычисляем расстояние от центра источника до центра тайла
        const tileCenterX = x * TILE_SIZE + TILE_SIZE / 2;
        const tileCenterY = y * TILE_SIZE + TILE_SIZE / 2;
        const distance = Math.hypot(tileCenterX - light.x, tileCenterY - light.y);
        
        // Если тайл в радиусе света
        if (distance <= light.radius) {
          let intensity = (1 - distance / light.radius) * light.currentIntensity;
          
          // Если это направленный свет, применяем направленное освещение
          if (light.direction && light.coneAngle) {
            intensity = this.applyDirectionalLighting(light, tileCenterX, tileCenterY, intensity);
          }
          
          // Проверяем препятствия (стены) - свет не проходит через стены
          if (this.gameMap && this.checkLineOfSight(light.x, light.y, tileCenterX, tileCenterY)) {
            intensity = 0; // Полная блокировка света за препятствиями
          }
          
          // Дополнительная проверка - если сам тайл является стеной, не освещаем его
          if (this.gameMap && this.gameMap[y] && this.gameMap[y][x] === 1) {
            intensity = 0; // Стены не освещаются
          }
          
          const index = (y * this.lightMapSize + x) * 4;
          
          // Применяем цветное освещение (только для визуального эффекта)
          // НЕ влияет на исследование карты
          this.lightMap[index] = Math.max(this.lightMap[index], light.color[0] * intensity);
          this.lightMap[index + 1] = Math.max(this.lightMap[index + 1], light.color[1] * intensity);
          this.lightMap[index + 2] = Math.max(this.lightMap[index + 2], light.color[2] * intensity);
          this.lightMap[index + 3] = Math.max(this.lightMap[index + 3], intensity);
        }
      }
    }
  }
  
  // Применение направленного освещения
  applyDirectionalLighting(light, targetX, targetY, baseIntensity) {
    const angleToTarget = Math.atan2(targetY - light.y, targetY - light.x);
    const lightAngle = Math.atan2(light.direction.y, light.direction.x);
    
    // Вычисляем разность углов
    let angleDiff = Math.abs(angleToTarget - lightAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    
    // Если точка вне конуса света, значительно уменьшаем интенсивность
    if (angleDiff > light.coneAngle / 2) {
      return baseIntensity * 0.02; // Очень слабое освещение вне конуса
    }
    
    // Направленное затухание - ярче спереди, тусклее сзади
    const coneFalloff = 1 - (angleDiff / (light.coneAngle / 2));
    const directionalFalloff = Math.pow(coneFalloff, 1.5); // Более резкое затухание
    return baseIntensity * directionalFalloff;
  }
  
  // Рендеринг освещения
  render(cameraX, cameraY, canvasWidth, canvasHeight) {
    if (!this.webglRenderer || !this.webglRenderer.isSupported()) {
      return this.renderCanvas2D(cameraX, cameraY, canvasWidth, canvasHeight);
    }
    
    return this.renderWebGL(cameraX, cameraY, canvasWidth, canvasHeight);
  }
  
  renderWebGL(cameraX, cameraY, canvasWidth, canvasHeight) {
    const gl = this.webglRenderer.gl;
    
    // Используем программу освещения
    gl.useProgram(this.lightingProgram);
    
    // Устанавливаем униформы
    gl.uniform1f(this.lightingUniforms.ambientLight, this.ambientLight);
    gl.uniform1f(this.lightingUniforms.maxIntensity, this.maxLightIntensity);
    
    // Рендерим каждый источник света
    for (const [id, light] of this.lightSources) {
      const screenX = light.x - cameraX;
      const screenY = light.y - cameraY;
      
      // Проверяем, виден ли источник света на экране
      if (screenX >= -light.radius && screenX <= canvasWidth + light.radius &&
          screenY >= -light.radius && screenY <= canvasHeight + light.radius) {
        
        gl.uniform2f(this.lightingUniforms.lightPosition, screenX, screenY);
        gl.uniform1f(this.lightingUniforms.lightRadius, light.radius);
        gl.uniform3f(this.lightingUniforms.lightColor, light.color[0], light.color[1], light.color[2]);
        
        // Рисуем круг света
        this.drawLightCircle(screenX, screenY, light.radius, light.currentIntensity);
      }
    }
    
    // Возвращаемся к основной программе
    gl.useProgram(this.webglRenderer.program);
  }
  
  drawLightCircle(centerX, centerY, radius, intensity) {
    // Создаем круг света с градиентом
    const segments = 32;
    const vertices = [];
    const colors = [];
    
    // Центр круга
    vertices.push(centerX, centerY);
    colors.push(1, 1, 1, intensity);
    
    // Точки окружности
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      vertices.push(x, y);
      colors.push(1, 1, 1, 0); // Прозрачные края
    }
    
    // Загружаем данные в буферы
    const gl = this.webglRenderer.gl;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.webglRenderer.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.webglRenderer.attributes.position);
    gl.vertexAttribPointer(this.webglRenderer.attributes.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.webglRenderer.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.webglRenderer.attributes.color);
    gl.vertexAttribPointer(this.webglRenderer.attributes.color, 4, gl.FLOAT, false, 0, 0);
    
    // Рисуем треугольный веер
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
  }
  
  renderCanvas2D(cameraX, cameraY, canvasWidth, canvasHeight) {
    // Fallback для Canvas 2D
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Создаем градиент для каждого источника света
    for (const [id, light] of this.lightSources) {
      const screenX = light.x - cameraX;
      const screenY = light.y - cameraY;
      
      if (screenX >= -light.radius && screenX <= canvasWidth + light.radius &&
          screenY >= -light.radius && screenY <= canvasHeight + light.radius) {
        
        const gradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, light.radius
        );
        
        const alpha = light.currentIntensity;
        const color = light.color;
        
        // Очень мягкий градиент как у факела
        gradient.addColorStop(0, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.9})`);
        gradient.addColorStop(0.1, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.7})`);
        gradient.addColorStop(0.2, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.5})`);
        gradient.addColorStop(0.3, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.3})`);
        gradient.addColorStop(0.4, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.2})`);
        gradient.addColorStop(0.5, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.1})`);
        gradient.addColorStop(0.6, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.05})`);
        gradient.addColorStop(0.7, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.02})`);
        gradient.addColorStop(0.8, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.01})`);
        gradient.addColorStop(0.9, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.005})`);
        gradient.addColorStop(0.95, `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${alpha * 0.002})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - light.radius, screenY - light.radius, light.radius * 2, light.radius * 2);
      }
    }
    
    return canvas;
  }
  
  // Получение интенсивности освещения в точке
  getLightIntensity(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    if (tileX < 0 || tileX >= this.lightMapSize || tileY < 0 || tileY >= this.lightMapSize) {
      return this.ambientLight;
    }
    
    const index = (tileY * this.lightMapSize + tileX) * 4;
    return this.lightMap[index + 3]; // Интенсивность
  }
  
  // Получение цвета освещения в точке
  getLightColor(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    if (tileX < 0 || tileX >= this.lightMapSize || tileY < 0 || tileY >= this.lightMapSize) {
      return [this.ambientLight, this.ambientLight, this.ambientLight];
    }
    
    const index = (tileY * this.lightMapSize + tileX) * 4;
    return [
      this.lightMap[index],     // R
      this.lightMap[index + 1], // G
      this.lightMap[index + 2]  // B
    ];
  }
  
  // Установка карты для проверки препятствий
  setGameMap(map) {
    this.gameMap = map;
  }
  
  // Проверка линии видимости между двумя точками
  checkLineOfSight(startX, startY, endX, endY) {
    if (!this.gameMap) return false;
    
    const startTileX = Math.floor(startX / TILE_SIZE);
    const startTileY = Math.floor(startY / TILE_SIZE);
    const endTileX = Math.floor(endX / TILE_SIZE);
    const endTileY = Math.floor(endY / TILE_SIZE);
    
    // Проверяем границы карты
    if (startTileX < 0 || startTileX >= this.gameMap[0].length || 
        startTileY < 0 || startTileY >= this.gameMap.length ||
        endTileX < 0 || endTileX >= this.gameMap[0].length || 
        endTileY < 0 || endTileY >= this.gameMap.length) {
      return true; // За пределами карты считаем препятствием
    }
    
    // Используем алгоритм Брезенхэма для проверки линии
    const dx = Math.abs(endTileX - startTileX);
    const dy = Math.abs(endTileY - startTileY);
    const sx = startTileX < endTileX ? 1 : -1;
    const sy = startTileY < endTileY ? 1 : -1;
    let err = dx - dy;
    
    let x = startTileX;
    let y = startTileY;
    
    // Проверяем начальную точку
    if (this.gameMap[y] && this.gameMap[y][x] === 1) {
      return true; // Начальная точка в стене
    }
    
    while (x !== endTileX || y !== endTileY) {
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      
      // Проверяем текущую точку
      if (this.gameMap[y] && this.gameMap[y][x] === 1) {
        return true; // Препятствие найдено
      }
    }
    
    return false; // Препятствий нет
  }
  
  // Очистка всех источников света
  clear() {
    this.lightSources.clear();
    this.initializeLightMap();
  }
  
  // Обновляем область видимости камеры для оптимизации освещения
  updateCameraViewport(cameraX, cameraY, viewportWidth, viewportHeight) {
    this.cameraViewport.x = cameraX;
    this.cameraViewport.y = cameraY;
    this.cameraViewport.width = viewportWidth;
    this.cameraViewport.height = viewportHeight;
  }
}

// Предустановленные типы источников света
export const LIGHT_TYPES = {
  TORCH: {
    radius: 1.5, // Уменьшили радиус в два раза
    color: [1.0, 0.5, 0.1], // Насыщенный оранжевый
    intensity: 0.6,
    flicker: 0.08,
    pulse: 0
  },
  MAGIC_ORB: {
    radius: 1, // Уменьшили радиус
    color: [0.3, 0.9, 1.0], // Яркий голубой
    intensity: 0.5,
    flicker: 0,
    pulse: 0.03
  },
  CRYSTAL: {
    radius: 0.5, // Уменьшили радиус
    color: [0.9, 0.3, 1.0], // Яркий фиолетовый
    intensity: 0.4,
    flicker: 0,
    pulse: 0.02
  },
  FIRE: {
    radius: 2, // Уменьшили радиус в два раза
    color: [1.0, 0.3, 0.05], // Насыщенный красный
    intensity: 0.7,
    flicker: 0.12,
    pulse: 0
  },
  PLAYER_LIGHT: {
    radius: 7,
    color: [1.0, 0.6, 0.2], // Оранжевый как факел
    intensity: 0.175, // Уменьшили яркость на 50%
    flicker: 0,
    pulse: 0
  }
};
