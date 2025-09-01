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
  { base: 'purification_potion', name: 'Зелье очищения', class: null, icon: '✨', color: '#f39c12', type: 'consumable', slot: 'consumable' },
  { base: 'mystery_potion', name: 'Тайная банка', class: null, icon: '❓', color: '#8e44ad', type: 'consumable', slot: 'consumable' },
  
  // Свитки
  { base: 'scroll_werewolf', name: 'Свиток оборотня', class: null, icon: '🐺', color: '#8b4513', type: 'consumable', slot: 'consumable', description: 'Превращает в волка: скорость +50%, урон +30%, защита -20% на 15 сек' },
  { base: 'scroll_stone', name: 'Свиток камня', class: null, icon: '🗿', color: '#7f8c8d', type: 'consumable', slot: 'consumable', description: 'Превращает в голема: защита +100%, скорость -60% на 12 сек' },
  { base: 'scroll_fire_explosion', name: 'Свиток огненного взрыва', class: null, icon: '🔥', color: '#e74c3c', type: 'consumable', slot: 'consumable', description: 'Взрывная волна огня: урон 40, радиус 120, поджигает врагов' },
  { base: 'scroll_ice_storm', name: 'Свиток ледяной бури', class: null, icon: '❄️', color: '#3498db', type: 'consumable', slot: 'consumable', description: 'Замораживает всех врагов в радиусе 150 на 5 сек' },
  { base: 'scroll_lightning', name: 'Свиток молнии', class: null, icon: '⚡', color: '#f1c40f', type: 'consumable', slot: 'consumable', description: 'Цепная молния между врагами: урон 25, до 5 целей' },
  { base: 'scroll_earthquake', name: 'Свиток землетрясения', class: null, icon: '🌋', color: '#8b4513', type: 'consumable', slot: 'consumable', description: 'Создает трещины, замедляющие врагов на 8 сек' },
  { base: 'scroll_clone', name: 'Свиток клонирования', class: null, icon: '👥', color: '#9b59b6', type: 'consumable', slot: 'consumable', description: 'Создает временного клона игрока: урон 50% на 20 сек' },
  { base: 'scroll_teleport', name: 'Свиток телепортации', class: null, icon: '🌀', color: '#e67e22', type: 'consumable', slot: 'consumable', description: 'Случайный телепорт в пределах карты' },
  { base: 'scroll_invisibility', name: 'Свиток невидимости', class: null, icon: '👁️', color: '#95a5a6', type: 'consumable', slot: 'consumable', description: 'Невидимость для врагов на 8 сек' },
  { base: 'scroll_time', name: 'Свиток времени', class: null, icon: '⏰', color: '#34495e', type: 'consumable', slot: 'consumable', description: 'Замедляет всех врагов на 60% на 10 сек' },
  { base: 'scroll_curse', name: 'Свиток проклятия', class: null, icon: '💀', color: '#2c3e50', type: 'consumable', slot: 'consumable', description: 'Накладывает случайный дебафф на всех врагов в радиусе 200' },
  { base: 'scroll_chaos', name: 'Свиток хаоса', class: null, icon: '🎭', color: '#e74c3c', type: 'consumable', slot: 'consumable', description: 'Заставляет врагов атаковать друг друга на 15 сек' },
  { base: 'scroll_fear', name: 'Свиток страха', class: null, icon: '😱', color: '#8e44ad', type: 'consumable', slot: 'consumable', description: 'Заставляет врагов убегать от игрока на 12 сек' },
  { base: 'scroll_smoke', name: 'Свиток дыма', class: null, icon: '💨', color: '#7f8c8d', type: 'consumable', slot: 'consumable', description: 'Создает дымовую завесу, скрывающую игрока на 10 сек' },
  { base: 'scroll_meteor', name: 'Свиток метеорита', class: null, icon: '☄️', color: '#e67e22', type: 'consumable', slot: 'consumable', description: 'Вызывает падение метеорита в случайную точку карты' },
  { base: 'scroll_barrier', name: 'Свиток барьера', class: null, icon: '🛡️', color: '#3498db', type: 'consumable', slot: 'consumable', description: 'Создает энергетический щит, абсорбирующий 100 урона' },
  { base: 'scroll_rage', name: 'Свиток ярости', class: null, icon: '😡', color: '#e74c3c', type: 'consumable', slot: 'consumable', description: 'Урон +100%, но игрок получает урон при атаке на 12 сек' },
  { base: 'scroll_invulnerability', name: 'Свиток неуязвимости', class: null, icon: '💎', color: '#f1c40f', type: 'consumable', slot: 'consumable', description: 'Полная неуязвимость к урону на 5 сек' },
  { base: 'scroll_vampirism', name: 'Свиток вампиризма', class: null, icon: '🦇', color: '#8e44ad', type: 'consumable', slot: 'consumable', description: '50% урона от атак восстанавливает здоровье на 15 сек' },
  { base: 'mystery_scroll', name: 'Тайный свиток', class: null, icon: '📜', color: '#8e44ad', type: 'consumable', slot: 'consumable', description: 'Случайный эффект из всех возможных свитков' }
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
  { key: 'common', name: 'Обычный', color: '#95a5a6', chance: 0.68 },
  { key: 'rare', name: 'Редкий', color: '#3498db', chance: 0.21 },
  { key: 'epic', name: 'Эпик', color: '#e67e22', chance: 0.07 },
  { key: 'legendary', name: 'Легендарный', color: '#e74c3c', chance: 0.04 }
];

