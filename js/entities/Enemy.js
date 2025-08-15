/* Darkfall Depths - Класс врага */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { ENEMY_TYPES, generateRandomItem } from '../config/constants.js';
import { createParticle } from '../effects/Particle.js';

export class Enemy extends Entity {
  constructor(x, y, type) {
    super(x, y);
    const enemyData = ENEMY_TYPES.find(e => e.type === type) || ENEMY_TYPES[0];
    Object.assign(this, enemyData);
    this.maxHp = this.hp;
    this.attackCooldown = 0;
    this.radius = 14; // Такой же размер, как у игрока
    this.pathfindingCooldown = 0;
    this.targetX = x;
    this.targetY = y;
  }
  
  update(dt) {
    super.update(dt);
    
    if (this.isDead) return;
    
    const player = gameState.player;
    if (!player) return;
    
    // Обновление анимации
    this.animationTime += dt;
    
    // Обновление кулдауна атаки
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    
    // Движение к игроку
    const distance = Utils.distance(this, player);
    
    if (distance > this.attackRange) {
      // Движение к игроку
      this.targetX = player.x;
      this.targetY = player.y;
      
      const angle = Utils.angle(this, { x: this.targetX, y: this.targetY });
      const newX = this.x + Math.cos(angle) * this.speed * dt;
      const newY = this.y + Math.sin(angle) * this.speed * dt;
      
      if (!this.checkCollisionWithWalls(newX, this.y)) {
        this.x = newX;
      }
      if (!this.checkCollisionWithWalls(this.x, newY)) {
        this.y = newY;
      }
    } else if (this.attackCooldown <= 0) {
      // Атака игрока
      if (this.attackRange > 48 && this.projectileSpeed) {
        // Дальняя атака
        this.performRangedAttack(player);
      } else {
        // Ближняя атака
        player.takeDamage(this.damage);
      }
      this.attackCooldown = 1.5 + Math.random() * 0.5;
    }
  }
  
  async performRangedAttack(target) {
    // Создаем снаряд
    const { EnemyProjectile } = await import('./Projectile.js');
    const projectile = new EnemyProjectile(this.x, this.y, target, this.damage, this.projectileSpeed);
    gameState.projectiles.push(projectile);
  }
  
