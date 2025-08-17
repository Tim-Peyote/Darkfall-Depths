/* Darkfall Depths - Управление вводом */

import { gameState } from '../core/GameState.js';
import { IS_MOBILE } from '../config/constants.js';

export class InputManager {
  static qPressed = false; // Флаг для предотвращения повторных нажатий Q
  
  static init() {
    // Принудительно блокируем скролл при загрузке
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Предотвращение скролла только в игре
    document.addEventListener('keydown', (e) => {
      // Блокируем скролл только когда мы в игре
      if (gameState.screen === 'game' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Предотвращение скролла на мобильных только в игровом экране
    document.addEventListener('touchmove', (e) => {
      // Разрешаем прокрутку в инвентаре
      const inventoryOverlay = document.getElementById('inventoryOverlay');
      if (inventoryOverlay && !inventoryOverlay.classList.contains('hidden')) {
        // Проверяем, что touch событие происходит внутри инвентаря или его элементов
        if (inventoryOverlay.contains(e.target)) {
          return; // Разрешаем прокрутку в инвентаре
        }
      }
      
      // Блокируем скролл только в игровом экране
      if (gameState.screen === 'game') {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Клавиатура - только для игры
    window.addEventListener('keydown', (e) => {
      // Обрабатываем только в игре
      if (gameState.screen !== 'game') return;
      
      gameState.input.keys[e.code] = true;
      
      // Блокируем скролл только в игре
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.player && gameState.player.hasDash) {
          gameState.player.performDash();
        }
      }
      // ESC теперь обрабатывается в MenuNavigationManager
      if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault();
        // Открываем/закрываем инвентарь только в игре
        // НО не открываем во время паузы (можно только закрыть)
        if (gameState.screen === 'game') {
          (async () => {
            const { InventoryManager } = await import('../ui/InventoryManager.js');
            await InventoryManager.toggleInventory();
          })();
        }
      }
      if (e.code === 'Digit1') {
        e.preventDefault();
        (async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.useQuickPotion(0);
        })();
      }
      
      if (e.code === 'Digit2') {
        e.preventDefault();
        (async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.useQuickPotion(1);
        })();
      }
      
      if (e.code === 'Digit3') {
        e.preventDefault();
        (async () => {
          const { GameEngine } = await import('../game/GameEngine.js');
          GameEngine.useQuickPotion(2);
        })();
      }
      
      if (e.code === 'KeyQ' && !this.qPressed) {
        e.preventDefault();
        this.qPressed = true; // Устанавливаем флаг
        
        if (gameState.screen === 'game' && gameState.player && !gameState.isPaused) {
          // Активируем уникальную способность персонажа
          if (gameState.player.hasDash) {
            gameState.player.performDash();
          } else if (gameState.player.hasShield) {
            gameState.player.performShield();
          } else if (gameState.player.hasBlast) {
            gameState.player.performBlast();
          }
        }
      }
    });
    
    window.addEventListener('keyup', (e) => {
      // Обрабатываем только в игре
      if (gameState.screen !== 'game') return;
      gameState.input.keys[e.code] = false;
      
      // Сбрасываем флаг Q при отпускании клавиши
      if (e.code === 'KeyQ') {
        this.qPressed = false;
      }
    });
    
    // Мобильное управление
    this.initTouchControls();
  }
  
  static initTouchControls() {
    if (!IS_MOBILE) return;
    
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
      mobileControls.classList.remove('hidden');
    }
    
    const joystickContainer = document.getElementById('joystickContainer');
    const joystickKnob = document.getElementById('joystickKnob');
    
    // Инициализация джойстика
    if (joystickContainer && joystickKnob) {
      // Джойстик
      joystickContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.input.joystick.active = true;
        const rect = joystickContainer.getBoundingClientRect();
        gameState.input.joystick.x = rect.left + rect.width / 2;
        gameState.input.joystick.y = rect.top + rect.height / 2;
      }, { passive: false });
      
      joystickContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!gameState.input.joystick.active) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - gameState.input.joystick.x;
        const dy = touch.clientY - gameState.input.joystick.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = 50;
        
        if (distance <= maxDistance) {
          gameState.input.joystick.dx = dx / maxDistance;
          gameState.input.joystick.dy = dy / maxDistance;
          joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        } else {
          gameState.input.joystick.dx = dx / distance;
          gameState.input.joystick.dy = dy / distance;
          joystickKnob.style.transform = `translate(${(dx / distance) * maxDistance}px, ${(dy / distance) * maxDistance}px)`;
        }
      }, { passive: false });
      
      joystickContainer.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.input.joystick.active = false;
        gameState.input.joystick.dx = 0;
        gameState.input.joystick.dy = 0;
        joystickKnob.style.transform = 'translate(0px, 0px)';
      }, { passive: false });
    }
    
    // Кнопка способности (работает независимо от джойстика)
    const abilityBtn = document.getElementById('abilityBtn');
    if (abilityBtn) {
      // Обработчик для мобильных устройств
      abilityBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        // Проверяем, что игра не в паузе
        if (gameState.isPaused) {
          console.log('Ability button clicked during pause - ignoring');
          return;
        }
        
        if (gameState.player) {
          if (gameState.player.hasDash && gameState.player.dashCooldown <= 0) {
            gameState.player.performDash();
          } else if (gameState.player.hasShield && gameState.player.shieldCooldown <= 0) {
            gameState.player.performShield();
          } else if (gameState.player.hasBlast && gameState.player.blastCooldown <= 0) {
            gameState.player.performBlast();
          }
        }
      }, { passive: false });
      
      // Обработчик для десктопа (на случай если игра запущена в браузере на десктопе)
      abilityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Проверяем, что игра не в паузе
        if (gameState.isPaused) {
          console.log('Ability button clicked during pause - ignoring');
          return;
        }
        
        if (gameState.player) {
          if (gameState.player.hasDash && gameState.player.dashCooldown <= 0) {
            gameState.player.performDash();
          } else if (gameState.player.hasShield && gameState.player.shieldCooldown <= 0) {
            gameState.player.performShield();
          } else if (gameState.player.hasBlast && gameState.player.blastCooldown <= 0) {
            gameState.player.performBlast();
          }
        }
      });
      
      // Обновление состояния кнопки способности
      setInterval(() => {
        if (gameState.player) {
          let cooldown = 0;
          let maxCooldown = 1;
          let abilityName = '';
          
          if (gameState.player.hasDash) {
            cooldown = gameState.player.dashCooldown;
            maxCooldown = 3.0;
            abilityBtn.innerHTML = '💨';
            abilityBtn.title = 'Dash (Q)';
            abilityName = 'Dash';
          } else if (gameState.player.hasShield) {
            cooldown = gameState.player.shieldCooldown;
            maxCooldown = 8.0;
            abilityBtn.innerHTML = '🛡️';
            abilityBtn.title = 'Щит (Q)';
            abilityName = 'Shield';
          } else if (gameState.player.hasBlast) {
            cooldown = gameState.player.blastCooldown;
            maxCooldown = 12.0;
            abilityBtn.innerHTML = '💥';
            abilityBtn.title = 'Взрыв (Q)';
            abilityName = 'Blast';
          }
          
          const cooldownPercent = (cooldown / maxCooldown) * 100;
          abilityBtn.style.setProperty('--cooldown-width', cooldownPercent + '%');
          abilityBtn.disabled = cooldown > 0;
          
          // Обновляем встроенный индикатор отката на кнопке
          if (cooldown > 0) {
            abilityBtn.style.setProperty('--cooldown-width', cooldownPercent + '%');
            abilityBtn.style.opacity = '0.6';
          } else {
            abilityBtn.style.setProperty('--cooldown-width', '0%');
            abilityBtn.style.opacity = '1';
          }
          
          // Показываем кнопку только если у игрока есть способность
          if (gameState.player.hasDash || gameState.player.hasShield || gameState.player.hasBlast) {
            abilityBtn.style.display = 'flex';
          } else {
            abilityBtn.style.display = 'none';
          }
        }
      }, 100);
    }
  }
} 