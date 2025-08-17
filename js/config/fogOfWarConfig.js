/* Darkfall Depths - Конфигурация тумана войны */

export const FOG_OF_WAR_CONFIG = {
  // Разрешение тумана войны (количество пикселей на тайл)
  RESOLUTION: 16, // 16x16 пикселей на тайл для максимальной плотности
  
  // Радиус видимости игрока
  PLAYER_VISIBILITY_RADIUS: 12,
  
  // Интервал обновления тумана войны (мс)
  UPDATE_INTERVAL: 200,
  
  // Минимальное расстояние для обновления
  MIN_UPDATE_DISTANCE: 32,
  
  // Параметры сглаживания
  SMOOTHING: {
    PASSES: 5,        // 5 проходов сглаживания для максимальной плавности
    RADIUS: 4,        // Радиус сглаживания 4
    STRENGTH: 0.98    // Сила сглаживания 0.98 для максимального эффекта
  },
  
  // Параметры луча
  RAY_CASTING: {
    DIRECTIONS: 256,          // 256 лучей для кругового света
    CONE_DIRECTIONS: 256,     // 256 лучей для конуса света
    BASE_DIRECTIONS: 128,     // 128 лучей для базового света
    CONE_ANGLE: Math.PI / 2,  // Угол конуса света (90 градусов)
    BASE_RADIUS_MULTIPLIER: 0.6 // Множитель радиуса базового света
  },
  
  // Параметры рендеринга
  RENDERING: {
    EXPLORED_ALPHA: 0.6,      // Прозрачность исследованных областей
    VISIBLE_ALPHA_RANGE: [0.0, 0.4], // Диапазон прозрачности видимых областей
    GRADIENT_FALLOFF: 1.0     // Скорость затухания градиента
  }
};

// Функции для получения настроек
export const getFogConfig = () => FOG_OF_WAR_CONFIG;

export const getFogResolution = () => FOG_OF_WAR_CONFIG.RESOLUTION;

export const getPlayerVisibilityRadius = () => FOG_OF_WAR_CONFIG.PLAYER_VISIBILITY_RADIUS;

export const getUpdateInterval = () => FOG_OF_WAR_CONFIG.UPDATE_INTERVAL;

export const getSmoothingConfig = () => FOG_OF_WAR_CONFIG.SMOOTHING;

export const getRayCastingConfig = () => FOG_OF_WAR_CONFIG.RAY_CASTING;

export const getRenderingConfig = () => FOG_OF_WAR_CONFIG.RENDERING;
