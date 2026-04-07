/* Darkfall Depths - Конфигурация магазина */

export const SHOP_UPGRADES = [
  {
    id: 'max_hp',
    name: 'Укрепление тела',
    description: '+20 к максимальному здоровью',
    icon: '❤️',
    stat: 'maxHp',
    value: 20,
    basePrice: 50,
    maxPurchases: 10,
    apply(player) {
      player.maxHp += this.value;
      player.baseMaxHp += this.value;
      player.hp += this.value;
    }
  },
  {
    id: 'damage',
    name: 'Острота клинка',
    description: '+4 к урону',
    icon: '⚔️',
    stat: 'damage',
    value: 4,
    basePrice: 60,
    maxPurchases: 10,
    apply(player) {
      player.damage += this.value;
      player.baseDamage += this.value;
    }
  },
  {
    id: 'defense',
    name: 'Закалка брони',
    description: '+3 к защите',
    icon: '🛡️',
    stat: 'defense',
    value: 3,
    basePrice: 45,
    maxPurchases: 10,
    apply(player) {
      player.defense += this.value;
      player.baseDefense += this.value;
    }
  },
  {
    id: 'speed',
    name: 'Лёгкость шага',
    description: '+8 к скорости',
    icon: '👟',
    stat: 'moveSpeed',
    value: 8,
    basePrice: 40,
    maxPurchases: 8,
    apply(player) {
      player.moveSpeed += this.value;
      player.baseMoveSpeed += this.value;
    }
  },
  {
    id: 'crit',
    name: 'Меткий глаз',
    description: '+3% к шансу крита',
    icon: '🎯',
    stat: 'crit',
    value: 3,
    basePrice: 55,
    maxPurchases: 10,
    apply(player) {
      player.crit = (player.crit || 0) + this.value;
    }
  },
  {
    id: 'attack_speed',
    name: 'Быстрые руки',
    description: 'Ускорение атаки',
    icon: '⚡',
    stat: 'attackSpeed',
    value: 0.05,
    basePrice: 65,
    maxPurchases: 6,
    apply(player) {
      player.attackSpeed = Math.max(0.15, player.attackSpeed - this.value);
      player.baseAttackSpeed = Math.max(0.15, player.baseAttackSpeed - this.value);
    }
  },
  {
    id: 'heal_full',
    name: 'Полное исцеление',
    description: 'Восстановить всё здоровье',
    icon: '💚',
    stat: 'hp',
    value: 0,
    basePrice: 30,
    maxPurchases: 99,
    apply(player) {
      player.hp = player.maxHp;
    }
  },
  {
    id: 'attack_radius',
    name: 'Длинная рука',
    description: '+15 к радиусу атаки',
    icon: '🏹',
    stat: 'attackRadius',
    value: 15,
    basePrice: 50,
    maxPurchases: 6,
    apply(player) {
      player.attackRadius += this.value;
    }
  }
];

// Количество предложений в магазине за визит
export const SHOP_OFFERS_COUNT = 5;

// Множитель цены за каждую покупку того же улучшения
export const SHOP_PRICE_MULTIPLIER = 0.5;

// Вычислить цену улучшения с учётом количества покупок
export function getUpgradePrice(upgrade, purchaseCount) {
  return Math.floor(upgrade.basePrice * (1 + purchaseCount * SHOP_PRICE_MULTIPLIER));
}
