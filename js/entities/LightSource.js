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
    
    // Рисуем стилизованный спрайт
    this.renderCustomSprite(ctx, screenX, screenY);
    
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
  
  renderCustomSprite(ctx, x, y) {
    ctx.save();
    ctx.globalAlpha = 0.8 + this.pulsePhase * 0.2;
    
    switch (this.lightType) {
      case 'TORCH':
        this.renderTorch(ctx, x, y);
        break;
      case 'MAGIC_ORB':
        this.renderMagicOrb(ctx, x, y);
        break;
      case 'CRYSTAL':
        this.renderCrystal(ctx, x, y);
        break;
      case 'FIRE':
        this.renderFire(ctx, x, y);
        break;
      default:
        // Fallback на эмодзи для неизвестных типов
        ctx.font = `${TILE_SIZE * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getDisplaySprite(), x, y);
    }
    
    ctx.restore();
  }
  
  renderTorch(ctx, x, y) {
    const size = TILE_SIZE * 0.6;
    
    // Деревянная рукоять факела
    ctx.fillStyle = '#8B4513'; // Коричневый
    ctx.fillRect(x - size * 0.1, y - size * 0.3, size * 0.2, size * 0.6);
    
    // Металлическое крепление
    ctx.fillStyle = '#696969'; // Темно-серый
    ctx.fillRect(x - size * 0.15, y - size * 0.35, size * 0.3, size * 0.1);
    
    // Огонь факела
    const flameSize = size * 0.4;
    const flameGradient = ctx.createRadialGradient(x, y - size * 0.2, 0, x, y - size * 0.2, flameSize);
    flameGradient.addColorStop(0, '#FFFF00'); // Желтый центр
    flameGradient.addColorStop(0.5, '#FF8C00'); // Оранжевый
    flameGradient.addColorStop(1, '#FF4500'); // Красный край
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, flameSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Искры с анимацией
    ctx.fillStyle = '#FFFF00';
    for (let i = 0; i < 3; i++) {
      const sparkAngle = (i / 3) * Math.PI * 2 + this.animationTime * 3;
      const sparkRadius = size * 0.3 + Math.sin(this.animationTime * 5 + i) * size * 0.1;
      const sparkX = x + Math.cos(sparkAngle) * sparkRadius;
      const sparkY = y - size * 0.3 + Math.sin(sparkAngle) * sparkRadius;
      ctx.fillRect(sparkX, sparkY, 1, 1);
    }
  }
  
  renderMagicOrb(ctx, x, y) {
    const size = TILE_SIZE * 0.5;
    
    // Внешний круг магической сферы
    const outerGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    outerGradient.addColorStop(0, '#87CEEB'); // Голубой центр
    outerGradient.addColorStop(0.7, '#4169E1'); // Синий
    outerGradient.addColorStop(1, '#000080'); // Темно-синий край
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Внутренний светящийся круг
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6);
    innerGradient.addColorStop(0, '#FFFFFF'); // Белый центр
    innerGradient.addColorStop(0.5, '#87CEEB'); // Голубой
    innerGradient.addColorStop(1, 'rgba(135, 206, 235, 0)'); // Прозрачный
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Магические частицы
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.animationTime * 2;
      const particleX = x + Math.cos(angle) * size * 0.7;
      const particleY = y + Math.sin(angle) * size * 0.7;
      ctx.fillRect(particleX, particleY, 1, 1);
    }
  }
  
  renderCrystal(ctx, x, y) {
    const size = TILE_SIZE * 0.4;
    
    // Основная форма кристалла
    ctx.fillStyle = '#9370DB'; // Фиолетовый
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.5, y - size * 0.3);
    ctx.lineTo(x + size * 0.3, y + size * 0.3);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.lineTo(x - size * 0.5, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Грани кристалла
    ctx.strokeStyle = '#8A2BE2'; // Темно-фиолетовый
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.3, y + size * 0.3);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.stroke();
    
    // Светящийся центр
    const centerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.3);
    centerGradient.addColorStop(0, '#FFFFFF'); // Белый центр
    centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Прозрачный
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  renderFire(ctx, x, y) {
    const size = TILE_SIZE * 0.5;
    
    // Основание огня
    ctx.fillStyle = '#8B4513'; // Коричневый
    ctx.fillRect(x - size * 0.2, y + size * 0.1, size * 0.4, size * 0.2);
    
    // Основное пламя
    const flameGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.6);
    flameGradient.addColorStop(0, '#FFFF00'); // Желтый центр
    flameGradient.addColorStop(0.3, '#FF8C00'); // Оранжевый
    flameGradient.addColorStop(0.7, '#FF4500'); // Красный
    flameGradient.addColorStop(1, '#8B0000'); // Темно-красный
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Языки пламени с анимацией
    ctx.fillStyle = '#FF4500';
    for (let i = 0; i < 3; i++) {
      const flameX = x + (i - 1) * size * 0.2;
      const flameY = y - size * 0.3 + Math.sin(this.animationTime * 4 + i) * size * 0.05;
      const flameSize = size * 0.15 + Math.sin(this.animationTime * 3 + i) * size * 0.05;
      ctx.beginPath();
      ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
      ctx.fill();
    }
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
