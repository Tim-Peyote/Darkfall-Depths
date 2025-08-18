/* Darkfall Depths - Аудио система */

import { gameState } from '../core/GameState.js';
import { Logger } from '../utils/Logger.js';

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.currentMusic = null;
    this.musicTracks = {};
    this.sfxTracks = {};
    this.isMusicLoaded = false;
    this.isSfxLoaded = false;
    this.inventorySoundPlaying = false;
    this.loadingProgress = 0;
    this.totalAudioFiles = 0;
    this.loadedAudioFiles = 0;
  }

  async preloadAllAudio(onProgress) {
    try {
      this.totalAudioFiles = 17;
      this.loadedAudioFiles = 0;
      
      await this.loadMusicTracksWithProgress(onProgress);
      await this.loadSfxTracksWithProgress(onProgress);
      
      // Возвращаем true только если загрузились ВСЕ файлы
      return this.loadedAudioFiles === this.totalAudioFiles;
    } catch (error) {
      return false;
    }
  }



  async loadMusicTracksWithProgress(onProgress) {
    const musicFiles = [
      { key: 'main', path: 'Audio/Main.mp3' },
      { key: 'stage1', path: 'Audio/stage1.mp3' },
      { key: 'gameOver', path: 'Audio/GameOver.mp3' },
      { key: 'levelComplete', path: 'Audio/Level_Complite.mp3' }
    ];
    
    for (const music of musicFiles) {
      try {
        this.musicTracks[music.key] = await this.loadAudioFile(music.path);
        this.loadedAudioFiles++;
        
        if (onProgress) {
          onProgress(Math.round((this.loadedAudioFiles / this.totalAudioFiles) * 100), `Загрузка музыки: ${music.key}...`);
        }
      } catch (error) {
        // Игнорируем ошибки, но не увеличиваем счетчик
      }
    }
    
    this.isMusicLoaded = true;
  }

  async loadSfxTracksWithProgress(onProgress) {
    const sfxToLoad = [
      { key: 'inventoryOpen', path: 'Audio/Fx/Inventory_open.mp3' },
      { key: 'healthPotion', path: 'Audio/Fx/health_potion.mp3' },
      { key: 'itemPickup', path: 'Audio/Fx/item_pickup.mp3' },
      { key: 'enemyDie', path: 'Audio/Fx/enemy_die.mp3' },
      { key: 'enemyHit', path: 'Audio/Fx/enemy_hit.mp3' },
      { key: 'heroesHit', path: 'Audio/Fx/heroes_hit.mp3' },
      { key: 'heroesDie', path: 'Audio/Fx/Heroes_die.mp3' },
      { key: 'dagger', path: 'Audio/Fx/Dagger.mp3' },
      { key: 'fireball', path: 'Audio/Fx/Fireball.mp3' },
      { key: 'sword', path: 'Audio/Fx/sword.mp3' },
      { key: 'explosion', path: 'Audio/Fx/explosion.mp3' },
      { key: 'armor', path: 'Audio/Fx/Armor.mp3' },
      { key: 'dash', path: 'Audio/Fx/Dash.mp3' }
    ];
    
    for (const sfx of sfxToLoad) {
      try {
        this.sfxTracks[sfx.key] = await this.loadAudioFile(sfx.path);
        this.loadedAudioFiles++;
        
        if (onProgress) {
          onProgress(Math.round((this.loadedAudioFiles / this.totalAudioFiles) * 100), `Загрузка звуков: ${sfx.key}...`);
        }
      } catch (error) {
        // Игнорируем ошибки, но не увеличиваем счетчик
      }
    }
    
    this.isSfxLoaded = true;
  }

  async init() {
    try {
      // Проверяем поддержку Web Audio API
      if (!window.AudioContext && !window.webkitAudioContext) {
        Logger.warn('Web Audio API not supported in this browser');
        return;
      }
      
      // Добавляем обработчики для автоматического возобновления аудио
      this.setupAudioResumeHandlers();
      
      // Автоматически создаем аудио контекст и запускаем музыку
      setTimeout(() => {
        this.createAudioContextAndPlay();
      }, 1000);
    } catch (e) {
      Logger.warn('Audio system initialization failed:', e);
      // Не выбрасываем ошибку, чтобы игра продолжала работать без аудио
    }
  }

  setupAudioResumeHandlers() {
    // Функция для возобновления аудио контекста
    const resumeAudio = () => {
      // Создаем аудио контекст при первом взаимодействии
      if (!this.audioContext) {
        this.createAudioContextAndPlay();
      } else if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      if (this.currentMusic && this.currentMusic.paused && gameState.audio.enabled) {
        this.currentMusic.play().catch(e => console.warn('Failed to resume music:', e));
      }
      
      // Если музыка не играет и мы на главном экране, запускаем её
      if (!this.currentMusic && gameState.screen === 'menu' && gameState.audio.enabled) {
        this.playMusic('main');
      }
    };

    // Добавляем обработчики для различных событий взаимодействия
    ['click', 'touchstart', 'keydown', 'mousedown'].forEach(event => {
      document.addEventListener(event, resumeAudio, { once: false });
    });
  }

  createAudioContextAndPlay() {
    try {
      // Создаем аудио контекст
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Автоматически запускаем музыку
      if (gameState.audio.enabled && this.isMusicLoaded) {
        this.playMusic('main');
      }
    } catch (e) {
      console.warn('❌ Failed to create audio context:', e);
    }
  }

  // Метод для принудительного запуска музыки (вызывается из main.js)
  forceStartMusic() {
    // Не запускаем аудио автоматически - ждем взаимодействия пользователя
    // Аудио будет запущено при первом клике пользователя
  }

  async loadMusicTracks() {
    // Используем новый метод с прогрессом, но без callback
    return this.loadMusicTracksWithProgress(null);
  }

  async loadSfxTracks() {
    // Используем новый метод с прогрессом, но без callback
    return this.loadSfxTracksWithProgress(null);
  }

  async loadAudioFile(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const timeout = setTimeout(() => reject(new Error(`Timeout: ${url}`)), 10000);
      
      audio.addEventListener('canplaythrough', () => {
        clearTimeout(timeout);
        resolve(audio);
      }, false);
      
      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load: ${url}`));
      }, false);
      
      audio.src = url;
      audio.load();
    });
  }

  playMusic(trackName, loop = true) {
    if (!this.isMusicLoaded || !gameState.audio.enabled) {
      return;
    }
    
    if (!window.AudioContext && !window.webkitAudioContext) {
      return;
    }
    
    const track = this.musicTracks[trackName];
    if (!track) {
      return;
    }

    if (this.currentMusic === track && !this.currentMusic.paused) {
      return;
    }

    if (this.currentMusic && this.currentMusic !== track) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }

    this.currentMusic = track;
    this.currentMusic.loop = loop;
    
    this.currentMusic.volume = gameState.audio.musicVolume * gameState.audio.masterVolume;
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.currentMusic.play();
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
    
    // Принудительно останавливаем все треки музыки
    Object.values(this.musicTracks).forEach(track => {
      if (track && !track.paused) {
        track.pause();
        track.currentTime = 0;
      }
    });
  }

  updateMusicVolume() {
    if (this.currentMusic) {
      this.currentMusic.volume = gameState.audio.musicVolume * gameState.audio.masterVolume;
    }
  }

  playSfx(sfxName) {
    if (!this.isSfxLoaded || !gameState.audio.enabled) {
      return;
    }
    
    const sfx = this.sfxTracks[sfxName];
    if (!sfx) {
      return;
    }
    
    try {
      // Используем cloneNode() для воспроизведения из кеша
      // Это позволяет воспроизводить один звук несколько раз одновременно
      const sfxClone = sfx.cloneNode();
      sfxClone.volume = gameState.audio.sfxVolume * gameState.audio.masterVolume;
      sfxClone.loop = false;
      sfxClone.play();
    } catch (e) {
      // Игнорируем ошибки
    }
  }

  // Специфичные методы для звуковых эффектов
  playInventoryOpen() {
    // Защита от множественного воспроизведения
    if (this.inventorySoundPlaying) return;
    this.inventorySoundPlaying = true;
    
    this.playSfx('inventoryOpen');
    
    // Сбрасываем флаг через 500мс
    setTimeout(() => {
      this.inventorySoundPlaying = false;
    }, 500);
  }

  playInventoryClose() {
    // Защита от множественного воспроизведения
    if (this.inventorySoundPlaying) return;
    this.inventorySoundPlaying = true;
    
    this.playSfx('inventoryOpen'); // Используем тот же звук для закрытия, пока нет отдельного
    
    // Сбрасываем флаг через 500мс
    setTimeout(() => {
      this.inventorySoundPlaying = false;
    }, 500);
  }

  playHealthPotion() {
    this.playSfx('healthPotion');
  }

  playItemPickup() {
    this.playSfx('itemPickup');
  }

  playEnemyDie() {
    this.playSfx('enemyDie');
  }

  playEnemyHit() {
    this.playSfx('enemyHit');
  }

  playHeroesHit() {
    this.playSfx('heroesHit');
  }

  playHeroesDie() {
    this.playSfx('heroesDie');
  }

  playDaggerAttack() {
    this.playSfx('dagger');
  }

  playFireballAttack() {
    this.playSfx('fireball');
  }

  playSwordAttack() {
    this.playSfx('sword');
  }

  // Методы для способностей персонажей
  playExplosion() {
    this.playSfx('explosion');
  }

  playArmor() {
    this.playSfx('armor');
  }

  playDashSound() {
    this.playSfx('dash');
  }

  // Методы для игровых событий
  playGameOver() {
    this.stopMusic();
    this.playMusic('gameOver', false);
  }

  playLevelComplete() {
    // Logger.debug('🎵 playLevelComplete called');
    this.stopMusic();
    this.playMusic('levelComplete', false);
    
    // Принудительно устанавливаем loop = false для levelComplete
    if (this.currentMusic) {
      this.currentMusic.loop = false;
      
      // Добавляем обработчик для автоматической остановки
      this.currentMusic.addEventListener('ended', () => {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
      }, { once: true });
    }
  }

  stopLevelComplete() {
    // Принудительно останавливаем музыку levelComplete
    if (this.currentMusic && this.currentMusic.src && this.currentMusic.src.includes('Level_Complite')) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  createBeep(frequency, duration, volume = 0.1) {
    if (!this.audioContext || !gameState.audio.enabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      const finalVolume = volume * gameState.audio.sfxVolume * gameState.audio.masterVolume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Устаревшие методы (оставляем для совместимости)
  playSwordHit() {
    this.playSwordAttack();
  }

  playMagicShot() {
    this.playFireballAttack();
  }

  playDash() {
    this.createBeep(800, 0.3, 0.1);
  }

  playShield() {
    this.createBeep(400, 0.4, 0.2);
  }

  playBlast() {
    this.createBeep(200, 0.5, 0.3);
  }

  playChestOpen() {
    this.createBeep(600, 0.3, 0.12);
  }

  playHurt() {
    this.playHeroesHit();
  }


}

// Создаем глобальный экземпляр
export const audioManager = new AudioManager(); 