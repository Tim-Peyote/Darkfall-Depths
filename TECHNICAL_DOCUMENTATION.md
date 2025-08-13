# Darkfall Depths - Техническая документация механик

## 📅 Последние обновления (Август 2025)

### 🆕 Новые системы
- **🎨 Система фоновых изображений** - красивый фон для меню и выбора персонажей
- **🎵 Аудио система v2.0** - автоматическое воспроизведение с богатым саунд дизайном
- **🧪 Система банок здоровья** - Diablo-style хоткеи для быстрого использования
- **💚 Улучшенная система здоровья** - правильная логика maxHp и восстановление между уровнями

### 🔧 Технические улучшения
- **Автоматическая инициализация аудио** - обход ограничений браузера
- **Система возобновления аудио** - автоматическое восстановление после приостановки
- **Адаптивность UI** - оптимизация для мобильных устройств
- **Интеграция звуков** - уникальные звуки для каждого персонажа и события

### 🎮 Игровые улучшения
- **Сохранение прогрессии** - инвентарь не сбрасывается между уровнями
- **Сбалансированная сложность** - плавное масштабирование врагов
- **Улучшенные предметы** - шанс найти предметы на уровень выше
- **Визуальные эффекты** - прозрачные карточки персонажей с фокусом

## 🏗️ АРХИТЕКТУРА ПРОЕКТА

### Структура файлов
```
Vers_1.9/
├── js/
│   ├── main.js                    # Главный файл игры
│   ├── audio/
│   │   └── AudioManager.js        # Аудио система v2.0
│   ├── config/
│   │   └── constants.js           # Константы и настройки
│   ├── core/
│   │   ├── GameState.js           # Состояние игры
│   │   └── ObjectPool.js          # Object Pool для оптимизации
│   ├── effects/
│   │   └── Particle.js            # Система частиц
│   ├── entities/
│   │   ├── Entity.js              # Базовый класс сущностей
│   │   ├── Player.js              # Игрок
│   │   ├── Enemy.js               # Враги
│   │   ├── Projectile.js          # Снаряды
│   │   ├── DroppedItem.js         # Предметы на земле
│   │   └── Portal.js              # Порталы
│   ├── game/
│   │   ├── GameEngine.js          # Игровой движок
│   │   └── LevelManager.js        # Управление уровнями
│   ├── input/
│   │   └── InputManager.js        # Управление вводом
│   ├── map/
│   │   ├── MapGenerator.js        # Генерация подземелий
│   │   └── FogOfWar.js            # Туман войны
│   ├── ui/
│   │   ├── ScreenManager.js       # Управление экранами
│   │   ├── InventoryManager.js    # Инвентарь
│   │   ├── ContextMenuManager.js  # Контекстные меню
│   │   ├── MenuNavigationManager.js # Навигация меню
│   │   ├── RecordsManager.js      # Рекорды
│   │   └── SettingsManager.js     # Настройки
│   └── utils/
│       └── Utils.js               # Утилиты
├── Audio/
│   ├── Main.mp3                   # Главная тема
│   ├── stage1.mp3                 # Музыка игры
│   ├── GameOver.mp3               # Музыка геймовера
│   ├── Level_Complite.mp3         # Музыка завершения уровня
│   └── Fx/                        # Звуковые эффекты
├── Assets/
│   ├── Main.png                   # Фон главного меню
│   └── Characters.png             # Фон выбора персонажей
├── index.html                     # Главная страница
├── style.css                      # Стили
└── README.md                      # Документация
```

### Модульная архитектура
- **ES6 модули** - современная система импортов/экспортов
- **Разделение ответственности** - каждый модуль отвечает за свою область
- **Слабая связанность** - модули взаимодействуют через четкие интерфейсы
- **Высокая когезия** - связанный функционал группируется в одном модуле

## 🎨 СИСТЕМА ФОНОВЫХ ИЗОБРАЖЕНИЙ

### Структура файлов
```
Assets/
├── Main.png          # Фон главного меню и экранов настроек/рекордов
└── Characters.png    # Фон экрана выбора персонажей
```

### HTML структура экранов
```html
<!-- Главное меню -->
<div id="menuScreen" class="screen">
  <div class="menu-background"></div>
  <div class="menu-content">
    <!-- Контент меню -->
  </div>
</div>

<!-- Выбор персонажей -->
<div id="selectScreen" class="screen">
  <div class="select-background"></div>
  <div class="select-content">
    <!-- Контент выбора -->
  </div>
</div>
```

### CSS стили фоновых изображений
```css
/* Убираем градиент для экранов с фоновыми изображениями */
#menuScreen, #selectScreen, #settingsScreen, #recordsScreen {
  background: none;
}

/* Фоновые изображения */
.menu-background, .select-background, .settings-background, .records-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

/* Контейнеры контента */
.menu-content, .select-content, .settings-content, .records-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

### Прозрачность карточек персонажей
```css
/* Обычные карточки - полупрозрачные */
.character-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.2));
  backdrop-filter: blur(10px);
}

