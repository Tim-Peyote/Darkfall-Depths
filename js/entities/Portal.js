/* Darkfall Depths - Класс портала */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { LevelManager } from '../game/LevelManager.js';

export class Portal extends Entity {
  constructor(x, y) {
    super(x, y);
    this.radius = 25;
  }
  
  update(dt) {
    super.update(dt);
    
    // Проверка входа игрока
    if (gameState.player && Utils.distance(this, gameState.player) < this.radius) {
      this.activate();
    }
  }
  
  activate() {
    this.isDead = true;
    LevelManager.showLevelComplete();
  }
  
  draw() {
    const pulseSize = this.radius + Math.sin(this.animationTime * 3) * 8;
    
    // Внешнее кольцо
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x - gameState.camera.x, this.y - gameState.camera.y, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Внутренний круг
    ctx.fillStyle = `rgba(155, 89, 182, ${0.3 + Math.sin(this.animationTime * 2) * 0.2})`;
    ctx.beginPath();
    ctx.arc(this.x - gameState.camera.x, this.y - gameState.camera.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Символ портала
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⬇', this.x - gameState.camera.x, this.y - gameState.camera.y + 10);
  }
} 