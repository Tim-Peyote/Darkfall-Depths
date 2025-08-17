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
    this.inventory = [];
    this.maxSlots = 6; // Максимум 6 слотов в сундуке
    
    // Генерируем содержимое сундука
    this.generateContents();
  }
  
  generateContents() {
    // Шанс пустого сундука (20%)
    if (Math.random() < 0.2) {
      return;
    }
    
    // Количество предметов (1-4, редко 5-6)
    const itemCount = Math.random() < 0.7 ? 
      Math.floor(Math.random() * 3) + 1 : 
      Math.floor(Math.random() * 2) + 4;
    
    for (let i = 0; i < itemCount && this.inventory.length < this.maxSlots; i++) {
      const item = generateRandomItem(this.level, gameState.player?.class);
      if (item) {
        this.inventory.push(item);
      }
    }
  }
  
  update(dt) {
    super.update(dt);
    
    // Проверяем взаимодействие с игроком
    if (gameState.player && this.inventory.length > 0) {
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
    // Проверяем, что это ближайший сундук к игроку
    if (!gameState.player || !gameState.entities) return;
    
    let nearestChest = null;
    let minDistance = Infinity;
    
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Chest' && entity.inventory.length > 0) {
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
          hint.innerHTML = '<div class="hint-content"><span class="hint-text">Нажмите чтобы открыть сундук</span></div>';
        } else {
          // Десктопная подсказка
          hint.innerHTML = '<div class="hint-content"><span class="hint-key">E</span><span class="hint-text">Открыть сундук</span></div>';
        }
        
        hint.classList.remove('hidden');
        hint.classList.add('active');
        
        // Отладочная информация для мобильных
        if (IS_MOBILE) {
          console.log('Показываем мобильную подсказку для сундука');
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
    if (this.inventory.length > 0) {
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
    
    const item = this.inventory.splice(itemIndex, 1)[0];
    
    // НЕ помечаем сундук как открытый - позволяем открывать повторно
    // if (this.inventory.length === 0) {
    //   this.isOpened = true;
    // }
    
    return item;
  }
  
  isEmpty() {
    return this.inventory.length === 0;
  }
}
