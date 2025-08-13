/* Darkfall Depths - Навигация по меню с клавиатуры */

import { gameState } from '../core/GameState.js';

export class MenuNavigationManager {
  static currentFocusIndex = 0;
  static focusableElements = [];
  
  static init() {
    console.log('🎯 Initializing menu navigation...');
    
    // Добавляем обработчики клавиатуры для навигации по меню
    window.addEventListener('keydown', (e) => {
      // Не обрабатываем в игре когда НЕ в паузе, НО обрабатываем ESC всегда
      if (gameState.screen === 'game' && !gameState.isPaused && e.code !== 'Escape') return;
      
      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault();
          this.navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateRight();
          break;
        case 'Enter':
        case 'Space':
          e.preventDefault();
          this.activateCurrentElement();
          break;
        case 'Escape':
          e.preventDefault();
          this.handleEscape();
          break;
      }
    });
  }
  
  static updateFocusableElements() {
    this.focusableElements = [];
    this.currentFocusIndex = 0;
    
    // Получаем все фокусируемые элементы на текущем экране
    const currentScreen = document.querySelector('.screen.active');
    if (!currentScreen) return;
    
    const buttons = currentScreen.querySelectorAll('button, input[type="range"], .character-card');
    buttons.forEach((button, index) => {
      if (button.offsetParent !== null) { // Проверяем, что элемент видим
        // Исключаем игровые кнопки из навигации на всех экранах
        if (button.id === 'inventoryToggle' || button.id === 'pauseBtn') {
          button.setAttribute('tabindex', '-1'); // Принудительно убираем из навигации
          return; // Пропускаем игровые кнопки везде
        }
        this.focusableElements.push(button);
        button.setAttribute('tabindex', index === 0 ? '0' : '-1');
      }
    });
    
    // Устанавливаем фокус на первый элемент
    if (this.focusableElements.length > 0) {
      this.setFocus(0);
    }
  }
  
  static setFocus(index) {
    // Убираем фокус со всех элементов
    this.focusableElements.forEach(el => {
      el.classList.remove('keyboard-focus');
      el.setAttribute('tabindex', '-1');
    });
    
    // Устанавливаем фокус на выбранный элемент
    if (this.focusableElements[index]) {
      this.focusableElements[index].classList.add('keyboard-focus');
      this.focusableElements[index].setAttribute('tabindex', '0');
      this.focusableElements[index].focus();
      this.currentFocusIndex = index;
    }
  }
  
  static navigateUp() {
    if (this.focusableElements.length === 0) return;
    
    let newIndex = this.currentFocusIndex - 1;
    if (newIndex < 0) {
      newIndex = this.focusableElements.length - 1;
    }
    this.setFocus(newIndex);
  }
  
  static navigateDown() {
    if (this.focusableElements.length === 0) return;
    
    let newIndex = this.currentFocusIndex + 1;
    if (newIndex >= this.focusableElements.length) {
      newIndex = 0;
    }
    this.setFocus(newIndex);
  }
  
  static navigateLeft() {
    // Для экрана выбора персонажа - навигация по карточкам
    if (gameState.screen === 'select') {
      const characterCards = document.querySelectorAll('.character-card');
      if (characterCards.length > 0) {
        let currentCardIndex = -1;
        characterCards.forEach((card, index) => {
          if (card.classList.contains('keyboard-focus')) {
            currentCardIndex = index;
          }
        });
        
        if (currentCardIndex > 0) {
          this.setFocus(currentCardIndex - 1);
        } else if (currentCardIndex === 0) {
          this.setFocus(characterCards.length - 1);
        }
      }
    } else {
      // Для слайдеров громкости
      const currentElement = this.focusableElements[this.currentFocusIndex];
      if (currentElement && currentElement.type === 'range') {
        const step = 0.1;
        const newValue = Math.max(0, parseFloat(currentElement.value) - step);
        currentElement.value = newValue;
        this.triggerSliderChange(currentElement);
        this.updateSliderText(currentElement);
        this.updateAudioSettings(currentElement, newValue);
        this.saveAudioSettings();
      }
    }
  }
  
  static navigateRight() {
    // Для экрана выбора персонажа - навигация по карточкам
    if (gameState.screen === 'select') {
      const characterCards = document.querySelectorAll('.character-card');
      if (characterCards.length > 0) {
        let currentCardIndex = -1;
        characterCards.forEach((card, index) => {
          if (card.classList.contains('keyboard-focus')) {
            currentCardIndex = index;
          }
        });
        
        if (currentCardIndex < characterCards.length - 1) {
          this.setFocus(currentCardIndex + 1);
        } else if (currentCardIndex === characterCards.length - 1) {
          this.setFocus(0);
        }
      }
    } else {
      // Для слайдеров громкости
      const currentElement = this.focusableElements[this.currentFocusIndex];
      if (currentElement && currentElement.type === 'range') {
        const step = 0.1;
        const newValue = Math.min(1, parseFloat(currentElement.value) + step);
        currentElement.value = newValue;
        this.triggerSliderChange(currentElement);
        this.updateSliderText(currentElement);
        this.updateAudioSettings(currentElement, newValue);
        this.saveAudioSettings();
      }
    }
  }
  
  static activateCurrentElement() {
    const currentElement = this.focusableElements[this.currentFocusIndex];
    if (currentElement) {
      if (currentElement.type === 'range') {
        // Для слайдеров ничего не делаем при Enter
        return;
      }
      
      // Симулируем клик
      currentElement.click();
    }
  }
  
  static handleEscape() {
    // Если мы в игре - переключаем паузу (открываем/закрываем)
    if (gameState.screen === 'game') {
      (async () => {
        const { ScreenManager } = await import('./ScreenManager.js');
        await ScreenManager.togglePause();
      })();
      return;
    }
    
    switch (gameState.screen) {
      case 'select':
        // Возврат в главное меню
        (async () => {
          const { ScreenManager } = await import('./ScreenManager.js');
          ScreenManager.switchScreen('menu');
        })();
        break;
      case 'records':
      case 'settings':
        // Возврат в главное меню
        (async () => {
          const { ScreenManager } = await import('./ScreenManager.js');
          ScreenManager.switchScreen('menu');
        })();
        break;
      case 'menu':
        // На главном меню Escape ничего не делает
        break;
    }
  }
  
  static triggerSliderChange(slider) {
    // Создаем событие change для слайдера
    const event = new Event('input', { bubbles: true });
    slider.dispatchEvent(event);
  }
  
  static refreshNavigation() {
    // Обновляем навигацию при изменении экрана
    setTimeout(() => {
      this.updateFocusableElements();
    }, 100);
  }
  
  static updateSliderText(slider) {
    // Обновляем текст рядом со слайдером
    const sliderId = slider.id;
    const textElement = document.getElementById(sliderId + 'Text');
    if (textElement) {
      const value = parseFloat(slider.value);
      textElement.textContent = Math.round(value * 100) + '%';
    }
  }
  
  static updateAudioSettings(slider, value) {
    // Обновляем настройки звука в gameState
    const sliderId = slider.id;
    
    switch (sliderId) {
      case 'pauseMasterVol':
      case 'masterVol':
        gameState.audio.masterVolume = value;
        break;
      case 'pauseMusicVol':
      case 'musicVol':
        gameState.audio.musicVolume = value;
        break;
      case 'pauseSfxVol':
      case 'sfxVol':
        gameState.audio.sfxVolume = value;
        break;
    }
    
    // Обновляем громкость музыки
    (async () => {
      const { audioManager } = await import('../audio/AudioManager.js');
      audioManager.updateMusicVolume();
    })();
  }
  
  static saveAudioSettings() {
    // Сохраняем настройки звука
    (async () => {
      const { SettingsManager } = await import('./SettingsManager.js');
      SettingsManager.saveSettings();
    })();
  }
} 