/* Карточка с фокусом - полностью прозрачная */
.character-card.keyboard-focus {
  background: transparent;
  backdrop-filter: none;
}
```

### Адаптивность
```css
@media (max-width: 768px) {
  .menu-background, .select-background, .settings-background, .records-background {
    background-size: cover;
    background-position: center;
  }
}
```

## 🎵 АУДИО СИСТЕМА V2.0

### Структура аудио файлов
```
Audio/
├── Main.mp3              # Главная тема (меню)
├── stage1.mp3            # Музыка игры
├── GameOver.mp3          # Музыка геймовера
├── Level_Complite.mp3    # Музыка завершения уровня
└── Fx/
    ├── Inventory_open.mp3
    ├── health_potion.mp3
    ├── enemy_die.mp3
    ├── enemy_hit.mp3
    ├── heroes_hit.mp3
    ├── Heroes_die.mp3
    ├── Dagger.mp3
    ├── Fireball.mp3
    ├── sword.mp3
    ├── Armor.mp3
    ├── Dash.mp3
    ├── explosion.mp3
    └── item_pickup.mp3
```

### Автоматическая инициализация
```javascript
// Автоматическое создание аудио контекста
createAudioContextAndPlay() {
  this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Автоматический запуск музыки
  if (gameState.audio.enabled && this.isMusicLoaded) {
    this.playMusic('main');
  }
}
```

### Система возобновления аудио
```javascript
setupAudioResumeHandlers() {
  const resumeAudio = () => {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.currentMusic && this.currentMusic.paused && gameState.audio.enabled) {
      this.currentMusic.play();
    }
  };

  // Обработчики для различных событий взаимодействия
  ['click', 'touchstart', 'keydown', 'mousedown'].forEach(event => {
    document.addEventListener(event, resumeAudio, { once: false });
  });
}
```

### Интеграция с игровыми событиями

**Автоматические события:**
- Открытие инвентаря → `playInventoryOpen()`
- Использование зелья здоровья → `playHealthPotion()`
- Подбор предметов → `playItemPickup()`

**Боевые события:**
- Атака Andre (меч) → `playSwordAttack()`
- Атака Tim (кинжал) → `playDaggerAttack()`
- Атака Dimon (огненный шар) → `playFireballAttack()`
- Попадание по врагу → `playEnemyHit()`
- Смерть врага → `playEnemyDie()`
- Получение урона героем → `playHeroesHit()`
- Смерть героя → `playHeroesDie()`

**Игровые события:**
- Завершение уровня → `playLevelComplete()`
- Геймовер → `playGameOver()`

## 🧪 СИСТЕМА БАНОК ЗДОРОВЬЯ (Diablo-style)

### HTML структура
```html
<div class="health-potions-bottom">
  <div id="healthPotionSlot" class="potion-slot">
    <div class="potion-icon">🧪</div>
    <div id="potionCount" class="potion-count">0</div>
    <div class="potion-hotkey">1</div>
  </div>
</div>
```

### CSS стили
```css
.health-potions-bottom {
  position: absolute;
  bottom: var(--space-20);
  left: var(--space-20);
  z-index: 40;
  pointer-events: auto;
}

.potion-slot {
  position: relative;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--color-error);
  border-radius: var(--radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.potion-slot.empty {
  opacity: 0.5;
  cursor: not-allowed;
}

.potion-count {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--color-error);
  color: var(--color-cream-50);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  min-width: 16px;
  text-align: center;
}

.potion-hotkey {
  position: absolute;
  top: -2px;
  left: -2px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-cream-50);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  min-width: 12px;
  text-align: center;
}
```

### Автоматическое обнаружение банок
```javascript
static updateHealthPotions() {
  let healthPotionCount = 0;
  
  // Проверяем рюкзак
  gameState.inventory.backpack.forEach(item => {
    if (item && item.bonus && item.bonus.heal) {
      healthPotionCount++;
    }
  });
  
  // Проверяем экипировку (расходники)
  if (gameState.inventory.equipment[3] && 
      gameState.inventory.equipment[3].bonus && 
      gameState.inventory.equipment[3].bonus.heal) {
    healthPotionCount++;
  }
  
  // Обновляем UI
  potionCount.textContent = healthPotionCount;
  
  if (healthPotionCount > 0) {
    potionSlot.classList.remove('empty');
  } else {
    potionSlot.classList.add('empty');
  }
}
```

### Использование банок
```javascript
static useHealthPotion() {
  // Ищем банку в рюкзаке
  for (let i = 0; i < gameState.inventory.backpack.length; i++) {
    const item = gameState.inventory.backpack[i];
    if (item && item.bonus && item.bonus.heal) {
      // Используем банку
      gameState.player.hp = Math.min(gameState.player.maxHp, 
                                     gameState.player.hp + item.bonus.heal);
      
      // Удаляем банку из инвентаря
      gameState.inventory.backpack[i] = null;
      
      // Воспроизводим звук
      audioManager.playHealthPotion();
      
      // Обновляем UI
      this.updateHealthPotions();
      return;
    }
  }
}
```

### Управление
**Хоткеи:**
- **Клавиша "1"** - `Digit1`
- **Клавиша "Q"** - `KeyQ`
- **Клик по ячейке** - прямое использование

**Адаптивность:**
```css
@media (max-width: 768px) {
  .health-potions-bottom {
    bottom: var(--space-16);
    left: var(--space-16);
  }
}

