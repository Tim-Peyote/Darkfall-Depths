/* Darkfall Depths - Система временных баффов */

import { gameState } from './GameState.js';
import { Utils } from '../utils/Utils.js';

export class BuffManager {
  static addBuff(type, value, duration, icon = null) {
    // Проверяем, нет ли уже такого баффа — если есть, обновляем длительность вместо стака
    const existingBuff = gameState.buffs.active.find(b => b.type === type);
    if (existingBuff) {
      // Снимаем старый бафф перед обновлением
      this.removeBuffFromPlayer(existingBuff);
      existingBuff.duration = duration;
      existingBuff.remainingTime = duration;
      existingBuff.value = value;
      existingBuff.startTime = gameState.gameTime;
      // Применяем обновлённый бафф
      this.applyBuffToPlayer(existingBuff);
      return;
    }

    const buff = {
      type,
      value,
      duration,
      remainingTime: duration,
      icon: icon || gameState.buffs.icons[type] || '???',
      startTime: gameState.gameTime
    };

    gameState.buffs.active.push(buff);

    // Применяем бафф к игроку
    this.applyBuffToPlayer(buff);
  }

  static addDebuff(type, value, duration, icon = null) {
    // Проверяем, нет ли уже такого дебаффа — если есть, обновляем длительность
    const existingDebuff = gameState.debuffs.active.find(d => d.type === type);
    if (existingDebuff) {
      // Снимаем старый дебафф перед обновлением
      this.removeDebuffFromPlayer(existingDebuff);
      existingDebuff.duration = duration;
      existingDebuff.remainingTime = duration;
      existingDebuff.value = value;
      existingDebuff.startTime = gameState.gameTime;
      // Применяем обновлённый дебафф
      this.applyDebuffToPlayer(existingDebuff);
      return;
    }

    const debuff = {
      type,
      value,
      duration,
      remainingTime: duration,
      icon: icon || gameState.debuffs.icons[type] || '✗',
      startTime: gameState.gameTime,
      isDebuff: true
    };

    gameState.debuffs.active.push(debuff);

    // Применяем дебаф к игроку
    this.applyDebuffToPlayer(debuff);
  }

  // Рассчитывает итоговое значение стата из base + активные баффы (кроме удаляемого)
  static recalcStatFromBuffs(excludedBuffType = null, excludedDebuffType = null) {
    if (!gameState.player) return;
    const p = gameState.player;
    const baseMove = p.baseMoveSpeed || p.moveSpeed;
    const baseDamage = p.baseDamage || p.damage;
    const baseDefense = p.baseDefense || p.defense;
    const baseAttackSpeed = p.baseAttackSpeed || p.attackSpeed;

    // Сбрасываем к базовым
    p.moveSpeed = baseMove;
    p.damage = baseDamage;
    p.defense = baseDefense;
    p.attackSpeed = baseAttackSpeed;
    p.crit = p.crit || 0;
    p.attackRadius = p.attackRadius || 30;

    // Переприменяем все активные баффы (кроме excluded)
    for (const buff of gameState.buffs.active) {
      if (buff.type === excludedBuffType) continue;
      this.applyBuffToPlayer(buff);
    }

    // Переприменяем все активные дебаффы (кроме excluded)
    for (const debuff of gameState.debuffs.active) {
      if (debuff.type === excludedDebuffType) continue;
      this.applyDebuffToPlayer(debuff);
    }
  }

