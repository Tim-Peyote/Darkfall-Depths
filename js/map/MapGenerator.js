/* Darkfall Depths - Генерация карты */

import { TILE_SIZE, MAP_SIZE, ROOM_MIN_SIZE, ROOM_MAX_SIZE, MIN_ROOMS, MAX_ROOMS } from '../config/constants.js';
import { Logger } from '../utils/Logger.js';
import { Utils } from '../core/GameState.js';
import { gameState } from '../core/GameState.js';

export class MapGenerator {
  static generateDungeon() {
    // Прогрессия сложности на основе уровня
    const level = gameState.level || 1;
    
    // Динамический размер карты - растет бесконечно с уровнем
    const dynamicMapSize = MAP_SIZE + Math.floor(level * 1.5); // +1.5 тайла за уровень
    const dynamicMinRooms = MIN_ROOMS + Math.floor(level * 0.4); // +0.4 комнаты за уровень
    const dynamicMaxRooms = MAX_ROOMS + Math.floor(level * 0.6); // +0.6 комнаты за уровень
    
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
    
    return { map, rooms };
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
    const roomSizeMultiplier = 1 + (level - 1) * 0.08; // 8% увеличение за уровень
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
} 