@media (max-width: 480px) {
  .health-potions-bottom {
    bottom: var(--space-12);
    left: var(--space-12);
  }
  
  .potion-slot {
    width: 40px;
    height: 40px;
  }
}
```

## 💚 УЛУЧШЕННАЯ СИСТЕМА ЗДОРОВЬЯ

### Логика maxHp
```javascript
// Предметы увеличивают шкалу, но НЕ восстанавливают здоровье
case 'maxHp':
  gameState.player.maxHp += value;
  // Текущее здоровье остается прежним
  break;
```

### Восстановление между уровнями
```javascript
// Восстановление 30% от максимума при переходе на следующий уровень
const healAmount = Math.floor(gameState.player.maxHp * 0.3);
gameState.player.hp = Math.min(gameState.player.maxHp, 
                               gameState.player.hp + healAmount);
```

## 🏰 СИСТЕМА ГЕНЕРАЦИИ ПОДЗЕМЕЛИЙ (MapGenerator)

### Алгоритм BSP (Binary Space Partitioning)

**Принцип работы:**
1. **Инициализация**: Карта 50x50 тайлов заполняется стенами (значение 1)
2. **Разделение пространства**: Рекурсивное разделение карты на прямоугольные секции
3. **Создание комнат**: В каждой секции создается комната случайного размера
4. **Соединение коридорами**: L-образные коридоры соединяют центры комнат

**Технические параметры:**
```javascript
const MAP_SIZE = 50;           // Размер карты в тайлах
const ROOM_MIN_SIZE = 6;       // Минимальный размер комнаты
const ROOM_MAX_SIZE = 12;      // Максимальный размер комнаты
const MIN_ROOMS = 8;           // Минимальное количество комнат
const MAX_ROOMS = 12;          // Максимальное количество комнат
```

**Процесс генерации:**
1. **splitPartition()** - разделяет прямоугольную область на две части
2. **createRoomInPartition()** - создает комнату в заданной секции
3. **carveRoom()** - вырезает комнату в карте (заменяет стены на пол)
4. **connectRooms()** - соединяет комнаты коридорами
5. **createCorridor()** - создает L-образный коридор между двумя точками

**Структура комнаты:**
```javascript
{
  x: number,           // X координата левого верхнего угла
  y: number,           // Y координата левого верхнего угла
  width: number,       // Ширина комнаты
  height: number,      // Высота комнаты
  centerX: number,     // X координата центра
  centerY: number      // Y координата центра
}
```

### Система спавна сущностей

**Расположение игрока:**
- Спавн в центре первой комнаты
- Координаты: `(room.centerX + 0.5) * TILE_SIZE`

**Расположение врагов:**
- Спавн в остальных комнатах (со 2-й по последнюю)
- Количество врагов: `1-2 + Math.floor(level / 4)`
- Позиция: случайная точка в пределах комнаты
- Усиление с уровнем: `1 + (level - 1) * 0.2`

**Расположение портала:**
- Спавн в центре последней комнаты
- Координаты: `(endRoom.centerX + 0.5) * TILE_SIZE`

### Система прогрессии врагов

**Масштабирование сложности:**
```javascript
// Базовый множитель сложности
const baseMultiplier = 1 + (gameState.level - 1) * 0.12;

// Дополнительный множитель для высоких уровней
const highLevelBonus = gameState.level >= 10 ? (gameState.level - 10) * 0.05 : 0;
const totalMultiplier = baseMultiplier + highLevelBonus;

// Усиление врагов
enemy.hp = Math.floor(enemy.hp * totalMultiplier);
enemy.damage = Math.floor(enemy.damage * totalMultiplier);

// Ускорение на высоких уровнях
if (gameState.level >= 5) {
  const speedBonus = Math.min(0.3, (gameState.level - 5) * 0.02);
  enemy.speed = Math.floor(enemy.speed * (1 + speedBonus));
}
```

**Система предметов:**
```javascript
// Шанс появления предметов
const baseItemChance = 0.3;
const levelBonus = Math.min(0.4, gameState.level * 0.03);
const itemChance = baseItemChance + levelBonus;

// Качество предметов
const minItemLevel = Math.max(1, gameState.level - 1);
const maxItemLevel = gameState.level + 1; // Предметы могут быть на уровень выше
```

## 🌫️ СИСТЕМА ТУМАНА ВОЙНЫ (FogOfWar)

### Принцип работы

**Два состояния видимости:**
1. **explored[y][x]** - исследованная территория (true/false)
2. **visible[y][x]** - видимая территория (true/false)

**Алгоритм обновления видимости:**
```javascript
updateVisibility(playerX, playerY, radius = 6)
```

**Процесс:**
1. **Очистка видимости**: `visible[y][x] = false` для всех тайлов
2. **Расчет центра**: `centerTileX = Math.floor(playerX / TILE_SIZE)`
3. **Круговое сканирование**: Проверка всех тайлов в радиусе 6
4. **Установка видимости**: `visible[tileY][tileX] = true`
5. **Отметка исследования**: `explored[tileY][tileX] = true`

**Радиус видимости:**
- **Базовый радиус**: 6 тайлов
- **Расчет расстояния**: `Math.hypot(dx, dy) <= radius`
- **Проверка границ**: `tileX >= 0 && tileX < MAP_SIZE`

### Визуализация тумана войны

**Три состояния отрисовки:**
1. **Неисследованная область**: `rgba(0, 0, 0, 0.9)` - полностью темная
2. **Исследованная но не видимая**: `rgba(0, 0, 0, 0.6)` - полупрозрачная
3. **Видимая область**: Без наложения (прозрачная)

**Оптимизация рендеринга:**
- Отрисовка только видимых тайлов на экране
- Расчет видимого диапазона: `startX/endX, startY/endY`
- Проверка границ экрана для производительности

## 🗺️ СИСТЕМА ОТРИСОВКИ КАРТЫ

### Основная отрисовка карты (renderMap)

**Оптимизация производительности:**
```javascript
const startX = Math.floor(camera.x / TILE_SIZE) - 1;
const endX = Math.floor((camera.x + canvas.width / DPR) / TILE_SIZE) + 1;
```

**Отрисовка тайлов:**
- **Стены** (значение 1): `#2c3e50` с границами `#34495e`
- **Пол** (значение 0): `#555` с сеткой `#666`
- **Экранные координаты**: `x * TILE_SIZE - camera.x`

