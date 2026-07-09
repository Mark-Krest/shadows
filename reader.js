// Ждем полной загрузки структуры страницы читалки
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. ПОЛУЧАЕМ ID РАССКАЗА И ИЩЕМ ЕГО В БАЗЕ
    var urlParams = new URLSearchParams(window.location.search);
    var storyId = urlParams.get('id');
    var story = null;
    
    for (var i = 0; i < STORIES.length; i++) {
        if (STORIES[i].id === storyId) {
            story = STORIES[i];
            break;
        }
    }

    // Если рассказ не найден, показываем ошибку и прерываем скрипт
    if (!story) {
        document.getElementById('r-body').innerHTML = '<p>Рассказ не найден. <a href="index.html">Вернуться в каталог</a></p>';
        return;
    }

    // 2. ЗАГРУЗКА ДАННЫХ ИЗ ПАМЯТИ БРАУЗЕРА
    var progressData = JSON.parse(localStorage.getItem('readingProgress')) || {};
    var statsData = JSON.parse(localStorage.getItem('readingStats')) || { 
        totalSeconds: 0, 
        finishedIds: [] 
    };
    
    // Совместимость со старыми версиями (если раньше сохранялись минуты)
    if (statsData.totalMinutes && !statsData.totalSeconds) {
        statsData.totalSeconds = statsData.totalMinutes * 60;
    }
    
    var settings = JSON.parse(localStorage.getItem('readerSettings')) || { 
        theme: localStorage.getItem('theme') || 'light', 
        fontSize: 18, 
        lineHeight: 1.8 
    };

    // 3. ЗАПУСК ТАЙМЕРА РЕАЛЬНОГО ВРЕМЕНИ
    var secondsSpent = 0;
    var timerInterval = null;
    var timerDisplay = document.getElementById('timer-display');
    
    // Проверяем, существует ли элемент таймера на странице
    if (timerDisplay) {
        timerInterval = setInterval(function() {
            secondsSpent++;
            var mins = Math.floor(secondsSpent / 60);
            var secs = secondsSpent % 60;
            // Добавляем ноль спереди для эстетики (например, 0:05 вместо 0:5)
            var secsStr = secs < 10 ? '0' + secs : secs;
            timerDisplay.textContent = mins + ':' + secsStr;
        }, 1000);
    }

        // 4. БЕЗОПАСНАЯ РАЗБИВКА ТЕКСТА НА СТРАНИЦЫ (Автоматическая по символам)
    // Удаляем невидимые символы переноса каретки из Word/Windows
    var cleanRawText = story.content.replace(/\r/g, '');
    // Очищаем текст от двойных пробелов и пробелов вокруг тире/тире
    var normalizedText = cleanRawText.replace(/\s+/g, ' ').replace(/ - /g, ' — ');
    var charsPerPage = 600; // Сколько символов текста должно быть на одной странице (можно поменять)
    var pages = [];
    var currentPosition = 0;
    // Нарезаем текст ровными кусками по 600 символов
    while (currentPosition < normalizedText.length) {
        // Вырезаем кусок текста
        var pageText = normalizedText.substring(currentPosition, currentPosition + charsPerPage);
        // УМНАЯ ОБРЕЗКА: Если мы разрезали текст посреди слова (последний символ не пробел),
        // мы откатываемся назад, чтобы найти пробел и не разрывать слово пополам.
        if (currentPosition + charsPerPage < normalizedText.length) {
            var lastSpaceIndex = pageText.lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
                pageText = pageText.substring(0, lastSpaceIndex);
                currentPosition = currentPosition + lastSpaceIndex + 1; // +1 чтобы пропустить сам пробел
            } else {
                currentPosition += charsPerPage;
            }
        } else {
            currentPosition += charsPerPage;
        }
        // Добавляем готовую страницу в массив
        pages.push(pageText);
    }
    // Защита от пустых рассказов
    if (pages.length === 0) {
        pages.push("Текст рассказа отсутствует.");
    }

    // Группируем абзацы по страницам (сколько абзацев на одной странице)
    var paragraphsPerPage = 2; 
    var pages = [];
    
    for (var i = 0; i < paragraphsArray.length; i += paragraphsPerPage) {
        var pageChunk = paragraphsArray.slice(i, i + paragraphsPerPage);
        pages.push(pageChunk);
    }
    
    var currentPage = 0;
    var totalPages = pages.length;

    // Защита от деления на ноль
    if (totalPages === 0) {
        totalPages = 1;
        pages.push(["Текст рассказа отсутствует."]);
    }

    // 5. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ ИНТЕРФЕЙСА
    var readerBody = document.getElementById('r-body');
    var finishContainer = document.getElementById('finish-read-container');
    var finishButton = document.getElementById('btn-finish-read');
    var progressBar = document.getElementById('reading-progress-bar');

    // 6. ЛОГИКА КНОПКИ "ОТМЕТИТЬ КАК ПРОЧИТАННОЕ"
    if (statsData.finishedIds.indexOf(story.id) !== -1) {
        // Если уже прочитано — прячем кнопку и таймер
        if (finishContainer) finishContainer.style.display = 'none';
        if (timerInterval) clearInterval(timerInterval); // Останавливаем таймер
    } else {
        if (finishButton) {
            finishButton.addEventListener('click', function() {
                // 1. Останавливаем таймер
                if (timerInterval) clearInterval(timerInterval);
                
                // 2. Сохраняем точное количество затраченных секунд
                statsData.finishedIds.push(story.id);
                statsData.totalSeconds += secondsSpent; 
                localStorage.setItem('readingStats', JSON.stringify(statsData));
                
                // 3. Плавно прячем контейнер с таймером и кнопкой
                if (finishContainer) {
                    finishContainer.style.opacity = '0';
                    setTimeout(function() { 
                        finishContainer.style.display = 'none'; 
                    }, 400);
                }
            });
        }
    }

    // 7. ОТРИСОВКА ЗАГОЛОВКА И МЕТА-ДАННЫХ
    document.title = story.title + ' — Чтение';
    document.getElementById('r-title').textContent = story.title;
    document.getElementById('r-meta').textContent = story.genre + ' • ' + story.readTime + ' мин чтения';

    // 8. ГЕНЕРАЦИЯ HTML ДЛЯ ПЕРЕЛИСТЫВАНИЯ
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

    // Вставляем всю структуру в контейнер текста
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

    // Получаем ссылки на элементы управления страницами ТОЛЬКО ПОСЛЕ их создания в HTML
    var track = document.getElementById('pages-track');
    var indicator = document.getElementById('page-indicator');
    var buttonPrev = document.getElementById('btn-prev');
    var buttonNext = document.getElementById('btn-next');

    // 9. ФУНКЦИЯ ОБНОВЛЕНИЯ ВИДА (ПЕРЕЛИСТЫВАНИЕ И ПРОГРЕСС)
    function updateReaderView() {
        // Сдвигаем ленту с страницами
        track.style.transform = 'translateX(-' + (currentPage * 100) + '%)';
        
        // Обновляем текст "1 / 4"
        indicator.textContent = (currentPage + 1) + ' / ' + totalPages;
        
        // Считаем процент для прогресс-бара вверху
        var progressPercent = 0;
        if (totalPages === 1) {
            progressPercent = 100;
        } else {
            progressPercent = Math.round((currentPage / (totalPages - 1)) * 100);
        }
        progressBar.style.width = progressPercent + '%';
        
        // Сохраняем прогресс в память браузера
        progressData[story.id] = progressPercent;
        localStorage.setItem('readingProgress', JSON.stringify(progressData));
        
        // Управляем видимостью стрелок
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

    // 10. ОБРАБОТЧИКИ КЛИКОВ ПО СТРЕЛКАМ
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

    // 11. ПОДДЕРЖКА СВАЙПОВ НА МОБИЛЬНЫХ УСТРОЙСТВАХ
    var touchStartX = 0;
    readerBody.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    readerBody.addEventListener('touchend', function(e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        // Если палец сдвинулся больше чем на 50 пикселей
        if (Math.abs(diff) > 50) {
            if (diff > 0) { 
                buttonNext.click(); // Свайп влево -> следующая страница
            } else { 
                buttonPrev.click(); // Свайп вправо -> предыдущая страница
            }
        }
    }, {passive: true});

    // 12. ВОССТАНОВЛЕНИЕ СТРАНИЦЫ ПРИ ВОЗВРАЩЕНИИ К РАССКАЗУ
    var savedProgress = progressData[story.id] || 0;
    if (savedProgress > 0 && totalPages > 1) {
        // Переводим процент обратно в номер страницы
        var targetPage = Math.round((savedProgress / 100) * (totalPages - 1));
        // Защита: если номер страницы больше общего количества, ставим последнюю
        if (targetPage >= totalPages) {
            targetPage = totalPages - 1;
        }
        currentPage = targetPage;
    }

    // 13. ФУНКЦИЯ ПРИМЕНЕНИЯ НАСТРОЕК (ШРИФТ, ИНТЕРВАЛ, ТЕМА)
    function applyReaderSettings() {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.getElementById('reader-theme').value = settings.theme;
        document.documentElement.style.setProperty('--reader-font-size', settings.fontSize + 'px');
        document.documentElement.style.setProperty('--reader-line-height', settings.lineHeight);
        document.getElementById('font-size-value').textContent = settings.fontSize + 'px';
        document.getElementById('line-height-value').textContent = settings.lineHeight.toFixed(1);
        localStorage.setItem('readerSettings', JSON.stringify(settings));
    }
    
    // Применяем настройки при загрузке
    applyReaderSettings();

    // Слушатели изменения настроек
    document.getElementById('reader-theme').addEventListener('change', function(e) {
        settings.theme = e.target.value;
        localStorage.setItem('theme', settings.theme);
        applyReaderSettings();
    });

    document.getElementById('font-decrease').addEventListener('click', function() {
        if (settings.fontSize > 14) { 
            settings.fontSize -= 2; 
            applyReaderSettings(); 
        }
    });

    document.getElementById('font-increase').addEventListener('click', function() {
        if (settings.fontSize < 28) { 
            settings.fontSize += 2; 
            applyReaderSettings(); 
        }
    });

    document.getElementById('line-decrease').addEventListener('click', function() {
        if (settings.lineHeight > 1.2) { 
            settings.lineHeight -= 0.2; 
            applyReaderSettings(); 
        }
    });

    document.getElementById('line-increase').addEventListener('click', function() {
        if (settings.lineHeight < 2.5) { 
            settings.lineHeight += 0.2; 
            applyReaderSettings(); 
        }
    });

    // 14. ФИНАЛЬНЫЙ ЗАПУСК
    // Вызываем функцию, чтобы отрисовалась правильная страница и прогрузился интерфейс
    updateReaderView();

}); // Конец DOMContentLoaded
