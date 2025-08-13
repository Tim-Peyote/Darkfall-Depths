@echo off
chcp 65001 >nul
title Darkfall Depths - Запускатор игры

echo.
echo 🎮 Darkfall Depths - Запускатор игры
echo ======================================


REM Проверяем, что мы в правильной директории
if not exist "index.html" (
    echo ❌ Ошибка: index.html не найден в текущей директории
    echo 💡 Убедитесь, что вы запускаете скрипт из папки с игрой
    echo.
    pause
    exit /b 1
)

REM Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Ошибка: Python не найден
    echo 💡 Установите Python с официального сайта: https://python.org
    echo.
    pause
    exit /b 1
)

REM Проверяем, не занят ли порт 8000
netstat -an | findstr ":8000" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo ⚠️  Порт 8000 уже занят
    echo 🔄 Останавливаем предыдущий сервер...
    taskkill /f /im python.exe >nul 2>&1
    timeout /t 2 >nul
)

echo 🚀 Запускаем HTTP сервер...
echo 📡 Адрес: http://localhost:8000
echo.

REM Запускаем сервер в фоне
start /b python -m http.server 8000

REM Ждем немного, чтобы сервер запустился
timeout /t 3 >nul

REM Проверяем, что сервер запустился
netstat -an | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo ❌ Ошибка: Не удалось запустить сервер
    echo.
    pause
    exit /b 1
)

echo ✅ Сервер успешно запущен!
echo 🌐 Открываем браузер...

REM Открываем браузер
start http://localhost:8000

echo.
echo 🎮 Игра запущена!
echo 📋 Управление:
echo    • Игра откроется в браузере автоматически
echo    • Для остановки закройте это окно
echo    • Сервер автоматически остановится при выходе
echo.

echo Нажмите любую клавишу для остановки сервера...
echo Или просто закройте это окно
pause >nul

echo.
echo 🛑 Останавливаем сервер...
taskkill /f /im python.exe >nul 2>&1
echo ✅ Сервер остановлен
echo 👋 Спасибо за игру!
timeout /t 3 >nul 