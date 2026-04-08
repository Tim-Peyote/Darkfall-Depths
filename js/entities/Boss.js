/* Darkfall Depths - Класс босса */

import { Enemy } from './Enemy.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { BOSS_TYPES, ENEMY_TYPES, generateRandomItem } from '../config/constants.js';
import { createParticle } from '../effects/Particle.js';
import { TILE_SIZE } from '../config/constants.js';

export class Boss extends Enemy {
  constructor(x, y, bossData) {
    // Создаём через базовый Entity (не через Enemy конструктор с типом)
    super(x, y, ENEMY_TYPES[0].type);

    // Перезаписываем свойства данными босса
    Object.assign(this, bossData);
    this.maxHp = this.hp;
    this.radius = 28;
    this.isBoss = true;

    // Фазовая система
    this.phase = 1;
    this.phaseThresholds = [0.5, 0.25]; // Phase 2 at 50%, Phase 3 at 25%

    // Кулдауны способностей
    this.abilityCooldown = 0;
    this.abilityInterval = 5; // секунд между способностями

    // Состояние
    this.isCharging = false;
    this.chargeTarget = null;
    this.summonCooldown = 0;

    // Базовые значения для фаз
    this.baseSpeed = this.speed;
    this.baseDamage = this.damage;

    // Система дебафов
    this.debuffs = {
      active: [],
      baseSpeed: this.speed,
      baseDamage: this.damage
    };
  }

  update(dt) {
    if (this.isDead) return;

    // Обновляем дебафы
    this.updateDebuffs(dt);

    if (this.isStunned()) return;

    const player = gameState.player;
    if (!player || player.isInvisible) return;

    this.animationTime += dt;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt;
    if (this.summonCooldown > 0) this.summonCooldown -= dt;

    // Обновляем фазу
    this.updatePhase();

    // Используем способности
    if (this.abilityCooldown <= 0) {
      this.useAbility(player);
    }

    const distance = Utils.distance(this, player);

    // Charge-атака
    if (this.isCharging && this.chargeTarget) {
      const angle = Utils.angle(this, this.chargeTarget);
      const chargeSpeed = this.speed * 4;
      const newX = this.x + Math.cos(angle) * chargeSpeed * dt;
      const newY = this.y + Math.sin(angle) * chargeSpeed * dt;

      if (!this.checkCollisionWithWalls(newX, this.y)) this.x = newX;
      if (!this.checkCollisionWithWalls(this.x, newY)) this.y = newY;

      // Проверяем столкновение с игроком
      if (Utils.distance(this, player) < this.radius + player.radius) {
        player.takeDamage(this.chargeDamage || this.damage * 1.5);
        this.isCharging = false;
        this.chargeTarget = null;
      }

      // Остановка при достижении цели
      if (Utils.distance(this, this.chargeTarget) < 20) {
        this.isCharging = false;
        this.chargeTarget = null;
      }

      // Частицы charge
      createParticle(
        this.x + Utils.random(-10, 10), this.y + Utils.random(-10, 10),
        Utils.randomFloat(-30, 30), Utils.randomFloat(-30, 30),
        this.color, 0.5, 4
      );
      return;
    }

    // Обычная AI-логика
    if (distance > this.attackRange) {
      const angle = Utils.angle(this, player);
      const newX = this.x + Math.cos(angle) * this.speed * dt;
      const newY = this.y + Math.sin(angle) * this.speed * dt;
      if (!this.checkCollisionWithWalls(newX, this.y)) this.x = newX;
      if (!this.checkCollisionWithWalls(this.x, newY)) this.y = newY;
    } else if (this.attackCooldown <= 0) {
      if (this.attackRange > 48 && this.projectileSpeed) {
        this.performRangedAttack(player);
      } else {
        this.performMeleeAttack(player);
      }
      this.attackCooldown = this.phase >= 2 ? 0.8 : 1.2;
    }
  }

  updatePhase() {
    const hpPercent = this.hp / this.maxHp;
    const oldPhase = this.phase;

    if (hpPercent <= this.phaseThresholds[1]) {
      this.phase = 3;
    } else if (hpPercent <= this.phaseThresholds[0]) {
      this.phase = 2;
    }

    // Эффекты при смене фазы
    if (this.phase !== oldPhase) {
      this.onPhaseChange(this.phase);
    }
  }

