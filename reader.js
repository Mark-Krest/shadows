document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Получаем ID рассказа из адресной строки
    var urlParams = new URLSearchParams(window.location.search);
    var storyId = urlParams.get('id');
    var story = null;
    
    for (var i = 0; i < STORIES.length; i++) {
        if (STORIES[i].id === storyId) {
            story = STORIES[i];
            break;
        }
    }

    if (!story) {
        document.getElementById('r-body').innerHTML = '<p>Рассказ не найден. <a href="index.html">Вернуться в каталог</a></p>';
        return;
    }

    // 2. Загрузка данных из памяти
    var progressData = JSON.parse(localStorage.getItem('readingProgress')) || {};
    var statsData = JSON.parse(localStorage.getItem('readingStats')) || { totalMinutes: 0, finishedIds: [] };
    var settings = JSON.parse(localStorage.getItem('readerSettings')) || { 
        theme: localStorage.getItem('theme') || 'light', 
        fontSize: 18, 
        lineHeight: 1.8 
    };

    // 3. ЛОГИКА ТАЙМЕРА РЕАЛЬНОГО ВРЕМЕНИ
    var secondsSpent = 0;
    var timerInterval = null;
    var timerDisplay = document.getElementById('timer-display');
    
    // Запускаем таймер сразу при открытии
    timerInterval = setInterval(function() {
        secondsSpent++;
        // Обновляем отображение времени в формате ММ:СС
        var mins = Math.floor(secondsSpent / 60);
        var secs = secondsSpent % 60;
        // Добавляем ноль спереди, если секунд меньше 10 (например, 01:05)
        var secsStr = secs < 10 ? '0' + secs : secs;
        timerDisplay.textContent = mins + ':' + secsStr;
    }, 1000);

    // 4. БЕЗОПАСНАЯ РАЗБИВКА ТЕКСТА НА СТРАНИЦЫ
    var cleanRawText = story.content.replace(/\r/g, '');
    var rawParagraphs = cleanRawText.split(/\n\s*\n/);
    var paragraphsArray = [];
    
    for (var i = 0; i < rawParagraphs.length; i++) {
        var cleanText = rawParagraphs[i].trim();
        if (cleanText.length > 0) {
            paragraphsArray.push(cleanText);
        }
    }

    if (paragraphsArray.length === 0) {
        var fallbackParagraphs = cleanRawText.split('\n');
        for (var i = 0; i < fallbackParagraphs.length; i++) {
            var fbText = fallbackParagraphs[i].trim();
            if (fbText.length > 0) {
                paragraphsArray.push(fbText);
            }
        }
    }

    var paragraphsPerPage = 2; 
    var pages = [];
    
    for (var i = 0; i < paragraphsArray.length; i += paragraphsPerPage) {
        pages.push(paragraphsArray.slice(i, i + paragraphsPerPage));
    }
    
    var currentPage = 0;
    var totalPages = pages.length;

    if (totalPages === 0) {
        totalPages = 1;
        pages.push(["Текст рассказа отсутствует."]);
    }

    // 5. Получение элементов интерфейса
    var readerBody = document.getElementById('r-body');
    var finishContainer = document.getElementById('finish-read-container');
    var finishButton = document.getElementById('btn-finish-read');
    var progressBar = document.getElementById('reading-progress-bar');

    // 6. Логика кнопки "Прочитано" с сохранением РЕАЛЬНОГО ВРЕМЕНИ
    if (statsData.finishedIds.indexOf(story.id) !== -1) {
        finishContainer.style.display = 'none'; // Прячем, если уже прочитано
    } else {
        finishButton.addEventListener('click', function() {
            // 1. Останавливаем таймер
            clearInterval(timerInterval);
            // 2. Сохраняем точное количество затраченных секунд
            // 3. Сохраняем статистику
            statsData.finishedIds.push(story.id);
            statsData.totalSeconds += secondsSpent; // Прибавляем РЕАЛЬНЫЕ секунды
            // 4. Плавно прячем контейнер с таймером и кнопкой
            finishContainer.style.opacity = '0';
            setTimeout(function() { 
                finishContainer.style.display = 'none'; 
            }, 400);
        });
    }

    // 7. Отрисовка заголовка
    document.title = story.title + ' — Чтение';
    document.getElementById('r-title').textContent = story.title;
    document.getElementById('r-meta').textContent = story.genre + ' • ' + story.readTime + ' мин чтения';

    // 8. Генерация HTML страниц
    var pagesHTML = '';
    for (var p = 0; p < pages.length; p++) {
        var paragraphsHTML = '';
        for (var t = 0; t < pages[p].length; t++) {
            paragraphsHTML += '<p>' + pages[p][t] + '</p>';
        }
        pagesHTML += '<div class="single-page" data-page="' + p + '">';
        pagesHTML += paragraphsHTML;
        pagesHTML += '</div>';
    }

    readerBody.innerHTML = 
        '<div class="pagination-wrapper">' +
            '<button class="page-btn page-prev" id="btn-prev">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
            '</button>' +
            '<div class="pages-viewport">' +
                '<div class="pages-track" id="pages-track">' + pagesHTML + '</div>' +
            '</div>' +
            '<button class="page-btn page-next" id="btn-next">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</button>' +
        '</div>' +
        '<div class="page-indicator" id="page-indicator">1 / ' + totalPages + '</div>';

    var track = document.getElementById('pages-track');
    var indicator = document.getElementById('page-indicator');
    var buttonPrev = document.getElementById('btn-prev');
    var buttonNext = document.getElementById('btn-next');

    // 9. Функция обновления вида (перелистывание)
    function updateReaderView() {
        track.style.transform = 'translateX(-' + (currentPage * 100) + '%)';
        indicator.textContent = (currentPage + 1) + ' / ' + totalPages;
        
        var progressPercent = 0;
        if (totalPages === 1) {
            progressPercent = 100;
        } else {
            progressPercent = Math.round((currentPage / (totalPages - 1)) * 100);
        }
        progressBar.style.width = progressPercent + '%';
        
        progressData[story.id] = progressPercent;
        localStorage.setItem('readingProgress', JSON.stringify(progressData));
        
        if (currentPage === 0) {
            buttonPrev.classList.add('disabled');
        } else {
            buttonPrev.classList.remove('disabled');
        }
        
        if (currentPage === totalPages - 1) {
            buttonNext.classList.add('disabled');
        } else {
            buttonNext.classList.remove('disabled');
        }
    }

    // 10. Обработчики кликов по стрелкам
    buttonNext.addEventListener('click', function() {
        if (currentPage < totalPages - 1) {
            currentPage++;
            updateReaderView();
        }
    });

    buttonPrev.addEventListener('click', function() {
        if (currentPage > 0) {
            currentPage--;
            updateReaderView();
        }
    });

    // 11. Свайпы
    var touchStartX = 0;
    readerBody.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    readerBody.addEventListener('touchend', function(e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) { buttonNext.click(); } 
            else { buttonPrev.click(); }
        }
    }, {passive: true});

    // 12. Восстановление страницы
    var savedProgress = progressData[story.id] || 0;
    if (savedProgress > 0 && totalPages > 1) {
        var targetPage = Math.round((savedProgress / 100) * (totalPages - 1));
        if (targetPage >= totalPages) targetPage = totalPages - 1;
        currentPage = targetPage;
    }

    // 13. Настройки
    function applyReaderSettings() {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.getElementById('reader-theme').value = settings.theme;
        document.documentElement.style.setProperty('--reader-font-size', settings.fontSize + 'px');
        document.documentElement.style.setProperty('--reader-line-height', settings.lineHeight);
        document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
        document.getElementById('line-height-value').textContent = settings.lineHeight.toFixed(1);
        localStorage.setItem('readerSettings', JSON.stringify(settings));
    }
    
    applyReaderSettings();

    document.getElementById('reader-theme').addEventListener('change', function(e) {
        settings.theme = e.target.value;
        localStorage.setItem('theme', settings.theme);
        applyReaderSettings();
    });

    document.getElementById('font-decrease').addEventListener('click', function() {
        if (settings.fontSize > 14) { settings.fontSize -= 2; applyReaderSettings(); }
    });

    document.getElementById('font-increase').addEventListener('click', function() {
        if (settings.fontSize < 28) { settings.fontSize += 2; applyReaderSettings(); }
    });

    document.getElementById('line-decrease').addEventListener('click', function() {
        if (settings.lineHeight > 1.2) { settings.lineHeight -= 0.2; applyReaderSettings(); }
    });

    document.getElementById('line-increase').addEventListener('click', function() {
        if (settings.lineHeight < 2.5) { settings.lineHeight += 0.2; applyReaderSettings(); }
    });

    // Запуск
    updateReaderView();
});
