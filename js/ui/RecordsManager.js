/* Darkfall Depths - Управление рекордами */

import { gameState, Utils } from '../core/GameState.js';

export class RecordsManager {
  static saveRecords() {
    const data = {
      bestLevel: gameState.stats.bestLevel,
      enemiesKilled: gameState.stats.enemiesKilled,
      levelsCompleted: gameState.stats.levelsCompleted,
      totalPlayTime: gameState.stats.totalPlayTime
    };
    localStorage.setItem('darkfall_records', JSON.stringify(data));
  }

  static loadRecords() {
    const saved = localStorage.getItem('darkfall_records');
    if (saved) {
      const data = JSON.parse(saved);
      gameState.stats = { ...gameState.stats, ...data };
    }
  }

  static updateRecordsScreen() {
    const recordsData = document.getElementById('recordsData');
    if (!recordsData) return;
    
    recordsData.innerHTML = `
      <div class="record-item">
        <span>Лучший уровень:</span>
        <span class="record-value">${gameState.stats.bestLevel}</span>
      </div>
      <div class="record-item">
        <span>Пройдено уровней:</span>
        <span class="record-value">${gameState.stats.levelsCompleted}</span>
      </div>
      <div class="record-item">
        <span>Убито врагов:</span>
        <span class="record-value">${gameState.stats.enemiesKilled}</span>
      </div>
      <div class="record-item">
        <span>Время игры:</span>
        <span class="record-value">${Utils.formatTime(gameState.stats.totalPlayTime)}</span>
      </div>
    `;
  }

  static clearRecords() {
    gameState.stats = {
      enemiesKilled: 0,
      levelsCompleted: 0,
      totalPlayTime: 0,
      bestLevel: 0,
      currentSessionKills: 0
    };
    this.saveRecords();
    this.clearTopRecords();
    this.updateTopRecordsScreen();
  }

  static saveTopRecord(hero, stats) {
    const records = this.loadTopRecords();
    const newRecord = {
      name: hero.name,
      class: hero.class,
      level: stats.level,
      enemiesKilled: stats.enemiesKilled,
      playTime: stats.totalPlayTime
    };
    records.push(newRecord);
    // Сортировка: сначала по уровню, потом по убитым, потом по времени
    records.sort((a, b) => b.level - a.level || b.enemiesKilled - a.enemiesKilled || a.playTime - b.playTime);
    const top10 = records.slice(0, 10);
    localStorage.setItem('darkfall_top_records', JSON.stringify(top10));
  }

  static loadTopRecords() {
    const saved = localStorage.getItem('darkfall_top_records');
    if (saved) return JSON.parse(saved);
    return [];
  }

  static clearTopRecords() {
    localStorage.removeItem('darkfall_top_records');
  }

  static updateTopRecordsScreen() {
    const recordsData = document.getElementById('recordsData');
    if (!recordsData) return;
    
    // Топ-10 таблица
    const top = this.loadTopRecords();
    
    if (top.length === 0) {
      recordsData.innerHTML = '<div class="record-item" style="text-align: center; color: #888; padding: 20px;">Пока нет рекордов</div>';
      return;
    }
    
    let html = `
      <div class="record-item" style="font-weight: bold; background: rgba(0,0,0,0.1); padding: 8px; margin-bottom: 8px; border-radius: 4px; font-family: monospace; display: flex; align-items: center;">
        <span style="width: 40px; flex-shrink: 0;">#</span>
        <span style="width: 90px; flex-shrink: 0;">Герой</span>
        <span style="width: 70px; flex-shrink: 0;">Класс</span>
        <span style="width: 70px; flex-shrink: 0;">Уровень</span>
        <span style="width: 70px; flex-shrink: 0;">Враги</span>
        <span style="width: 90px; flex-shrink: 0; text-align: right;">Время</span>
      </div>
    `;
    
    top.forEach((rec, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      html += `
        <div class="record-item" style="padding: 6px 8px; margin-bottom: 4px; border-radius: 4px; background: rgba(0,0,0,0.05); font-family: monospace; display: flex; align-items: center;">
          <span style="width: 40px; flex-shrink: 0;">${medal}${i+1}</span>
          <span style="width: 90px; flex-shrink: 0; font-weight: bold;">${rec.name}</span>
          <span style="width: 70px; flex-shrink: 0;">${rec.class}</span>
          <span style="width: 70px; flex-shrink: 0;">${rec.level}</span>
          <span style="width: 70px; flex-shrink: 0;">${rec.enemiesKilled}</span>
          <span style="width: 90px; flex-shrink: 0; text-align: right;">${Utils.formatTime(rec.playTime)}</span>
        </div>
      `;
    });
    
    recordsData.innerHTML = html;
  }
} 