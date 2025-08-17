/* Darkfall Depths - Управление уровнями - v2 */

import { gameState, Utils, canvas, DPR } from '../core/GameState.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { WebGLFogOfWar } from '../map/WebGLFogOfWar.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { TILE_SIZE, ENEMY_TYPES, generateRandomItem } from '../config/constants.js';

export class LevelManager {
  // Утилита для проверки границ карты
  static isWithinMapBounds(x, y, map) {
    if (!map || !map.length || !map[0]) return false;
    const mapWidth = map[0].length;
    const mapHeight = map.length;
    return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
  }
  
  // СТРОГАЯ проверка безопасных границ карты (с отступом от краев)
  static isWithinSafeBounds(x, y, map) {
    if (!map || !map.length || !map[0]) return false;
    const mapWidth = map[0].length;
    const mapHeight = map.length;
    
    // Безопасный отступ от краев карты (учитываем прогрессию)
    // Начальная точка генерации карты: x: 2, y: 2
    // Поэтому безопасная зона начинается с координат (2, 2)
    const safeMargin = 2;
    
    return x >= safeMargin && x < mapWidth - safeMargin && 
           y >= safeMargin && y < mapHeight - safeMargin;
  }
  
  // Утилита для проверки валидной позиции спавна (на полу)
  static isValidSpawnPosition(x, y, map) {
    if (!this.isWithinMapBounds(x, y, map)) return false;
    return map[y][x] === 0; // 0 = пол, 1 = стена
  }
  
  // СТРОГАЯ проверка безопасной позиции спавна (на полу + безопасные границы)
  static isValidSafeSpawnPosition(x, y, map) {
    if (!this.isWithinSafeBounds(x, y, map)) return false;
    return map[y][x] === 0; // 0 = пол, 1 = стена
  }
  
  // Утилита для поиска безопасной позиции в комнате
  static findSafePositionInRoom(room, map, maxAttempts = 15) {
    // Проверяем, что комната сама находится в пределах карты
    if (!this.isWithinMapBounds(room.centerX, room.centerY, map)) {
      console.warn('Комната находится за пределами карты:', room);
      return null;
    }
    
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      // Увеличиваем разброс позиций в больших комнатах, но ограничиваем границами комнаты
      const maxOffset = Math.min(3, Math.floor(Math.min(room.width, room.height) / 3));
      const offsetX = Utils.random(-maxOffset, maxOffset);
      const offsetY = Utils.random(-maxOffset, maxOffset);
      
      // Убеждаемся, что позиция остается в пределах комнаты
      const targetX = Math.max(room.x + 1, Math.min(room.x + room.width - 2, room.centerX + offsetX));
      const targetY = Math.max(room.y + 1, Math.min(room.y + room.height - 2, room.centerY + offsetY));
      
      const worldX = (targetX + 0.5) * TILE_SIZE;
      const worldY = (targetY + 0.5) * TILE_SIZE;
      
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);
      
