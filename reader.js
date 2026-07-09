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
    
    // Совместимость со старыми версиями
    if (statsData.totalMinutes && !statsData.totalSeconds) {
        statsData.totalSeconds = statsData.totalMinutes * 60;
        delete statsData.totalMinutes;
        localStorage.setItem('readingStats', JSON.stringify(statsData));
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
    
    if (timerDisplay) {
        timerInterval = setInterval(function() {
            secondsSpent++;
            var mins = Math.floor(secondsSpent / 60);
            var secs = secondsSpent % 60;
            var secsStr = secs < 10 ? '0' + secs : secs;
            timerDisplay.textContent = mins + ':' + secsStr;
        }, 1000);
    }

    // 4. НОВАЯ НАДЕЖНАЯ РАЗБИВКА ТЕКСТА НА СТРАНИЦЫ (По абзацам и лимиту символов)
    
    // Удаляем невидимые символы (от Word/Windows), которые ломали код ранее
    var cleanRawText = story.content.replace(/\r/g, '');
    
    // Разбиваем текст на абзацы. Ищем одиночный перенос строки (\n), так как у тебя текст вставлен сплошняком
    var rawParagraphs = cleanRawText.split('\n');
    var paragraphsArray = [];
    
    // Очищаем абзацы от лишних пробелов по краям и удаляем пустые строки
    for (var i = 0; i < rawParagraphs.length; i++) {
        var cleanText = rawParagraphs[i].trim();
        if (cleanText.length > 0) {
            paragraphsArray.push(cleanText);
        }
    }

    // Группируем абзацы в "страницы" по 1000 символов
    var charsLimitPerPage = 1000; // Сколько символов текста влезет на одну страницу
    var pages = [];
    var currentPageText = '';
    
    for (var i = 0; i < paragraphsArray.length; i++) {
        var paragraph = paragraphsArray[i];
        
        // Если добавление этого абзаца превысит лимит страницы, И это не первый абзац
        if (currentPageText.length + paragraph.length > charsLimitPerPage && currentPageText.length > 0) {
            // Сохраняем текущую страницу
            pages.push(currentPageText);
            // Начинаем новую страницу с этого абзаца
            currentPageText = paragraph;
        } else {
            // Добавляем абзац к текущей странице (с переносом строки между ними)
            if (currentPageText.length > 0) {
                currentPageText += '\n\n' + paragraph;
            } else {
                currentPageText = paragraph;
            }
        }
    }
    
    // Добавляем последнюю собранную страницу в массив
    if (currentPageText.length > 0) {
        pages.push(currentPageText);
    }

    // Защита от деления на ноль
    if (pages.length === 0) {
        pages.push("Текст рассказа отсутствует.");
    }

    var currentPage = 0;
    var totalPages = pages.length;

    // 5. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ ИНТЕРФЕЙСА
    var readerBody = document.getElementById('r-body');
    var finishContainer = document.getElementById('finish-read-container');
    var finishButton = document.getElementById('btn-finish-read');
    var progressBar = document.getElementById('reading-progress-bar');

    // 6. ЛОГИКА КНОПКИ "ОТМЕТИТЬ КАК ПРОЧИТАННОЕ"
    if (statsData.finishedIds.indexOf(story.id) !== -1) {
        if (finishContainer) finishContainer.style.display = 'none';
        if (timerInterval) clearInterval(timerInterval);
    } else {
        if (finishButton) {
            finishButton.addEventListener('click', function() {
                if (timerInterval) clearInterval(timerInterval);
                
                statsData.finishedIds.push(story.id);
                statsData.totalSeconds += secondsSpent; 
                localStorage.setItem('readingStats', JSON.stringify(statsData));
                
                if (finishContainer) {
                    finishContainer.style.opacity = '0';
                    setTimeout(function() { 
                        finishContainer.style.display = 'none'; 
                    }, 400);
                }
            });
        }
    }

    // 7. ОТРИСОВКА ЗАГОЛОВКА
    document.title = story.title + ' — Чтение';
    document.getElementById('r-title').textContent = story.title;
    document.getElementById('r-meta').textContent = story.genre + ' • ' + story.readTime + ' мин чтения';

    // 8. ГЕНЕРАЦИЯ HTML ДЛЯ ПЕРЕЛИСТЫВАНИЯ
    var pagesHTML = '';
    
    for (var p = 0; p < pages.length; p++) {
        // Так как мы вернули переносы строк (\n\n), нам нужно снова превратить их в HTML-абзацы
        var pageParagraphs = pages[p].split('\n\n');
        var paragraphsHTML = '';
        
        for (var t = 0; t < pageParagraphs.length; t++) {
            paragraphsHTML += '<p>' + pageParagraphs[t] + '</p>';
        }
        
        pagesHTML += '<div class="single-page" data-page="' + p + '">';
        pagesHTML += paragraphsHTML;
        pagesHTML += '</div>';
    }

    // Вставляем всю структуру в контейнер
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

    // Получаем ссылки на элементы управления страницами
    var track = document.getElementById('pages-track');
    var indicator = document.getElementById('page-indicator');
    var buttonPrev = document.getElementById('btn-prev');
    var buttonNext = document.getElementById('btn-next');

    // 9. ФУНКЦИЯ ОБНОВЛЕНИЯ ВИДА (ПЕРЕЛИСТЫВАНИЕ И ПРОГРЕСС)
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

    // 11. ПОДДЕРЖКА СВАЙПОВ НА МОБИЛЬНЫХ
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

    // 12. ВОССТАНОВЛЕНИЕ СТРАНИЦЫ ПРИ ВОЗВРАЩЕНИИ
    var savedProgress = progressData[story.id] || 0;
    if (savedProgress > 0 && totalPages > 1) {
        var targetPage = Math.round((savedProgress / 100) * (totalPages - 1));
        if (targetPage >= totalPages) {
            targetPage = totalPages - 1;
        }
        currentPage = targetPage;
    }

    // 13. ФУНКЦИЯ ПРИМЕНЕНИЯ НАСТРОЕК
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

    // 14. ФИНАЛЬНЫЙ ЗАПУСК
    updateReaderView();

}); // Конец DOMContentLoaded
