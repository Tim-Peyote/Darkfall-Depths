/* Darkfall Depths - Менеджер магазина */

import { gameState } from '../core/GameState.js';
import { SHOP_UPGRADES, SHOP_OFFERS_COUNT, getUpgradePrice } from '../config/shopConfig.js';
import { Logger } from '../utils/Logger.js';

export class ShopManager {
  static currentOffers = [];
  static purchaseCounts = {};
  static resolveShop = null;

  static init() {
    // Инициализация счётчиков покупок
    if (Object.keys(this.purchaseCounts).length === 0) {
      SHOP_UPGRADES.forEach(u => {
        this.purchaseCounts[u.id] = 0;
      });
    }
  }

  static reset() {
    this.purchaseCounts = {};
    SHOP_UPGRADES.forEach(u => {
      this.purchaseCounts[u.id] = 0;
    });
  }

  static generateOffers() {
    // Фильтруем доступные улучшения (не превысившие макс. покупок)
    const available = SHOP_UPGRADES.filter(u =>
      this.purchaseCounts[u.id] < u.maxPurchases
    );

    // Перемешиваем и берём SHOP_OFFERS_COUNT
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    this.currentOffers = shuffled.slice(0, Math.min(SHOP_OFFERS_COUNT, shuffled.length));
  }

  static show() {
    return new Promise((resolve) => {
      this.resolveShop = resolve;
      this.init();
      this.generateOffers();
      this.render();

      const shopScreen = document.getElementById('shopScreen');
      if (shopScreen) {
        shopScreen.classList.remove('hidden');
        shopScreen.style.display = 'flex';
      }

      const continueBtn = document.getElementById('shopContinueBtn');
      if (continueBtn) {
        const handler = () => {
          continueBtn.removeEventListener('click', handler);
          this.hide();
        };
        continueBtn.addEventListener('click', handler);
      }
    });
  }

  static hide() {
    const shopScreen = document.getElementById('shopScreen');
    if (shopScreen) {
      shopScreen.classList.add('hidden');
      shopScreen.style.display = 'none';
    }
    if (this.resolveShop) {
      this.resolveShop();
      this.resolveShop = null;
    }
  }

  static render() {
    const container = document.getElementById('shopItems');
    const goldDisplay = document.getElementById('shopGold');
    if (!container) return;

    if (goldDisplay) {
      goldDisplay.textContent = gameState.player?.gold || 0;
    }

    container.innerHTML = '';

    this.currentOffers.forEach((upgrade, index) => {
      const count = this.purchaseCounts[upgrade.id] || 0;
      const price = getUpgradePrice(upgrade, count);
      const canAfford = (gameState.player?.gold || 0) >= price;
      const maxed = count >= upgrade.maxPurchases;

      const card = document.createElement('div');
      card.className = `shop-item${!canAfford && !maxed ? ' shop-item--disabled' : ''}${maxed ? ' shop-item--maxed' : ''}`;

      card.innerHTML = `
        <div class="shop-item__icon">${upgrade.icon}</div>
        <div class="shop-item__info">
          <div class="shop-item__name">${upgrade.name}</div>
          <div class="shop-item__desc">${upgrade.description}</div>
          ${count > 0 ? `<div class="shop-item__count">Куплено: ${count}/${upgrade.maxPurchases}</div>` : ''}
        </div>
        <button class="shop-item__buy${maxed ? ' shop-item__buy--maxed' : !canAfford ? ' shop-item__buy--disabled' : ''}"
                ${maxed || !canAfford ? 'disabled' : ''}>
          ${maxed ? 'МАКС' : `${price}G`}
        </button>
      `;

      if (!maxed && canAfford) {
        const btn = card.querySelector('.shop-item__buy');
        btn.addEventListener('click', () => this.buyItem(index));
      }

      container.appendChild(card);
    });
  }

  static buyItem(offerIndex) {
    const upgrade = this.currentOffers[offerIndex];
    if (!upgrade || !gameState.player) return;

    const count = this.purchaseCounts[upgrade.id] || 0;
    const price = getUpgradePrice(upgrade, count);

    if (gameState.player.gold < price) return;
    if (count >= upgrade.maxPurchases) return;

    // Списываем золото
    gameState.player.gold -= price;
    gameState.gold = gameState.player.gold;

    // Применяем улучшение
    upgrade.apply(gameState.player);

    // Увеличиваем счётчик
    this.purchaseCounts[upgrade.id] = count + 1;

    Logger.info(`🛒 Куплено: ${upgrade.name} за ${price} золота`);

    // Обновляем UI статы если инвентарь открыт
    const { InventoryManager } = await import('./InventoryManager.js');
    if (InventoryManager.isOpen) {
      InventoryManager.renderInventory();
    }

    // Воспроизводим звук покупки
    (async () => {
      try {
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playPickUp?.();
      } catch (e) {}
    })();

    // Обновляем отображение
    this.render();
  }
}
