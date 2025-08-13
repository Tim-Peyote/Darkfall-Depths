/* Darkfall Depths - Класс снарядов */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { Enemy } from './Enemy.js';
import { createParticle } from '../effects/Particle.js';

export class Projectile extends Entity {
  constructor(x, y, target, damage, speed) {
    super(x, y);
    this.damage = damage;
    this.speed = speed;
    this.life = 3.0;
    this.radius = 6;
    this.isPlayerProjectile = true;
    
    const angle = Utils.angle(this, target);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }
  
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    
    if (this.life <= 0 || this.checkCollisionWithWalls(this.x, this.y)) {
      this.isDead = true;
      return;
    }
    
    // Проверка попадания во врагов
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && !e.isDead);
    for (const enemy of enemies) {
      if (Utils.distance(this, enemy) < this.radius + enemy.radius) {
        enemy.takeDamage(this.damage);
        this.isDead = true;
        
        // Частицы взрыва
        for (let i = 0; i < 6; i++) {
          createParticle(
            this.x + Utils.random(-8, 8),
            this.y + Utils.random(-8, 8),
            Utils.randomFloat(-80, 80),
            Utils.randomFloat(-80, 80),
            '#3498db',
            0.5,
            3
          );
        }
        break;
      }
    }
  }
  
  draw() {
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(this.x - gameState.camera.x, this.y - gameState.camera.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Эффект свечения
    ctx.shadowColor = '#3498db';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export class EnemyProjectile extends Projectile {
  constructor(x, y, target, damage, speed) {
    super(x, y, target, damage, speed);
    this.isPlayerProjectile = false;
    this.radius = 4;
  }
  
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    
    if (this.life <= 0 || this.checkCollisionWithWalls(this.x, this.y)) {
      this.isDead = true;
      return;
    }
    
    // Проверка попадания в игрока
    if (gameState.player && Utils.distance(this, gameState.player) < this.radius + gameState.player.radius) {
      gameState.player.takeDamage(this.damage);
      this.isDead = true;
    }
  }
  
  draw() {
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(this.x - gameState.camera.x, this.y - gameState.camera.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
} 