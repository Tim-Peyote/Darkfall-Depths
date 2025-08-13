/* Darkfall Depths - Базовый класс сущности */

import { gameState } from '../core/GameState.js';
import { TILE_SIZE, MAP_SIZE } from '../config/constants.js';

export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.isDead = false;
    this.animationTime = 0;
  }
  
  update(dt) {
    this.animationTime += dt;
  }
  
  draw() {}
  
  checkCollisionWithWalls(newX, newY) {
    if (!gameState.map) return true;
    
    const margin = this.radius;
    const points = [
      { x: newX - margin, y: newY - margin },
      { x: newX + margin, y: newY - margin },
      { x: newX - margin, y: newY + margin },
      { x: newX + margin, y: newY + margin },
      { x: newX, y: newY - margin },
      { x: newX, y: newY + margin },
      { x: newX - margin, y: newY },
      { x: newX + margin, y: newY }
    ];
    
    for (const point of points) {
      const tileX = Math.floor(point.x / TILE_SIZE);
      const tileY = Math.floor(point.y / TILE_SIZE);
      
      if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE ||
          gameState.map[tileY][tileX] === 1) {
        return true;
      }
    }
    
    return false;
  }
} 