**Система камеры:**
- **Плавное следование**: `Utils.lerp(camera.x, targetX, dt * 5)`
- **Центрирование**: `targetX = player.x - canvas.width / (2 * DPR)`
- **Ограничения**: Камера не выходит за границы карты

### Миникарта (renderMinimap)

**Масштабирование:**
```javascript
const scale = minimapCanvas.width / MAP_SIZE;
```

**Цветовая схема миникарты:**
- **Видимый пол**: `#95a5a6`
- **Исследованный пол**: `#34495e`
- **Видимая стена**: `#2c3e50`
- **Исследованная стена**: `#1a1a1a`

**Отображение сущностей:**
- **Игрок**: Красный квадрат 4x4 пикселя
- **Враги**: Темно-красный квадрат 2x2 пикселя
- **Портал**: Фиолетовый квадрат 4x4 пикселя

**Условия отображения:**
- Сущности отображаются только в видимых областях
- Проверка: `fogOfWar.visible[entityTileY][entityTileX]`

## 🎮 СИСТЕМА УПРАВЛЕНИЯ

### Управление камерой

**Плавное следование:**
```javascript
gameState.camera.x = Utils.lerp(gameState.camera.x, targetX, dt * 5);
gameState.camera.y = Utils.lerp(gameState.camera.y, targetY, dt * 5);
```

**Целевые координаты:**
- `targetX = player.x - canvas.width / (2 * DPR)`
- `targetY = player.y - canvas.height / (2 * DPR)`

**Коэффициент плавности:**
- `dt * 5` - обеспечивает плавное движение
- `dt` - дельта времени между кадрами

### Система ввода

**Клавиатурное управление:**
- **WASD** - движение персонажа
- **Пробел** - атака
- **E** - уникальная способность
- **I** - открытие инвентаря
- **ESC** - пауза/возврат в меню
- **1** - использование банки здоровья
- **Q** - альтернативная клавиша для банки здоровья

**Мобильное управление:**
- **Джойстик** - движение персонажа
- **Кнопка способности** - уникальная способность
- **Кнопка инвентаря** - открытие инвентаря

**Адаптивность:**
```javascript
// Автоматическое переключение между десктопом и мобильным
if (window.innerWidth <= 768) {
  showMobileControls();
} else {
  hideMobileControls();
}
```

### Система хоткеев

**Банки здоровья:**
```javascript
// Обработка клавиш для банок здоровья
if (key === 'Digit1' || key === 'KeyQ') {
  GameEngine.useHealthPotion();
}
```

**Способности:**
```javascript
// Обработка клавиши способности
if (key === 'KeyE' || key === 'Space') {
  player.useAbility();
}
```

## 🔄 СИСТЕМА ГЕНЕРАЦИИ УРОВНЕЙ

### Функция generateLevel()

**Последовательность генерации:**
1. **Генерация карты**: `MapGenerator.generateDungeon()`
2. **Инициализация тумана войны**: `new FogOfWar()`
3. **Очистка сущностей**: `gameState.entities = []`
4. **Спавн игрока**: В центре первой комнаты
5. **Спавн врагов**: В остальных комнатах
6. **Спавн портала**: В центре последней комнаты
7. **Спавн предметов**: Случайное размещение

**Масштабирование сложности:**
```javascript
const levelMultiplier = 1 + (gameState.level - 1) * 0.2;
enemy.hp = Math.floor(enemy.hp * levelMultiplier);
enemy.damage = Math.floor(enemy.damage * levelMultiplier);
```

**Система предметов:**
- **Шанс появления**: `0.4 + level * 0.05` (максимум 0.8)
- **Усиление с уровнем**: Предметы становятся сильнее
- **Классовые ограничения**: Предметы подходят классу игрока

## 🎯 СИСТЕМА КОЛЛИЗИЙ И ДВИЖЕНИЯ

### Проверка коллизий (checkCollisionWithWalls)

**Алгоритм проверки:**
1. **Перевод в тайлы**: `Math.floor(newX / TILE_SIZE)`
2. **Проверка границ**: `tileX >= 0 && tileX < MAP_SIZE`
3. **Проверка стен**: `gameState.map[tileY][tileX] === 1`
4. **Возврат результата**: `true` если есть коллизия

**Оптимизация:**
- Проверка только целевой позиции
- Кэширование результатов для статичных объектов
- Предварительная проверка границ карты

## 🎨 СИСТЕМА РЕНДЕРИНГА

### Игровой цикл (gameLoop)

