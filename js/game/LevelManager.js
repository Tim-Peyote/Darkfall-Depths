/* Darkfall Depths - Управление уровнями - v2 */

import { gameState, Utils, canvas, DPR } from '../core/GameState.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { WebGLFogOfWar } from '../map/WebGLFogOfWar.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { TILE_SIZE, ENEMY_TYPES, generateRandomItem } from '../config/constants.js';

export class LevelManager {
  static async generateLevel() {
    console.log('🗺️ generateLevel called - starting level generation...');
    
    if (!gameState.selectedCharacter) {
      console.error('❌ No character selected!');
      return;
    }
    
    const { map, rooms, lightSources } = MapGenerator.generateDungeon();
    
    if (!rooms || rooms.length === 0) {
      console.error('❌ No rooms generated!');
      return;
    }
    
    if (!map || map.length === 0) {
      console.error('❌ Map not generated!');
      return;
    }
    
    gameState.map = map;
    gameState.rooms = rooms;
    gameState.lightSources = lightSources || [];
    
    // Используем WebGL туман войны
    const { GameEngine } = await import('./GameEngine.js');
    // console.log('🔍 Проверяем WebGL рендерер:', GameEngine.webglRenderer);
    // console.log('🔍 WebGL поддерживается:', GameEngine.webglRenderer?.isSupported());
    
    if (GameEngine.webglRenderer && GameEngine.webglRenderer.isSupported()) {
      gameState.fogOfWar = new WebGLFogOfWar(GameEngine.webglRenderer);
      // console.log('✅ WebGL туман войны инициализирован');
    } else {
      gameState.fogOfWar = new WebGLFogOfWar(null); // Fallback без WebGL
      // console.log('⚠️ Используем Canvas 2D fallback туман войны');
    }
    
    // Очистка сущностей
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Спавн игрока в первой комнате
    const startRoom = rooms[0];
    
    console.log('🗺️ Rooms array:', rooms);
    console.log('🗺️ Start room:', startRoom);
    console.log('🗺️ Map size:', gameState.map.length, 'x', gameState.map[0].length);
    
    if (gameState.selectedCharacter) {
      console.log('👤 Creating player with character:', gameState.selectedCharacter);
      
      // Проверяем, что комната существует и находится в пределах карты
      if (startRoom && typeof startRoom === 'object' && 
          startRoom.centerX !== undefined && startRoom.centerY !== undefined &&
          startRoom.centerX >= 0 && startRoom.centerX < gameState.map[0].length &&
          startRoom.centerY >= 0 && startRoom.centerY < gameState.map.length) {
        
        const playerX = (startRoom.centerX + 0.5) * TILE_SIZE;
        const playerY = (startRoom.centerY + 0.5) * TILE_SIZE;
        
        // Проверяем, что позиция игрока не в стене
        const tileX = Math.floor(playerX / TILE_SIZE);
        const tileY = Math.floor(playerY / TILE_SIZE);
        
        if (tileX >= 0 && tileX < gameState.map[0].length && 
            tileY >= 0 && tileY < gameState.map.length &&
            gameState.map[tileY][tileX] === 0) { // 0 = пол, 1 = стена
          
          console.log('👤 Player spawn position:', playerX, playerY);
          
          // Сохраняем состояние игрока если он уже существует
          let savedPlayer = null;
          if (gameState.player) {
            savedPlayer = {
              hp: gameState.player.hp,
              maxHp: gameState.player.maxHp,
              damage: gameState.player.damage,
              moveSpeed: gameState.player.moveSpeed,
              attackSpeed: gameState.player.attackSpeed,
              attackRadius: gameState.player.attackRadius,
              crit: gameState.player.crit,
              defense: gameState.player.defense,
              hasDash: gameState.player.hasDash,
              hasShield: gameState.player.hasShield,
              hasBlast: gameState.player.hasBlast
            };
            console.log('👤 Saved player stats:', savedPlayer);
          }
          
          gameState.player = new Player(
            { ...gameState.selectedCharacter },
            playerX,
            playerY
          );
          
          // Восстанавливаем состояние игрока если он был сохранен
          if (savedPlayer) {
            gameState.player.hp = savedPlayer.hp;
            gameState.player.maxHp = savedPlayer.maxHp;
            gameState.player.damage = savedPlayer.damage;
            gameState.player.moveSpeed = savedPlayer.moveSpeed;
            gameState.player.attackSpeed = savedPlayer.attackSpeed;
            gameState.player.attackRadius = savedPlayer.attackRadius;
            gameState.player.crit = savedPlayer.crit;
            gameState.player.defense = savedPlayer.defense;
            gameState.player.hasDash = savedPlayer.hasDash;
            gameState.player.hasShield = savedPlayer.hasShield;
            gameState.player.hasBlast = savedPlayer.hasBlast;
            console.log('👤 Restored player stats:', {
              hp: gameState.player.hp,
              maxHp: gameState.player.maxHp,
              damage: gameState.player.damage
            });
          }
          
          // Центрируем камеру на игроке (сразу в правильную позицию)
          const canvasWidth = canvas ? canvas.width / DPR : 800; // fallback
          const canvasHeight = canvas ? canvas.height / DPR : 600; // fallback
          gameState.camera.x = gameState.player.x - canvasWidth / 2;
          gameState.camera.y = gameState.player.y - canvasHeight / 2;
          
          console.log('📷 Camera position:', gameState.camera.x, gameState.camera.y);
          
          // Принудительно инициализируем туман войны для игрока
          if (gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            console.log('🌫️ Fog of war initialized for player position');
          }
        } else {
          console.error('❌ Player spawn position is in wall:', tileX, tileY, 'Tile value:', gameState.map[tileY]?.[tileX]);
          // Fallback: ищем свободное место в первой комнате
          this.findSafeSpawnPosition(startRoom, gameState.map);
          
          // Инициализируем туман войны для fallback позиции
          if (gameState.player && gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            console.log('🌫️ Fog of war initialized for fallback position');
          }
        }
      } else {
        console.error('❌ Invalid start room position:', startRoom);
        
        // Fallback: ищем любую подходящую комнату
        let fallbackRoom = null;
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          if (room && typeof room === 'object' && 
              room.centerX !== undefined && room.centerY !== undefined &&
              room.centerX >= 0 && room.centerX < gameState.map[0].length &&
              room.centerY >= 0 && room.centerY < gameState.map.length) {
            fallbackRoom = room;
            console.log('🔄 Using fallback room:', i, room);
            break;
          }
        }
        
        if (fallbackRoom) {
          // Используем найденную комнату
          const playerX = (fallbackRoom.centerX + 0.5) * TILE_SIZE;
          const playerY = (fallbackRoom.centerY + 0.5) * TILE_SIZE;
          
          gameState.player = new Player(
            { ...gameState.selectedCharacter },
            playerX,
            playerY
          );
          
          // Центрируем камеру
          const canvasWidth = canvas ? canvas.width / DPR : 800;
          const canvasHeight = canvas ? canvas.height / DPR : 600;
          gameState.camera.x = gameState.player.x - canvasWidth / 2;
          gameState.camera.y = gameState.player.y - canvasHeight / 2;
          
          // Инициализируем туман войны
          if (gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            console.log('🌫️ Fog of war initialized for fallback room');
          }
        } else {
          // Последний fallback: спавним в центре карты
          console.error('❌ No valid rooms found, spawning in center');
          const centerX = Math.floor(gameState.map[0].length / 2);
          const centerY = Math.floor(gameState.map.length / 2);
          gameState.player = new Player(
            { ...gameState.selectedCharacter },
            (centerX + 0.5) * TILE_SIZE,
            (centerY + 0.5) * TILE_SIZE
          );
          
          // Инициализируем туман войны для центра карты
          if (gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            console.log('🌫️ Fog of war initialized for center position');
          }
        }
      }
    }
    