  onPhaseChange(newPhase) {
    // Ускорение при смене фаз
    if (newPhase === 2) {
      this.speed = this.baseSpeed * 1.3;
      this.damage = Math.floor(this.baseDamage * 1.2);
      this.abilityInterval = 3.5;
    } else if (newPhase === 3) {
      this.speed = this.baseSpeed * 1.6;
      this.damage = Math.floor(this.baseDamage * 1.4);
      this.abilityInterval = 2;
    }

    // Вспышка частиц при смене фазы
    for (let i = 0; i < 20; i++) {
      createParticle(
        this.x + Utils.random(-30, 30), this.y + Utils.random(-30, 30),
        Utils.randomFloat(-120, 120), Utils.randomFloat(-120, 120),
        newPhase === 3 ? '#e74c3c' : '#f39c12', 1.2, 5
      );
    }
  }

  useAbility(player) {
    if (!this.abilities || this.abilities.length === 0) return;

    // Выбираем случайную способность, приоритезируя в зависимости от фазы
    const abilities = this.phase >= 3 ? this.abilities :
      this.abilities.filter(a => a !== 'summon' || this.phase >= 2);

    if (abilities.length === 0) return;

    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    switch (ability) {
      case 'charge':
        this.startCharge(player);
        break;
      case 'summon':
        if (this.summonCooldown <= 0) this.summonMinions();
        break;
      case 'firebreath':
        this.fireBreath(player);
        break;
      case 'stomp':
        this.stomp();
        break;
      case 'teleport':
        this.bossTeleport(player);
        break;
      case 'curse':
        this.cursePlayer();
        break;
    }

    this.abilityCooldown = this.abilityInterval;
  }

  startCharge(player) {
    this.isCharging = true;
    this.chargeTarget = { x: player.x, y: player.y };

    // Предупреждающие частицы
    for (let i = 0; i < 10; i++) {
      createParticle(
        this.x + Utils.random(-20, 20), this.y + Utils.random(-20, 20),
        0, Utils.randomFloat(-60, -20),
        '#ff0000', 0.8, 4
      );
    }
  }