**Частота обновления:**
- **Целевой FPS**: 60 кадров в секунду
- **Ограничение дельта-времени**: `Math.min(deltaTime, 1/30)`
- **Условный рендеринг**: Только при `gameState.gameRunning`

**Последовательность обновления:**
1. **update(dt)** - обновление игровой логики
2. **render()** - отрисовка всех элементов
3. **requestAnimationFrame()** - запрос следующего кадра

## 🖥️ СИСТЕМА UI И АДАПТИВНОСТИ

### Адаптивный дизайн

**Брейкпоинты:**
```css
/* Десктоп (по умолчанию) */
@media (min-width: 769px) { /* Десктоп стили */ }

/* Планшет */
@media (max-width: 768px) {
  .character-grid { grid-template-columns: repeat(2, 1fr); }
  .health-potions-bottom { bottom: var(--space-16); }
}

/* Мобильный */
@media (max-width: 480px) {
  .character-grid { grid-template-columns: 1fr; }
  .potion-slot { width: 40px; height: 40px; }
}
```

### Мобильные элементы управления

**Джойстик:**
```css
.joystick {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 80px;
  height: 80px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
}

.joystick-knob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
```

**Кнопки способностей:**
```css
.ctrl-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-cream-50);
  font-size: 24px;
  border: none;
  cursor: pointer;
}

.ctrl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Фокус и навигация

**Клавиатурная навигация:**
```css
.keyboard-focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  animation: focusPulse 1s ease-in-out infinite;
}

@keyframes focusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--color-primary-rgb), 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.4); }
}
```

**Прозрачность карточек персонажей:**
```css
.character-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.2));
  backdrop-filter: blur(10px);
}

.character-card.keyboard-focus {
  background: transparent;
  backdrop-filter: none;
}
```

### Система частиц

**Object Pool оптимизация:**
- **Предварительное создание**: 10 частиц при инициализации
- **Переиспользование**: Частицы не создаются/уничтожаются
- **Сброс состояния**: `particle.reset()` для повторного использования

**Типы частиц:**
- **Атака мечом**: Белые частицы с коротким временем жизни
- **Магические снаряды**: Цветные частицы с траекторией
- **Dash эффект**: Быстрые частицы с размытием
- **Получение урона**: Красные частицы с пульсацией

## 🎒 СИСТЕМА ИНВЕНТАРЯ И ПРЕДМЕТОВ

### Структура инвентаря

**Экипировка (4 слота):**
```javascript
gameState.inventory.equipment = [
  null, // Оружие
  null, // Броня
  null, // Аксессуар
  null  // Расходник
];
```

**Рюкзак (20 слотов):**
```javascript
gameState.inventory.backpack = new Array(20).fill(null);
```

### Система предметов

**Структура предмета:**
```javascript
{
  name: string,           // Название предмета
  type: string,           // Тип (weapon, armor, accessory, consumable)
  rarity: string,         // Редкость (common, rare, legendary)
  level: number,          // Уровень предмета
  bonus: {                // Бонусы
    damage?: number,      // Урон
    defense?: number,     // Защита
    maxHp?: number,       // Максимальное здоровье
    heal?: number,        // Восстановление здоровья
    crit?: number,        // Критический урон
    speed?: number        // Скорость
  }
}
```

### Drag & Drop система

**Настройка перетаскивания:**
```javascript
static setupDragDropForSlot(slot, type, index) {
  slot.addEventListener('dragstart', (e) => {
    draggedItem = { type, index };
    slot.classList.add('dragging');
  });
  
  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    this.handleDrop(draggedItem, { type, index });
  });
}
```

**Обработка перетаскивания:**
```javascript
static handleDrop(from, to) {
  if (from.type === 'backpack' && to.type === 'equipment') {
    this.equipItem(from.index);
  } else if (from.type === 'equipment' && to.type === 'backpack') {
    this.unequipItem(from.index);
  }
}
```

### Система бонусов

**Применение бонусов:**
```javascript
static applyItemBonuses(item) {
  if (!item || !item.bonus) return;
  
  Object.entries(item.bonus).forEach(([stat, value]) => {
    switch (stat) {
      case 'damage':
        gameState.player.damage += value;
        break;
      case 'defense':
        gameState.player.defense += value;
        break;
      case 'maxHp':
        gameState.player.maxHp += value;
        break;
      case 'crit':
        gameState.player.crit += value;
        break;
      case 'speed':
        gameState.player.moveSpeed += value;
        break;
    }
  });
}
```

**Удаление бонусов:**
```javascript
static removeItemBonuses(item) {
  if (!item || !item.bonus) return;
  
  Object.entries(item.bonus).forEach(([stat, value]) => {
    switch (stat) {
      case 'damage':
        gameState.player.damage -= value;
        break;
      case 'defense':
        gameState.player.defense -= value;
        break;
      case 'maxHp':
        gameState.player.maxHp -= value;
        break;
      case 'crit':
        gameState.player.crit -= value;
        break;
      case 'speed':
        gameState.player.moveSpeed -= value;
        break;
    }
  });
}
```

### Генерация предметов

**Случайные предметы:**
```javascript
function generateRandomItem(level, characterClass) {
  const itemTypes = ['weapon', 'armor', 'accessory', 'consumable'];
  const rarities = ['common', 'rare', 'legendary'];
  
  const item = {
    name: generateItemName(),
    type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
    rarity: rarities[Math.floor(Math.random() * rarities.length)],
    level: Math.max(1, level - 1 + Math.floor(Math.random() * 3)),
    bonus: generateItemBonus(level, characterClass)
  };
  
  return item;
}
```

**Качество предметов:**
```javascript
// Шанс появления предметов
const baseItemChance = 0.3;
const levelBonus = Math.min(0.4, gameState.level * 0.03);
const itemChance = baseItemChance + levelBonus;

