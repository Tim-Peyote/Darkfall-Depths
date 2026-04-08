/* Darkfall Depths - Управление сундуками - Updated v3 - Fixed */

import { gameState } from '../core/GameState.js';
import { Logger } from '../utils/Logger.js';

export class ChestManager {
  static currentChest = null;
  static isOpen = false;
  static contextMenuShown = false; // Флаг для предотвращения показа тултипа после контекстного меню
  static contextMenuShownTime = 0; // Время показа контекстного меню
  
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
            grid-template-columns: repeat(3, 1fr);
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
          Logger.warn('Ошибка при скрытии подсказки:', e);
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
    
    // Скрываем подсказку взаимодействия
    const hint = document.getElementById('interactionHint');
    if (hint && hint.classList.contains('active')) {
      hint.classList.add('hidden');
      hint.classList.remove('active');
    }
    
    // Показываем UI
    const overlay = document.getElementById('chestOverlay');
    overlay.classList.remove('hidden');
    
    // Обновляем заголовок сундука
    const header = overlay.querySelector('.chest-header h3');
    if (header) {
      const itemCount = this.currentChest.inventory.filter(item => item !== null).length;
      header.textContent = `Сундук (${itemCount}/${this.currentChest.maxSlots})`;
    }
    
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
    
    // Дожидаемся разрешения всех Promise в инвентаре
    const resolvedInventory = await Promise.all(
      this.currentChest.inventory.map(async (item) => {
        if (item instanceof Promise) {
          try {
            return await item;
          } catch (error) {
            Logger.error('❌ Error resolving item Promise:', error);
            return null;
          }
        }
        return item;
      })
    );
    
    slotsContainer.innerHTML = '';
    
    // Создаем статическую сетку 4x4 (16 слотов)
    for (let i = 0; i < this.currentChest.maxSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'chest-slot';
      slot.dataset.index = i;
      
      // Проверяем, есть ли предмет в этом слоте
      const item = resolvedInventory[i];
      
      // Отладочная информация
      if (item) {
        Logger.debug(`📦 Chest slot ${i}:`, item.name, item.base, item.type, item.rarity);
      }
      
      // Всегда создаем слот, даже если он пустой
      if (!item) {
        slot.innerHTML = '<div class="empty-slot"></div>';
        slot.style.opacity = '0.3';
      } else {
        // Используем спрайты из InventorySpriteRenderer
        if (item.base) {
          try {
            const { InventorySpriteRenderer } = await import('./InventorySpriteRenderer.js');
            const spriteElement = InventorySpriteRenderer.createSpriteElement(item, 48);

            if (spriteElement) {
              slot.innerHTML = '';
              slot.appendChild(spriteElement);
            } else {
              Logger.warn('Не удалось создать спрайт для предмета:', item);
              const iconText = item.icon || item.base.substring(0, 3).toUpperCase();
              slot.innerHTML = `<div class="item-icon" style="display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">${iconText}</div>`;
            }
          } catch (e) {
            Logger.warn('Не удалось загрузить спрайт предмета:', e);
            const iconText = item.icon || item.base.substring(0, 3).toUpperCase();
            slot.innerHTML = `<div class="item-icon" style="display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">${iconText}</div>`;
          }
        } else {
          const iconText = item.icon || '?';
          slot.innerHTML = `<div class="item-icon" style="display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">${iconText}</div>`;
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
        
        // Обработчик одинарного клика для тултипа (десктоп)
        slot.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentTime = Date.now();
          if (!this.contextMenuShown && (this.contextMenuShownTime === 0 || currentTime - this.contextMenuShownTime >= 1000)) {
            this.showTooltip(e, item);
          }
        });
        
        // Мобильные touch обработчики
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchMoved = false;
        let longPressTimer = null;
        let lastClickTime = 0;
        
        // Touch start
        slot.addEventListener('touchstart', (e) => {
          e.preventDefault();
          touchStartTime = Date.now();
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchMoved = false;
          
          // Таймер для длительного нажатия
          longPressTimer = setTimeout(() => {
            if (!touchMoved) {
              this.showContextMenu(e, i);
              // Устанавливаем флаг, что контекстное меню было показано
              this.contextMenuShown = true;
              this.contextMenuShownTime = Date.now();
              // Сбрасываем флаг через более длительную задержку
              setTimeout(() => {
                this.contextMenuShown = false;
                this.contextMenuShownTime = 0;
              }, 500);
            }
          }, 500);
        }, { passive: false });
        
        // Touch move
        slot.addEventListener('touchmove', (e) => {
          const touch = e.touches[0];
          const deltaX = Math.abs(touch.clientX - touchStartX);
          const deltaY = Math.abs(touch.clientY - touchStartY);
          
          if (deltaX > 10 || deltaY > 10) {
            touchMoved = true;
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
          }
        }, { passive: false });
        
        // Touch end
        slot.addEventListener('touchend', async (e) => {
          e.preventDefault();
          
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          
          // Дополнительная проверка - если контекстное меню было показано, не обрабатываем tap
          const currentTime = Date.now();
          if (this.contextMenuShown || (this.contextMenuShownTime > 0 && currentTime - this.contextMenuShownTime < 1000)) {
            return;
          }
          
          if (touchMoved) return;
          
          const touchEndTime = Date.now();
          const touchDuration = touchEndTime - touchStartTime;
          
          // Проверяем двойное нажатие
          if (touchEndTime - lastClickTime < 300) {
            // Двойное нажатие - берем предмет
            await this.takeItem(i);
            lastClickTime = 0; // Сбрасываем для следующего двойного нажатия
          } else {
            // Одинарное нажатие - показываем тултип
            if (touchDuration < 200 && !this.contextMenuShown && (this.contextMenuShownTime === 0 || currentTime - this.contextMenuShownTime >= 1000)) {
              // Передаем координаты из touchstart
              const tooltipEvent = {
                touches: [{ clientX: touchStartX, clientY: touchStartY }],
                clientX: touchStartX,
                clientY: touchStartY
              };
              this.showTooltip(tooltipEvent, item);
            }
            lastClickTime = touchEndTime;
          }
        }, { passive: false });
      }
      
