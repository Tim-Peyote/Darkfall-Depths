// Базовые типы предметов и их характеристики
export const BASE_ITEMS = {
  WEAPONS: {
    MELEE: {
      SWORD: {
        name: 'Меч',
        type: 'weapon',
        slot: 'mainhand',
        base: 'sword',
        stats: { damage: 10 },
        class: 'WARRIOR'
      },
      DAGGER: {
        name: 'Кинжал',
        type: 'weapon',
        slot: 'mainhand',
        base: 'dagger',
        stats: { damage: 7, attackSpeed: 1.3 },
        class: 'ROGUE'
      },
      AXE: {
        name: 'Топор',
        type: 'weapon',
        slot: 'mainhand',
        base: 'axe',
        stats: { damage: 12, crit: 5 },
        class: 'WARRIOR'
      }
    },
    RANGED: {
      STAFF: {
        name: 'Посох',
        type: 'weapon',
        slot: 'mainhand',
        base: 'staff',
        stats: { damage: 8, magicPower: 5 },
        class: 'MAGE'
      },
      WAND: {
        name: 'Жезл',
        type: 'weapon',
        slot: 'mainhand',
        base: 'wand',
        stats: { damage: 6, magicPower: 3, attackSpeed: 1.2 },
        class: 'MAGE'
      },
      CROSSBOW: {
        name: 'Арбалет',
        type: 'weapon',
        slot: 'mainhand',
        base: 'crossbow',
        stats: { damage: 9, range: 1.5 },
        class: 'ROGUE'
      }
    }
  },
  
  ARMOR: {
    LIGHT: {
      ROBE: {
        name: 'Мантия',
        type: 'armor',
        slot: 'chest',
        base: 'robe',
        stats: { defense: 5, magicPower: 3 },
        class: 'MAGE'
      },
      LEATHER: {
        name: 'Кожаный доспех',
        type: 'armor',
        slot: 'chest',
        base: 'leather',
        stats: { defense: 7, moveSpeed: 1.1 },
        class: 'ROGUE'
      }
    },
    HEAVY: {
      PLATE: {
        name: 'Латы',
        type: 'armor',
        slot: 'chest',
        base: 'plate',
        stats: { defense: 10 },
        class: 'WARRIOR'
      }
    }
  },
  
  ACCESSORIES: {
    AMULET: {
      name: 'Амулет',
      type: 'accessory',
      slot: 'neck',
      base: 'amulet',
      stats: { maxHp: 20 }
    },
    RING: {
      name: 'Кольцо',
      type: 'accessory',
      slot: 'finger',
      base: 'ring',
      stats: { magicPower: 2 }
    }
  },
  
  CONSUMABLES: {
    POTIONS: {
      HEALTH: {
        name: 'Зелье лечения',
        type: 'consumable',
        base: 'health_potion',
        stats: { heal: 50 }
      },
      MANA: {
        name: 'Зелье маны',
        type: 'consumable',
        base: 'mana_potion',
        stats: { mana: 50 }
      },
      SPEED: {
        name: 'Зелье скорости',
        type: 'consumable',
        base: 'speed_potion',
        stats: { moveSpeed: 1.5, duration: 10 }
      }
    },
    SCROLLS: {
      FIRE: {
        name: 'Свиток огня',
        type: 'consumable',
        base: 'scroll_fire',
        stats: { damage: 30 }
      },
      ICE: {
        name: 'Свиток льда',
        type: 'consumable',
        base: 'scroll_ice',
        stats: { damage: 25, slow: 0.5 }
      },
      TELEPORT: {
        name: 'Свиток телепортации',
        type: 'consumable',
        base: 'scroll_teleport'
      },
      MYSTERY: {
        name: 'Тайный свиток',
        type: 'consumable',
        base: 'scroll_mystery',
        stats: { damage: 20, heal: 30 }
      },
      WEREWOLF: {
        name: 'Свиток оборотня',
        type: 'consumable',
        base: 'scroll_werewolf'
      },
      STONE: {
        name: 'Свиток камня',
        type: 'consumable',
        base: 'scroll_stone'
      },
      FIRE_EXPLOSION: {
        name: 'Свиток огненного взрыва',
        type: 'consumable',
        base: 'scroll_fire_explosion'
      },
      ICE_STORM: {
        name: 'Свиток ледяной бури',
        type: 'consumable',
        base: 'scroll_ice_storm'
      },
      LIGHTNING: {
        name: 'Свиток молнии',
        type: 'consumable',
        base: 'scroll_lightning'
      },
      EARTHQUAKE: {
        name: 'Свиток землетрясения',
        type: 'consumable',
        base: 'scroll_earthquake'
      },
      CLONE: {
        name: 'Свиток клонирования',
        type: 'consumable',
        base: 'scroll_clone'
      },
      INVISIBILITY: {
        name: 'Свиток невидимости',
        type: 'consumable',
        base: 'scroll_invisibility'
      },
      TIME: {
        name: 'Свиток времени',
        type: 'consumable',
        base: 'scroll_time'
      },
      CURSE: {
        name: 'Свиток проклятия',
        type: 'consumable',
        base: 'scroll_curse'
      },
      CHAOS: {
        name: 'Свиток хаоса',
        type: 'consumable',
        base: 'scroll_chaos'
      },
      FEAR: {
        name: 'Свиток страха',
        type: 'consumable',
        base: 'scroll_fear'
      },
      SMOKE: {
        name: 'Свиток дыма',
        type: 'consumable',
        base: 'scroll_smoke'
      },
      METEOR: {
        name: 'Свиток метеорита',
        type: 'consumable',
        base: 'scroll_meteor'
      },
      BARRIER: {
        name: 'Свиток барьера',
        type: 'consumable',
        base: 'scroll_barrier'
      },
      RAGE: {
        name: 'Свиток ярости',
        type: 'consumable',
        base: 'scroll_rage'
      },
      INVULNERABILITY: {
        name: 'Свиток неуязвимости',
        type: 'consumable',
        base: 'scroll_invulnerability'
      },
      VAMPIRISM: {
        name: 'Свиток вампиризма',
        type: 'consumable',
        base: 'scroll_vampirism'
      }
    }
  }
};
