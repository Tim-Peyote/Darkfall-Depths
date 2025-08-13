/* Darkfall Depths - Управление уровнями - v2 */

import { gameState, Utils, canvas, DPR } from '../core/GameState.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { FogOfWar } from '../map/FogOfWar.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { TILE_SIZE, ENEMY_TYPES, generateRandomItem } from '../config/constants.js';

export class LevelManager {
  static async generateLevel() {
    console.log('🗺️ Generating level...');
    
    if (!gameState.selectedCharacter) {
      console.error('❌ No character selected!');
      return;
    }
    
    const { map, rooms } = MapGenerator.generateDungeon();
    
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
    gameState.fogOfWar = new FogOfWar();
    
    // Очистка сущностей
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Спавн игрока в первой комнате
    const startRoom = rooms[0];
    
    if (gameState.selectedCharacter) {
      console.log('👤 Creating player with character:', gameState.selectedCharacter);
      console.log('🗺️ Start room:', startRoom);
      console.log('🗺️ Map size:', gameState.map.length, 'x', gameState.map[0].length);
      
      // Проверяем, что комната находится в пределах карты
      if (startRoom && startRoom.centerX >= 0 && startRoom.centerX < gameState.map[0].length &&
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
        } else {
          console.error('❌ Player spawn position is in wall:', tileX, tileY, 'Tile value:', gameState.map[tileY]?.[tileX]);
          // Fallback: ищем свободное место в первой комнате
          this.findSafeSpawnPosition(startRoom, gameState.map);
        }
      } else {
        console.error('❌ Invalid start room position:', startRoom);
        // Fallback: спавним в центре карты
        const centerX = Math.floor(gameState.map[0].length / 2);
        const centerY = Math.floor(gameState.map.length / 2);
        gameState.player = new Player(
          { ...gameState.selectedCharacter },
          (centerX + 0.5) * TILE_SIZE,
          (centerY + 0.5) * TILE_SIZE
        );
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
        
        const enemy = new Enemy(
          (room.centerX + Utils.random(-1, 1) + 0.5) * TILE_SIZE, // Position closer to center
          (room.centerY + Utils.random(-1, 1) + 0.5) * TILE_SIZE,
          enemyType
        );
        
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
      try {
        const { Portal } = await import('../entities/Portal.js');
        const portal = new Portal(
          (portalRoom.centerX + 0.5) * TILE_SIZE,
          (portalRoom.centerY + 0.5) * TILE_SIZE
        );
        gameState.entities.push(portal);
        console.log('Портал успешно создан в комнате:', portalRoom);
      } catch (e) {
        console.error('Ошибка при создании портала:', e);
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
        const droppedItem = new DroppedItem(
          (room.centerX + Utils.random(-1, 1) + 0.5) * TILE_SIZE,
          (room.centerY + Utils.random(-1, 1) + 0.5) * TILE_SIZE,
          item
        );
        gameState.entities.push(droppedItem);
      }
    }
  }

  static async nextLevel() {
    console.log(`🎮 nextLevel called - current level: ${gameState.level}`);
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
    
    await this.generateLevel();
    
    console.log(`🎮 nextLevel completed - final level: ${gameState.level}`);
    
    // Принудительно обновляем UI после генерации нового уровня
    (async () => {
      const { GameEngine } = await import('../game/GameEngine.js');
      GameEngine.updateUI();
      GameEngine.updateQuickPotions();
    })();
  }

  static showLevelComplete() {
    console.log(`🎮 showLevelComplete called - level: ${gameState.level}, gameRunning: ${gameState.gameRunning}`);
    
    // Обновляем данные в экране завершения уровня
    const completedLevelEl = document.getElementById('completedLevel');
    const enemiesKilledEl = document.getElementById('enemiesKilled');
    
    if (completedLevelEl) {
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
  }
} 