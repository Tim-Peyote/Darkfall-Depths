/* Darkfall Depths - Система тумана войны */

import { MAP_SIZE, TILE_SIZE } from '../config/constants.js';

export class FogOfWar {
  constructor() {
    this.explored = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
    this.visible = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
  }
  
  updateVisibility(playerX, playerY, radius = 6) {
    // Очищаем видимость
    this.visible.forEach(row => row.fill(false));
    
    const centerTileX = Math.floor(playerX / TILE_SIZE);
    const centerTileY = Math.floor(playerY / TILE_SIZE);
    
    // Простой алгоритм видимости по кругу
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.hypot(dx, dy);
        if (distance <= radius) {
          const tileX = centerTileX + dx;
          const tileY = centerTileY + dy;
          
          if (tileX >= 0 && tileX < MAP_SIZE && tileY >= 0 && tileY < MAP_SIZE) {
            this.visible[tileY][tileX] = true;
            this.explored[tileY][tileX] = true;
          }
        }
      }
    }
  }
} 