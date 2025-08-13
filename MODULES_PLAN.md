# 📋 План модулизации app.js

## Структура модулей

### 1. `config/constants.js`
- Константы игры (TILE_SIZE, MAP_SIZE, FPS_TARGET, etc.)
- Игровые данные (CHARACTERS, ENEMY_TYPES)
- Функция generateRandomItem

### 2. `core/GameState.js`
- Глобальное состояние игры (gameState)
- Утилиты (Utils)

### 3. `audio/AudioManager.js`
- Класс AudioManager (уже реализован)
- Все аудио функции

### 4. `core/ObjectPool.js`
- Класс ObjectPool
- Система пулинга объектов

### 5. `map/MapGenerator.js`
- Класс MapGenerator
- Генерация подземелий

### 6. `map/FogOfWar.js`
- Класс FogOfWar
- Система тумана войны

### 7. `entities/Entity.js`
- Базовый класс Entity
- Общие методы для всех сущностей

### 8. `entities/Player.js`
- Класс Player
- Логика игрока

### 9. `entities/Enemy.js`
- Класс Enemy
- Логика врагов

### 10. `entities/Projectile.js`
- Классы Projectile и EnemyProjectile
- Логика снарядов

### 11. `entities/DroppedItem.js`
- Класс DroppedItem
- Логика предметов

### 12. `entities/Portal.js`
- Класс Portal
- Логика порталов

### 13. `effects/Particle.js`
- Класс Particle
- Система частиц

### 14. `input/InputManager.js`
- Класс InputManager
- Управление вводом
- Хоткеи для банок здоровья (1/Q)

### 15. `ui/ScreenManager.js`
- Функции переключения экранов
- UI логика

### 16. `ui/InventoryManager.js`
- Управление инвентарем
- Drag & Drop
- Система бонусов предметов
- Интеграция с системой банок здоровья

### 17. `ui/RecordsManager.js`
- Система рекордов
- Сохранение/загрузка

### 18. `ui/SettingsManager.js`
- Настройки игры
- Сохранение настроек

### 19. `game/GameEngine.js`
- Игровой цикл
- Основная логика игры
- Система банок здоровья
- Обновление UI

### 20. `game/LevelManager.js`
- Генерация уровней
- Управление уровнями
- Система прогрессии врагов
- Восстановление здоровья между уровнями

### 21. `utils/Utils.js`
- Вспомогательные функции
- Утилиты

### 22. `main.js`
- Точка входа
- Инициализация всех модулей

## Порядок создания:

1. Создать папку `js/` с подпапками
2. Создать каждый модуль по отдельности
3. Обновить `index.html` для загрузки модулей
4. Протестировать каждый модуль
5. Удалить старый `app.js`

## Зависимости:

```
main.js
├── config/constants.js
├── core/GameState.js
├── audio/AudioManager.js
├── core/ObjectPool.js
├── map/MapGenerator.js
├── map/FogOfWar.js
├── entities/Entity.js
├── entities/Player.js
├── entities/Enemy.js
├── entities/Projectile.js
├── entities/DroppedItem.js
├── entities/Portal.js
├── effects/Particle.js
├── input/InputManager.js
├── ui/ScreenManager.js
├── ui/InventoryManager.js
├── ui/RecordsManager.js
├── ui/SettingsManager.js
├── game/GameEngine.js
├── game/LevelManager.js
└── utils/Utils.js
```

## 🆕 Новые системы (после рефакторинга)

### Система прогрессии
- **Сохранение инвентаря** между уровнями
- **Масштабирование врагов** с уровнем сложности
- **Улучшение предметов** по мере прогресса
- **Восстановление здоровья** при переходе на следующий уровень

### Система банок здоровья
- **Автоматическое обнаружение** банок в инвентаре
- **Хоткеи (1/Q)** для быстрого использования
- **Визуальные индикаторы** в нижнем левом углу
- **Интеграция с UI** и системой предметов

### Улучшенная аудио система
- **Автоматическое воспроизведение** с обходом ограничений браузера
- **Адаптивные треки** (Main.mp3 для меню, stage1.mp3 для игры)
- **Подробное логирование** для отладки
- **Система возобновления** после приостановки 