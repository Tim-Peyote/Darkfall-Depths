/* Darkfall Depths - Система свитков */

import { gameState } from './GameState.js';

export class ScrollManager {
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
        // Превращение в волка
        await this.addBuff('moveSpeed', gameState.player.moveSpeed * 0.5, 15);
        await this.addBuff('damage', gameState.player.damage * 0.3, 15);
        await this.addDebuff('defense', gameState.player.defense * 0.2, 15);
        break;
        
      case 'scroll_stone':
        // Превращение в голема
        await this.addBuff('defense', gameState.player.defense, 12);
        await this.addDebuff('moveSpeed', gameState.player.moveSpeed * 0.6, 12);
        break;
        
      case 'scroll_fire_explosion':
        // Огненный взрыв
        this.createFireExplosion();
        break;
        
      case 'scroll_ice_storm':
        // Ледяная буря
        this.createIceStorm();
        break;
        
      case 'scroll_lightning':
        // Молния
        this.createLightningChain();
        break;
        
      case 'scroll_earthquake':
        // Землетрясение
        this.createEarthquake();
        break;
        
      case 'scroll_clone':
        // Клонирование
        this.createPlayerClone();
        break;
        
      case 'scroll_teleport':
        // Телепортация
        await this.randomTeleport();
        break;
        
