/* Darkfall Depths - Класс предметов */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';

export class DroppedItem extends Entity {
  constructor(x, y, itemData) {
    super(x, y);
    this.itemData = itemData;
    this.radius = 16; // Увеличили размер для лучшей видимости
    this.bobTime = 0;
    this.pulseTime = 0;
    this.sparkleTime = 0;
  }
  
  update(dt) {
    this.bobTime += dt * 3;
    this.pulseTime += dt * 4;
    this.sparkleTime += dt * 6;
    
    // Проверка подбора игроком
    if (gameState.player && Utils.distance(this, gameState.player) < 25) {
      this.pickup();
    }
  }
  
  pickup() {
    // Добавляем в инвентарь
    for (let i = 0; i < gameState.inventory.backpack.length; i++) {
      if (!gameState.inventory.backpack[i]) {
        gameState.inventory.backpack[i] = this.itemData;
        this.isDead = true;
        
        // Воспроизводим звук подбора предмета (для всех предметов одинаковый)
        audioManager.playItemPickup();
        
        return;
      }
    }
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    const offsetY = Math.sin(this.bobTime) * 4;
    
    // Рисуем стилизованный предмет
    this.renderCustomItem(ctx, screenX, screenY + offsetY);
  }
  
  renderCustomItem(ctx, x, y) {
    ctx.save();
    
    // Анимация вращения для некоторых предметов
    const rotation = this.bobTime * 0.5;
    
    // Пульсирующее свечение для всех предметов
    const pulseGlow = Math.sin(this.pulseTime) * 0.3 + 0.7;
    const glowSize = this.radius * (1.2 + pulseGlow * 0.3);
    
    // Фоновое свечение
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    gradient.addColorStop(0, `${this.itemData.color}40`);
    gradient.addColorStop(0.7, `${this.itemData.color}20`);
    gradient.addColorStop(1, `${this.itemData.color}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной предмет
    switch (this.itemData.type) {
      case 'weapon':
        this.renderWeapon(ctx, x, y, rotation);
        break;
      case 'armor':
        this.renderArmor(ctx, x, y, rotation);
        break;
      case 'accessory':
        this.renderAccessory(ctx, x, y, rotation);
        break;
      case 'consumable':
        this.renderConsumable(ctx, x, y, rotation);
        break;
      default:
        // Fallback на стилизованный предмет с информацией
        // console.log('Unknown item type:', this.itemData.type, this.itemData.base, this.itemData);
        
        // Стилизованный предмет - кристалл
        ctx.fillStyle = this.itemData.color;
        ctx.beginPath();
        ctx.moveTo(x, y - this.radius * 0.6);
        ctx.lineTo(x + this.radius * 0.4, y - this.radius * 0.2);
        ctx.lineTo(x + this.radius * 0.4, y + this.radius * 0.2);
        ctx.lineTo(x, y + this.radius * 0.6);
        ctx.lineTo(x - this.radius * 0.4, y + this.radius * 0.2);
        ctx.lineTo(x - this.radius * 0.4, y - this.radius * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = this.itemData.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Блеск
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - this.radius * 0.15, y - this.radius * 0.15, this.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Анимированные искры
    this.renderSparkles(ctx, x, y);
    
    // Усиленное свечение для редких предметов
    if (this.itemData.rarity === 'rare') {
      ctx.shadowColor = this.itemData.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.itemData.color;
      ctx.beginPath();
      ctx.arc(x, y, this.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }
  
  renderSparkles(ctx, x, y) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.sparkleTime;
      const sparkleX = x + Math.cos(angle) * this.radius * 0.8;
      const sparkleY = y + Math.sin(angle) * this.radius * 0.8;
      const sparkleSize = Math.sin(this.sparkleTime * 2 + i) * 0.5 + 1;
      
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.scale(sparkleSize, sparkleSize);
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }
  
  renderWeapon(ctx, x, y, rotation) {
    const size = this.radius * 1.2; // Увеличили размер
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (this.itemData.base) {
             case 'sword':
         // Меч - металлический блеск
         ctx.strokeStyle = '#ffffff';
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.moveTo(-size * 0.3, -size * 0.4);
         ctx.lineTo(size * 0.3, size * 0.4);
         ctx.stroke();
         
         // Дополнительная линия для объема
         ctx.strokeStyle = '#95a5a6';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(-size * 0.25, -size * 0.35);
         ctx.lineTo(size * 0.25, size * 0.35);
         ctx.stroke();
         
         // Рукоять
         ctx.fillStyle = '#8b4513';
         ctx.fillRect(-size * 0.12, -size * 0.12, size * 0.24, size * 0.24);
         
         // Детали рукояти
         ctx.strokeStyle = '#654321';
         ctx.lineWidth = 1;
         ctx.strokeRect(-size * 0.12, -size * 0.12, size * 0.24, size * 0.24);
         break;
        
             case 'axe':
         // Топор - металлический блеск
         ctx.fillStyle = '#ffffff';
         ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Обводка топора
         ctx.strokeStyle = '#95a5a6';
         ctx.lineWidth = 2;
         ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Рукоять
         ctx.fillStyle = '#8b4513';
         ctx.fillRect(-size * 0.08, -size * 0.15, size * 0.16, size * 0.3);
         
         // Детали рукояти
         ctx.strokeStyle = '#654321';
         ctx.lineWidth = 1;
         ctx.strokeRect(-size * 0.08, -size * 0.15, size * 0.16, size * 0.3);
         break;
        
      case 'staff':
        // Посох
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, -size * 0.4);
        ctx.lineTo(size * 0.2, size * 0.4);
        ctx.stroke();
        
        // Кристалл
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(0, -size * 0.4, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'wand':
        // Жезл
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-size * 0.15, -size * 0.3);
        ctx.lineTo(size * 0.15, size * 0.3);
        ctx.stroke();
        
        // Звезда
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(0, -size * 0.3, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'dagger':
        // Кинжал
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, -size * 0.3);
        ctx.lineTo(size * 0.2, size * 0.3);
        ctx.stroke();
        
        // Рукоять
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.05, -size * 0.05, size * 0.1, size * 0.1);
        break;
        
      case 'crossbow':
        // Арбалет
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Стрела
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, 0);
        ctx.lineTo(size * 0.2, 0);
        ctx.stroke();
        break;
      default:
        // Fallback для неизвестного оружия
        // console.log('Unknown weapon base:', this.itemData.base);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        break;
    }
    
    ctx.restore();
  }
  
  renderArmor(ctx, x, y, rotation) {
    const size = this.radius * 1.2; // Увеличили размер
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (this.itemData.base) {
      case 'shield':
        // Щит
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.3, -size * 0.4, size * 0.6, size * 0.8);
        
        // Металлическая окантовка
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size * 0.3, -size * 0.4, size * 0.6, size * 0.8);
        break;
        
      case 'robe':
        // Мантия
        ctx.fillStyle = '#6c3483';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Капюшон
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(0, -size * 0.2, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'leather':
        // Кожаная броня
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Застежки
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.1, -size * 0.2, size * 0.2, size * 0.1);
        break;
      default:
        // Fallback для неизвестной брони
        // console.log('Unknown armor base:', this.itemData.base);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        break;
    }
    
    ctx.restore();
  }
  
  renderAccessory(ctx, x, y, rotation) {
    const size = this.radius * 1.0; // Увеличили размер
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (this.itemData.base) {
      case 'amulet':
        // Амулет - подвеска с камнем
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        
        // Цепочка
        ctx.beginPath();
        ctx.arc(0, -size * 0.2, size * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Подвеска
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка подвески
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Камень (цвет зависит от редкости)
        let amuletGemColor = '#f39c12'; // оранжевый по умолчанию
        if (this.itemData.rarity === 'rare') amuletGemColor = '#3498db'; // синий
        if (this.itemData.rarity === 'epic') amuletGemColor = '#9b59b6'; // фиолетовый
        if (this.itemData.rarity === 'legendary') amuletGemColor = '#e74c3c'; // красный
        
        ctx.fillStyle = amuletGemColor;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Блеск камня
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size * 0.06, -size * 0.06, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'ring':
        // Кольцо - металлическое с камнем
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Внутренняя часть кольца
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Камень (цвет зависит от редкости)
        let gemColor = '#e67e22'; // оранжевый по умолчанию
        if (this.itemData.rarity === 'rare') gemColor = '#3498db'; // синий
        if (this.itemData.rarity === 'epic') gemColor = '#9b59b6'; // фиолетовый
        if (this.itemData.rarity === 'legendary') gemColor = '#e74c3c'; // красный
        
        ctx.fillStyle = gemColor;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Блеск камня
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size * 0.05, -size * 0.05, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        // Fallback для неизвестного аксессуара - стилизованный кристалл
        // console.log('Unknown accessory base:', this.itemData.base);
        
        // Кристалл
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(size * 0.2, -size * 0.1);
        ctx.lineTo(size * 0.2, size * 0.1);
        ctx.lineTo(0, size * 0.3);
        ctx.lineTo(-size * 0.2, size * 0.1);
        ctx.lineTo(-size * 0.2, -size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Обводка кристалла
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Блеск
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size * 0.08, -size * 0.08, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  renderConsumable(ctx, x, y, rotation) {
    const size = this.radius * 1.1; // Увеличили размер
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (this.itemData.base) {
             case 'potion':
         // Зелье здоровья - яркое
         ctx.fillStyle = '#ff4444';
         ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Обводка зелья
         ctx.strokeStyle = '#cc3333';
         ctx.lineWidth = 2;
         ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Горлышко
         ctx.fillStyle = '#8b4513';
         ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
         
         // Анимированные пузырьки
         ctx.fillStyle = '#ffffff';
         for (let i = 0; i < 3; i++) {
           const bubbleX = -size * 0.15 + (i * size * 0.15);
           const bubbleY = -size * 0.2 + Math.sin(this.sparkleTime + i) * size * 0.1;
           const bubbleSize = size * 0.04 + Math.sin(this.sparkleTime * 2 + i) * size * 0.02;
           ctx.beginPath();
           ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
           ctx.fill();
         }
         break;
        
             case 'speed_potion':
         // Зелье скорости - яркое
         ctx.fillStyle = '#44aaff';
         ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Обводка зелья
         ctx.strokeStyle = '#3388cc';
         ctx.lineWidth = 2;
         ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Горлышко
         ctx.fillStyle = '#8b4513';
         ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
         
         // Анимированные искры скорости
         ctx.fillStyle = '#ffffff';
         for (let i = 0; i < 2; i++) {
           const sparkX = -size * 0.1 + (i * size * 0.2);
           const sparkY = Math.sin(this.sparkleTime * 3 + i) * size * 0.15;
           ctx.fillRect(sparkX, sparkY, 2, 2);
         }
         break;
        
      case 'strength_potion':
        // Зелье силы
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(-size * 0.2, -size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.1, -size * 0.4, size * 0.2, size * 0.1);
        break;
        
      case 'defense_potion':
        // Зелье защиты
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-size * 0.2, -size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.1, -size * 0.4, size * 0.2, size * 0.1);
        break;
        
      case 'regen_potion':
        // Зелье регенерации
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(-size * 0.2, -size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.1, -size * 0.4, size * 0.2, size * 0.1);
        break;
        
             case 'combo_potion':
         // Комплексное зелье - анимированный градиент
         const gradient = ctx.createLinearGradient(-size * 0.25, -size * 0.35, size * 0.25, size * 0.35);
         gradient.addColorStop(0, '#9b59b6');
         gradient.addColorStop(0.3, '#e74c3c');
         gradient.addColorStop(0.7, '#3498db');
         gradient.addColorStop(1, '#27ae60');
         ctx.fillStyle = gradient;
         ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Обводка зелья
         ctx.strokeStyle = '#ffffff';
         ctx.lineWidth = 2;
         ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
         
         // Горлышко
         ctx.fillStyle = '#8b4513';
         ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
         
         // Анимированные частицы
         ctx.fillStyle = '#ffffff';
         for (let i = 0; i < 4; i++) {
           const particleX = Math.cos(this.sparkleTime + i) * size * 0.15;
           const particleY = Math.sin(this.sparkleTime * 2 + i) * size * 0.15;
           const particleSize = Math.sin(this.sparkleTime * 3 + i) * 0.5 + 1;
           ctx.save();
           ctx.translate(particleX, particleY);
           ctx.scale(particleSize, particleSize);
           ctx.fillRect(-1, -1, 2, 2);
           ctx.restore();
         }
         break;
      default:
        // Fallback для неизвестного зелья
        // console.log('Unknown consumable base:', this.itemData.base);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
        break;
    }
    
    ctx.restore();
  }
} 