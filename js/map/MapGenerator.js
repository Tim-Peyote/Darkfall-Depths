/* Darkfall Depths - Генерация карты */

import { TILE_SIZE, MAP_SIZE, ROOM_MIN_SIZE, ROOM_MAX_SIZE, MIN_ROOMS, MAX_ROOMS } from '../config/constants.js';
import { Logger } from '../utils/Logger.js';
import { Utils } from '../core/GameState.js';
import { gameState } from '../core/GameState.js';
import { LightSourceFactory } from '../entities/LightSource.js';

export class MapGenerator {
  static generateDungeon() {
    // Прогрессия сложности на основе уровня
    const level = gameState.level || 1;
    
    // Динамический размер карты - растет бесконечно с уровнем
    const dynamicMapSize = MAP_SIZE + Math.floor(level * 3.5); // +3.5 тайла за уровень (было 1.5)
    const dynamicMinRooms = MIN_ROOMS + Math.floor(level * 0.8); // +0.8 комнаты за уровень (было 0.4)
    const dynamicMaxRooms = MAX_ROOMS + Math.floor(level * 1.2); // +1.2 комнаты за уровень (было 0.6)
    
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
      const room = this.createRoomInPartition(partition, level);
      if (room) {
        // Проверяем, что комната находится в пределах карты
        if (room.x >= 0 && room.y >= 0 && 
            room.x + room.width < dynamicMapSize && 
            room.y + room.height < dynamicMapSize) {
          rooms.push(room);
          this.carveRoom(map, room);
                Logger.debug('Room', index, ':', room);
    } else {
      Logger.warn('Room', index, 'out of bounds:', room);
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
      this.carveRoom(map, fallbackRoom);
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
  
  static createRoomInPartition(partition, level) {
    const { x, y, width, height } = partition;
    
    // Увеличиваем размер комнат с уровнем (более агрессивная прогрессия)
    const roomSizeMultiplier = 1 + (level - 1) * 0.15; // 15% увеличение за уровень (было 8%)
    const dynamicMinSize = Math.floor(ROOM_MIN_SIZE * roomSizeMultiplier);
    const dynamicMaxSize = Math.floor(ROOM_MAX_SIZE * roomSizeMultiplier);
    
    // Убираем ограничение на максимальный размер комнаты
    const roomWidth = Utils.random(dynamicMinSize, Math.min(dynamicMaxSize, width - 2));
    const roomHeight = Utils.random(dynamicMinSize, Math.min(dynamicMaxSize, height - 2));
    
    const roomX = Utils.random(x + 1, x + width - roomWidth - 1);
    const roomY = Utils.random(y + 1, y + height - roomHeight - 1);
    
    return {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: roomX + Math.floor(roomWidth / 2),
      centerY: roomY + Math.floor(roomHeight / 2)
    };
  }
  
  static carveRoom(map, room) {
    const mapSize = map.length; // Используем реальный размер карты
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
    // Убираем магические сферы и кристаллы из комнат - они будут редкими находками
    
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
          lightSources.push(lightSource);
          Logger.map(`Added ${lightSource.lightType} at (${Math.floor(lightSource.x / TILE_SIZE)}, ${Math.floor(lightSource.y / TILE_SIZE)})`);
        }
      }
      
      // Очень редко добавляем декоративные источники света в больших комнатах
      if (room.width >= 15 && room.height >= 15 && Utils.random(0, 1) < 0.05) {
        const decorativeLight = this.placeDecorativeLight(map, room, mapSize, level);
        if (decorativeLight) {
          lightSources.push(decorativeLight);
          Logger.map(`Added decorative ${decorativeLight.lightType} at (${Math.floor(decorativeLight.x / TILE_SIZE)}, ${Math.floor(decorativeLight.y / TILE_SIZE)})`);
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
    
    // Верхняя стена - только углы и середина
    if (room.y - 1 >= 0 && room.y - 1 < mapSize) {
      // Левый угол
      if (room.x >= 0 && room.x < mapSize && map[room.y - 1][room.x] === 1) {
        wallPositions.push({ x: room.x, y: room.y - 1, side: 'top' });
      }
      // Середина верхней стены
      if (room.x + Math.floor(roomWidth / 2) >= 0 && room.x + Math.floor(roomWidth / 2) < mapSize && 
          map[room.y - 1][room.x + Math.floor(roomWidth / 2)] === 1) {
        wallPositions.push({ x: room.x + Math.floor(roomWidth / 2), y: room.y - 1, side: 'top' });
      }
      // Правый угол
      if (room.x + roomWidth - 1 >= 0 && room.x + roomWidth - 1 < mapSize && 
          map[room.y - 1][room.x + roomWidth - 1] === 1) {
        wallPositions.push({ x: room.x + roomWidth - 1, y: room.y - 1, side: 'top' });
      }
    }
    
    // Нижняя стена - только углы и середина
    if (room.y + roomHeight >= 0 && room.y + roomHeight < mapSize) {
      // Левый угол
      if (room.x >= 0 && room.x < mapSize && map[room.y + roomHeight][room.x] === 1) {
        wallPositions.push({ x: room.x, y: room.y + roomHeight, side: 'bottom' });
      }
      // Середина нижней стены
      if (room.x + Math.floor(roomWidth / 2) >= 0 && room.x + Math.floor(roomWidth / 2) < mapSize && 
          map[room.y + roomHeight][room.x + Math.floor(roomWidth / 2)] === 1) {
        wallPositions.push({ x: room.x + Math.floor(roomWidth / 2), y: room.y + roomHeight, side: 'bottom' });
      }
      // Правый угол
      if (room.x + roomWidth - 1 >= 0 && room.x + roomWidth - 1 < mapSize && 
          map[room.y + roomHeight][room.x + roomWidth - 1] === 1) {
        wallPositions.push({ x: room.x + roomWidth - 1, y: room.y + roomHeight, side: 'bottom' });
      }
    }
    
    // Левая стена - только углы и середина
    if (room.x - 1 >= 0 && room.x - 1 < mapSize) {
      // Верхний угол
      if (room.y >= 0 && room.y < mapSize && map[room.y][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: room.y, side: 'left' });
      }
      // Середина левой стены
      if (room.y + Math.floor(roomHeight / 2) >= 0 && room.y + Math.floor(roomHeight / 2) < mapSize && 
          map[room.y + Math.floor(roomHeight / 2)][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: room.y + Math.floor(roomHeight / 2), side: 'left' });
      }
      // Нижний угол
      if (room.y + roomHeight - 1 >= 0 && room.y + roomHeight - 1 < mapSize && 
          map[room.y + roomHeight - 1][room.x - 1] === 1) {
        wallPositions.push({ x: room.x - 1, y: room.y + roomHeight - 1, side: 'left' });
      }
    }
    
    // Правая стена - только углы и середина
    if (room.x + roomWidth >= 0 && room.x + roomWidth < mapSize) {
      // Верхний угол
      if (room.y >= 0 && room.y < mapSize && map[room.y][room.x + roomWidth] === 1) {
        wallPositions.push({ x: room.x + roomWidth, y: room.y, side: 'right' });
      }
      // Середина правой стены
      if (room.y + Math.floor(roomHeight / 2) >= 0 && room.y + Math.floor(roomHeight / 2) < mapSize && 
          map[room.y + Math.floor(roomHeight / 2)][room.x + roomWidth] === 1) {
        wallPositions.push({ x: room.x + roomWidth, y: room.y + Math.floor(roomHeight / 2), side: 'right' });
      }
      // Нижний угол
      if (room.y + roomHeight - 1 >= 0 && room.y + roomHeight - 1 < mapSize && 
          map[room.y + roomHeight - 1][room.x + roomWidth] === 1) {
        wallPositions.push({ x: room.x + roomWidth, y: room.y + roomHeight - 1, side: 'right' });
      }
    }
    
    // Выбираем случайную позицию на стене (максимум 1 факел на комнату)
    if (wallPositions.length > 0) {
      const wallPos = wallPositions[Utils.random(0, wallPositions.length - 1)];
      const lightSource = LightSourceFactory.createTorch(
        wallPos.x * TILE_SIZE + TILE_SIZE / 2, 
        wallPos.y * TILE_SIZE + TILE_SIZE / 2, 
        false
      );
      lightSource.wallSide = wallPos.side; // Сохраняем информацию о стороне стены
      return lightSource;
    }
    
    return null;
  }
  
  // Размещение чаши с огнем в центре комнаты
  static placeFireBowl(map, room, mapSize) {
    // Размещаем в центре комнаты
    const centerX = room.x + Math.floor(room.width / 2);
    const centerY = room.y + Math.floor(room.height / 2);
    
    // Проверяем, что позиция свободна
    if (centerX >= 0 && centerX < mapSize && centerY >= 0 && centerY < mapSize && map[centerY][centerX] === 0) {
      const lightSource = LightSourceFactory.createFire(
        centerX * TILE_SIZE + TILE_SIZE / 2, 
        centerY * TILE_SIZE + TILE_SIZE / 2, 
        true // Постоянный источник
      );
      lightSource.isFireBowl = true; // Отмечаем как чашу с огнем
      return lightSource;
    }
    
    return null;
  }
  
  // Размещение магической сферы в случайном месте комнаты
  static placeMagicOrb(map, room, mapSize) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 2, room.x + room.width - 3);
    const y = Utils.random(room.y + 2, room.y + room.height - 3);
    