  async summonMinions() {
    const count = this.summonCount || 2;
    this.summonCooldown = 10;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const spawnX = this.x + Math.cos(angle) * 60;
      const spawnY = this.y + Math.sin(angle) * 60;

      const tileX = Math.floor(spawnX / TILE_SIZE);
      const tileY = Math.floor(spawnY / TILE_SIZE);

      if (gameState.map && gameState.map[tileY]?.[tileX] === 0) {
        const enemy = new Enemy(spawnX, spawnY, 'Skeleton');
        gameState.entities.push(enemy);

        // Частицы призыва
        for (let j = 0; j < 8; j++) {
          createParticle(
            spawnX + Utils.random(-10, 10), spawnY + Utils.random(-10, 10),
            Utils.randomFloat(-50, 50), Utils.randomFloat(-50, 50),
            '#8e44ad', 0.8, 3
          );
        }
      }
    }
  }

  async fireBreath(player) {
    const { EnemyProjectile } = await import('./Projectile.js');
    const count = this.phase >= 3 ? 7 : 5;
    const spreadAngle = Math.PI / 4; // 45 degree spread
    const baseAngle = Utils.angle(this, player);

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - spreadAngle / 2 + (spreadAngle / (count - 1)) * i;
      const targetX = this.x + Math.cos(angle) * 300;
      const targetY = this.y + Math.sin(angle) * 300;

      const proj = new EnemyProjectile(
        this.x, this.y, { x: targetX, y: targetY },
        this.firebreathDamage || this.damage, this.projectileSpeed || 250
      );
      gameState.projectiles.push(proj);
    }
  }

  stomp() {
    const radius = this.stompRadius || 100;
    const damage = this.stompDamage || this.damage;

    if (gameState.player && Utils.distance(this, gameState.player) <= radius) {
      gameState.player.takeDamage(damage);
    }

    // Визуальная волна
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i;
      createParticle(
        this.x + Math.cos(angle) * radius * 0.5,
        this.y + Math.sin(angle) * radius * 0.5,
        Math.cos(angle) * 150, Math.sin(angle) * 150,
        '#e67e22', 0.8, 4
      );
    }
  }

  bossTeleport(player) {
    // Телепортация за игрока
    const angle = Math.random() * Math.PI * 2;
    const dist = 80;
    const newX = player.x + Math.cos(angle) * dist;
    const newY = player.y + Math.sin(angle) * dist;

    if (!this.checkCollisionWithWalls(newX, newY)) {
      // Частицы исчезновения
      for (let i = 0; i < 12; i++) {
        createParticle(
          this.x + Utils.random(-15, 15), this.y + Utils.random(-15, 15),
          Utils.randomFloat(-80, 80), Utils.randomFloat(-80, 80),
          '#8e44ad', 0.8, 3
        );
      }

      this.x = newX;
      this.y = newY;

      // Частицы появления
      for (let i = 0; i < 12; i++) {
        createParticle(
          this.x + Utils.random(-15, 15), this.y + Utils.random(-15, 15),
          Utils.randomFloat(-80, 80), Utils.randomFloat(-80, 80),
          '#8e44ad', 0.8, 3
        );
      }
    }
  }

  async cursePlayer() {
    const { BuffManager } = await import('../core/BuffManager.js');
    BuffManager.addDebuff('weakness', 0, this.curseDuration || 5, 'x');
    BuffManager.addDebuff('slow', 0, this.curseDuration || 5, '~');
  }

  async takeDamage(damage) {
    // Reflect damage для Crystal-типов
    if (this.canReflect && Math.random() < (this.reflectChance || 0)) {
      if (gameState.player) {
        gameState.player.takeDamage(Math.floor(damage * 0.2));
      }
    }

    await super.takeDamage(damage);

    // При смерти босса — спецдроп и портал
    if (this.hp <= 0 && !this._deathHandled) {
      this._deathHandled = true;
      await this.onBossDeath();
    }
  }

  async onBossDeath() {
    // Гарантированный epic/legendary дроп (2-3 предмета)
    const { DroppedItem } = await import('./DroppedItem.js');
    const dropCount = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < dropCount; i++) {
      const item = await generateRandomItem(gameState.level, gameState.selectedCharacter?.class || null);
      if (item) {
        // Повышаем редкость
        if (item.rarity === 'common') item.rarity = 'rare';
        if (item.rarity === 'rare' && Math.random() < 0.5) item.rarity = 'epic';

        const offsetX = Utils.random(-40, 40);
        const offsetY = Utils.random(-40, 40);
        const dropped = new DroppedItem(this.x + offsetX, this.y + offsetY, item);
        gameState.entities.push(dropped);
      }
    }

    // Большая награда золотом
    const goldReward = this.reward * 2;
    if (gameState.player) {
      gameState.player.gold += goldReward;
      gameState.gold = gameState.player.gold;
    }

    // Эпичный эффект смерти
    for (let i = 0; i < 40; i++) {
      createParticle(
        this.x + Utils.random(-30, 30), this.y + Utils.random(-30, 30),
        Utils.randomFloat(-200, 200), Utils.randomFloat(-200, 200),
        ['#f39c12', '#e74c3c', '#8e44ad', '#fff'][Math.floor(Math.random() * 4)],
        1.5, 6
      );
    }

    // Спавн портала через 1.5 секунды
    setTimeout(async () => {
      const { Portal } = await import('./Portal.js');
      const portal = new Portal(this.x, this.y);
      gameState.entities.push(portal);
      gameState.portal = portal;
    }, 1500);
  }

  draw() {
    if (this.isDead) return;

    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;

    // Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + this.radius, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело босса (увеличенное)
    const pulseScale = 1 + Math.sin(this.animationTime * 3) * 0.05;
    const drawRadius = this.radius * pulseScale;

    // Аура в зависимости от фазы
    if (this.phase >= 2) {
      ctx.globalAlpha = 0.3 + Math.sin(this.animationTime * 5) * 0.15;
      ctx.fillStyle = this.phase === 3 ? '#e74c3c' : '#f39c12';
      ctx.beginPath();
      ctx.arc(screenX, screenY, drawRadius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Основное тело
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawRadius, 0, Math.PI * 2);
    ctx.fill();

    // Обводка
    ctx.strokeStyle = this.phase === 3 ? '#e74c3c' : this.phase === 2 ? '#f39c12' : '#aaa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Кастомный спрайт босса — корона + силуэт
    const crownColor = this.phase === 3 ? '#e74c3c' : this.phase === 2 ? '#f39c12' : '#c9a84c';
    // Корона
    ctx.fillStyle = crownColor;
    ctx.beginPath();
    ctx.moveTo(screenX - 8, screenY - 10);
    ctx.lineTo(screenX - 10, screenY - 18);
    ctx.lineTo(screenX - 4, screenY - 13);
    ctx.lineTo(screenX, screenY - 20);
    ctx.lineTo(screenX + 4, screenY - 13);
    ctx.lineTo(screenX + 10, screenY - 18);
    ctx.lineTo(screenX + 8, screenY - 10);
    ctx.closePath();
    ctx.fill();
    // Тело
    ctx.fillStyle = this.phase === 3 ? '#5a1a1a' : this.phase === 2 ? '#5a3a1a' : '#3d3328';
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Имя босса
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(this.type, screenX, screenY - drawRadius - 22);

    // HP бар босса над головой
    const barWidth = 60;
    const barHeight = 6;
    const barX = screenX - barWidth / 2;
    const barY = screenY - drawRadius - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const hpColor = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
}
