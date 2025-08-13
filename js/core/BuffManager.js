/* Darkfall Depths - Система временных баффов */

import { gameState } from './GameState.js';

export class BuffManager {
  static addBuff(type, value, duration, icon = null) {
    const buff = {
      type,
      value,
      duration,
      remainingTime: duration,
      icon: icon || gameState.buffs.icons[type] || '✨',
      startTime: gameState.gameTime
    };
    
    gameState.buffs.active.push(buff);
    
    // Применяем бафф к игроку
    this.applyBuffToPlayer(buff);
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
      case 'ice':
        gameState.player.damage += buff.value;
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
      case 'ice':
        gameState.player.damage -= buff.value;
        break;
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
  }
  
  static getActiveBuffs() {
    return gameState.buffs.active;
  }
  
  static clearAllBuffs() {
    // Удаляем все баффы с игрока
    gameState.buffs.active.forEach(buff => {
      this.removeBuffFromPlayer(buff);
    });
    
    // Очищаем список баффов
    gameState.buffs.active = [];
  }
  
  static applyConsumableEffects(item) {
    if (!item || !item.bonus) return;
    
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
      icon: '💚',
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
}
