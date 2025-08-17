/* Darkfall Depths - Константы и игровые данные */

// ==================== КОНСТАНТЫ И НАСТРОЙКИ ====================
export const TILE_SIZE = 32;
export const MAP_SIZE = 60; // было 50
export const ROOM_MIN_SIZE = 8; // было 6
export const ROOM_MAX_SIZE = 16; // было 12
export const MIN_ROOMS = 10; // было 8
export const MAX_ROOMS = 15; // было 12
export const FPS_TARGET = 120; // Увеличили с 60 до 120 FPS для лучшей производительности
export const FRAME_TIME = 1000 / FPS_TARGET;

// Проверка на тач устройство
export const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// ==================== ИГРОВЫЕ ДАННЫЕ ====================
// Принудительное обновление кеша - $(date)
export const CHARACTERS = [
  {
    id: 'dimon',
    name: 'Dimon',
    class: 'mage',
    description: 'Маг дальнего боя с автонацеливанием снарядов',
    hp: 80,
    maxHp: 80,
    damage: 15,
    moveSpeed: 70,
    attackSpeed: 1.2,
    attackRadius: 200,
    defense: 2,
    crit: 5,
    type: 'ranged',
    projectileSpeed: 300,
    color: '#9b59b6',
    sprite: '🔮',
    // Уникальная способность: Взрывная волна
    hasBlast: true,
    blastCooldown: 12.0,
    blastRadius: 120,
    blastDamage: 40
  },
  {
    id: 'andre',
    name: 'Andre',
    class: 'warrior',
    description: 'Мощный воин ближнего боя с высокими HP и защитой',
    hp: 140,
    maxHp: 140,
    damage: 18,
    moveSpeed: 75,
    attackSpeed: 1.0,
    attackRadius: 64,
    defense: 8,
    crit: 0,
    type: 'melee',
    color: '#e74c3c',
    sprite: '⚔️',
    // Уникальная способность: Щит
    hasShield: true,
    shieldCooldown: 8.0,
    shieldDuration: 4.0,
    shieldDefenseBonus: 15
  },
  {
    id: 'tim',
    name: 'Tim',
    class: 'rogue',
    description: 'Быстрый разбойник с dash способностью',
    hp: 85,
    maxHp: 85,
    damage: 25,
    moveSpeed: 110,
    attackSpeed: 0.7,
    attackRadius: 56,
    defense: 2,
    crit: 15,
    type: 'melee',
    hasDash: true,
    dashCooldown: 3.0,
    dashDistance: 80,
    color: '#27ae60',
    sprite: '🗡️'
  }
];