// ==================== ГЕНЕРАЦИЯ ПРЕДМЕТОВ ====================
export async function generateRandomItem(level, playerClass) {
  const { LOOT_CONFIG, getLevelRarityRates, getClassWeights, PityTimerSystem } = await import('./lootConfig.js');

  // 1. Определяем тип предмета на основе базовых шансов и классовых весов
  const classWeights = getClassWeights(playerClass || 'WARRIOR');
  const baseRates = LOOT_CONFIG.BASE_DROP_RATES;
  const roll = Math.random();
  let itemType;
  let accumulatedChance = 0;

  // Сначала нормализуем веса
  const totalWeight = Object.entries(baseRates).reduce((sum, [type, chance]) => {
    return sum + chance * (classWeights[type] || 1);
  }, 0);

  for (const [type, chance] of Object.entries(baseRates)) {
    const normalizedChance = (chance * (classWeights[type] || 1)) / totalWeight;
    accumulatedChance += normalizedChance;
    if (roll <= accumulatedChance) {
      itemType = type;
      break;
    }
  }
  
  // Проверяем, что itemType определен
  if (!itemType) {
    console.error('❌ ItemType is undefined! roll:', roll, 'accumulatedChance:', accumulatedChance);
    // Выбираем последний тип как fallback
    const types = Object.keys(baseRates);
    itemType = types[types.length - 1];
  }

  // 2. Формируем пул предметов на основе выбранного типа
  let pool = BASE_ITEMS.filter(it => {
    if (itemType === 'EQUIPMENT') {
      return !it.base.startsWith('scroll_') && !it.base.includes('potion');
    } else if (itemType === 'SCROLLS') {
      return it.base.startsWith('scroll_');
    } else if (itemType === 'POTIONS') {
      return it.base.includes('potion');
    }
    return true; // MISC items
  });
  
  // Проверяем, что пул не пустой
  if (pool.length === 0) {
    console.error('❌ Item pool is empty! itemType:', itemType, 'BASE_ITEMS length:', BASE_ITEMS.length);
    // Fallback: используем все предметы
    pool = BASE_ITEMS;
  }

  // Применяем фильтр по классу, с небольшим шансом на "не свой" предмет
  if (playerClass && Math.random() > 0.1) { // 10% шанс на "не свой" предмет
    pool = pool.filter(it => !it.class || it.class === playerClass);
  }

  // 3. Определяем редкость предмета
  const rarityRates = getLevelRarityRates(level);
  const rarityRoll = Math.random();
  let rarity;
  let acc = 0;

  // Учитываем систему Pity Timer для эпических и легендарных предметов
  if (PityTimerSystem.failedAttempts > 0) {
    const epicChance = PityTimerSystem.getAdjustedRareChance(LOOT_CONFIG.PITY_TIMER.BASE_EPIC_CHANCE);
    const legendaryChance = PityTimerSystem.getAdjustedRareChance(LOOT_CONFIG.PITY_TIMER.BASE_LEGENDARY_CHANCE);
    
    if (Math.random() < legendaryChance) {
      rarity = RARITIES.find(r => r.key === 'legendary');
      PityTimerSystem.reset();
    } else if (Math.random() < epicChance) {
      rarity = RARITIES.find(r => r.key === 'epic');
      PityTimerSystem.reset();
    }
  }

  // Если Pity Timer не сработал, используем обычную систему редкости
  if (!rarity) {
    for (const [rarityKey, chance] of Object.entries(rarityRates)) {
      acc += chance;
      if (rarityRoll < acc) {
        rarity = RARITIES.find(r => r.key.toUpperCase() === rarityKey);
        break;
      }
    }
    // Увеличиваем счетчик неудач
    if (rarity.key !== 'epic' && rarity.key !== 'legendary') {
      PityTimerSystem.registerFailedAttempt();
    }
  }

  const base = pool[Math.floor(Math.random() * pool.length)];
  
  // Проверяем, что base определен
  if (!base) {
    console.error('❌ Base item is undefined! Pool length:', pool.length);
    return null;
  }
  
  // 4. Проверяем на особые/джокерные предметы
  if (Math.random() < LOOT_CONFIG.SPECIAL_ITEMS.UNIQUE_ITEM_CHANCE) {
    // Заменяем на уникальный предмет, если выпал шанс
    // TODO: Добавить пул уникальных предметов
    rarity = RARITIES.find(r => r.key === 'legendary');
  }

  // 5. Генерируем аффиксы
  const affixCount = rarity.key === 'legendary' ? 3 : rarity.key === 'epic' ? 2 : rarity.key === 'rare' ? 1 : 0;
  const affixes = {};
  let used = new Set();
  
  // Подбираем аффиксы с учетом класса персонажа
  for (let i = 0; i < affixCount; ++i) {
    let compatibleAffixes = AFFIXES.filter(aff => 
      !used.has(aff.key) && (!aff.class || aff.class === playerClass)
    );
    
    if (compatibleAffixes.length === 0) {
      compatibleAffixes = AFFIXES.filter(aff => !used.has(aff.key));
    }
    
    const aff = compatibleAffixes[Math.floor(Math.random() * compatibleAffixes.length)];
    used.add(aff.key);
    
    // Значение аффикса растет с уровнем и имеет небольшой рандомный разброс
    const levelScale = 0.7 + 0.3 * (level / 20); // От 0.7 до 1.0 в зависимости от уровня
    const randomScale = 0.8 + 0.4 * Math.random(); // От 0.8 до 1.2
    let value = Math.floor(aff.min + (aff.max - aff.min) * levelScale * randomScale);
    
    // Для легендарных предметов усиливаем бонусы
    if (rarity.key === 'legendary') {
      value = Math.floor(value * 1.2); // +20% к значению
    }
    
    affixes[aff.key] = value;
  }
  
  // 6. Базовые бонусы в зависимости от уровня и редкости
  let bonus = { ...affixes };

  if (base.stats) {
    for (const [key, value] of Object.entries(base.stats)) {
      // Базовое значение + прогрессия от уровня
      let scaledValue = value * (1 + (level - 1) * 0.2);
      
      // Бонус от редкости
      scaledValue *= rarity.key === 'legendary' ? 1.5 :
                     rarity.key === 'epic' ? 1.3 :
                     rarity.key === 'rare' ? 1.15 : 1;
      
      bonus[key] = Math.floor(scaledValue);
    }
  }

  // 7. Дополнительные бонусы в зависимости от типа предмета
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
      case 'mystery_potion':
        // Тайная банка - случайные эффекты (положительные и/или отрицательные)
        bonus.mystery = true; // Флаг для тайной банки
        bonus.effects = generateMysteryEffects(level);
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
      case 'purification_potion':
        description = `Снимает все негативные эффекты, восстанавливает ${bonus.heal} здоровья`;
        break;
      case 'combo_potion':
        const effects = [];
        if (bonus.heal) effects.push(`HP +${bonus.heal}`);
        if (bonus.damage) effects.push(`Урон +${bonus.damage}`);
        if (bonus.moveSpeed) effects.push(`Скорость +${bonus.moveSpeed}`);
        description = `${effects.join(', ')} на ${bonus.duration}с`;
        break;
      case 'mystery_potion':
        description = 'Содержит неизвестные эффекты. Может быть как полезным, так и вредным...';
        break;
      // Свитки
      case 'scroll_werewolf':
        description = 'Превращает в волка: скорость +50%, урон +30%, защита -20% на 15 сек';
        break;
      case 'scroll_stone':
        description = 'Превращает в голема: защита +100%, скорость -60% на 12 сек';
        break;
      case 'scroll_fire_explosion':
        description = 'Взрывная волна огня: урон 40, радиус 120, поджигает врагов';
        break;
      case 'scroll_ice_storm':
        description = 'Замораживает всех врагов в радиусе 150 на 5 сек';
        break;
      case 'scroll_lightning':
        description = 'Цепная молния между врагами: урон 25, до 5 целей';
        break;
      case 'scroll_earthquake':
        description = 'Создает трещины, замедляющие врагов на 8 сек';
        break;
      case 'scroll_clone':
        description = 'Создает временного клона игрока: урон 50% на 20 сек';
        break;
      case 'scroll_teleport':
        description = 'Случайный телепорт в пределах карты';
        break;
      case 'scroll_invisibility':
        description = 'Невидимость для врагов на 8 сек';
        break;
      case 'scroll_time':
        description = 'Замедляет всех врагов на 60% на 10 сек';
        break;
      case 'scroll_curse':
        description = 'Накладывает случайный дебафф на всех врагов в радиусе 200';
        break;
      case 'scroll_chaos':
        description = 'Заставляет врагов атаковать друг друга на 15 сек';
        break;
      case 'scroll_fear':
        description = 'Заставляет врагов убегать от игрока на 12 сек';
        break;
      case 'scroll_smoke':
        description = 'Создает дымовую завесу, скрывающую игрока на 10 сек';
        break;
      case 'scroll_meteor':
        description = 'Вызывает падение метеорита в случайную точку карты';
        break;
      case 'scroll_barrier':
        description = 'Создает энергетический щит, абсорбирующий 100 урона';
        break;
      case 'scroll_rage':
        description = 'Урон +100%, но игрок получает урон при атаке на 12 сек';
        break;
      case 'scroll_invulnerability':
        description = 'Полная неуязвимость к урону на 5 сек';
        break;
      case 'scroll_vampirism':
        description = '50% урона от атак восстанавливает здоровье на 15 сек';
        break;
      case 'mystery_scroll':
        description = 'Случайный эффект из всех возможных свитков';
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
}

