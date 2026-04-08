/* Darkfall Depths - Класс врага */

import { Entity } from './Entity.js';
import { gameState, ctx, Utils } from '../core/GameState.js';
import { ENEMY_TYPES, generateRandomItem } from '../config/constants.js';
import { createParticle } from '../effects/Particle.js';

export class Enemy extends Entity {
  constructor(x, y, type) {
    super(x, y);
    const enemyData = ENEMY_TYPES.find(e => e.type === type) || ENEMY_TYPES[0];
    this.enemyData = enemyData; // Сохраняем ссылку на данные врага
    Object.assign(this, enemyData);
    this.maxHp = this.hp;
    this.attackCooldown = 0;
    this.radius = 14; // Такой же размер, как у игрока
    this.pathfindingCooldown = 0;
    this.targetX = x;
    this.targetY = y;
    
    // Система дебафов для врагов
    this.debuffs = {
      active: [],
      baseSpeed: this.speed,
      baseDamage: this.damage
    };
    
    // Инициализация состояния стана
    this.stunned = false;
    
    // Инициализация дополнительных свойств для совместимости
    this.canTeleport = this.canTeleport || false;
    this.canFreeze = this.canFreeze || false;
    this.canPoison = this.canPoison || false;
    this.canStun = this.canStun || false;
    this.canReflect = this.canReflect || false;
    this.projectileSpeed = this.projectileSpeed || 0;
    this.teleportChance = this.teleportChance || 0;
    this.freezeChance = this.freezeChance || 0;
    this.freezeDuration = this.freezeDuration || 0;
    this.poisonChance = this.poisonChance || 0;
    this.poisonDamage = this.poisonDamage || 0;
    this.poisonDuration = this.poisonDuration || 0;
    this.stunChance = this.stunChance || 0;
    this.stunDuration = this.stunDuration || 0;
    this.reflectChance = this.reflectChance || 0;
    
    // Инициализация базовых свойств если они не определены
    this.speed = this.speed || 50;
    this.attackRange = this.attackRange || 48;
    this.damage = this.damage || 10;
    this.hp = this.hp || 30;
    this.maxHp = this.hp;
    
    // Инициализация дополнительных свойств
    this.animationTime = 0;
    this.lastMoveTime = 0;
    this.lastAttackTime = 0;
  }
  
