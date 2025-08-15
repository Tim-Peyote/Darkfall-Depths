/* Darkfall Depths - Игрок */

import { Entity } from './Entity.js';
import { gameState, canvas, ctx, DPR } from '../core/GameState.js';
import { audioManager } from '../audio/AudioManager.js';
import { Projectile } from './Projectile.js';
import { createParticle } from '../effects/Particle.js';
import { Utils } from '../utils/Utils.js';
import { TILE_SIZE } from '../config/constants.js';

export class Player extends Entity {
  constructor(charData, x, y) {
    super(x, y);
    Object.assign(this, charData);
    this.attackCooldown = 0;
    this.dashCooldown = 0;
    this.shieldCooldown = 0;
    this.blastCooldown = 0;
    this.radius = 14;
    this.attackAnimation = 0;
    this.isInvulnerable = false;
    this.invulnerabilityTime = 0;
    this.isShieldActive = false;
    this.shieldTime = 0;
    this.direction = { x: 0, y: 0 }; // Направление движения для фонарика
  }
  
  update(dt) {
    super.update(dt);
    this.updateMovement(dt);
    this.updateCooldowns(dt);
    this.updateInvulnerability(dt);
    this.updateAttack(dt);
  }
  
  updateMovement(dt) {
    let dx = 0, dy = 0;
    
    // Ввод с клавиатуры
    if (gameState.input.keys['KeyW'] || gameState.input.keys['ArrowUp']) dy -= 1;
    if (gameState.input.keys['KeyS'] || gameState.input.keys['ArrowDown']) dy += 1;
    if (gameState.input.keys['KeyA'] || gameState.input.keys['ArrowLeft']) dx -= 1;
    if (gameState.input.keys['KeyD'] || gameState.input.keys['ArrowRight']) dx += 1;
    
    // Джойстик (мобильное управление)
    if (gameState.input.joystick.active) {
      dx += gameState.input.joystick.dx;
      dy += gameState.input.joystick.dy;
    }
    
    // Нормализация и применение движения
    const inputMagnitude = Math.hypot(dx, dy);
    if (inputMagnitude > 0) {
      dx /= inputMagnitude;
      dy /= inputMagnitude;
      
      // Обновляем направление движения для фонарика
      this.direction.x = dx;
      this.direction.y = dy;
      
      const newX = this.x + dx * this.moveSpeed * dt;
      const newY = this.y + dy * this.moveSpeed * dt;
      
      // Проверка коллизий отдельно для каждой оси
      if (!this.checkCollisionWithWalls(newX, this.y)) {
        this.x = newX;
      }
      if (!this.checkCollisionWithWalls(this.x, newY)) {
        this.y = newY;
      }
    }
    
    // Обновляем туман войны
    if (gameState.fogOfWar) {
      gameState.fogOfWar.updateVisibility(this.x, this.y);
    }
  }
  
  updateCooldowns(dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.hasDash) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
    if (this.hasShield) {
      this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    }
    if (this.hasBlast) {
      this.blastCooldown = Math.max(0, this.blastCooldown - dt);
    }
    if (this.attackAnimation > 0) {
      this.attackAnimation = Math.max(0, this.attackAnimation - dt * 4);
    }
    
