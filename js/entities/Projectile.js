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
    this.animationTime = 0;
    
    const angle = Utils.angle(this, target);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }
  
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.animationTime += dt * 4;
    
    if (this.life <= 0 || this.checkCollisionWithWalls(this.x, this.y)) {
      this.isDead = true;
      return;
    }
    
    // Оптимизированная проверка попадания во врагов - без filter
    for (let i = 0; i < gameState.entities.length; i++) {
      const entity = gameState.entities[i];
      if (entity.constructor.name === 'Enemy' && !entity.isDead) {
        if (Utils.distance(this, entity) < this.radius + entity.radius) {
          let totalDamage = this.damage;
          
          // Применяем огненные эффекты от игрока
          if (gameState.player && gameState.player.fireChance && Math.random() < gameState.player.fireChance) {
            totalDamage += gameState.player.fireDamage || 0;
            // Поджигаем врага
            entity.addDebuff('burn', Math.floor((gameState.player.fireDamage || 0) * 0.3), 5.0, '🔥');
            
            // Создаем огненные частицы
            for (let j = 0; j < 4; j++) {
              createParticle(
                entity.x + Utils.random(-8, 8),
                entity.y + Utils.random(-8, 8),
                Utils.randomFloat(-50, 50),
                Utils.randomFloat(-50, 50),
                '#e67e22',
                0.8,
                2
              );
            }
          }
          
          // Применяем ледяные эффекты от игрока
          if (gameState.player && gameState.player.iceChance && Math.random() < gameState.player.iceChance) {
            // Замораживаем врага
            entity.addDebuff('freeze', 0, 3.0, '❄️');
            
            // Создаем ледяные частицы
            for (let j = 0; j < 4; j++) {
              createParticle(
                entity.x + Utils.random(-8, 8),
                entity.y + Utils.random(-8, 8),
                Utils.randomFloat(-50, 50),
                Utils.randomFloat(-50, 50),
                '#3498db',
                0.8,
                2
              );
            }
          }
          
          entity.takeDamage(totalDamage);
          this.isDead = true;
          
          // Частицы взрыва
          for (let j = 0; j < 8; j++) {
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
          
          // Выходим из цикла, так как снаряд попал
          break;
        }
      }
    }
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    ctx.save();
    
    // Внешнее свечение
    const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius * 1.5);
    glowGradient.addColorStop(0, '#3498db40');
    glowGradient.addColorStop(0.7, '#3498db20');
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной снаряд
    const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
    mainGradient.addColorStop(0, '#ffffff');
    mainGradient.addColorStop(0.5, '#3498db');
    mainGradient.addColorStop(1, '#2980b9');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимированные искры
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.animationTime;
      const sparkleX = screenX + Math.cos(angle) * this.radius * 0.6;
      const sparkleY = screenY + Math.sin(angle) * this.radius * 0.6;
      const sparkleSize = Math.sin(this.animationTime * 2 + i) * 0.5 + 1;
      
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.scale(sparkleSize, sparkleSize);
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
    
    ctx.restore();
  }
}

export class FireballProjectile extends Projectile {
  constructor(x, y, target, damage, speed) {
    super(x, y, target, damage, speed);
    this.radius = 8;
    this.animationTime = 0;
    this.pulseTime = 0;
    this.sparkleTime = 0;
    this.trailParticles = [];
  }
  
  update(dt) {
    super.update(dt);
    
    this.animationTime += dt * 8;
    this.pulseTime += dt * 6;
    this.sparkleTime += dt * 10;
    
    // Создаем след из частиц
    if (Math.random() < 0.3) {
      this.trailParticles.push({
        x: this.x + Utils.random(-3, 3),
        y: this.y + Utils.random(-3, 3),
        life: 0.5,
        maxLife: 0.5
      });
    }
    
    // Обновляем частицы следа
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
    
    if (this.isDead) {
      // Создаем взрывные частицы при уничтожении
      for (let i = 0; i < 15; i++) {
        createParticle(
          this.x + Utils.random(-10, 10),
          this.y + Utils.random(-10, 10),
          Utils.randomFloat(-120, 120),
          Utils.randomFloat(-120, 120),
          '#e67e22',
          0.8,
          4
        );
      }
      
      // Дополнительные искры
      for (let i = 0; i < 8; i++) {
        createParticle(
          this.x + Utils.random(-5, 5),
          this.y + Utils.random(-5, 5),
          Utils.randomFloat(-80, 80),
          Utils.randomFloat(-80, 80),
          '#f39c12',
          0.6,
          3
        );
      }
    }
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    // Рисуем след
    this.drawTrail(screenX, screenY);
    
    // Рисуем основной фаербол
    this.drawFireball(screenX, screenY);
  }
  
