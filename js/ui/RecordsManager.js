/* Darkfall Depths - Управление рекордами */

import { gameState, Utils } from '../core/GameState.js';

export class RecordsManager {
  // Инициализация новой сессии
  static startNewSession() {
    gameState.stats.currentSessionKills = 0;
    gameState.stats.currentSessionTime = 0;
    gameState.stats.currentSessionStartTime = Date.now();
    gameState.stats.levelKills = 0;
  }

  // Обновление времени сессии
  static updateSessionTime() {
    if (gameState.stats.currentSessionStartTime > 0) {
      gameState.stats.currentSessionTime = (Date.now() - gameState.stats.currentSessionStartTime) / 1000;
    }
  }

  // Добавление убийства в сессию
  static addSessionKill() {
    gameState.stats.currentSessionKills++;
    gameState.stats.levelKills++;
    gameState.stats.enemiesKilled++;
  }

  // Сброс счетчика уровня (при переходе на новый уровень)
  static resetLevelKills() {
    gameState.stats.levelKills = 0;
  }

  // Сохранение сессии в историю (при смерти)
  static saveSessionToHistory() {
    const session = {
      date: new Date().toISOString(),
      hero: gameState.selectedCharacter?.name || 'Unknown',
      class: gameState.selectedCharacter?.class || 'Unknown',
      level: gameState.level,
      kills: gameState.stats.currentSessionKills,
      time: gameState.stats.currentSessionTime,
      levelKills: gameState.stats.levelKills
    };
    
    gameState.stats.sessionHistory.push(session);
    
    // Ограничиваем историю 50 записями
    if (gameState.stats.sessionHistory.length > 50) {
      gameState.stats.sessionHistory = gameState.stats.sessionHistory.slice(-50);
    }
    
    this.saveRecords();
  }

  static saveRecords() {
    const data = {
      bestLevel: gameState.stats.bestLevel,
      enemiesKilled: gameState.stats.enemiesKilled,
      levelsCompleted: gameState.stats.levelsCompleted,
      totalPlayTime: gameState.stats.totalPlayTime,
      sessionHistory: gameState.stats.sessionHistory
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

  // Показ статистики текущей сессии
  static showSessionStats() {
    const sessionStats = document.getElementById('sessionStats');
    if (!sessionStats) return;
    
    this.updateSessionTime();
    
    sessionStats.innerHTML = `
      <div class="session-stats">
        <h3>Статистика сессии</h3>
        <div class="stat-item">
          <span>Убито в сессии:</span>
          <span class="stat-value">${gameState.stats.currentSessionKills}</span>
        </div>
        <div class="stat-item">
          <span>Убито на уровне:</span>
          <span class="stat-value">${gameState.stats.levelKills}</span>
        </div>
        <div class="stat-item">
          <span>Время сессии:</span>
          <span class="stat-value">${Utils.formatTime(gameState.stats.currentSessionTime)}</span>
        </div>
        <div class="stat-item">
          <span>Текущий уровень:</span>
          <span class="stat-value">${gameState.level}</span>
        </div>
      </div>
    `;
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
        <span>Убито врагов (всего):</span>
        <span class="record-value">${gameState.stats.enemiesKilled}</span>
      </div>
      <div class="record-item">
        <span>Время игры (всего):</span>
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
      currentSessionKills: 0,
      currentSessionTime: 0,
      currentSessionStartTime: 0,
      levelKills: 0,
      sessionHistory: []
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
      enemiesKilled: stats.currentSessionKills, // Используем убийства сессии
      playTime: stats.currentSessionTime, // Используем время сессии
      date: new Date().toISOString()
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

  // Показ экрана смерти с сессионной статистикой
  static showDeathScreen() {
    this.updateSessionTime();
    this.saveSessionToHistory();
    
    const deathScreen = document.getElementById('deathScreen');
    if (!deathScreen) return;
    
    const sessionStats = `
      <div class="death-stats">
        <h2>Игра окончена</h2>
        <div class="session-summary">
          <h3>Статистика сессии</h3>
          <div class="stat-row">
            <span>Герой:</span>
            <span class="stat-value">${gameState.selectedCharacter?.name || 'Unknown'}</span>
          </div>
          <div class="stat-row">
            <span>Класс:</span>
            <span class="stat-value">${gameState.selectedCharacter?.class || 'Unknown'}</span>
          </div>
          <div class="stat-row">
            <span>Достигнутый уровень:</span>
            <span class="stat-value">${gameState.level}</span>
          </div>
          <div class="stat-row">
            <span>Убито врагов в сессии:</span>
            <span class="stat-value">${gameState.stats.currentSessionKills}</span>
          </div>
          <div class="stat-row">
            <span>Время сессии:</span>
            <span class="stat-value">${Utils.formatTime(gameState.stats.currentSessionTime)}</span>
          </div>
          <div class="stat-row">
            <span>Убито на последнем уровне:</span>
            <span class="stat-value">${gameState.stats.levelKills}</span>
          </div>
        </div>
        
        <div class="total-stats">
          <h3>Общая статистика</h3>
          <div class="stat-row">
            <span>Всего убито врагов:</span>
            <span class="stat-value">${gameState.stats.enemiesKilled}</span>
          </div>
          <div class="stat-row">
            <span>Лучший уровень:</span>
            <span class="stat-value">${gameState.stats.bestLevel}</span>
          </div>
          <div class="stat-row">
            <span>Общее время игры:</span>
            <span class="stat-value">${Utils.formatTime(gameState.stats.totalPlayTime)}</span>
          </div>
        </div>
        
        <div class="card__footer">
          <div class="flex gap-8">
            <button id="restartBtn" class="btn btn--primary">Снова</button>
            <button id="menuBtn" class="btn btn--outline">Меню</button>
          </div>
        </div>
      </div>
    `;
    
    deathScreen.innerHTML = sessionStats;
    deathScreen.classList.remove('hidden');
    
    // Добавляем обработчики событий для кнопок
    setTimeout(() => {
      const restartBtn = document.getElementById('restartBtn');
      const menuBtn = document.getElementById('menuBtn');
      
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          deathScreen.classList.add('hidden');
          (async () => {
            const { GameEngine } = await import('../game/GameEngine.js');
            GameEngine.startGame();
          })();
        });
      }
      
      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          deathScreen.classList.add('hidden');
          (async () => {
            const { ScreenManager } = await import('../ui/ScreenManager.js');
            ScreenManager.switchScreen('menu');
          })();
        });
      }
    }, 100);
  }
} 