// Качество предметов
const minItemLevel = Math.max(1, gameState.level - 1);
const maxItemLevel = gameState.level + 1; // Предметы могут быть на уровень выше
```

## 👥 СИСТЕМА ПЕРСОНАЖЕЙ И СПОСОБНОСТЕЙ

### Структура персонажей

**Базовые характеристики:**
```javascript
const CHARACTERS = {
  'Dimon': {
    name: 'Dimon',
    class: 'Маг',
    sprite: '🧙‍♂️',
    abilityIcon: '🔥',
    description: 'Могущественный маг, владеющий огненной магией',
    stats: {
      hp: 100,
      maxHp: 100,
      damage: 25,
      defense: 5,
      crit: 15,
      moveSpeed: 2.5,
      attackSpeed: 1.2,
      attackRadius: 120
    },
    ability: {
      name: 'Огненный шар',
      cooldown: 8,
      damage: 50,
      range: 150
    }
  },
  'Andre': {
    name: 'Andre',
    class: 'Воин',
    sprite: '⚔️',
    abilityIcon: '⚡',
    description: 'Отважный воин с мощными атаками',
    stats: {
      hp: 150,
      maxHp: 150,
      damage: 35,
      defense: 15,
      crit: 10,
      moveSpeed: 2.8,
      attackSpeed: 1.0,
      attackRadius: 80
    },
    ability: {
      name: 'Dash',
      cooldown: 5,
      distance: 100,
      duration: 0.3
    }
  },
  'Tim': {
    name: 'Tim',
    class: 'Разбойник',
    sprite: '🗡️',
    abilityIcon: '💨',
    description: 'Быстрый и ловкий разбойник',
    stats: {
      hp: 120,
      maxHp: 120,
      damage: 30,
      defense: 8,
      crit: 25,
      moveSpeed: 3.2,
      attackSpeed: 0.8,
      attackRadius: 60
    },
    ability: {
      name: 'Скрытность',
      cooldown: 12,
      duration: 3,
      invisibility: true
    }
  }
};
```

### Система способностей

**Уникальные способности:**
```javascript
// Dimon - Огненный шар
useFireball() {
  if (this.abilityCooldown > 0) return;
  
  const targetX = this.x + Math.cos(this.angle) * this.ability.range;
  const targetY = this.y + Math.sin(this.angle) * this.ability.range;
  
  const projectile = new Projectile(
    this.x, this.y, targetX, targetY,
    this.ability.damage, 'fireball'
  );
  
  gameState.entities.push(projectile);
  this.abilityCooldown = this.ability.cooldown;
  
  // Звуковой эффект
  audioManager.playFireballAttack();
}

// Andre - Dash
useDash() {
  if (this.abilityCooldown > 0) return;
  
  const dashX = this.x + Math.cos(this.angle) * this.ability.distance;
  const dashY = this.y + Math.sin(this.angle) * this.ability.distance;
  
  this.x = dashX;
  this.y = dashY;
  this.abilityCooldown = this.ability.cooldown;
  
  // Звуковой эффект
  audioManager.playDashSound();
}

