/* Darkfall Depths - Управление сундуками */

import { gameState } from '../core/GameState.js';

export class ChestManager {
  static currentChest = null;
  static isOpen = false;
  
  static init() {
    this.createChestUI();
    this.setupEventListeners();
  }
  
  static createChestUI() {
    // Создаем HTML для сундука
    const chestHTML = `
      <div id="chestOverlay" class="chest-overlay hidden">
        <div class="chest-modal">
          <div class="chest-header">
            <h3>Сундук</h3>
            <button id="closeChest" class="close-btn">✕</button>
          </div>
          <div class="chest-content">
            <div class="chest-inventory">
              <div class="chest-slots">
                <!-- Слоты будут созданы динамически -->
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
    
    // Добавляем в body если еще не существует
    if (!document.getElementById('chestOverlay')) {
      document.body.insertAdjacentHTML('beforeend', chestHTML);
    }
    
    // Добавляем CSS стили
    this.addChestStyles();
  }
  
  static addChestStyles() {
    if (document.getElementById('chest-styles')) return;
    
    const styles = `
      <style id="chest-styles">
        .chest-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        
        .chest-modal {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border: 2px solid #8B4513;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
          min-width: 400px;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
        }
        
        .chest-header {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
          color: #fff;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #654321;
        }
        
        .chest-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        .close-btn {
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: #c0392b;
          transform: scale(1.1);
        }
        
        .chest-content {
          padding: 20px;
        }
        
        .chest-inventory {
          margin-bottom: 20px;
        }
        
        .chest-slots {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .chest-slot {
          width: 60px;
          height: 60px;
          border: 2px solid #8B4513;
          border-radius: 8px;
          background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .chest-slot:hover {
          border-color: #FFD700;
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .chest-slot.empty {
          border-color: #654321;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        }
        
        .chest-slot.empty::after {
          content: '';
          width: 20px;
          height: 20px;
          background: #7f8c8d;
          border-radius: 50%;
          opacity: 0.3;
        }
        
        .chest-slot .item-icon {
          font-size: 24px;
          filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
        }
        
        .chest-slot .item-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1001;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        
        .chest-slot:hover .item-tooltip {
          opacity: 1;
        }
        
        .chest-info {
          background: rgba(139, 69, 19, 0.2);
          border: 1px solid #8B4513;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .chest-info p {
          margin: 5px 0;
          color: #bdc3c7;
          font-size: 14px;
        }
        
        .hidden {
          display: none !important;
        }
        
        @media (max-width: 768px) {
          .chest-modal {
            min-width: 90vw;
            max-width: 90vw;
          }
          
          .chest-slots {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .chest-slot {
            width: 50px;
            height: 50px;
          }
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }
  
  static setupEventListeners() {
    // Кнопка закрытия
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeChest') {
        this.closeChest();
      }
    });
    
    // ESC для закрытия
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOpen) {
        this.closeChest();
      }
    });
    
    // Клик вне модального окна для закрытия
    document.addEventListener('click', (e) => {
      if (e.target.id === 'chestOverlay') {
        this.closeChest();
      }
    });
    
    // Скрываем подсказку при любых действиях игрока
    document.addEventListener('keydown', async (e) => {
      if (e.code === 'KeyE' && this.isOpen) {
        // Скрываем подсказку при нажатии E во время открытого сундука
        try {
          const { Chest } = await import('../entities/Chest.js');
          Chest.hideAllInteractionHints();
        } catch (e) {
          console.warn('Ошибка при скрытии подсказки:', e);
        }
      }
    });
  }
  
  static async openChest(chest) {
    // Если уже открыт этот же сундук, просто обновляем содержимое
    if (this.isOpen && this.currentChest === chest) {
      await this.updateChestDisplay();
      return;
    }
    
    // Если открыт другой сундук, закрываем его
    if (this.isOpen && this.currentChest !== chest) {
      this.closeChest();
    }
    
    this.currentChest = chest;
    this.isOpen = true;
    
    // Ставим игру на паузу
    gameState.isPaused = true;
    
    // Показываем UI
    const overlay = document.getElementById('chestOverlay');
    overlay.classList.remove('hidden');
    
    // Обновляем содержимое
    await this.updateChestDisplay();
    
    // Фокус на модальное окно
    setTimeout(() => {
      const modal = overlay.querySelector('.chest-modal');
      if (modal) modal.focus();
    }, 100);
  }
  
  static closeChest() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.currentChest = null;
    