export const ENEMY_TYPES = [
  { 
    type: 'Skeleton', 
    hp: 30, 
    damage: 18, 
    speed: 60, 
    attackRange: 48, 
    color: '#bdc3c7', 
    reward: 10,
    sprite: '💀'
  },
  { 
    type: 'Skeleton Archer', 
    hp: 25, 
    damage: 15, 
    speed: 55, 
    attackRange: 180, 
    color: '#95a5a6', 
    reward: 15,
    sprite: '🏹',
    projectileSpeed: 250,
    hasBow: true
  },
  { 
    type: 'Dark Mage', 
    hp: 25, 
    damage: 12, 
    speed: 45, 
    attackRange: 150, 
    color: '#8e44ad', 
    reward: 15,
    sprite: '🧙‍♂️',
    projectileSpeed: 200
  },
  { 
    type: 'Frost Mage', 
    hp: 30, 
    damage: 10, 
    speed: 40, 
    attackRange: 160, 
    color: '#3498db', 
    reward: 20,
    sprite: '❄️',
    projectileSpeed: 180,
    canFreeze: true,
    freezeChance: 0.3,
    freezeDuration: 3.0
  },
  { 
    type: 'Poison Spitter', 
    hp: 35, 
    damage: 8, 
    speed: 50, 
    attackRange: 140, 
    color: '#27ae60', 
    reward: 18,
    sprite: '🦎',
    projectileSpeed: 150,
    canPoison: true,
    poisonChance: 0.4,
    poisonDamage: 5,
    poisonDuration: 8.0
  },
  { 
    type: 'Stun Warrior', 
    hp: 45, 
    damage: 20, 
    speed: 55, 
    attackRange: 48, 
    color: '#f39c12', 
    reward: 22,
    sprite: '⚡',
    canStun: true,
    stunChance: 0.25,
    stunDuration: 2.5
  },
  { 
    type: 'Orc Warrior', 
    hp: 45, 
    damage: 22, 
    speed: 50, 
    attackRange: 48, 
    color: '#27ae60', 
    reward: 20,
    sprite: '👹'
  },
  { 
    type: 'Shadow Assassin', 
    hp: 35, 
    damage: 25, 
    speed: 80, 
    attackRange: 48, 
    color: '#2c3e50', 
    reward: 25,
    sprite: '👤',
    levelRequirement: 5
  },
  { 
    type: 'Demon Lord', 
    hp: 80, 
    damage: 35, 
    speed: 40, 
    attackRange: 200, 
    color: '#e74c3c', 
    reward: 50,
    sprite: '👿',
    projectileSpeed: 250,
    levelRequirement: 10
  },
  { 
    type: 'Ancient Guardian', 
    hp: 120, 
    damage: 30, 
    speed: 35, 
    attackRange: 48, 
    color: '#f39c12', 
    reward: 40,
    sprite: '🛡️',
    levelRequirement: 8
  },
  { 
    type: 'Void Wraith', 
    hp: 50, 
    damage: 28, 
    speed: 70, 
    attackRange: 120, 
    color: '#9b59b6', 
    reward: 35,
    sprite: '👻',
    levelRequirement: 6,
    projectileSpeed: 220,
    canTeleport: true,
    teleportChance: 0.15
  },
  { 
    type: 'Crystal Golem', 
    hp: 90, 
    damage: 32, 
    speed: 30, 
    attackRange: 48, 
    color: '#e67e22', 
    reward: 45,
    sprite: '💎',
    levelRequirement: 7,
    canReflect: true,
    reflectChance: 0.2
  }
];

// ==================== СИСТЕМА ПРЕДМЕТОВ ====================
export const BASE_ITEMS = [
  // Оружие
  { base: 'sword', name: 'Меч', class: 'warrior', icon: '⚔️', color: '#e67e22', type: 'weapon', slot: 'weapon', minRadius: 56, maxRadius: 72 },
  { base: 'axe', name: 'Топор', class: 'warrior', icon: '🪓', color: '#b87333', type: 'weapon', slot: 'weapon', minRadius: 56, maxRadius: 72 },
  { base: 'staff', name: 'Посох', class: 'mage', icon: '🪄', color: '#8e44ad', type: 'weapon', slot: 'weapon', minRadius: 120, maxRadius: 180 },
  { base: 'wand', name: 'Жезл', class: 'mage', icon: '✨', color: '#9b59b6', type: 'weapon', slot: 'weapon', minRadius: 100, maxRadius: 160 },
  { base: 'dagger', name: 'Кинжал', class: 'rogue', icon: '🗡️', color: '#27ae60', type: 'weapon', slot: 'weapon', minRadius: 40, maxRadius: 56 },
  { base: 'crossbow', name: 'Арбалет', class: 'rogue', icon: '🏹', color: '#34495e', type: 'weapon', slot: 'weapon', minRadius: 80, maxRadius: 120 },
  
  // Щиты
  { base: 'shield', name: 'Щит', class: 'warrior', icon: '🛡️', color: '#95a5a6', type: 'shield', slot: 'shield' },
  
  // Броня
  { base: 'robe', name: 'Мантия', class: 'mage', icon: '🧥', color: '#6c3483', type: 'armor', slot: 'armor' },
  { base: 'leather', name: 'Кожаная броня', class: 'rogue', icon: '🥋', color: '#d35400', type: 'armor', slot: 'armor' },
  { base: 'plate', name: 'Латная броня', class: 'warrior', icon: '🥋', color: '#7f8c8d', type: 'armor', slot: 'armor' },
  
  // Головные уборы
  { base: 'helmet', name: 'Шлем', class: 'warrior', icon: '⛑️', color: '#95a5a6', type: 'head', slot: 'head' },
  { base: 'hood', name: 'Капюшон', class: 'mage', icon: '👒', color: '#6c3483', type: 'head', slot: 'head' },
  { base: 'cap', name: 'Кепка', class: 'rogue', icon: '🎩', color: '#34495e', type: 'head', slot: 'head' },
  
  // Перчатки
  { base: 'gloves', name: 'Перчатки', class: null, icon: '🧤', color: '#95a5a6', type: 'gloves', slot: 'gloves' },
  
  // Пояса
  { base: 'belt', name: 'Пояс', class: null, icon: '🎗️', color: '#d35400', type: 'belt', slot: 'belt' },
  
  // Обувь
  { base: 'boots', name: 'Ботинки', class: null, icon: '👢', color: '#8b4513', type: 'boots', slot: 'boots' },
  
  // Украшения
  { base: 'amulet', name: 'Амулет', class: null, icon: '📿', color: '#f39c12', type: 'accessory', slot: 'accessory' },
  { base: 'ring', name: 'Кольцо', class: null, icon: '💍', color: '#e67e22', type: 'accessory', slot: 'accessory' },
  
  // Зелья
  { base: 'potion', name: 'Зелье здоровья', class: null, icon: '🧪', color: '#e74c3c', type: 'consumable', slot: 'consumable' },
  { base: 'speed_potion', name: 'Зелье скорости', class: null, icon: '💨', color: '#3498db', type: 'consumable', slot: 'consumable' },
  { base: 'strength_potion', name: 'Зелье силы', class: null, icon: '💪', color: '#e67e22', type: 'consumable', slot: 'consumable' },
  { base: 'defense_potion', name: 'Зелье защиты', class: null, icon: '🛡️', color: '#95a5a6', type: 'consumable', slot: 'consumable' },
  { base: 'regen_potion', name: 'Зелье регенерации', class: null, icon: '💚', color: '#27ae60', type: 'consumable', slot: 'consumable' },
  { base: 'combo_potion', name: 'Комплексное зелье', class: null, icon: '🌈', color: '#9b59b6', type: 'consumable', slot: 'consumable' },
  { base: 'purification_potion', name: 'Зелье очищения', class: null, icon: '✨', color: '#f39c12', type: 'consumable', slot: 'consumable' }
];

