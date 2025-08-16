/* Darkfall Depths - Генерация карты */

import { TILE_SIZE, MAP_SIZE, ROOM_MIN_SIZE, ROOM_MAX_SIZE, MIN_ROOMS, MAX_ROOMS } from '../config/constants.js';
import { Logger } from '../utils/Logger.js';
import { Utils } from '../core/GameState.js';
import { gameState } from '../core/GameState.js';
import { LightSourceFactory } from '../entities/LightSource.js';

export class MapGenerator {
  // Утилита для проверки границ карты
  static isWithinMapBounds(x, y, mapSize) {
    return x >= 0 && x < mapSize && y >= 0 && y < mapSize;
  }
  

  
  // Утилита для проверки валидной позиции для факела
  static isValidTorchPosition(x, y, mapSize, map) {
    // Проверяем границы с безопасным отступом
    if (x <= 1 || x >= mapSize - 2 || y <= 1 || y >= mapSize - 2) {
      return false;
    }
    
    // Проверяем, что позиция находится рядом со стеной
    const hasAdjacentWall = (
      map[y-1][x] === 1 || map[y+1][x] === 1 ||
      map[y][x-1] === 1 || map[y][x+1] === 1
    );
    
    // Позиция должна быть на полу и рядом со стеной
    return map[y][x] === 0 && hasAdjacentWall;
  }

  static generateDungeon() {
    // Прогрессия сложности на основе уровня
    const level = gameState.level || 1;
    
    // Динамический размер карты - растет бесконечно с уровнем
    const dynamicMapSize = MAP_SIZE + Math.floor(level * 1.5); // Возвращаю оригинальное значение
    const dynamicMinRooms = MIN_ROOMS + Math.floor(level * 0.4); // Возвращаю оригинальное значение
    const dynamicMaxRooms = MAX_ROOMS + Math.floor(level * 0.6); // Возвращаю оригинальное значение
    
    Logger.map('Generating dungeon - Level:', level, 'Map size:', dynamicMapSize, 'Rooms:', dynamicMinRooms, '-', dynamicMaxRooms);
    
    const map = Array.from({ length: dynamicMapSize }, () => Array(dynamicMapSize).fill(1)); // 1 = стена
    const rooms = [];
    
    // BSP разделение с прогрессией (уменьшаем отступы)
    const partitions = [{ x: 2, y: 2, width: dynamicMapSize - 4, height: dynamicMapSize - 4 }];
    
    // Рекурсивное разделение с увеличением количества комнат
    while (partitions.length < Utils.random(dynamicMinRooms, dynamicMaxRooms)) {
      const partition = partitions.splice(Utils.random(0, partitions.length - 1), 1)[0];
      if (!partition) break;
      
      const split = this.splitPartition(partition);
      if (split) {
        partitions.push(split.left, split.right);
      } else {
        partitions.push(partition);
      }
    }
    
    Logger.map('Created', partitions.length, 'partitions');
    
    // Создаем комнаты в каждом разделе
    partitions.forEach((partition, index) => {
      const room = this.createRoomInPartition(partition, level, dynamicMapSize);
      if (room) {
        // Проверяем, что комната находится в пределах карты
        if (room.x >= 0 && room.y >= 0 && 
            room.x + room.width < dynamicMapSize && 
            room.y + room.height < dynamicMapSize) {
          rooms.push(room);
          this.carveRoom(map, room, dynamicMapSize);
          Logger.debug('Room', index, ':', room);
        } else {
          Logger.warn('Room out of bounds, skipping:', room, 'Map size:', dynamicMapSize);
        }
      }
    });
    
    Logger.map('Generated', rooms.length, 'rooms');
    
    // Проверяем, что у нас есть хотя бы одна комната
    if (rooms.length === 0) {
      Logger.error('No rooms generated! Creating fallback room');
      const fallbackRoom = {
        x: 5, y: 5, width: 8, height: 8,
        centerX: 9, centerY: 9
      };
      rooms.push(fallbackRoom);
      this.carveRoom(map, fallbackRoom, dynamicMapSize);
    }
    
    // Соединяем комнаты коридорами
    this.connectRooms(map, rooms);
    
    // Генерируем источники света
    const lightSources = this.generateLightSources(map, rooms, level);
    
    return { map, rooms, lightSources };
  }
  
