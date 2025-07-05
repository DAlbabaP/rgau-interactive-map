/**
 * ПАНЕЛЬ КАТЕГОРИЙ ОБЪЕКТОВ
 * Модуль для управления левой панелью с категориями и слоями
 */

window.CategoryPanel = (function() {
    
    // Приватные переменные
    let panelElement;
    let isInitialized = false;
    let collapsedCategories = new Set();
    let draggedElement = null;
    
    // Конфигурация категорий
    const categoryConfig = {
        university: {
            name: 'Университетские здания',
            icon: 'graduation-cap',
            color: '#667eea',
            layers: [
                { name: 'main_building', title: 'Главное здание', icon: 'building' },
                { name: 'university_buildings', title: 'Учебные здания', icon: 'school' },
                { name: 'dormitory_buildings', title: 'Общежития', icon: 'home' },
                { name: 'lab_buildings', title: 'Лаборатории', icon: 'flask' },
                { name: 'library_buildings', title: 'Библиотеки', icon: 'book' },
                { name: 'sport_buildings', title: 'Спортивные объекты', icon: 'dumbbell' },
                { name: 'buildings_in_university', title: 'Дополнительные здания', icon: 'building-columns' }
            ]
        },
        public: {
            name: 'Общественные здания',
            icon: 'city',
            color: '#e74c3c',
            layers: [
                { name: 'museum_buildings', title: 'Музеи', icon: 'landmark' },
                { name: 'cafe_buildings', title: 'Кафе и рестораны', icon: 'coffee' },
                { name: 'gov_buildings', title: 'Правительственные', icon: 'university' }
            ]
        },
        transport: {
            name: 'Транспорт',
            icon: 'bus',
            color: '#f39c12',
            layers: [
                { name: 'metro_stations', title: 'Станции метро', icon: 'subway' },
                { name: 'metro_entrance', title: 'Входы в метро', icon: 'door-open' },
                { name: 'metro_platforms', title: 'Платформы метро', icon: 'train' },
                { name: 'tram_stops', title: 'Трамвайные остановки', icon: 'tram' },
                { name: 'bus_stops', title: 'Автобусные остановки', icon: 'bus' }
            ]
        }
    };
    
    /**
     * Инициализация панели категорий
     */
    function init() {
        try {
            panelElement = document.getElementById('category-panel');
            if (!panelElement) {
                console.error('Элемент панели категорий не найден');
                return false;
            }
            
            // Загружаем состояние свернутых категорий
            loadCollapsedState();
            
            // Устанавливаем обработчики событий
            setupEventListeners();
            
            // Настраиваем drag & drop
            setupDragAndDrop();
            
            isInitialized = true;
            console.log('Панель категорий инициализирована');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации панели категорий:', error);
            return false;
        }
    }
    
    /**
     * Установка обработчиков событий
     */
    function setupEventListeners() {
        // Обработчики для заголовков категорий
        const categoryHeaders = panelElement.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', handleCategoryToggle);
        });
        
        // Обработчики для переключателей слоев
        const layerToggles = panelElement.querySelectorAll('.layer-toggle input');
        layerToggles.forEach(toggle => {
            toggle.addEventListener('change', handleLayerToggle);
        });
        
        // Обработчики для элементов слоев
        const layerItems = panelElement.querySelectorAll('.layer-item');
        layerItems.forEach(item => {
            // Двойной клик для масштабирования к слою
            item.addEventListener('dblclick', handleLayerDoubleClick);
            
            // Контекстное меню
            item.addEventListener('contextmenu', handleLayerContextMenu);
            
            // Hover эффекты
            item.addEventListener('mouseenter', handleLayerHover);
            item.addEventListener('mouseleave', handleLayerLeave);
        });
        
        // Кнопка переключения всех слоев
        const toggleAllBtn = document.getElementById('toggle-all-layers');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', handleToggleAllLayers);
        }
        
        // Кнопка сворачивания всех категорий
        const collapseAllBtn = document.getElementById('collapse-all');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', handleCollapseAll);
        }
        
        // Клавиатурные сокращения
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    /**
     * Настройка drag & drop для переупорядочивания слоев
     */
    function setupDragAndDrop() {
        const layerItems = panelElement.querySelectorAll('.layer-item');
        
        layerItems.forEach(item => {
            item.draggable = true;
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
    
    /**
     * Обработка переключения категории
     */
    function handleCategoryToggle(event) {
        const header = event.currentTarget;
        const category = header.getAttribute('data-category');
        const items = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (!category || !items || !toggleIcon) return;
        
        const isCollapsed = header.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Разворачиваем категорию
            header.classList.remove('collapsed');
            items.style.maxHeight = items.scrollHeight + 'px';
            items.style.opacity = '1';
            collapsedCategories.delete(category);
            
            // Анимация иконки
            toggleIcon.style.transform = 'rotate(0deg)';
            
        } else {
            // Сворачиваем категорию
            header.classList.add('collapsed');
            items.style.maxHeight = '0';
            items.style.opacity = '0';
            collapsedCategories.add(category);
            
            // Анимация иконки
            toggleIcon.style.transform = 'rotate(-90deg)';
        }
        
        // Сохраняем состояние
        saveCollapsedState();
        
        // Анимация заголовка
        header.style.transform = 'translateX(5px)';
        setTimeout(() => {
            header.style.transform = '';
        }, 150);
    }
    
    /**
     * Обработка переключения слоя
     */
    function handleLayerToggle(event) {
        const toggle = event.currentTarget;
        const layerItem = toggle.closest('.layer-item');
        const layerName = layerItem.getAttribute('data-layer');
        const isChecked = toggle.checked;
        
        if (!layerName) return;
        
        try {
            // Показываем индикатор загрузки
            layerItem.classList.add('loading');
            
            // Переключаем видимость слоя
            if (window.LayerManager) {
                const success = window.LayerManager.setLayerVisibility(layerName, isChecked);
                
                if (success) {
                    // Обновляем визуальное состояние
                    updateLayerItemState(layerItem, isChecked);
                    
                    // Уведомление
                    const layerTitle = layerItem.querySelector('span').textContent;
                    const action = isChecked ? 'включен' : 'выключен';
                    window.MapUtils.showNotification(`Слой "${layerTitle}" ${action}`, 'info', 2000);
                    
                } else {
                    // Откатываем изменение при ошибке
                    toggle.checked = !isChecked;
                    window.MapUtils.showNotification('Ошибка переключения слоя', 'error');
                }
            }
            
        } catch (error) {
            console.error('Ошибка переключения слоя:', error);
            toggle.checked = !isChecked;
            window.MapUtils.showNotification('Ошибка переключения слоя', 'error');
            
        } finally {
            // Убираем индикатор загрузки
            setTimeout(() => {
                layerItem.classList.remove('loading');
            }, 500);
        }
    }
    
    /**
     * Обработка двойного клика по слою (масштабирование)
     */
    function handleLayerDoubleClick(event) {
        const layerItem = event.currentTarget;
        const layerName = layerItem.getAttribute('data-layer');
        
        if (!layerName || !window.LayerManager) return;
        
        // Масштабируемся к слою
        const success = window.LayerManager.zoomToLayer(layerName);
        
        if (success) {
            const layerTitle = layerItem.querySelector('span').textContent;
            window.MapUtils.showNotification(`Масштабирование к слою "${layerTitle}"`, 'info', 2000);
            
            // Визуальная обратная связь
            layerItem.style.background = 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)';
            layerItem.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                layerItem.style.background = '';
                layerItem.style.transform = '';
            }, 1000);
        }
    }
    
    /**
     * Обработка контекстного меню слоя
     */
    function handleLayerContextMenu(event) {
        event.preventDefault();
        
        const layerItem = event.currentTarget;
        const layerName = layerItem.getAttribute('data-layer');
        
        if (!layerName) return;
        
        // Создаем контекстное меню
        showLayerContextMenu(event.clientX, event.clientY, layerName);
    }
    
    /**
     * Показ контекстного меню слоя
     */
    function showLayerContextMenu(x, y, layerName) {
        // Удаляем существующее меню
        const existingMenu = document.querySelector('.layer-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const layerInfo = window.LayerManager ? window.LayerManager.getLayerInfo(layerName) : null;
        const isVisible = layerInfo ? layerInfo.visible : false;
        
        const menu = document.createElement('div');
        menu.className = 'layer-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="toggle">
                <i class="fas fa-${isVisible ? 'eye-slash' : 'eye'}"></i>
                ${isVisible ? 'Скрыть слой' : 'Показать слой'}
            </div>
            <div class="context-menu-item" data-action="zoom">
                <i class="fas fa-search-plus"></i>
                Масштабировать к слою
            </div>
            <div class="context-menu-item" data-action="info">
                <i class="fas fa-info-circle"></i>
                Информация о слое
            </div>
            <div class="context-menu-item" data-action="style">
                <i class="fas fa-palette"></i>
                Настроить стиль
            </div>
            <div class="context-menu-item" data-action="export">
                <i class="fas fa-download"></i>
                Экспортировать данные
            </div>
            <div class="context-menu-item danger" data-action="reset">
                <i class="fas fa-undo"></i>
                Сбросить стиль
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Обработчики для пунктов меню
        menu.addEventListener('click', (event) => {
            const action = event.target.closest('.context-menu-item')?.getAttribute('data-action');
            if (action) {
                handleContextMenuAction(action, layerName);
            }
            menu.remove();
        });
        
        // Закрытие меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }
    
    /**
     * Обработка действий контекстного меню
     */
    function handleContextMenuAction(action, layerName) {
        switch (action) {
            case 'toggle':
                if (window.LayerManager) {
                    window.LayerManager.toggleLayerVisibility(layerName);
                }
                break;
                
            case 'zoom':
                if (window.LayerManager) {
                    window.LayerManager.zoomToLayer(layerName);
                }
                break;
                
            case 'info':
                showLayerInfoModal(layerName);
                break;
                
            case 'style':
                if (window.StyleEditor) {
                    window.StyleEditor.editLayerStyle(layerName);
                }
                break;
                
            case 'export':
                exportLayerData(layerName);
                break;
                
            case 'reset':
                if (window.LayerManager) {
                    window.LayerManager.resetLayerStyle(layerName);
                    window.MapUtils.showNotification('Стиль слоя сброшен', 'success');
                }
                break;
        }
    }
    
    /**
     * Показ модального окна с информацией о слое
     */
    function showLayerInfoModal(layerName) {
        if (!window.LayerManager) return;
        
        const layerInfo = window.LayerManager.getLayerInfo(layerName);
        if (!layerInfo) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Информация о слое: ${layerInfo.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Название</div>
                            <div class="info-value">${layerInfo.title}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Категория</div>
                            <div class="info-value">${getCategoryDisplayName(layerInfo.category)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Объектов</div>
                            <div class="info-value">${layerInfo.featureCount}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Интерактивный</div>
                            <div class="info-value">${layerInfo.interactive ? 'Да' : 'Нет'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Видимый</div>
                            <div class="info-value">${layerInfo.visible ? 'Да' : 'Нет'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Стиль</div>
                            <div class="info-value">
                                <div style="width: 30px; height: 20px; background: ${layerInfo.style?.fillColor || '#ccc'}; border: 1px solid ${layerInfo.style?.strokeColor || '#999'}; border-radius: 3px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчик закрытия
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Экспорт данных слоя
     */
    function exportLayerData(layerName) {
        if (!window.LayerManager) return;
        
        const layerInfo = window.LayerManager.getLayerInfo(layerName);
        if (!layerInfo) return;
        
        try {
            const layer = window.LayerManager.getAllLayers().get(layerName);
            if (!layer) return;
            
            const features = layer.getSource().getFeatures();
            const geojson = new ol.format.GeoJSON().writeFeatures(features);
            
            window.MapUtils.exportToJSON(JSON.parse(geojson), `${layerName}.geojson`);
            
        } catch (error) {
            console.error('Ошибка экспорта слоя:', error);
            window.MapUtils.showNotification('Ошибка экспорта слоя', 'error');
        }
    }
    
    /**
     * Обработка наведения на слой
     */
    function handleLayerHover(event) {
        const layerItem = event.currentTarget;
        const layerName = layerItem.getAttribute('data-layer');
        
        // Добавляем визуальные эффекты
        layerItem.style.transition = 'all 0.3s ease';
        
        // Показываем дополнительную информацию в tooltip
        showLayerTooltip(layerItem, layerName);
    }
    
    /**
     * Обработка ухода курсора со слоя
     */
    function handleLayerLeave(event) {
        const layerItem = event.currentTarget;
        
        // Скрываем tooltip
        hideLayerTooltip();
    }
    
    /**
     * Показ tooltip'а слоя
     */
    function showLayerTooltip(element, layerName) {
        if (!window.LayerManager) return;
        
        const layerInfo = window.LayerManager.getLayerInfo(layerName);
        if (!layerInfo) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'layer-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title">${layerInfo.title}</div>
            <div class="tooltip-content">
                <div>Объектов: ${layerInfo.featureCount}</div>
                <div>Состояние: ${layerInfo.visible ? 'Видимый' : 'Скрытый'}</div>
                <div><small>Двойной клик для масштабирования</small></div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Позиционируем tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top = rect.top + 'px';
        tooltip.style.zIndex = '1000';
        
        // Добавляем ID для последующего удаления
        tooltip.id = 'layer-tooltip';
    }
    
    /**
     * Скрытие tooltip'а
     */
    function hideLayerTooltip() {
        const tooltip = document.getElementById('layer-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * Обработка переключения всех слоев
     */
    function handleToggleAllLayers(event) {
        if (window.LayerManager) {
            window.LayerManager.toggleAllLayers();
        }
    }
    
    /**
     * Обработка сворачивания всех категорий
     */
    function handleCollapseAll(event) {
        const allCategories = ['university', 'public', 'transport'];
        const shouldExpand = collapsedCategories.size === allCategories.length;
        
        if (shouldExpand) {
            // Разворачиваем все
            allCategories.forEach(category => expandCategory(category));
            collapsedCategories.clear();
        } else {
            // Сворачиваем все
            allCategories.forEach(category => collapseCategory(category));
            allCategories.forEach(category => collapsedCategories.add(category));
        }
        
        saveCollapsedState();
    }
    
    /**
     * Разворачивание категории
     */
    function expandCategory(category) {
        const header = panelElement.querySelector(`[data-category="${category}"]`);
        if (header && header.classList.contains('collapsed')) {
            header.click();
        }
    }
    
    /**
     * Сворачивание категории
     */
    function collapseCategory(category) {
        const header = panelElement.querySelector(`[data-category="${category}"]`);
        if (header && !header.classList.contains('collapsed')) {
            header.click();
        }
    }
    
    /**
     * Обработка клавиатурных сокращений
     */
    function handleKeyboardShortcuts(event) {
        if (!isInitialized) return;
        
        // Только если фокус не на поле ввода
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.key) {
            case '1':
                if (event.ctrlKey) {
                    event.preventDefault();
                    toggleCategoryVisibility('university');
                }
                break;
                
            case '2':
                if (event.ctrlKey) {
                    event.preventDefault();
                    toggleCategoryVisibility('public');
                }
                break;
                
            case '3':
                if (event.ctrlKey) {
                    event.preventDefault();
                    toggleCategoryVisibility('transport');
                }
                break;
                
            case 'a':
                if (event.ctrlKey && event.shiftKey) {
                    event.preventDefault();
                    handleToggleAllLayers();
                }
                break;
        }
    }
    
    /**
     * Переключение видимости всей категории
     */
    function toggleCategoryVisibility(category) {
        const config = categoryConfig[category];
        if (!config || !window.LayerManager) return;
        
        // Проверяем, все ли слои категории видимы
        const allVisible = config.layers.every(layer => {
            const layerInfo = window.LayerManager.getLayerInfo(layer.name);
            return layerInfo ? layerInfo.visible : false;
        });
        
        const newVisibility = !allVisible;
        
        // Переключаем все слои категории
        config.layers.forEach(layer => {
            window.LayerManager.setLayerVisibility(layer.name, newVisibility);
        });
        
        const action = newVisibility ? 'включены' : 'выключены';
        window.MapUtils.showNotification(`Слои категории "${config.name}" ${action}`, 'info');
    }
    
    /**
     * Drag & Drop обработчики
     */
    function handleDragStart(event) {
        draggedElement = event.currentTarget;
        event.currentTarget.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', event.currentTarget.outerHTML);
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const draggedOver = event.currentTarget;
        if (draggedOver !== draggedElement && draggedOver.classList.contains('layer-item')) {
            draggedOver.classList.add('drag-over');
        }
    }
    
    function handleDrop(event) {
        event.preventDefault();
        
        const draggedOver = event.currentTarget;
        draggedOver.classList.remove('drag-over');
        
        if (draggedElement && draggedOver !== draggedElement) {
            // Меняем местами элементы
            const parent = draggedElement.parentNode;
            const nextSibling = draggedElement.nextSibling === draggedOver ? draggedOver.nextSibling : draggedOver;
            
            parent.insertBefore(draggedElement, nextSibling);
            
            // Сохраняем новый порядок
            saveLayerOrder();
            
            window.MapUtils.showNotification('Порядок слоев изменен', 'info', 2000);
        }
    }
    
    function handleDragEnd(event) {
        event.currentTarget.classList.remove('dragging');
        
        // Убираем все индикаторы перетаскивания
        const allItems = panelElement.querySelectorAll('.layer-item');
        allItems.forEach(item => item.classList.remove('drag-over'));
        
        draggedElement = null;
    }
    
    /**
     * Обновление состояния элемента слоя
     */
    function updateLayerItemState(layerItem, isVisible) {
        layerItem.classList.toggle('disabled', !isVisible);
        
        // Обновляем счетчик, если нужно
        if (window.LayerManager) {
            const layerName = layerItem.getAttribute('data-layer');
            const layerInfo = window.LayerManager.getLayerInfo(layerName);
            if (layerInfo) {
                updateLayerCount(layerName, layerInfo.featureCount);
            }
        }
    }
    
    /**
     * Обновление счетчика слоя
     */
    function updateLayerCount(layerName, count) {
        const layerItem = panelElement.querySelector(`[data-layer="${layerName}"]`);
        if (layerItem) {
            const countElement = layerItem.querySelector('.layer-count');
            if (countElement) {
                countElement.textContent = count;
                
                // Анимация изменения
                countElement.style.transform = 'scale(1.2)';
                countElement.style.color = '#667eea';
                
                setTimeout(() => {
                    countElement.style.transform = '';
                    countElement.style.color = '';
                }, 300);
            }
        }
    }
    
    /**
     * Получение отображаемого имени категории
     */
    function getCategoryDisplayName(category) {
        return categoryConfig[category]?.name || category;
    }
    
    /**
     * Состояние свернутых категорий
     */
    function loadCollapsedState() {
        const savedState = window.MapUtils.loadFromStorage('collapsedCategories', []);
        collapsedCategories = new Set(savedState);
        
        // Применяем сохраненное состояние
        collapsedCategories.forEach(category => {
            setTimeout(() => collapseCategory(category), 100);
        });
    }
    
    function saveCollapsedState() {
        window.MapUtils.saveToStorage('collapsedCategories', Array.from(collapsedCategories));
    }
    
    /**
     * Сохранение порядка слоев
     */
    function saveLayerOrder() {
        const order = {};
        
        Object.keys(categoryConfig).forEach(category => {
            const categoryElement = panelElement.querySelector(`[data-category="${category}"]`).nextElementSibling;
            const layerItems = categoryElement.querySelectorAll('.layer-item');
            
            order[category] = Array.from(layerItems).map(item => item.getAttribute('data-layer'));
        });
        
        window.MapUtils.saveToStorage('layerOrder', order);
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        
        /**
         * Обновление счетчиков объектов
         */
        updateCounts: function() {
            if (!window.LayerManager) return;
            
            // Обновляем счетчики для каждого слоя
            Object.values(categoryConfig).forEach(category => {
                category.layers.forEach(layer => {
                    const layerInfo = window.LayerManager.getLayerInfo(layer.name);
                    if (layerInfo) {
                        updateLayerCount(layer.name, layerInfo.featureCount);
                    }
                });
            });
        },
        
        /**
         * Подсветка слоя в панели
         */
        highlightLayer: function(layerName) {
            const layerItem = panelElement.querySelector(`[data-layer="${layerName}"]`);
            if (layerItem) {
                layerItem.classList.add('active');
                
                // Прокручиваем к элементу
                layerItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Убираем подсветку через некоторое время
                setTimeout(() => {
                    layerItem.classList.remove('active');
                }, 3000);
            }
        },
        
        /**
         * Показ/скрытие панели
         */
        togglePanel: function() {
            panelElement.classList.toggle('hidden');
        },
        
        /**
         * Получение конфигурации категорий
         */
        getCategoryConfig: function() {
            return categoryConfig;
        },
        
        /**
         * Программное переключение слоя
         */
        toggleLayer: function(layerName) {
            const toggle = panelElement.querySelector(`[data-layer="${layerName}"] input[type="checkbox"]`);
            if (toggle) {
                toggle.click();
            }
        },
        
        /**
         * Обновление состояния переключателя
         */
        updateToggleState: function(layerName, visible) {
            const toggle = panelElement.querySelector(`[data-layer="${layerName}"] input[type="checkbox"]`);
            if (toggle) {
                toggle.checked = visible;
            }
            
            const layerItem = panelElement.querySelector(`[data-layer="${layerName}"]`);
            if (layerItem) {
                updateLayerItemState(layerItem, visible);
            }
        }
    };
    
})();