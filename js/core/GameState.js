/* Darkfall Depths - Глобальное состояние игры */

// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================
export const gameState = {
  screen: 'menu',
  level: 1,
  gameTime: 0,
  player: null,
  selectedCharacter: null,
  entities: [],
  projectiles: [],
  particles: [],
  map: null,
  rooms: [],
  fogOfWar: null,
  camera: { x: 0, y: 0 },
  input: {
    keys: {},
    mouse: { x: 0, y: 0, pressed: false },
    joystick: { active: false, x: 0, y: 0, dx: 0, dy: 0 }
  },
  inventory: {
    equipment: [null, null, null, null], // weapon, armor, accessory, consumable
    backpack: new Array(8).fill(null)
  },
  stats: {
    enemiesKilled: 0,
    levelsCompleted: 0,
    totalPlayTime: 0,
    bestLevel: 0,
    currentSessionKills: 0
  },
  audio: {
    enabled: true,
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8
  },
  isPaused: false,
  gameRunning: false,
  pools: {
    particles: [],
    enemies: [],
    projectiles: []
  }
};

// ==================== CANVAS И КОНТЕКСТ ====================
export let canvas, ctx, minimapCanvas, minimapCtx;
export let DPR = window.devicePixelRatio || 1;

// Функция для установки canvas элементов
export function setCanvasElements() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  minimapCanvas = document.getElementById('minimap');
  minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
}

// ==================== УТИЛИТЫ ====================
export const Utils = {
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomFloat: (min, max) => Math.random() * (max - min) + min,
  distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  angle: (a, b) => Math.atan2(b.y - a.y, b.x - a.x),
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (a, b, t) => a + (b - a) * t,
  normalize: (vector) => {
    const len = Math.hypot(vector.x, vector.y);
    return len > 0 ? { x: vector.x / len, y: vector.y / len } : { x: 0, y: 0 };
  },
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}м ${secs}с`;
  }
}; 