      slotsContainer.appendChild(slot);
    }
  }
  
  static async takeItem(itemIndex) {
    if (!this.currentChest || itemIndex < 0 || itemIndex >= this.currentChest.maxSlots) {
      return;
    }
    
    // Проверяем, что слот не пустой
    if (itemIndex >= this.currentChest.inventory.length || !this.currentChest.inventory[itemIndex]) {
      return;
    }
    
    const item = this.currentChest.takeItem(itemIndex);
    if (item) {
      // Золото начисляется напрямую, не в инвентарь
      if (item.base === 'gold_pouch' && item.goldValue) {
        if (gameState.player) {
          gameState.player.gold += item.goldValue;
          gameState.gold = gameState.player.gold;
        }
        await this.updateChestDisplay();
        const overlay = document.getElementById('chestOverlay');
        const header = overlay?.querySelector('.chest-header h3');
        if (header) {
          const itemCount = this.currentChest.inventory.filter(i => i !== null).length;
          header.textContent = `Сундук (${itemCount}/${this.currentChest.maxSlots})`;
        }
        this.playTakeItemSound();
        return;
      }

      // Добавляем предмет в инвентарь игрока
      try {
        const { InventoryManager } = await import('./InventoryManager.js');
        const success = InventoryManager.addItemToInventory(item);
        if (success) {
          await this.updateChestDisplay();
          const overlay = document.getElementById('chestOverlay');
          const header = overlay?.querySelector('.chest-header h3');
          if (header) {
            const itemCount = this.currentChest.inventory.filter(i => i !== null).length;
            header.textContent = `Сундук (${itemCount}/${this.currentChest.maxSlots})`;
          }
          this.playTakeItemSound();
        }
      } catch (e) {
        Logger.error('Ошибка при добавлении предмета в инвентарь:', e);
      }
    }
  }
  
  static showTooltip(e, item) {
    // Создаем тултип если его нет
    let tooltip = document.getElementById('chest-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'chest-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        max-width: 250px;
        white-space: pre-wrap;
        border: 1px solid #666;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      `;
      document.body.appendChild(tooltip);
    }
    
    // Получаем координаты
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Показываем информацию о предмете
    tooltip.textContent = `${item.name || 'Предмет'}\n${item.description || ''}`;
    
    // Позиционируем тултип с учетом границ экрана
    let left = clientX + 10;
    let top = clientY - 10;
    
    // Проверяем, не выходит ли тултип за левую границу
    if (left < 10) {
      left = 10; // Отступ от левого края
    }
    
    // Проверяем, не выходит ли тултип за правую границу
    if (left + 250 > window.innerWidth) {
      left = clientX - 260; // Показываем слева от курсора
    }
    
    // Проверяем, не выходит ли тултип за верхнюю границу
    if (top < 10) {
      top = clientY + 10; // Показываем под курсором
    }
    
    // Проверяем, не выходит ли тултип за нижнюю границу
    if (top + 100 > window.innerHeight) {
      top = window.innerHeight - 110; // Отступ от нижнего края
    }
    
    // Дополнительная проверка для мобильных устройств
    // Если тултип все еще выходит за левый край после всех расчетов
    if (left < 10) {
      left = 10;
    }
    
    // Если тултип все еще выходит за правый край после всех расчетов
    if (left + 250 > window.innerWidth - 10) {
      left = window.innerWidth - 260;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
    
    // Скрываем через 3 секунды
    setTimeout(() => {
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    }, 3000);
  }
  
  static showContextMenu(e, itemIndex) {
    if (!this.currentChest || itemIndex < 0 || itemIndex >= this.currentChest.maxSlots) return;
    
    // Не показываем контекстное меню для пустых слотов
    if (itemIndex >= this.currentChest.inventory.length || !this.currentChest.inventory[itemIndex]) return;
    
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
      this.contextMenuShown = false; // Сбрасываем флаг при закрытии меню
      this.contextMenuShownTime = 0;
    });
    
    contextMenu.appendChild(takeOption);
    document.body.appendChild(contextMenu);
    
    // Удаляем меню при клике вне его
    const removeMenu = (e) => {
      if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.remove();
        document.removeEventListener('click', removeMenu);
        this.contextMenuShown = false; // Сбрасываем флаг при закрытии меню
        this.contextMenuShownTime = 0;
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