  drawTrail(screenX, screenY) {
    // Рисуем частицы следа
    for (const particle of this.trailParticles) {
      const trailX = particle.x - gameState.camera.x;
      const trailY = particle.y - gameState.camera.y;
      const alpha = particle.life / particle.maxLife;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Градиент для частиц следа
      const gradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, 6);
      gradient.addColorStop(0, '#e67e22');
      gradient.addColorStop(0.5, '#f39c12');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(trailX, trailY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }
  
  drawFireball(screenX, screenY) {
    ctx.save();
    
    // Пульсирующее свечение
    const pulseGlow = Math.sin(this.pulseTime) * 0.3 + 0.7;
    const glowSize = this.radius * (1.5 + pulseGlow * 0.5);
    
    // Внешнее свечение
    const outerGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
    outerGlow.addColorStop(0, '#e67e2240');
    outerGlow.addColorStop(0.7, '#f39c1220');
    outerGlow.addColorStop(1, '#e67e2200');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Среднее свечение
    const middleGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius * 1.2);
    middleGlow.addColorStop(0, '#e67e2280');
    middleGlow.addColorStop(0.8, '#f39c1240');
    middleGlow.addColorStop(1, 'transparent');
    
    ctx.fillStyle = middleGlow;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной шар
    const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
    mainGradient.addColorStop(0, '#ffffff');
    mainGradient.addColorStop(0.3, '#e67e22');
    mainGradient.addColorStop(0.7, '#d35400');
    mainGradient.addColorStop(1, '#c0392b');
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимированные искры
    this.drawSparkles(screenX, screenY);
    
    // Вращающиеся языки пламени
    this.drawFlameTongues(screenX, screenY);
    
    ctx.restore();
  }
  
  drawSparkles(screenX, screenY) {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.sparkleTime;
      const sparkleX = screenX + Math.cos(angle) * this.radius * 0.8;
      const sparkleY = screenY + Math.sin(angle) * this.radius * 0.8;
      const sparkleSize = Math.sin(this.sparkleTime * 2 + i) * 0.5 + 1;
      
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.scale(sparkleSize, sparkleSize);
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }
  
  drawFlameTongues(screenX, screenY) {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.animationTime;
      const tongueLength = this.radius * 0.6;
      const tongueWidth = this.radius * 0.2;
      
      const startX = screenX + Math.cos(angle) * this.radius * 0.7;
      const startY = screenY + Math.sin(angle) * this.radius * 0.7;
      const endX = screenX + Math.cos(angle) * (this.radius + tongueLength);
      const endY = screenY + Math.sin(angle) * (this.radius + tongueLength);
      
      // Градиент для языка пламени
      const tongueGradient = ctx.createLinearGradient(startX, startY, endX, endY);
      tongueGradient.addColorStop(0, '#e67e22');
      tongueGradient.addColorStop(0.5, '#f39c12');
      tongueGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = tongueGradient;
      ctx.lineWidth = tongueWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
}

export class EnemyProjectile extends Projectile {
  constructor(x, y, target, damage, speed) {
    super(x, y, target, damage, speed);
    this.isPlayerProjectile = false;
    this.radius = 4;
  }
  
  async update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.animationTime += dt * 3;
    
    if (this.life <= 0 || this.checkCollisionWithWalls(this.x, this.y)) {
      this.isDead = true;
      return;
    }
    
    // Проверка попадания в игрока
    if (gameState.player && Utils.distance(this, gameState.player) < this.radius + gameState.player.radius) {
      gameState.player.takeDamage(this.damage);
      
      // Применяем дебафы если они есть
      if (this.canFreeze && Math.random() < this.freezeChance) {
        const { BuffManager } = await import('../core/BuffManager.js');
        BuffManager.addDebuff('freeze', 0, this.freezeDuration, '❄️');
      }
      
      if (this.canPoison && Math.random() < this.poisonChance) {
        const { BuffManager } = await import('../core/BuffManager.js');
        BuffManager.addDebuff('poison', this.poisonDamage, this.poisonDuration, '🦠');
      }
      
      this.isDead = true;
      
      // Частицы попадания (разные цвета для разных типов)
      let particleColor = '#8e44ad'; // По умолчанию фиолетовый
      if (this.canFreeze) {
        particleColor = '#3498db'; // Синий для заморозки
      } else if (this.canPoison) {
        particleColor = '#27ae60'; // Зеленый для яда
      }
      
      for (let i = 0; i < 6; i++) {
        createParticle(
          this.x + Utils.random(-6, 6),
          this.y + Utils.random(-6, 6),
          Utils.randomFloat(-60, 60),
          Utils.randomFloat(-60, 60),
          particleColor,
          0.4,
          2
        );
      }
    }
  }
  
  draw() {
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    ctx.save();
    
    // Определяем цвет снаряда в зависимости от типа
    let glowColor = '#8e44ad';
    let mainColor = '#9b59b6';
    let accentColor = '#e8d5ff';
    
    if (this.canFreeze) {
      glowColor = '#3498db';
      mainColor = '#2980b9';
      accentColor = '#85c1e9';
    } else if (this.canPoison) {
      glowColor = '#27ae60';
      mainColor = '#229954';
      accentColor = '#a9dfbf';
    }
    
    // Внешнее свечение
    const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius * 1.3);
    glowGradient.addColorStop(0, `${glowColor}40`);
    glowGradient.addColorStop(0.7, `${glowColor}20`);
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Основной снаряд
    const mainGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
    mainGradient.addColorStop(0, accentColor);
    mainGradient.addColorStop(0.5, mainColor);
    mainGradient.addColorStop(1, glowColor);
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимированные искры
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + this.animationTime;
      const sparkleX = screenX + Math.cos(angle) * this.radius * 0.5;
      const sparkleY = screenY + Math.sin(angle) * this.radius * 0.5;
      const sparkleSize = Math.sin(this.animationTime * 2 + i) * 0.3 + 0.7;
      
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.scale(sparkleSize, sparkleSize);
      ctx.fillRect(-0.5, -0.5, 1, 1);
      ctx.restore();
    }
    
    ctx.restore();
  }
}

