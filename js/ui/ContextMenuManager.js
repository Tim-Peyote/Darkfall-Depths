/* Darkfall Depths - Управление контекстным меню инвентаря */

import { gameState } from '../core/GameState.js';

let contextMenu = null;
let currentItem = null;
let currentSlot = null;

export class ContextMenuManager {
  static init() {
    this.createContextMenu();
    this.setupGlobalListeners();
  }

  static createContextMenu() {
    // Удаляем существующее меню если есть
    if (contextMenu) {
      contextMenu.remove();
    }

    contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.className = 'context-menu hidden';
    contextMenu.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8);
      padding: 8px 0;
      min-width: 160px;
      font-size: 14px;
      color: #fff;
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(contextMenu);
  }

  static setupGlobalListeners() {
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
      if (contextMenu && !contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Закрытие меню при нажатии Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Не закрываем контекстное меню если игра в паузе
        if (gameState.screen === 'game' && gameState.isPaused) {
          return;
        }
        this.hideContextMenu();
      }
    });

    // Предотвращение контекстного меню браузера
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  static showContextMenu(event, item, slotType, slotIndex) {
    event.preventDefault();
    event.stopPropagation();

    currentItem = item;
    currentSlot = { type: slotType, index: slotIndex };

    // Очищаем предыдущее содержимое
    contextMenu.innerHTML = '';

    // Определяем позицию меню
    const x = event.clientX;
    const y = event.clientY;
    
    // Проверяем, не выходит ли меню за пределы экрана
    const menuWidth = 160;
    const menuHeight = 120; // Примерная высота
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    if (x + menuWidth > windowWidth) {
      finalX = x - menuWidth;
    }

    if (y + menuHeight > windowHeight) {
      finalY = y - menuHeight;
    }

    contextMenu.style.left = finalX + 'px';
    contextMenu.style.top = finalY + 'px';

    // Создаем пункты меню
    this.createMenuItems();

    // Показываем меню
    contextMenu.classList.remove('hidden');
  }

  static createMenuItems() {
    if (!currentItem) return;

    const isEquipped = currentSlot.type === 'equipment';
    const isConsumable = currentItem.type === 'consumable';

    // Пункт "Применить" для расходников
    if (isConsumable) {
      const applyItem = this.createMenuItem('Применить', () => {
        this.useItem();
      });
      contextMenu.appendChild(applyItem);
    }

    // Пункт "Снять" для экипированных предметов
    if (isEquipped) {
      const unequipItem = this.createMenuItem('Снять', () => {
        this.unequipItem();
      });
      contextMenu.appendChild(unequipItem);
    }

    // Разделитель
    if ((isConsumable && !isEquipped) || isEquipped) {
      const separator = document.createElement('div');
      separator.style.cssText = `
        height: 1px;
        background: #333;
        margin: 4px 0;
      `;
      contextMenu.appendChild(separator);
    }

    // Пункт "Удалить"
    const deleteItem = this.createMenuItem('🗑️ Удалить', () => {
      this.showDeleteConfirmation();
    });
    contextMenu.appendChild(deleteItem);
  }

  static createMenuItem(text, onClick) {
    const item = document.createElement('div');
    item.className = 'context-menu-item';
    item.textContent = text;
    item.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      user-select: none;
    `;

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#333';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', () => {
      onClick();
      this.hideContextMenu();
    });

    return item;
  }

  static hideContextMenu() {
    if (contextMenu) {
      contextMenu.classList.add('hidden');
    }
    currentItem = null;
    currentSlot = null;
  }

  static useItem() {
    if (!currentItem || !currentSlot) return;

    // Вызываем функцию через глобальный объект
    if (window.InventoryManager) {
      window.InventoryManager.useItem(currentSlot.type, currentSlot.index);
    }
  }

  static unequipItem() {
    if (!currentSlot || currentSlot.type !== 'equipment') return;

    // Вызываем функцию через глобальный объект
    if (window.InventoryManager) {
      window.InventoryManager.unequipItem(currentSlot.index);
    }
  }

  static showDeleteConfirmation() {
    const popup = document.getElementById('deletePopup');
    if (!popup) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    // Обновляем текст
    const itemName = currentItem ? currentItem.name : 'предмет';
    popup.querySelector('div:nth-child(2)').textContent = `Удалить "${itemName}"?`;

    // Обработчики кнопок
    const handleConfirm = () => {
      this.deleteItem();
      popup.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleCancel = () => {
      popup.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    popup.classList.remove('hidden');
  }

  static deleteItem() {
    if (!currentItem || !currentSlot) return;

    // Вызываем функцию через глобальный объект
    if (window.InventoryManager) {
      if (currentSlot.type === 'equipment') {
        window.InventoryManager.deleteEquipItem(currentSlot.index);
      } else {
        window.InventoryManager.deleteBackpackItem(currentSlot.index);
      }
    }
  }

  // Методы для определения платформы
  static isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Настройка обработчиков для слота инвентаря
  static setupSlotContextMenu(slot, item, slotType, slotIndex) {
    if (!item) return;

    // Для macOS - двойной клик двумя пальцами на тачпаде
    if (this.isMacOS() && this.isTouchDevice()) {
      let touchStartTime = 0;
      let touchCount = 0;

      slot.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchCount = e.touches.length;
      });

      slot.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        
        // Двойной тап двумя пальцами (симуляция правого клика на тачпаде)
        if (touchCount === 2 && touchDuration < 300) {
          this.showContextMenu(e, item, slotType, slotIndex);
        }
      });
    }

    // Для Windows - правый клик мыши
    slot.addEventListener('contextmenu', (e) => {
      this.showContextMenu(e, item, slotType, slotIndex);
    });

    // Для мобильных устройств - долгое нажатие
    if (this.isMobile()) {
      let longPressTimer = null;
      let hasMoved = false;

      slot.addEventListener('touchstart', (e) => {
        hasMoved = false;
        longPressTimer = setTimeout(() => {
          if (!hasMoved) {
            this.showContextMenu(e, item, slotType, slotIndex);
          }
        }, 500); // 500ms для долгого нажатия
      });

      slot.addEventListener('touchmove', () => {
        hasMoved = true;
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      });

      slot.addEventListener('touchend', () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      });
    }
  }
} 