  takeDamage(damage) {
    this.hp -= damage;
    
    // Воспроизводим звук попадания по врагу (асинхронно)
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playEnemyHit();
    })();
    
    // Частицы урона
    for (let i = 0; i < 5; i++) {
      createParticle(
        this.x + Utils.random(-10, 10),
        this.y + Utils.random(-10, 10),
        Utils.randomFloat(-60, 60),
        Utils.randomFloat(-60, 60),
        '#ff6666',
        0.6,
        2
      );
    }
    
    if (this.hp <= 0) {
      this.isDead = true;
      gameState.stats.enemiesKilled++;
      gameState.stats.currentSessionKills++;
      
      // Воспроизводим звук смерти врага (асинхронно)
      (async () => {
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playEnemyDie();
      })();
      
      // Шанс выпадения предмета (30%)
      if (Math.random() < 0.3) {
        this.dropItem();
      }
    }
  }
  
  async dropItem() {
    const item = generateRandomItem(gameState.level, gameState.selectedCharacter?.class || null);
    // Создаем предмет
    const { DroppedItem } = await import('./DroppedItem.js');
    const droppedItem = new DroppedItem(this.x, this.y, item);
    gameState.entities.push(droppedItem);
  }
  
  draw() {
    if (this.isDead) return;
    
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    // Рисуем стилизованный спрайт врага
    this.renderCustomSprite(ctx, screenX, screenY);
    
    // Индикатор здоровья (только если повреждён)
    if (this.hp < this.maxHp) {
      this.renderHealthBar(ctx, screenX, screenY);
    }
  }
  
  renderCustomSprite(ctx, x, y) {
    ctx.save();
    
    // Определяем состояние анимации
    const isMoving = this.isMoving();
    const isAttacking = this.isAttacking();
    
    // Анимация ходьбы - покачивание
    let walkOffset = 0;
    if (isMoving) {
      walkOffset = Math.sin(this.animationTime * 8) * 1.5; // Минимальная амплитуда
    }
    
    // Анимация атаки - наклон вперед
    let attackScale = 1;
    if (isAttacking) {
      attackScale = 1.1 + Math.sin(this.animationTime * 15) * 0.1;
    }
    
    ctx.translate(x, y + walkOffset);
    ctx.scale(attackScale, attackScale);
    ctx.translate(-x, -(y + walkOffset));
    
    switch (this.type) {
      case 'Skeleton':
        this.renderSkeleton(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Dark Mage':
        this.renderDarkMage(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Orc Warrior':
        this.renderOrcWarrior(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Shadow Assassin':
        this.renderShadowAssassin(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Demon Lord':
        this.renderDemonLord(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Ancient Guardian':
        this.renderAncientGuardian(ctx, x, y, isMoving, isAttacking);
        break;
      default:
        // Fallback на эмодзи
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.sprite, x, y + 7);
    }
    
    ctx.restore();
  }
  
  isMoving() {
    const player = gameState.player;
    if (!player) return false;
    const distance = Utils.distance(this, player);
    return distance > this.attackRange;
  }
  
  isAttacking() {
    return this.attackCooldown > 1.0; // Анимация атаки в начале кулдауна
  }
  
  renderSkeleton(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85; // Размер как у игрока
    
    // Череп
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Глазницы
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело (позвоночник)
    ctx.strokeStyle = '#f5f5dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.1);
    ctx.lineTo(x, y + size * 0.4);
    ctx.stroke();
    
    // Ребра
    for (let i = 0; i < 3; i++) {
      const ribY = y - size * 0.05 + i * size * 0.15;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.2, ribY);
      ctx.lineTo(x + size * 0.2, ribY);
      ctx.stroke();
    }
    
    // Руки с анимацией ходьбы
    const armSwing = isMoving ? Math.sin(this.animationTime * 8) * 0.1 : 0;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.25, y - size * 0.1);
    ctx.lineTo(x - size * 0.4 + armSwing * size * 0.1, y + size * 0.1);
    ctx.moveTo(x + size * 0.25, y - size * 0.1);
    ctx.lineTo(x + size * 0.4 - armSwing * size * 0.1, y + size * 0.1);
    ctx.stroke();
    
    // Ноги с анимацией ходьбы
    const legSwing = isMoving ? Math.sin(this.animationTime * 8 + Math.PI) * 0.1 : 0;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.15, y + size * 0.4);
    ctx.lineTo(x - size * 0.25 + legSwing * size * 0.1, y + size * 0.6);
    ctx.moveTo(x + size * 0.15, y + size * 0.4);
    ctx.lineTo(x + size * 0.25 - legSwing * size * 0.1, y + size * 0.6);
    ctx.stroke();
    
    // Меч
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y + size * 0.1);
    ctx.lineTo(x + size * 0.7, y + size * 0.2);
    ctx.stroke();
    
    // Анимация атаки - меч поднимается
    if (isAttacking) {
      ctx.save();
      ctx.translate(x + size * 0.4, y + size * 0.1);
      ctx.rotate(Math.sin(this.animationTime * 20) * 0.3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.3, size * 0.1);
      ctx.stroke();
      ctx.restore();
    }
  }
  
  renderDarkMage(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85; // Размер как у игрока
    
    // Мантия
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (светящиеся)
    const eyeGlow = Math.sin(this.animationTime * 4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(138, 43, 226, ${0.3 + eyeGlow * 0.7})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Посох
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.4);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.stroke();
    
    // Магический кристалл на посохе
    ctx.fillStyle = '#8a2be2';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Магические частицы
    ctx.fillStyle = '#8a2be2';
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + this.animationTime * 2;
      const particleX = x + Math.cos(angle) * size * 0.6;
      const particleY = y + Math.sin(angle) * size * 0.6;
      ctx.fillRect(particleX, particleY, 2, 2);
    }
    
    // Анимация атаки - магический взрыв
    if (isAttacking) {
      const explosionSize = size * 0.8 + Math.sin(this.animationTime * 25) * size * 0.2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, explosionSize);
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, explosionSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderOrcWarrior(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85; // Размер как у игрока
    
    // Тело
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Клыки
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(x - size * 0.1, y - size * 0.4, size * 0.05, size * 0.1);
    ctx.fillRect(x + size * 0.05, y - size * 0.4, size * 0.05, size * 0.1);
    
    // Глаза
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.arc(x + size * 0.1, y - size * 0.35, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Топор
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x + size * 0.3, y - size * 0.2, size * 0.15, size * 0.4);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + size * 0.45, y - size * 0.1, size * 0.05, size * 0.2);
    
    // Броня
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.2);
    ctx.lineTo(x + size * 0.4, y - size * 0.2);
    ctx.stroke();
    
    // Анимация атаки - топор замахивается
    if (isAttacking) {
      ctx.save();
      ctx.translate(x + size * 0.3, y - size * 0.2);
      ctx.rotate(Math.sin(this.animationTime * 18) * 0.5);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(0, 0, size * 0.15, size * 0.4);
      ctx.restore();
    }
  }
  
  renderShadowAssassin(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85; // Размер как у игрока
    
    // Тень
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (красные)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.25, size * 0.06, 0, Math.PI * 2);
    ctx.arc(x + size * 0.1, y - size * 0.25, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Кинжалы
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.1);
    ctx.lineTo(x - size * 0.5, y + size * 0.1);
    ctx.moveTo(x + size * 0.3, y - size * 0.1);
    ctx.lineTo(x + size * 0.5, y + size * 0.1);
    ctx.stroke();
    
    // Эффект тени
    const shadowAlpha = Math.sin(this.animationTime * 5) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(44, 62, 80, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - кинжалы сверкают
    if (isAttacking) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.3, y - size * 0.1);
      ctx.lineTo(x - size * 0.6, y + size * 0.1);
      ctx.moveTo(x + size * 0.3, y - size * 0.1);
      ctx.lineTo(x + size * 0.6, y + size * 0.1);
      ctx.stroke();
    }
  }
  
  renderDemonLord(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.9; // Демон немного больше обычных врагов
    
    // Тело демона
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Рога
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.2, y - size * 0.5);
    ctx.lineTo(x - size * 0.3, y - size * 0.7);
    ctx.lineTo(x - size * 0.1, y - size * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y - size * 0.5);
    ctx.lineTo(x + size * 0.3, y - size * 0.7);
    ctx.lineTo(x + size * 0.1, y - size * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Глаза (огненные)
    const fireGlow = Math.sin(this.animationTime * 6) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + fireGlow * 0.5})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Крылья
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.4, y, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.4, y, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Огненная аура
    const auraSize = size * 0.8 + Math.sin(this.animationTime * 4) * size * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - огненный взрыв
    if (isAttacking) {
      const fireSize = size * 1.2 + Math.sin(this.animationTime * 30) * size * 0.3;
      const fireGradient = ctx.createRadialGradient(x, y, 0, x, y, fireSize);
      fireGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
      fireGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.6)');
      fireGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.arc(x, y, fireSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderAncientGuardian(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.9; // Страж немного больше обычных врагов
    
    // Каменное тело
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Каменная голова
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (светящиеся)
    const eyeGlow = Math.sin(this.animationTime * 3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(243, 156, 18, ${0.4 + eyeGlow * 0.6})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.12, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.12, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Щит
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - size * 0.4, y - size * 0.2, size * 0.2, size * 0.4);
    
    // Меч
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.3, y - size * 0.3);
    ctx.lineTo(x + size * 0.5, y + size * 0.2);
    ctx.stroke();
    
    // Каменные детали
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lineY = y - size * 0.1 + i * size * 0.15;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.4, lineY);
      ctx.lineTo(x + size * 0.4, lineY);
      ctx.stroke();
    }
    
    // Анимация атаки - меч светится
    if (isAttacking) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.3, y - size * 0.3);
      ctx.lineTo(x + size * 0.6, y + size * 0.2);
      ctx.stroke();
    }
  }
  
  renderHealthBar(ctx, x, y) {
    const barWidth = 24;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - this.radius - 10;
    
    // Фон полоски здоровья
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Полоска здоровья
    ctx.fillStyle = '#e74c3c';
    const healthPercent = this.hp / this.maxHp;
    ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);
  }
} 