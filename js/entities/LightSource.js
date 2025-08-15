/* Darkfall Depths - Светящиеся объекты */

import { Entity } from './Entity.js';
import { TILE_SIZE } from '../config/constants.js';
import { LIGHT_TYPES } from '../map/LightingSystem.js';

export class LightSource extends Entity {
  constructor(x, y, lightType = 'TORCH', permanent = true) {
    super(x, y);
    
    this.lightType = lightType;
    this.permanent = permanent; // Постоянный или временный источник
    this.lightData = LIGHT_TYPES[lightType] || LIGHT_TYPES.TORCH;
    
    // Визуальные свойства
    this.sprite = this.getSpriteForType(lightType);
    this.color = this.lightData.color;
    this.radius = this.lightData.radius;
    
    // Анимация
    this.animationTime = 0;
    this.animationSpeed = 0.05;
    this.pulsePhase = 0;
    
    // Состояние
    this.active = true;
    this.fuel = permanent ? Infinity : 100; // Топливо для временных источников
    this.fuelConsumption = 0.1; // Расход топлива в секунду
    
    // Уникальный ID для системы освещения
    this.lightId = `light_${Date.now()}_${Math.random()}`;
  }
  
  getSpriteForType(type) {
    const sprites = {
      'TORCH': '🔥',
      'MAGIC_ORB': '🌟', // Звезда для магического свечения
      'CRYSTAL': '💫', // Сверкающая звезда для кристалла
      'FIRE': '🔥',
      'PLAYER_LIGHT': '✨'
    };
    return sprites[type] || '✨';
  }
  
  getDisplaySprite() {
    // Возвращаем правильный спрайт в зависимости от типа и контекста
    if (this.lightType === 'TORCH' && this.wallSide) {
      // Факел на стене - используем символ факела
      return '🔥';
    } else if (this.lightType === 'FIRE' && this.isFireBowl) {
      // Чаша с огнем - используем символ чаши
      return '🕯️';
    } else if (this.lightType === 'TORCH' && this.isCorridorTorch) {
      // Факел в коридоре - используем символ факела
      return '🔥';
    } else if (this.lightType === 'MAGIC_ORB') {
      // Магическое свечение - используем звезду
      return '🌟';
    } else if (this.lightType === 'CRYSTAL') {
      // Кристалл - используем сверкающую звезду
      return '💫';
    } else if (this.lightType === 'MAGIC_ORB' && this.isDecorative) {
      // Декоративная магическая сфера - более яркая звезда
      return '⭐';
    } else if (this.lightType === 'CRYSTAL' && this.isDecorative) {
      // Декоративный кристалл - более яркая сверкающая звезда
      return '✨';
    } else {
      return this.sprite;
    }
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    
    if (!this.active) return;
    
    // Обновляем анимацию
    this.animationTime += deltaTime;
    this.pulsePhase = Math.sin(this.animationTime * this.animationSpeed) * 0.5 + 0.5;
    
    // Расходуем топливо для временных источников
    if (!this.permanent && this.fuel > 0) {
      this.fuel -= this.fuelConsumption * deltaTime;
      if (this.fuel <= 0) {
        this.deactivate();
      }
    }
    
    // Обновляем интенсивность света на основе топлива
    if (!this.permanent) {
      const fuelRatio = Math.max(0, this.fuel / 100);
      this.currentIntensity = this.lightData.intensity * fuelRatio;
    } else {
      this.currentIntensity = this.lightData.intensity;
    }
  }
  
