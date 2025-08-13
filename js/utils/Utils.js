/* Darkfall Depths - Утилиты */

import { gameState } from '../core/GameState.js';
import { TILE_SIZE } from '../config/constants.js';

export const Utils = {
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomFloat: (min, max) => Math.random() * (max - min) + min,
  distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  angle: (a, b) => Math.atan2(b.y - a.y, b.x - a.x),
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (a, b, t) => a + (b - a) * t,
  normalize: (vector) => {
    const len = Math.hypot(vector.x, vector.y);
    return len > 0 ? { x: vector.x / len, y: vector.y / len } : { x: 0, y: 0 };
  },
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  hasLineOfSight: (x0, y0, x1, y1) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = Math.floor(x0 / TILE_SIZE), y = Math.floor(y0 / TILE_SIZE);
    const tx = Math.floor(x1 / TILE_SIZE), ty = Math.floor(y1 / TILE_SIZE);
    
    while (!(x === tx && y === ty)) {
      if (gameState.map[y] && gameState.map[y][x] === 1) return false;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
  },
  
  resetInputKeys: () => {
    Object.keys(gameState.input.keys).forEach(k => gameState.input.keys[k] = false);
  },
  
  showDeletePopup: (onConfirm) => {
    const popup = document.createElement('div');
    popup.className = 'delete-popup';
    popup.innerHTML = `
      <div class="delete-popup-content">
        <h3>Удалить предмет?</h3>
        <div class="delete-popup-buttons">
          <button class="btn btn--danger" id="confirmDelete">Да</button>
          <button class="btn btn--outline" id="cancelDelete">Нет</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    function cleanup() {
      document.body.removeChild(popup);
    }
    
    function confirmHandler() {
      cleanup();
      onConfirm();
    }
    
    async function cancelHandler() {
      cleanup();
      const { InventoryManager } = await import('../ui/InventoryManager.js');
      InventoryManager.renderInventory();
    }
    
    document.getElementById('confirmDelete').addEventListener('click', confirmHandler);
    document.getElementById('cancelDelete').addEventListener('click', cancelHandler);
  },
  
  hideAllTooltips: () => {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.removeAttribute('data-tooltip');
    });
  }
}; 