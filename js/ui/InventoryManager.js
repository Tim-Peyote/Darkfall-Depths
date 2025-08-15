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
      
      // Обновляем быстрые слоты при закрытии инвентаря
      if (gameState.screen === 'game') {
        (async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.updateQuickPotions();
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
        const tooltipText = `${item.name}\n${item.description}`;
        
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
    
    // Быстрые слоты для банок
    const quickSlotsContainer = document.getElementById('quickSlotsContainer');
    if (!quickSlotsContainer) {
      const quickSlotsDiv = document.createElement('div');
      quickSlotsDiv.id = 'quickSlotsContainer';
      quickSlotsDiv.style.cssText = `
        margin: 16px 0;
        padding: 12px;
        background: rgba(0,0,0,0.05);
        border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.1);
      `;
      quickSlotsDiv.innerHTML = '<div style="margin-bottom: 8px; font-weight: bold; color: #666;">Быстрые слоты (1, 2, 3)</div>';
      equipSlots.parentNode.insertBefore(quickSlotsDiv, equipSlots.nextSibling);
    }
    
    const quickSlotsEl = document.getElementById('quickSlotsContainer');
    quickSlotsEl.innerHTML = '<div style="margin-bottom: 8px; font-weight: bold; color: #666;">Быстрые слоты (1, 2, 3)</div>';
    
    gameState.inventory.quickSlots.forEach((potionType, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.title = `Быстрый слот ${index + 1}`;
      slot.setAttribute('data-type', 'quickslot');
      slot.setAttribute('data-index', index);
      slot.style.display = 'inline-block';
      slot.style.margin = '4px';
      
      if (potionType) {
        // Слот с назначенным типом зелья
        let icon = '🧪';
        let color = '#ff6666';
        let name = 'Неизвестное зелье';
        
        switch (potionType) {
          case 'potion':
            icon = '❤️';
            color = '#ff6666';
            name = 'Зелье здоровья';
            break;
          case 'speed_potion':
            icon = '💨';
            color = '#66ff66';
            name = 'Зелье скорости';
            break;
          case 'strength_potion':
            icon = '⚔️';
            color = '#ffaa66';
            name = 'Зелье силы';
            break;
          case 'defense_potion':
            icon = '🛡️';
            color = '#6666ff';
            name = 'Зелье защиты';
            break;
          case 'regen_potion':
            icon = '💚';
            color = '#ff66ff';
            name = 'Зелье регенерации';
            break;
          case 'combo_potion':
            icon = '✨';
            color = '#ffff66';
            name = 'Комбо зелье';
            break;
        }
        
        // Подсчитываем количество зелий этого типа в рюкзаке
        const count = gameState.inventory.backpack.filter(item => 
          item && item.type === 'consumable' && item.base === potionType
        ).length;
        
        slot.classList.add('filled');
        slot.innerHTML = `
          <div class="item-sprite" style="background:${color};font-size:1.5rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${icon}</div>
          <div class="item-count" style="position:absolute;bottom:-2px;right:-2px;background:${color};color:white;font-size:10px;padding:1px 3px;border-radius:3px;min-width:12px;text-align:center;">${count}</div>
        `;
        const tooltipText = `${name}\nКоличество: ${count}\nКлавиша: ${index + 1}`;
        
        // Добавляем обработчики для тултипов
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        
        // Двойной клик для использования
        slot.addEventListener('dblclick', () => {
          (async () => {
            const { GameEngine } = await import('../game/GameEngine.js');
            GameEngine.useQuickPotion(index);
          })();
        });
        
        // Настройка контекстного меню
        ContextMenuManager.setupSlotContextMenu(slot, { name, type: 'consumable', base: potionType }, 'quickslot', index);
      } else {
        // Пустой слот
        slot.classList.add('empty');
        slot.innerHTML = `<div style="font-size:1.5rem;color:#666;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${index + 1}</div>`;
        slot.title = `Пустой быстрый слот ${index + 1} (перетащите сюда банку)`;
      }
      
      // Настройка drag & drop для всех слотов
      this.setupDragDropForSlot(slot, 'quickslot', index);
      
      quickSlotsEl.appendChild(slot);
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
        const tooltipText = `${item.name}\n${item.description}`;
        
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
    let item;
    if (type === 'equipment') {
      item = gameState.inventory.equipment[index];
    } else if (type === 'backpack') {
      item = gameState.inventory.backpack[index];
    } else if (type === 'quickslot') {
      item = gameState.inventory.quickSlots[index];
    }
    
    if (!item) return;
    
    if (item.type === 'consumable') {
  
      this.applyItemBonuses(item);
      if (type === 'equipment') {
        gameState.inventory.equipment[index] = null;
      } else if (type === 'backpack') {
        gameState.inventory.backpack[index] = null;
      } else if (type === 'quickslot') {
        gameState.inventory.quickSlots[index] = null;
      }
      this.renderInventory();
      
      // Обновляем быстрые слоты в UI
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateQuickPotions();
      })();
    } else {
      // Для не-расходников - экипировка
      if (type === 'backpack') {
        this.equipItem(index);
      }
    }
  }

  static equipItem(backpackIndex) {
    const item = gameState.inventory.backpack[backpackIndex];
    
    if (!item) return;
    
    // Если это банка, применяем её эффекты
    if (item.type === 'consumable') {
      // Применяем эффекты банки
      (async () => {
        const { BuffManager } = await import('../core/BuffManager.js');
        BuffManager.applyConsumableEffects(item);
      })();
      
      // Удаляем банку из рюкзака
      gameState.inventory.backpack[backpackIndex] = null;
      this.renderInventory();
      
      // Воспроизводим звук использования зелья
      (async () => {
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playHealthPotion();
      })();
      
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
    
    // Для экипировки применяем постоянные бонусы
    if (item.type !== 'consumable') {
      Object.entries(item.bonus).forEach(([stat, value]) => {
        switch (stat) {
          case 'damage':
            gameState.player.damage += value;
            break;
          case 'maxHp':
            gameState.player.maxHp += value;
            break;
          case 'moveSpeed':
            gameState.player.moveSpeed += value;
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
            gameState.player.damage += value;
            break;
        }
      });
    } else {
      // Для банок используем систему временных баффов
      (async () => {
        const { BuffManager } = await import('../core/BuffManager.js');
        BuffManager.applyConsumableEffects(item);
      })();
    }
    
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
    
    // Обновляем быстрые слоты в UI
    if (gameState.screen === 'game') {
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateQuickPotions();
      })();
    }
  }

  static removeItemBonuses(item) {
    console.log('removeItemBonuses:', item);
    if (!gameState.player || !item.bonus) return;
    
    // Удаляем бонусы только для экипировки, не для банок
    if (item.type === 'consumable') {
      console.log('Skipping removeItemBonuses for consumable item');
      return;
    }
    
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
    
    // Обновляем быстрые слоты в UI
    if (gameState.screen === 'game') {
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateQuickPotions();
      })();
    }
  }

  static setupDragDropForSlot(slot, type, index) {
    slot.draggable = true;
    
    slot.addEventListener('dragstart', (e) => {
      let item;
      if (type === 'equipment') {
        item = gameState.inventory.equipment[index];
      } else if (type === 'backpack') {
        item = gameState.inventory.backpack[index];
      } else if (type === 'quickslot') {
        item = gameState.inventory.quickSlots[index];
      }
      
      draggedItem = item;
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
    if (from.type === to.type && from.index === to.index) {
      return;
    }
    
    // Получаем предметы из соответствующих источников
    let fromItem, toItem;
    
    if (from.type === 'equipment') {
      fromItem = gameState.inventory.equipment[from.index];
    } else if (from.type === 'backpack') {
      fromItem = gameState.inventory.backpack[from.index];
    } else if (from.type === 'quickslot') {
      fromItem = gameState.inventory.quickSlots[from.index];
    }
    
    if (to.type === 'equipment') {
      toItem = gameState.inventory.equipment[to.index];
    } else if (to.type === 'backpack') {
      toItem = gameState.inventory.backpack[to.index];
    } else if (to.type === 'quickslot') {
      toItem = gameState.inventory.quickSlots[to.index];
    }
    
    // Проверяем, можно ли поместить банку в быстрый слот
    if (to.type === 'quickslot' && fromItem && fromItem.type !== 'consumable') {
      return;
    }
    
    // Если перетаскиваем из быстрого слота в рюкзак или экипировку, очищаем быстрый слот
    if (from.type === 'quickslot' && (to.type === 'backpack' || to.type === 'equipment')) {
      gameState.inventory.quickSlots[from.index] = null;
      this.renderInventory();
      
      // Обновляем быстрые слоты в UI
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateQuickPotions();
      })();
      
      return;
    }
    
    if (to.type === 'quickslot' && fromItem && fromItem.type === 'consumable') {
      // Сохраняем тип зелья, а не конкретный предмет
      gameState.inventory.quickSlots[to.index] = fromItem.base;
      
      this.renderInventory();
      
      // Обновляем быстрые слоты в UI
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.updateQuickPotions();
      })();
      
      return; // Не обмениваем предметы, только назначаем тип
    }
    
    // Обмен предметами (но не для быстрых слотов)
    if (from.type === 'equipment') {
      gameState.inventory.equipment[from.index] = toItem;
    } else if (from.type === 'backpack') {
      gameState.inventory.backpack[from.index] = toItem;
    }
    // Быстрые слоты не участвуют в обмене предметами
    
    if (to.type === 'equipment') {
      gameState.inventory.equipment[to.index] = fromItem;
    } else if (to.type === 'backpack') {
      gameState.inventory.backpack[to.index] = fromItem;
    }
    // Быстрые слоты обрабатываются отдельно выше
    
    // Обновляем бонусы только для экипировки
    if (fromItem && from.type === 'equipment') this.removeItemBonuses(fromItem);
    if (toItem && to.type === 'equipment') this.removeItemBonuses(toItem);
    if (fromItem && to.type === 'equipment') this.applyItemBonuses(fromItem);
    if (toItem && from.type === 'equipment') this.applyItemBonuses(toItem);
    
    this.renderInventory();
    
    // Обновляем быстрые слоты
    (async () => {
      const { GameEngine } = await import('../game/GameEngine.js');
      GameEngine.updateQuickPotions();
    })();
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