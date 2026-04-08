/* Darkfall Depths - Класс предметов */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';
import { BASE_ITEMS } from '../config/constants.js';

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
        this.itemData.isNew = true; // Флаг нового предмета
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
          const itemColor = this.itemData.color || '#95a5a6'; // Fallback цвет если undefined
      gradient.addColorStop(0, `${itemColor}40`);
      gradient.addColorStop(0.7, `${itemColor}20`);
      gradient.addColorStop(1, `${itemColor}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной предмет - используем новый тип предмета с fallback на base
    let itemType = this.itemData.slot || this.itemData.type;
    
    // Fallback: если тип не определен, определяем по base
    if (!itemType && this.itemData.base) {
      const baseItem = BASE_ITEMS.find(bi => bi.base === this.itemData.base);
      if (baseItem) {
        itemType = baseItem.slot || baseItem.type;
      }
    }
    
    // Дополнительная проверка: если itemType все еще не определен, используем type
    if (!itemType) {
      itemType = this.itemData.type;
    }
    
    // Специальная обработка для мантии
    if (this.itemData.base === 'robe') {
      itemType = 'armor';
    }
    
    // Отладка для свитков
    if (this.itemData.base && this.itemData.base.startsWith('scroll_')) {
              // Logger.debug('🔍 Свиток обнаружен:', this.itemData.base, 'itemType:', itemType, 'slot:', this.itemData.slot, 'type:', this.itemData.type);
    }
    

    
    switch (itemType) {
      case 'weapon':
        DroppedItem.renderWeapon(ctx, x, y, rotation, this.radius, this.itemData);
        break;
      case 'shield':
        DroppedItem.renderShield(ctx, x, y, rotation, this.radius);
        break;
      case 'armor':
        DroppedItem.renderArmor(ctx, x, y, rotation, this.radius, this.itemData);
        break;
      case 'head':
        DroppedItem.renderHead(ctx, x, y, rotation, this.radius, this.itemData);
        break;
      case 'gloves':
        DroppedItem.renderGloves(ctx, x, y, rotation, this.radius);
        break;
      case 'belt':
        DroppedItem.renderBelt(ctx, x, y, rotation, this.radius);
        break;
      case 'boots':
        DroppedItem.renderBoots(ctx, x, y, rotation, this.radius);
        break;
      case 'accessory':
        DroppedItem.renderAccessory(ctx, x, y, rotation, this.radius, this.itemData);
        break;
      case 'consumable':
        // Проверяем, является ли это свитком
        if (this.itemData.base && this.itemData.base.startsWith('scroll_')) {
          // Свитки отрисовываются через renderScroll
          DroppedItem.renderScroll(ctx, x, y, rotation, this.radius, this.itemData, this.sparkleTime);
        } else {
          // Зелья отрисовываются через renderConsumable
          DroppedItem.renderConsumable(ctx, x, y, rotation, this.radius, this.itemData, this.sparkleTime);
        }
        break;
      default:
        // Если itemType не совпадает, попробуем использовать base
        switch (this.itemData.base) {
          case 'sword':
          case 'axe':
          case 'staff':
          case 'wand':
          case 'dagger':
          case 'crossbow':
            DroppedItem.renderWeapon(ctx, x, y, rotation, this.radius, this.itemData);
            break;
          case 'shield':
            DroppedItem.renderShield(ctx, x, y, rotation, this.radius);
            break;
          case 'robe':
          case 'leather':
          case 'plate':
            DroppedItem.renderArmor(ctx, x, y, rotation, this.radius, this.itemData);
            break;
          case 'helmet':
          case 'hood':
          case 'cap':
            DroppedItem.renderHead(ctx, x, y, rotation, this.radius, this.itemData);
            break;
          case 'gloves':
            DroppedItem.renderGloves(ctx, x, y, rotation, this.radius);
            break;
          case 'belt':
            DroppedItem.renderBelt(ctx, x, y, rotation, this.radius);
            break;
          case 'boots':
            DroppedItem.renderBoots(ctx, x, y, rotation, this.radius);
            break;
          case 'amulet':
          case 'ring':
            DroppedItem.renderAccessory(ctx, x, y, rotation, this.radius, this.itemData);
            break;
          case 'potion':
          case 'speed_potion':
          case 'strength_potion':
          case 'defense_potion':
          case 'regen_potion':
          case 'combo_potion':
          case 'mystery_potion':
          case 'purification_potion':
            // Зелья всегда должны отрисовываться правильно
            DroppedItem.renderConsumable(ctx, x, y, rotation, this.radius, this.itemData, this.sparkleTime);
            break;
          // Свитки
          case 'scroll_werewolf':
          case 'scroll_stone':
          case 'scroll_fire_explosion':
          case 'scroll_ice_storm':
          case 'scroll_lightning':
          case 'scroll_earthquake':
          case 'scroll_clone':
          case 'scroll_teleport':
          case 'scroll_invisibility':
          case 'scroll_time':
          case 'scroll_curse':
          case 'scroll_chaos':
          case 'scroll_fear':
          case 'scroll_smoke':
          case 'scroll_meteor':
          case 'scroll_barrier':
          case 'scroll_rage':
          case 'scroll_invulnerability':
          case 'scroll_vampirism':
          case 'mystery_scroll':
            // Свитки отрисовываются через renderConsumable
            DroppedItem.renderConsumable(ctx, x, y, rotation, this.radius, this.itemData, this.sparkleTime);
            break;
          default:
            // Улучшенный fallback - круглая иконка с цветом предмета
            ctx.fillStyle = this.itemData.color;
            ctx.beginPath();
            ctx.arc(x, y, this.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Обводка
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Центральный символ в зависимости от типа
            ctx.fillStyle = '#ffffff';
            ctx.font = `${this.radius * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let symbol = '?';
            if (this.itemData.base) {
              // Определяем символ по base
              switch (this.itemData.base) {
                case 'sword': symbol = '\u2694'; break;
                case 'axe': symbol = '\u2620'; break;
                case 'staff': symbol = '\u2726'; break;
                case 'wand': symbol = '\u2605'; break;
                case 'dagger': symbol = '\u2020'; break;
                case 'crossbow': symbol = '\u2192'; break;
                case 'shield': symbol = '\u25C6'; break;
                case 'robe': symbol = '\u2261'; break;
                case 'leather': symbol = '\u2261'; break;
                case 'plate': symbol = '\u2261'; break;
                case 'helmet': symbol = '\u2302'; break;
                case 'hood': symbol = '\u2302'; break;
                case 'cap': symbol = '\u2302'; break;
                case 'gloves': symbol = '\u270B'; break;
                case 'belt': symbol = '\u2550'; break;
                case 'boots': symbol = '\u2229'; break;
                case 'amulet': symbol = '\u25C8'; break;
                case 'ring': symbol = '\u25CB'; break;
                case 'potion': symbol = '\u2617'; break;
                case 'speed_potion': symbol = '\u2617'; break;
                case 'strength_potion': symbol = '\u2617'; break;
                case 'defense_potion': symbol = '\u2617'; break;
                case 'regen_potion': symbol = '\u2617'; break;
                case 'combo_potion': symbol = '\u2617'; break;
                case 'mystery_potion': symbol = '?'; break;
                case 'purification_potion': symbol = '\u2617'; break;
                // Свитки
                case 'scroll_werewolf': symbol = '\u2625'; break;
                case 'scroll_stone': symbol = '\u2625'; break;
                case 'scroll_fire_explosion': symbol = '\u2625'; break;
                case 'scroll_ice_storm': symbol = '\u2625'; break;
                case 'scroll_lightning': symbol = '\u2625'; break;
                case 'scroll_earthquake': symbol = '\u2625'; break;
                case 'scroll_clone': symbol = '\u2625'; break;
                case 'scroll_teleport': symbol = '\u2625'; break;
                case 'scroll_invisibility': symbol = '\u2625'; break;
                case 'scroll_time': symbol = '\u2625'; break;
                case 'scroll_curse': symbol = '\u2625'; break;
                case 'scroll_chaos': symbol = '\u2625'; break;
                case 'scroll_fear': symbol = '\u2625'; break;
                case 'scroll_smoke': symbol = '\u2625'; break;
                case 'scroll_meteor': symbol = '\u2625'; break;
                case 'scroll_barrier': symbol = '\u2625'; break;
                case 'scroll_rage': symbol = '\u2625'; break;
                case 'scroll_invulnerability': symbol = '\u2625'; break;
                case 'scroll_vampirism': symbol = '\u2625'; break;
                case 'mystery_scroll': symbol = '?'; break;
                default: symbol = '\u25A0'; break;
              }
            }
            
            ctx.fillText(symbol, x, y);
            break;
        }
        break;
    }
    
    // Анимированные искры
    this.renderSparkles(ctx, x, y);
    
    // Усиленное свечение для редких предметов (только тень, без перекрывающего круга)
    if (this.itemData.rarity === 'rare') {
      ctx.shadowColor = this.itemData.color;
      ctx.shadowBlur = 20;
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
  
  static renderShield(ctx, x, y, rotation, radius) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Щит - круглая форма
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка щита
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Центральная эмблема
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  static renderHead(ctx, x, y, rotation, radius, itemData) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (itemData.base) {
      case 'helmet':
        // Шлем
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка шлема
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'hood':
        // Капюшон
        ctx.fillStyle = '#6c3483';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали капюшона
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'cap':
        // Кепка
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Козырек
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.1);
        break;
        
      default:
        // Fallback для неизвестного головного убора
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  static renderGloves(ctx, x, y, rotation, radius) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Перчатки - стилизованные
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Детали перчаток
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Пальцы
    for (let i = 0; i < 4; i++) {
      const angle = (i / 3) * Math.PI * 0.5 - Math.PI * 0.25;
      const fingerX = Math.cos(angle) * size * 0.25;
      const fingerY = Math.sin(angle) * size * 0.25;
      
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.arc(fingerX, fingerY, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  static renderBelt(ctx, x, y, rotation, radius) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Пояс - горизонтальная полоса
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-size * 0.4, -size * 0.1, size * 0.8, size * 0.2);
    
    // Пряжка
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-size * 0.05, -size * 0.08, size * 0.1, size * 0.16);
    
    // Детали пояса
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size * 0.4, -size * 0.1, size * 0.8, size * 0.2);
    
    ctx.restore();
  }
  
  static renderBoots(ctx, x, y, rotation, radius) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Ботинки - стилизованные
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Подошва
    ctx.fillStyle = '#654321';
    ctx.fillRect(-size * 0.3, size * 0.2, size * 0.6, size * 0.1);
    
    // Детали ботинок
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Шнурки
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = -size * 0.1 + i * size * 0.1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, y);
      ctx.lineTo(size * 0.1, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  static renderWeapon(ctx, x, y, rotation, radius, itemData) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (itemData.base) {
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
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        break;
    }
    
    ctx.restore();
  }
  
  static renderArmor(ctx, x, y, rotation, radius, itemData) {
    const size = radius * 1.2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (itemData.base) {
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
        
      case 'plate':
        // Пластинчатая броня
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Пластины
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const y = -size * 0.2 + i * size * 0.2;
          ctx.beginPath();
          ctx.arc(0, y, size * 0.15, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        
      default:
        // Fallback для неизвестной брони
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        break;
    }
    
    ctx.restore();
  }
  
  static renderAccessory(ctx, x, y, rotation, radius, itemData) {
    const size = radius * 1.0;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (itemData.base) {
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
        if (itemData.rarity === 'rare') amuletGemColor = '#3498db'; // синий
        if (itemData.rarity === 'epic') amuletGemColor = '#9b59b6'; // фиолетовый
        if (itemData.rarity === 'legendary') amuletGemColor = '#e74c3c'; // красный
        
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
        // Кольцо
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Камень кольца
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      default:
        // Fallback для неизвестного аксессуара
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  static renderConsumable(ctx, x, y, rotation, radius, itemData, sparkleTime) {
    const size = radius * 1.1;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (itemData.base) {
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
          const bubbleY = -size * 0.2 + Math.sin(sparkleTime + i) * size * 0.1;
          const bubbleSize = size * 0.04 + Math.sin(sparkleTime * 2 + i) * size * 0.02;
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
          const sparkY = Math.sin(sparkleTime * 3 + i) * size * 0.15;
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
          const particleX = Math.cos(sparkleTime + i) * size * 0.15;
          const particleY = Math.sin(sparkleTime * 2 + i) * size * 0.15;
          const particleSize = Math.sin(sparkleTime * 3 + i) * 0.5 + 1;
          ctx.save();
          ctx.translate(particleX, particleY);
          ctx.scale(particleSize, particleSize);
          ctx.fillRect(-1, -1, 2, 2);
          ctx.restore();
        }
        break;
        
      case 'purification_potion':
        // Зелье очищения - золотое с эффектом очищения
        // Основная бутылка
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 3;
        ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
        
        // Эффект очищения - анимированные звездочки
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
          const starX = -size * 0.2 + (i * size * 0.1);
          const starY = -size * 0.2 + (i * size * 0.05) + Math.sin(sparkleTime + i) * size * 0.05;
          const starSize = size * 0.03 + Math.sin(sparkleTime * 2 + i) * size * 0.01;
          
          // Рисуем звездочку
          ctx.beginPath();
          ctx.moveTo(starX, starY - starSize);
          ctx.lineTo(starX + starSize * 0.3, starY - starSize * 0.3);
          ctx.lineTo(starX + starSize, starY);
          ctx.lineTo(starX + starSize * 0.3, starY + starSize * 0.3);
          ctx.lineTo(starX, starY + starSize);
          ctx.lineTo(starX - starSize * 0.3, starY + starSize * 0.3);
          ctx.lineTo(starX - starSize, starY);
          ctx.lineTo(starX - starSize * 0.3, starY - starSize * 0.3);
          ctx.closePath();
          ctx.fill();
        }
        
        // Дополнительный эффект - анимированное сияние
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6 + Math.sin(sparkleTime * 2) * 0.3;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, size * (0.3 + i * 0.1 + Math.sin(sparkleTime + i) * 0.05), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        break;
        
      case 'mystery_potion':
        // Тайная банка - загадочная с анимированными эффектами
        // Основная бутылка с градиентом
        const mysteryGradient = ctx.createLinearGradient(-size * 0.25, -size * 0.35, size * 0.25, size * 0.35);
        mysteryGradient.addColorStop(0, '#8e44ad');
        mysteryGradient.addColorStop(0.3, '#9b59b6');
        mysteryGradient.addColorStop(0.7, '#6c3483');
        mysteryGradient.addColorStop(1, '#4a235a');
        ctx.fillStyle = mysteryGradient;
        ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
        
        // Загадочные символы внутри с анимацией
        break;
        
      // Свитки
      case 'scroll_werewolf':
      case 'scroll_stone':
      case 'scroll_fire_explosion':
      case 'scroll_ice_storm':
      case 'scroll_lightning':
      case 'scroll_earthquake':
      case 'scroll_clone':
      case 'scroll_teleport':
      case 'scroll_invisibility':
      case 'scroll_time':
      case 'scroll_curse':
      case 'scroll_chaos':
      case 'scroll_fear':
      case 'scroll_smoke':
      case 'scroll_meteor':
      case 'scroll_barrier':
      case 'scroll_rage':
      case 'scroll_invulnerability':
      case 'scroll_vampirism':
      case 'mystery_scroll':
        // Свитки отрисовываются через renderScroll
        // Logger.debug('🎯 Рендерим свиток:', itemData.base, 'в позиции:', x, y);
        DroppedItem.renderScroll(ctx, x, y, rotation, radius, itemData, sparkleTime);
        break;
        

        
      default:
        // Fallback для неизвестного зелья
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-size * 0.25, -size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-size * 0.12, -size * 0.45, size * 0.24, size * 0.1);
        break;
    }
    
    ctx.restore();
  }
  
  static renderScroll(ctx, x, y, rotation, radius, itemData, sparkleTime) {
    const size = radius * 1.1; // Уменьшили размер до нормального
    
    // Logger.debug('📜 renderScroll вызван для:', itemData.base, 'размер:', size, 'радиус:', radius, 'координаты:', x, y);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Основной свиток - пергамент
    ctx.fillStyle = '#f5f5dc'; // Бежевый цвет
    ctx.fillRect(-size * 0.4, -size * 0.25, size * 0.8, size * 0.5);
    
    // Обводка свитка
    ctx.strokeStyle = '#8b4513'; // Коричневая обводка
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.4, -size * 0.25, size * 0.8, size * 0.5);
    
    // Внутренние линии пергамента
    ctx.strokeStyle = '#d2b48c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const lineY = -size * 0.15 + (i * size * 0.1);
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, lineY);
      ctx.lineTo(size * 0.3, lineY);
      ctx.stroke();
    }
    
    // Магические символы в зависимости от типа свитка
    ctx.fillStyle = itemData.color || '#8e44ad';
    ctx.font = `${size * 0.15}px Arial`; // Уменьшили размер шрифта
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let symbol = '\u2625';
    switch (itemData.base) {
      case 'scroll_werewolf': symbol = '\u2625'; break;
      case 'scroll_stone': symbol = '\u2625'; break;
      case 'scroll_fire_explosion': symbol = '\u2625'; break;
      case 'scroll_ice_storm': symbol = '\u2625'; break;
      case 'scroll_lightning': symbol = '\u2625'; break;
      case 'scroll_earthquake': symbol = '\u2625'; break;
      case 'scroll_clone': symbol = '\u2625'; break;
      case 'scroll_teleport': symbol = '\u2625'; break;
      case 'scroll_invisibility': symbol = '\u2625'; break;
      case 'scroll_time': symbol = '\u2625'; break;
      case 'scroll_curse': symbol = '\u2625'; break;
      case 'scroll_chaos': symbol = '\u2625'; break;
      case 'scroll_fear': symbol = '\u2625'; break;
      case 'scroll_smoke': symbol = '\u2625'; break;
      case 'scroll_meteor': symbol = '\u2625'; break;
      case 'scroll_barrier': symbol = '\u2625'; break;
      case 'scroll_rage': symbol = '\u2625'; break;
      case 'scroll_invulnerability': symbol = '\u2625'; break;
      case 'scroll_vampirism': symbol = '\u2625'; break;
      case 'mystery_scroll': symbol = '?'; break;
    }
    
    // Символ в центре
    ctx.fillText(symbol, 0, 0);
    
    // Магические частицы вокруг свитка
    ctx.fillStyle = itemData.color || '#8e44ad';
    ctx.globalAlpha = 0.6 + Math.sin(sparkleTime * 3) * 0.4;
    for (let i = 0; i < 4; i++) { // Уменьшили количество частиц
      const angle = (i / 4) * Math.PI * 2 + sparkleTime;
      const particleX = Math.cos(angle) * size * 0.4;
      const particleY = Math.sin(angle) * size * 0.4;
      const particleSize = Math.sin(sparkleTime * 4 + i) * 0.5 + 1; // Уменьшили размер частиц
      
      ctx.fillRect(particleX - particleSize, particleY - particleSize, particleSize * 2, particleSize * 2);
    }
    ctx.globalAlpha = 1.0;
    
    ctx.restore();
  }
}