/**
 * СИСТЕМА ПОИСКА
 * Модуль для поиска объектов на карте университета
 */

window.SearchModule = (function() {
    
    // Приватные переменные
    let searchData = [];
    let searchHistory = [];
    let currentFilter = 'all';
    let searchTimeout = null;
    let isSearching = false;
    
    // DOM элементы
    let searchInput;
    let suggestionsContainer;
    let filterButtons;
    
    // Конфигурация поиска
    const searchConfig = {
        minLength: 2,
        maxResults: 50,
        debounceTime: 300,
        maxHistory: 10,
        fuzzyThreshold: 0.6
    };
    
    // Конфигурация типов объектов
    const objectTypes = {
        university: {
            name: 'Университетские здания',
            icon: 'graduation-cap',
            color: '#667eea',
            layers: ['main_building', 'university_buildings', 'dormitory_buildings', 
                    'lab_buildings', 'library_buildings', 'sport_buildings', 'buildings_in_university']
        },
        public: {
            name: 'Общественные здания',
            icon: 'city',
            color: '#e74c3c',
            layers: ['museum_buildings', 'cafe_buildings', 'gov_buildings']
        },
        transport: {
            name: 'Транспорт',
            icon: 'bus',
            color: '#f39c12',
            layers: ['metro_stations', 'metro_entrance', 'metro_platforms', 'tram_stops', 'bus_stops']
        }
    };
    
    /**
     * Инициализация системы поиска
     */
    function init() {
        try {
            // Получаем DOM элементы
            searchInput = document.getElementById('global-search');
            suggestionsContainer = document.getElementById('search-suggestions');
            filterButtons = document.querySelectorAll('.filter-btn');
            
            if (!searchInput || !suggestionsContainer) {
                console.error('Не найдены необходимые элементы поиска');
                return false;
            }
            
            // Загружаем историю поиска
            loadSearchHistory();
            
            // Устанавливаем обработчики событий
            setupEventListeners();
            
            console.log('Система поиска инициализирована');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации системы поиска:', error);
            return false;
        }
    }
    
    /**
     * Установка обработчиков событий
     */
    function setupEventListeners() {
        // Поиск при вводе текста
        searchInput.addEventListener('input', handleSearchInput);
        
        // Обработка клавиш
        searchInput.addEventListener('keydown', handleKeydown);
        
        // Фокус и потеря фокуса
        searchInput.addEventListener('focus', handleSearchFocus);
        searchInput.addEventListener('blur', handleSearchBlur);
        
        // Фильтры
        filterButtons.forEach(button => {
            button.addEventListener('click', handleFilterClick);
        });
        
        // Клик вне области поиска
        document.addEventListener('click', handleOutsideClick);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleGlobalKeydown);
    }
    
    /**
     * Обработка ввода в поле поиска
     */
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        
        // Очищаем предыдущий таймаут
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Если запрос слишком короткий, скрываем предложения
        if (query.length < searchConfig.minLength) {
            hideSuggestions();
            return;
        }
        
        // Дебаунс поиска
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, searchConfig.debounceTime);
    }
    
    /**
     * Обработка нажатий клавиш в поле поиска
     */
    function handleKeydown(event) {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        const highlighted = suggestionsContainer.querySelector('.suggestion-item.highlighted');
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                navigateSuggestions('down', suggestions, highlighted);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                navigateSuggestions('up', suggestions, highlighted);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (highlighted) {
                    selectSuggestion(highlighted);
                } else if (suggestions.length > 0) {
                    selectSuggestion(suggestions[0]);
                }
                break;
                
            case 'Escape':
                hideSuggestions();
                searchInput.blur();
                break;
        }
    }
    
    /**
     * Навигация по предложениям с клавиатуры
     */
    function navigateSuggestions(direction, suggestions, highlighted) {
        if (suggestions.length === 0) return;
        
        // Убираем текущую подсветку
        if (highlighted) {
            highlighted.classList.remove('highlighted');
        }
        
        let newIndex = 0;
        
        if (highlighted) {
            const currentIndex = Array.from(suggestions).indexOf(highlighted);
            if (direction === 'down') {
                newIndex = (currentIndex + 1) % suggestions.length;
            } else {
                newIndex = currentIndex === 0 ? suggestions.length - 1 : currentIndex - 1;
            }
        }
        
        // Подсвечиваем новый элемент
        suggestions[newIndex].classList.add('highlighted');
        suggestions[newIndex].scrollIntoView({ block: 'nearest' });
    }
    
    /**
     * Обработка фокуса на поле поиска
     */
    function handleSearchFocus() {
        const query = searchInput.value.trim();
        
        if (query.length >= searchConfig.minLength) {
            showSuggestions();
        } else {
            showSearchHistory();
        }
    }
    
    /**
     * Обработка потери фокуса
     */
    function handleSearchBlur() {
        // Задержка для обработки кликов по предложениям
        setTimeout(() => {
            hideSuggestions();
        }, 150);
    }
    
    /**
     * Обработка кликов по фильтрам
     */
    function handleFilterClick(event) {
        const button = event.currentTarget;
        const filter = button.getAttribute('data-filter');
        
        // Обновляем активный фильтр
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        currentFilter = filter;
        
        // Повторяем поиск с новым фильтром
        const query = searchInput.value.trim();
        if (query.length >= searchConfig.minLength) {
            performSearch(query);
        }
    }
    
    /**
     * Обработка кликов вне области поиска
     */
    function handleOutsideClick(event) {
        const searchContainer = document.getElementById('search-container');
        if (!searchContainer.contains(event.target)) {
            hideSuggestions();
        }
    }
    
    /**
     * Обработка глобальных горячих клавиш
     */
    function handleGlobalKeydown(event) {
        // Ctrl+K или Cmd+K для фокуса на поиске
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    }
    
    /**
     * Выполнение поиска
     */
    async function performSearch(query) {
        if (isSearching) return;
        
        isSearching = true;
        showLoadingState();
        
        try {
            // Поиск в данных
            const results = await searchInData(query, currentFilter);
            
            // Показываем результаты
            if (results.length > 0) {
                displaySearchResults(results, query);
            } else {
                displayNoResults(query);
            }
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            displaySearchError();
            
        } finally {
            isSearching = false;
        }
    }
    
    /**
     * Поиск в данных
     */
    async function searchInData(query, filter) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Фильтруем данные по типу
        let filteredData = searchData;
        if (filter !== 'all') {
            const allowedLayers = objectTypes[filter]?.layers || [];
            filteredData = searchData.filter(item => allowedLayers.includes(item.layer));
        }
        
        // Поиск по различным полям
        filteredData.forEach(item => {
            const score = calculateSearchScore(item, queryLower);
            if (score > 0) {
                results.push({
                    ...item,
                    score: score,
                    matches: getSearchMatches(item, queryLower)
                });
            }
        });
        
        // Сортируем по релевантности
        results.sort((a, b) => b.score - a.score);
        
        // Ограничиваем количество результатов
        return results.slice(0, searchConfig.maxResults);
    }
    
    /**
     * Вычисление релевантности результата
     */
    function calculateSearchScore(item, query) {
        let score = 0;
        
        // Точное совпадение в названии (максимальный балл)
        if (item.name && item.name.toLowerCase().includes(query)) {
            score += 100;
            if (item.name.toLowerCase().startsWith(query)) {
                score += 50; // Бонус за совпадение в начале
            }
        }
        
        // Совпадение в адресе
        if (item.address && item.address.toLowerCase().includes(query)) {
            score += 50;
        }
        
        // Совпадение в описании
        if (item.description && item.description.toLowerCase().includes(query)) {
            score += 30;
        }
        
        // Совпадение в типе объекта
        if (item.type && item.type.toLowerCase().includes(query)) {
            score += 40;
        }
        
        // Совпадение в дополнительных свойствах
        if (item.properties) {
            Object.values(item.properties).forEach(value => {
                if (typeof value === 'string' && value.toLowerCase().includes(query)) {
                    score += 10;
                }
            });
        }
        
        // Fuzzy search для обработки опечаток
        if (score === 0) {
            const fuzzyScore = calculateFuzzyScore(item.name || '', query);
            if (fuzzyScore > searchConfig.fuzzyThreshold) {
                score = fuzzyScore * 20;
            }
        }
        
        return score;
    }
    
    /**
     * Простой fuzzy search алгоритм
     */
    function calculateFuzzyScore(text, query) {
        if (!text || !query) return 0;
        
        text = text.toLowerCase();
        query = query.toLowerCase();
        
        if (text === query) return 1;
        if (text.includes(query)) return 0.8;
        
        // Левенштейн расстояние (упрощенная версия)
        const maxLength = Math.max(text.length, query.length);
        const distance = levenshteinDistance(text, query);
        
        return 1 - distance / maxLength;
    }
    
    /**
     * Вычисление расстояния Левенштейна
     */
    function levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Получение совпадений для подсветки
     */
    function getSearchMatches(item, query) {
        const matches = [];
        
        // Ищем совпадения в различных полях
        ['name', 'address', 'description', 'type'].forEach(field => {
            if (item[field] && item[field].toLowerCase().includes(query)) {
                matches.push({
                    field: field,
                    text: item[field],
                    query: query
                });
            }
        });
        
        return matches;
    }
    
    /**
     * Отображение результатов поиска
     */
    function displaySearchResults(results, query) {
        const html = `
            <div class="suggestions-header">
                <h4 class="suggestions-title">Результаты поиска</h4>
                <span class="suggestions-count">${results.length} найдено</span>
            </div>
            ${groupResultsByType(results).map(group => `
                <div class="suggestion-group">
                    <div class="group-header">
                        <i class="fas fa-${group.icon}"></i>
                        ${group.name}
                        <span class="suggestions-count">${group.items.length}</span>
                    </div>
                    ${group.items.map(item => createSuggestionItem(item, query)).join('')}
                </div>
            `).join('')}
            ${createQuickActions(query)}
        `;
        
        suggestionsContainer.innerHTML = html;
        showSuggestions();
        
        // Добавляем обработчики событий
        addSuggestionEventListeners();
    }
    
    /**
     * Группировка результатов по типу
     */
    function groupResultsByType(results) {
        const groups = {};
        
        results.forEach(item => {
            const layerType = getLayerType(item.layer);
            if (!groups[layerType]) {
                groups[layerType] = {
                    name: objectTypes[layerType]?.name || 'Прочие',
                    icon: objectTypes[layerType]?.icon || 'building',
                    items: []
                };
            }
            groups[layerType].items.push(item);
        });
        
        return Object.values(groups);
    }
    
    /**
     * Определение типа слоя
     */
    function getLayerType(layerName) {
        for (const [type, config] of Object.entries(objectTypes)) {
            if (config.layers.includes(layerName)) {
                return type;
            }
        }
        return 'other';
    }
    
    /**
     * Создание элемента предложения
     */
    function createSuggestionItem(item, query) {
        const highlightedName = highlightMatches(item.name || 'Без названия', query);
        const subtitle = item.address || item.description || item.type || '';
        const distance = item.distance ? `${Math.round(item.distance)}м` : '';
        
        return `
            <div class="suggestion-item" data-id="${item.id}" data-layer="${item.layer}">
                <div class="suggestion-icon">
                    <i class="fas fa-${getLayerIcon(item.layer)}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">
                        ${highlightedName}
                        <span class="suggestion-type">${getLayerDisplayName(item.layer)}</span>
                    </div>
                    ${subtitle ? `<div class="suggestion-subtitle">${subtitle}</div>` : ''}
                </div>
                ${distance ? `<div class="suggestion-distance">${distance}</div>` : ''}
            </div>
        `;
    }
    
    /**
     * Подсветка совпадений в тексте
     */
    function highlightMatches(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    /**
     * Получение иконки для слоя
     */
    function getLayerIcon(layerName) {
        const icons = {
            main_building: 'university',
            university_buildings: 'school',
            dormitory_buildings: 'home',
            lab_buildings: 'flask',
            library_buildings: 'book',
            sport_buildings: 'dumbbell',
            museum_buildings: 'landmark',
            cafe_buildings: 'coffee',
            gov_buildings: 'government-building',
            metro_stations: 'subway',
            metro_entrance: 'door-open',
            metro_platforms: 'train',
            tram_stops: 'tram',
            bus_stops: 'bus'
        };
        
        return icons[layerName] || 'building';
    }
    
    /**
     * Получение отображаемого имени слоя
     */
    function getLayerDisplayName(layerName) {
        const names = {
            main_building: 'Главное здание',
            university_buildings: 'Учебное здание',
            dormitory_buildings: 'Общежитие',
            lab_buildings: 'Лаборатория',
            library_buildings: 'Библиотека',
            sport_buildings: 'Спорт',
            museum_buildings: 'Музей',
            cafe_buildings: 'Кафе',
            gov_buildings: 'Госучреждение',
            metro_stations: 'Метро',
            metro_entrance: 'Вход в метро',
            metro_platforms: 'Платформа',
            tram_stops: 'Трамвай',
            bus_stops: 'Автобус'
        };
        
        return names[layerName] || 'Объект';
    }
    
    /**
     * Создание быстрых действий
     */
    function createQuickActions(query) {
        return `
            <div class="quick-actions">
                <div class="quick-actions-title">Быстрые действия</div>
                <div class="quick-action-buttons">
                    <button class="quick-action" onclick="SearchModule.clearSearch()">
                        <i class="fas fa-times"></i> Очистить
                    </button>
                    <button class="quick-action" onclick="SearchModule.saveSearch('${query}')">
                        <i class="fas fa-bookmark"></i> Сохранить
                    </button>
                    <button class="quick-action" onclick="SearchModule.showOnMap()">
                        <i class="fas fa-map"></i> На карте
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Отображение истории поиска
     */
    function showSearchHistory() {
        if (searchHistory.length === 0) {
            displayQuickSearches();
            return;
        }
        
        const html = `
            <div class="search-history">
                <div class="history-header">
                    <span>История поиска</span>
                    <button class="clear-history" onclick="SearchModule.clearHistory()">Очистить</button>
                </div>
                ${searchHistory.map(item => `
                    <div class="history-item" onclick="SearchModule.selectHistoryItem('${item}')">
                        <i class="fas fa-history"></i>
                        <span>${item}</span>
                        <button class="remove-history" onclick="SearchModule.removeHistoryItem('${item}'); event.stopPropagation();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            ${createQuickSearches()}
        `;
        
        suggestionsContainer.innerHTML = html;
        showSuggestions();
    }
    
    /**
     * Создание быстрых поисков
     */
    function createQuickSearches() {
        const quickSearches = [
            { text: 'Библиотеки', icon: 'book' },
            { text: 'Столовые', icon: 'utensils' },
            { text: 'Общежития', icon: 'home' },
            { text: 'Спортзалы', icon: 'dumbbell' },
            { text: 'Лаборатории', icon: 'flask' },
            { text: 'Метро', icon: 'subway' }
        ];
        
        return `
            <div class="quick-actions">
                <div class="quick-actions-title">Популярные запросы</div>
                <div class="quick-action-buttons">
                    ${quickSearches.map(item => `
                        <button class="quick-action" onclick="SearchModule.performQuickSearch('${item.text}')">
                            <i class="fas fa-${item.icon}"></i> ${item.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Отображение быстрых поисков
     */
    function displayQuickSearches() {
        const html = createQuickSearches();
        suggestionsContainer.innerHTML = html;
        showSuggestions();
    }
    
    /**
     * Отображение состояния загрузки
     */
    function showLoadingState() {
        suggestionsContainer.innerHTML = `
            <div class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <div>Поиск...</div>
            </div>
        `;
        showSuggestions();
    }
    
    /**
     * Отображение отсутствия результатов
     */
    function displayNoResults(query) {
        suggestionsContainer.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <h4>Ничего не найдено</h4>
                <p>По запросу "${query}" не найдено ни одного объекта. Попробуйте изменить поисковый запрос.</p>
                ${createQuickSearches()}
            </div>
        `;
        showSuggestions();
    }
    
    /**
     * Отображение ошибки поиска
     */
    function displaySearchError() {
        suggestionsContainer.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Ошибка поиска. Попробуйте еще раз.</div>
            </div>
        `;
        showSuggestions();
    }
    
    /**
     * Показ предложений
     */
    function showSuggestions() {
        suggestionsContainer.classList.add('show');
    }
    
    /**
     * Скрытие предложений
     */
    function hideSuggestions() {
        suggestionsContainer.classList.remove('show');
    }
    
    /**
     * Добавление обработчиков для предложений
     */
    function addSuggestionEventListeners() {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestions.forEach(item => {
            item.addEventListener('click', () => selectSuggestion(item));
            item.addEventListener('mouseenter', () => {
                suggestionsContainer.querySelector('.suggestion-item.highlighted')?.classList.remove('highlighted');
                item.classList.add('highlighted');
            });
        });
    }
    
    /**
     * Выбор предложения
     */
    function selectSuggestion(suggestionElement) {
        const id = suggestionElement.getAttribute('data-id');
        const layer = suggestionElement.getAttribute('data-layer');
        const name = suggestionElement.querySelector('.suggestion-title').textContent.trim();
        
        // Добавляем в историю
        addToHistory(searchInput.value);
        
        // Очищаем поле поиска
        searchInput.value = name;
        hideSuggestions();
        
        // Показываем объект на карте
        if (window.MapController) {
            window.MapController.focusOnObject(id, layer);
        }
        
        // Показываем информацию об объекте
        if (window.InfoPanel) {
            window.InfoPanel.showObjectInfo(id, layer);
        }
        
        // Уведомление
        window.MapUtils.showNotification(`Найден объект: ${name}`, 'success');
    }
    
    /**
     * Добавление в историю поиска
     */
    function addToHistory(query) {
        if (!query || query.length < searchConfig.minLength) return;
        
        // Удаляем дубликаты
        searchHistory = searchHistory.filter(item => item !== query);
        
        // Добавляем в начало
        searchHistory.unshift(query);
        
        // Ограничиваем размер истории
        if (searchHistory.length > searchConfig.maxHistory) {
            searchHistory = searchHistory.slice(0, searchConfig.maxHistory);
        }
        
        // Сохраняем в localStorage
        saveSearchHistory();
    }
    
    /**
     * Загрузка истории поиска
     */
    function loadSearchHistory() {
        searchHistory = window.MapUtils.loadFromStorage('searchHistory', []);
    }
    
    /**
     * Сохранение истории поиска
     */
    function saveSearchHistory() {
        window.MapUtils.saveToStorage('searchHistory', searchHistory);
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        
        /**
         * Установка данных для поиска
         */
        setSearchData: function(data) {
            searchData = data;
        },
        
        /**
         * Добавление данных для поиска
         */
        addSearchData: function(layerName, features) {
            const processedFeatures = features.map(feature => ({
                id: feature.getId(),
                layer: layerName,
                name: feature.get('name') || feature.get('title') || 'Без названия',
                address: feature.get('address'),
                description: feature.get('description'),
                type: feature.get('type'),
                properties: feature.getProperties(),
                geometry: feature.getGeometry()
            }));
            
            // Удаляем старые данные этого слоя
            searchData = searchData.filter(item => item.layer !== layerName);
            
            // Добавляем новые данные
            searchData.push(...processedFeatures);
        },
        
        /**
         * Программный поиск
         */
        search: function(query, filter = 'all') {
            if (!query || query.length < searchConfig.minLength) return;
            
            searchInput.value = query;
            currentFilter = filter;
            
            // Обновляем активный фильтр
            filterButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
            });
            
            performSearch(query);
        },
        
        /**
         * Очистка поиска
         */
        clearSearch: function() {
            searchInput.value = '';
            hideSuggestions();
        },
        
        /**
         * Быстрый поиск
         */
        performQuickSearch: function(query) {
            this.search(query);
        },
        
        /**
         * Выбор элемента истории
         */
        selectHistoryItem: function(query) {
            this.search(query);
        },
        
        /**
         * Удаление элемента истории
         */
        removeHistoryItem: function(query) {
            searchHistory = searchHistory.filter(item => item !== query);
            saveSearchHistory();
            showSearchHistory();
        },
        
        /**
         * Очистка истории
         */
        clearHistory: function() {
            searchHistory = [];
            saveSearchHistory();
            hideSuggestions();
        },
        
        /**
         * Сохранение поиска
         */
        saveSearch: function(query) {
            addToHistory(query);
            window.MapUtils.showNotification('Поиск сохранен в истории', 'success');
        },
        
        /**
         * Показать все результаты на карте
         */
        showOnMap: function() {
            const query = searchInput.value.trim();
            if (query && window.MapController) {
                window.MapController.highlightSearchResults(query);
            }
        },
        
        /**
         * Получение текущих результатов поиска
         */
        getCurrentResults: function() {
            return searchData;
        },
        
        /**
         * Фокус на поле поиска
         */
        focus: function() {
            searchInput.focus();
        }
    };
    
})();