      case 'scroll_invisibility':
        // Невидимость
        gameState.player.isInvisible = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.isInvisible = false;
        }, 8000);
        break;
        
      case 'scroll_time':
        // Замедление времени
        this.slowTime();
        break;
        
      case 'scroll_curse':
        // Проклятие врагов
        this.curseEnemies();
        break;
        
      case 'scroll_chaos':
        // Хаос - враги атакуют друг друга
        this.createChaos();
        break;
        
      case 'scroll_fear':
        // Страх - враги убегают
        this.createFear();
        break;
        
      case 'scroll_smoke':
        // Дымовая завеса
        this.createSmokeScreen();
        break;
        
      case 'scroll_meteor':
        // Метеорит
        await this.createMeteor();
        break;
        
      case 'scroll_barrier':
        // Энергетический барьер
        this.createBarrier();
        break;
        
      case 'scroll_rage':
        // Ярость
        this.addBuff('damage', gameState.player.damage, 12);
        gameState.player.rageMode = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.rageMode = false;
        }, 12000);
        break;
        
      case 'scroll_invulnerability':
        // Неуязвимость
        gameState.player.isInvulnerable = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.isInvulnerable = false;
        }, 5000);
        break;
        
      case 'scroll_vampirism':
        // Вампиризм
        gameState.player.vampirism = true;
        setTimeout(() => {
          if (gameState.player) gameState.player.vampirism = false;
        }, 15000);
        break;
        
      case 'mystery_scroll':
        // Тайный свиток - случайный эффект
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
    
    // Наносим урон всем врагам в радиусе
    if (gameState.enemies && Array.isArray(gameState.enemies)) {
      gameState.enemies.forEach(enemy => {
        if (enemy && !enemy.isDead) {
          const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
          if (distance <= radius) {
            enemy.takeDamage(damage);
            // Поджигаем врагов
            this.addDebuffToEnemy(enemy, 'burn', 5, 8);
          }
        }
      });
    }
    
    // Создаем визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');
      
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const distance = Utils.random(50, radius);
        const x = gameState.player.x + Math.cos(angle) * distance;
        const y = gameState.player.y + Math.sin(angle) * distance;
        
        createParticle(
          x, y,
          Utils.randomFloat(-100, 100),
          Utils.randomFloat(-100, 100),
          '#e74c3c',
          2.0,
          6
        );
      }
    })();
  }
  
  static createIceStorm() {
    if (!gameState.player) return;
    
    const radius = 150;
    
    // Замораживаем всех врагов в радиусе
    if (gameState.enemies && Array.isArray(gameState.enemies)) {
      gameState.enemies.forEach(enemy => {
        if (enemy && !enemy.isDead) {
          const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
          if (distance <= radius) {
            this.addDebuffToEnemy(enemy, 'freeze', 0, 5);
          }
        }
      });
    }
    
    // Создаем визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');
      
      for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const distance = Utils.random(30, radius);
        const x = gameState.player.x + Math.cos(angle) * distance;
        const y = gameState.player.y + Math.sin(angle) * distance;
        
        createParticle(
          x, y,
          Utils.randomFloat(-50, 50),
          Utils.randomFloat(-50, 50),
          '#3498db',
          1.5,
          4
        );
      }
    })();
  }
  
  static createLightningChain() {
    if (!gameState.player || !gameState.enemies || !Array.isArray(gameState.enemies) || gameState.enemies.length === 0) return;
    
    const maxTargets = 5;
    const damage = 25;
    let targets = [];
    
    // Находим ближайших врагов
    const sortedEnemies = [...gameState.enemies].filter(enemy => enemy && !enemy.isDead).sort((a, b) => {
      const distA = Math.hypot(a.x - gameState.player.x, a.y - gameState.player.y);
      const distB = Math.hypot(b.x - gameState.player.x, b.y - gameState.player.y);
      return distA - distB;
    });
    
    targets = sortedEnemies.slice(0, maxTargets);
    
    // Наносим урон цепочкой
    targets.forEach((enemy, index) => {
      enemy.takeDamage(damage);
      
      // Создаем эффект молнии между целями
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
        
        createParticle(
          x, y,
          Utils.randomFloat(-30, 30),
          Utils.randomFloat(-30, 30),
          '#f1c40f',
          1.0,
          2
        );
      }
    })();
  }
  
  static createEarthquake() {
    if (!gameState.player) return;
    
    const radius = 200;
    
    // Замедляем всех врагов в радиусе
    if (gameState.enemies && Array.isArray(gameState.enemies)) {
      gameState.enemies.forEach(enemy => {
        if (enemy && !enemy.isDead) {
          const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
          if (distance <= radius) {
            enemy.moveSpeed *= 0.3; // Замедляем на 70%
            setTimeout(() => {
              if (enemy && !enemy.isDead) {
                enemy.moveSpeed = enemy.baseMoveSpeed || enemy.moveSpeed / 0.3;
              }
            }, 8000);
          }
        }
      });
    }
    
    // Создаем визуальный эффект
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');
      
      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2;
        const distance = Utils.random(20, radius);
        const x = gameState.player.x + Math.cos(angle) * distance;
        const y = gameState.player.y + Math.sin(angle) * distance;
        
        createParticle(
          x, y,
          Utils.randomFloat(-20, 20),
          Utils.randomFloat(-20, 20),
          '#8b4513',
          1.0,
          3
        );
      }
    })();
  }
  
  static createPlayerClone() {
    if (!gameState.player) return;
    
    // Создаем временного клона
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
    
    // Удаляем клона через 20 секунд
    setTimeout(() => {
      if (gameState.clones) {
        gameState.clones = gameState.clones.filter(c => c !== clone);
      }
    }, 20000);
  }
  
  static async randomTeleport() {
    if (!gameState.player) return;
    
    // Находим случайную позицию на карте
    const { MAP_SIZE, TILE_SIZE } = await import('../config/constants.js');
    const maxX = MAP_SIZE * TILE_SIZE - 50;
    const maxY = MAP_SIZE * TILE_SIZE - 50;
    
    const newX = Math.random() * maxX + 25;
    const newY = Math.random() * maxY + 25;
    
    // Проверяем, что позиция не в стене
    if (!gameState.player.checkCollisionWithWalls(newX, newY)) {
      gameState.player.x = newX;
      gameState.player.y = newY;
    }
    
    // Создаем эффект телепортации
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
    if (!gameState.enemies || !Array.isArray(gameState.enemies)) return;
    
    // Замедляем всех врагов
    gameState.enemies.forEach(enemy => {
      if (enemy && !enemy.isDead) {
        enemy.moveSpeed *= 0.4; // Замедляем на 60%
        enemy.attackSpeed *= 0.4;
        
        setTimeout(() => {
          if (enemy && !enemy.isDead) {
            enemy.moveSpeed = enemy.baseMoveSpeed || enemy.moveSpeed / 0.4;
            enemy.attackSpeed = enemy.baseAttackSpeed || enemy.attackSpeed / 0.4;
          }
        }, 10000);
      }
    });
  }
  
  static curseEnemies() {
    if (!gameState.enemies || !Array.isArray(gameState.enemies)) return;
    
    const radius = 200;
    const debuffs = ['poison', 'burn', 'freeze', 'stun'];
    
    gameState.enemies.forEach(enemy => {
      if (enemy && !enemy.isDead) {
        const distance = Math.hypot(enemy.x - gameState.player.x, enemy.y - gameState.player.y);
        if (distance <= radius) {
          const randomDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];
          this.addDebuffToEnemy(enemy, randomDebuff, 5, 8);
        }
      }
    });
  }
  
  static createChaos() {
    if (!gameState.enemies || !Array.isArray(gameState.enemies)) return;
    
    // Заставляем врагов атаковать друг друга
    gameState.enemies.forEach(enemy => {
      if (enemy && !enemy.isDead) {
        enemy.isChaotic = true;
        enemy.chaosTime = 15;
        
        setTimeout(() => {
          if (enemy && !enemy.isDead) {
            enemy.isChaotic = false;
          }
        }, 15000);
      }
    });
  }
  
  static createFear() {
    if (!gameState.enemies || !Array.isArray(gameState.enemies)) return;
    
    // Заставляем врагов убегать от игрока
    gameState.enemies.forEach(enemy => {
      if (enemy && !enemy.isDead) {
        enemy.isAfraid = true;
        enemy.fearTime = 12;
        
        setTimeout(() => {
          if (enemy && !enemy.isDead) {
            enemy.isAfraid = false;
          }
        }, 12000);
      }
    });
  }
  
  static createSmokeScreen() {
    if (!gameState.player) return;
    
    // Создаем дымовую завесу
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
    // Находим случайную позицию на карте
    const { MAP_SIZE, TILE_SIZE } = await import('../config/constants.js');
    const maxX = MAP_SIZE * TILE_SIZE - 50;
    const maxY = MAP_SIZE * TILE_SIZE - 50;
    
    const meteorX = Math.random() * maxX + 25;
    const meteorY = Math.random() * maxY + 25;
    
    // Создаем метеорит
    gameState.meteor = {
      x: meteorX,
      y: meteorY,
      radius: 80,
      damage: 100,
      duration: 3,
      startTime: gameState.gameTime
    };
    
            // Наносим урон всем врагам в радиусе
        setTimeout(() => {
          if (gameState.meteor && gameState.enemies && Array.isArray(gameState.enemies)) {
            gameState.enemies.forEach(enemy => {
              if (enemy && !enemy.isDead) {
                const distance = Math.hypot(enemy.x - meteorX, enemy.y - meteorY);
                if (distance <= 80) {
                  enemy.takeDamage(100);
                }
              }
            });
        
        // Создаем взрывной эффект
        (async () => {
          const { Utils } = await import('../utils/Utils.js');
          const { createParticle } = await import('../effects/Particle.js');
          
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const distance = Utils.random(20, 80);
            const x = meteorX + Math.cos(angle) * distance;
            const y = meteorY + Math.sin(angle) * distance;
            
            createParticle(
              x, y,
              Utils.randomFloat(-150, 150),
              Utils.randomFloat(-150, 150),
              '#e67e22',
              3.0,
              8
            );
          }
        })();
        
        gameState.meteor = null;
      }
    }, 3000);
  }
  
  static createBarrier() {
    if (!gameState.player) return;
    
    // Создаем энергетический барьер
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
  
  static addDebuffToEnemy(enemy, type, value, duration) {
    const debuff = {
      type,
      value,
      duration,
      remainingTime: duration,
      startTime: gameState.gameTime
    };
    
    enemy.debuffs = enemy.debuffs || [];
    enemy.debuffs.push(debuff);
  }
}
