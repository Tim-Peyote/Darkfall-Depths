/* Darkfall Depths - Направленный свет игрока */

import { LightSource } from './LightSource.js';
import { TILE_SIZE } from '../config/constants.js';

export class PlayerLight extends LightSource {
  constructor(x, y) {
    super(x, y, 'PLAYER_LIGHT', false);
    
    // Убеждаемся, что все свойства правильно инициализированы
    this.currentIntensity = this.lightData.intensity;
    this.pulsePhase = 0;
    
    // Настройки направленного света
    this.direction = { x: 1, y: 0 }; // Направление по умолчанию (вправо) - уже нормализовано
    this.coneAngle = Math.PI / 3; // 60 градусов конус света (еще шире)
    this.baseRadius = 5; // Еще больший базовый радиус
    this.maxRadius = 7; // Еще больший максимальный радиус
    
    // Обновляем параметры света
    this.radius = this.maxRadius; // Используем максимальный радиус по умолчанию
    this.color = [1.0, 0.6, 0.2]; // Оранжевый как факел
    this.intensity = 0.175; // Уменьшили яркость на 50%
    this.currentIntensity = this.intensity; // Инициализируем currentIntensity
    
    // Состояние света
    this.isDirectional = true; // Всегда направленный свет
    this.lastDirection = { x: 1, y: 0 }; // Уже нормализовано
  }
  
  // Обновление направления света
  updateDirection(directionX, directionY) {
    // Всегда обновляем направление, даже если игрок стоит
    this.direction.x = directionX;
    this.direction.y = directionY;
    this.lastDirection.x = directionX;
    this.lastDirection.y = directionY;
    
    // Всегда направленный свет
    this.isDirectional = true;
  }
  
  // Получение данных для системы освещения с учетом направления
  getLightData() {
    if (!this.active) return null;
    
    // Вычисляем смещенную позицию источника света
    const angle = Math.atan2(this.direction.y, this.direction.x);
    const offsetDistance = 20; // Отступ от персонажа
    const lightX = this.x + Math.cos(angle) * offsetDistance;
    const lightY = this.y + Math.sin(angle) * offsetDistance;
    
    const baseData = super.getLightData();
    if (!baseData) return null;
    
    return {
      ...baseData,
      x: lightX, // Используем смещенную позицию
      y: lightY, // Используем смещенную позицию
      direction: this.isDirectional ? this.direction : null,
      coneAngle: this.isDirectional ? this.coneAngle : null,
      isDirectional: this.isDirectional
    };
  }
  
  // Отрисовка направленного света
  render(ctx, cameraX, cameraY) {
    if (!this.active) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Рисуем направленный свет
    if (this.isDirectional) {
      this.renderDirectionalLight(ctx, screenX, screenY);
    } else {
      // Рисуем круговой свет без вызова super.render()
      this.renderCircularLight(ctx, screenX, screenY);
    }
  }
  
  // Отрисовка кругового света (когда игрок стоит на месте)
  renderCircularLight(ctx, x, y) {
    ctx.save();
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.radius * TILE_SIZE);
    
    // Проверяем, что intensity не NaN
    const safeIntensity = isNaN(this.intensity) ? 0.35 : this.intensity;
    
    // Очень мягкие границы для кругового света как у факела
    gradient.addColorStop(0, `rgba(255, 153, 51, ${safeIntensity * 0.7})`);
    gradient.addColorStop(0.1, `rgba(255, 153, 51, ${safeIntensity * 0.6})`);
    gradient.addColorStop(0.2, `rgba(255, 153, 51, ${safeIntensity * 0.5})`);
    gradient.addColorStop(0.3, `rgba(255, 153, 51, ${safeIntensity * 0.4})`);
    gradient.addColorStop(0.4, `rgba(255, 153, 51, ${safeIntensity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(255, 153, 51, ${safeIntensity * 0.2})`);
    gradient.addColorStop(0.6, `rgba(255, 153, 51, ${safeIntensity * 0.12})`);
    gradient.addColorStop(0.7, `rgba(255, 153, 51, ${safeIntensity * 0.06})`);
    gradient.addColorStop(0.8, `rgba(255, 153, 51, ${safeIntensity * 0.03})`);
    gradient.addColorStop(0.85, `rgba(255, 153, 51, ${safeIntensity * 0.015})`);
    gradient.addColorStop(0.9, `rgba(255, 153, 51, ${safeIntensity * 0.008})`);
    gradient.addColorStop(0.95, `rgba(255, 153, 51, ${safeIntensity * 0.003})`);
    gradient.addColorStop(0.98, `rgba(255, 153, 51, ${safeIntensity * 0.001})`);
    gradient.addColorStop(1, 'rgba(255, 153, 51, 0)');
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(x - this.radius * TILE_SIZE, y - this.radius * TILE_SIZE, 
                 this.radius * TILE_SIZE * 2, this.radius * TILE_SIZE * 2);
    
