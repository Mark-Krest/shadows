document.addEventListener('DOMContentLoaded', function() {
    
    // Загружаем состояние из памяти браузера
    var state = {
        currentTheme: localStorage.getItem('theme') || 'light',
        currentFilter: 'Все',
        stats: JSON.parse(localStorage.getItem('readingStats')) || { totalMinutes: 0, finishedIds: [] },
        progress: JSON.parse(localStorage.getItem('readingProgress')) || {}
    };

    // Находим основные элементы на странице
    var grid = document.getElementById('stories-grid');
    var filtersContainer = document.getElementById('filters-container');
    var themeSelector = document.getElementById('theme-selector');
    var totalMinutesEl = document.getElementById('total-minutes');
    var finishedStoriesEl = document.getElementById('finished-stories');

    // Функция отрисовки кнопок фильтров
    function renderFilters() {
        filtersContainer.innerHTML = '';
        for (var i = 0; i < GENRES.length; i++) {
            var genre = GENRES[i];
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (state.currentFilter === genre ? ' active' : '');
            btn.textContent = genre;
            
            btn.addEventListener('click', function() {
                // Используем замыкание, чтобы сохранить правильное значение genre
                state.currentFilter = this.textContent;
                renderFilters();
                renderGrid();
            });
            
            filtersContainer.appendChild(btn);
        }
    }

    // Функция получения статуса рассказа для бейджа
    function getStatusHTML(storyId) {
        if (state.stats.finishedIds.indexOf(storyId) !== -1) {
            return '<div class="status-badge read">Прочитано</div>';
        }
        if (state.progress[storyId] && state.progress[storyId] > 0) {
            return '<div class="status-badge progress">В процессе: ' + Math.round(state.progress[storyId]) + '%</div>';
        }
        return '<div class="status-badge">Новое</div>';
    }

    // Функция запуска процесса рендеринга сетки (с анимацией выхода)
    function renderGrid() {
        var existingCards = grid.querySelectorAll('.card');
        
        if (existingCards.length > 0) {
            for (var i = 0; i < existingCards.length; i++) {
                existingCards[i].classList.add('card-exit');
            }
            setTimeout(buildNewGrid, 300);
        } else {
            buildNewGrid();
        }
    }

    // Функция непосредственной отрисовки карточек
    function buildNewGrid() {
        grid.innerHTML = '';
        
        var filteredStories = [];
        if (state.currentFilter === 'Все') {
            filteredStories = STORIES;
        } else {
            for (var i = 0; i < STORIES.length; i++) {
                if (STORIES[i].genre === state.currentFilter) {
                    filteredStories.push(STORIES[i]);
                }
            }
        }

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

            // Обработчик перехода на страницу чтения
            function openReader() {
                window.location.href = 'reader.html?id=' + story.id;
            }

            card.addEventListener('click', openReader);
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') openReader();
            });

            grid.appendChild(card);
        }

        if (filteredStories.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Нет рассказов в этом жанре.</p>';
        }
    }

    // Функция применения темы
    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        themeSelector.value = state.currentTheme;
        localStorage.setItem('theme', state.currentTheme);
    }

    // Слушатель изменения темы
    themeSelector.addEventListener('change', function(e) {
        state.currentTheme = e.target.value;
        applyTheme();
    });

    // Обновление плашки статистики
    totalMinutesEl.textContent = state.stats.totalMinutes;
    finishedStoriesEl.textContent = state.stats.finishedIds.length;

    // Запуск
    applyTheme();
    renderFilters();
    renderGrid();
});