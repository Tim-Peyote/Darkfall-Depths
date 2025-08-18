/* Darkfall Depths - Мониторинг производительности */

import { Logger } from '../utils/Logger.js';

export class PerformanceMonitor {
  static fps = 0;
  static frameCount = 0;
  static lastTime = 0;
  static frameTimes = [];
  static maxFrameTimes = 60; // Храним последние 60 кадров
  static lastFrameTime = 0; // Для точного расчета времени кадра
  
  // Настройки производительности
  static lowPerformanceMode = false;
  static particleLimit = 100;
  static effectQuality = 'high';
  
  static init() {
    // Logger.debug('PerformanceMonitor initialized');
  }
  
  static update(currentTime) {
    // Рассчитываем реальное время кадра
    if (this.lastFrameTime > 0) {
      const realFrameTime = currentTime - this.lastFrameTime;
      this.frameTimes.push(realFrameTime);
      if (this.frameTimes.length > this.maxFrameTimes) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTime = currentTime;
    
    this.frameCount++;
    
    // Вычисляем FPS каждую секунду
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Анализируем производительность
      this.analyzePerformance();
    }
  }
  
  static analyzePerformance() {
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    
    // Включаем режим низкой производительности при FPS < 30 (вернули нормальный порог)
    if (this.fps < 30 && !this.lowPerformanceMode) {
      this.enableLowPerformanceMode();
      // Logger.debug(`⚠️ Низкий FPS обнаружен (${this.fps}), включаем режим оптимизации`);
    }
    
    // Отключаем режим низкой производительности при FPS > 50 (вернули нормальный порог)
    if (this.fps > 50 && this.lowPerformanceMode) {
      this.disableLowPerformanceMode();
      // Logger.debug(`✅ Хороший FPS обнаружен (${this.fps}), отключаем режим оптимизации`);
    }
    
    // Логируем критически низкий FPS
    if (this.fps < 20) {
      Logger.error(`Critical FPS: ${this.fps}, avg frame time: ${avgFrameTime.toFixed(2)}ms`);
    }
  }
  
  static enableLowPerformanceMode() {
    this.lowPerformanceMode = true;
    this.particleLimit = 15; // Еще больше ограничиваем частицы (было 30)
    this.effectQuality = 'low';
          // Logger.debug('⚠️ Режим низкой производительности включен - частицы ограничены до', this.particleLimit);
  }
  
  static disableLowPerformanceMode() {
    this.lowPerformanceMode = false;
    this.particleLimit = 60; // Уменьшили с 100 до 60 для стабильности
    this.effectQuality = 'high';
          // Logger.debug('✅ Режим низкой производительности отключен - частицы до', this.particleLimit);
  }
  
  static shouldCreateParticle() {
    // Проверяем лимит частиц в режиме низкой производительности
    if (this.lowPerformanceMode) {
      // Получаем количество активных частиц
      const activeParticles = window.gameState?.particles?.filter(p => !p.isDead)?.length || 0;
      return activeParticles < this.particleLimit;
    }
    return true;
  }
  
  static getEffectQuality() {
    return this.effectQuality;
  }
  
  static getFPS() {
    return this.fps;
  }
  
  static getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }
  
  static isLowPerformanceMode() {
    return this.lowPerformanceMode;
  }
  
  // Метод для отладки производительности
  static logPerformanceStats() {
    // Logger.debug(`FPS: ${this.fps}, Avg Frame Time: ${this.getAverageFrameTime().toFixed(2)}ms, Low Performance Mode: ${this.lowPerformanceMode}`);
  }
}
