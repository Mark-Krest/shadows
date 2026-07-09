document.addEventListener('DOMContentLoaded', function() {
    
    // Загружаем данные из памяти браузера
    var stats = JSON.parse(localStorage.getItem('readingStats')) || { totalSeconds: 0, finishedIds: [] };
    // Если у старых пользователей есть totalMinutes (от прошлых версий), переносим их в секунды
    if (stats.totalMinutes && !stats.totalSeconds) {
        stats.totalSeconds = stats.totalMinutes * 60;
        localStorage.setItem('readingStats', JSON.stringify(stats));
    }
    // Настройка темы
    var currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    var themeSel = document.getElementById('theme-selector-stats');
    if (themeSel) {
        themeSel.value = currentTheme;
        themeSel.addEventListener('change', function(e) {
            document.documentElement.setAttribute('data-theme', e.target.value);
            localStorage.setItem('theme', e.target.value);
        });
    }
    // Получаем значения
    var finishedCount = stats.finishedIds.length;
    var totalSeconds = stats.totalSeconds || 0;

    // Функция для красивого форматирования времени (например, "4 мин 36 сек" или "1 мин 05 сек")
    function formatTime(totalSec) {
        var mins = Math.floor(totalSec / 60);
        var secs = totalSec % 60;
        var secsStr = secs < 10 ? '0' + secs : secs; // Добавляем ноль спереди, если секунд меньше 10
        
        if (mins === 0) {
            return secs + ' сек'; // Если прочитал меньше минуты
        }
        return mins + ' мин ' + secsStr + ' сек';
    }
    // Функция анимации счета теперь работает с текстом, а не просто цифрами
    function animateTime(element, endSeconds) {
        var startSeconds = 0;
        var duration = 1000; // 1 секунда анимации
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progressStep = Math.min((timestamp - startTime) / duration, 1);
            
            // Высчитываем текущее время для анимации
            var currentSec = Math.floor(progressStep * endSeconds);
            element.textContent = formatTime(currentSec);
            
            if (progressStep < 1) {
                requestAnimationFrame(step);
            } else {
                // В конце ставим точное финальное значение
                element.textContent = formatTime(endSeconds);
            }
        }
        requestAnimationFrame(step);
    }
    // Анимация для количества рассказов (остается как было)
    function animateValue(element, endValue) {
        var startValue = 0;
        var duration = 1000;
        var startTime = null;
        
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progressStep = Math.min((timestamp - startTime) / duration, 1);
            element.textContent = Math.floor(progressStep * endValue);
            if (progressStep < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = endValue;
            }
        }
        requestAnimationFrame(step);
    }
    // Запускаем анимации
    setTimeout(function() {
        animateTime(document.getElementById('total-time'), totalSeconds);
        animateValue(document.getElementById('total-stories'), finishedCount);
    }, 300);
    // Отрисовка списка завершенных рассказов
    var finishedList = document.getElementById('finished-list');
    var finishedHTML = '';
    var hasFinished = false;
    for (var i = 0; i < STORIES.length; i++) {
        var story = STORIES[i];
        if (stats.finishedIds.indexOf(story.id) !== -1) {
            hasFinished = true;
            finishedHTML += 
                '<div class="finished-item">' +
                    '<div>' +
                        '<div class="fi-title">' + story.title + '</div>' +
                        '<div class="fi-genre">' + story.genre + '</div>' +
                    '</div>' +
                    '<div class="fi-badge">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                        'Прочитано' +
                    '</div>' +
                '</div>';
        }
    }
    if (!hasFinished) {
        finishedList.innerHTML = '<p style="color: var(--text-secondary);">Вы еще не завершили ни одного рассказа.</p>';
    } else {
        finishedList.innerHTML = finishedHTML;
    }
});