  static splitPartition(partition) {
    const { x, y, width, height } = partition;
    
    if (width < ROOM_MIN_SIZE * 2 + 3 && height < ROOM_MIN_SIZE * 2 + 3) {
      return null;
    }
    
    const horizontal = Utils.random(0, 1) === 0;
    
    if (horizontal && height >= ROOM_MIN_SIZE * 2 + 3) {
      const split = Utils.random(y + ROOM_MIN_SIZE + 1, y + height - ROOM_MIN_SIZE - 2);
      return {
        left: { x, y, width, height: split - y },
        right: { x, y: split + 1, width, height: y + height - split - 1 }
      };
    } else if (!horizontal && width >= ROOM_MIN_SIZE * 2 + 3) {
      const split = Utils.random(x + ROOM_MIN_SIZE + 1, x + width - ROOM_MIN_SIZE - 2);
      return {
        left: { x, y, width: split - x, height },
        right: { x: split + 1, y, width: x + width - split - 1, height }
      };
    }
    
    return null;
  }
  
  static createRoomInPartition(partition, level, mapSize) {
    const { x, y, width, height } = partition;
    
    // Увеличиваем размер комнат с уровнем (более агрессивная прогрессия)
    const roomSizeMultiplier = 1 + (level - 1) * 0.08; // Возвращаю оригинальное значение 8%
    const dynamicMinSize = Math.floor(ROOM_MIN_SIZE * roomSizeMultiplier);
    const dynamicMaxSize = Math.floor(ROOM_MAX_SIZE * roomSizeMultiplier);
    
    // Убираем ограничение на максимальный размер комнаты, но учитываем границы раздела
    const maxRoomWidth = Math.min(dynamicMaxSize, width - 2); // Уменьшил отступ с 4 до 2
    const maxRoomHeight = Math.min(dynamicMaxSize, height - 2);
    
    // Проверяем, что минимальный размер не превышает доступное пространство
    if (maxRoomWidth < dynamicMinSize || maxRoomHeight < dynamicMinSize) {
      Logger.warn('Partition too small for room:', partition, 'Min size:', dynamicMinSize);
      return null;
    }
    
    const roomWidth = Utils.random(dynamicMinSize, maxRoomWidth);
    const roomHeight = Utils.random(dynamicMinSize, maxRoomHeight);
    
    // Убеждаемся, что комната помещается в раздел с отступами
    const maxX = x + width - roomWidth - 1; // Уменьшил отступ с 2 до 1
    const maxY = y + height - roomHeight - 1;
    
    if (maxX < x + 1 || maxY < y + 1) { // Уменьшил отступ с 2 до 1
      Logger.warn('Cannot place room in partition:', partition, 'Room size:', roomWidth, 'x', roomHeight);
      return null;
    }
    
    const roomX = Utils.random(x + 1, maxX); // Уменьшил отступ с 2 до 1
    const roomY = Utils.random(y + 1, maxY);
    
    // Финальная проверка границ карты
    if (roomX < 0 || roomY < 0 || 
        roomX + roomWidth >= mapSize || 
        roomY + roomHeight >= mapSize) {
      Logger.warn('Room would be out of map bounds:', {
        room: { x: roomX, y: roomY, width: roomWidth, height: roomHeight },
        mapSize: mapSize
      });
      return null;
    }
    
    return {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: roomX + Math.floor(roomWidth / 2),
      centerY: roomY + Math.floor(roomHeight / 2)
    };
  }
  
