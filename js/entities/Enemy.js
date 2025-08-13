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
    this.radius = 12;
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
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - gameState.camera.x, this.y - gameState.camera.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Спрайт врага
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.sprite,
      this.x - gameState.camera.x,
      this.y - gameState.camera.y + 7
    );
    
    // Индикатор здоровья (только если повреждён)
    if (this.hp < this.maxHp) {
      const barWidth = 24;
      const barHeight = 4;
      const barX = this.x - gameState.camera.x - barWidth / 2;
      const barY = this.y - gameState.camera.y - this.radius - 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#e74c3c';
      const healthPercent = this.hp / this.maxHp;
      ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);
    }
  }
} 