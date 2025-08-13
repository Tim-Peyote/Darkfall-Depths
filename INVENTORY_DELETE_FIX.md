# Исправление бага удаления предметов в инвентаре

## Проблема
При удалении предметов через контекстное меню предмет оставался в инвентаре после подтверждения удаления, в то время как удаление через drag & drop работало корректно.

## Причина бага
1. **Старая логика в `InventoryManager.js`**: Методы `deleteEquipItem()` и `deleteBackpackItem()` использовали `confirm()` вместо нового popup'а
2. **Неправильные вызовы в `ContextMenuManager.js`**: Использовался `window.InventoryManager` вместо прямого импорта модуля
3. **Отсутствие обновления UI**: После удаления через контекстное меню не вызывался `renderInventory()`

## Исправления

### 1. InventoryManager.js
```javascript
// Было:
static deleteBackpackItem(index) {
  const item = gameState.inventory.backpack[index];
  if (item && confirm(`Удалить предмет "${item.name}"?`)) {
    gameState.inventory.backpack[index] = null;
    this.renderInventory();
  }
}

// Стало:
static deleteBackpackItem(index) {
  const item = gameState.inventory.backpack[index];
  if (item) {
    gameState.inventory.backpack[index] = null;
    this.renderInventory();
  }
}
```

### 2. ContextMenuManager.js
```javascript
// Было:
static deleteItem() {
  if (!currentItem || !currentSlot) return;
  
  if (window.InventoryManager) {
    if (currentSlot.type === 'equipment') {
      window.InventoryManager.deleteEquipItem(currentSlot.index);
    } else {
      window.InventoryManager.deleteBackpackItem(currentSlot.index);
    }
  }
}

// Стало:
static deleteItem() {
  if (!currentItem || !currentSlot) return;
  
  import('../ui/InventoryManager.js').then(({ InventoryManager }) => {
    if (currentSlot.type === 'equipment') {
      InventoryManager.deleteEquipItem(currentSlot.index);
    } else {
      InventoryManager.deleteBackpackItem(currentSlot.index);
    }
  });
}
```

## Результат
- ✅ Оба способа удаления (drag & drop и контекстное меню) теперь работают одинаково
- ✅ Предметы корректно удаляются из инвентаря после подтверждения
- ✅ UI обновляется после удаления
- ✅ Используется единый popup подтверждения для обоих способов

## Тестирование
Исправление протестировано в реальной игре:
- Удаление через контекстное меню (правый клик / долгое нажатие)
- Удаление через drag & drop (перетаскивание за пределы инвентаря)
- Проверка корректного обновления UI

## Файлы
- `js/ui/InventoryManager.js` - Исправлены методы удаления
- `js/ui/ContextMenuManager.js` - Исправлены вызовы методов
- `INVENTORY_DELETE_FIX.md` - Документация исправления
