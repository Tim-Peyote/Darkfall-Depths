#!/bin/bash

echo "🎮 Запуск Darkfall Depths с очисткой кэша..."

# Убиваем процессы на порту 8000
echo "🔧 Очистка порта 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Ждем немного
sleep 1

# Запускаем сервер
echo "🚀 Запуск HTTP сервера на порту 8000..."
echo "📱 Откройте http://localhost:8000 в браузере"
echo "💡 Для очистки кэша браузера нажмите Ctrl+Shift+R (или Cmd+Shift+R на Mac)"
echo ""
echo "🔍 Для проверки технологий откройте:"
echo "   - http://localhost:8000/test_webgl.html"
echo "   - http://localhost:8000/test_performance.html"
echo ""

python3 -m http.server 8000
