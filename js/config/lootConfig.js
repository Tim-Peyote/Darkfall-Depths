// Конфигурация системы лута
export const LOOT_CONFIG = {
  // Шанс дропа предметов с врагов (15-25% в зависимости от уровня)
  // Элитные враги (с levelRequirement) получают +50% к шансу дропа
  // Враги с особыми способностями получают +30% к шансу дропа
  ENEMY_DROP_CHANCE: {
    LEVELS_1_4: 0.15,    // 15% для уровней 1-4
    LEVELS_5_10: 0.20,   // 20% для уровней 5-10
    LEVELS_11_PLUS: 0.25 // 25% для уровней 11+
  },

  // Базовые шансы выпадения предметов по типам
  BASE_DROP_RATES: {
    EQUIPMENT: 0.30,  // 30% - экипировка (оружие, броня и т.д.)
    SCROLLS: 0.20,    // 20% - свитки (снижено с 35%)
    POTIONS: 0.25,    // 25% - зелья
    MISC: 0.10        // 10% - разное (ресурсы и др.)
  },

  // Шансы выпадения предметов разной редкости по уровням
  RARITY_RATES: {
    LEVELS_1_4: {
      COMMON: 0.70,    // 70%
      RARE: 0.20,      // 20%
      EPIC: 0.08,      // 8%
      LEGENDARY: 0.02   // 2%
    },
    LEVELS_5_10: {
      COMMON: 0.60,    // 60%
      RARE: 0.25,      // 25%
      EPIC: 0.10,      // 10%
      LEGENDARY: 0.05   // 5%
    },
    LEVELS_11_PLUS: {
      COMMON: 0.50,    // 50%
      RARE: 0.30,      // 30%
      EPIC: 0.15,      // 15%
      LEGENDARY: 0.05   // 5%
    }
  },

  // Настройки "pity timer" - увеличение шанса редких предметов
  PITY_TIMER: {
    BASE_EPIC_CHANCE: 0.10,     // Базовый шанс эпического предмета
    BASE_LEGENDARY_CHANCE: 0.03, // Базовый шанс легендарного предмета
    INCREASE_PER_FAILURE: 0.02,  // Увеличение шанса после каждой неудачи
    MAX_BONUS_CHANCE: 0.50      // Максимальный бонусный шанс
  },

  // Классовые веса для выпадения предметов
  CLASS_WEIGHTS: {
    WARRIOR: {
      WEAPONS: 0.50,    // 50% на оружие/броню
      POTIONS: 0.30,    // 30% на зелья
      SCROLLS: 0.20     // 20% на свитки
    },
    MAGE: {
      WEAPONS: 0.20,    // 20% на оружие/броню
      POTIONS: 0.30,    // 30% на зелья
      SCROLLS: 0.50     // 50% на свитки
    },
    ROGUE: {
      WEAPONS: 0.40,    // 40% на оружие/броню
      POTIONS: 0.35,    // 35% на зелья
      SCROLLS: 0.25     // 25% на свитки
    }
  },

  // Шансы на особые предметы
  SPECIAL_ITEMS: {
    SYNERGY_CHEST_CHANCE: 0.05,  // 5% шанс на сундук с синергией
    UNIQUE_ITEM_CHANCE: 0.01     // 1% шанс на уникальный предмет
  }
};

// Вспомогательные функции для работы с конфигурацией
export const getLevelRarityRates = (level) => {
  if (level <= 4) return LOOT_CONFIG.RARITY_RATES.LEVELS_1_4;
  if (level <= 10) return LOOT_CONFIG.RARITY_RATES.LEVELS_5_10;
  return LOOT_CONFIG.RARITY_RATES.LEVELS_11_PLUS;
};

export const getClassWeights = (characterClass) => {
  return LOOT_CONFIG.CLASS_WEIGHTS[characterClass.toUpperCase()] || LOOT_CONFIG.CLASS_WEIGHTS.WARRIOR;
};

// Получение шанса дропа с врагов в зависимости от уровня
export const getEnemyDropChance = (level) => {
  if (level <= 4) return LOOT_CONFIG.ENEMY_DROP_CHANCE.LEVELS_1_4;
  if (level <= 10) return LOOT_CONFIG.ENEMY_DROP_CHANCE.LEVELS_5_10;
  return LOOT_CONFIG.ENEMY_DROP_CHANCE.LEVELS_11_PLUS;
};

// Система Pity Timer
export class PityTimerSystem {
  static failedAttempts = 0;

  static getAdjustedRareChance(baseChance) {
    const bonusChance = this.failedAttempts * LOOT_CONFIG.PITY_TIMER.INCREASE_PER_FAILURE;
    const totalChance = baseChance + Math.min(bonusChance, LOOT_CONFIG.PITY_TIMER.MAX_BONUS_CHANCE);
    return Math.min(totalChance, 1.0); // Не более 100%
  }

  static registerFailedAttempt() {
    this.failedAttempts++;
  }

  static reset() {
    this.failedAttempts = 0;
  }
}
