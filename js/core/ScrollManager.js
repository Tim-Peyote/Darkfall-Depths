/* Darkfall Depths - Система свитков */

import { gameState } from './GameState.js';
import { Enemy } from '../entities/Enemy.js';

export class ScrollManager {

  // Утилита: получить живых врагов из gameState.entities
  static getAliveEnemies() {
    return (gameState.entities || []).filter(e => e instanceof Enemy && !e.isDead);
  }

  static async applyScrollEffects(item) {
    if (!gameState.player) return;

    // Создаем эффект использования свитка
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      // Создаем частицы свитка
      for (let i = 0; i < 10; i++) {
        createParticle(
          gameState.player.x + Utils.random(-25, 25),
          gameState.player.y + Utils.random(-25, 25),
          Utils.randomFloat(-60, 60),
          Utils.randomFloat(-60, 60),
          item.color || '#8e44ad',
          1.8,
          5
        );
      }
    })();

    switch (item.base) {
      case 'scroll_werewolf':
        await this.addBuff('moveSpeed', gameState.player.moveSpeed * 0.5, 15);
        await this.addBuff('damage', gameState.player.damage * 0.3, 15);
        await this.addDebuff('defense', gameState.player.defense * 0.2, 15);
        break;

      case 'scroll_stone':
        await this.addBuff('defense', gameState.player.defense, 12);
        await this.addDebuff('moveSpeed', gameState.player.moveSpeed * 0.6, 12);
        break;

      case 'scroll_fire_explosion':
        this.createFireExplosion();
        break;

      case 'scroll_ice_storm':
        this.createIceStorm();
        break;

      case 'scroll_lightning':
        this.createLightningChain();
        break;

      case 'scroll_earthquake':
        this.createEarthquake();
        break;

      case 'scroll_clone':
        this.createPlayerClone();
        break;

      case 'scroll_teleport':
        await this.randomTeleport();
        break;

      case 'scroll_invisibility':
        gameState.player.isInvisible = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.isInvisible = false;
        }, 8000);
        break;

      case 'scroll_time':
        this.slowTime();
        break;

      case 'scroll_curse':
        this.curseEnemies();
        break;

      case 'scroll_chaos':
        this.createChaos();
        break;

      case 'scroll_fear':
        this.createFear();
        break;

      case 'scroll_smoke':
        this.createSmokeScreen();
        break;

      case 'scroll_meteor':
        await this.createMeteor();
        break;

      case 'scroll_barrier':
        this.createBarrier();
        break;

      case 'scroll_rage':
        this.addBuff('damage', gameState.player.damage, 12);
        gameState.player.rageMode = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.rageMode = false;
        }, 12000);
        break;

      case 'scroll_invulnerability':
        gameState.player.isInvulnerable = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.isInvulnerable = false;
        }, 5000);
        break;

      case 'scroll_vampirism':
        gameState.player.vampirism = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.vampirism = false;
        }, 15000);
        break;

      case 'mystery_scroll':
        await this.applyRandomScrollEffect();
        break;
    }
  }

  static async addBuff(type, value, duration) {
    const { BuffManager } = await import('./BuffManager.js');
    BuffManager.addBuff(type, value, duration);
  }

  static async addDebuff(type, value, duration) {
    const { BuffManager } = await import('./BuffManager.js');
    BuffManager.addDebuff(type, value, duration);
  }

  static createFireExplosion() {
    if (!gameState.player) return;

    const radius = 120;
    const damage = 40;
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
      if (distance <= radius) {
        enemy.takeDamage(damage);
        enemy.addDebuff('burn', 5, 8);
      }
    });

    // Визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = Utils.random(50, radius);
        const x = gameState.player.x + Math.cos(angle) * dist;
        const y = gameState.player.y + Math.sin(angle) * dist;

        createParticle(x, y, Utils.randomFloat(-100, 100), Utils.randomFloat(-100, 100), '#e74c3c', 2.0, 6);
      }
    })();
  }

  static createIceStorm() {
    if (!gameState.player) return;

    const radius = 150;
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
      if (distance <= radius) {
        enemy.addDebuff('freeze', 0, 5);
      }
    });

    // Визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const dist = Utils.random(30, radius);
        const x = gameState.player.x + Math.cos(angle) * dist;
        const y = gameState.player.y + Math.sin(angle) * dist;

        createParticle(x, y, Utils.randomFloat(-50, 50), Utils.randomFloat(-50, 50), '#3498db', 1.5, 4);
      }
    })();
  }

  static createLightningChain() {
    if (!gameState.player) return;

    const enemies = this.getAliveEnemies();
    if (enemies.length === 0) return;

    const maxTargets = 5;
    const damage = 25;

    const sortedEnemies = [...enemies].sort((a, b) => {
      const distA = Math.hypot(a.x - gameState.player.x, a.y - gameState.player.y);
      const distB = Math.hypot(b.x - gameState.player.x, b.y - gameState.player.y);
      return distA - distB;
    });

    const targets = sortedEnemies.slice(0, maxTargets);

    targets.forEach((enemy, index) => {
      enemy.takeDamage(damage);
      if (index > 0) {
        const prevTarget = targets[index - 1];
        this.createLightningEffect(prevTarget.x, prevTarget.y, enemy.x, enemy.y);
      }
    });
  }

  static createLightningEffect(x1, y1, x2, y2) {
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t + Utils.random(-10, 10);
        const y = y1 + (y2 - y1) * t + Utils.random(-10, 10);

        createParticle(x, y, Utils.randomFloat(-30, 30), Utils.randomFloat(-30, 30), '#f1c40f', 1.0, 2);
      }
    })();
  }

  static createEarthquake() {
    if (!gameState.player) return;

    const radius = 200;
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
      if (distance <= radius) {
        enemy.addDebuff('slow', 0.3, 8);
        enemy.takeDamage(15);
      }
    });

    // Визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2;
        const dist = Utils.random(20, radius);
        const x = gameState.player.x + Math.cos(angle) * dist;
        const y = gameState.player.y + Math.sin(angle) * dist;

        createParticle(x, y, Utils.randomFloat(-20, 20), Utils.randomFloat(-20, 20), '#8b4513', 1.0, 3);
      }
    })();
  }

  static createPlayerClone() {
    if (!gameState.player) return;

    const clone = {
      x: gameState.player.x + 20,
      y: gameState.player.y + 20,
      damage: gameState.player.damage * 0.5,
      moveSpeed: gameState.player.moveSpeed,
      attackSpeed: gameState.player.attackSpeed,
      attackRadius: gameState.player.attackRadius,
      hp: 50,
      maxHp: 50,
      isClone: true,
      cloneTime: 20
    };

    gameState.clones = gameState.clones || [];
    gameState.clones.push(clone);

    setTimeout(() => {
      if (gameState.clones) {
        gameState.clones = gameState.clones.filter(c => c !== clone);
      }
    }, 20000);
  }

  static async randomTeleport() {
    if (!gameState.player) return;

    const { MAP_SIZE, TILE_SIZE } = await import('../config/constants.js');
    const maxX = MAP_SIZE * TILE_SIZE - 50;
    const maxY = MAP_SIZE * TILE_SIZE - 50;

    const newX = Math.random() * maxX + 25;
    const newY = Math.random() * maxY + 25;

    if (!gameState.player.checkCollisionWithWalls(newX, newY)) {
      gameState.player.x = newX;
      gameState.player.y = newY;
    }

    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');

      for (let i = 0; i < 15; i++) {
        createParticle(
          gameState.player.x + Utils.random(-30, 30),
          gameState.player.y + Utils.random(-30, 30),
          Utils.randomFloat(-80, 80),
          Utils.randomFloat(-80, 80),
          '#e67e22',
          2.0,
          4
        );
      }
    })();
  }

  static slowTime() {
    const enemies = this.getAliveEnemies();
    if (enemies.length === 0) return;

    enemies.forEach(enemy => {
      enemy.addDebuff('slow', 0.4, 10);
    });
  }

  static curseEnemies() {
    if (!gameState.player) return;

    const radius = 200;
    const debuffs = ['poison', 'burn', 'freeze', 'stun'];
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
      if (distance <= radius) {
        const randomDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];
        const value = randomDebuff === 'burn' || randomDebuff === 'poison' ? 5 : 0;
        enemy.addDebuff(randomDebuff, value, 8);
      }
    });
  }

  static createChaos() {
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      enemy.isChaotic = true;
      enemy.chaosTime = 15;

      setTimeout(() => {
        if (enemy && !enemy.isDead) {
          enemy.isChaotic = false;
        }
      }, 15000);
    });
  }

  static createFear() {
    const enemies = this.getAliveEnemies();

    enemies.forEach(enemy => {
      enemy.isAfraid = true;
      enemy.fearTime = 12;

      setTimeout(() => {
        if (enemy && !enemy.isDead) {
          enemy.isAfraid = false;
        }
      }, 12000);
    });
  }

  static createSmokeScreen() {
    if (!gameState.player) return;

    gameState.smokeScreen = {
      x: gameState.player.x,
      y: gameState.player.y,
      radius: 100,
      duration: 10,
      startTime: gameState.gameTime
    };

    setTimeout(() => {
      gameState.smokeScreen = null;
    }, 10000);
  }

  static async createMeteor() {
    const { MAP_SIZE, TILE_SIZE } = await import('../config/constants.js');
    const maxX = MAP_SIZE * TILE_SIZE - 50;
    const maxY = MAP_SIZE * TILE_SIZE - 50;

    const meteorX = Math.random() * maxX + 25;
    const meteorY = Math.random() * maxY + 25;

    gameState.meteor = {
      x: meteorX,
      y: meteorY,
      radius: 80,
      damage: 100,
      duration: 3,
      startTime: gameState.gameTime
    };

    setTimeout(() => {
      if (gameState.meteor) {
        const enemies = ScrollManager.getAliveEnemies();
        enemies.forEach(enemy => {
          const distance = Math.hypot(enemy.x - meteorX, enemy.y - meteorY);
          if (distance <= 80) {
            enemy.takeDamage(100);
          }
        });

        (async () => {
          const { Utils } = await import('../utils/Utils.js');
          const { createParticle } = await import('../effects/Particle.js');

          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const dist = Utils.random(20, 80);
            const x = meteorX + Math.cos(angle) * dist;
            const y = meteorY + Math.sin(angle) * dist;

            createParticle(x, y, Utils.randomFloat(-150, 150), Utils.randomFloat(-150, 150), '#e67e22', 3.0, 8);
          }
        })();

        gameState.meteor = null;
      }
    }, 3000);
  }

  static createBarrier() {
    if (!gameState.player) return;

    gameState.player.barrier = {
      absorbAmount: 100,
      remainingAbsorb: 100
    };
  }

  static async applyRandomScrollEffect() {
    const scrollTypes = [
      'scroll_werewolf', 'scroll_stone', 'scroll_fire_explosion',
      'scroll_ice_storm', 'scroll_lightning', 'scroll_earthquake', 'scroll_clone',
      'scroll_teleport', 'scroll_invisibility', 'scroll_time', 'scroll_curse',
      'scroll_chaos', 'scroll_fear', 'scroll_smoke', 'scroll_meteor',
      'scroll_barrier', 'scroll_rage', 'scroll_invulnerability', 'scroll_vampirism'
    ];

    const randomScroll = scrollTypes[Math.floor(Math.random() * scrollTypes.length)];
    await this.applyScrollEffects({ base: randomScroll, color: '#8e44ad' });
  }
}