export const AFFIXES = [
  { key: 'damage', name: 'Урон', min: 5, max: 30 },
  { key: 'crit', name: 'Крит', min: 2, max: 15 },
  { key: 'defense', name: 'Защита', min: 2, max: 15 },
  { key: 'maxHp', name: 'HP', min: 10, max: 60 },
  { key: 'moveSpeed', name: 'Скорость', min: 5, max: 30 },
  { key: 'attackSpeed', name: 'Скорость атаки', min: 5, max: 25 },
  { key: 'attackRadius', name: 'Дальность атаки', min: 10, max: 50 },
  { key: 'fire', name: 'Огонь', min: 5, max: 20 },
  { key: 'ice', name: 'Лёд', min: 5, max: 20 }
];

export const RARITIES = [
  { key: 'common', name: 'Обычный', color: '#95a5a6', chance: 0.6 },
  { key: 'rare', name: 'Редкий', color: '#3498db', chance: 0.3 },
  { key: 'epic', name: 'Эпик', color: '#e67e22', chance: 0.09 },
  { key: 'legendary', name: 'Легендарный', color: '#e74c3c', chance: 0.01 }
];

// ==================== ГЕНЕРАЦИЯ ПРЕДМЕТОВ ====================
export function generateRandomItem(level, playerClass) {
  // 1. Сначала выбираем базу с учётом класса
  let pool = BASE_ITEMS.filter(it => !it.class || it.class === playerClass);
  
  // 5% шанс на "не свой" предмет
  if (Math.random() < 0.05) {
    pool = BASE_ITEMS;
  }
  
  // 2. Применяем пониженный шанс для зелья очищения
  const purificationPotion = pool.find(it => it.base === 'purification_potion');
  if (purificationPotion) {
    // 15% шанс что зелье очищения будет исключено из пула
    if (Math.random() < 0.15) {
      pool = pool.filter(it => it.base !== 'purification_potion');
    }
  }
  
  const base = pool[Math.floor(Math.random() * pool.length)];
  
  // 2. Редкость
  let rarity = RARITIES[0];
  const roll = Math.random();
  let acc = 0;
  for (const r of RARITIES) {
    acc += r.chance + level * 0.01; // шанс растёт с уровнем
    if (roll < acc) { rarity = r; break; }
  }
  
  // 3. Аффиксы
  const affixCount = rarity.key === 'legendary' ? 3 : rarity.key === 'epic' ? 2 : rarity.key === 'rare' ? 1 : 0;
  const affixes = {};
  let used = new Set();
  for (let i = 0; i < affixCount; ++i) {
    let aff;
    do { aff = AFFIXES[Math.floor(Math.random() * AFFIXES.length)]; } while (used.has(aff.key));
    used.add(aff.key);
    let value = Math.floor(aff.min + (aff.max - aff.min) * (0.5 + 0.5 * Math.random()) * (0.7 + 0.3 * level/20));
    affixes[aff.key] = value;
  }
  
  // 4. Бонусы по типу
  let bonus = { ...affixes };
  if (base.type === 'weapon') {
    bonus.damage = (bonus.damage || 0) + Math.floor(8 + level * 2 + (rarity.key === 'legendary' ? 10 : 0));
    if (base.base === 'staff' || base.base === 'wand') bonus.crit = (bonus.crit || 0) + Math.floor(level/2);
  }
  if (base.type === 'shield') {
    bonus.defense = (bonus.defense || 0) + Math.floor(6 + level * 1.5 + (rarity.key === 'legendary' ? 8 : 0));
    bonus.maxHp = (bonus.maxHp || 0) + Math.floor(15 + level * 2);
  }
  if (base.type === 'armor') {
    bonus.defense = (bonus.defense || 0) + Math.floor(4 + level + (rarity.key === 'legendary' ? 6 : 0));
    bonus.maxHp = (bonus.maxHp || 0) + Math.floor(10 + level * 2);
  }
  if (base.type === 'head') {
    bonus.defense = (bonus.defense || 0) + Math.floor(2 + level * 0.8 + (rarity.key === 'legendary' ? 4 : 0));
    bonus.maxHp = (bonus.maxHp || 0) + Math.floor(8 + level * 1.5);
  }
  if (base.type === 'gloves') {
    bonus.attackSpeed = (bonus.attackSpeed || 0) + Math.floor(2 + level * 0.5 + (rarity.key === 'legendary' ? 3 : 0));
    bonus.crit = (bonus.crit || 0) + Math.floor(1 + level * 0.3);
  }
  if (base.type === 'belt') {
    bonus.maxHp = (bonus.maxHp || 0) + Math.floor(5 + level * 1.2 + (rarity.key === 'legendary' ? 4 : 0));
    bonus.moveSpeed = (bonus.moveSpeed || 0) + Math.floor(2 + level * 0.4);
  }
  if (base.type === 'boots') {
    bonus.moveSpeed = (bonus.moveSpeed || 0) + Math.floor(3 + level * 0.8 + (rarity.key === 'legendary' ? 5 : 0));
    bonus.defense = (bonus.defense || 0) + Math.floor(1 + level * 0.3);
  }
  if (base.type === 'accessory') {
    bonus.moveSpeed = (bonus.moveSpeed || 0) + Math.floor(3 + level);
    bonus.crit = (bonus.crit || 0) + Math.floor(2 + level * 0.5);
  }
  if (base.type === 'consumable') {
    // Разные типы банок с разными эффектами
    switch (base.base) {
      case 'potion':
        // Обычное зелье здоровья - мгновенное восстановление
        bonus.heal = 40 + Math.floor(level * 2.5);
        break;
      case 'speed_potion':
        // Зелье скорости - временный бафф
        bonus.moveSpeed = 20 + Math.floor(level * 1.5);
        bonus.duration = 15; // 15 секунд
        break;
      case 'strength_potion':
        // Зелье силы - временный бафф урона
        bonus.damage = 15 + Math.floor(level * 2);
        bonus.duration = 20; // 20 секунд
        break;
      case 'defense_potion':
        // Зелье защиты - временный бафф защиты
        bonus.defense = 10 + Math.floor(level * 1.5);
        bonus.duration = 18; // 18 секунд
        break;
      case 'regen_potion':
        // Зелье регенерации - постепенное восстановление
        bonus.heal = 60 + Math.floor(level * 3);
        bonus.regenDuration = 8; // 8 секунд регенерации
        bonus.regenTick = 2; // каждые 2 секунды
        break;
      case 'combo_potion':
        // Комплексное зелье - несколько эффектов
        bonus.heal = 30 + Math.floor(level * 2);
        bonus.damage = 10 + Math.floor(level * 1.5);
        bonus.moveSpeed = 15 + Math.floor(level * 1);
        bonus.duration = 12; // 12 секунд
        break;
      case 'purification_potion':
        // Зелье очищения - снимает все негативные эффекты
        bonus.purify = true; // Флаг для очищения
        bonus.heal = 20 + Math.floor(level * 1.5); // Небольшое восстановление здоровья
        break;
      default:
        bonus.heal = 40 + Math.floor(level * 2.5);
    }
  }
  
  // 5. Радиус для милишников
  let attackRadius = base.minRadius || 48;
  if (base.class === 'warrior') attackRadius = Math.floor(64 + level * 1.2);
  if (base.class === 'rogue') attackRadius = Math.floor(40 + level * 0.7);
  
  // Добавляем attackRadius в bonus для оружия
  if (base.type === 'weapon') {
    bonus.attackRadius = attackRadius;
  }
  
  // 6. Название
  let name = base.name;
  if (affixCount > 0) name = `${rarity.name} ${name}`;
  
  // 7. Описание
  let description = '';
  if (base.type === 'consumable') {
    // Для зелий показываем эффекты в зависимости от типа
    switch (base.base) {
      case 'potion':
        description = `Восстанавливает ${bonus.heal} здоровья`;
        break;
      case 'speed_potion':
        description = `Скорость +${bonus.moveSpeed} на ${bonus.duration}с`;
        break;
      case 'strength_potion':
        description = `Урон +${bonus.damage} на ${bonus.duration}с`;
        break;
      case 'defense_potion':
        description = `Защита +${bonus.defense} на ${bonus.duration}с`;
        break;
      case 'regen_potion':
        description = `Регенерация ${bonus.heal} HP за ${bonus.regenDuration}с`;
        break;
      case 'combo_potion':
        const effects = [];
        if (bonus.heal) effects.push(`HP +${bonus.heal}`);
        if (bonus.damage) effects.push(`Урон +${bonus.damage}`);
        if (bonus.moveSpeed) effects.push(`Скорость +${bonus.moveSpeed}`);
        description = `${effects.join(', ')} на ${bonus.duration}с`;
        break;
      default:
        description = `Восстанавливает ${bonus.heal} здоровья`;
    }
  } else {
    // Для других предметов показываем все бонусы
    const bonusEntries = Object.entries(bonus).filter(([k, v]) => v > 0);
    if (bonusEntries.length > 0) {
      description = bonusEntries.map(([k,v]) => {
        if (k === 'attackRadius') return `Дальность атаки: ${v}`;
        if (k === 'maxHp') return `HP: +${v}`;
        if (k === 'damage') return `Урон: +${v}`;
        if (k === 'defense') return `Защита: +${v}`;
        if (k === 'crit') return `Крит: +${v}%`;
        if (k === 'moveSpeed') return `Скорость: +${v}`;
        if (k === 'attackSpeed') return `Скорость атаки: +${v}%`;
        return `${AFFIXES.find(a=>a.key===k)?.name||k}: +${v}`;
      }).join(', ');
    } else {
      description = 'Базовый предмет';
    }
  }
  
  // Используем иконку из базы предмета (стилизованные спрайты будут отрисовываться в DroppedItem)
  let icon = base.icon;
  
  // Генерируем уникальный ID для предмета
  const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  
  return {
    id, // Добавляем уникальный ID
    name,
    base: base.base,
    class: base.class,
    type: base.type,
    slot: base.slot, // Добавляем slot из base
    bonus,
    rarity: rarity.key,
    color: rarity.color,
    icon,
    description,
    attackRadius
  };
} // Принудительное обновление кеша - Fri Aug  1 19:38:58 MSK 2025
