/* Darkfall Depths - Отрисовка спрайтов предметов в инвентаре */

export class InventorySpriteRenderer {
  static canvas = null;
  static ctx = null;
  static spriteCache = new Map();
  
  static init() {
    // Создаем скрытый canvas для рендеринга спрайтов
    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d');
    
    // Предварительно рендерим все базовые спрайты
    this.preRenderSprites();
  }
  
  static preRenderSprites() {
    // Очищаем кэш
    this.spriteCache.clear();
    
    // Рендерим все базовые предметы
    const baseItems = [
      'sword', 'axe', 'shield', 'staff', 'wand', 'dagger', 'crossbow',
      'robe', 'leather', 'plate', 'helmet', 'hood', 'cap', 'gloves', 'belt', 'boots',
      'amulet', 'ring',
      'potion', 'speed_potion', 'strength_potion', 'defense_potion', 'regen_potion', 'combo_potion', 'purification_potion', 'mystery_potion',
      // Свитки
      'scroll_werewolf', 'scroll_stone', 'scroll_ghost', 'scroll_fire_explosion', 'scroll_ice_storm', 'scroll_lightning', 'scroll_earthquake', 'scroll_clone', 'scroll_teleport', 'scroll_invisibility', 'scroll_time', 'scroll_curse', 'scroll_chaos', 'scroll_fear', 'scroll_smoke', 'scroll_meteor', 'scroll_barrier', 'scroll_rage', 'scroll_invulnerability', 'scroll_vampirism', 'mystery_scroll'
    ];
    
    baseItems.forEach(base => {
      this.spriteCache.set(base, this.renderItemSprite(base));
    });
  }
  
  static renderItemSprite(base, rarity = 'common', size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Очищаем canvas
    ctx.clearRect(0, 0, size, size);
    
    // Центр canvas
    const centerX = size / 2;
    const centerY = size / 2;
    const itemSize = size * 0.6;
    
    // Определяем цвет предмета
    let color = '#95a5a6'; // базовый серый
    switch (base) {
      case 'sword': color = '#e67e22'; break;
      case 'axe': color = '#b87333'; break;
      case 'shield': color = '#95a5a6'; break;
      case 'staff': color = '#8e44ad'; break;
      case 'wand': color = '#9b59b6'; break;
      case 'dagger': color = '#27ae60'; break;
      case 'crossbow': color = '#34495e'; break;
      case 'robe': color = '#6c3483'; break;
      case 'leather': color = '#d35400'; break;
      case 'plate': color = '#7f8c8d'; break;
      case 'helmet': color = '#95a5a6'; break;
      case 'hood': color = '#6c3483'; break;
      case 'cap': color = '#34495e'; break;
      case 'gloves': color = '#95a5a6'; break;
      case 'belt': color = '#d35400'; break;
      case 'boots': color = '#8b4513'; break;
      case 'amulet': color = '#f39c12'; break;
      case 'ring': color = '#e67e22'; break;
      case 'potion': color = '#e74c3c'; break;
      case 'speed_potion': color = '#3498db'; break;
      case 'strength_potion': color = '#e67e22'; break;
      case 'defense_potion': color = '#95a5a6'; break;
      case 'regen_potion': color = '#27ae60'; break;
      case 'combo_potion': color = '#9b59b6'; break;
      case 'purification_potion': color = '#f39c12'; break;
      case 'mystery_potion': color = '#8e44ad'; break;
      // Свитки
      case 'scroll_werewolf': color = '#8b4513'; break;
      case 'scroll_stone': color = '#7f8c8d'; break;
      case 'scroll_ghost': color = '#ecf0f1'; break;
      case 'scroll_fire_explosion': color = '#e74c3c'; break;
      case 'scroll_ice_storm': color = '#3498db'; break;
      case 'scroll_lightning': color = '#f1c40f'; break;
      case 'scroll_earthquake': color = '#8b4513'; break;
      case 'scroll_clone': color = '#9b59b6'; break;
      case 'scroll_teleport': color = '#e67e22'; break;
      case 'scroll_invisibility': color = '#95a5a6'; break;
      case 'scroll_time': color = '#34495e'; break;
      case 'scroll_curse': color = '#2c3e50'; break;
      case 'scroll_chaos': color = '#e74c3c'; break;
      case 'scroll_fear': color = '#8e44ad'; break;
      case 'scroll_smoke': color = '#7f8c8d'; break;
      case 'scroll_meteor': color = '#e67e22'; break;
      case 'scroll_barrier': color = '#3498db'; break;
      case 'scroll_rage': color = '#e74c3c'; break;
      case 'scroll_invulnerability': color = '#f1c40f'; break;
      case 'scroll_vampirism': color = '#8e44ad'; break;
      case 'mystery_scroll': color = '#8e44ad'; break;
    }
    
    // Рисуем предмет в зависимости от типа
    if (['sword', 'axe', 'staff', 'wand', 'dagger', 'crossbow'].includes(base)) {
      this.renderWeaponSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['shield', 'robe', 'leather', 'plate'].includes(base)) {
      this.renderArmorSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['helmet', 'hood', 'cap'].includes(base)) {
      this.renderHeadSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['gloves'].includes(base)) {
      this.renderGlovesSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['belt'].includes(base)) {
      this.renderBeltSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['boots'].includes(base)) {
      this.renderBootsSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (['amulet', 'ring'].includes(base)) {
      this.renderAccessorySprite(ctx, centerX, centerY, itemSize, base, color, rarity);
    } else if (['potion', 'speed_potion', 'strength_potion', 'defense_potion', 'regen_potion', 'combo_potion', 'purification_potion', 'mystery_potion'].includes(base)) {
      this.renderConsumableSprite(ctx, centerX, centerY, itemSize, base, color);
    } else if (base && base.startsWith('scroll_')) {
      this.renderScrollSprite(ctx, centerX, centerY, itemSize, base, color);
    }
    
    return canvas;
  }
  
  static renderWeaponSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    switch (base) {
      case 'sword':
        // Меч
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.4);
        ctx.lineTo(x + size * 0.3, y + size * 0.4);
        ctx.stroke();
        
        // Дополнительная линия для объема
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = size * 0.04;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.35);
        ctx.lineTo(x + size * 0.25, y + size * 0.35);
        ctx.stroke();
        