      // СТРОГАЯ проверка безопасных границ
      if (this.isValidSafeSpawnPosition(tileX, tileY, map)) {
        return { worldX, worldY, tileX, tileY };
      }
    }
    
    // Fallback: используем центр комнаты
    const worldX = (room.centerX + 0.5) * TILE_SIZE;
    const worldY = (room.centerY + 0.5) * TILE_SIZE;
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    
    // СТРОГАЯ проверка безопасных границ для центра комнаты
    if (this.isValidSafeSpawnPosition(tileX, tileY, map)) {
      return { worldX, worldY, tileX, tileY };
    }
    
    console.warn('Не удалось найти безопасную позицию в комнате:', room, 'Границы карты:', map.length, 'x', map[0]?.length);
    return null;
  }
  
  // Дополнительная валидация для всех спавнящихся объектов
  static validateSpawnBounds(entity, entityType = 'object') {
    if (!entity || !gameState.map) return false;
    
    const tileX = Math.floor(entity.x / TILE_SIZE);
    const tileY = Math.floor(entity.y / TILE_SIZE);
    
    // СТРОГАЯ проверка безопасных границ
    const isValid = this.isValidSafeSpawnPosition(tileX, tileY, gameState.map);
    
    if (!isValid) {
      console.warn(`🚫 ${entityType} спавн за пределами безопасных границ карты:`, {
        entity: { x: entity.x, y: entity.y },
        tile: { x: tileX, y: tileY },
        mapSize: { width: gameState.map[0]?.length, height: gameState.map.length }
      });
    }
    
    return isValid;
  }

  static async generateLevel() {
    // Очищаем предыдущий уровень
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.droppedItems = [];
    
    if (!gameState.selectedCharacter) {
      console.error('❌ No character selected!');
      return;
    }
    
    const { map, rooms, lightSources, chests } = MapGenerator.generateDungeon();
    
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
    gameState.chests = chests || [];
    
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
    
    if (gameState.selectedCharacter) {
      // Проверяем, что комната существует и находится в пределах карты
      if (startRoom && typeof startRoom === 'object' && 
          startRoom.centerX !== undefined && startRoom.centerY !== undefined &&
          startRoom.centerX >= 0 && startRoom.centerX < gameState.map[0].length &&
          startRoom.centerY >= 0 && startRoom.centerY < gameState.map.length) {
        
        const playerX = (startRoom.centerX + 0.5) * TILE_SIZE;
        const playerY = (startRoom.centerY + 0.5) * TILE_SIZE;
        
        // СТРОГАЯ проверка позиции игрока (не в стене + безопасные границы)
        const tileX = Math.floor(playerX / TILE_SIZE);
        const tileY = Math.floor(playerY / TILE_SIZE);
        
        if (this.isValidSafeSpawnPosition(tileX, tileY, gameState.map)) {
          
          // При переходе на следующий уровень НЕ создаем нового игрока, а перемещаем существующего
          if (gameState.player && gameState.isLevelTransition) {
            // Просто перемещаем игрока на новую позицию
            gameState.player.x = playerX;
            gameState.player.y = playerY;
          } else {
            // При рестарте или новом запуске создаем нового игрока
            gameState.player = new Player(
              { ...gameState.selectedCharacter },
              playerX,
              playerY
            );
          }
          
          // Сбрасываем флаги
          gameState.isRestart = false;
          gameState.isLevelTransition = false;
          
          // Центрируем камеру на игроке (сразу в правильную позицию)
          const canvasWidth = canvas ? canvas.width / DPR : 800; // fallback
          const canvasHeight = canvas ? canvas.height / DPR : 600; // fallback
          gameState.camera.x = gameState.player.x - canvasWidth / 2;
          gameState.camera.y = gameState.player.y - canvasHeight / 2;
          
          // Принудительно инициализируем туман войны для игрока
          if (gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            // Fog of war initialized for player position
          }
        } else {
          console.error('❌ Player spawn position is in wall:', tileX, tileY, 'Tile value:', gameState.map[tileY]?.[tileX]);
          // Fallback: ищем свободное место в первой комнате
          this.findSafeSpawnPosition(startRoom, gameState.map);
          
          // Инициализируем туман войны для fallback позиции
          if (gameState.player && gameState.fogOfWar) {
            gameState.fogOfWar.updateVisibility(gameState.player.x, gameState.player.y);
            // Fog of war initialized for fallback position
          }
        }
      } else {
        console.error('❌ Invalid start room position:', startRoom);
        
        // Fallback: ищем любую подходящую комнату в безопасных границах
        let fallbackRoom = null;
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          if (room && typeof room === 'object' && 
              room.centerX !== undefined && room.centerY !== undefined &&
              this.isWithinSafeBounds(room.centerX, room.centerY, gameState.map)) {
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
          // Последний fallback: спавним в безопасном центре карты
          console.error('❌ No valid rooms found, spawning in safe center');
          const centerX = Math.floor(gameState.map[0].length / 2);
          const centerY = Math.floor(gameState.map.length / 2);
          
          // Проверяем, что центр карты находится в безопасных границах
          if (this.isWithinSafeBounds(centerX, centerY, gameState.map) && 
              gameState.map[centerY][centerX] === 0) {
            gameState.player = new Player(
              { ...gameState.selectedCharacter },
              (centerX + 0.5) * TILE_SIZE,
              (centerY + 0.5) * TILE_SIZE
            );
          } else {
            // Если центр не подходит, ищем ближайшую безопасную позицию
            console.error('❌ Center not safe, searching for nearest safe position');
            let foundSafePosition = false;
            for (let radius = 1; radius <= 10; radius++) {
              for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                  const testX = centerX + dx;
                  const testY = centerY + dy;
                  if (this.isValidSafeSpawnPosition(testX, testY, gameState.map)) {
                    gameState.player = new Player(
                      { ...gameState.selectedCharacter },
                      (testX + 0.5) * TILE_SIZE,
                      (testY + 0.5) * TILE_SIZE
                    );
                    foundSafePosition = true;
                    console.log('✅ Found safe fallback position:', testX, testY);
                    break;
                  }
                }
                if (foundSafePosition) break;
              }
              if (foundSafePosition) break;
            }
            
            if (!foundSafePosition) {
              console.error('❌ CRITICAL: No safe position found anywhere on map!');
              return;
            }
          }
          
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
        
        // Система весов для разных типов врагов на разных уровнях
        let enemyWeights = [];
        
        if (gameState.level >= 15) {
          // На очень высоких уровнях - все враги доступны
          enemyWeights = availableEnemies.map(enemy => ({
            enemy: enemy,
            weight: enemy.type === 'Demon Lord' || enemy.type === 'Ancient Guardian' ? 15 : 10
          }));
        } else if (gameState.level >= 10) {
          // На высоких уровнях - больше сильных врагов
          enemyWeights = availableEnemies.map(enemy => {
            if (enemy.type === 'Demon Lord' || enemy.type === 'Ancient Guardian') {
              return { enemy: enemy, weight: 20 };
            } else if (enemy.type === 'Void Wraith' || enemy.type === 'Crystal Golem') {
              return { enemy: enemy, weight: 15 };
            } else if (enemy.type === 'Frost Mage' || enemy.type === 'Poison Spitter' || enemy.type === 'Stun Warrior') {
              return { enemy: enemy, weight: 12 };
            } else if (enemy.type === 'Skeleton Archer') {
              return { enemy: enemy, weight: 8 };
            } else {
              return { enemy: enemy, weight: 5 };
            }
          });
        } else if (gameState.level >= 6) {
          // На средних уровнях - появляются новые типы
          enemyWeights = availableEnemies.map(enemy => {
            if (enemy.type === 'Void Wraith' || enemy.type === 'Crystal Golem') {
              return { enemy: enemy, weight: 8 };
            } else if (enemy.type === 'Frost Mage' || enemy.type === 'Poison Spitter' || enemy.type === 'Stun Warrior') {
              return { enemy: enemy, weight: 12 };
            } else if (enemy.type === 'Skeleton Archer') {
              return { enemy: enemy, weight: 10 };
            } else {
              return { enemy: enemy, weight: 8 };
            }
          });
        } else if (gameState.level >= 3) {
          // На низких уровнях - базовые враги + лучники
          enemyWeights = availableEnemies.map(enemy => {
            if (enemy.type === 'Skeleton Archer') {
              return { enemy: enemy, weight: 8 };
            } else {
              return { enemy: enemy, weight: 10 };
            }
          });
        } else {
          // На самых низких уровнях - только базовые враги
          enemyWeights = availableEnemies.map(enemy => ({ enemy: enemy, weight: 10 }));
        }
        
        // Выбираем врага на основе весов
        const totalWeight = enemyWeights.reduce((sum, item) => sum + item.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        
        for (const item of enemyWeights) {
          randomWeight -= item.weight;
          if (randomWeight <= 0) {
            enemyType = item.enemy.type;
            break;
          }
        }
        
        // Fallback на случай ошибки
        if (!enemyType) {
          enemyType = availableEnemies[Utils.random(0, availableEnemies.length - 1)].type;
        }
        
        // Ищем безопасную позицию для врага (на полу, не на стене)
        const safePosition = this.findSafePositionInRoom(room, gameState.map, 15);
        
        if (!safePosition) {
          console.warn(`Не удалось найти безопасную позицию для врага в комнате ${i}, пропускаем`);
          continue;
        }
        
        const enemyX = safePosition.worldX;
        const enemyY = safePosition.worldY;
        
        const enemy = new Enemy(enemyX, enemyY, enemyType);
        
        // Валидация спавна врага
        if (!this.validateSpawnBounds(enemy, 'Enemy')) {
          console.warn(`Пропускаем спавн врага за пределами карты в комнате ${i}`);
          continue;
        }
        
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
          
          // Ищем безопасную позицию для портала
          const safePosition = this.findSafePositionInRoom(portalRoom, gameState.map, 20);
          
          if (safePosition) {
            const portal = new Portal(safePosition.worldX, safePosition.worldY);
            
            // Валидация спавна портала
            if (this.validateSpawnBounds(portal, 'Portal')) {
              gameState.entities.push(portal);
              console.log('Портал успешно создан в комнате:', portalRoom, 'на позиции:', safePosition);
            } else {
              console.warn('Портал не может быть создан - валидация границ не пройдена');
            }
          } else {
            console.warn('Портал не может быть создан - не найдена безопасная позиция в комнате:', portalRoom);
          }
        } catch (e) {
          console.error('Ошибка при создании портала:', e);
        }
      }
    } else {
      console.warn('Портал не был создан, потому что нет подходящей комнаты! rooms:', rooms);
    }
    
    // Создание сундуков
    if (gameState.chests && gameState.chests.length > 0) {
      try {
        const { Chest } = await import('../entities/Chest.js');
        
        gameState.chests.forEach((chestData, index) => {
          const chest = new Chest(chestData.x, chestData.y, chestData.level);
          
          // Валидация спавна сундука
          if (this.validateSpawnBounds(chest, 'Chest')) {
            gameState.entities.push(chest);
            console.log(`Сундук ${index + 1} создан на позиции: (${chestData.x}, ${chestData.y})`);
          } else {
            console.warn(`Сундук ${index + 1} не может быть создан - валидация границ не пройдена`);
          }
        });
      } catch (e) {
        console.error('Ошибка при создании сундуков:', e);
      }
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
        const safePosition = this.findSafePositionInRoom(room, gameState.map, 15);
        
        if (!safePosition) {
          console.warn(`Не удалось найти безопасную позицию для предмета в комнате ${i}, пропускаем`);
          continue;
        }
        
        const itemX = safePosition.worldX;
        const itemY = safePosition.worldY;
        
        const droppedItem = new DroppedItem(itemX, itemY, item);
        
        // Валидация спавна предмета
        if (!this.validateSpawnBounds(droppedItem, 'Item')) {
          console.warn(`Пропускаем спавн предмета за пределами карты в комнате ${i}`);
          continue;
        }
        
        gameState.entities.push(droppedItem);
      }
    }
    
    console.log('🗺️ Level generation completed - Player:', gameState.player ? 'exists' : 'missing', 'Entities:', gameState.entities.length);
  }

  static async nextLevel() {
    console.log(`🎮 nextLevel called - current level: ${gameState.level}`);
    
    // Устанавливаем флаг перехода на следующий уровень
    gameState.isLevelTransition = true;
    gameState.isRestart = false;
    
    // Увеличиваем уровень ДО генерации нового уровня
    gameState.level++;
    console.log(`🎮 nextLevel - level increased to: ${gameState.level}`);
    
    gameState.stats.levelsCompleted++;
    gameState.stats.bestLevel = Math.max(gameState.stats.bestLevel, gameState.level);
    
    // Сбрасываем счетчик убийств для нового уровня (но сохраняем сессионные)
    (async () => {
      const { RecordsManager } = await import('../ui/RecordsManager.js');
      RecordsManager.resetLevelKills();
    })();
    
    // В рогалике НЕ восстанавливаем здоровье автоматически - игрок должен сам лечиться
    console.log(`🎮 Level ${gameState.level} - Player HP: ${gameState.player?.hp}/${gameState.player?.maxHp} (no auto-heal)`);
    
    // Временные баффы сохраняются между уровнями - они сами истекают по времени
    
    // Перезапускаем музыку stage1 для нового уровня
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.playMusic('stage1', true);
    })();
    
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
      // Показываем общее количество убитых врагов (включая текущую сессию)
      enemiesKilledEl.textContent = gameState.stats.enemiesKilled + gameState.stats.currentSessionKills;
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
    
    // Сохраняем сессию в историю и показываем экран смерти
    const { RecordsManager } = await import('../ui/RecordsManager.js');
    RecordsManager.showDeathScreen();
    
    // Сохраняем топ-рекорд (используем данные сессии)
    if (gameState.selectedCharacter) {
      RecordsManager.saveTopRecord(gameState.selectedCharacter, {
        level: gameState.level,
        currentSessionKills: gameState.stats.currentSessionKills,
        currentSessionTime: gameState.stats.currentSessionTime
      });
    }
    
    // Обновляем общую статистику
    gameState.stats.enemiesKilled += gameState.stats.currentSessionKills;
    gameState.stats.totalPlayTime += gameState.stats.currentSessionTime;
    
    if (gameState.level > gameState.stats.bestLevel) {
      gameState.stats.bestLevel = gameState.level;
    }
    
    // Сохраняем рекорды
    RecordsManager.saveRecords();
  }

  static endGame() {
    gameState.gameRunning = false;
    gameState.player = null;
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.map = null;
    gameState.fogOfWar = null;
    
    // Очищаем все баффы и дебафы при завершении игры
    (async () => {
      const { BuffManager } = await import('../core/BuffManager.js');
      BuffManager.clearAllBuffs();
      BuffManager.clearAllDebuffs();
    })();
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

    
    // Ищем свободное место в комнате с СТРОГИМИ проверками границ
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (LevelManager.isValidSafeSpawnPosition(x, y, map)) {
          const playerX = (x + 0.5) * TILE_SIZE;
          const playerY = (y + 0.5) * TILE_SIZE;
          
          console.log('✅ Found safe spawn position:', playerX, playerY);
          
          gameState.player = new Player(
            { ...gameState.selectedCharacter },
            playerX,
            playerY
          );
          
          // Новый персонаж уже создан с дефолтными значениями, только сбрасываем флаги состояния
          if (gameState.player) {
            gameState.player.isDead = false;
            gameState.player.isInvulnerable = false;
            gameState.player.invulnerabilityTime = 0;
            gameState.player.isStunned = false;
            gameState.player.isShieldActive = false;
            gameState.player.shieldTime = 0;
            gameState.player.attackCooldown = 0;
            gameState.player.dashCooldown = 0;
            gameState.player.shieldCooldown = 0;
            gameState.player.blastCooldown = 0;
            gameState.player.attackAnimation = 0;
          }
          
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
    
    // Если не нашли безопасное место, проверяем центр комнаты
    console.warn('⚠️ No safe position found, checking room center');
    if (LevelManager.isValidSafeSpawnPosition(room.centerX, room.centerY, map)) {
      const playerX = (room.centerX + 0.5) * TILE_SIZE;
      const playerY = (room.centerY + 0.5) * TILE_SIZE;
      
      gameState.player = new Player(
        { ...gameState.selectedCharacter },
        playerX,
        playerY
      );
      
      // Новый персонаж уже создан с дефолтными значениями, только сбрасываем флаги состояния
      if (gameState.player) {
        gameState.player.isDead = false;
        gameState.player.isInvulnerable = false;
        gameState.player.invulnerabilityTime = 0;
        gameState.player.isStunned = false;
        gameState.player.isShieldActive = false;
        gameState.player.shieldTime = 0;
        gameState.player.attackCooldown = 0;
        gameState.player.dashCooldown = 0;
        gameState.player.shieldCooldown = 0;
        gameState.player.blastCooldown = 0;
        gameState.player.attackAnimation = 0;
      }
    } else {
      console.error('❌ Room center is not safe either!');
      return;
    }
    
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