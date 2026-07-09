document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Загружаем данные из памяти
    var stats = JSON.parse(localStorage.getItem('readingStats')) || { finishedIds: [] };

    // 2. ОДНОРАЗОВАЯ МИГРАЦИЯ ДАННЫХ
    // Если есть старые минуты, переносим их в секунды и НАВСЕГДА удаляем переменную totalMinutes
    if (typeof stats.totalMinutes !== 'undefined') {
        if (typeof stats.totalSeconds === 'undefined') {
            stats.totalSeconds = stats.totalMinutes * 60;
        }
        // Удаляем totalMinutes из объекта, чтобы она больше никогда не мешала
        delete stats.totalMinutes;
        // Сохраняем очищенный объект
        localStorage.setItem('readingStats', JSON.stringify(stats));
    }

    // 3. Настройка темы
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

    // 4. Получаем значения
    var finishedCount = stats.finishedIds.length;
    var totalSeconds = stats.totalSeconds || 0;

    // 5. Функция для красивого форматирования времени
    function formatTime(totalSec) {
        var mins = Math.floor(totalSec / 60);
        var secs = totalSec % 60;
        var secsStr = secs < 10 ? '0' + secs : secs;
        
        if (mins === 0) {
            return secs + ' сек'; 
        }
        return mins + ' мин ' + secsStr + ' сек';
    }

    // 6. Функция анимации времени
    function animateTime(element, endSeconds) {
        var duration = 1000;
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progressStep = Math.min((timestamp - startTime) / duration, 1);
            var currentSec = Math.floor(progressStep * endSeconds);
            element.textContent = formatTime(currentSec);
            if (progressStep < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = formatTime(endSeconds);
            }
        }
        requestAnimationFrame(step);
    }

    // 7. Функция анимации числа (рассказов)
    function animateValue(element, endValue) {
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

    // 8. Запускаем анимации
    setTimeout(function() {
        var timeEl = document.getElementById('total-time');
        var storiesEl = document.getElementById('total-stories');
        
        if (timeEl) animateTime(timeEl, totalSeconds);
        if (storiesEl) animateValue(storiesEl, finishedCount);
    }, 300);

    // 9. Отрисовка списка завершенных рассказов
    var finishedList = document.getElementById('finished-list');
    if (!finishedList) return; // Защита, если элемента нет на странице

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