    // Скрываем UI
    const overlay = document.getElementById('chestOverlay');
    overlay.classList.add('hidden');
    
    // Скрываем подсказку при закрытии сундука
    const hint = document.getElementById('interactionHint');
    if (hint && hint.classList.contains('active')) {
      hint.classList.add('hidden');
      hint.classList.remove('active');
    }
    
    // Снимаем паузу с задержкой, чтобы ESC не сработал сразу
    setTimeout(() => {
      gameState.isPaused = false;
    }, 100);
  }
  
  static async updateChestDisplay() {
    const slotsContainer = document.querySelector('.chest-slots');
    if (!slotsContainer || !this.currentChest) return;
    
    slotsContainer.innerHTML = '';
    
    // Создаем слоты
    for (let i = 0; i < this.currentChest.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'chest-slot';
      slot.dataset.index = i;
      
      if (i < this.currentChest.inventory.length) {
        const item = this.currentChest.inventory[i];
        
        // Используем спрайты из InventorySpriteRenderer
        if (item.base) {
          try {
            const { InventorySpriteRenderer } = await import('./InventorySpriteRenderer.js');
            const sprite = InventorySpriteRenderer.renderItemSprite(item.base, item.rarity || 'common', 48);
            
            // Создаем img элемент для спрайта
            const img = document.createElement('img');
            img.src = sprite.toDataURL();
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            
            slot.innerHTML = '';
            slot.appendChild(img);
          } catch (e) {
            console.warn('Не удалось загрузить спрайт предмета:', e);
            slot.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>`;
          }
        } else {
          slot.innerHTML = `<div class="item-icon">${item.icon || '📦'}</div>`;
        }
        
        // Добавляем тултип
        slot.innerHTML += `<div class="item-tooltip">${item.name || 'Предмет'}</div>`;
        
        // Обработчик двойного клика для взятия предмета
        slot.addEventListener('dblclick', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await this.takeItem(i);
        });
        
        // Обработчик правого клика для контекстного меню
        slot.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showContextMenu(e, i);
        });
      } else {
        slot.classList.add('empty');
      }
      
      slotsContainer.appendChild(slot);
    }
  }
  
  static async takeItem(itemIndex) {
    if (!this.currentChest || itemIndex < 0 || itemIndex >= this.currentChest.inventory.length) {
      return;
    }
    
    const item = this.currentChest.takeItem(itemIndex);
    if (item) {
      // Добавляем предмет в инвентарь игрока
      try {
        const { InventoryManager } = await import('./InventoryManager.js');
        const success = InventoryManager.addItemToInventory(item);
        if (success) {
          // Обновляем отображение
          await this.updateChestDisplay();
          
          // Звуковой эффект
          this.playTakeItemSound();
        }
      } catch (e) {
        console.error('Ошибка при добавлении предмета в инвентарь:', e);
      }
    }
  }
  
  static showContextMenu(e, itemIndex) {
    if (!this.currentChest || itemIndex < 0 || itemIndex >= this.currentChest.inventory.length) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Удаляем существующее меню если есть
    const existingMenu = document.querySelector('.chest-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Создаем контекстное меню
    const contextMenu = document.createElement('div');
    contextMenu.className = 'chest-context-menu';
    contextMenu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: #2c3e50;
      border: 1px solid #95a5a6;
      border-radius: 6px;
      padding: 5px 0;
      z-index: 1002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    const takeOption = document.createElement('div');
    takeOption.textContent = 'Взять предмет';
    takeOption.style.cssText = `
      padding: 8px 15px;
      cursor: pointer;
      color: #ecf0f1;
      font-size: 14px;
    `;
    takeOption.addEventListener('mouseenter', () => {
      takeOption.style.background = '#34495e';
    });
    takeOption.addEventListener('mouseleave', () => {
      takeOption.style.background = 'transparent';
    });
    takeOption.addEventListener('click', async () => {
      await this.takeItem(itemIndex);
      contextMenu.remove();
    });
    
    contextMenu.appendChild(takeOption);
    document.body.appendChild(contextMenu);
    
    // Удаляем меню при клике вне его
    const removeMenu = (e) => {
      if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.remove();
        document.removeEventListener('click', removeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  }
  
  static playTakeItemSound() {
    // Воспроизводим звук взятия предмета
    const audioManager = gameState.audioManager;
    if (audioManager) {
      audioManager.playSound('item_pickup');
    }
  }
  

}