    // Спавн врагов в остальных комнатах (с учётом уровня сложности)
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const baseEnemyCount = Utils.random(1, 2); // Базовое количество врагов
      const levelBonus = Math.floor(gameState.level / 3); // Более агрессивная прогрессия
      const enemyCount = baseEnemyCount + levelBonus;
      
      for (let j = 0; j < enemyCount; j++) {
        // Выбираем тип врага с прогрессией сложности
        let enemyType;
        let availableEnemies = ENEMY_TYPES.filter(enemy => !enemy.levelRequirement || gameState.level >= enemy.levelRequirement);
        
        if (gameState.level >= 10) {
          // На высоких уровнях больше шанс на сильных врагов
          const strongEnemyChance = Math.min(0.3 + (gameState.level - 10) * 0.05, 0.7);
          if (Math.random() < strongEnemyChance) {
            // Выбираем из сильных врагов (последние 3 типа)
            const strongEnemies = availableEnemies.slice(-3);
            enemyType = strongEnemies[Utils.random(0, strongEnemies.length - 1)].type;
          } else {
            enemyType = availableEnemies[Utils.random(0, availableEnemies.length - 1)].type;
          }
        } else {
          enemyType = availableEnemies[Utils.random(0, availableEnemies.length - 1)].type;
        }
        
        // Ищем безопасную позицию для врага (на полу, не на стене)
        let enemyX, enemyY;
        let tileX, tileY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          enemyX = (room.centerX + Utils.random(-1, 1) + 0.5) * TILE_SIZE;
          enemyY = (room.centerY + Utils.random(-1, 1) + 0.5) * TILE_SIZE;
          
          // Проверяем, что позиция находится на полу (тайл 0)
          tileX = Math.floor(enemyX / TILE_SIZE);
          tileY = Math.floor(enemyY / TILE_SIZE);
          
          attempts++;
        } while (
          attempts < maxAttempts && 
          (tileX < 0 || tileX >= gameState.map[0].length || 
           tileY < 0 || tileY >= gameState.map.length || 
           gameState.map[tileY][tileX] !== 0) // 0 = пол, 1 = стена
        );
        