  static applyBuffToPlayer(buff) {
    if (!gameState.player) return;

    switch (buff.type) {
      case 'damage':
        gameState.player.damage += buff.value;
        break;
      case 'crit':
        gameState.player.crit += buff.value;
        break;
      case 'defense':
        gameState.player.defense += buff.value;
        break;
      case 'moveSpeed':
        gameState.player.moveSpeed += buff.value;
        break;
      case 'attackSpeed':
        gameState.player.attackSpeed = Math.max(0.1, gameState.player.attackSpeed - buff.value / 100);
        break;
      case 'attackRadius':
        gameState.player.attackRadius += buff.value;
        break;
      case 'fire':
        // Огненный перк: увеличивает урон и добавляет шанс поджечь врагов
        gameState.player.damage += buff.value;
        gameState.player.fireChance = (gameState.player.fireChance || 0) + 0.08;
        gameState.player.fireDamage = (gameState.player.fireDamage || 0) + Math.floor(buff.value * 0.3);
        break;
      case 'ice':
        // Ледяной перк: увеличивает урон и добавляет шанс заморозить врагов
        gameState.player.damage += buff.value;
        gameState.player.iceChance = (gameState.player.iceChance || 0) + 0.06;
        gameState.player.iceSlow = (gameState.player.iceSlow || 0) + 0.2;
        break;
      case 'invisibility':
        // Невидимость — скрывает от врагов
        if (gameState.player) gameState.player.isInvisible = true;
        break;
      case 'rage':
        // Ярость — удваивает урон
        if (gameState.player) gameState.player.rageMode = true;
        break;
      case 'invulnerability':
        // Неуязвимость — полный иммунитет к урону
        if (gameState.player) gameState.player.isInvulnerable = true;
        break;
      case 'vampirism':
        // Вампиризм — лечение при атаке
        if (gameState.player) gameState.player.vampirism = true;
        break;
    }
  }

  static applyDebuffToPlayer(debuff) {
    if (!gameState.player) return;

    switch (debuff.type) {
      case 'poison':
        // Яд наносит урон каждый тик
        debuff.lastTick = 0;
        debuff.tickInterval = 1.0;
        break;
      case 'burn':
        // Ожог наносит урон каждый тик
        debuff.lastTick = 0;
        debuff.tickInterval = 0.8;
        break;
      case 'freeze':
        // Заморозка замедляет движение и атаку
        gameState.player.moveSpeed = Math.max(10, gameState.player.moveSpeed * 0.3);
        gameState.player.attackSpeed = Math.max(0.3, gameState.player.attackSpeed * 0.5);
        break;
      case 'stun':
        // Стан полностью блокирует действия
        gameState.player.isStunned = true;
        break;
      case 'slow':
        // Замедление — снижает скорость передвижения
        gameState.player.moveSpeed = Math.max(20, gameState.player.moveSpeed * (1 - debuff.value));
        break;
      case 'weakness':
        // Слабость — снижает урон
        gameState.player.damage = Math.max(1, gameState.player.damage * (1 - debuff.value));
        break;
      case 'vulnerability':
        // Уязвимость — снижает защиту
        gameState.player.defense = Math.max(0, gameState.player.defense - debuff.value);
        break;
    }
  }

  static removeBuffFromPlayer(buff) {
    if (!gameState.player) return;

    switch (buff.type) {
      case 'damage':
        gameState.player.damage -= buff.value;
        break;
      case 'crit':
        gameState.player.crit -= buff.value;
        break;
      case 'defense':
        gameState.player.defense -= buff.value;
        break;
      case 'moveSpeed':
        gameState.player.moveSpeed -= buff.value;
        break;
      case 'attackSpeed':
        gameState.player.attackSpeed = Math.max(0.1, gameState.player.attackSpeed + buff.value / 100);
        break;
      case 'attackRadius':
        gameState.player.attackRadius -= buff.value;
        break;
      case 'fire':
        gameState.player.damage -= buff.value;
        gameState.player.fireChance = Math.max(0, (gameState.player.fireChance || 0) - 0.08);
        gameState.player.fireDamage = Math.max(0, (gameState.player.fireDamage || 0) - Math.floor(buff.value * 0.3));
        break;
      case 'ice':
        gameState.player.damage -= buff.value;
        gameState.player.iceChance = Math.max(0, (gameState.player.iceChance || 0) - 0.06);
        gameState.player.iceSlow = Math.max(0, (gameState.player.iceSlow || 0) - 0.2);
        break;
      case 'invisibility':
        if (gameState.player) gameState.player.isInvisible = false;
        break;
      case 'rage':
        if (gameState.player) gameState.player.rageMode = false;
        break;
      case 'invulnerability':
        if (gameState.player) gameState.player.isInvulnerable = false;
        break;
      case 'vampirism':
        if (gameState.player) gameState.player.vampirism = false;
        break;
    }
  }

  static removeDebuffFromPlayer(debuff) {
    if (!gameState.player) return;

    // Вместо прямого сброса в base, пересчитываем статы из активных баффов
    this.recalcStatFromBuffs(null, debuff.type);

    // Для статус-эффектов просто снимаем флаг
    if (debuff.type === 'stun') {
      gameState.player.isStunned = false;
    }
  }
  