    // Проверяем, что позиция свободна
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      return LightSourceFactory.createMagicOrb(
        x * TILE_SIZE + TILE_SIZE / 2, 
        y * TILE_SIZE + TILE_SIZE / 2, 
        true
      );
    }
    
    return null;
  }
  
  // Размещение кристалла в случайном месте комнаты
  static placeCrystal(map, room, mapSize) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 2, room.x + room.width - 3);
    const y = Utils.random(room.y + 2, room.y + room.height - 3);
    
    // Проверяем, что позиция свободна
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      return LightSourceFactory.createCrystal(
        x * TILE_SIZE + TILE_SIZE / 2, 
        y * TILE_SIZE + TILE_SIZE / 2, 
        true
      );
    }
    
    return null;
  }
  
  // Размещение декоративного источника света
  static placeDecorativeLight(map, room, mapSize, level) {
    // Выбираем случайную позицию в комнате (не у стен)
    const x = Utils.random(room.x + 3, room.x + room.width - 4);
    const y = Utils.random(room.y + 3, room.y + room.height - 4);
    
    // Проверяем, что позиция свободна
    if (x >= 0 && x < mapSize && y >= 0 && y < mapSize && map[y][x] === 0) {
      // На высоких уровнях больше шанс на магические сферы
      const rand = Utils.random(0, 1);
      if (level >= 5 && rand < 0.7) {
        // Магическая сфера на высоких уровнях
        const lightSource = LightSourceFactory.createMagicOrb(
          x * TILE_SIZE + TILE_SIZE / 2, 
          y * TILE_SIZE + TILE_SIZE / 2, 
          true
        );
        lightSource.isDecorative = true; // Отмечаем как декоративный
        return lightSource;
      } else {
        // Кристалл
        const lightSource = LightSourceFactory.createCrystal(
          x * TILE_SIZE + TILE_SIZE / 2, 
          y * TILE_SIZE + TILE_SIZE / 2, 
          true
        );
        lightSource.isDecorative = true; // Отмечаем как декоративный
        return lightSource;
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
          
          // Проверяем, что рядом нет других факелов
          let tooClose = false;
          for (const existingLight of lightSources) {
            if (existingLight.lightType === 'TORCH') {
              const distance = Math.hypot(existingLight.x - position.x * TILE_SIZE, existingLight.y - position.y * TILE_SIZE);
              if (distance < minTorchDistance * TILE_SIZE) {
                tooClose = true;
                break;
              }
            }
          }
          
          if (tooClose) continue;
          
          // Проверяем, что позиция подходит для размещения факела
          if (this.isValidTorchPosition(map, position.x, position.y, mapSize)) {
            const lightSource = LightSourceFactory.createTorch(
              position.x * TILE_SIZE + TILE_SIZE / 2,
              position.y * TILE_SIZE + TILE_SIZE / 2,
              false
            );
            lightSource.isCorridorTorch = true;
            lightSource.corridorPosition = i; // Позиция в коридоре
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
      
      if (current.x < 0 || current.x >= mapSize || current.y < 0 || current.y >= mapSize) {
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
        
        if (newX >= 0 && newX < mapSize && newY >= 0 && newY < mapSize &&
            !visited[newY][newX] && map[newY][newX] === 0) {
          queue.push({ x: newX, y: newY });
        }
      });
    }
    
    return corridor;
  }
  
  // Проверка, подходит ли позиция для размещения факела
  static isValidTorchPosition(map, x, y, mapSize) {
    // Проверяем границы
    if (x <= 0 || x >= mapSize - 1 || y <= 0 || y >= mapSize - 1) {
      return false;
    }
    
    // Проверяем, что позиция находится рядом со стеной
    const hasAdjacentWall = (
      map[y-1][x] === 1 || map[y+1][x] === 1 ||
      map[y][x-1] === 1 || map[y][x+1] === 1
    );
    
    // Проверяем, что позиция свободна
    const isFree = map[y][x] === 0;
    
    return hasAdjacentWall && isFree;
  }
} 