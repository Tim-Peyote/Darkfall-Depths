/* Darkfall Depths - Аудио система */

import { gameState } from '../core/GameState.js';

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
  }

  async init() {
    try {
      // Проверяем поддержку Web Audio API
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('🎵 Web Audio API not supported in this browser');
        return;
      }
      
      // Загружаем треки без создания аудио контекста
      await this.loadMusicTracks();
      await this.loadSfxTracks();
      
      // Добавляем обработчики для автоматического возобновления аудио
      this.setupAudioResumeHandlers();
      
      // Автоматически создаем аудио контекст и запускаем музыку
      setTimeout(() => {
        this.createAudioContextAndPlay();
      }, 1000);
    } catch (e) {
      console.warn('❌ Audio system initialization failed:', e);
      // Не выбрасываем ошибку, чтобы игра продолжала работать без аудио
    }
  }

  setupAudioResumeHandlers() {
    // Функция для возобновления аудио контекста
    const resumeAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
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
    if (!this.audioContext) {
      console.log('🎵 Creating audio context and playing...');
      this.createAudioContextAndPlay();
    } else if (gameState.audio.enabled && this.isMusicLoaded && !this.currentMusic) {
      console.log('🎵 Force starting main music...');
      this.playMusic('main');
    } else {
      console.log('🎵 Force start conditions not met');
    }
  }

  async loadMusicTracks() {
    try {
      // Загружаем треки
      this.musicTracks.main = await this.loadAudioFile('Audio/Main.mp3');
      this.musicTracks.stage1 = await this.loadAudioFile('Audio/stage1.mp3');
      this.musicTracks.gameOver = await this.loadAudioFile('Audio/GameOver.mp3');
      this.musicTracks.levelComplete = await this.loadAudioFile('Audio/Level_Complite.mp3');
      
      this.isMusicLoaded = true;
    } catch (error) {
      console.warn('⚠️ Failed to load music tracks:', error);
      this.isMusicLoaded = false;
      // Не выбрасываем ошибку, чтобы игра продолжала работать
    }
  }

  async loadSfxTracks() {
    try {
      // Загружаем звуковые эффекты по одному, чтобы один неудачный не прерывал остальные
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
      
      let loadedCount = 0;
      
      for (const sfx of sfxToLoad) {
        try {
          this.sfxTracks[sfx.key] = await this.loadAudioFile(sfx.path);
          loadedCount++;
        } catch (error) {
          console.warn(`❌ Failed to load ${sfx.key} sound:`, error);
        }
      }
      
      if (loadedCount > 0) {
        this.isSfxLoaded = true;
      } else {
        this.isSfxLoaded = false;
        console.warn('❌ No sound effects loaded');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sound effects:', error);
      this.isSfxLoaded = false;
    }
  }

  async loadAudioFile(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // Проверяем, запущена ли игра через file:// протокол
      const isLocalFile = window.location.protocol === 'file:';
      if (isLocalFile) {
        console.warn(`⚠️ Audio loading may fail with file:// protocol: ${url}`);
        // Уменьшаем таймаут для file:// протокола
        const timeout = setTimeout(() => {
          console.warn(`Audio load timeout for: ${url}`);
          reject(new Error(`Audio load timeout: ${url}`));
        }, 5000); // 5 секунд таймаут для file://
        
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve(audio);
        }, false);
        
        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.warn(`❌ Audio load error for ${url}:`, e);
          reject(e);
        }, false);
        
        audio.src = url;
        audio.load();
      } else {
        // Обычная загрузка для HTTP сервера
        const timeout = setTimeout(() => {
          console.warn(`Audio load timeout for: ${url}`);
          reject(new Error(`Audio load timeout: ${url}`));
        }, 10000); // 10 секунд таймаут
        
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          console.log(`✅ Audio file loaded successfully: ${url}`);
          resolve(audio);
        }, false);
        
        audio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          console.warn(`❌ Audio load error for ${url}:`, e);
          reject(e);
        }, false);
        
        audio.src = url;
        audio.load();
      }
    });
  }

  playMusic(trackName, loop = true) {
    if (!this.isMusicLoaded || !gameState.audio.enabled) {
      return;
    }
    
    // Проверяем, доступно ли аудио в браузере
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('🎵 Web Audio API not supported');
      return;
    }
    
    const track = this.musicTracks[trackName];
    if (!track) {
      console.warn(`❌ Track ${trackName} not found in musicTracks:`, Object.keys(this.musicTracks));
      return;
    }

    // Проверяем, не играет ли уже нужный трек
    if (this.currentMusic === track && !this.currentMusic.paused) {
      return; // Уже играет нужный трек
    }

    // Останавливаем текущую музыку
    if (this.currentMusic && this.currentMusic !== track) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }

    // Начинаем новый трек
    this.currentMusic = track;
    this.currentMusic.loop = loop;
    this.currentMusic.volume = gameState.audio.musicVolume * gameState.audio.masterVolume;
    
    // Воспроизводим только если контекст активен
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.currentMusic.play().catch(e => {
      console.warn('❌ Failed to play music:', e);
    });
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

  // Методы для воспроизведения звуковых эффектов
  playSfx(sfxName) {
    if (!this.isSfxLoaded || !gameState.audio.enabled) {
      return;
    }
    
    const sfx = this.sfxTracks[sfxName];
    if (!sfx) {
      console.warn(`❌ Sound effect ${sfxName} not found in sfxTracks:`, Object.keys(this.sfxTracks));
      return;
    }
    
    try {
      // Клонируем аудио для одновременного воспроизведения
      const sfxClone = sfx.cloneNode();
      sfxClone.volume = gameState.audio.sfxVolume * gameState.audio.masterVolume;
      sfxClone.loop = false;
      
      sfxClone.play().catch(e => {
        console.warn(`❌ Failed to play sound effect ${sfxName}:`, e);
      });
    } catch (e) {
      console.warn(`❌ Error creating sound effect ${sfxName}:`, e);
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

  // Метод для тестирования звуковых эффектов
  testAllSounds() {
    console.log('🧪 Testing all sound effects...');
    console.log('📋 Available SFX tracks:', Object.keys(this.sfxTracks));
    console.log('🔊 SFX loaded:', this.isSfxLoaded);
    console.log('🎵 Audio enabled:', gameState.audio.enabled);
    
    // Тестируем каждый звук
    setTimeout(() => this.playInventoryOpen(), 100);
    setTimeout(() => this.playHealthPotion(), 200);
    setTimeout(() => this.playEnemyHit(), 300);
    setTimeout(() => this.playEnemyDie(), 400);
    setTimeout(() => this.playHeroesHit(), 500);
    setTimeout(() => this.playHeroesDie(), 600);
    setTimeout(() => this.playSwordAttack(), 700);
    setTimeout(() => this.playDaggerAttack(), 800);
    setTimeout(() => this.playFireballAttack(), 900);
  }
}

// Создаем глобальный экземпляр
export const audioManager = new AudioManager(); 