// Функция генерации случайных эффектов для тайной банки
export function generateMysteryEffects(level) {
  const effects = [];
  
  // Определяем количество эффектов (1-3)
  const effectCount = Math.floor(Math.random() * 3) + 1;
  
  // Список возможных положительных эффектов
  const positiveEffects = [
    { type: 'heal', value: 30 + Math.floor(level * 2), description: 'Восстановление здоровья' },
    { type: 'damage', value: 10 + Math.floor(level * 1.5), duration: 15, description: 'Увеличение урона' },
    { type: 'defense', value: 8 + Math.floor(level * 1.2), duration: 12, description: 'Увеличение защиты' },
    { type: 'moveSpeed', value: 15 + Math.floor(level * 1), duration: 10, description: 'Увеличение скорости' },
    { type: 'crit', value: 8 + Math.floor(level * 0.8), duration: 18, description: 'Увеличение критического удара' },
    { type: 'attackSpeed', value: 12 + Math.floor(level * 1), duration: 14, description: 'Увеличение скорости атаки' },
    { type: 'maxHp', value: 20 + Math.floor(level * 2), description: 'Увеличение максимального здоровья' },
    { type: 'fire', value: 8 + Math.floor(level * 1), duration: 20, description: 'Огненный урон' },
    { type: 'ice', value: 6 + Math.floor(level * 0.8), duration: 16, description: 'Ледяной урон' }
  ];
  
  // Список возможных отрицательных эффектов
  const negativeEffects = [
    { type: 'poison', value: 5 + Math.floor(level * 0.5), duration: 8, description: 'Отравление' },
    { type: 'burn', value: 4 + Math.floor(level * 0.4), duration: 6, description: 'Ожог' },
    { type: 'freeze', value: 0, duration: 3, description: 'Заморозка' },
    { type: 'slow', value: 0, duration: 5, description: 'Замедление' },
    { type: 'weakness', value: 0, duration: 7, description: 'Слабость' },
    { type: 'vulnerability', value: 5 + Math.floor(level * 0.3), duration: 10, description: 'Уязвимость' },
    { type: 'damage_debuff', value: 8 + Math.floor(level * 1), duration: 12, description: 'Снижение урона' },
    { type: 'defense_debuff', value: 6 + Math.floor(level * 0.8), duration: 10, description: 'Снижение защиты' },
    { type: 'moveSpeed_debuff', value: 10 + Math.floor(level * 0.6), duration: 8, description: 'Снижение скорости' }
  ];
  
  // Выбираем случайные эффекты
  const usedTypes = new Set();
  
  for (let i = 0; i < effectCount; i++) {
    // 60% шанс положительного эффекта, 40% отрицательного
    const isPositive = Math.random() < 0.6;
    const effectPool = isPositive ? positiveEffects : negativeEffects;
    
    let effect;
    let attempts = 0;
    
    // Пытаемся найти эффект, который еще не использован
    do {
      effect = effectPool[Math.floor(Math.random() * effectPool.length)];
      attempts++;
    } while (usedTypes.has(effect.type) && attempts < 10);
    
    if (!usedTypes.has(effect.type)) {
      usedTypes.add(effect.type);
      effects.push({
        ...effect,
        isPositive
      });
    }
  }
  
  return effects;
} // Принудительное обновление кеша - Fri Aug  1 19:38:58 MSK 2025
