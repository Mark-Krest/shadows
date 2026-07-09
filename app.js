// Ждем полной загрузки структуры страницы
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. ЗАГРУЗКА СОСТОЯНИЯ ИЗ ПАМЯТИ БРАУЗЕРА
    var state = {
        currentTheme: localStorage.getItem('theme') || 'light',
        currentFilter: 'Все',
        stats: JSON.parse(localStorage.getItem('readingStats')) || { totalSeconds: 0, finishedIds: [] },
        progress: JSON.parse(localStorage.getItem('readingProgress')) || {}
    };

    // 2. ПОЛУЧЕНИЕ ССЫЛОК НА ГЛАВНЫЕ ЭЛЕМЕНТЫ СТРАНИЦЫ
    // Если хоть один из этих элементов не будет найден в HTML, скрипт остановится и не сломает страницу
    var grid = document.getElementById('stories-grid');
    var filtersContainer = document.getElementById('filters-container');
    var themeSelector = document.getElementById('theme-selector');
    var searchInput = document.getElementById('search-input');
    var scrollTopBtn = document.getElementById('scroll-to-top-btn');
    var toggleQuoteBtn = document.getElementById('toggle-quote-btn');
    var heroQuote = document.getElementById('hero-quote');
    var quoteToggleText = document.getElementById('quote-toggle-text');
    var quoteChevron = document.querySelector('.quote-chevron');

    // Проверка, существуют ли нужные элементы на странице
    if (!grid || !filtersContainer || !themeSelector) {
        console.error('Критическая ошибка: не найдены основные блоки HTML в index.html');
        return;
    }

    // 3. ФУНКЦИИ ОТРИСОВКИ ИНТЕРФЕЙСА

    // Функция отрисовки кнопок жанров
    function renderFilters() {
        filtersContainer.innerHTML = '';
        for (var i = 0; i < GENRES.length; i++) {
            var genre = GENRES[i];
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (state.currentFilter === genre ? ' active' : '');
            btn.textContent = genre;
            
            btn.addEventListener('click', function() {
                // Используем this.textContent, так как genre в цикле будет всегда последним
                state.currentFilter = this.textContent;
                renderFilters();
                renderGrid();
            });
            
            filtersContainer.appendChild(btn);
        }
    }

    // Функция получения HTML-кода статуса рассказа (Новое/В процессе/Прочитано)
    function getStatusHTML(storyId) {
        if (state.stats.finishedIds.indexOf(storyId) !== -1) {
            return '<div class="status-badge read">Прочитано</div>';
        }
        if (state.progress[storyId] && state.progress[storyId] > 0) {
            return '<div class="status-badge progress">В процессе: ' + Math.round(state.progress[storyId]) + '%</div>';
        }
        return '<div class="status-badge">Новое</div>';
    }

    // Запуск процесса обновления сетки (с анимацией исчезновения старых карточек)
    function renderGrid() {
        var existingCards = grid.querySelectorAll('.card');
        
        if (existingCards.length > 0) {
            for (var i = 0; i < existingCards.length; i++) {
                existingCards[i].classList.add('card-exit');
            }
            // Ждем 300мс, пока карточки растворятся, затем рисуем новые
            setTimeout(buildNewGrid, 300);
        } else {
            buildNewGrid();
        }
    }

    // Непосредственная генерация и вставка карточек в HTML
    function buildNewGrid() {
        grid.innerHTML = '';
        
        var filteredStories = [];
        var searchText = '';
        
        // Безопасно получаем текст из поиска, переводим в нижний регистр
        if (searchInput) {
            searchText = searchInput.value.toLowerCase().trim();
        }
        
        // Фильтрация: проверяем соответствие жанру И тексту поиска
        for (var i = 0; i < STORIES.length; i++) {
            var story = STORIES[i];
            var matchGenre = state.currentFilter === 'Все' || story.genre === state.currentFilter;
            var matchSearch = searchText === '' || story.title.toLowerCase().indexOf(searchText) !== -1;
            
            // Добавляем рассказ только если он подходит под оба условия
            if (matchGenre && matchSearch) {
                filteredStories.push(story);
            }
        }

        // Создаем HTML для каждой карточки
        for (var i = 0; i < filteredStories.length; i++) {
            var story = filteredStories[i];
            var card = document.createElement('article');
            card.className = 'card';
            card.style.animationDelay = (i * 0.1) + 's';
            card.setAttribute('role', 'link');
            card.setAttribute('tabindex', '0');
            
            card.innerHTML = 
                '<div class="card-genre">' + story.genre + '</div>' +
                '<h2 class="card-title">' + story.title + '</h2>' +
                '<p class="card-excerpt">' + story.excerpt + '</p>' +
                '<div class="card-footer">' +
                    '<div>' + story.readTime + ' мин чтения</div>' +
                    getStatusHTML(story.id) +
                '</div>';

            // Сохраняем правильный ID рассказа для функции перехода (чтобы не сбивалось в цикле)
            var targetUrl = 'reader.html?id=' + story.id;
            
            function openReader() {
                window.location.href = targetUrl;
            }

            card.addEventListener('click', openReader);
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') openReader();
            });

            grid.appendChild(card);
        }

        // Если ничего не найдено
        if (filteredStories.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Ничего не найдено по вашему запросу.</p>';
        }
    }

    // Функция применения темы оформления
    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        themeSelector.value = state.currentTheme;
        localStorage.setItem('theme', state.currentTheme);
    }

    // 4. НАВЕШИВАНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ

    // Смена темы
    themeSelector.addEventListener('change', function(e) {
        state.currentTheme = e.target.value;
        applyTheme();
    });

    // Поиск в реальном времени (каждое нажатие клавиши)
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderGrid();
        });
    }

    // Логика скрытия/показа цитаты
    var isQuoteVisible = true;
    if (toggleQuoteBtn && heroQuote) {
        toggleQuoteBtn.addEventListener('click', function() {
            isQuoteVisible = !isQuoteVisible;
            
            if (isQuoteVisible) {
                // Показываем цитату
                heroQuote.classList.remove('collapsed');
                heroQuote.style.maxHeight = heroQuote.scrollHeight + 'px';
                setTimeout(function() { 
                    heroQuote.style.maxHeight = 'none'; 
                }, 500);
                
                if(quoteToggleText) quoteToggleText.textContent = 'Скрыть цитату';
                if(quoteChevron) quoteChevron.style.transform = 'rotate(0deg)';
            } else {
                // Скрываем цитату
                heroQuote.style.maxHeight = heroQuote.scrollHeight + 'px';
                heroQuote.offsetHeight; // Перезагрузка браузера для плавности
                heroQuote.classList.add('collapsed');
                heroQuote.style.maxHeight = '0px';
                
                if(quoteToggleText) quoteToggleText.textContent = 'Показать цитату';
                if(quoteChevron) quoteChevron.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Логика кнопки "Наверх"
    if (scrollTopBtn) {
        window.addEventListener('scroll', function() {
            if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
        });
    }

    // 5. ПЕРВОНАЧАЛЬНЫЙ ЗАПУСК
    applyTheme();
    renderFilters();
    renderGrid();

}); // Конец DOMContentLoaded