  update(dt) {
    super.update(dt);
    
    if (this.isDead) return;
    
    // Обновляем дебафы
    this.updateDebuffs(dt);
    
    // Проверяем, не оглушен ли враг
    if (this.isStunned()) {
      return; // Не действуем если оглушены
    }
    
    const player = gameState.player;
    if (!player) return;

    // Обновление анимации
    this.animationTime += dt;

    // Обновление кулдауна атаки
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Страх — враг убегает от игрока
    if (this.isAfraid) {
      const angle = Utils.angle(player, this);
      const newX = this.x + Math.cos(angle) * this.speed * dt;
      const newY = this.y + Math.sin(angle) * this.speed * dt;
      if (!this.checkCollisionWithWalls(newX, this.y)) this.x = newX;
      if (!this.checkCollisionWithWalls(this.x, newY)) this.y = newY;
      return;
    }

    // Хаос — враг атакует ближайшего другого врага
    if (this.isChaotic) {
      const otherEnemies = gameState.entities.filter(e =>
        e.constructor.name === 'Enemy' && !e.isDead && e !== this
      );
      if (otherEnemies.length > 0) {
        let closest = null;
        let closestDist = Infinity;
        for (const e of otherEnemies) {
          const d = Utils.distance(this, e);
          if (d < closestDist) { closest = e; closestDist = d; }
        }
        if (closest) {
          if (closestDist > this.attackRange) {
            const angle = Utils.angle(this, closest);
            const newX = this.x + Math.cos(angle) * this.speed * dt;
            const newY = this.y + Math.sin(angle) * this.speed * dt;
            if (!this.checkCollisionWithWalls(newX, this.y)) this.x = newX;
            if (!this.checkCollisionWithWalls(this.x, newY)) this.y = newY;
          } else if (this.attackCooldown <= 0) {
            closest.takeDamage(this.damage);
            this.attackCooldown = 1.5 + Math.random() * 0.5;
          }
        }
      }
      return;
    }

    // Невидимость — враг не преследует игрока
    if (player.isInvisible) return;

    // Проверяем телепортацию для Void Wraith
    if (this.canTeleport && this.attackCooldown <= 0) {
      this.teleport();
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
        this.performMeleeAttack(player);
      }
      this.attackCooldown = 1.5 + Math.random() * 0.5;
    }
  }
  
  async performRangedAttack(target) {
    // Создаем снаряд
    const { EnemyProjectile } = await import('./Projectile.js');
    const projectile = new EnemyProjectile(this.x, this.y, target, this.damage, this.projectileSpeed);
    
    // Добавляем специальные эффекты к снаряду
    if (this.canFreeze) {
      projectile.canFreeze = true;
      projectile.freezeChance = this.freezeChance;
      projectile.freezeDuration = this.freezeDuration;
    }
    
    if (this.canPoison) {
      projectile.canPoison = true;
      projectile.poisonChance = this.poisonChance;
      projectile.poisonDamage = this.poisonDamage;
      projectile.poisonDuration = this.poisonDuration;
    }
    
    gameState.projectiles.push(projectile);
  }
  
  async performMeleeAttack(target) {
    // Обычная ближняя атака
    target.takeDamage(this.damage);
    
    // Проверяем специальные эффекты
    if (this.canStun && Math.random() < this.stunChance) {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.addDebuff('stun', 0, this.stunDuration, '!');
    }
    
    if (this.canFreeze && Math.random() < this.freezeChance) {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.addDebuff('freeze', 0, this.freezeDuration, '❄️');
    }
    
    if (this.canPoison && Math.random() < this.poisonChance) {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.addDebuff('poison', this.poisonDamage, this.poisonDuration, '🦠');
    }
  }
  
  async teleport() {
    if (!this.canTeleport || Math.random() > this.teleportChance) return;
    
    const player = gameState.player;
    if (!player) return;
    
    // Телепортируемся за спину игрока
    const angle = Utils.angle(player, this);
    const teleportDistance = 80;
    const newX = player.x + Math.cos(angle) * teleportDistance;
    const newY = player.y + Math.sin(angle) * teleportDistance;
    
    // Проверяем, что новая позиция безопасна
    if (!this.checkCollisionWithWalls(newX, newY)) {
      this.x = newX;
      this.y = newY;
      
      // Создаем эффект телепортации
      (async () => {
        const { createParticle } = await import('../effects/Particle.js');
        for (let i = 0; i < 8; i++) {
          createParticle(
            this.x + Utils.random(-20, 20),
            this.y + Utils.random(-20, 20),
            Utils.randomFloat(-100, 100),
            Utils.randomFloat(-100, 100),
            '#9b59b6',
            0.9,
            2
          );
        }
      })();
    }
  }
  
  // Методы для работы с дебафами врагов
  addDebuff(type, value, duration, icon = null) {
    const debuff = {
      type,
      value,
      duration,
      remainingTime: duration,
      icon: icon || this.getDebuffIcon(type),
      startTime: gameState.gameTime,
      isDebuff: true
    };
    
    this.debuffs.active.push(debuff);
    this.applyDebuff(debuff);
  }
  
  applyDebuff(debuff) {
    switch (debuff.type) {
      case 'burn':
        // Ожог наносит урон каждый тик
        debuff.lastTick = 0;
        debuff.tickInterval = 1.2; // Медленнее
        break;
      case 'poison':
        // Яд наносит урон каждый тик (слабее ожога, но длится дольше)
        debuff.lastTick = 0;
        debuff.tickInterval = 1.5;
        break;
      case 'freeze':
        // Заморозка замедляет движение и атаку (менее мощно)
        this.speed = Math.max(15, this.debuffs.baseSpeed * 0.5); // 50% вместо 30%
        this.attackCooldown = Math.max(0.3, this.attackCooldown * 1.2); // 20% вместо 50%
        break;
      case 'slow':
        // Замедление (менее мощно)
        this.speed = Math.max(25, this.debuffs.baseSpeed * 0.7); // 70% вместо 60%
        break;
      case 'stun':
        // Стан полностью блокирует действия
        this.stunned = true;
        break;
      case 'weakness':
        // Слабость снижает урон (менее мощно)
        this.damage = Math.max(2, this.debuffs.baseDamage * 0.8); // 80% вместо 70%
        break;
    }
  }
  
  removeDebuff(debuff) {
    switch (debuff.type) {
      case 'freeze':
        // Восстанавливаем скорость
        this.speed = this.debuffs.baseSpeed;
        break;
      case 'slow':
        // Восстанавливаем скорость
        this.speed = this.debuffs.baseSpeed;
        break;
      case 'stun':
        // Убираем стан
        this.stunned = false;
        break;
      case 'weakness':
        // Восстанавливаем урон
        this.damage = this.debuffs.baseDamage;
        break;
    }
  }
  
  updateDebuffs(dt) {
    // Обновляем время всех активных дебафов
    for (let i = this.debuffs.active.length - 1; i >= 0; i--) {
      const debuff = this.debuffs.active[i];
      debuff.remainingTime -= dt;
      
      // Обрабатываем периодический урон (ожог и яд)
      if (debuff.type === 'burn' || debuff.type === 'poison') {
        debuff.lastTick += dt;

        if (debuff.lastTick >= debuff.tickInterval) {
          this.takeDamage(debuff.value);
          const particleColor = debuff.type === 'burn' ? '#e67e22' : '#2ecc71';
          (async () => {
            const { createParticle } = await import('../effects/Particle.js');
            for (let j = 0; j < 3; j++) {
              createParticle(
                this.x + Utils.random(-10, 10),
                this.y + Utils.random(-10, 10),
                Utils.randomFloat(-30, 30),
                Utils.randomFloat(-30, 30),
                particleColor,
                0.8,
                1.5
              );
            }
          })();
          debuff.lastTick = 0;
        }
      }
      
      // Если дебаф истек, удаляем его
      if (debuff.remainingTime <= 0) {
        this.removeDebuff(debuff);
        this.debuffs.active.splice(i, 1);
      }
    }
  }
  
  getDebuffIcon(type) {
    const icons = {
      burn: '*',
      poison: '+',
      freeze: '#',
      slow: '~',
      stun: '!',
      weakness: 'x'
    };
    return icons[type] || 'x';
  }
  
  isStunned() {
    return this.stunned || false;
  }
  
  async takeDamage(damage) {
    // Проверяем отражение урона для Crystal Golem
    if (this.canReflect && Math.random() < this.reflectChance) {
      const player = gameState.player;
      if (player) {
        // Отраженный урон наносится игроку
        const reflectedDamage = Math.floor(damage * 0.5);
        player.takeDamage(reflectedDamage);
        
        // Создаем эффект отражения
        const { createParticle } = await import('../effects/Particle.js');
        for (let i = 0; i < 6; i++) {
          createParticle(
            this.x + Utils.random(-15, 15),
            this.y + Utils.random(-15, 15),
            Utils.randomFloat(-80, 80),
            Utils.randomFloat(-80, 80),
            '#e67e22',
            0.8,
            1.5
          );
        }
        
        // Воспроизводим звук отражения
        const { audioManager } = await import('../audio/AudioManager.js');
        audioManager.playEnemyHit(); // Используем звук попадания как звук отражения
        
        return; // Не получаем урон
      }
    }
    
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

      // Начисляем золото за убийство (вероятностный дроп)
      if (gameState.player) {
        const dropChance = this.isBoss ? 1.0 : (this.reward >= 30 ? 0.6 : 0.3);
        if (Math.random() < dropChance) {
          const goldReward = Math.floor((this.reward || 10) * (1 + (gameState.level - 1) * 0.08));
          gameState.player.gold += goldReward;
          gameState.gold = gameState.player.gold;
          // Золотые частицы
          for (let i = 0; i < 4; i++) {
            createParticle(
              this.x + Utils.random(-10, 10),
              this.y + Utils.random(-10, 10),
              Utils.randomFloat(-40, 40),
              Utils.randomFloat(-80, -20),
              '#f39c12',
              1.0,
              3
            );
          }
        }
      }

      // Используем RecordsManager для правильного подсчета статистики
      const { RecordsManager } = await import('../ui/RecordsManager.js');
      RecordsManager.addSessionKill();
      
      // Воспроизводим звук смерти врага
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playEnemyDie();
      
      // Используем новую систему дропа с врагов (15-25% в зависимости от уровня)
      const { getEnemyDropChance } = await import('../config/lootConfig.js');
      let dropChance = getEnemyDropChance(gameState.level);
      
      // Бонус к дропу для элитных врагов (с levelRequirement)
      if (this.enemyData.levelRequirement) {
        dropChance *= 1.5; // +50% к шансу дропа
      }
      
      // Бонус к дропу для врагов с особыми способностями
      if (this.enemyData.canStun || this.enemyData.canTeleport || this.enemyData.canReflect) {
        dropChance *= 1.3; // +30% к шансу дропа
      }
      
      if (Math.random() < dropChance) {
        await this.dropItem();
      }
    }
  }
  
  async dropItem() {
    const item = await generateRandomItem(gameState.level, gameState.selectedCharacter?.class || null);
    
    // Проверяем, что предмет сгенерирован корректно
    if (!item) {
      const { Logger } = await import('../utils/Logger.js');
      Logger.error('❌ Failed to generate item for enemy');
      return;
    }
    
    // Создаем предмет
    const { DroppedItem } = await import('./DroppedItem.js');
    const droppedItem = new DroppedItem(this.x, this.y, item);
    gameState.entities.push(droppedItem);
  }
  
  draw() {
    if (this.isDead) return;
    
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    // Эффект свечения при наличии дебафов
    if (this.debuffs.active.length > 0) {
      ctx.save();
      const glowRadius = this.radius + 8;
      const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius);
      
      // Определяем цвет свечения на основе типа дебафа
      let glowColor = '#ffffff';
      if (this.debuffs.active.some(d => d.type === 'burn')) {
        glowColor = '#e67e22'; // Оранжевый для ожога
      } else if (this.debuffs.active.some(d => d.type === 'freeze')) {
        glowColor = '#3498db'; // Синий для заморозки
      } else if (this.debuffs.active.some(d => d.type === 'stun')) {
        glowColor = '#f1c40f'; // Желтый для стана
      }
      
      glowGradient.addColorStop(0, `${glowColor}40`);
      glowGradient.addColorStop(0.7, `${glowColor}20`);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Рисуем стилизованный спрайт врага
    this.renderCustomSprite(ctx, screenX, screenY);
    
    // Индикатор здоровья (только если повреждён)
    if (this.hp < this.maxHp) {
      this.renderHealthBar(ctx, screenX, screenY);
    }
    
    // Отображаем активные дебафы
    this.renderDebuffs(ctx, screenX, screenY);
  }
  
  renderDebuffs(ctx, x, y) {
    if (!this.debuffs.active.length) return;
    
    const barWidth = 28; // Оптимальная ширина для противников
    const barHeight = 3; // Тонкие полоски
    const barSpacing = 2; // Минимальные отступы
    const startY = y - this.radius - 12; // Под HP баром
    
    this.debuffs.active.forEach((debuff, index) => {
      const barY = startY + index * (barHeight + barSpacing);
      const barX = x - barWidth / 2;
      
      // Определяем цвет дебафа
      let debuffColor;
      switch (debuff.type) {
        case 'burn':
          debuffColor = '#e67e22'; // Оранжевый для ожога
          break;
        case 'freeze':
          debuffColor = '#3498db'; // Синий для заморозки
          break;
        case 'slow':
          debuffColor = '#9b59b6'; // Фиолетовый для замедления
          break;
        case 'stun':
          debuffColor = '#f1c40f'; // Желтый для стана
          break;
        case 'weakness':
          debuffColor = '#e74c3c'; // Красный для слабости
          break;
        case 'poison':
          debuffColor = '#27ae60'; // Зеленый для яда
          break;
        default:
          debuffColor = '#95a5a6'; // Серый по умолчанию
      }
      
      // Фон полоски дебафа
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Полоска дебафа (убывает по времени)
      const timePercent = debuff.remainingTime / debuff.duration;
      ctx.fillStyle = debuffColor;
      ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * timePercent, barHeight - 2);
      
      // Граница полоски
      ctx.strokeStyle = debuffColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    });
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
      case 'Skeleton Archer':
        this.renderSkeletonArcher(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Dark Mage':
        this.renderDarkMage(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Frost Mage':
        this.renderFrostMage(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Poison Spitter':
        this.renderPoisonSpitter(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Stun Warrior':
        this.renderStunWarrior(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Orc Warrior':
        this.renderOrcWarrior(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Shadow Assassin':
        this.renderShadowAssassin(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Void Wraith':
        this.renderVoidWraith(ctx, x, y, isMoving, isAttacking);
        break;
      case 'Crystal Golem':
        this.renderCrystalGolem(ctx, x, y, isMoving, isAttacking);
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
  
  renderSkeletonArcher(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85;
    
    // Череп (как у обычного скелета)
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
    
    // Лук
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + size * 0.3, y - size * 0.1, size * 0.25, size * 0.15, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Тетива
    ctx.strokeStyle = '#f5f5dc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.05, y - size * 0.1);
    ctx.lineTo(x + size * 0.55, y - size * 0.1);
    ctx.stroke();
    
    // Стрела
    if (isAttacking) {
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.05, y - size * 0.1);
      ctx.lineTo(x + size * 0.6, y - size * 0.1);
      ctx.stroke();
      
      // Наконечник стрелы
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.6, y - size * 0.1);
      ctx.lineTo(x + size * 0.65, y - size * 0.15);
      ctx.lineTo(x + size * 0.65, y - size * 0.05);
      ctx.closePath();
      ctx.fill();
    }
    
    // Руки с анимацией стрельбы
    const armSwing = isMoving ? Math.sin(this.animationTime * 8) * 0.1 : 0;
    ctx.strokeStyle = '#f5f5dc';
    ctx.lineWidth = 2;
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
  
  renderFrostMage(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85;
    
    // Ледяная мантия
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Ледяной капюшон
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (ледяные)
    const eyeGlow = Math.sin(this.animationTime * 3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + eyeGlow * 0.6})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Ледяной посох
    ctx.strokeStyle = '#85c1e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.4);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.stroke();
    
    // Ледяной кристалл на посохе
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.4, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Ледяные частицы
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.animationTime * 1.5;
      const particleX = x + Math.cos(angle) * size * 0.6;
      const particleY = y + Math.sin(angle) * size * 0.6;
      ctx.fillRect(particleX, particleY, 3, 3);
    }
    
    // Ледяная аура
    const auraSize = size * 0.7 + Math.sin(this.animationTime * 2) * size * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - ледяной взрыв
    if (isAttacking) {
      const iceSize = size * 0.9 + Math.sin(this.animationTime * 20) * size * 0.3;
      const iceGradient = ctx.createRadialGradient(x, y, 0, x, y, iceSize);
      iceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      iceGradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.7)');
      iceGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
      ctx.fillStyle = iceGradient;
      ctx.beginPath();
      ctx.arc(x, y, iceSize, 0, Math.PI * 2);
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
  
  renderPoisonSpitter(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85;
    
    // Тело ящерицы
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова ящерицы
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (ядовитые)
    const eyeGlow = Math.sin(this.animationTime * 4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + eyeGlow * 0.5})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.12, y - size * 0.35, size * 0.06, 0, Math.PI * 2);
    ctx.arc(x + size * 0.12, y - size * 0.35, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Ядовитые пятна на теле
    ctx.fillStyle = '#229954';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const spotX = x + Math.cos(angle) * size * 0.3;
      const spotY = y + Math.sin(angle) * size * 0.3;
      ctx.beginPath();
      ctx.arc(spotX, spotY, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Хвост
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y);
    ctx.lineTo(x - size * 0.6, y + size * 0.1);
    ctx.stroke();
    
    // Ядовитые капли
    ctx.fillStyle = '#2ecc71';
    for (let i = 0; i < 3; i++) {
      const dropX = x + size * 0.3 + i * size * 0.1;
      const dropY = y - size * 0.1 + Math.sin(this.animationTime * 3 + i) * size * 0.05;
      ctx.beginPath();
      ctx.arc(dropX, dropY, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Ядовитая аура
    const auraSize = size * 0.6 + Math.sin(this.animationTime * 2.5) * size * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - ядовитый плевок
    if (isAttacking) {
      const poisonSize = size * 0.8 + Math.sin(this.animationTime * 25) * size * 0.2;
      const poisonGradient = ctx.createRadialGradient(x, y, 0, x, y, poisonSize);
      poisonGradient.addColorStop(0, 'rgba(46, 204, 113, 0.8)');
      poisonGradient.addColorStop(0.5, 'rgba(39, 174, 96, 0.6)');
      poisonGradient.addColorStop(1, 'rgba(39, 174, 96, 0)');
      ctx.fillStyle = poisonGradient;
      ctx.beginPath();
      ctx.arc(x, y, poisonSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  renderStunWarrior(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85;
    
    // Тело воина
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (электрические)
    const eyeGlow = Math.sin(this.animationTime * 6) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 0, ${0.6 + eyeGlow * 0.4})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.12, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.12, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Электрический молот
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(x + size * 0.3, y - size * 0.2, size * 0.2, size * 0.4);
    
    // Ручка молота
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y);
    ctx.lineTo(x + size * 0.7, y);
    ctx.stroke();
    
    // Электрические разряды вокруг молота
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.animationTime * 4;
      const startX = x + size * 0.4;
      const startY = y - size * 0.1;
      const endX = startX + Math.cos(angle) * size * 0.3;
      const endY = startY + Math.sin(angle) * size * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Электрическая аура
    const auraSize = size * 0.7 + Math.sin(this.animationTime * 3) * size * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация атаки - электрический взрыв
    if (isAttacking) {
      const electricSize = size * 1.0 + Math.sin(this.animationTime * 30) * size * 0.3;
      const electricGradient = ctx.createRadialGradient(x, y, 0, x, y, electricSize);
      electricGradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
      electricGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.7)');
      electricGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      ctx.fillStyle = electricGradient;
      ctx.beginPath();
      ctx.arc(x, y, electricSize, 0, Math.PI * 2);
      ctx.fill();
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

  renderVoidWraith(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.85;
    
    // Мистическое тело призрака
    const ghostAlpha = Math.sin(this.animationTime * 2) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(155, 89, 182, ${ghostAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон призрака
    ctx.fillStyle = `rgba(142, 68, 173, ${ghostAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (мистические)
    const eyeGlow = Math.sin(this.animationTime * 5) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + eyeGlow * 0.6})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.25, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Мистический посох
    ctx.strokeStyle = `rgba(155, 89, 182, ${ghostAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.4);
    ctx.lineTo(x - size * 0.3, y + size * 0.3);
    ctx.stroke();
    
    // Мистический кристалл
    ctx.fillStyle = `rgba(255, 255, 255, ${ghostAlpha})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Мистические частицы
    ctx.fillStyle = `rgba(255, 255, 255, ${ghostAlpha})`;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.animationTime * 1.5;
      const particleX = x + Math.cos(angle) * size * 0.6;
      const particleY = y + Math.sin(angle) * size * 0.6;
      ctx.fillRect(particleX, particleY, 2, 2);
    }
    
    // Мистическая аура
    const auraSize = size * 0.8 + Math.sin(this.animationTime * 2) * size * 0.15;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, `rgba(155, 89, 182, ${0.3 * ghostAlpha})`);
    gradient.addColorStop(1, `rgba(155, 89, 182, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Эффект телепортации
    if (this.canTeleport && Math.random() < 0.1) {
      const teleportSize = size * 0.6 + Math.sin(this.animationTime * 8) * size * 0.2;
      const teleportGradient = ctx.createRadialGradient(x, y, 0, x, y, teleportSize);
      teleportGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      teleportGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
      ctx.fillStyle = teleportGradient;
      ctx.beginPath();
      ctx.arc(x, y, teleportSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Анимация атаки - мистический взрыв
    if (isAttacking) {
      const voidSize = size * 0.9 + Math.sin(this.animationTime * 25) * size * 0.3;
      const voidGradient = ctx.createRadialGradient(x, y, 0, x, y, voidSize);
      voidGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      voidGradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.7)');
      voidGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
      ctx.fillStyle = voidGradient;
      ctx.beginPath();
      ctx.arc(x, y, voidSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderCrystalGolem(ctx, x, y, isMoving, isAttacking) {
    const size = this.radius * 0.9; // Голем немного больше
    
    // Кристаллическое тело
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Кристаллическая голова
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (кристаллические)
    const eyeGlow = Math.sin(this.animationTime * 4) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + eyeGlow * 0.5})`;
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.15, y - size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Кристаллические грани на теле
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const startX = x + Math.cos(angle) * size * 0.3;
      const startY = y + Math.sin(angle) * size * 0.3;
      const endX = x + Math.cos(angle) * size * 0.5;
      const endY = y + Math.sin(angle) * size * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Кристаллические руки
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(x - size * 0.4, y - size * 0.1, size * 0.2, size * 0.4);
    ctx.fillRect(x + size * 0.2, y - size * 0.1, size * 0.2, size * 0.4);
    
    // Кристаллические кулаки
    ctx.fillStyle = '#d35400';
    ctx.fillRect(x - size * 0.5, y - size * 0.2, size * 0.15, size * 0.3);
    ctx.fillRect(x + size * 0.35, y - size * 0.2, size * 0.15, size * 0.3);
    
    // Кристаллическая аура
    const auraSize = size * 0.8 + Math.sin(this.animationTime * 2) * size * 0.1;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(230, 126, 34, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Эффект отражения
    if (this.canReflect && Math.random() < 0.2) {
      const reflectSize = size * 0.7 + Math.sin(this.animationTime * 10) * size * 0.2;
      const reflectGradient = ctx.createRadialGradient(x, y, 0, x, y, reflectSize);
      reflectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      reflectGradient.addColorStop(1, 'rgba(230, 126, 34, 0)');
      ctx.fillStyle = reflectGradient;
      ctx.beginPath();
      ctx.arc(x, y, reflectSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Анимация атаки - кристаллический взрыв
    if (isAttacking) {
      const crystalSize = size * 1.1 + Math.sin(this.animationTime * 20) * size * 0.3;
      const crystalGradient = ctx.createRadialGradient(x, y, 0, x, y, crystalSize);
      crystalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      crystalGradient.addColorStop(0.5, 'rgba(230, 126, 34, 0.7)');
      crystalGradient.addColorStop(1, 'rgba(230, 126, 34, 0)');
      ctx.fillStyle = crystalGradient;
      ctx.beginPath();
      ctx.arc(x, y, crystalSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
} 
