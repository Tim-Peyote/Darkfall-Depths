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
    
    // Logger.debug('Generating dungeon - Level:', level, 'Map size:', dynamicMapSize, 'Rooms:', dynamicMinRooms, '-', dynamicMaxRooms);
    
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
    
    // Logger.debug('Created', partitions.length, 'partitions');
    
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
    
    // Logger.debug('Generated', rooms.length, 'rooms');
    
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
    
    // Проверяем связность лабиринта
    const isConnected = this.checkLabyrinthConnectivity(map, rooms);
    if (!isConnected) {
      Logger.warn('Labyrinth is not fully connected, adding additional corridors');
      this.ensureConnectivity(map, rooms);
    }
    
    // Генерируем источники света
    const lightSources = this.generateLightSources(map, rooms, level);
    
    // Генерируем сундуки
    const chests = this.generateChests(map, rooms, level);
    
    return { map, rooms, lightSources, chests };
  }
  
  static splitPartition(partition) {
    const { x, y, width, height } = partition;
    
    // Минимальный размер для разделения - должен поместиться две комнаты + коридор
    const minSplitSize = ROOM_MIN_SIZE * 2 + 3;
    
    if (width < minSplitSize && height < minSplitSize) {
      return null;
    }
    
    // Улучшенная логика разделения - учитываем пропорции раздела
    let horizontal = false;
    
    // Если одна сторона значительно больше другой, выбираем её для разделения
    if (width > height * 1.5) {
      horizontal = false; // Вертикальное разделение
    } else if (height > width * 1.5) {
      horizontal = true; // Горизонтальное разделение
    } else {
      // Если стороны примерно равны, выбираем случайно
      horizontal = Utils.random(0, 1) === 0;
    }
    
    if (horizontal && height >= minSplitSize) {
      // Горизонтальное разделение
      const minSplit = y + ROOM_MIN_SIZE + 1;
      const maxSplit = y + height - ROOM_MIN_SIZE - 2;
      if (minSplit < maxSplit) {
        const split = Utils.random(minSplit, maxSplit);
      return {
        left: { x, y, width, height: split - y },
        right: { x, y: split + 1, width, height: y + height - split - 1 }
      };
      }
    } else if (!horizontal && width >= minSplitSize) {
      // Вертикальное разделение
      const minSplit = x + ROOM_MIN_SIZE + 1;
      const maxSplit = x + width - ROOM_MIN_SIZE - 2;
      if (minSplit < maxSplit) {
        const split = Utils.random(minSplit, maxSplit);
      return {
        left: { x, y, width: split - x, height },
        right: { x: split + 1, y, width: x + width - split - 1, height }
      };
      }
    }
    
    return null;
  }
  
  static createRoomInPartition(partition, level, mapSize) {
    const { x, y, width, height } = partition;
    
    // Размер комнат НЕ растет с уровнем - лабиринт усложняется количеством комнат, а не их размером
    const dynamicMinSize = ROOM_MIN_SIZE;
    const dynamicMaxSize = ROOM_MAX_SIZE;
    
    // Ограничиваем размер комнаты границами раздела
    const maxRoomWidth = Math.min(dynamicMaxSize, width - 2);
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
    if (rooms.length <= 1) return;
    
    // Создаем минимальное остовное дерево для гарантии связности
    // Используем алгоритм Прима для соединения всех комнат
    const connected = new Set([0]); // Начинаем с первой комнаты
    const unconnected = new Set();
    for (let i = 1; i < rooms.length; i++) {
      unconnected.add(i);
    }
    
    // Соединяем все комнаты
    while (unconnected.size > 0) {
      let minDistance = Infinity;
      let bestConnected = -1;
      let bestUnconnected = -1;
      
      // Находим ближайшую пару комнат
      for (const connectedRoom of connected) {
        for (const unconnectedRoom of unconnected) {
          const distance = this.getRoomDistance(rooms[connectedRoom], rooms[unconnectedRoom]);
          if (distance < minDistance) {
            minDistance = distance;
            bestConnected = connectedRoom;
            bestUnconnected = unconnectedRoom;
          }
        }
      }
      
      // Соединяем найденную пару
      if (bestConnected !== -1 && bestUnconnected !== -1) {
        this.createCorridor(map, rooms[bestConnected], rooms[bestUnconnected]);
        connected.add(bestUnconnected);
        unconnected.delete(bestUnconnected);
      } else {
        break; // Защита от бесконечного цикла
      }
    }
    
    // Добавляем несколько дополнительных соединений для создания альтернативных путей
    // Это делает лабиринт более интересным, но не нарушает связность
    const extraConnections = Math.min(rooms.length / 3, 5); // Не более 5 дополнительных соединений
    for (let i = 0; i < extraConnections; i++) {
      const room1 = Utils.random(0, rooms.length - 1);
      const room2 = Utils.random(0, rooms.length - 1);
      if (room1 !== room2) {
        this.createCorridor(map, rooms[room1], rooms[room2]);
      }
    }
  }
  
  // Вспомогательная функция для вычисления расстояния между комнатами
  static getRoomDistance(room1, room2) {
    const dx = room1.centerX - room2.centerX;
    const dy = room1.centerY - room2.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Проверка связности лабиринта с помощью BFS
  static checkLabyrinthConnectivity(map, rooms) {
    if (rooms.length <= 1) return true;
    
    // Начинаем с первой комнаты
    const visited = new Set();
    const queue = [0]; // Индекс первой комнаты
    visited.add(0);
    
    while (queue.length > 0) {
      const currentRoomIndex = queue.shift();
      const currentRoom = rooms[currentRoomIndex];
      
      // Проверяем все остальные комнаты
      for (let i = 0; i < rooms.length; i++) {
        if (visited.has(i)) continue;
        
        const otherRoom = rooms[i];
        // Проверяем, есть ли путь между комнатами
        if (this.hasPathBetweenRooms(map, currentRoom, otherRoom)) {
          visited.add(i);
          queue.push(i);
        }
      }
    }
    
    // Если посетили все комнаты, лабиринт связен
    return visited.size === rooms.length;
  }
  
  // Проверка наличия пути между двумя комнатами
  static hasPathBetweenRooms(map, room1, room2) {
    // Простая проверка: если есть прямой коридор между центрами комнат
    const path = this.findPath(map, room1.centerX, room1.centerY, room2.centerX, room2.centerY);
    return path !== null;
  }
  
  // Поиск пути между двумя точками с помощью BFS
  static findPath(map, startX, startY, endX, endY) {
    const visited = new Set();
    const queue = [{ x: startX, y: startY, path: [] }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      if (current.x === endX && current.y === endY) {
        return current.path;
      }
      
      // Проверяем соседние тайлы
      const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ];
      
      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;
        
        if (newX >= 0 && newX < map[0].length && 
            newY >= 0 && newY < map.length && 
            map[newY][newX] === 0) { // 0 = пол/коридор
          queue.push({
            x: newX,
            y: newY,
            path: [...current.path, { x: newX, y: newY }]
          });
        }
      }
    }
    
    return null; // Путь не найден
  }
  
  // Обеспечение связности лабиринта
  static ensureConnectivity(map, rooms) {
    if (rooms.length <= 1) return;
    
    // Находим изолированные компоненты
    const components = this.findConnectedComponents(map, rooms);
    
    if (components.length > 1) {
      // Соединяем компоненты
      for (let i = 1; i < components.length; i++) {
        const room1 = components[0][0]; // Комната из первого компонента
        const room2 = components[i][0]; // Комната из i-го компонента
        this.createCorridor(map, room1, room2);
      }
    }
  }
  
  // Поиск связных компонентов
  static findConnectedComponents(map, rooms) {
    const visited = new Set();
    const components = [];
    
    for (let i = 0; i < rooms.length; i++) {
      if (visited.has(i)) continue;
      
      // Начинаем новый компонент
      const component = [];
      const queue = [i];
      visited.add(i);
      
      while (queue.length > 0) {
        const currentIndex = queue.shift();
        const currentRoom = rooms[currentIndex];
        component.push(currentRoom);
        
        // Проверяем все остальные комнаты
        for (let j = 0; j < rooms.length; j++) {
          if (visited.has(j)) continue;
          
          const otherRoom = rooms[j];
          if (this.hasPathBetweenRooms(map, currentRoom, otherRoom)) {
            visited.add(j);
            queue.push(j);
          }
        }
      }
      
      components.push(component);
    }
    
    return components;
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
    
    // Logger.debug('Generating light sources for level', level);
    
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
            // Logger.debug(`Added ${lightSource.lightType} at (${tileX}, ${tileY})`);
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
            // Logger.debug(`Added decorative ${decorativeLight.lightType} at (${tileX}, ${tileY})`);
          } else {
            Logger.warn(`Decorative light source out of bounds at (${tileX}, ${tileY}), map size: ${mapSize}`);
          }
        }
      }
    });
    
    // Умная система размещения факелов в коридорах
    this.placeCorridorTorches(map, rooms, mapSize, lightSources);
    
    // Logger.debug(`Generated ${lightSources.length} light sources`);
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
            // Logger.debug(`Added corridor torch at (${position.x}, ${position.y}) - position ${i}/${torchCount}`);
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
  
  // Генерация сундуков в комнатах
  static generateChests(map, rooms, level) {
    const chests = [];
    
    // Балансированная система: количество сундуков пропорционально размеру карты
    // Цель: примерно 1 сундук на каждые 5-7 комнат
    const targetChestsPerRoom = 0.15; // 15% шанс сундука в комнате (стабильно)
    const minChests = Math.max(1, Math.floor(rooms.length * 0.1)); // Минимум 10% от комнат
    const maxChests = Math.floor(rooms.length * 0.25); // Максимум 25% от комнат
    
    // Logger.debug(`Generating chests - Level: ${level}, Rooms: ${rooms.length}, Target: ${(targetChestsPerRoom * 100).toFixed(1)}%`);
    
    // Сначала определяем количество сундуков для этого уровня
    const targetChestCount = Math.floor(rooms.length * targetChestsPerRoom);
    const actualChestCount = Math.max(minChests, Math.min(maxChests, targetChestCount));
    
    // Выбираем случайные комнаты для сундуков (исключая первую)
    const availableRooms = rooms.slice(1); // Исключаем первую комнату (спавн игрока)
    const selectedRooms = this.selectRandomRooms(availableRooms, actualChestCount);
    
    selectedRooms.forEach((room, index) => {
      // Ищем подходящую позицию в комнате
      const chestPosition = this.findChestPosition(room, map);
      
      if (chestPosition) {
        const chest = {
          x: chestPosition.x * TILE_SIZE + TILE_SIZE / 2,
          y: chestPosition.y * TILE_SIZE + TILE_SIZE / 2,
          level: level
        };
        
        chests.push(chest);
        // Logger.debug(`Added chest ${index + 1}/${actualChestCount} in room at (${chestPosition.x}, ${chestPosition.y})`);
      }
    });
    
    // Logger.debug(`Generated ${chests.length} chests out of ${actualChestCount} target`);
    return chests;
  }
  
  // Выбор случайных комнат для сундуков
  static selectRandomRooms(rooms, count) {
    const shuffled = [...rooms].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, rooms.length));
  }
  
  // Поиск подходящей позиции для сундука в комнате
  static findChestPosition(room, map) {
    const attempts = 50; // Максимум попыток поиска позиции
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      // Случайная позиция в комнате с отступом от стен
      const x = Utils.random(room.x + 2, room.x + room.width - 3);
      const y = Utils.random(room.y + 2, room.y + room.height - 3);
      
      // Проверяем, что позиция свободна
      if (map[y][x] === 0) {
        // Проверяем, что рядом есть стена (для реалистичности)
        const hasAdjacentWall = (
          map[y-1][x] === 1 || map[y+1][x] === 1 ||
          map[y][x-1] === 1 || map[y][x+1] === 1
        );
        
        if (hasAdjacentWall) {
          return { x, y };
        }
      }
    }
    
    // Если не нашли подходящую позицию, возвращаем центр комнаты
    const centerX = Math.floor(room.x + room.width / 2);
    const centerY = Math.floor(room.y + room.height / 2);
    
    if (map[centerY][centerX] === 0) {
      return { x: centerX, y: centerY };
    }
    
    return null;
  }
  
} 