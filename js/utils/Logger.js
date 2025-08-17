/* Darkfall Depths - Система логирования */

// Глобальная настройка логирования
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Текущий уровень логирования (ERROR для продакшена)
let currentLogLevel = LOG_LEVEL.ERROR;

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
  
  // Специальные методы для игровых событий (только для критических ошибок в продакшене)
  static game(...args) {
    if (currentLogLevel >= LOG_LEVEL.ERROR) {
      console.error('🎮', ...args);
    }
  }
  
  static audio(...args) {
    if (currentLogLevel >= LOG_LEVEL.WARN) {
      console.warn('🎵', ...args);
    }
  }
  
  static map(...args) {
    if (currentLogLevel >= LOG_LEVEL.ERROR) {
      console.error('🗺️', ...args);
    }
  }
  
  static ui(...args) {
    if (currentLogLevel >= LOG_LEVEL.ERROR) {
      console.error('🖥️', ...args);
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
  
  // Метод для включения только критических логов (продакшен)
  static enableProduction() {
    currentLogLevel = LOG_LEVEL.ERROR;
  }
}
