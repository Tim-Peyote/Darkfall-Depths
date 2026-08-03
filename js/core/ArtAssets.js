/* Darkfall Depths - cohesive runtime art assets */

const TAU = Math.PI * 2;

export class ArtAssets {
  static cache = new Map();
  static atlasImages = new Map();
  static atlasReadyCallbacks = [];
  static atlasesLoading = false;
  static spriteFrames = new Map();

  static spriteSets = {
    mage: 'Assets/sprites/characters/mage',
    warrior: 'Assets/sprites/characters/warrior',
    rogue: 'Assets/sprites/characters/rogue',
    skeleton: 'Assets/sprites/enemies/skeleton',
    skeleton_archer: 'Assets/sprites/enemies/skeleton_archer',
    dark_mage: 'Assets/sprites/enemies/dark_mage',
    frost_mage: 'Assets/sprites/enemies/frost_mage',
    poison_spitter: 'Assets/sprites/enemies/poison_spitter',
    stun_warrior: 'Assets/sprites/enemies/stun_warrior',
    orc_warrior: 'Assets/sprites/enemies/orc_warrior',
    shadow_assassin: 'Assets/sprites/enemies/shadow_assassin',
    demon_lord: 'Assets/sprites/enemies/demon_lord',
    ancient_guardian: 'Assets/sprites/enemies/ancient_guardian',
    void_wraith: 'Assets/sprites/enemies/void_wraith',
    crystal_golem: 'Assets/sprites/enemies/crystal_golem',
    skeleton_king: 'Assets/sprites/bosses/skeleton_king',
    dragon: 'Assets/sprites/bosses/dragon',
    lich: 'Assets/sprites/bosses/lich'
  };

  // A set becomes runtime-visible only after all 15 directional frames exist.
  static readySpriteSets = new Set(['mage', 'warrior']);

  static enemySpriteIds = {
    'Skeleton': 'skeleton',
    'Skeleton Archer': 'skeleton_archer',
    'Dark Mage': 'dark_mage',
    'Frost Mage': 'frost_mage',
    'Poison Spitter': 'poison_spitter',
    'Stun Warrior': 'stun_warrior',
    'Orc Warrior': 'orc_warrior',
    'Shadow Assassin': 'shadow_assassin',
    'Demon Lord': 'demon_lord',
    'Ancient Guardian': 'ancient_guardian',
    'Void Wraith': 'void_wraith',
    'Crystal Golem': 'crystal_golem',
    'Skeleton King': 'skeleton_king',
    'Dragon': 'dragon',
    'Lich': 'lich'
  };

  static spriteDirections = ['down', 'up', 'side'];
  static spriteStates = ['idle', 'walk_1', 'walk_2', 'attack', 'hurt'];
  static spriteVersion = 3;

  static atlasDefinitions = {
    enemies1: { src: 'Assets/generated/enemies-1.png', cols: 5, rows: 1 },
    enemies2: { src: 'Assets/generated/enemies-2.png', cols: 5, rows: 1 },
    enemies3: { src: 'Assets/generated/enemies-3.png', cols: 5, rows: 1 },
    equipment: { src: 'Assets/generated/equipment.png', cols: 6, rows: 3 },
    potions: { src: 'Assets/generated/potions.png', cols: 6, rows: 2 },
    scrolls1: { src: 'Assets/generated/scrolls-1.png', cols: 6, rows: 2 },
    scrolls2: { src: 'Assets/generated/scrolls-2.png', cols: 6, rows: 2 }
  };

  static enemyAtlas = {
    'Skeleton': ['enemies1', 0, 0],
    'Skeleton Archer': ['enemies1', 1, 0],
    'Dark Mage': ['enemies1', 2, 0],
    'Frost Mage': ['enemies1', 3, 0],
    'Poison Spitter': ['enemies1', 4, 0],
    'Stun Warrior': ['enemies2', 0, 0],
    'Orc Warrior': ['enemies2', 1, 0],
    'Shadow Assassin': ['enemies2', 2, 0],
    'Demon Lord': ['enemies2', 3, 0],
    'Ancient Guardian': ['enemies2', 4, 0],
    'Void Wraith': ['enemies3', 0, 0],
    'Crystal Golem': ['enemies3', 1, 0],
    'Skeleton King': ['enemies3', 2, 0],
    'Dragon': ['enemies3', 3, 0],
    'Lich': ['enemies3', 4, 0]
  };