    ctx.restore();
  }
  
  // Отрисовка направленного света (конус)
  renderDirectionalLight(ctx, x, y) {
    ctx.save();
    
    // Вычисляем угол направления правильно для всех направлений
    let angle;
    if (this.direction.x === 0 && this.direction.y === 0) {
      angle = 0; // По умолчанию вправо
    } else {
      // Правильный расчет угла для всех направлений
      angle = Math.atan2(this.direction.y, this.direction.x);
    }
    
    // Создаем направленный градиент - начинаем не от центра персонажа
    const offsetDistance = 20; // Отступ от персонажа
    const startX = x + Math.cos(angle) * offsetDistance;
    const startY = y + Math.sin(angle) * offsetDistance;
    
    // Создаем несколько конусов с разными радиусами для мягких боковых границ
    const numCones = 8; // Количество конусов для создания мягких границ
    const maxRadius = this.radius * TILE_SIZE;
    
    for (let i = 0; i < numCones; i++) {
      const coneRadius = maxRadius * (1 - i / numCones);
      const coneIntensity = (1 - i / numCones) * (1 - i / numCones); // Квадратичное затухание
      
      const gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, coneRadius);
      
      // Проверяем, что intensity не NaN
      const safeIntensity = isNaN(this.intensity) ? 0.35 : this.intensity;
      const alpha = safeIntensity * coneIntensity;
      
      // Мягкие границы для каждого конуса
      gradient.addColorStop(0, `rgba(255, 153, 51, ${alpha * 0.8})`);
      gradient.addColorStop(0.3, `rgba(255, 153, 51, ${alpha * 0.4})`);
      gradient.addColorStop(0.6, `rgba(255, 153, 51, ${alpha * 0.1})`);
      gradient.addColorStop(0.8, `rgba(255, 153, 51, ${alpha * 0.02})`);
      gradient.addColorStop(1, 'rgba(255, 153, 51, 0)');
      
      ctx.fillStyle = gradient;
      
      // Рисуем конус с уменьшающимся углом для мягких боковых границ
      const angleReduction = (i / numCones) * 0.3; // Уменьшаем угол на 30% к краям
      const currentConeAngle = this.coneAngle * (1 - angleReduction);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      const startAngle = angle - currentConeAngle / 2;
      const endAngle = angle + currentConeAngle / 2;
      
      // Рисуем дугу конуса
      ctx.arc(startX, startY, coneRadius, startAngle, endAngle);
      
      // Закрываем конус линиями к центру
      ctx.lineTo(startX, startY);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Получение интенсивности света в точке с учетом направления и препятствий
  getLightIntensityAt(x, y, map) {
    if (!this.active) return 0;
    
    // Вычисляем смещенную позицию источника света
    let angle;
    if (this.direction.x === 0 && this.direction.y === 0) {
      angle = 0; // По умолчанию вправо
    } else {
      angle = Math.atan2(this.direction.y, this.direction.x);
    }
    const offsetDistance = 20; // Отступ от персонажа
    const lightX = this.x + Math.cos(angle) * offsetDistance;
    const lightY = this.y + Math.sin(angle) * offsetDistance;
    
    const distance = Math.hypot(x - lightX, y - lightY);
    if (distance > this.radius * TILE_SIZE) return 0;
    
    // Базовая интенсивность по расстоянию
    let intensity = (1 - distance / (this.radius * TILE_SIZE)) * this.intensity;
    
    // Если свет направленный, проверяем угол
    if (this.isDirectional) {
      // Вычисляем угол от смещенного источника света к точке
      const angleToPoint = Math.atan2(y - lightY, x - lightX);
      let lightAngle;
      if (this.direction.x === 0 && this.direction.y === 0) {
        lightAngle = 0; // По умолчанию вправо
      } else {
        lightAngle = Math.atan2(this.direction.y, this.direction.x);
      }
      
      // Вычисляем разность углов
      let angleDiff = Math.abs(angleToPoint - lightAngle);
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      // Если точка вне конуса света, значительно уменьшаем интенсивность
      if (angleDiff > this.coneAngle / 2) {
        intensity *= 0.05; // Очень слабое освещение вне конуса
      }
    }
    
    // Проверяем препятствия (стены) - полная блокировка
    if (map) {
      const blocked = this.checkLineOfSight(x, y, map);
      if (blocked) {
        intensity = 0; // Полная блокировка света за препятствиями
      }
    }
    
    return Math.max(0, intensity);
  }
  
  // Проверка линии видимости до точки
  checkLineOfSight(targetX, targetY, map) {
    const startX = Math.floor(this.x / TILE_SIZE);
    const startY = Math.floor(this.y / TILE_SIZE);
    const endX = Math.floor(targetX / TILE_SIZE);
    const endY = Math.floor(targetY / TILE_SIZE);
    
    // Проверяем границы карты
    if (startX < 0 || startX >= map[0].length || 
        startY < 0 || startY >= map.length ||
        endX < 0 || endX >= map[0].length || 
        endY < 0 || endY >= map.length) {
      return true; // За пределами карты считаем препятствием
    }
    
    // Используем алгоритм Брезенхэма для проверки линии
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    let err = dx - dy;
    
    let x = startX;
    let y = startY;
    
    // Проверяем начальную точку
    if (map[y] && map[y][x] === 1) {
      return true; // Начальная точка в стене
    }
    
    while (x !== endX || y !== endY) {
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
      if (map[y] && map[y][x] === 1) {
        return true; // Препятствие найдено
      }
    }
    
    return false; // Препятствий нет
  }
}
