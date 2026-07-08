document.addEventListener('DOMContentLoaded', function() {
    
    // Загружаем данные из памяти браузера
    var stats = JSON.parse(localStorage.getItem('readingStats')) || { totalMinutes: 0, finishedIds: [] };

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

    // Получаем готовые значения
    var finishedCount = stats.finishedIds.length;
    var totalMinutes = stats.totalMinutes;

    // Анимация счета (плавное прибавление цифр от 0 до нужного значения)
    function animateValue(element, endValue) {
        var startValue = 0;
        var duration = 1000; // Длительность анимации 1 секунда
        var startTime = null;
        
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progressStep = Math.min((timestamp - startTime) / duration, 1);
            element.textContent = Math.floor(progressStep * endValue);
            if (progressStep < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = endValue; // Убеждаемся, что в конце стоит точное значение
            }
        }
        requestAnimationFrame(step);
    }

    // Запускаем анимацию для двух оставшихся цифр
    setTimeout(function() {
        animateValue(document.getElementById('total-time'), totalMinutes);
        animateValue(document.getElementById('total-stories'), finishedCount);
    }, 300);

    // Отрисовка списка завершенных рассказов
    var finishedList = document.getElementById('finished-list');
    var finishedHTML = '';
    var hasFinished = false;

    for (var i = 0; i < STORIES.length; i++) {
        var story = STORIES[i];
        // Если ID рассказа есть в массиве прочитанных
        if (stats.finishedIds.indexOf(story.id) !== -1) {
            hasFinished = true;
            finishedHTML += 
                '<div class="finished-item">' +
                    '<div>' +
                        '<div class="fi-title">' + story.title + '</div>' +
                        '<div class="fi-genre">' + story.genre + ' • ' + story.readTime + ' мин</div>' +
                    '</div>' +
                    '<div class="fi-badge">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                        'Прочитано' +
                    '</div>' +
                '</div>';
        }
    }

    // Если нет прочитанных рассказов
    if (!hasFinished) {
        finishedList.innerHTML = '<p style="color: var(--text-secondary);">Вы еще не завершили ни одного рассказа.</p>';
    } else {
        finishedList.innerHTML = finishedHTML;
    }
});