        // Если не нашли безопасную позицию, используем центр комнаты
        if (attempts >= maxAttempts) {
          enemyX = (room.centerX + 0.5) * TILE_SIZE;
          enemyY = (room.centerY + 0.5) * TILE_SIZE;
        }
        
        const enemy = new Enemy(enemyX, enemyY, enemyType);
        
        // Усиление врагов с уровнем (более сбалансированная прогрессия)
        if (gameState.level > 1) {
          // Базовый множитель сложности
          const baseMultiplier = 1 + (gameState.level - 1) * 0.12;
          
          // Дополнительный множитель для высоких уровней
          const highLevelBonus = gameState.level >= 10 ? (gameState.level - 10) * 0.05 : 0;
          const totalMultiplier = baseMultiplier + highLevelBonus;
          
          enemy.hp = Math.floor(enemy.hp * totalMultiplier);
          enemy.maxHp = enemy.hp;
          enemy.damage = Math.floor(enemy.damage * totalMultiplier);
          
          // На высоких уровнях враги становятся быстрее
          if (gameState.level >= 5) {
            const speedBonus = Math.min(0.3, (gameState.level - 5) * 0.02);
            enemy.speed = Math.floor(enemy.speed * (1 + speedBonus));
          }
          
          console.log(`👹 Enemy level ${gameState.level} - HP: ${enemy.hp}, Damage: ${enemy.damage}, Speed: ${enemy.speed}`);
        }
        