  render(ctx, cameraX, cameraY) {
    if (!this.active) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Рисуем постамент для чаши с огнем
    if (this.lightType === 'FIRE' && this.isFireBowl) {
      this.renderPedestal(ctx, screenX, screenY);
    }
    
    // Рисуем крепление для факела на стене
    if (this.lightType === 'TORCH' && (this.wallSide || this.isCorridorTorch)) {
      this.renderTorchMount(ctx, screenX, screenY);
    }
    
    // Рисуем основную спрайт
    ctx.save();
    ctx.globalAlpha = 0.8 + this.pulsePhase * 0.2;
    ctx.font = `${TILE_SIZE * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.getDisplaySprite(), screenX, screenY);
    ctx.restore();
    
    // Рисуем эффект свечения
    this.renderGlow(ctx, screenX, screenY);
  }
  
  renderPedestal(ctx, x, y) {
    // Рисуем постамент для чаши с огнем
    ctx.save();
    
    // Основание постамента
    ctx.fillStyle = '#8B4513'; // Коричневый цвет камня
    ctx.fillRect(x - TILE_SIZE * 0.3, y + TILE_SIZE * 0.2, TILE_SIZE * 0.6, TILE_SIZE * 0.4);
    
    // Верхняя часть постамента
    ctx.fillStyle = '#A0522D'; // Более светлый коричневый
    ctx.fillRect(x - TILE_SIZE * 0.2, y + TILE_SIZE * 0.1, TILE_SIZE * 0.4, TILE_SIZE * 0.2);
    
    // Чаша
    ctx.fillStyle = '#CD853F'; // Золотистый цвет
    ctx.beginPath();
    ctx.arc(x, y, TILE_SIZE * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка чаши
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
  
  renderTorchMount(ctx, x, y) {
    // Рисуем крепление факела на стене
    ctx.save();
    
    // Кронштейн
    ctx.fillStyle = '#696969'; // Темно-серый металл
    ctx.fillRect(x - TILE_SIZE * 0.1, y - TILE_SIZE * 0.05, TILE_SIZE * 0.2, TILE_SIZE * 0.1);
    
    // Крепление к стене
    ctx.fillStyle = '#4A4A4A'; // Еще более темный серый
    ctx.fillRect(x - TILE_SIZE * 0.05, y - TILE_SIZE * 0.1, TILE_SIZE * 0.1, TILE_SIZE * 0.2);
    
    // Обводка
    ctx.strokeStyle = '#2F2F2F';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - TILE_SIZE * 0.1, y - TILE_SIZE * 0.05, TILE_SIZE * 0.2, TILE_SIZE * 0.1);
    ctx.strokeRect(x - TILE_SIZE * 0.05, y - TILE_SIZE * 0.1, TILE_SIZE * 0.1, TILE_SIZE * 0.2);
    
    ctx.restore();
  }
  
  renderGlow(ctx, x, y) {
    // Создаем градиент для эффекта свечения
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.radius * TILE_SIZE * 0.5);
    
    // Проверяем, что currentIntensity не NaN
    if (isNaN(this.currentIntensity)) {
      this.currentIntensity = this.lightData.intensity || 0.5;
    }
    
    const alpha = this.currentIntensity * (0.3 + this.pulsePhase * 0.2);
    const [r, g, b] = this.color;
    
    gradient.addColorStop(0, `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${alpha * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(x - this.radius * TILE_SIZE * 0.5, y - this.radius * TILE_SIZE * 0.5, 
                 this.radius * TILE_SIZE, this.radius * TILE_SIZE);
    ctx.restore();
  }
  
  // Активация источника света
  activate() {
    this.active = true;
    if (!this.permanent) {
      this.fuel = 100;
    }
  }
  
  // Деактивация источника света
  deactivate() {
    this.active = false;
  }
  
  // Добавление топлива
  addFuel(amount) {
    if (!this.permanent) {
      this.fuel = Math.min(100, this.fuel + amount);
    }
  }
  
  // Получение данных для системы освещения
  getLightData() {
    if (!this.active) return null;
    
    return {
      id: this.lightId,
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE),
      radius: this.radius,
      color: this.color,
      intensity: this.currentIntensity,
      flicker: this.lightData.flicker,
      pulse: this.lightData.pulse,
      direction: this.direction || null, // Направление для направленного света
      coneAngle: this.coneAngle || null // Угол конуса для направленного света
    };
  }
  
  // Проверка, можно ли подобрать
  canBePickedUp() {
    // Только факелы можно подбирать, магические сферы и кристаллы - декоративные элементы
    return this.lightType === 'TORCH' && !this.permanent && this.active;
  }
  
  // Подбор источника света
  pickup() {
    if (this.canBePickedUp()) {
      this.deactivate();
      return {
        type: 'light_source',
        lightType: this.lightType,
        fuel: this.fuel,
        sprite: this.sprite
      };
    }
    return null;
  }
}

// Фабрика для создания различных типов источников света
export class LightSourceFactory {
  static createTorch(x, y, permanent = false) {
    return new LightSource(x, y, 'TORCH', permanent);
  }
  
  static createMagicOrb(x, y, permanent = true) {
    return new LightSource(x, y, 'MAGIC_ORB', permanent);
  }
  
  static createCrystal(x, y, permanent = true) {
    return new LightSource(x, y, 'CRYSTAL', permanent);
  }
  
  static createFire(x, y, permanent = false) {
    return new LightSource(x, y, 'FIRE', permanent);
  }
  
  static createPlayerLight(x, y) {
    return new LightSource(x, y, 'PLAYER_LIGHT', false);
  }
  
  // Создание случайного источника света
  static createRandom(x, y, permanent = false) {
    const types = Object.keys(LIGHT_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new LightSource(x, y, randomType, permanent);
  }
}