        // Рукоять
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.12, size * 0.24, size * 0.24);
        
        // Детали рукояти
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - size * 0.12, y - size * 0.12, size * 0.24, size * 0.24);
        break;
        
      case 'axe':
        // Топор
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка топора
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Рукоять
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.08, y - size * 0.15, size * 0.16, size * 0.3);
        
        // Детали рукояти
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - size * 0.08, y - size * 0.15, size * 0.16, size * 0.3);
        break;
        
      case 'staff':
        // Посох
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.2, y + size * 0.4);
        ctx.stroke();
        
        // Кристалл
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.4, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'wand':
        // Жезл
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = size * 0.06;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.3);
        ctx.lineTo(x + size * 0.15, y + size * 0.3);
        ctx.stroke();
        
        // Звезда
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'dagger':
        // Кинжал
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = size * 0.04;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y - size * 0.3);
        ctx.lineTo(x + size * 0.2, y + size * 0.3);
        ctx.stroke();
        
        // Рукоять
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.05, y - size * 0.05, size * 0.1, size * 0.1);
        break;
        
      case 'crossbow':
        // Арбалет
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = size * 0.06;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Стрела
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = size * 0.04;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.2, y);
        ctx.lineTo(x + size * 0.2, y);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }
  
  static renderArmorSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    switch (base) {
      case 'shield':
        // Щит
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.3, y - size * 0.4, size * 0.6, size * 0.8);
        
        // Металлическая окантовка
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.3, y - size * 0.4, size * 0.6, size * 0.8);
        break;
        
      case 'robe':
        // Мантия
        ctx.fillStyle = '#6c3483';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Капюшон
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.2, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'leather':
        // Кожаная броня
        ctx.fillStyle = '#d35400';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Застежки
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.1, y - size * 0.2, size * 0.2, size * 0.1);
        break;
        
      case 'plate':
        // Латная броня
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Металлические пластины
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Детали лат
        ctx.fillStyle = '#95a5a6';
        // Горизонтальные пластины
        for (let i = 0; i < 3; i++) {
          const yPos = y - size * 0.2 + i * size * 0.2;
          ctx.fillRect(x - size * 0.3, yPos - size * 0.05, size * 0.6, size * 0.1);
        }
        
        // Вертикальные застежки
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.05, y - size * 0.3, size * 0.1, size * 0.6);
        break;
    }
    
    ctx.restore();
  }
  
  static renderAccessorySprite(ctx, x, y, size, base, color, rarity) {
    ctx.save();
    
    switch (base) {
      case 'amulet':
        // Амулет - подвеска с камнем
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = size * 0.06;
        
        // Цепочка
        ctx.beginPath();
        ctx.arc(x, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Подвеска
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка подвески
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = size * 0.04;
        ctx.stroke();
        
        // Камень (цвет зависит от редкости)
        let amuletGemColor = '#f39c12'; // оранжевый по умолчанию
        if (rarity === 'rare') amuletGemColor = '#3498db'; // синий
        if (rarity === 'epic') amuletGemColor = '#9b59b6'; // фиолетовый
        if (rarity === 'legendary') amuletGemColor = '#e74c3c'; // красный
        
        ctx.fillStyle = amuletGemColor;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Блеск камня
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - size * 0.06, y - size * 0.06, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'ring':
        // Кольцо - металлическое с камнем
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = size * 0.08;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Внутренняя часть кольца
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = size * 0.04;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Камень (цвет зависит от редкости)
        let gemColor = '#e67e22'; // оранжевый по умолчанию
        if (rarity === 'rare') gemColor = '#3498db'; // синий
        if (rarity === 'epic') gemColor = '#9b59b6'; // фиолетовый
        if (rarity === 'legendary') gemColor = '#e74c3c'; // красный
        
        ctx.fillStyle = gemColor;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Блеск камня
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - size * 0.05, y - size * 0.05, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  static renderConsumableSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    switch (base) {
      case 'potion':
        // Зелье здоровья
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.45, size * 0.24, size * 0.1);
        
        // Пузырьки
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          const bubbleX = x - size * 0.15 + (i * size * 0.15);
          const bubbleY = y - size * 0.2 + (i * size * 0.05);
          const bubbleSize = size * 0.04;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'speed_potion':
        // Зелье скорости
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#3388cc';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.45, size * 0.24, size * 0.1);
        
        // Искры скорости
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 2; i++) {
          const sparkX = x - size * 0.1 + (i * size * 0.2);
          const sparkY = y + (i * size * 0.1);
          ctx.fillRect(sparkX, sparkY, 2, 2);
        }
        break;
        
      case 'strength_potion':
        // Зелье силы
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.1, y - size * 0.4, size * 0.2, size * 0.1);
        break;
        
      case 'defense_potion':
        // Зелье защиты
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.1, y - size * 0.4, size * 0.2, size * 0.1);
        break;
        
      case 'regen_potion':
        // Зелье регенерации
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.6);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.1, y - size * 0.4, size * 0.2, size * 0.1);
        break;
        
      case 'combo_potion':
        // Комплексное зелье - градиент
        const gradient = ctx.createLinearGradient(x - size * 0.25, y - size * 0.35, x + size * 0.25, y + size * 0.35);
        gradient.addColorStop(0, '#9b59b6');
        gradient.addColorStop(0.3, '#e74c3c');
        gradient.addColorStop(0.7, '#3498db');
        gradient.addColorStop(1, '#27ae60');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.45, size * 0.24, size * 0.1);
        
        // Частицы
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
          const particleX = x + Math.cos(i * Math.PI / 2) * size * 0.15;
          const particleY = y + Math.sin(i * Math.PI / 2) * size * 0.15;
          ctx.fillRect(particleX, particleY, 2, 2);
        }
        break;
        
      case 'purification_potion':
        // Зелье очищения - золотое с эффектом очищения
        // Основная бутылка
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.45, size * 0.24, size * 0.1);
        
        // Эффект очищения - звездочки
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
          const starX = x - size * 0.2 + (i * size * 0.1);
          const starY = y - size * 0.2 + (i * size * 0.05);
          const starSize = size * 0.03;
          
          // Рисуем звездочку
          ctx.beginPath();
          ctx.moveTo(starX, starY - starSize);
          ctx.lineTo(starX + starSize * 0.3, starY - starSize * 0.3);
          ctx.lineTo(starX + starSize, starY);
          ctx.lineTo(starX + starSize * 0.3, starY + starSize * 0.3);
          ctx.lineTo(starX, starY + starSize);
          ctx.lineTo(starX - starSize * 0.3, starY + starSize * 0.3);
          ctx.lineTo(starX - starSize, starY);
          ctx.lineTo(starX - starSize * 0.3, starY - starSize * 0.3);
          ctx.closePath();
          ctx.fill();
        }
        
        // Дополнительный эффект - сияние
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y, size * (0.3 + i * 0.1), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        break;
        
      case 'mystery_potion':
        // Тайная банка - загадочная с эффектами
        // Основная бутылка с градиентом
        const mysteryGradient = ctx.createLinearGradient(x - size * 0.25, y - size * 0.35, x + size * 0.25, y + size * 0.35);
        mysteryGradient.addColorStop(0, '#8e44ad');
        mysteryGradient.addColorStop(0.3, '#9b59b6');
        mysteryGradient.addColorStop(0.7, '#6c3483');
        mysteryGradient.addColorStop(1, '#4a235a');
        ctx.fillStyle = mysteryGradient;
        ctx.fillRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Обводка зелья
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - size * 0.25, y - size * 0.35, size * 0.5, size * 0.7);
        
        // Горлышко
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - size * 0.12, y - size * 0.45, size * 0.24, size * 0.1);
        
        // Загадочные символы внутри
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 3; i++) {
          const symbolX = x - size * 0.15 + (i * size * 0.15);
          const symbolY = y - size * 0.1 + (i * size * 0.1);
          const symbolSize = size * 0.08;
          
          // Рисуем загадочные символы (вопросительные знаки)
          ctx.font = `${symbolSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', symbolX, symbolY);
        }
        ctx.globalAlpha = 1.0;
        
        // Эффект таинственности - мерцающие частицы
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 6; i++) {
          const particleX = x + Math.cos(i * Math.PI / 3) * size * 0.2;
          const particleY = y + Math.sin(i * Math.PI / 3) * size * 0.2;
          const particleSize = size * 0.02;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        
        // Дополнительная обводка для эффекта
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x - size * 0.3, y - size * 0.4, size * 0.6, size * 0.8);
        ctx.globalAlpha = 1.0;
        break;
    }
    
    ctx.restore();
  }
  
  static renderHeadSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    switch (base) {
      case 'helmet':
        // Шлем
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        // Обод шлема
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'hood':
        // Капюшон
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Складки капюшона
        ctx.strokeStyle = '#4a235a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y, size * (0.2 + i * 0.1), 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        
      case 'cap':
        // Кепка
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Козырек
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x - size * 0.3, y - size * 0.1, size * 0.6, size * 0.1);
        break;
        
      default:
        // Общий головной убор
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  }
  
  static renderGlovesSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    // Перчатки - две руки
    ctx.fillStyle = color;
    
    // Левая перчатка
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Правая перчатка
    ctx.beginPath();
    ctx.arc(x + size * 0.2, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  
  static renderBeltSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    // Пояс - горизонтальная полоса
    ctx.fillStyle = color;
    ctx.fillRect(x - size * 0.4, y - size * 0.1, size * 0.8, size * 0.2);
    
    // Пряжка
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - size * 0.05, y - size * 0.08, size * 0.1, size * 0.16);
    
    // Обводка
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - size * 0.4, y - size * 0.1, size * 0.8, size * 0.2);
    
    ctx.restore();
  }
  
  static renderBootsSprite(ctx, x, y, size, base, color) {
    ctx.save();
    
    // Ботинки - две ноги
    ctx.fillStyle = color;
    
    // Левый ботинок
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, y + size * 0.1, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Правый ботинок
    ctx.beginPath();
    ctx.ellipse(x + size * 0.2, y + size * 0.1, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  
     static renderScrollSprite(ctx, x, y, size, base, color) {
     ctx.save();
     
     // Основной свиток - пергамент
     ctx.fillStyle = '#f5f5dc'; // Бежевый цвет пергамента
     ctx.fillRect(x - size * 0.3, y - size * 0.2, size * 0.6, size * 0.4);
     
     // Обводка свитка
     ctx.strokeStyle = '#8b4513'; // Коричневая обводка
     ctx.lineWidth = 2;
     ctx.strokeRect(x - size * 0.3, y - size * 0.2, size * 0.6, size * 0.4);
     
     // Внутренние линии пергамента
     ctx.strokeStyle = '#d2b48c';
     ctx.lineWidth = 1;
     for (let i = 0; i < 3; i++) {
       const lineY = y - size * 0.15 + (i * size * 0.1);
       ctx.beginPath();
       ctx.moveTo(x - size * 0.25, lineY);
       ctx.lineTo(x + size * 0.25, lineY);
       ctx.stroke();
     }
     
     // Магические символы в зависимости от типа свитка
     ctx.fillStyle = color;
     ctx.font = `${size * 0.15}px Arial`;
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     
     let symbol = '📜';
     switch (base) {
       case 'scroll_werewolf': symbol = '🐺'; break;
       case 'scroll_stone': symbol = '🗿'; break;
       case 'scroll_ghost': symbol = '👻'; break;
       case 'scroll_fire_explosion': symbol = '🔥'; break;
       case 'scroll_ice_storm': symbol = '❄️'; break;
       case 'scroll_lightning': symbol = '⚡'; break;
       case 'scroll_earthquake': symbol = '🌋'; break;
       case 'scroll_clone': symbol = '👥'; break;
       case 'scroll_teleport': symbol = '🌀'; break;
       case 'scroll_invisibility': symbol = '👁️'; break;
       case 'scroll_time': symbol = '⏰'; break;
       case 'scroll_curse': symbol = '💀'; break;
       case 'scroll_chaos': symbol = '🎭'; break;
       case 'scroll_fear': symbol = '😱'; break;
       case 'scroll_smoke': symbol = '💨'; break;
       case 'scroll_meteor': symbol = '☄️'; break;
       case 'scroll_barrier': symbol = '🛡️'; break;
       case 'scroll_rage': symbol = '😡'; break;
       case 'scroll_invulnerability': symbol = '💎'; break;
       case 'scroll_vampirism': symbol = '🦇'; break;
       case 'mystery_scroll': symbol = '❓'; break;
     }
     
     // Символ в центре
     ctx.fillText(symbol, x, y);
     
     // Магические частицы вокруг свитка
     ctx.fillStyle = color;
     ctx.globalAlpha = 0.6;
     for (let i = 0; i < 4; i++) {
       const angle = (i / 4) * Math.PI * 2;
       const particleX = x + Math.cos(angle) * size * 0.4;
       const particleY = y + Math.sin(angle) * size * 0.4;
       const particleSize = size * 0.02;
       
       ctx.fillRect(particleX - particleSize, particleY - particleSize, particleSize * 2, particleSize * 2);
     }
     ctx.globalAlpha = 1.0;
     
          ctx.restore();
   }
  
  static getItemSprite(item) {
    if (!item) return null;
    
    const base = item.base;
    const rarity = item.rarity || 'common';
    
    // Проверяем кэш
    const cacheKey = `${base}_${rarity}`;
    if (this.spriteCache.has(cacheKey)) {
      return this.spriteCache.get(cacheKey);
    }
    
    // Рендерим новый спрайт
    const sprite = this.renderItemSprite(base, rarity);
    this.spriteCache.set(cacheKey, sprite);
    
    return sprite;
  }
  
  static createSpriteElement(item, size = 64) {
    const sprite = this.getItemSprite(item);
    if (!sprite) return null;
    
    const img = document.createElement('img');
    img.src = sprite.toDataURL();
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.objectFit = 'contain';
    
    return img;
  }
}