        gameState.entities.push(enemy);
      }
    }
    
    // Спавн портала в самой дальней от стартовой комнате
    let portalRoom = null;
    if (!rooms || rooms.length <= 1) {
      portalRoom = null;
      console.warn('Недостаточно комнат для спавна портала! rooms:', rooms);
    } else {
      const startRoom = rooms[0];
      let maxDist = -1;
      for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const dx = room.centerX - startRoom.centerX;
        const dy = room.centerY - startRoom.centerY;
        const dist = dx * dx + dy * dy;
        if (dist > maxDist) {
          maxDist = dist;
          portalRoom = room;
        }
      }
    }
    if (portalRoom) {
      // Проверяем, нет ли уже портала в игре
      const existingPortal = gameState.entities.find(entity => entity.constructor.name === 'Portal');
      if (existingPortal) {
        console.log('Портал уже существует, пропускаем создание нового');
      } else {
        try {
          const { Portal } = await import('../entities/Portal.js');
          
          // Проверяем, что позиция портала находится в пределах карты
          const portalX = (portalRoom.centerX + 0.5) * TILE_SIZE;
          const portalY = (portalRoom.centerY + 0.5) * TILE_SIZE;
          const tileX = Math.floor(portalX / TILE_SIZE);
          const tileY = Math.floor(portalY / TILE_SIZE);
          
          if (tileX >= 0 && tileX < gameState.map[0].length && 
              tileY >= 0 && tileY < gameState.map.length && 
              gameState.map[tileY][tileX] === 0) {
            
            const portal = new Portal(portalX, portalY);
            gameState.entities.push(portal);
            console.log('Портал успешно создан в комнате:', portalRoom);
          } else {
            console.warn('Портал не может быть создан - позиция вне карты или на стене');
          }
        } catch (e) {
          console.error('Ошибка при создании портала:', e);
        }
      }
    } else {
      console.warn('Портал не был создан, потому что нет подходящей комнаты! rooms:', rooms);
    }
    
    // Спавн предметов (улучшенная система прогрессии)
    const baseItemChance = 0.3;
    const levelBonus = Math.min(0.4, gameState.level * 0.03);
    const itemChance = baseItemChance + levelBonus;
    
    console.log(`📦 Level ${gameState.level} - Item spawn chance: ${(itemChance * 100).toFixed(1)}%`);
    
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      if (Math.random() < itemChance) {
        // Создаем предмет с улучшенной прогрессией качества
        const minItemLevel = Math.max(1, gameState.level - 1);
        const maxItemLevel = gameState.level + 1; // Предметы могут быть на уровень выше
        const itemLevel = Utils.random(minItemLevel, maxItemLevel);
        
        const item = generateRandomItem(itemLevel, gameState.selectedCharacter?.class || null);
        const { DroppedItem } = await import('../entities/DroppedItem.js');
        
        // Ищем безопасную позицию для предмета (на полу, не на стене)
        let itemX, itemY;
        let tileX, tileY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          itemX = (room.centerX + Utils.random(-1, 1) + 0.5) * TILE_SIZE;
          itemY = (room.centerY + Utils.random(-1, 1) + 0.5) * TILE_SIZE;
          
          // Проверяем, что позиция находится на полу (тайл 0)
          tileX = Math.floor(itemX / TILE_SIZE);
          tileY = Math.floor(itemY / TILE_SIZE);
          
          attempts++;
        } while (
          attempts < maxAttempts && 
          (tileX < 0 || tileX >= gameState.map[0].length || 
           tileY < 0 || tileY >= gameState.map.length || 
           gameState.map[tileY][tileX] !== 0) // 0 = пол, 1 = стена
        );
        
        // Если не нашли безопасную позицию, используем центр комнаты
        if (attempts >= maxAttempts) {
          itemX = (room.centerX + 0.5) * TILE_SIZE;
          itemY = (room.centerY + 0.5) * TILE_SIZE;
        }
        
        const droppedItem = new DroppedItem(itemX, itemY, item);
        gameState.entities.push(droppedItem);
      }
    }
    
    console.log('🗺️ Level generation completed - Player:', gameState.player ? 'exists' : 'missing', 'Entities:', gameState.entities.length);
  }

  static async nextLevel() {
    console.log(`🎮 nextLevel called - current level: ${gameState.level}`);
    
    // Увеличиваем уровень ДО генерации нового уровня
    gameState.level++;
    console.log(`🎮 nextLevel - level increased to: ${gameState.level}`);
    
    gameState.stats.levelsCompleted++;
    gameState.stats.bestLevel = Math.max(gameState.stats.bestLevel, gameState.level);
    
    // Добавляем убитых врагов в текущей сессии к общему счетчику
    gameState.stats.enemiesKilled += gameState.stats.currentSessionKills;
    
    // Сбрасываем счетчик убийств для нового уровня
    gameState.stats.currentSessionKills = 0;
    
    // В рогалике НЕ восстанавливаем здоровье автоматически - игрок должен сам лечиться
    console.log(`🎮 Level ${gameState.level} - Player HP: ${gameState.player?.hp}/${gameState.player?.maxHp} (no auto-heal)`);
    
    // Временные баффы сохраняются между уровнями - они сами истекают по времени
    
    // Музыка stage1 продолжает играть при переходе на следующий уровень
    // (не прерываем и не перезапускаем)
    
    // Останавливаем текущий игровой цикл перед генерацией нового уровня
    if (gameState.gameRunning) {
      gameState.gameRunning = false;
    }
    
    await this.generateLevel();
    
    console.log(`🎮 nextLevel completed - final level: ${gameState.level}`);
    
    // Принудительно обновляем UI после генерации нового уровня
    (async () => {
      const { GameEngine } = await import('../game/GameEngine.js');
      const { SettingsManager } = await import('../ui/SettingsManager.js');
      
      // Убеждаемся, что игрок существует и правильно позиционирован
      if (gameState.player) {
        // Центрируем камеру на игроке
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
          const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
          const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
          gameState.camera.x = gameState.player.x - canvasWidth / 2;
          gameState.camera.y = gameState.player.y - canvasHeight / 2;
        }
        
        // Принудительно обновляем туман войны
        if (gameState.fogOfWar) {
          gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
        }
      }
      
      // Обновляем UI
      GameEngine.updateUI();
      GameEngine.updateQuickPotions();
      SettingsManager.reinitEventListeners();
      
      // Перезапускаем игровой цикл
      gameState.gameRunning = true;
      gameState.isPaused = false;
      
      // Принудительно запускаем игровой цикл
      if (GameEngine.gameLoopId) {
        cancelAnimationFrame(GameEngine.gameLoopId);
      }
      GameEngine.gameLoopId = requestAnimationFrame(GameEngine.gameLoop.bind(GameEngine));
    })();
  }

  static showLevelComplete() {
    console.log(`🎮 showLevelComplete called - level: ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
    
    // Обновляем данные в экране завершения уровня
    const completedLevelEl = document.getElementById('completedLevel');
    const enemiesKilledEl = document.getElementById('enemiesKilled');
    
    if (completedLevelEl) {
      // Показываем текущий уровень (который только что завершили)
      completedLevelEl.textContent = gameState.level;
    }
    
    if (enemiesKilledEl) {
      enemiesKilledEl.textContent = gameState.stats.currentSessionKills;
    }
    
    // Воспроизводим звук завершения уровня (асинхронно)
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playLevelComplete();
    })();
    
    // Показываем экран завершения уровня
    const overlay = document.getElementById('levelCompleteOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    
    // Переинициализируем обработчики событий
    (async () => {
      const { SettingsManager } = await import('../ui/SettingsManager.js');
      SettingsManager.reinitEventListeners();
    })();
    
    console.log(`🎮 showLevelComplete completed - gameRunning: ${gameState.gameRunning}`);
  }

  static async showGameOver() {
    gameState.gameRunning = false;
    
    // Воспроизводим звук геймовера
    const { audioManager } = await import('../audio/AudioManager.js');
    audioManager.playGameOver();
    
    // Сохраняем рекорды
    const { RecordsManager } = await import('../ui/RecordsManager.js');
    RecordsManager.saveRecords();
    
    // Сохраняем топ-рекорд
    if (gameState.selectedCharacter) {
      RecordsManager.saveTopRecord(gameState.selectedCharacter, {
        level: gameState.level,
        enemiesKilled: gameState.stats.currentSessionKills,
        totalPlayTime: gameState.gameTime
      });
    }
    
    // Обновляем данные в экране окончания игры
    const finalLevelEl = document.getElementById('finalLevel');
    const finalKillsEl = document.getElementById('finalKills');
    const finalTimeEl = document.getElementById('finalTime');
    
    if (finalLevelEl) {
      finalLevelEl.textContent = gameState.level;
    }
    
    if (finalKillsEl) {
      finalKillsEl.textContent = gameState.stats.currentSessionKills;
    }
    
    if (finalTimeEl) {
      finalTimeEl.textContent = Utils.formatTime(gameState.gameTime);
    }
    
    // Показываем экран окончания игры
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    
    // Переинициализируем обработчики событий
    (async () => {
      const { SettingsManager } = await import('../ui/SettingsManager.js');
      SettingsManager.reinitEventListeners();
    })();
  }

  static endGame() {
    gameState.gameRunning = false;
    gameState.player = null;
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.map = null;
    gameState.fogOfWar = null;
  }

  static restartGame() {
    this.endGame();
    // startGame(); // Будет реализовано позже
  }

  static returnToMenu() {
    this.endGame();
    // Переключаемся на главное меню (музыка Main будет запущена в switchScreen)
    // switchScreen('menu'); // Будет реализовано позже
  }

  static findSafeSpawnPosition(room, map) {
    console.log('🔍 Looking for safe spawn position in room:', room);
    
    // Ищем свободное место в комнате
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (x >= 0 && x < map[0].length && y >= 0 && y < map.length && map[y][x] === 0) {
          const playerX = (x + 0.5) * TILE_SIZE;
          const playerY = (y + 0.5) * TILE_SIZE;
          
          console.log('✅ Found safe spawn position:', playerX, playerY);
          
          gameState.player = new Player(
            { ...gameState.selectedCharacter },
            playerX,
            playerY
          );
          
          // Центрируем камеру на игроке
          const canvasWidth = canvas ? canvas.width / DPR : 800;
          const canvasHeight = canvas ? canvas.height / DPR : 600;
          gameState.camera.x = gameState.player.x - canvasWidth / 2;
          gameState.camera.y = gameState.player.y - canvasHeight / 2;
          
          // Инициализируем туман войны
          if (gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            console.log('🌫️ Fog of war initialized for safe spawn position');
          }
          
          return;
        }
      }
    }
    
    // Если не нашли безопасное место, используем центр комнаты
    console.warn('⚠️ No safe position found, using room center');
    const playerX = (room.centerX + 0.5) * TILE_SIZE;
    const playerY = (room.centerY + 0.5) * TILE_SIZE;
    
    gameState.player = new Player(
      { ...gameState.selectedCharacter },
      playerX,
      playerY
    );
    
    // Центрируем камеру на игроке
    const canvasWidth = canvas ? canvas.width / DPR : 800;
    const canvasHeight = canvas ? canvas.height / DPR : 600;
    gameState.camera.x = gameState.player.x - canvasWidth / 2;
    gameState.camera.y = gameState.player.y - canvasHeight / 2;
    
    // Инициализируем туман войны
    if (gameState.fogOfWar) {
      gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
      console.log('🌫️ Fog of war initialized for room center position');
    }
  }
} 