// Tim - Скрытность
useStealth() {
  if (this.abilityCooldown > 0) return;
  
  this.isInvisible = true;
  this.abilityCooldown = this.ability.cooldown;
  
  setTimeout(() => {
    this.isInvisible = false;
  }, this.ability.duration * 1000);
}
```

### Система кулдаунов

**Визуальные индикаторы:**
```css
.ability-cooldown {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.ability-cooldown::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--color-primary) calc(var(--progress) * 360deg),
    transparent calc(var(--progress) * 360deg)
  );
  border-radius: inherit;
  mask: radial-gradient(circle at center, transparent 30%, black 31%);
}
```

**Обновление кулдаунов:**
```javascript
static updateAbilityCooldown() {
  if (!gameState.player) return;
  
  if (gameState.player.abilityCooldown > 0) {
    gameState.player.abilityCooldown -= gameState.deltaTime;
  }
  
  // Обновляем UI
  const cooldownText = document.querySelector('.cooldown-text');
  if (cooldownText) {
    const cooldown = Math.max(0, gameState.player.abilityCooldown);
    cooldownText.textContent = cooldown > 0 ? `${cooldown.toFixed(1)}s` : 'Готов';
  }
}
```

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Константы и настройки

**Размеры и масштабы:**
```javascript
const TILE_SIZE = 32;          // Размер тайла в пикселях
const MAP_SIZE = 50;           // Размер карты в тайлах
const FPS_TARGET = 60;         // Целевой FPS
const FRAME_TIME = 1000 / FPS_TARGET; // Время кадра
```

**Параметры генерации:**
```javascript
const ROOM_MIN_SIZE = 6;       // Минимальный размер комнаты
const ROOM_MAX_SIZE = 12;      // Максимальный размер комнаты
const MIN_ROOMS = 8;           // Минимальное количество комнат
const MAX_ROOMS = 12;          // Максимальное количество комнат
```

### Система координат

**Мировые координаты:**
- **Игрок**: `player.x, player.y` (в пикселях)
- **Камера**: `camera.x, camera.y` (в пикселях)
- **Сущности**: `entity.x, entity.y` (в пикселях)

**Координаты тайлов:**
- **Перевод в тайлы**: `Math.floor(worldX / TILE_SIZE)`
- **Перевод в мир**: `tileX * TILE_SIZE`
- **Центр тайла**: `(tileX + 0.5) * TILE_SIZE`

**Экранные координаты:**
- **Расчет**: `worldX - camera.x`
- **Масштабирование**: `screenX * DPR` (для Retina дисплеев)

### Оптимизация производительности

**Ключевые оптимизации:**
1. **Отрисовка только видимых тайлов** - расчет видимого диапазона
2. **Object Pool для частиц** - избежание создания/уничтожения объектов
3. **Кэширование результатов коллизий** - для статичных объектов
4. **Ограничение дельта-времени** - предотвращение больших скачков
5. **Условный рендеринг** - только при необходимости

**Профилирование:**
- **FPS мониторинг**: Отслеживание производительности
- **Счетчик объектов**: Мониторинг количества сущностей
- **Время рендеринга**: Измерение времени отрисовки

## 📋 ЧЕКЛИСТ РАЗРАБОТКИ

### При добавлении новых механик:

1. **Документировать алгоритм** - описать принцип работы
2. **Указать технические параметры** - константы и настройки
3. **Описать оптимизации** - как избежать проблем с производительностью
4. **Добавить в систему координат** - как интегрировать с существующей системой
5. **Обновить рендеринг** - как отображать новую механику

### При изменении существующих механик:

1. **Проверить совместимость** - не сломать существующие системы
2. **Обновить документацию** - отразить изменения
3. **Протестировать производительность** - убедиться в отсутствии регрессий
4. **Проверить все зависимости** - карта, туман войны, миникарта

### При отладке проблем:

1. **Проверить систему координат** - правильность переводов
2. **Убедиться в корректности тумана войны** - видимость и исследование
3. **Проверить коллизии** - корректность проверок стен
4. **Протестировать производительность** - FPS и использование памяти

## 🎯 КЛЮЧЕВЫЕ АЛГОРИТМЫ

### Генерация подземелий (BSP)
```javascript
// 1. Разделение пространства
while (partitions.length < MAX_ROOMS) {
  const partition = partitions.splice(randomIndex, 1)[0];
  const split = splitPartition(partition);
  if (split) partitions.push(split.left, split.right);
}

// 2. Создание комнат
partitions.forEach(partition => {
  const room = createRoomInPartition(partition);
  if (room) {
    rooms.push(room);
    carveRoom(map, room);
  }
});

// 3. Соединение коридорами
for (let i = 1; i < rooms.length; i++) {
  createCorridor(map, rooms[i - 1], rooms[i]);
}
```

### Обновление тумана войны
```javascript
// 1. Очистка видимости
visible.forEach(row => row.fill(false));

// 2. Круговое сканирование
for (let dy = -radius; dy <= radius; dy++) {
  for (let dx = -radius; dx <= radius; dx++) {
    const distance = Math.hypot(dx, dy);
    if (distance <= radius) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;
      
      if (tileX >= 0 && tileX < MAP_SIZE && tileY >= 0 && tileY < MAP_SIZE) {
        visible[tileY][tileX] = true;
        explored[tileY][tileX] = true;
      }
    }
  }
}
```

### Отрисовка карты с оптимизацией
```javascript
// 1. Расчет видимого диапазона
const startX = Math.floor(camera.x / TILE_SIZE) - 1;
const endX = Math.floor((camera.x + canvas.width / DPR) / TILE_SIZE) + 1;

// 2. Отрисовка только видимых тайлов
for (let y = Math.max(0, startY); y < Math.min(MAP_SIZE, endY); y++) {
  for (let x = Math.max(0, startX); x < Math.min(MAP_SIZE, endX); x++) {
    const screenX = x * TILE_SIZE - camera.x;
    const screenY = y * TILE_SIZE - camera.y;
    
    if (map[y][x] === 1) {
      // Отрисовка стены
    } else {
      // Отрисовка пола
    }
  }
}
```

### Система банок здоровья
```javascript
// 1. Автоматическое обнаружение
static updateHealthPotions() {
  let healthPotionCount = 0;
  
  // Проверяем рюкзак
  gameState.inventory.backpack.forEach(item => {
    if (item && item.bonus && item.bonus.heal) {
      healthPotionCount++;
    }
  });
  
  // Проверяем экипировку
  if (gameState.inventory.equipment[3] && 
      gameState.inventory.equipment[3].bonus && 
      gameState.inventory.equipment[3].bonus.heal) {
    healthPotionCount++;
  }
  
  // Обновляем UI
  potionCount.textContent = healthPotionCount;
  potionSlot.classList.toggle('empty', healthPotionCount === 0);
}

