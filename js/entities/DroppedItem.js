/* Darkfall Depths - Класс предметов */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';

export class DroppedItem extends Entity {
  constructor(x, y, itemData) {
    super(x, y);
    this.itemData = itemData;
    this.radius = 10;
    this.bobTime = 0;
  }
  
  update(dt) {
    this.bobTime += dt * 3;
    
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
    const offsetY = Math.sin(this.bobTime) * 4;
    
    ctx.fillStyle = this.itemData.color;
    ctx.beginPath();
    ctx.arc(
      this.x - gameState.camera.x,
      this.y - gameState.camera.y + offsetY,
      this.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Эффект свечения для редких предметов
    if (this.itemData.rarity === 'rare') {
      ctx.shadowColor = this.itemData.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
} 