    // Обновление щита
    if (this.isShieldActive) {
      this.shieldTime -= dt;
      if (this.shieldTime <= 0) {
        this.isShieldActive = false;
      }
    }
  }
  
  updateInvulnerability(dt) {
    if (this.isInvulnerable) {
      this.invulnerabilityTime -= dt;
      if (this.invulnerabilityTime <= 0) {
        this.isInvulnerable = false;
      }
    }
  }
  
  updateAttack(dt) {
    // Проверяем, есть ли враги в радиусе атаки
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && !e.isDead);
    if (enemies.length === 0) return;
    
    // Находим ближайшего врага
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = Utils.distance(this, enemy);
      if (distance <= this.attackRadius && distance < closestDistance) {
        // Проверяем линию видимости
        if (this.hasLineOfSight(enemy.x, enemy.y)) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      }
    }
    
    // Если есть враг в радиусе атаки и кулдаун истек, атакуем
    if (closestEnemy && this.attackCooldown <= 0) {
      this.performAttack();
    }
  }
  
  performAttack() {
    if (this.attackCooldown > 0) return false;
    
    this.attackCooldown = this.attackSpeed;
    
    if (this.type === 'melee') {
      return this.performMeleeAttack();
    } else {
      return this.performRangedAttack();
    }
  }
  
  performMeleeAttack() {
    // Находим ближайшего врага в радиусе атаки
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && !e.isDead);
    if (enemies.length === 0) return false;
    
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = Utils.distance(this, enemy);
      if (distance <= this.attackRadius && distance < closestDistance) {
        // Проверяем линию видимости - нельзя атаковать через стены
        if (this.hasLineOfSight(enemy.x, enemy.y)) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      }
    }
    
    if (closestEnemy) {
      closestEnemy.takeDamage(this.damage);
      
      // Воспроизводим звук атаки в зависимости от персонажа
      if (this.id === 'andre') {
        audioManager.playSwordAttack();
      } else if (this.id === 'tim') {
        audioManager.playDaggerAttack();
      }
      
      this.attackAnimation = 1.0;
      
      // Частицы атаки
      for (let i = 0; i < 8; i++) {
        createParticle(
          closestEnemy.x + Utils.random(-15, 15),
          closestEnemy.y + Utils.random(-15, 15),
          Utils.randomFloat(-100, 100),
          Utils.randomFloat(-100, 100),
          '#ff6b6b',
          0.5,
          3
        );
      }
      return true;
    }
    return false;
  }
  
  performRangedAttack() {
    // Находим ближайшего врага в радиусе атаки
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && !e.isDead);
    if (enemies.length === 0) return false;
    
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = Utils.distance(this, enemy);
      if (distance <= this.attackRadius && distance < closestDistance) {
        // Проверяем линию видимости - нельзя атаковать через стены
        if (this.hasLineOfSight(enemy.x, enemy.y)) {
          closestEnemy = enemy;
          closestDistance = distance;
        }
      }
    }
    
    if (closestEnemy) {
      // Создаем снаряд (используем уже загруженный модуль)
      const projectile = new Projectile(this.x, this.y, closestEnemy, this.damage, this.projectileSpeed);
      gameState.projectiles.push(projectile);
      
      // Воспроизводим звук атаки для мага
      if (this.id === 'dimon') {
        audioManager.playFireballAttack();
      }
      
      return true;
    }
    return false;
  }
  
  performDash() {
    if (!this.hasDash || this.dashCooldown > 0) return;
    
    let dx = 0, dy = 0;
    
    // Определяем направление движения
    if (gameState.input.keys['KeyW'] || gameState.input.keys['ArrowUp']) dy -= 1;
    if (gameState.input.keys['KeyS'] || gameState.input.keys['ArrowDown']) dy += 1;
    if (gameState.input.keys['KeyA'] || gameState.input.keys['ArrowLeft']) dx -= 1;
    if (gameState.input.keys['KeyD'] || gameState.input.keys['ArrowRight']) dx += 1;
    
    if (gameState.input.joystick.active) {
      dx += gameState.input.joystick.dx;
      dy += gameState.input.joystick.dy;
    }
    
    const inputMagnitude = Math.hypot(dx, dy);
    if (inputMagnitude > 0) {
      dx /= inputMagnitude;
      dy /= inputMagnitude;
      
      const newX = this.x + dx * this.dashDistance;
      const newY = this.y + dy * this.dashDistance;
      
      if (!this.checkCollisionWithWalls(newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.dashCooldown = 3.0;
        audioManager.playDashSound();
        
        // Частицы дэша
        for (let i = 0; i < 12; i++) {
          createParticle(
            this.x + Utils.random(-20, 20),
            this.y + Utils.random(-20, 20),
            Utils.randomFloat(-150, 150),
            Utils.randomFloat(-150, 150),
            this.color,
            0.8,
            4
          );
        }
      }
    }
  }
  
  performShield() {
    if (!this.hasShield || this.shieldCooldown > 0) return;
    
    this.isShieldActive = true;
    this.shieldTime = this.shieldDuration;
    this.shieldCooldown = 8.0; // Устанавливаем откат
    audioManager.playArmor();
    
    // Частицы щита
    for (let i = 0; i < 20; i++) {
      createParticle(
        this.x + Utils.random(-30, 30),
        this.y + Utils.random(-30, 30),
        Utils.randomFloat(-100, 100),
        Utils.randomFloat(-100, 100),
        '#3498db',
        1.0,
        5
      );
    }
  }
  
  performBlast() {
    if (!this.hasBlast || this.blastCooldown > 0) return;
    
    this.blastCooldown = 12.0; // Устанавливаем откат
    audioManager.playExplosion();
    
    // Наносим урон всем врагам в радиусе
    gameState.entities.forEach(entity => {
      if (entity.constructor.name === 'Enemy') {
        const distance = Math.hypot(entity.x - this.x, entity.y - this.y);
        if (distance <= this.blastRadius) {
          entity.takeDamage(this.blastDamage);
        }
      }
    });
    
    // Частицы взрыва
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const distance = Utils.random(20, this.blastRadius);
      const x = this.x + Math.cos(angle) * distance;
      const y = this.y + Math.sin(angle) * distance;
      
      createParticle(
        x,
        y,
        Math.cos(angle) * Utils.random(100, 200),
        Math.sin(angle) * Utils.random(100, 200),
        '#e67e22',
        1.0,
        6
      );
    }
  }
  
  takeDamage(damage) {
    if (this.isInvulnerable) return;
    
    // Если активен щит, уменьшаем урон
    let actualDamage = damage;
    if (this.isShieldActive) {
      actualDamage = Math.max(1, damage - this.shieldDefenseBonus);
    }
    
    this.hp -= actualDamage;
    this.isInvulnerable = true;
    this.invulnerabilityTime = 1.0;
    audioManager.playHeroesHit();
    
    // Частицы урона
    for (let i = 0; i < 10; i++) {
      createParticle(
        this.x + Utils.random(-15, 15),
        this.y + Utils.random(-15, 15),
        Utils.randomFloat(-80, 80),
        Utils.randomFloat(-80, 80),
        '#e74c3c',
        0.8,
        3
      );
    }
    
    if (this.hp <= 0) {
      // Воспроизводим звук смерти героя
      audioManager.playHeroesDie();
      
      // Используем setTimeout для асинхронного вызова
      setTimeout(async () => {
        const { LevelManager } = await import('../game/LevelManager.js');
        await LevelManager.showGameOver();
      }, 0);
    }
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    // Определяем состояние анимации
    const isMoving = this.isMoving();
    const isAttacking = this.attackAnimation > 0;
    const isIdle = !isMoving && !isAttacking;
    const idleTime = this.getIdleTime();
    
    // Рисуем стилизованного героя
    this.renderCustomHero(ctx, screenX, screenY, isMoving, isAttacking, isIdle, idleTime);
    
    // Индикатор здоровья
    this.drawHealthBar();
  }
  
  isMoving() {
    return gameState.input.keys['KeyW'] || gameState.input.keys['KeyS'] || 
           gameState.input.keys['KeyA'] || gameState.input.keys['KeyD'] ||
           gameState.input.keys['ArrowUp'] || gameState.input.keys['ArrowDown'] ||
           gameState.input.keys['ArrowLeft'] || gameState.input.keys['ArrowRight'] ||
           gameState.input.joystick.active;
  }
  
  getIdleTime() {
    if (!this.lastMoveTime) {
      this.lastMoveTime = 0;
    }
    if (this.isMoving()) {
      this.lastMoveTime = this.animationTime;
    }
    return this.animationTime - this.lastMoveTime;
  }
  
  drawHealthBar() {
    const barWidth = 40;
    const barHeight = 6;
    const barX = this.x - gameState.camera.x - barWidth / 2;
    const barY = this.y - gameState.camera.y - this.radius - 15;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#e74c3c';
    const healthPercent = this.hp / this.maxHp;
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);
  }
  

  
  renderCustomHero(ctx, x, y, isMoving, isAttacking, isIdle, idleTime) {
    ctx.save();
    
    // Анимация неуязвимости
    const alpha = this.isInvulnerable ? 0.5 + Math.sin(this.animationTime * 10) * 0.3 : 1;
    ctx.globalAlpha = alpha;
    
    // Анимация атаки - увеличение
    const attackScale = isAttacking ? 1 + this.attackAnimation * 0.3 : 1;
    
    // Анимация ходьбы - покачивание
    let walkOffset = 0;
    if (isMoving) {
      walkOffset = Math.sin(this.animationTime * 8) * 2;
    }
    
    ctx.translate(x, y + walkOffset);
    ctx.scale(attackScale, attackScale);
    ctx.translate(-x, -(y + walkOffset));
    
    switch (this.class) {
      case 'mage':
        this.renderMage(ctx, x, y, isMoving, isAttacking, isIdle, idleTime);
        break;
      case 'warrior':
        this.renderWarrior(ctx, x, y, isMoving, isAttacking, isIdle, idleTime);
        break;
      case 'rogue':
        this.renderRogue(ctx, x, y, isMoving, isAttacking, isIdle, idleTime);
        break;
      default:
        // Fallback на эмодзи
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.sprite, x, y + 8);
    }
    
    // Визуализация щита
    if (this.isShieldActive) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderMage(ctx, x, y, isMoving, isAttacking, isIdle, idleTime) {
    const size = this.radius * 0.9;
    
    // Мантия мага
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон
    ctx.fillStyle = '#6c3483';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Лицо
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.25, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y - size * 0.3, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + size * 0.08, y - size * 0.3, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Посох
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.4);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.stroke();
    
    // Магический кристалл
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.4, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - магический взрыв
    if (isAttacking) {
      const explosionSize = size * 0.8 + Math.sin(this.animationTime * 20) * size * 0.2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, explosionSize);
      gradient.addColorStop(0, 'rgba(155, 89, 182, 0.6)');
      gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, explosionSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Анимация ожидания - магические частицы
    if (isIdle && idleTime > 4) {
      ctx.fillStyle = '#9b59b6';
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + this.animationTime * 1.5;
        const particleX = x + Math.cos(angle) * size * 0.7;
        const particleY = y + Math.sin(angle) * size * 0.7;
        ctx.fillRect(particleX, particleY, 2, 2);
      }
    }
  }
  
  renderWarrior(ctx, x, y, isMoving, isAttacking, isIdle, idleTime) {
    const size = this.radius * 0.9;
    
    // Тело воина
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.arc(x + size * 0.1, y - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Броня
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.2);
    ctx.lineTo(x + size * 0.4, y - size * 0.2);
    ctx.stroke();
    
    // Меч
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.3, y - size * 0.2);
    ctx.lineTo(x + size * 0.6, y + size * 0.1);
    ctx.stroke();
    
    // Щит
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - size * 0.4, y - size * 0.15, size * 0.2, size * 0.3);
    
    // Анимация атаки - меч светится
    if (isAttacking) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.3, y - size * 0.2);
      ctx.lineTo(x + size * 0.7, y + size * 0.1);
      ctx.stroke();
    }
    
    // Анимация ожидания - дыхание
    if (isIdle && idleTime > 4) {
      const breathScale = 1 + Math.sin(this.animationTime * 2) * 0.05;
      ctx.save();
      ctx.scale(breathScale, breathScale);
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  renderRogue(ctx, x, y, isMoving, isAttacking, isIdle, idleTime) {
    const size = this.radius * 0.9;
    
    // Тело разбойника
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.25, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x - size * 0.08, y - size * 0.3, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + size * 0.08, y - size * 0.3, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Кинжалы
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.25, y - size * 0.1);
    ctx.lineTo(x - size * 0.4, y + size * 0.1);
    ctx.moveTo(x + size * 0.25, y - size * 0.1);
    ctx.lineTo(x + size * 0.4, y + size * 0.1);
    ctx.stroke();
    
    // Анимация атаки - кинжалы сверкают
    if (isAttacking) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.25, y - size * 0.1);
      ctx.lineTo(x - size * 0.45, y + size * 0.1);
      ctx.moveTo(x + size * 0.25, y - size * 0.1);
      ctx.lineTo(x + size * 0.45, y + size * 0.1);
      ctx.stroke();
    }
    
    // Анимация ожидания - скрытность
    if (isIdle && idleTime > 4) {
      const stealthAlpha = 0.7 + Math.sin(this.animationTime * 3) * 0.3;
      ctx.save();
      ctx.globalAlpha = stealthAlpha;
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  hasLineOfSight(targetX, targetY) {
    // Простая проверка прямой видимости
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance === 0) return true;
    
    const stepX = dx / distance;
    const stepY = dy / distance;
    
    for (let i = 1; i < distance; i += 32) {
      const checkX = this.x + stepX * i;
      const checkY = this.y + stepY * i;
      
      const tileX = Math.floor(checkX / 32);
      const tileY = Math.floor(checkY / 32);
      
      if (tileX < 0 || tileX >= gameState.map[0].length || tileY < 0 || tileY >= gameState.map.length ||
          gameState.map[tileY][tileX] === 1) {
        return false;
      }
    }
    
    return true;
  }
} 