  static update(dt) {
    // Обновляем время всех активных баффов
    for (let i = gameState.buffs.active.length - 1; i >= 0; i--) {
      const buff = gameState.buffs.active[i];
      buff.remainingTime -= dt;
      
      // Обрабатываем регенерацию
      if (buff.type === 'regen') {
        buff.lastTick += dt;
        
        if (buff.lastTick >= buff.tickInterval) {
          if (gameState.player) {
            const healAmount = Math.min(buff.value, gameState.player.maxHp - gameState.player.hp);
            if (healAmount > 0) {
              gameState.player.hp += healAmount;
            }
          }
          buff.lastTick = 0;
        }
      }
      
      // Если бафф истек, удаляем его
      if (buff.remainingTime <= 0) {
        this.removeBuffFromPlayer(buff);
        gameState.buffs.active.splice(i, 1);
      }
    }
    
    // Обновляем время всех активных дебафов
    for (let i = gameState.debuffs.active.length - 1; i >= 0; i--) {
      const debuff = gameState.debuffs.active[i];
      debuff.remainingTime -= dt;
      
      // Обрабатываем яд
      if (debuff.type === 'poison') {
        debuff.lastTick += dt;
        
        if (debuff.lastTick >= debuff.tickInterval) {
          if (gameState.player) {
            gameState.player.takeDamage(debuff.value);
            // Создаем частицы яда
            (async () => {
              const { createParticle } = await import('../effects/Particle.js');
              for (let j = 0; j < 3; j++) {
                createParticle(
                  gameState.player.x + Utils.random(-15, 15),
                  gameState.player.y + Utils.random(-15, 15),
                  Utils.randomFloat(-20, 20),
                  Utils.randomFloat(-20, 20),
                  '#27ae60',
                  0.8,
                  1.5
                );
              }
            })();
          }
          debuff.lastTick = 0;
        }
      }
      
      // Обрабатываем ожог
      if (debuff.type === 'burn') {
        debuff.lastTick += dt;
        
        if (debuff.lastTick >= debuff.tickInterval) {
          if (gameState.player) {
            gameState.player.takeDamage(debuff.value);
            // Создаем огненные частицы
            (async () => {
              const { createParticle } = await import('../effects/Particle.js');
              for (let j = 0; j < 4; j++) {
                createParticle(
                  gameState.player.x + Utils.random(-15, 15),
                  gameState.player.y + Utils.random(-15, 15),
                  Utils.randomFloat(-30, 30),
                  Utils.randomFloat(-30, 30),
                  '#e67e22',
                  0.9,
                  2
                );
              }
            })();
          }
          debuff.lastTick = 0;
        }
      }
      
      // Если дебаф истек, удаляем его
      if (debuff.remainingTime <= 0) {
        this.removeDebuffFromPlayer(debuff);
        gameState.debuffs.active.splice(i, 1);
      }
    }
  }
  
  static getActiveBuffs() {
    return gameState.buffs.active;
  }
  
  static getActiveDebuffs() {
    return gameState.debuffs.active;
  }
  
  static clearAllBuffs() {
    // Удаляем все баффы с игрока
    gameState.buffs.active.forEach(buff => {
      this.removeBuffFromPlayer(buff);
    });
    
    // Очищаем список баффов
    gameState.buffs.active = [];
  }
  
  static clearAllDebuffs() {
    // Удаляем все дебафы с игрока
    gameState.debuffs.active.forEach(debuff => {
      this.removeDebuffFromPlayer(debuff);
    });
    
    // Очищаем список дебафов
    gameState.debuffs.active = [];
  }
  