  static itemAtlas = {
    sword: ['equipment', 0, 0],
    axe: ['equipment', 1, 0],
    staff: ['equipment', 2, 0],
    wand: ['equipment', 3, 0],
    dagger: ['equipment', 4, 0],
    crossbow: ['equipment', 5, 0],
    shield: ['equipment', 0, 1],
    robe: ['equipment', 1, 1],
    leather: ['equipment', 2, 1],
    plate: ['equipment', 3, 1],
    helmet: ['equipment', 4, 1],
    hood: ['equipment', 5, 1],
    cap: ['equipment', 0, 2],
    gloves: ['equipment', 1, 2],
    belt: ['equipment', 2, 2],
    boots: ['equipment', 3, 2],
    amulet: ['equipment', 4, 2],
    ring: ['equipment', 5, 2],
    potion: ['potions', 0, 0],
    mana_potion: ['potions', 1, 0],
    speed_potion: ['potions', 2, 0],
    strength_potion: ['potions', 3, 0],
    defense_potion: ['potions', 4, 0],
    regen_potion: ['potions', 5, 0],
    combo_potion: ['potions', 0, 1],
    purification_potion: ['potions', 1, 1],
    mystery_potion: ['potions', 2, 1],
    health_potion: ['potions', 3, 1],
    gold_pouch: ['potions', 4, 1],
    scroll_werewolf: ['scrolls1', 0, 0],
    scroll_stone: ['scrolls1', 1, 0],
    scroll_fire_explosion: ['scrolls1', 2, 0],
    scroll_ice_storm: ['scrolls1', 3, 0],
    scroll_lightning: ['scrolls1', 4, 0],
    scroll_earthquake: ['scrolls1', 5, 0],
    scroll_clone: ['scrolls1', 0, 1],
    scroll_teleport: ['scrolls1', 1, 1],
    scroll_invisibility: ['scrolls1', 2, 1],
    scroll_time: ['scrolls1', 3, 1],
    scroll_curse: ['scrolls1', 4, 1],
    scroll_chaos: ['scrolls1', 5, 1],
    scroll_fear: ['scrolls2', 0, 0],
    scroll_smoke: ['scrolls2', 1, 0],
    scroll_meteor: ['scrolls2', 2, 0],
    scroll_barrier: ['scrolls2', 3, 0],
    scroll_rage: ['scrolls2', 4, 0],
    scroll_invulnerability: ['scrolls2', 5, 0],
    scroll_vampirism: ['scrolls2', 0, 1],
    mystery_scroll: ['scrolls2', 1, 1],
    scroll_fire: ['scrolls2', 2, 1],
    scroll_ice: ['scrolls2', 3, 1],
    scroll_mystery: ['scrolls2', 4, 1]
  };

  static loadAtlases() {
    if (this.atlasesLoading || typeof Image === 'undefined') return;
    this.atlasesLoading = true;
    let pending = Object.keys(this.atlasDefinitions).length;

    Object.entries(this.atlasDefinitions).forEach(([key, definition]) => {
      const image = new Image();
      image.onload = image.onerror = () => {
        pending -= 1;
        if (pending === 0) {
          this.atlasReadyCallbacks.splice(0).forEach((callback) => callback());
        }
      };
      image.src = definition.src;
      this.atlasImages.set(key, image);
    });
  }

  static onAtlasesReady(callback) {
    const images = [...this.atlasImages.values()];
    if (images.length && images.every((image) => image.complete)) {
      callback();
      return;
    }
    this.atlasReadyCallbacks.push(callback);
    this.loadAtlases();
  }

  static drawAtlasCell(ctx, spec, x, y, width, height) {
    if (!spec) return false;
    const [atlasKey, col, row] = spec;
    const image = this.atlasImages.get(atlasKey);
    const definition = this.atlasDefinitions[atlasKey];
    if (!image || !definition || !image.complete || !image.naturalWidth) return false;

    const sourceWidth = image.naturalWidth / definition.cols;
    const sourceHeight = image.naturalHeight / definition.rows;
    ctx.drawImage(
      image,
      col * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height
    );
    return true;
  }

  static loadSpriteSets() {
    if (typeof Image === 'undefined') return;
    Object.entries(this.spriteSets).forEach(([spriteId, root]) => {
      if (!this.readySpriteSets.has(spriteId)) return;
      this.spriteDirections.forEach((direction) => {
        this.spriteStates.forEach((state) => {
          const key = `${spriteId}:${direction}:${state}`;
          if (this.spriteFrames.has(key)) return;
          const image = new Image();
          image.src = `${root}/${direction}/${state}.png?v=${this.spriteVersion}`;
          this.spriteFrames.set(key, image);
        });
      });
    });
  }

  static getDirection(vector = { x: 0, y: 1 }) {
    const x = Number(vector.x) || 0;
    const y = Number(vector.y) || 0;
    if (Math.abs(y) >= Math.abs(x)) {
      return { name: y < 0 ? 'up' : 'down', flipX: false };
    }
    return { name: 'side', flipX: x > 0 };
  }

  static getSpriteState(entity, state) {
    if ((entity.hurtAnimation || 0) > 0) return 'hurt';
    if (state.isAttacking) return 'attack';
    if (state.isMoving) {
      return Math.floor((entity.animationTime || 0) * 7) % 2 === 0 ? 'walk_1' : 'walk_2';
    }
    return 'idle';
  }

