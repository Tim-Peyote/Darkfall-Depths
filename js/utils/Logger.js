/* Darkfall Depths - Система логирования */

// Глобальная настройка логирования
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Текущий уровень логирования (можно изменить на 0 для продакшена)
let currentLogLevel = LOG_LEVEL.INFO;

export class Logger {
  static setLogLevel(level) {
    currentLogLevel = level;
  }
  
  static error(...args) {
    if (currentLogLevel >= LOG_LEVEL.ERROR) {
      console.error('❌', ...args);
    }
  }
  
  static warn(...args) {
    if (currentLogLevel >= LOG_LEVEL.WARN) {
      console.warn('⚠️', ...args);
    }
  }
  
  static info(...args) {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.log('ℹ️', ...args);
    }
  }
  
  static debug(...args) {
    if (currentLogLevel >= LOG_LEVEL.DEBUG) {
      console.log('🔍', ...args);
    }
  }
  
  // Специальные методы для игровых событий
  static game(...args) {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.log('🎮', ...args);
    }
  }
  
  static audio(...args) {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.log('🎵', ...args);
    }
  }
  
  static map(...args) {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.log('🗺️', ...args);
    }
  }
  
  static ui(...args) {
    if (currentLogLevel >= LOG_LEVEL.INFO) {
      console.log('🖥️', ...args);
    }
  }
  
  // Метод для отключения всех логов (продакшен)
  static disable() {
    currentLogLevel = -1;
  }
  
  // Метод для включения всех логов (разработка)
  static enableAll() {
    currentLogLevel = LOG_LEVEL.DEBUG;
  }
}
