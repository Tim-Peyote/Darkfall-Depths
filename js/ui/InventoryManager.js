/* Darkfall Depths - Управление инвентарем */

import { gameState } from '../core/GameState.js';
import { ContextMenuManager } from './ContextMenuManager.js';
import { InventorySpriteRenderer } from './InventorySpriteRenderer.js';
import { BASE_ITEMS } from '../config/constants.js';

let tooltipElement = null;
let draggedItem = null;
let draggedSlot = null;
let dropSuccessful = false; // Флаг успешного размещения предмета

// Переменные для мобильного управления
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;
let longPressTimer = null;
let lastClickTime = 0;
let lastClickSlot = null;

export class InventoryManager {
  static init() {
    // Настраиваем обработчик кнопки закрытия инвентаря
    this.setupCloseButton();
  }
  
  static setupCloseButton() {
    const closeBtn = document.getElementById('closeInventory');
    if (closeBtn) {
      // Удаляем старые обработчики
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      const newCloseBtn = document.getElementById('closeInventory');
      
      const handleCloseClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleInventory();
      };
      
      // Добавляем обработчики для мыши и touch
      newCloseBtn.addEventListener('click', handleCloseClick);
      newCloseBtn.addEventListener('touchend', handleCloseClick);
      newCloseBtn.addEventListener('touchstart', (e) => e.preventDefault());
    }
  }
  
  static toggleInventory() {
    const overlay = document.getElementById('inventoryOverlay');
    if (!overlay) {
      console.error('🎒 Inventory overlay not found!');
      return;
    }
    
    if (overlay.classList.contains('hidden')) {
      // Проверяем, что игра не в паузе перед открытием инвентаря
      if (gameState.isPaused) {
        return;
      }
      
      this.renderInventory();
      overlay.classList.remove('hidden');
      
      // Убеждаемся, что кнопка закрытия работает
      this.setupCloseButton();
      
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
      // Удаляем все элементы перетаскивания
      this.removeAllDragElements();
      
      // Воспроизводим звук закрытия инвентаря (асинхронно)
      (async () => {
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playInventoryClose();
      })();
      
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
    const equipmentSlots = document.getElementById('equipmentSlots');
    const backpackSlots = document.getElementById('backpackSlots');
    const quickSlotsContainer = document.getElementById('quickSlotsContainer');
    const currencyDisplay = document.getElementById('playerGold');
    
    if (!equipmentSlots || !backpackSlots || !quickSlotsContainer) return;
    
    // Проверяем и исправляем размер массива экипировки
    if (!gameState.inventory.equipment || gameState.inventory.equipment.length !== 9) {
      const oldEquipment = gameState.inventory.equipment || [];
      gameState.inventory.equipment = new Array(9).fill(null);
      // Копируем существующие предметы
      for (let i = 0; i < Math.min(oldEquipment.length, 9); i++) {
        gameState.inventory.equipment[i] = oldEquipment[i];
      }
    }
    
    // Проверяем и исправляем размер рюкзака
    if (!gameState.inventory.backpack || gameState.inventory.backpack.length !== 42) {
      const oldBackpack = gameState.inventory.backpack || [];
      gameState.inventory.backpack = new Array(42).fill(null);
      // Копируем существующие предметы
      for (let i = 0; i < Math.min(oldBackpack.length, 42); i++) {
        gameState.inventory.backpack[i] = oldBackpack[i];
      }
    }
    
    equipmentSlots.innerHTML = '';
    backpackSlots.innerHTML = '';
    quickSlotsContainer.innerHTML = '';
    
    // Обновляем валюту
    if (currencyDisplay) {
      currencyDisplay.textContent = gameState.player?.gold || gameState.gold || 0;
    }
    
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
      const parent = document.getElementById('inventoryOverlay').querySelector('.inventory-body');
      if (parent) {
        parent.insertBefore(statsBlock, parent.firstChild);
      }
    }
    
    if (gameState.player) {
      statsBlock.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
          <div style="color: #e74c3c; font-weight: bold;">❤️ HP: ${gameState.player.hp}/${gameState.player.maxHp}</div>
          <div style="color: #e67e22; font-weight: bold;">⚔️ Урон: ${gameState.player.damage}</div>
          <div style="color: #7f8c8d; font-weight: bold;">🛡️ Защита: ${gameState.player.defense||0}</div>
          <div style="color: #3498db; font-weight: bold;">💥 Крит: ${gameState.player.crit||0}%</div>
          <div style="color: #27ae60; font-weight: bold;">💨 Скорость: ${gameState.player.moveSpeed}</div>
          <div style="color: #3498db; font-weight: bold;">⚡ Атака: ${gameState.player.attackSpeed}с</div>
          <div style="color: #9b59b6; font-weight: bold; grid-column: 1 / -1;">🎯 Дальность: ${gameState.player.attackRadius}px</div>
        </div>
      `;
    } else {
      statsBlock.innerHTML = '';
    }
    
    // Слоты экипировки - правильная компоновка
    const equipmentStructure = [
      { type: 'head', label: 'Голова', icon: '👑', allowedTypes: ['head'], row: 1, col: 2 },
      { type: 'weapon1', label: 'Оружие 1', icon: '⚔️', allowedTypes: ['weapon'], row: 2, col: 1 },
      { type: 'chest', label: 'Броня', icon: '🥋', allowedTypes: ['armor'], row: 2, col: 2 },
      { type: 'weapon2', label: 'Оружие 2', icon: '🛡️', allowedTypes: ['weapon', 'shield'], row: 2, col: 3 },
      { type: 'accessory1', label: 'Украшение 1', icon: '💍', allowedTypes: ['accessory'], row: 3, col: 1 },
      { type: 'gloves', label: 'Перчатки', icon: '🧤', allowedTypes: ['gloves'], row: 3, col: 2 },
      { type: 'accessory2', label: 'Украшение 2', icon: '📿', allowedTypes: ['accessory'], row: 3, col: 3 },
      { type: 'belt', label: 'Ремень', icon: '🎗️', allowedTypes: ['belt'], row: 4, col: 2 },
      { type: 'boots', label: 'Ботинки', icon: '👢', allowedTypes: ['boots'], row: 5, col: 2 }
    ];
    
    equipmentStructure.forEach((slotConfig, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot equipment-slot';
      slot.title = slotConfig.label;
      slot.setAttribute('data-type', 'equipment');
      slot.setAttribute('data-index', index);
      slot.setAttribute('data-slot-type', slotConfig.type);
      slot.setAttribute('data-allowed-types', slotConfig.allowedTypes.join(','));
      
      // Позиционируем слот в правильной ячейке сетки
      slot.style.gridRow = slotConfig.row;
      slot.style.gridColumn = slotConfig.col;
      
      // Добавляем иконку и подпись слота
      slot.innerHTML = `
        <div class="slot-icon">${slotConfig.icon}</div>
        <div class="slot-label">${slotConfig.label}</div>
      `;
      
      // Проверяем, есть ли предмет в этом слоте
      const item = gameState.inventory.equipment[index];
      if (item) {
        // Проверяем совместимость типа предмета со слотом
        if (this.isItemCompatibleWithSlot(item, slotConfig.allowedTypes)) {
          slot.classList.add('filled', item.rarity);
          
          // Создаем спрайт предмета
          const spriteElement = InventorySpriteRenderer.createSpriteElement(item, 48);
          if (spriteElement) {
            slot.innerHTML = '';
            slot.appendChild(spriteElement);
          } else {
            // Fallback на старый способ с эмодзи
            slot.innerHTML = `<div class="item-sprite" style="background:${item.color};font-size:2rem;display:flex;align-items:center;justify-content:center;">${item.icon||''}</div>`;
          }
          
          const tooltipText = `${item.name}\n${item.description}`;
          
          // Добавляем обработчики для тултипов
          slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
          slot.addEventListener('mouseleave', () => this.hideTooltip());
          slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
          
          // Настройка контекстного меню
          ContextMenuManager.setupSlotContextMenu(slot, item, 'equipment', index);
          this.setupDragDropForSlot(slot, 'equipment', index);
        } else {
          // Предмет несовместим со слотом - перемещаем в рюкзак
          
          // Находим свободное место в рюкзаке
          const backpackIndex = gameState.inventory.backpack.findIndex(slot => !slot);
          if (backpackIndex !== -1) {
            // Перемещаем предмет в рюкзак
            gameState.inventory.backpack[backpackIndex] = item;
            gameState.inventory.equipment[index] = null;
          } else {
            // Рюкзак полон - показываем предупреждение
            slot.classList.add('incompatible');
            slot.title = `Несовместимый предмет: ${item.name} (рюкзак полон)`;
          }
        }
      }
      
      equipmentSlots.appendChild(slot);
    });
    
    // Быстрые слоты для зелий - 3 слота
    quickSlotsContainer.innerHTML = '';
    
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
        
        // Создаем спрайт зелья
        const potionItem = { 
          base: potionType, 
          type: 'consumable', 
          rarity: 'common',
          name: name,
          icon: icon,
          color: color
        };
        const spriteElement = InventorySpriteRenderer.createSpriteElement(potionItem, 40);
        
        if (spriteElement) {
          slot.innerHTML = '';
          slot.appendChild(spriteElement);
          
          // Добавляем счетчик поверх спрайта
          const countElement = document.createElement('div');
          countElement.className = 'item-count';
          countElement.style.cssText = `
            position: absolute;
            bottom: -3px;
            right: -3px;
            background: ${color};
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 2px 4px;
            border-radius: 6px;
            min-width: 14px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.3);
          `;
          countElement.textContent = count;
          slot.appendChild(countElement);
        } else {
          // Fallback на старый способ с эмодзи
          slot.innerHTML = `
            <div class="item-sprite" style="background:${color};font-size:1.5rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${icon}</div>
            <div class="item-count" style="position:absolute;bottom:-2px;right:-2px;background:${color};color:white;font-size:10px;padding:1px 3px;border-radius:3px;min-width:12px;text-align:center;">${count}</div>
          `;
        }
        const tooltipText = `${name}\nКоличество: ${count}\nКлавиша: ${index + 1}`;
        
        // Добавляем обработчики для тултипов
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        
        // Обработчики событий настраиваются в setupMobileSlotEvents
        
        // Настройка контекстного меню
        ContextMenuManager.setupSlotContextMenu(slot, { name, type: 'consumable', base: potionType }, 'quickslot', index);
      } else {
        // Пустой слот
        slot.classList.add('empty');
        slot.innerHTML = `<div style="font-size:1.2rem;color:#888;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:bold;">${index + 1}</div>`;
        slot.title = `Быстрый слот ${index + 1} (перетащите сюда зелье)`;
      }
      
      // Настройка drag & drop для всех слотов
      this.setupDragDropForSlot(slot, 'quickslot', index);
      
      quickSlotsContainer.appendChild(slot);
    });
    
    // Слоты рюкзака - 42 слота (6x7 сетка)
    const backpackSize = 42; // 6 колонок x 7 строк
    
    // Расширяем массив рюкзака если нужно
    while (gameState.inventory.backpack.length < backpackSize) {
      gameState.inventory.backpack.push(null);
    }
    
    for (let index = 0; index < backpackSize; index++) {
      const item = gameState.inventory.backpack[index];
      const slot = document.createElement('div');
      slot.className = 'inventory-slot backpack-slot';
      slot.setAttribute('data-type', 'backpack');
      slot.setAttribute('data-index', index);
      
      if (item) {
        slot.classList.add('filled', item.rarity);
        
        // Создаем спрайт предмета
        const spriteElement = InventorySpriteRenderer.createSpriteElement(item, 48);
        if (spriteElement) {
          slot.innerHTML = '';
          slot.appendChild(spriteElement);
        } else {
          // Fallback на старый способ с эмодзи
          slot.innerHTML = `<div class="item-sprite" style="background:${item.color};font-size:2rem;display:flex;align-items:center;justify-content:center;">${item.icon||''}</div>`;
        }
        
        const tooltipText = `${item.name}\n${item.description}`;
        
        // Добавляем обработчики для тултипов
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltipText));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        
        // Настройка контекстного меню
        ContextMenuManager.setupSlotContextMenu(slot, item, 'backpack', index);
        this.setupDragDropForSlot(slot, 'backpack', index);
      }
      
      backpackSlots.appendChild(slot);
    }
  }

  // Функция проверки совместимости предмета со слотом
  static isItemCompatibleWithSlot(item, allowedTypes) {
    if (!item || !allowedTypes) return false;
    
    // Определяем тип предмета на основе его свойств
    let itemType = 'unknown';
    
    if (item.slot) {
      itemType = item.slot;
    } else if (item.type) {
      itemType = item.type;
    } else if (item.base) {
      // Определяем тип по базовому предмету
      const baseItem = BASE_ITEMS.find(bi => bi.base === item.base);
      if (baseItem) {
        itemType = baseItem.slot || baseItem.type;
      }
    }
    
    // Специальная обработка для мантии (robe) - она должна идти в слот armor
    if (item.base === 'robe') {
      itemType = 'armor';
    }
    
    // Специальная обработка для перчаток (gloves) - они должны идти в слот gloves
    if (item.base === 'gloves') {
      itemType = 'gloves';
    }
    
    const isCompatible = allowedTypes.includes(itemType);
    

    
    return isCompatible;
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
    
    if (!item) {
      return;
    }
    

    
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
    
    // Находим подходящий слот экипировки для предмета
    const equipmentStructure = [
      { type: 'head', allowedTypes: ['head'] },
      { type: 'weapon1', allowedTypes: ['weapon'] },
      { type: 'chest', allowedTypes: ['armor'] },
      { type: 'weapon2', allowedTypes: ['weapon', 'shield'] },
      { type: 'accessory1', allowedTypes: ['accessory'] },
      { type: 'gloves', allowedTypes: ['gloves'] },
      { type: 'accessory2', allowedTypes: ['accessory'] },
      { type: 'belt', allowedTypes: ['belt'] },
      { type: 'boots', allowedTypes: ['boots'] }
    ];
    
    // Ищем подходящий слот
    let targetSlot = -1;
    let emptySlot = -1;
    
    for (let i = 0; i < equipmentStructure.length; i++) {
      const slotConfig = equipmentStructure[i];
      const isCompatible = this.isItemCompatibleWithSlot(item, slotConfig.allowedTypes);
      const isOccupied = !!gameState.inventory.equipment[i];
      
      if (isCompatible) {
        // Если слот пустой, запоминаем его
        if (!isOccupied) {
          if (emptySlot === -1) {
            emptySlot = i;
          }
        } else {
          // Если слот занят, используем его для замены
          targetSlot = i;
          break;
        }
      }
    }
    
    // Если не нашли занятый слот, используем пустой
    if (targetSlot === -1) {
      targetSlot = emptySlot;
    }
    
    if (targetSlot === -1) {
      alert('Нет подходящего слота для этого предмета!');
      return;
    }
    

    
    const oldItem = gameState.inventory.equipment[targetSlot];
    
    // Меняем местами предметы
    gameState.inventory.equipment[targetSlot] = item;
    gameState.inventory.backpack[backpackIndex] = oldItem;
    

    
    // Применяем/убираем бонусы
    if (oldItem) this.removeItemBonuses(oldItem);
    this.applyItemBonuses(item);
    
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
    // console.log('applyItemBonuses:', item);
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
    
    // console.log('Player after applyItemBonuses:', {
    //   hp: gameState.player.hp,
    //   maxHp: gameState.player.maxHp,
    //   damage: gameState.player.damage,
    //   moveSpeed: gameState.player.moveSpeed,
    //   crit: gameState.player.crit,
    //   defense: gameState.player.defense,
    //   attackSpeed: gameState.player.attackSpeed,
    //   attackRadius: gameState.player.attackRadius
    // });
    
    // Логируем изменение maxHp отдельно
    if (item.bonus.maxHp) {
      // console.log(`💚 Max HP increased by ${item.bonus.maxHp} (current HP: ${gameState.player.hp}/${gameState.player.maxHp})`);
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
    // console.log('removeItemBonuses:', item);
    if (!gameState.player || !item.bonus) return;
    
    // Удаляем бонусы только для экипировки, не для банок
    if (item.type === 'consumable') {
      // console.log('Skipping removeItemBonuses for consumable item');
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
          // console.log(`💚 Max HP decreased by ${value} (current HP: ${gameState.player.hp}/${gameState.player.maxHp})`);
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
    // Настройка drag & drop для десктопа
    slot.draggable = true;
    
    // Настройка мобильных событий
    this.setupMobileSlotEvents(slot, type, index);
    
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
      dropSuccessful = false; // Сбрасываем флаг при начале перетаскивания
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('dragging');
      
      // Добавляем обработчик для отслеживания выхода за пределы инвентаря
      this.setupDragOutsideHandler();
    });
    
    slot.addEventListener('dragend', (e) => {
      slot.classList.remove('dragging');
      
      // Проверяем, был ли предмет выброшен за пределы инвентаря
      this.handleDragEnd(e);
      
      // Сбрасываем все переменные состояния
      draggedItem = null;
      draggedSlot = null;
      dropSuccessful = false;
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
        const success = this.handleDrop(draggedSlot, { type, index });
        if (success) {
          dropSuccessful = true; // Отмечаем успешное размещение
        }
      }
    });
  }

  static handleDrop(from, to) {
    if (from.type === to.type && from.index === to.index) {
      return false; // Неуспешное перемещение (тот же слот)
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
      return false; // Неуспешное перемещение (неподходящий тип предмета)
    }
    
    // Если перетаскиваем из быстрого слота в рюкзак или экипировку, очищаем быстрый слот
    if (from.type === 'quickslot' && (to.type === 'backpack' || to.type === 'equipment')) {
      gameState.inventory.quickSlots[from.index] = null;
      this.renderInventory();
      return true; // Успешное перемещение
    }
    
    if (to.type === 'quickslot' && fromItem && fromItem.type === 'consumable') {
      // Сохраняем тип зелья, а не конкретный предмет
      gameState.inventory.quickSlots[to.index] = fromItem.base;
      this.renderInventory();
      return true; // Успешное назначение зелья на быстрый слот
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
    
    // Перерисовываем инвентарь после обмена
    this.renderInventory();
    
    return true; // Успешный обмен предметами
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
    
    // Если предмет был успешно размещен в слоте, не показываем модалку удаления
    if (dropSuccessful) {
      dropSuccessful = false; // Сбрасываем флаг
      this.hideDeleteZone();
      if (this.dragOutsideHandler) {
        document.removeEventListener('dragover', this.dragOutsideHandler);
        this.dragOutsideHandler = null;
      }
      return;
    }
    
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
    
    // Показываем подтверждение удаления ТОЛЬКО если предмет действительно вынесен за пределы
    // и НЕ был успешно размещен в другом слоте
    if (isOutside) {
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
        background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
        color: #fff;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(231, 76, 60, 0.3);
        white-space: pre-line;
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        max-width: 250px;
        opacity: 0.98;
        transition: all 0.2s ease;
        display: none;
        border: 2px solid rgba(231, 76, 60, 0.4);
        backdrop-filter: blur(10px);
        line-height: 1.4;
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
    const y = event.clientY - 10; // Поднимаем тултип выше курсора
    
    // Проверяем, не выходит ли тултип за пределы экрана
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let finalX = x;
    let finalY = y;
    
    // Если тултип выходит за правый край экрана
    if (x + tooltipRect.width > windowWidth) {
      finalX = event.clientX - tooltipRect.width - 10;
    }
    
    // Если тултип выходит за верхний край экрана
    if (y - tooltipRect.height < 0) {
      finalY = event.clientY + 30; // Показываем под курсором
    }
    
    // Если тултип выходит за нижний край экрана
    if (y + tooltipRect.height > windowHeight) {
      finalY = windowHeight - tooltipRect.height - 10;
    }
    
    tooltipElement.style.left = finalX + 'px';
    tooltipElement.style.top = finalY + 'px';
  }

  static setupMobileSlotEvents(slot, type, index) {
    // Touch события для мобильного управления
    slot.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      touchStartTime = Date.now();
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchMoved = false;
      
      // Запускаем таймер для долгого нажатия
      longPressTimer = setTimeout(() => {
        if (!touchMoved) {
          this.handleLongPress(slot, type, index);
        }
      }, 500); // 500ms для долгого нажатия
    });

    slot.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX);
      const deltaY = Math.abs(touch.clientY - touchStartY);
      
      // Если палец сдвинулся больше чем на 10px, считаем что это перетаскивание
      if (deltaX > 10 || deltaY > 10) {
        touchMoved = true;
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        
        // Начинаем перетаскивание
        this.startMobileDrag(slot, type, index, e);
      }
    });

    slot.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      if (!touchMoved) {
        this.handleTap(slot, type, index);
      } else {
        // Завершаем перетаскивание
        this.endMobileDrag(e);
      }
    });
  }

  static handleLongPress(slot, type, index) {
    // Долгое нажатие - показываем контекстное меню
    
    let item;
    if (type === 'equipment') {
      item = gameState.inventory.equipment[index];
    } else if (type === 'backpack') {
      item = gameState.inventory.backpack[index];
    } else if (type === 'quickslot') {
      item = gameState.inventory.quickSlots[index];
    }
    
    if (item) {
      // Создаем фейковое событие для контекстного меню
      const fakeEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: slot.getBoundingClientRect().left + slot.offsetWidth / 2,
        clientY: slot.getBoundingClientRect().top + slot.offsetHeight / 2
      };
      
      // Показываем контекстное меню
      ContextMenuManager.showContextMenu(fakeEvent, item, type, index);
    }
  }

  static handleTap(slot, type, index) {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    const isSameSlot = lastClickSlot === `${type}-${index}`;
    
    if (timeDiff < 300 && isSameSlot) {
      // Двойной клик - используем/надеваем/снимаем предмет
      this.handleDoubleTap(slot, type, index);
      lastClickTime = 0;
      lastClickSlot = null;
    } else {
      // Один клик - показываем описание
      this.handleSingleTap(slot, type, index);
      lastClickTime = currentTime;
      lastClickSlot = `${type}-${index}`;
    }
  }

  static handleSingleTap(slot, type, index) {
    // Один клик - показываем описание предмета
    let item;
    if (type === 'equipment') {
      item = gameState.inventory.equipment[index];
    } else if (type === 'backpack') {
      item = gameState.inventory.backpack[index];
    } else if (type === 'quickslot') {
      item = gameState.inventory.quickSlots[index];
    }
    
    if (item) {
      const tooltipText = `${item.name}\n${item.description}`;
      const rect = slot.getBoundingClientRect();
      this.showTooltip({ 
        clientX: rect.left + rect.width / 2, 
        clientY: rect.top - 10 
      }, tooltipText);
      
      // Скрываем тултип через 3 секунды
      setTimeout(() => {
        this.hideTooltip();
      }, 3000);
    }
  }

  static handleDoubleTap(slot, type, index) {
    // Двойной клик - используем/надеваем/снимаем предмет
    
    if (type === 'equipment') {
      this.unequipItem(index);
    } else if (type === 'backpack') {
      this.equipItem(index);
    } else if (type === 'quickslot') {
      // Для быстрых слотов используем зелье
      (async () => {
        const { GameEngine } = await import('../game/GameEngine.js');
        GameEngine.useQuickPotion(index);
      })();
    }
  }

  static startMobileDrag(slot, type, index, e) {
    // Начинаем перетаскивание на мобильном
    let item;
    if (type === 'equipment') {
      item = gameState.inventory.equipment[index];
    } else if (type === 'backpack') {
      item = gameState.inventory.backpack[index];
    } else if (type === 'quickslot') {
      item = gameState.inventory.quickSlots[index];
    }
    
    if (item) {
      // Очищаем предыдущие элементы перетаскивания
      this.removeAllDragElements();
      
      draggedItem = item;
      draggedSlot = { type, index };
      dropSuccessful = false;
      slot.classList.add('dragging');
      
      // Создаем визуальный элемент для перетаскивания
      this.createMobileDragElement(item, e);
    }
  }

  static endMobileDrag(e) {
    // Завершаем перетаскивание на мобильном
    this.removeAllDragElements();
    
    // Находим слот под пальцем
    const touch = e.changedTouches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetSlot = elementUnderTouch?.closest('.inventory-slot');
    
    if (targetSlot && draggedItem && draggedSlot) {
      const targetType = targetSlot.getAttribute('data-type');
      const targetIndex = parseInt(targetSlot.getAttribute('data-index'));
      
      if (targetType && targetIndex !== undefined) {
        // Проверяем, что это не тот же слот
        if (!(draggedSlot.type === targetType && draggedSlot.index === targetIndex)) {
          const success = this.handleDrop(draggedSlot, { type: targetType, index: targetIndex });
          if (success) {
            // Обновляем быстрые слоты в UI
            (async () => {
              const { GameEngine } = await import('../game/GameEngine.js');
              GameEngine.updateQuickPotions();
            })();
          }
        }
      }
    }
    
    // Очищаем состояние
    document.querySelectorAll('.inventory-slot').forEach(slot => {
      slot.classList.remove('dragging');
      slot.classList.remove('drag-over');
    });
    draggedItem = null;
    draggedSlot = null;
    dropSuccessful = false;
  }

  static createMobileDragElement(item, e) {
    // Удаляем старые элементы перетаскивания
    this.removeAllDragElements();
    
    // Создаем визуальный элемент для перетаскивания
    const dragElement = document.createElement('div');
    dragElement.className = 'mobile-drag-element';
    dragElement.style.cssText = `
      position: fixed;
      top: ${e.touches[0].clientY - 25}px;
      left: ${e.touches[0].clientX - 25}px;
      width: 50px;
      height: 50px;
      background: ${item.color || '#666'};
      border: 2px solid #fff;
      border-radius: 8px;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    // Используем только спрайты, никаких эмоджи
    if (item.sprite) {
      dragElement.innerHTML = `<img src="${item.sprite}" style="width: 100%; height: 100%; object-fit: contain;">`;
    } else {
      // Создаем простой цветной квадрат вместо эмоджи
      dragElement.style.background = item.color || '#666';
      dragElement.style.border = '2px solid #fff';
    }
    
    document.body.appendChild(dragElement);
    
    // Обновляем позицию при движении пальца
    const updatePosition = (e) => {
      if (dragElement && dragElement.parentNode) {
        const touch = e.touches[0];
        dragElement.style.top = `${touch.clientY - 25}px`;
        dragElement.style.left = `${touch.clientX - 25}px`;
      }
    };
    
    const removeElement = () => {
      if (dragElement && dragElement.parentNode) {
        dragElement.remove();
      }
      document.removeEventListener('touchmove', updatePosition);
      document.removeEventListener('touchend', removeElement);
      document.removeEventListener('touchcancel', removeElement);
    };
    
    document.addEventListener('touchmove', updatePosition, { passive: false });
    document.addEventListener('touchend', removeElement, { once: true });
    document.addEventListener('touchcancel', removeElement, { once: true });
  }

  static removeAllDragElements() {
    // Удаляем все элементы перетаскивания
    const dragElements = document.querySelectorAll('.mobile-drag-element');
    dragElements.forEach(element => {
      if (element && element.parentNode) {
        element.remove();
      }
    });
  }
} 