  static async applyConsumableEffects(item) {
    if (!item || !item.bonus) return;
    
    // Проверяем, является ли предмет свитком
    if (item.base && item.base.startsWith('scroll_')) {
      const { ScrollManager } = await import('./ScrollManager.js');
      await ScrollManager.applyScrollEffects(item);
      return;
    }
    
    // Тайная банка - применяем случайные эффекты
    if (item.bonus.mystery && item.bonus.effects) {
      this.applyMysteryEffects(item.bonus.effects);
      return;
    }
    
    // Зелье очищения - снимает все негативные эффекты
    if (item.bonus.purify) {
      this.clearAllDebuffs();
      
      // Создаем эффект очищения
      (async () => {
        const { Utils } = await import('../utils/Utils.js');
        const { createParticle } = await import('../effects/Particle.js');
        
        // Создаем частицы очищения
        for (let i = 0; i < 8; i++) {
          createParticle(
            gameState.player.x + Utils.random(-20, 20),
            gameState.player.y + Utils.random(-20, 20),
            Utils.randomFloat(-40, 40),
            Utils.randomFloat(-40, 40),
            '#f39c12', // Золотой цвет для очищения
            1.2,
            3
          );
        }
      })();
    }
    
    // Мгновенное восстановление здоровья
    if (item.bonus.heal && !item.bonus.regenDuration) {
      if (gameState.player) {
        gameState.player.hp = Math.min(gameState.player.hp + item.bonus.heal, gameState.player.maxHp);
      }
    }
    
    // Временные баффы
    const buffStats = ['damage', 'crit', 'defense', 'moveSpeed', 'attackSpeed', 'attackRadius', 'fire', 'ice'];
    buffStats.forEach(stat => {
      if (item.bonus[stat] && item.bonus.duration) {
        this.addBuff(stat, item.bonus[stat], item.bonus.duration);
      }
    });
    
    // Регенерация здоровья
    if (item.bonus.heal && item.bonus.regenDuration) {
      this.addRegenerationBuff(item.bonus.heal, item.bonus.regenDuration, item.bonus.regenTick || 1);
    }
  }
  
  static addRegenerationBuff(totalHeal, duration, tickInterval) {
    const healPerTick = totalHeal / (duration / tickInterval);
    const buff = {
      type: 'regen',
      value: healPerTick,
      duration,
      remainingTime: duration,
      icon: 'REG',
      startTime: gameState.gameTime,
      tickInterval,
      lastTick: 0
    };
    
    gameState.buffs.active.push(buff);
  }
  
  static updateRegeneration(dt) {
    // Обновляем регенерацию в основном цикле update, поэтому здесь ничего не делаем
    // Регенерация обрабатывается в update() через общий механизм баффов
  }
  
  static applyMysteryEffects(effects) {
    if (!gameState.player) return;
    
    // Создаем эффект тайной банки
    (async () => {
      const { Utils } = await import('../utils/Utils.js');
      const { createParticle } = await import('../effects/Particle.js');
      
      // Создаем частицы тайной банки
      for (let i = 0; i < 12; i++) {
        createParticle(
          gameState.player.x + Utils.random(-25, 25),
          gameState.player.y + Utils.random(-25, 25),
          Utils.randomFloat(-50, 50),
          Utils.randomFloat(-50, 50),
          '#8e44ad', // Фиолетовый цвет для тайной банки
          1.5,
          4
        );
      }
    })();
    
    // Применяем каждый эффект
    effects.forEach(effect => {
      if (effect.isPositive) {
        // Положительные эффекты
        switch (effect.type) {
          case 'heal':
            gameState.player.hp = Math.min(gameState.player.hp + effect.value, gameState.player.maxHp);
            break;
          case 'maxHp':
            gameState.player.maxHp += effect.value;
            gameState.player.hp += effect.value; // Восстанавливаем здоровье при увеличении максимума
            break;
          case 'damage':
          case 'defense':
          case 'moveSpeed':
          case 'crit':
          case 'attackSpeed':
          case 'attackRadius':
          case 'fire':
          case 'ice':
            if (effect.duration) {
              this.addBuff(effect.type, effect.value, effect.duration);
            } else {
              // Мгновенные эффекты
              this.applyBuffToPlayer({ type: effect.type, value: effect.value });
            }
            break;
        }
      } else {
        // Отрицательные эффекты
        switch (effect.type) {
          case 'poison':
          case 'burn':
          case 'freeze':
          case 'slow':
          case 'weakness':
          case 'vulnerability':
            this.addDebuff(effect.type, effect.value, effect.duration);
            break;
          case 'damage_debuff':
            this.addDebuff('weakness', effect.value, effect.duration, 'WKN');
            break;
          case 'defense_debuff':
            this.addDebuff('vulnerability', effect.value, effect.duration, 'VUL');
            break;
          case 'moveSpeed_debuff':
            this.addDebuff('slow', effect.value, effect.duration, 'SLW');
            break;
        }
      }
    });
  }
}
