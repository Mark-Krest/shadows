document.addEventListener('DOMContentLoaded', function() {
    
    var state = {
        currentTheme: localStorage.getItem('theme') || 'light',
        currentFilter: 'Все',
        stats: JSON.parse(localStorage.getItem('readingStats')) || { totalMinutes: 0, finishedIds: [] },
        progress: JSON.parse(localStorage.getItem('readingProgress')) || {}
    };

    var grid = document.getElementById('stories-grid');
    var filtersContainer = document.getElementById('filters-container');
    var themeSelector = document.getElementById('theme-selector');
    var searchInput = document.getElementById('search-input');

    function renderFilters() {
        filtersContainer.innerHTML = '';
        for (var i = 0; i < GENRES.length; i++) {
            var genre = GENRES[i];
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (state.currentFilter === genre ? ' active' : '');
            btn.textContent = genre;
            
            btn.addEventListener('click', function() {
                state.currentFilter = this.textContent;
                renderFilters();
                renderGrid();
            });
            
            filtersContainer.appendChild(btn);
        }
    }

    function getStatusHTML(storyId) {
        if (state.stats.finishedIds.indexOf(storyId) !== -1) {
            return '<div class="status-badge read">Прочитано</div>';
        }
        if (state.progress[storyId] && state.progress[storyId] > 0) {
            return '<div class="status-badge progress">В процессе: ' + Math.round(state.progress[storyId]) + '%</div>';
        }
        return '<div class="status-badge">Новое</div>';
    }

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

    function buildNewGrid() {
        grid.innerHTML = '';
        
        var filteredStories = [];
        var searchText = searchInput.value.toLowerCase().trim();
        
        for (var i = 0; i < STORIES.length; i++) {
            var story = STORIES[i];
            var matchGenre = state.currentFilter === 'Все' || story.genre === state.currentFilter;
            var matchSearch = searchText === '' || story.title.toLowerCase().indexOf(searchText) !== -1;
            
            if (matchGenre && matchSearch) {
                filteredStories.push(story);
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
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Ничего не найдено.</p>';
        }
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        themeSelector.value = state.currentTheme;
        localStorage.setItem('theme', state.currentTheme);
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    themeSelector.addEventListener('change', function(e) {
        state.currentTheme = e.target.value;
        applyTheme();
    });

    // Поиск в реальном времени
    searchInput.addEventListener('input', function() {
        renderGrid();
    });

    // --- СКРЫТИЕ/ПОКАЗ ЦИТАТЫ ---
    var toggleQuoteBtn = document.getElementById('toggle-quote-btn');
    var heroQuote = document.getElementById('hero-quote');
    var quoteToggleText = document.getElementById('quote-toggle-text');
    var quoteChevron = document.querySelector('.quote-chevron');
    var isQuoteVisible = true;

    toggleQuoteBtn.addEventListener('click', function() {
        isQuoteVisible = !isQuoteVisible;
        if (isQuoteVisible) {
            heroQuote.style.maxHeight = heroQuote.scrollHeight + 'px';
            quoteToggleText.textContent = 'Скрыть цитату';
            quoteChevron.style.transform = 'rotate(0deg)';
            setTimeout(function() { heroQuote.style.maxHeight = 'none'; }, 500);
        } else {
            heroQuote.style.maxHeight = heroQuote.scrollHeight + 'px';
            heroQuote.offsetHeight; // Перезагрузка браузера для анимации
            heroQuote.style.maxHeight = '0px';
            quoteToggleText.textContent = 'Показать цитату';
            quoteChevron.style.transform = 'rotate(-90deg)';
        }
    });

    // --- КНОПКА "НАВЕРХ" ---
    var scrollTopBtn = document.getElementById('scroll-to-top-btn');
    
    window.addEventListener('scroll', function() {
        if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- ЗАПУСК ---
    applyTheme();
    renderFilters();
    renderGrid();
});