  static carveRoom(map, room, mapSize) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (x >= 0 && x < mapSize && y >= 0 && y < mapSize) {
          map[y][x] = 0; // 0 = пол
        }
      }
    }
  }
  
  static connectRooms(map, rooms) {
    for (let i = 1; i < rooms.length; i++) {
      this.createCorridor(map, rooms[i - 1], rooms[i]);
    }
  }
  
  static createCorridor(map, room1, room2) {
    let x1 = room1.centerX;
    let y1 = room1.centerY;
    const x2 = room2.centerX;
    const y2 = room2.centerY;
    const mapSize = map.length; // Используем реальный размер карты
    
    // L-образный коридор
    while (x1 !== x2) {
      if (x1 >= 0 && x1 < mapSize && y1 >= 0 && y1 < mapSize) {
        map[y1][x1] = 0;
      }
      x1 += x1 < x2 ? 1 : -1;
    }
    
    while (y1 !== y2) {
      if (x1 >= 0 && x1 < mapSize && y1 >= 0 && y1 < mapSize) {
        map[y1][x1] = 0;
      }
      y1 += y1 < y2 ? 1 : -1;
    }
  }
  
  static generateLightSources(map, rooms, level) {
    const lightSources = [];
    const mapSize = map.length;
    
    // Настройки генерации источников света
    const lightSourceChance = 0.2 + (level * 0.02); // Меньше источников света
    const wallTorchChance = 0.4; // 40% факелов на стенах
    const fireBowlChance = 0.3; // 30% чаш с огнем в центре
    // Декоративные источники света (сферы, кристаллы) генерируются в больших комнатах
    
    Logger.map('Generating light sources for level', level);
    
    // Размещаем источники света в комнатах
    rooms.forEach((room, roomIndex) => {
      // Каждая комната имеет шанс получить источник света
      if (Utils.random(0, 1) < lightSourceChance) {
        const rand = Utils.random(0, 1);
        let lightSource;
        
        if (rand < wallTorchChance) {
          // Факел на стене - размещаем на стенах комнаты
          lightSource = this.placeWallTorch(map, room, mapSize);
        } else {
          // Чаша с огнем в центре комнаты
          lightSource = this.placeFireBowl(map, room, mapSize);
        }
        
        if (lightSource) {
          // Валидация позиции источника света
          const tileX = Math.floor(lightSource.x / TILE_SIZE);
          const tileY = Math.floor(lightSource.y / TILE_SIZE);
          
          if (this.isWithinMapBounds(tileX, tileY, mapSize)) {
            lightSources.push(lightSource);
            Logger.map(`Added ${lightSource.lightType} at (${tileX}, ${tileY})`);
          } else {
            Logger.warn(`Light source out of bounds at (${tileX}, ${tileY}), map size: ${mapSize}`);
          }
        }
      }
      
      // Добавляем декоративные источники света в больших комнатах
      if (room.width >= 12 && room.height >= 12 && Utils.random(0, 1) < 0.15) {
        const decorativeLight = this.placeDecorativeLight(map, room, mapSize, level);
        if (decorativeLight) {
          // Валидация позиции декоративного источника света
          const tileX = Math.floor(decorativeLight.x / TILE_SIZE);
          const tileY = Math.floor(decorativeLight.y / TILE_SIZE);
          
          if (this.isWithinMapBounds(tileX, tileY, mapSize)) {
            lightSources.push(decorativeLight);
            Logger.map(`Added decorative ${decorativeLight.lightType} at (${tileX}, ${tileY})`);
          } else {
            Logger.warn(`Decorative light source out of bounds at (${tileX}, ${tileY}), map size: ${mapSize}`);
          }
        }
      }
    });
    
    // Умная система размещения факелов в коридорах
    this.placeCorridorTorches(map, rooms, mapSize, lightSources);
    
    Logger.map(`Generated ${lightSources.length} light sources`);
    return lightSources;
  }
  
  // Размещение факела на стене
  static placeWallTorch(map, room, mapSize) {
    const wallPositions = [];
    
    // Собираем позиции стен вокруг комнаты (только углы и середины стен)
    const roomWidth = room.width;
    const roomHeight = room.height;
    
    // Верхняя стена - только углы и середина (с проверкой границ)
    if (room.y > 0 && this.isWithinMapBounds(room.x, room.y - 1, mapSize)) {
      // Левый угол
      if (room.x >= 0 && room.x < mapSize && map[room.y - 1][room.x] === 1) {
        wallPositions.push({ x: room.x, y: room.y - 1, side: 'top' });
      }
      // Середина верхней стены
      const midX = room.x + Math.floor(roomWidth / 2);
      if (midX >= 0 && midX < mapSize && map[room.y - 1][midX] === 1) {
        wallPositions.push({ x: midX, y: room.y - 1, side: 'top' });
      }
      // Правый угол
      const rightX = room.x + roomWidth - 1;
      if (rightX >= 0 && rightX < mapSize && map[room.y - 1][rightX] === 1) {
        wallPositions.push({ x: rightX, y: room.y - 1, side: 'top' });
      }
    }
    
    // Нижняя стена - только углы и середина
    const bottomY = room.y + roomHeight;
    if (bottomY < mapSize && this.isWithinMapBounds(room.x, bottomY, mapSize)) {
      // Левый угол
      if (room.x >= 0 && room.x < mapSize && map[bottomY][room.x] === 1) {
        wallPositions.push({ x: room.x, y: bottomY, side: 'bottom' });
      }
      // Середина нижней стены
      const midX = room.x + Math.floor(roomWidth / 2);
      if (midX >= 0 && midX < mapSize && map[bottomY][midX] === 1) {
        wallPositions.push({ x: midX, y: bottomY, side: 'bottom' });
      }
      // Правый угол
      const rightX = room.x + roomWidth - 1;
      if (rightX >= 0 && rightX < mapSize && map[bottomY][rightX] === 1) {
        wallPositions.push({ x: rightX, y: bottomY, side: 'bottom' });
      }
    }
    
    // Левая стена - только углы и середина
    if (room.x > 0 && this.isWithinMapBounds(room.x - 1, room.y, mapSize)) {
      // Верхний угол
      if (room.y >= 0 && room.y < mapSize && map[room.y][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: room.y, side: 'left' });
      }
      // Середина левой стены
      const midY = room.y + Math.floor(roomHeight / 2);
      if (midY >= 0 && midY < mapSize && map[midY][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: midY, side: 'left' });
      }
      // Нижний угол
      const bottomY = room.y + roomHeight - 1;
      if (bottomY >= 0 && bottomY < mapSize && map[bottomY][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: bottomY, side: 'left' });
      }
    }
    
    // Правая стена - только углы и середина
    const rightX = room.x + roomWidth;
    if (rightX < mapSize && this.isWithinMapBounds(rightX, room.y, mapSize)) {
      // Верхний угол
      if (room.y >= 0 && room.y < mapSize && map[room.y][rightX] === 1) {
        wallPositions.push({ x: rightX, y: room.y, side: 'right' });
      }
      // Середина правой стены
      const midY = room.y + Math.floor(roomHeight / 2);
      if (midY >= 0 && midY < mapSize && map[midY][rightX] === 1) {
        wallPositions.push({ x: rightX, y: midY, side: 'right' });
      }
      // Нижний угол
      const bottomY = room.y + roomHeight - 1;
      if (bottomY >= 0 && bottomY < mapSize && map[bottomY][rightX] === 1) {
        wallPositions.push({ x: rightX, y: bottomY, side: 'right' });
      }
    }
    
    if (wallPositions.length === 0) {
      return null;
    }
    
    const selectedWall = wallPositions[Utils.random(0, wallPositions.length - 1)];
    const worldX = (selectedWall.x + 0.5) * TILE_SIZE;
    const worldY = (selectedWall.y + 0.5) * TILE_SIZE;
    
    return LightSourceFactory.createTorch(worldX, worldY, false);
  }
  
  // Размещение чаши с огнем в центре комнаты
  static placeFireBowl(map, room, mapSize) {
    // Размещаем в центре комнаты
    const centerX = room.x + Math.floor(room.width / 2);
    const centerY = room.y + Math.floor(room.height / 2);
    
    // Проверяем, что позиция свободна и в пределах карты
    if (centerX >= 0 && centerX < mapSize && centerY >= 0 && centerY < mapSize && map[centerY][centerX] === 0) {
      const worldX = (centerX + 0.5) * TILE_SIZE;
      const worldY = (centerY + 0.5) * TILE_SIZE;
      
      return LightSourceFactory.createFire(worldX, worldY, true);
    }
    
    return null;
  }
  
  // Размещение магической сферы в случайном месте комнаты
  static placeMagicOrb(map, room, mapSize) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 2, room.x + room.width - 3);
    const y = Utils.random(room.y + 2, room.y + room.height - 3);
    
    // Проверяем, что позиция свободна и в пределах карты
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      const worldX = (x + 0.5) * TILE_SIZE;
      const worldY = (y + 0.5) * TILE_SIZE;
      
      return LightSourceFactory.createMagicOrb(worldX, worldY, true);
    }
    
    return null;
  }
  
  // Размещение кристалла в случайном месте комнаты
  static placeCrystal(map, room, mapSize) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 2, room.x + room.width - 3);
    const y = Utils.random(room.y + 2, room.y + room.height - 3);
    
    // Проверяем, что позиция свободна и в пределах карты
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      const worldX = (x + 0.5) * TILE_SIZE;
      const worldY = (y + 0.5) * TILE_SIZE;
      
      return LightSourceFactory.createCrystal(worldX, worldY, true);
    }
    
    return null;
  }
  
  // Размещение декоративного источника света
  static placeDecorativeLight(map, room, mapSize, level) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 3, room.x + room.width - 4);
    const y = Utils.random(room.y + 3, room.y + room.height - 4);
    
    // Проверяем, что позиция свободна и в пределах карты
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      const worldX = (x + 0.5) * TILE_SIZE;
      const worldY = (y + 0.5) * TILE_SIZE;
      
      // Выбираем тип декоративного света на основе уровня
      const lightTypes = ['magic_orb', 'crystal', 'fire_bowl'];
      const lightType = lightTypes[Utils.random(0, lightTypes.length - 1)];
      
      if (lightType === 'magic_orb') {
        return LightSourceFactory.createMagicOrb(worldX, worldY, true);
      } else if (lightType === 'crystal') {
        return LightSourceFactory.createCrystal(worldX, worldY, true);
      } else {
        return LightSourceFactory.createFire(worldX, worldY, true);
      }
    }
    
    return null;
  }
  
  // Умная система размещения факелов в коридорах
  static placeCorridorTorches(map, rooms, mapSize, lightSources) {
    const torchDistance = 15; // Увеличиваем расстояние между факелами
    const minCorridorLength = 12; // Увеличиваем минимальную длину коридора
    const minTorchDistance = 12; // Минимальное расстояние между факелами
    
    // Находим все коридоры
    const corridors = this.findCorridors(map, rooms, mapSize);
    
    corridors.forEach(corridor => {
      if (corridor.length >= minCorridorLength) {
        // Размещаем факелы через равные промежутки
        const torchCount = Math.floor(corridor.length / torchDistance);
        
        for (let i = 1; i < torchCount; i++) {
          const position = corridor[Math.floor(i * corridor.length / torchCount)];
          
          // Проверяем границы карты
          if (!this.isWithinMapBounds(position.x, position.y, mapSize)) {
            continue;
          }
          
          // Проверяем, что рядом нет других факелов
          let tooClose = false;
          for (const existingLight of lightSources) {
            if (existingLight.type === 'torch') { // Исправляю проверку типа
              const distance = Math.hypot(existingLight.x - position.x * TILE_SIZE, existingLight.y - position.y * TILE_SIZE);
              if (distance < minTorchDistance * TILE_SIZE) {
                tooClose = true;
                break;
              }
            }
          }
          
          if (tooClose) continue;
          
          // Проверяем, что позиция подходит для размещения факела
          if (this.isValidTorchPosition(position.x, position.y, mapSize, map)) {
            const worldX = (position.x + 0.5) * TILE_SIZE;
            const worldY = (position.y + 0.5) * TILE_SIZE;
            
            const lightSource = LightSourceFactory.createTorch(worldX, worldY, false);
            lightSource.isCorridorTorch = true;
            lightSource.corridorPosition = i;
            
            lightSources.push(lightSource);
            Logger.map(`Added corridor torch at (${position.x}, ${position.y}) - position ${i}/${torchCount}`);
          }
        }
      }
    });
  }
  
  // Поиск коридоров на карте
  static findCorridors(map, rooms, mapSize) {
    const corridors = [];
    const visited = Array.from({ length: mapSize }, () => Array(mapSize).fill(false));
    
    for (let y = 1; y < mapSize - 1; y++) {
      for (let x = 1; x < mapSize - 1; x++) {
        if (map[y][x] === 0 && !visited[y][x]) {
          // Проверяем, что это не комната
          const isInRoom = rooms.some(room => 
            x >= room.x && x < room.x + room.width && 
            y >= room.y && y < room.y + room.height
          );
          
          if (!isInRoom) {
            // Находим коридор
            const corridor = this.findCorridorSegment(map, x, y, visited, mapSize);
            if (corridor.length > 0) {
              corridors.push(corridor);
            }
          }
        }
      }
    }
    
    return corridors;
  }
  
  // Поиск сегмента коридора
  static findCorridorSegment(map, startX, startY, visited, mapSize) {
    const corridor = [];
    const queue = [{ x: startX, y: startY }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Проверяем границы карты
      if (!this.isWithinMapBounds(current.x, current.y, mapSize)) {
        continue;
      }
      
      if (visited[current.y][current.x] || map[current.y][current.x] !== 0) {
        continue;
      }
      
      visited[current.y][current.x] = true;
      corridor.push(current);
      
      // Добавляем соседние тайлы
      const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ];
      
      directions.forEach(dir => {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;
        
        if (this.isWithinMapBounds(newX, newY, mapSize) &&
            !visited[newY][newX] && map[newY][newX] === 0) {
          queue.push({ x: newX, y: newY });
        }
      });
    }
    
    return corridor;
  }
  
} 