// 2. Использование банок
static useHealthPotion() {
  // Ищем банку в рюкзаке
  for (let i = 0; i < gameState.inventory.backpack.length; i++) {
    const item = gameState.inventory.backpack[i];
    if (item && item.bonus && item.bonus.heal) {
      // Используем банку
      gameState.player.hp = Math.min(gameState.player.maxHp, 
                                     gameState.player.hp + item.bonus.heal);
      
      // Удаляем банку из инвентаря
      gameState.inventory.backpack[i] = null;
      
      // Воспроизводим звук
      audioManager.playHealthPotion();
      
      // Обновляем UI
      this.updateHealthPotions();
      return;
    }
  }
}
```

### Система фоновых изображений
```css
/* Фоновые изображения для экранов */
.menu-background,
.select-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.menu-background {
  background-image: url('Assets/Main.png');
}

.select-background {
  background-image: url('Assets/Characters.png');
}

/* Контейнеры контента */
.menu-content,
.select-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

### Аудио система v2.0
```javascript
// 1. Автоматическая инициализация
async init() {
  await this.loadMusicTracks();
  await this.loadSfxTracks();
  this.setupAudioResumeHandlers();
  
  setTimeout(() => {
    this.createAudioContextAndPlay();
  }, 1000);
}

// 2. Система возобновления
setupAudioResumeHandlers() {
  const resumeAudio = () => {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.currentMusic && this.currentMusic.paused && gameState.audio.enabled) {
      this.currentMusic.play();
    }
  };

  ['click', 'touchstart', 'keydown', 'mousedown'].forEach(event => {
    document.addEventListener(event, resumeAudio, { once: false });
  });
}

// 3. Интеграция с игровыми событиями
playSwordAttack() {
  this.playSfx('sword');
}

playDaggerAttack() {
  this.playSfx('Dagger');
}

playFireballAttack() {
  this.playSfx('Fireball');
}

playHealthPotion() {
  this.playSfx('health_potion');
}
```

Эта документация обеспечивает полное понимание всех механик игры, включая новые системы фоновых изображений, аудио систему v2.0, систему банок здоровья и улучшенную систему здоровья. Все системы полностью интегрированы и готовы к использованию.

## 🧪 ТЕСТИРОВАНИЕ И ОТЛАДКА

### Система логирования

**Подробное логирование:**
```javascript
// Аудио система
console.log('🎵 Audio system initialization complete');
console.log('🎵 Auto-starting main music after audio context creation...');
console.log('🧪 Used health potion: +${item.bonus.heal} HP (${gameState.player.hp}/${gameState.player.maxHp})');

// Игровые события
console.log('🎮 Level ${gameState.level} completed');
console.log('🎮 Enemy spawned: ${enemy.type} at (${enemy.x}, ${enemy.y})');
console.log('🎮 Item dropped: ${item.name} at (${item.x}, ${item.y})');
```

### Отладочные инструменты

**FPS мониторинг:**
```javascript
let frameCount = 0;
let lastTime = performance.now();

function updateFPS(currentTime) {
  frameCount++;
  
  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastTime = currentTime;
  }
}
```

**Профилирование производительности:**
```javascript
// Измерение времени рендеринга
const renderStart = performance.now();
render();
const renderTime = performance.now() - renderStart;

if (renderTime > 16.67) { // Больше 60 FPS
  console.warn(`Slow render: ${renderTime.toFixed(2)}ms`);
}
```

### Тестовые страницы

**Структура тестов:**
```
test_ability_buttons.html          # Тест кнопок способностей
test_context_menu.html             # Тест контекстных меню
test_desktop_ability_button.html   # Тест десктопных кнопок
test_inventory_drag_drop.html      # Тест перетаскивания в инвентаре
test_local.html                    # Локальные тесты
```

### Чеклист тестирования

**Функциональное тестирование:**
- [ ] Аудио система работает автоматически
- [ ] Банки здоровья обнаруживаются и используются
- [ ] Фоновые изображения отображаются корректно
- [ ] Адаптивность работает на разных экранах
- [ ] Система здоровья работает правильно
- [ ] Предметы генерируются и применяются
- [ ] Способности персонажей работают
- [ ] Инвентарь сохраняется между уровнями

**Производительность:**
- [ ] FPS стабильно 60 на десктопе
- [ ] FPS стабильно 30+ на мобильных
- [ ] Нет утечек памяти
- [ ] Плавная анимация камеры
- [ ] Оптимизированная отрисовка карты

**Совместимость:**
- [ ] Работает в Chrome/Edge/Firefox
- [ ] Работает на iOS Safari
- [ ] Работает на Android Chrome
- [ ] Поддерживает Retina дисплеи
- [ ] Работает без интернета (offline)

### Известные проблемы и решения

**Аудио в браузерах:**
- **Проблема**: Браузеры блокируют автовоспроизведение
- **Решение**: Система возобновления аудио при взаимодействии

**Мобильная производительность:**
- **Проблема**: Низкий FPS на слабых устройствах
- **Решение**: Адаптивная отрисовка и ограничение эффектов

**Память:**
- **Проблема**: Утечки при длительной игре
- **Решение**: Object Pool для частиц и сущностей

### Рекомендации по разработке

1. **Всегда тестируйте на мобильных устройствах** - производительность критична
2. **Используйте логирование** - помогает отлаживать проблемы
3. **Следите за FPS** - игровой опыт зависит от плавности
4. **Тестируйте аудио** - проверяйте работу на разных устройствах
5. **Проверяйте адаптивность** - UI должен работать на всех экранах

Эта документация является полным руководством по всем системам игры и поможет избежать проблем при дальнейшей разработке. 