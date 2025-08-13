/* Darkfall Depths - Управление инвентарем */

import { gameState } from '../core/GameState.js';
import { ContextMenuManager } from './ContextMenuManager.js';

let tooltipElement = null;
let draggedItem = null;
let draggedSlot = null;

export class InventoryManager {
  static toggleInventory() {
    const overlay = document.getElementById('inventoryOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('hidden')) {
      // Проверяем, что игра не в паузе перед открытием инвентаря
      if (gameState.isPaused) {
        console.log('Inventory toggle attempted during pause - ignoring');
        return;
      }
      
      this.renderInventory();
      overlay.classList.remove('hidden');
      
      // Воспроизводим звук открытия инвентаря (асинхронно)
      (async () => {
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playInventoryOpen();
      })();
      
      // Устанавливаем паузу при открытии инвентаря
      if (gameState.screen === 'game' && !gameState.isPaused) {
        gameState.isPaused = true;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
      }
    } else {
      // Закрываем инвентарь в любом случае (даже в паузе)
      overlay.classList.add('hidden');
      // Скрываем тултипы при закрытии инвентаря
      this.hideTooltip();
      
      // Сбрасываем паузу при закрытии инвентаря, если игра была поставлена на паузу из-за инвентаря
      if (gameState.screen === 'game' && gameState.isPaused) {
        gameState.isPaused = false;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        
        // Показываем игровые кнопки при возобновлении
        const inventoryToggleBtn = document.getElementById('inventoryToggle');
        const pauseBtn = document.getElementById('pauseBtn');
        const desktopAbilityBtn = document.getElementById('desktopAbilityBtn');
        const healthPotionSlot = document.getElementById('healthPotionSlot');
        
        if (inventoryToggleBtn) inventoryToggleBtn.style.display = '';
        if (pauseBtn) pauseBtn.style.display = '';
        if (desktopAbilityBtn) desktopAbilityBtn.style.display = '';
        if (healthPotionSlot) healthPotionSlot.style.display = '';
      }
      
      // Сбросить все нажатые клавиши после закрытия инвентаря
      Object.keys(gameState.input.keys).forEach(k => gameState.input.keys[k] = false);
      
      // Обновляем банки здоровья при закрытии инвентаря
      if (gameState.screen === 'game') {
        (async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.updateHealthPotions();
        })();
      }
    }
  }

  static renderInventory() {
    const equipSlots = document.getElementById('equipSlots');
    const backpackSlots = document.getElementById('backpackSlots');
    if (!equipSlots || !backpackSlots) return;
    
    equipSlots.innerHTML = '';
    backpackSlots.innerHTML = '';
    
    // --- Новый блок: параметры персонажа ---
    let statsBlock = document.getElementById('inventoryStats');
    if (!statsBlock) {
      statsBlock = document.createElement('div');
      statsBlock.id = 'inventoryStats';
      statsBlock.style.marginBottom = '16px';
      statsBlock.style.background = 'rgba(0,0,0,0.08)';
      statsBlock.style.borderRadius = '8px';
      statsBlock.style.padding = '10px 12px';
      statsBlock.style.fontSize = '15px';
      statsBlock.style.lineHeight = '1.6';
      const parent = document.getElementById('inventoryOverlay').querySelector('.card__body');
      parent.insertBefore(statsBlock, parent.firstChild);
    }
    
    if (gameState.player) {
      statsBlock.innerHTML = `
        <b>Параметры персонажа</b><br>
        HP: <span style="color:#e74c3c">${gameState.player.hp}</span> / <span style="color:#e74c3c">${gameState.player.maxHp}</span><br>
        Урон: <span style="color:#e67e22">${gameState.player.damage}</span><br>
        Защита: <span style="color:#7f8c8d">${gameState.player.defense||0}</span><br>
        Крит: <span style="color:#3498db">${gameState.player.crit||0}%</span><br>
        Скорость: <span style="color:#27ae60">${gameState.player.moveSpeed}</span><br>
        Скорость атаки: <span style="color:#3498db">${gameState.player.attackSpeed}</span> сек<br>
        Дальность атаки: <span style="color:#9b59b6">${gameState.player.attackRadius}</span> px<br>
      `;
    } else {
      statsBlock.innerHTML = '';
    }
    
    // Слоты экипировки
    const slotNames = ['Оружие', 'Броня', 'Аксессуар', 'Расходник'];
    gameState.inventory.equipment.forEach((item, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.title = slotNames[index];
      slot.setAttribute('data-type', 'equipment');
      slot.setAttribute('data-index', index);
      
      if (item) {
        slot.classList.add('filled', item.rarity);
        slot.innerHTML = `<div class="item-sprite" style="background:${item.color};font-size:2rem;display:flex;align-items:center;justify-content:center;">${item.icon||''}</div>`;
        const tooltipText = `${item.name}\n${item.description}\n${Object.entries(item.bonus).map(([k,v]) => k==='heal'?`Восстановление: +${v}`:`${k}: +${v}`).join('\n')}`;
        
        // Добавляем обработчики для тултипов
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        
        // Двойной клик для использования
        slot.addEventListener('dblclick', () => this.useItem('equipment', index));
        
        // Настройка контекстного меню
        ContextMenuManager.setupSlotContextMenu(slot, item, 'equipment', index);
        
        slot.addEventListener('click', () => this.unequipItem(index));
        this.setupDragDropForSlot(slot, 'equipment', index);
      }
      
      equipSlots.appendChild(slot);
    });
    
    // Слоты рюкзака
    gameState.inventory.backpack.forEach((item, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('data-type', 'backpack');
      slot.setAttribute('data-index', index);
      
      if (item) {
        slot.classList.add('filled', item.rarity);
        slot.innerHTML = `<div class="item-sprite" style="background:${item.color};font-size:2rem;display:flex;align-items:center;justify-content:center;">${item.icon||''}</div>`;
        const tooltipText = `${item.name}\n${item.description}\n${Object.entries(item.bonus).map(([k,v]) => k==='heal'?`Восстановление: +${v}`:`${k}: +${v}`).join('\n')}`;
        
        // Добавляем обработчики для тултипов
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        
        // Двойной клик для использования
        slot.addEventListener('dblclick', () => this.useItem('backpack', index));
        
        // Настройка контекстного меню
        ContextMenuManager.setupSlotContextMenu(slot, item, 'backpack', index);
        
        slot.addEventListener('click', () => this.equipItem(index));
        this.setupDragDropForSlot(slot, 'backpack', index);
      }
      
      backpackSlots.appendChild(slot);
    });
  }

  static useItem(type, index) {
    const item = type === 'equipment' ? gameState.inventory.equipment[index] : gameState.inventory.backpack[index];
    if (!item) return;
    
    if (item.type === 'consumable') {
      console.log('Using consumable:', item);
      this.applyItemBonuses(item);
      if (type === 'equipment') {
        gameState.inventory.equipment[index] = null;
      } else {
        gameState.inventory.backpack[index] = null;
      }
      this.renderInventory();
    } else {
      // Для не-расходников - экипировка
      if (type === 'backpack') {
        this.equipItem(index);
      }
    }
  }

  static equipItem(backpackIndex) {
    const item = gameState.inventory.backpack[backpackIndex];
    this.logInventory('equipItem: start', {backpackIndex, item});
    
    if (!item) return;
    
    if (item.type === 'consumable') {
      console.log('Applying consumable:', item);
      this.applyItemBonuses(item);
      gameState.inventory.backpack[backpackIndex] = null;
      this.logInventory('equipItem: after apply consumable', {backpackIndex});
      this.renderInventory();
      return;
    }
    
    const slotMap = { weapon: 0, armor: 1, accessory: 2, consumable: 3 };
    let targetSlot = slotMap[item.slot];
    
    if (targetSlot === undefined) {
      targetSlot = gameState.inventory.equipment.findIndex(slot => !slot);
      if (targetSlot === -1) targetSlot = 0;
    }
    
    const oldItem = gameState.inventory.equipment[targetSlot];
    console.log('Swapping:', {fromBackpack: item, toEquipment: oldItem, targetSlot});
    
    gameState.inventory.equipment[targetSlot] = item;
    gameState.inventory.backpack[backpackIndex] = oldItem;
    
    this.applyItemBonuses(item);
    if (oldItem) this.removeItemBonuses(oldItem);
    
    this.logInventory('equipItem: after swap', {targetSlot});
    this.renderInventory();
  }

  static unequipItem(equipIndex) {
    const item = gameState.inventory.equipment[equipIndex];
    if (!item) return;
    
    // Найти свободное место в рюкзаке
    const backpackIndex = gameState.inventory.backpack.findIndex(slot => !slot);
    if (backpackIndex === -1) {
      alert('Рюкзак полон!');
      return;
    }
    
    gameState.inventory.equipment[equipIndex] = null;
    gameState.inventory.backpack[backpackIndex] = item;
    
    this.removeItemBonuses(item);
    this.renderInventory();
  }

  static deleteBackpackItem(index) {
    const item = gameState.inventory.backpack[index];
    
    if (item) {
      gameState.inventory.backpack[index] = null;
      this.renderInventory();
    }
  }

  static deleteEquipItem(index) {
    const item = gameState.inventory.equipment[index];
    
    if (item) {
      this.removeItemBonuses(item);
      gameState.inventory.equipment[index] = null;
      this.renderInventory();
    }
  }

  static applyItemBonuses(item) {
    console.log('applyItemBonuses:', item);
    if (!gameState.player || !item.bonus) return;
    
    Object.entries(item.bonus).forEach(([stat, value]) => {
      switch (stat) {
        case 'damage':
          gameState.player.damage += value;
          break;
        case 'maxHp':
          gameState.player.maxHp += value;
          // Увеличиваем шкалу здоровья, но НЕ восстанавливаем здоровье
          // Текущее здоровье остается прежним, но теперь может быть больше максимума
          break;
        case 'moveSpeed':
          gameState.player.moveSpeed += value;
          break;
        case 'heal':
          gameState.player.hp = Math.min(gameState.player.hp + value, gameState.player.maxHp);
          break;
        case 'crit':
          gameState.player.crit += value;
          break;
        case 'defense':
          gameState.player.defense += value;
          break;
        case 'attackSpeed':
          gameState.player.attackSpeed = Math.max(0.1, gameState.player.attackSpeed - value / 100);
          break;
        case 'attackRadius':
          gameState.player.attackRadius += value;
          break;
        case 'fire':
        case 'ice':
          // Элементальные бонусы добавляются к урону
          gameState.player.damage += value;
          break;
      }
    });
    
    console.log('Player after applyItemBonuses:', {
      hp: gameState.player.hp,
      maxHp: gameState.player.maxHp,
      damage: gameState.player.damage,
      moveSpeed: gameState.player.moveSpeed,
      crit: gameState.player.crit,
      defense: gameState.player.defense,
      attackSpeed: gameState.player.attackSpeed,
      attackRadius: gameState.player.attackRadius
    });
    
    // Логируем изменение maxHp отдельно
    if (item.bonus.maxHp) {
      console.log(`💚 Max HP increased by ${item.bonus.maxHp} (current HP: ${gameState.player.hp}/${gameState.player.maxHp})`);
    }
    
    // Обновляем банки здоровья в UI
    if (gameState.screen === 'game') {
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateHealthPotions();
      })();
    }
  }

  static removeItemBonuses(item) {
    console.log('removeItemBonuses:', item);
    if (!gameState.player || !item.bonus) return;
    
    Object.entries(item.bonus).forEach(([stat, value]) => {
      switch (stat) {
        case 'damage':
          gameState.player.damage -= value;
          break;
        case 'maxHp':
          gameState.player.maxHp -= value;
          gameState.player.hp = Math.min(gameState.player.hp, gameState.player.maxHp);
          console.log(`💚 Max HP decreased by ${value} (current HP: ${gameState.player.hp}/${gameState.player.maxHp})`);
          break;
        case 'moveSpeed':
          gameState.player.moveSpeed -= value;
          break;
        case 'crit':
          gameState.player.crit -= value;
          break;
        case 'defense':
          gameState.player.defense -= value;
          break;
        case 'attackSpeed':
          gameState.player.attackSpeed = Math.max(0.1, gameState.player.attackSpeed + value / 100);
          break;
        case 'attackRadius':
          gameState.player.attackRadius -= value;
          break;
        case 'fire':
        case 'ice':
          // Элементальные бонусы вычитаются из урона
          gameState.player.damage -= value;
          break;
      }
    });
    
    // Обновляем банки здоровья в UI
    if (gameState.screen === 'game') {
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateHealthPotions();
      })();
    }
  }

  static setupDragDropForSlot(slot, type, index) {
    slot.draggable = true;
    
    slot.addEventListener('dragstart', (e) => {
      draggedItem = type === 'equipment' ? gameState.inventory.equipment[index] : gameState.inventory.backpack[index];
      draggedSlot = { type, index };
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('dragging');
      
      // Добавляем обработчик для отслеживания выхода за пределы инвентаря
      this.setupDragOutsideHandler();
    });
    
    slot.addEventListener('dragend', (e) => {
      slot.classList.remove('dragging');
      
      // Проверяем, был ли предмет выброшен за пределы инвентаря
      this.handleDragEnd(e);
      
      draggedItem = null;
      draggedSlot = null;
    });
    
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });
    
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      
      if (draggedItem && draggedSlot) {
        this.handleDrop(draggedSlot, { type, index });
      }
    });
  }

  static handleDrop(from, to) {
    if (from.type === to.type && from.index === to.index) return;
    
    const fromItem = from.type === 'equipment' ? gameState.inventory.equipment[from.index] : gameState.inventory.backpack[from.index];
    const toItem = to.type === 'equipment' ? gameState.inventory.equipment[to.index] : gameState.inventory.backpack[to.index];
    
    // Обмен предметами
    if (from.type === 'equipment') {
      gameState.inventory.equipment[from.index] = toItem;
    } else {
      gameState.inventory.backpack[from.index] = toItem;
    }
    
    if (to.type === 'equipment') {
      gameState.inventory.equipment[to.index] = fromItem;
    } else {
      gameState.inventory.backpack[to.index] = fromItem;
    }
    
    // Обновляем бонусы
    if (fromItem) this.removeItemBonuses(fromItem);
    if (toItem) this.removeItemBonuses(toItem);
    if (fromItem) this.applyItemBonuses(fromItem);
    if (toItem) this.applyItemBonuses(toItem);
    
    this.renderInventory();
  }

  static logInventory(action, extra = {}) {
    console.log('📦 Inventory:', action, extra);
  }

  // Обработчики для drag & drop за пределы инвентаря
  static setupDragOutsideHandler() {
    // Удаляем предыдущий обработчик если есть
    if (this.dragOutsideHandler) {
      document.removeEventListener('dragover', this.dragOutsideHandler);
    }
    
    this.dragOutsideHandler = (e) => {
      if (!draggedItem || !draggedSlot) return;
      
      const inventoryOverlay = document.getElementById('inventoryOverlay');
      if (!inventoryOverlay) return;
      
      const overlayRect = inventoryOverlay.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Проверяем, находится ли курсор за пределами инвентаря
      const isOutside = mouseX < overlayRect.left || 
                       mouseX > overlayRect.right || 
                       mouseY < overlayRect.top || 
                       mouseY > overlayRect.bottom;
      
      // Показываем визуальную индикацию для удаления
      if (isOutside) {
        this.showDeleteZone();
      } else {
        this.hideDeleteZone();
      }
    };
    
    document.addEventListener('dragover', this.dragOutsideHandler);
  }

  static showDeleteZone() {
    if (this.deleteZone) return;
    
    this.deleteZone = document.createElement('div');
    this.deleteZone.id = 'deleteZone';
    this.deleteZone.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: rgba(231, 76, 60, 0.2);
      border: 3px dashed #e74c3c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      pointer-events: none;
      animation: pulse 1s infinite;
    `;
    
    this.deleteZone.innerHTML = `
      <div style="text-align: center; color: #e74c3c; font-size: 2rem;">
        🗑️<br>
        <span style="font-size: 1rem;">Выбросить предмет</span>
      </div>
    `;
    
    // Добавляем CSS анимацию
    if (!document.getElementById('deleteZoneStyles')) {
      const style = document.createElement('style');
      style.id = 'deleteZoneStyles';
      style.textContent = `
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(this.deleteZone);
  }

  static hideDeleteZone() {
    if (this.deleteZone) {
      this.deleteZone.remove();
      this.deleteZone = null;
    }
  }

  static handleDragEnd(e) {
    if (!draggedItem || !draggedSlot) return;
    
    const inventoryOverlay = document.getElementById('inventoryOverlay');
    if (!inventoryOverlay) return;
    
    const overlayRect = inventoryOverlay.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Проверяем, был ли предмет выброшен за пределы инвентаря
    const isOutside = mouseX < overlayRect.left || 
                     mouseX > overlayRect.right || 
                     mouseY < overlayRect.top || 
                     mouseY > overlayRect.bottom;
    
    if (isOutside) {
      // Показываем подтверждение удаления
      this.showDeleteConfirmation(draggedItem, draggedSlot);
    }
    
    // Убираем зону удаления
    this.hideDeleteZone();
    
    // Удаляем обработчик
    if (this.dragOutsideHandler) {
      document.removeEventListener('dragover', this.dragOutsideHandler);
      this.dragOutsideHandler = null;
    }
  }

  static showDeleteConfirmation(item, slot) {
    const popup = document.getElementById('deletePopup');
    if (!popup) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    // Обновляем текст
    const itemName = item ? item.name : 'предмет';
    popup.querySelector('div:nth-child(2)').textContent = `Удалить "${itemName}"?`;

    // Обработчики кнопок
    const handleConfirm = () => {
      this.deleteItemBySlot(slot);
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

  static deleteItemBySlot(slot) {
    if (!slot) return;
    
    if (slot.type === 'equipment') {
      this.deleteEquipItem(slot.index);
    } else {
      this.deleteBackpackItem(slot.index);
    }
  }

  // Методы для работы с тултипами
  static showTooltip(event, text) {
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'custom-tooltip';
      tooltipElement.style.cssText = `
        position: fixed;
        z-index: 9999;
        background: #222;
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        white-space: pre-line;
        font-size: 14px;
        pointer-events: none;
        max-width: 220px;
        opacity: 0.97;
        transition: opacity 0.1s;
        display: none;
      `;
      document.body.appendChild(tooltipElement);
    }
    
    tooltipElement.textContent = text;
    tooltipElement.style.display = 'block';
    this.updateTooltipPosition(event);
  }

  static hideTooltip() {
    if (tooltipElement) {
      tooltipElement.style.display = 'none';
    }
  }

  static updateTooltipPosition(event) {
    if (!tooltipElement) return;
    
    const x = event.clientX + 10;
    const y = event.clientY + 10;
    
    // Проверяем, не выходит ли тултип за пределы экрана
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let finalX = x;
    let finalY = y;
    
    if (x + tooltipRect.width > windowWidth) {
      finalX = event.clientX - tooltipRect.width - 10;
    }
    
    if (y + tooltipRect.height > windowHeight) {
      finalY = event.clientY - tooltipRect.height - 10;
    }
    
    tooltipElement.style.left = finalX + 'px';
    tooltipElement.style.top = finalY + 'px';
  }
} 