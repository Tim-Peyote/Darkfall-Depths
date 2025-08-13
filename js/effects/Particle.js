/* Darkfall Depths - Система частиц */

import { gameState, ctx } from '../core/GameState.js';
import { ObjectPool } from '../core/ObjectPool.js';

export class Particle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#fff';
    this.life = 0;
    this.maxLife = 1;
    this.size = 2;
    this.isDead = true;
  }
  
  init(x, y, vx, vy, color, life, size = 2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.isDead = false;
  }
  
  update(dt) {
    if (this.isDead) return;
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.vx *= 0.95; // затухание
    this.vy *= 0.95;
    
    if (this.life <= 0) {
      this.isDead = true;
    }
  }
  
  draw() {
    if (this.isDead) return;
    
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x - gameState.camera.x - this.size / 2, 
      this.y - gameState.camera.y - this.size / 2, 
      this.size, 
      this.size
    );
    ctx.globalAlpha = 1;
  }
}

// Создание пула частиц
export const particlePool = new ObjectPool(
  () => new Particle(),
  (particle) => particle.reset(),
  50
);

export function createParticle(x, y, vx, vy, color, life, size = 2) {
  const particle = particlePool.get();
  particle.init(x, y, vx, vy, color, life, size);
  gameState.particles.push(particle);
  return particle;
} 