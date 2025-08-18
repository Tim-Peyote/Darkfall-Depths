/* Darkfall Depths - Сундук */

import { Entity } from './Entity.js';
import { gameState, ctx } from '../core/GameState.js';
import { TILE_SIZE, IS_MOBILE } from '../config/constants.js';
import { generateRandomItem } from '../config/constants.js';

export class Chest extends Entity {
  constructor(x, y, level = 1) {
    super(x, y);
    this.radius = 16;
    this.isOpened = false; // Оставляем для совместимости, но не используем
    this.isInteracting = false;
    this.level = level;
    this.inventory = new Array(12).fill(null); // 12 слотов (3x4)
    this.maxSlots = 12; // Максимум 12 слотов в сундуке
    
    // Генерируем содержимое сундука
    this.generateContents();
  }
  
  generateContents() {
    // Редкость количества предметов - больше предметов = реже
    const rarityRoll = Math.random();
    let maxItems;
    
    if (rarityRoll < 0.10) {
      maxItems = 0; // 10% - пустые сундуки
    } else if (rarityRoll < 0.40) {
      maxItems = 1; // 30% - 1 предмет
    } else if (rarityRoll < 0.65) {
      maxItems = 2; // 25% - 2 предмета
    } else if (rarityRoll < 0.80) {
      maxItems = 3; // 15% - 3 предмета
    } else if (rarityRoll < 0.90) {
      maxItems = 4; // 10% - 4 предмета
    } else if (rarityRoll < 0.95) {
      maxItems = 5; // 5% - 5 предметов
    } else {
      maxItems = Math.floor(Math.random() * 4) + 6; // 5% - 6-9 предметов
    }
    
    // Если 0 предметов - сундук пустой
    if (maxItems === 0) {
      return;
    }
    
    // Финальное количество предметов (может быть меньше maxItems)
    const itemCount = Math.floor(Math.random() * maxItems) + 1;
    
    // Размещаем предметы в случайные слоты
    const availableSlots = [];
    for (let i = 0; i < this.maxSlots; i++) {
      availableSlots.push(i);
    }
    
    for (let i = 0; i < itemCount && availableSlots.length > 0; i++) {
      const randomSlotIndex = Math.floor(Math.random() * availableSlots.length);
      const slotIndex = availableSlots.splice(randomSlotIndex, 1)[0];
      
      const item = generateRandomItem(this.level, gameState.player?.class);
      if (item) {
        this.inventory[slotIndex] = item;
      }
    }
  }
  
  update(dt) {
    super.update(dt);
    
    // Проверяем взаимодействие с игроком (можно открывать даже пустые сундуки)
    if (gameState.player) {
      const distance = Math.sqrt(
        Math.pow(this.x - gameState.player.x, 2) + 
        Math.pow(this.y - gameState.player.y, 2)
      );
      
      if (distance < this.radius + gameState.player.radius) {
        this.isInteracting = true;
        this.showInteractionHint();
      } else {
        this.isInteracting = false;
        this.hideInteractionHint();
      }
    }
  }
  
  showInteractionHint() {
    // Проверяем, что это ближайший сундук к игроку (включая пустые)
    if (!gameState.player || !gameState.entities) return;
    
    let nearestChest = null;
    let minDistance = Infinity;
    
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Chest') {
        const distance = Math.sqrt(
          Math.pow(entity.x - gameState.player.x, 2) + 
          Math.pow(entity.y - gameState.player.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestChest = entity;
        }
      }
    }
    
    // Показываем подсказку только для ближайшего сундука, если игрок не в бою
    if (nearestChest === this && !this.isPlayerInCombat()) {
      const hint = document.getElementById('interactionHint');
      if (hint && !hint.classList.contains('active')) {
        // Определяем тип устройства
        if (IS_MOBILE) {
          // Мобильная подсказка
          hint.innerHTML = '<div class="hint-content"><span class="hint-text">Тапните чтобы открыть сундук</span></div>';
        } else {
          // Десктопная подсказка
          hint.innerHTML = '<div class="hint-content"><span class="hint-key">E</span><span class="hint-text">Открыть сундук</span></div>';
        }
        
        hint.classList.remove('hidden');
        hint.classList.add('active');
        
        // Отладочная информация для мобильных
        if (IS_MOBILE) {
          // Logger.debug('Показываем мобильную подсказку для сундука');
        }
      }
    }
  }
  
  hideInteractionHint() {
    // Скрываем подсказку если игрок отошел от сундука
    const hint = document.getElementById('interactionHint');
    if (hint && hint.classList.contains('active')) {
      hint.classList.add('hidden');
      hint.classList.remove('active');
    }
  }
  
  // Статический метод для скрытия подсказки из любого места
  static hideAllInteractionHints() {
    const hint = document.getElementById('interactionHint');
    if (hint && hint.classList.contains('active')) {
      hint.classList.add('hidden');
      hint.classList.remove('active');
    }
  }
  
  isPlayerInCombat() {
    if (!gameState.player || !gameState.entities) return false;
    
    // Проверяем, есть ли враги рядом с игроком
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Enemy' && !entity.isDead) {
        const distance = Math.sqrt(
          Math.pow(entity.x - gameState.player.x, 2) + 
          Math.pow(entity.y - gameState.player.y, 2)
        );
        
        if (distance < 150) { // Радиус боя
          // Скрываем подсказку при начале боя
          this.hideInteractionHint();
          return true;
        }
      }
    }
    
    return false;
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    // Рисуем сундук в стиле игры
    ctx.save();
    
    // Основной сундук
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX - 12, screenY - 8, 24, 16);
    ctx.fillStyle = '#654321';
    ctx.fillRect(screenX - 10, screenY - 6, 20, 12);
    
    // Замок
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
    
    // Эмодзи сундука
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🗃️', screenX, screenY + 4);
    
    // Мелкий индикатор если есть предметы
    if (this.inventory.some(item => item !== null)) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(screenX + 8, screenY - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  async open() {
    // Скрываем подсказку при открытии сундука
    this.hideInteractionHint();
    
    // Скрываем все подсказки взаимодействия
    Chest.hideAllInteractionHints();
    
    // Открываем UI сундука (можно открывать даже если уже открыт)
    try {
      const { ChestManager } = await import('../ui/ChestManager.js');
      if (!ChestManager.isInitialized) {
        ChestManager.init();
        ChestManager.isInitialized = true;
      }
      await ChestManager.openChest(this);
      
      // НЕ помечаем сундук как открытый - позволяем открывать повторно
      // this.isOpened = true;
    } catch (e) {
      console.error('Ошибка при открытии сундука:', e);
    }
  }
  
  takeItem(itemIndex) {
    if (itemIndex < 0 || itemIndex >= this.inventory.length) return null;
    
    // Заменяем предмет на null вместо удаления, чтобы не сдвигать остальные
    const item = this.inventory[itemIndex];
    this.inventory[itemIndex] = null;
    
    // НЕ помечаем сундук как открытый - позволяем открывать повторно
    // if (this.inventory.length === 0) {
    //   this.isOpened = true;
    // }
    
    return item;
  }
  
  isEmpty() {
    // Проверяем, есть ли хотя бы один непустой предмет
    return !this.inventory.some(item => item !== null);
  }
}