  static drawFrameSprite(ctx, spriteId, entity, state, x, y, width, height) {
    if (!this.spriteSets[spriteId] || !this.readySpriteSets.has(spriteId)) return false;
    const direction = this.getDirection(entity.direction);
    const frameState = this.getSpriteState(entity, state);
    const image = this.spriteFrames.get(`${spriteId}:${direction.name}:${frameState}`);
    if (!image || !image.complete || !image.naturalWidth) return false;

    ctx.save();
    ctx.translate(x, y);
    if (direction.flipX) ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, -height + 24, width, height);
    ctx.restore();
    return true;
  }

  static drawTile(ctx, type, x, y, size, variant = 0) {
    const key = `tile:${type}:${size}:${variant % 8}`;
    const tile = this.getOrCreate(key, size, size, (tileCtx) => {
      this.paintTile(tileCtx, type, size, variant);
    });
    ctx.drawImage(tile, x, y);
  }

  static drawHero(ctx, hero, x, y, state = {}) {
    const t = hero.animationTime || 0;
    const bob = state.isMoving ? Math.sin(t * 14) * 0.6 : Math.sin(t * 2.2) * 0.35;
    const alpha = hero.isInvulnerable ? 0.55 + Math.sin(t * 18) * 0.25 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    this.shadow(ctx, x, y + 16, 19, 6, 'rgba(0,0,0,0.48)');

    if (hero.hasBlast && hero.blastCooldown > 0) {
      this.cooldownRing(ctx, x, y, 28, hero.blastCooldown / 12, '#d56b2d');
    }
    if (hero.hasShield && hero.shieldCooldown > 0) {
      this.cooldownRing(ctx, x, y, 28, hero.shieldCooldown / 8, '#6eb6d8');
    }
    if (hero.hasDash && hero.dashCooldown > 0) {
      this.cooldownRing(ctx, x, y, 28, hero.dashCooldown / 3, '#51c27b');
    }

    if (hero.isShieldActive) {
      const pulse = 0.65 + Math.sin(t * 8) * 0.2;
      ctx.strokeStyle = `rgba(95,190,255,${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 3, 28 + Math.sin(t * 5) * 2, 0, TAU);
      ctx.stroke();
    }

    if (hero.vampirism) this.statusAura(ctx, x, y, '#8e2c5d', t, 30);
    if (hero.rageMode) this.statusAura(ctx, x, y, '#c43425', t * 1.4, 32);

    const frameDrawn = this.drawFrameSprite(ctx, hero.class, hero, state, x, y + bob, 80, 80);
    if (!frameDrawn) {
      const key = `hero:${hero.class}`;
      const sprite = this.getOrCreate(key, 72, 82, (spriteCtx) => {
        this.paintHero(spriteCtx, hero.class);
      });
      ctx.translate(x, y + bob);
      ctx.scale(0.9, 0.9);
      ctx.drawImage(sprite, -36, -55);
    }

    if (state.isAttacking && !frameDrawn) {
      this.attackFlash(ctx, hero.class, hero.attackAnimation || 0);
    }

    ctx.restore();
  }

  static drawEnemy(ctx, enemy, x, y, state = {}) {
    const t = enemy.animationTime || 0;
    const bob = state.isMoving ? Math.sin(t * 9) * 1.25 : Math.sin(t * 2) * 0.35;
    const step = state.isMoving ? Math.sin(t * 9) : 0;
    const attack = state.isAttacking ? 1.04 + Math.sin(t * 18) * 0.045 : 1;
    const scale = enemy.isBoss ? 1.08 : 0.84;

    ctx.save();
    this.shadow(ctx, x, y + 17, enemy.isBoss ? 29 : 17, enemy.isBoss ? 8 : 5, 'rgba(0,0,0,0.52)');

    if (enemy.isChaotic) this.statusAura(ctx, x, y, '#c7362c', t * 1.5, 31);
    if (enemy.isAfraid) this.statusAura(ctx, x, y, '#9b59b6', -t, 29);
    if (enemy.canReflect) this.cooldownRing(ctx, x, y, 26, 0.65 + Math.sin(t * 3) * 0.15, '#d48c32');

    const spriteId = this.enemySpriteIds[enemy.type];
    const frameDrawn = this.drawFrameSprite(
      ctx,
      spriteId,
      enemy,
      state,
      x,
      y + bob,
      enemy.isBoss ? 106 : 82,
      enemy.isBoss ? 106 : 82
    );

    if (!frameDrawn) {
      ctx.translate(x, y + bob);
      ctx.rotate(step * 0.018);
      ctx.scale(scale * attack, scale * (1 - Math.abs(step) * 0.018));

      const atlasDrawn = this.drawAtlasCell(
        ctx,
        this.enemyAtlas[enemy.type],
        enemy.isBoss ? -48 : -39,
        enemy.isBoss ? -83 : -65,
        enemy.isBoss ? 96 : 78,
        enemy.isBoss ? 108 : 90
      );

      if (!atlasDrawn) {
        const key = `enemy:${enemy.type}`;
        const sprite = this.getOrCreate(key, 74, 82, (spriteCtx) => {
          this.paintEnemy(spriteCtx, enemy.type);
        });
        ctx.drawImage(sprite, -37, -55);
      }

      if (state.isAttacking) {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#f0d19a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -4, 26, -0.35, 1.15);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  static drawItem(ctx, item, x, y, radius, time = 0) {
    if (!item) return false;
    const base = item.base || item.type || 'unknown';
    const pulse = 1 + Math.sin(time * 2.5) * 0.05;
    const glowColor = item.color || this.rarityColor(item.rarity);

    ctx.save();
    this.shadow(ctx, x, y + radius * 0.72, radius * 1.05, radius * 0.25, 'rgba(0,0,0,0.45)');
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glow.addColorStop(0, `${glowColor}55`);
    glow.addColorStop(0.55, `${glowColor}22`);
    glow.addColorStop(1, `${glowColor}00`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, TAU);
    ctx.fill();

    ctx.translate(x, y + Math.sin(time * 3) * 3);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.sin(time * 1.2) * 0.08);
    if (!this.drawAtlasCell(ctx, this.itemAtlas[base], -29, -29, 58, 58)) {
      const key = `item:${base}:${item.rarity || 'common'}`;
      const sprite = this.getOrCreate(key, 58, 58, (spriteCtx) => {
        this.paintItem(spriteCtx, item);
      });
      ctx.drawImage(sprite, -29, -29);
    }
    ctx.restore();
    return true;
  }

  static drawInventoryItem(ctx, item, x, y, size) {
    if (!item) return false;
    const base = item.base || item.type;
    const inset = size * 0.04;
    return this.drawAtlasCell(
      ctx,
      this.itemAtlas[base],
      x - size / 2 + inset,
      y - size / 2 + inset,
      size - inset * 2,
      size - inset * 2
    );
  }

  static getOrCreate(key, width, height, painter) {
    if (this.cache.has(key)) return this.cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    painter(ctx);
    this.cache.set(key, canvas);
    return canvas;
  }

  static paintTile(ctx, type, size, variant) {
    if (type === 'wall') {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#17110d');
      g.addColorStop(0.45, '#33251b');
      g.addColorStop(1, '#0b0908');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#070605';
      ctx.lineWidth = 2;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

      const cuts = [
        [0, 10, size, 7], [0, 22, size, 20],
        [10, 0, 8, size], [23, 0, 21, size]
      ];
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1;
      cuts.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1 + (variant % 3));
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      ctx.fillStyle = 'rgba(208,105,45,0.12)';
      ctx.fillRect(3 + (variant * 5) % 20, 4 + (variant * 7) % 22, 5, 2);
      ctx.fillStyle = 'rgba(255,190,95,0.08)';
      ctx.fillRect(17, 8 + (variant % 5), 7, 1);
      return;
    }

    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, '#1b1815');
    g.addColorStop(0.5, '#29231d');
    g.addColorStop(1, '#12100e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(size, 12 + (variant % 4));
    ctx.moveTo(8 + (variant % 5), 0);
    ctx.lineTo(6, size);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,88,58,0.2)';
    ctx.fillRect(4 + (variant * 3) % 22, 21, 8, 2);
    ctx.fillStyle = 'rgba(220,130,55,0.08)';
    ctx.fillRect(19, 5 + (variant * 2) % 17, 5, 1);
  }

  static paintHero(ctx, heroClass) {
    ctx.translate(36, 55);
    if (heroClass === 'mage') return this.paintMage(ctx);
    if (heroClass === 'warrior') return this.paintWarrior(ctx);
    return this.paintRogue(ctx);
  }

  static paintMage(ctx) {
    this.cloak(ctx, '#160d1f', '#4a235c');
    ctx.fillStyle = '#211026';
    ctx.beginPath();
    ctx.moveTo(-18, -23);
    ctx.quadraticCurveTo(0, -43, 18, -23);
    ctx.quadraticCurveTo(9, -12, 0, -13);
    ctx.quadraticCurveTo(-9, -12, -18, -23);
    ctx.fill();
    this.head(ctx, '#c28e67', '#ff9b48', true);
    this.staff(ctx, -20, -1, '#6a3d24', '#ff7438');
    this.gem(ctx, -20, -36, '#ff6b2a');
    this.trim(ctx, '#d87b38');
    this.smallRune(ctx, 0, 0, '#f0a34a', 'M');
  }

  static paintWarrior(ctx) {
    this.bodyPlate(ctx, '#373430', '#a89473', '#5b1713');
    this.head(ctx, '#c79068', '#222', false);
    this.helmet(ctx);
    ctx.fillStyle = '#7a2119';
    ctx.fillRect(-9, -24, 18, 8);
    this.sword(ctx, 19, -5);
    this.shield(ctx, -18, 0, '#6b1f18');
    this.smallRune(ctx, -1, 2, '#d8c896', 'W');
  }

  static paintRogue(ctx) {
    this.cloak(ctx, '#07120c', '#1d5a35');
    this.head(ctx, '#bf8761', '#111', true);
    this.hood(ctx, '#173820');
    this.dagger(ctx, -17, -2);
    this.dagger(ctx, 17, -2, true);
    this.trim(ctx, '#5bd489');
    this.smallRune(ctx, 0, 1, '#5bd489', 'R');
  }

  static paintEnemy(ctx, type) {
    ctx.translate(37, 55);
    if (type === 'Skeleton' || type === 'Skeleton Archer') {
      this.bones(ctx, type.includes('Archer'));
    } else if (type === 'Dark Mage' || type === 'Frost Mage') {
      this.enemyMage(ctx, type === 'Frost Mage' ? '#3f94bf' : '#7b3da2');
    } else if (type === 'Poison Spitter') {
      this.beast(ctx, '#315c2c', '#77d66a');
    } else if (type === 'Stun Warrior') {
      this.armoredEnemy(ctx, '#6a4420', '#f0c54d');
    } else if (type === 'Orc Warrior') {
      this.armoredEnemy(ctx, '#315a2d', '#9bc36d');
    } else if (type === 'Shadow Assassin') {
      this.assassin(ctx);
    } else if (type === 'Void Wraith') {
      this.wraith(ctx);
    } else if (type === 'Crystal Golem') {
      this.golem(ctx);
    } else if (type === 'Demon Lord') {
      this.demon(ctx);
    } else if (type === 'Ancient Guardian') {
      this.guardian(ctx);
    } else if (type === 'Skeleton King') {
      this.skeletonKing(ctx);
    } else if (type === 'Dragon') {
      this.dragon(ctx);
    } else if (type === 'Lich') {
      this.lich(ctx);
    } else {
      this.beast(ctx, '#3b2b24', '#be3b2c');
    }
  }

  static paintItem(ctx, item) {
    ctx.translate(29, 29);
    const base = item.base || '';
    if (base.includes('scroll') || base.startsWith('scroll_')) return this.itemScroll(ctx, item);
    if (base.includes('potion') || base === 'potion') return this.itemPotion(ctx, item);
    if (base === 'gold_pouch') return this.itemGold(ctx);
    if (item.type === 'weapon') return this.itemWeapon(ctx, item);
    if (item.type === 'shield') return this.itemShield(ctx);
    if (item.type === 'armor' || item.type === 'head') return this.itemArmor(ctx, item);
    if (item.type === 'accessory') return this.itemAccessory(ctx, item);
    this.itemRelic(ctx, item);
  }

  static cloak(ctx, dark, mid) {
    const g = ctx.createLinearGradient(0, -33, 0, 20);
    g.addColorStop(0, mid);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(25, -22, 22, 18);
    ctx.quadraticCurveTo(0, 29, -22, 18);
    ctx.quadraticCurveTo(-25, -22, 0, -34);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  static bodyPlate(ctx, dark, metal, cloth) {
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 27, 0, 0, TAU);
    ctx.fill();
    const g = ctx.createLinearGradient(-14, -22, 16, 20);
    g.addColorStop(0, '#d7c5aa');
    g.addColorStop(0.45, metal);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-16, -23, 32, 40, 8);
    ctx.fill();
    ctx.strokeStyle = '#1b1714';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.lineTo(8, 11);
    ctx.stroke();
  }

  static head(ctx, skin, eye, hooded) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, -31, 10, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = eye;
    ctx.fillRect(-5, -33, 3, 2);
    ctx.fillRect(3, -33, 3, 2);
    if (hooded) {
      ctx.strokeStyle = 'rgba(0,0,0,0.42)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -30, 13, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
  }

  static hood(ctx, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-16, -30);
    ctx.quadraticCurveTo(0, -48, 16, -30);
    ctx.quadraticCurveTo(9, -22, 0, -22);
    ctx.quadraticCurveTo(-9, -22, -16, -30);
    ctx.fill();
  }

  static helmet(ctx) {
    const g = ctx.createLinearGradient(-10, -43, 10, -21);
    g.addColorStop(0, '#d2c7b4');
    g.addColorStop(1, '#555047');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -34, 13, Math.PI, TAU);
    ctx.lineTo(11, -27);
    ctx.lineTo(-11, -27);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#211c18';
    ctx.stroke();
  }

  static trim(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -19);
    ctx.lineTo(0, 18);
    ctx.lineTo(8, -19);
    ctx.stroke();
  }

  static smallRune(ctx, x, y, color, label) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 8px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);
    ctx.restore();
  }

  static staff(ctx, x, y, wood) {
    ctx.strokeStyle = wood;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    ctx.lineTo(x, y - 36);
    ctx.stroke();
  }

  static gem(ctx, x, y, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
    g.addColorStop(0, '#fff1bd');
    g.addColorStop(0.35, color);
    g.addColorStop(1, '#44130b00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fill();
  }

  static sword(ctx, x, y) {
    ctx.strokeStyle = '#d8d4c8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 18);
    ctx.lineTo(x + 13, y - 24);
    ctx.stroke();
    ctx.strokeStyle = '#5d351f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 20);
    ctx.lineTo(x - 2, y + 7);
    ctx.stroke();
  }

  static shield(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.quadraticCurveTo(x + 13, y - 10, x + 10, y + 10);
    ctx.quadraticCurveTo(x, y + 20, x - 10, y + 10);
    ctx.quadraticCurveTo(x - 13, y - 10, x, y - 18);
    ctx.fill();
    ctx.strokeStyle = '#c2a15f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  static dagger(ctx, x, y, flip = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.strokeStyle = '#cfd6d1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.lineTo(9, -16);
    ctx.stroke();
    ctx.strokeStyle = '#2b2019';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 14);
    ctx.lineTo(2, 5);
    ctx.stroke();
    ctx.restore();
  }

  static bones(ctx, archer) {
    ctx.strokeStyle = '#d8d1b3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 15);
    ctx.moveTo(-14, -5);
    ctx.lineTo(14, -5);
    ctx.moveTo(-8, 15);
    ctx.lineTo(-14, 29);
    ctx.moveTo(8, 15);
    ctx.lineTo(14, 29);
    ctx.stroke();
    ctx.fillStyle = '#ded8bf';
    ctx.beginPath();
    ctx.arc(0, -30, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#15110d';
    ctx.fillRect(-6, -33, 4, 4);
    ctx.fillRect(3, -33, 4, 4);
    if (archer) {
      ctx.strokeStyle = '#805633';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, -7, 18, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#d7caa8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(23, -23);
      ctx.lineTo(23, 9);
      ctx.stroke();
    } else {
      this.sword(ctx, 14, 0);
    }
  }

  static enemyMage(ctx, color) {
    this.cloak(ctx, '#120b13', color);
    this.head(ctx, '#9f7862', '#ff553d', true);
    this.staff(ctx, -16, 0, '#4c2c1b');
    this.gem(ctx, -16, -35, color);
  }

  static beast(ctx, body, glow) {
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 23, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#17100d';
    ctx.beginPath();
    ctx.arc(0, -20, 15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.fillRect(-8, -24, 5, 4);
    ctx.fillRect(4, -24, 5, 4);
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 2, 25, 0.2, 2.4);
    ctx.stroke();
  }

  static armoredEnemy(ctx, body, accent) {
    this.bodyPlate(ctx, '#25231f', '#6f675c', body);
    this.head(ctx, '#6c563f', '#ff3d2d', false);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, -5);
    ctx.lineTo(18, 12);
    ctx.stroke();
  }

  static assassin(ctx) {
    this.cloak(ctx, '#050607', '#20242b');
    this.hood(ctx, '#090b0f');
    ctx.fillStyle = '#e33b32';
    ctx.fillRect(-6, -33, 4, 2);
    ctx.fillRect(3, -33, 4, 2);
    this.dagger(ctx, -14, -1);
    this.dagger(ctx, 14, -1, true);
  }

  static wraith(ctx) {
    const g = ctx.createLinearGradient(0, -44, 0, 30);
    g.addColorStop(0, '#7b5bc4');
    g.addColorStop(1, '#0a0711');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.quadraticCurveTo(25, -14, 13, 24);
    ctx.quadraticCurveTo(5, 15, 0, 29);
    ctx.quadraticCurveTo(-6, 15, -15, 25);
    ctx.quadraticCurveTo(-24, -14, 0, -43);
    ctx.fill();
    ctx.fillStyle = '#d8c8ff';
    ctx.fillRect(-7, -27, 4, 3);
    ctx.fillRect(4, -27, 4, 3);
  }

  static golem(ctx) {
    const g = ctx.createLinearGradient(-20, -40, 20, 25);
    g.addColorStop(0, '#b58a42');
    g.addColorStop(0.5, '#5d4a33');
    g.addColorStop(1, '#211a16');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-20, -28, 40, 50, 8);
    ctx.fill();
    ctx.strokeStyle = '#1a1310';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffb33a';
    ctx.fillRect(-10, -16, 6, 4);
    ctx.fillRect(5, -16, 6, 4);
    ctx.strokeStyle = '#f6c35e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 1);
    ctx.lineTo(14, -9);
    ctx.stroke();
  }

  static demon(ctx) {
    this.beast(ctx, '#3b0907', '#ff442e');
    ctx.fillStyle = '#2b0505';
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(-24, -48);
    ctx.lineTo(-4, -36);
    ctx.moveTo(12, -30);
    ctx.lineTo(24, -48);
    ctx.lineTo(4, -36);
    ctx.fill();
  }

  static guardian(ctx) {
    this.golem(ctx);
    ctx.strokeStyle = '#f0c96a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -3, 27, -0.4, 1.1);
    ctx.stroke();
  }

  static skeletonKing(ctx) {
    ctx.save();
    ctx.scale(1.08, 1.08);
    this.bones(ctx, false);
    ctx.restore();

    const crown = ctx.createLinearGradient(-14, -51, 14, -34);
    crown.addColorStop(0, '#7b5424');
    crown.addColorStop(0.45, '#f0c96a');
    crown.addColorStop(1, '#5b351a');
    ctx.fillStyle = crown;
    ctx.beginPath();
    ctx.moveTo(-16, -35);
    ctx.lineTo(-13, -50);
    ctx.lineTo(-5, -39);
    ctx.lineTo(0, -53);
    ctx.lineTo(6, -39);
    ctx.lineTo(14, -50);
    ctx.lineTo(16, -35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#24150c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -3, 30, -0.15, 1.25);
    ctx.stroke();
  }

  static dragon(ctx) {
    const body = ctx.createLinearGradient(-26, -34, 27, 24);
    body.addColorStop(0, '#74311f');
    body.addColorStop(0.5, '#35100d');
    body.addColorStop(1, '#140707');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 26, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#200807';
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.quadraticCurveTo(-44, -35, -23, 13);
    ctx.quadraticCurveTo(-17, 5, -16, -10);
    ctx.moveTo(16, -10);
    ctx.quadraticCurveTo(44, -35, 23, 13);
    ctx.quadraticCurveTo(17, 5, 16, -10);
    ctx.fill();

    ctx.fillStyle = '#47130f';
    ctx.beginPath();
    ctx.arc(0, -27, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffcf55';
    ctx.fillRect(-8, -31, 5, 4);
    ctx.fillRect(4, -31, 5, 4);

    ctx.strokeStyle = '#d8482f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, -42);
    ctx.lineTo(0, -54);
    ctx.lineTo(4, -42);
    ctx.moveTo(-20, -20);
    ctx.lineTo(-32, -37);
    ctx.moveTo(20, -20);
    ctx.lineTo(32, -37);
    ctx.stroke();

    this.gem(ctx, 0, 8, '#ff4d2d');
  }

  static lich(ctx) {
    const robe = ctx.createLinearGradient(0, -46, 0, 28);
    robe.addColorStop(0, '#b9e4ff');
    robe.addColorStop(0.25, '#346a8f');
    robe.addColorStop(1, '#070b13');
    ctx.fillStyle = robe;
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.quadraticCurveTo(24, -18, 17, 25);
    ctx.quadraticCurveTo(8, 15, 0, 30);
    ctx.quadraticCurveTo(-8, 15, -17, 25);
    ctx.quadraticCurveTo(-24, -18, 0, -45);
    ctx.fill();
    ctx.strokeStyle = '#9fd8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -6, 28, 0.15, 2.9);
    ctx.stroke();
    this.head(ctx, '#c8d6d3', '#61d6ff', true);
    this.staff(ctx, -19, 1, '#342c42');
    this.gem(ctx, -19, -36, '#66ddff');
  }

  static itemPotion(ctx, item) {
    const base = item.base || 'potion';
    const color = item.color || this.potionColor(base);
    const g = ctx.createLinearGradient(-13, -22, 13, 20);
    g.addColorStop(0, '#f7ead2');
    g.addColorStop(0.18, color);
    g.addColorStop(0.72, '#2a100c');
    g.addColorStop(1, '#090504');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-8, -20);
    ctx.lineTo(8, -20);
    ctx.quadraticCurveTo(9, -12, 14, -7);
    ctx.quadraticCurveTo(18, 9, 8, 19);
    ctx.quadraticCurveTo(0, 24, -8, 19);
    ctx.quadraticCurveTo(-18, 9, -14, -7);
    ctx.quadraticCurveTo(-9, -12, -8, -20);
    ctx.fill();
    ctx.strokeStyle = '#1b120e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#654128';
    ctx.fillRect(-7, -27, 14, 8);
    ctx.fillStyle = '#2f2016';
    ctx.fillRect(-9, -22, 18, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-7, -9, 4, 15);
    this.smallRune(ctx, 0, 5, '#f4d790', this.potionLabel(base));
  }

  static itemScroll(ctx, item) {
    const base = item.base || 'scroll';
    const color = item.color || this.scrollColor(base);
    const paper = ctx.createLinearGradient(-22, -18, 22, 18);
    paper.addColorStop(0, '#8b6232');
    paper.addColorStop(0.18, '#d8bd82');
    paper.addColorStop(0.72, '#b99055');
    paper.addColorStop(1, '#5b321d');
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.roundRect(-21, -15, 42, 30, 5);
    ctx.fill();
    ctx.strokeStyle = '#432311';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#7a4a24';
    ctx.beginPath();
    ctx.ellipse(-21, 0, 4, 16, 0, 0, TAU);
    ctx.ellipse(21, 0, 4, 16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(75,40,20,0.45)';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 6) {
      ctx.beginPath();
      ctx.moveTo(-13, i);
      ctx.lineTo(13, i + 1);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0.3, 5.5);
    ctx.stroke();
    this.smallRune(ctx, 0, 0, color, this.scrollLabel(base));
  }

  static potionColor(base) {
    switch (base) {
      case 'mana_potion': return '#2f80d1';
      case 'speed_potion': return '#39a7d8';
      case 'strength_potion': return '#d16a25';
      case 'defense_potion': return '#98a7a8';
      case 'regen_potion': return '#2fa35a';
      case 'combo_potion': return '#9140a8';
      case 'purification_potion': return '#e2b84c';
      case 'mystery_potion': return '#6b2fa3';
      default: return '#c63b30';
    }
  }

  static potionLabel(base) {
    switch (base) {
      case 'mana_potion': return 'M';
      case 'speed_potion': return 'S';
      case 'strength_potion': return 'P';
      case 'defense_potion': return 'D';
      case 'regen_potion': return 'R';
      case 'combo_potion': return 'C';
      case 'purification_potion': return 'X';
      case 'mystery_potion': return '?';
      default: return 'H';
    }
  }

  static scrollColor(base) {
    switch (base) {
      case 'scroll_fire':
      case 'scroll_fire_explosion':
      case 'scroll_meteor':
      case 'scroll_rage':
      case 'scroll_chaos': return '#e25b2d';
      case 'scroll_ice':
      case 'scroll_ice_storm':
      case 'scroll_barrier': return '#63bfe8';
      case 'scroll_lightning':
      case 'scroll_invulnerability': return '#e6cc4f';
      case 'scroll_stone':
      case 'scroll_earthquake':
      case 'scroll_werewolf': return '#9a6b3f';
      case 'scroll_vampirism':
      case 'scroll_fear':
      case 'scroll_clone': return '#9b4fd0';
      case 'scroll_time':
      case 'scroll_curse':
      case 'scroll_smoke': return '#7e8a92';
      default: return '#d58a3a';
    }
  }

  static scrollLabel(base) {
    if (base.includes('fire') || base.includes('meteor')) return 'F';
    if (base.includes('ice')) return 'I';
    if (base.includes('lightning')) return 'L';
    if (base.includes('stone') || base.includes('earth')) return 'E';
    if (base.includes('clone')) return 'C';
    if (base.includes('teleport')) return 'T';
    if (base.includes('invisibility') || base.includes('smoke')) return 'S';
    if (base.includes('time')) return 'T';
    if (base.includes('curse') || base.includes('chaos') || base.includes('fear')) return '!';
    if (base.includes('barrier')) return 'B';
    if (base.includes('rage')) return 'R';
    if (base.includes('vampirism')) return 'V';
    if (base.includes('werewolf')) return 'W';
    return '?';
  }

  static itemGold(ctx) {
    ctx.fillStyle = '#7a5219';
    ctx.beginPath();
    ctx.ellipse(0, 5, 16, 19, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c68c2b';
    ctx.beginPath();
    ctx.moveTo(-9, -8);
    ctx.lineTo(0, -22);
    ctx.lineTo(9, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcf55';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', 0, 5);
  }

  static itemWeapon(ctx, item) {
    if (item.base === 'staff' || item.base === 'wand') {
      this.staff(ctx, 0, 5, '#6a3d24');
      this.gem(ctx, 0, -24, item.color || '#b25cff');
      return;
    }
    ctx.rotate(-0.65);
    this.sword(ctx, 0, 0);
  }

  static itemShield(ctx) {
    this.shield(ctx, 0, 2, '#5d3427');
  }

  static itemArmor(ctx, item) {
    this.bodyPlate(ctx, '#28231d', item.base === 'robe' ? '#6d3774' : '#8a8071', '#2a1712');
  }

  static itemAccessory(ctx, item) {
    const color = item.color || '#e2b85a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.stroke();
    this.gem(ctx, 0, 0, color);
  }

  static itemRelic(ctx, item) {
    this.gem(ctx, 0, 0, item.color || '#b58a42');
  }

  static attackFlash(ctx, heroClass, strength) {
    const color = heroClass === 'mage' ? '#ff763c' : heroClass === 'rogue' ? '#78f0a0' : '#f2dfbd';
    ctx.globalAlpha = Math.min(0.8, strength + 0.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = heroClass === 'mage' ? 4 : 5;
    ctx.beginPath();
    if (heroClass === 'mage') {
      ctx.arc(0, -8, 30, 0, TAU);
    } else {
      ctx.arc(0, -4, 32, -0.8, 0.75);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  static statusAura(ctx, x, y, color, time, radius) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y - 2, radius + Math.sin(time + i) * 3 + i * 4, time + i, time + i + Math.PI * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  static cooldownRing(ctx, x, y, radius, percent, color) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 3, radius, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, Math.min(1, percent)));
    ctx.stroke();
    ctx.restore();
  }

  static shadow(ctx, x, y, rx, ry, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  static rarityColor(rarity) {
    switch (rarity) {
      case 'legendary': return '#e74c3c';
      case 'epic': return '#e67e22';
      case 'rare': return '#3498db';
      default: return '#95a5a6';
    }
  }
}

if (typeof window !== 'undefined') {
  window.ArtAssets = ArtAssets;
  ArtAssets.loadAtlases();
  ArtAssets.loadSpriteSets();
}
