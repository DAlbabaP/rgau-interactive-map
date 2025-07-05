/**
 * ИНФОРМАЦИОННАЯ ПАНЕЛЬ ОБЪЕКТОВ
 * Модуль для отображения и редактирования информации об объектах
 */

window.InfoPanel = (function() {
    
    // Приватные переменные
    let panelElement;
    let titleElement;
    let contentElement;
    let actionsElement;
    let currentObject = null;
    let currentObjectData = null;
    let isEditMode = false;
    let isVisible = false;
    
    // Кнопки действий
    let editButton;
    let saveButton;
    let cancelButton;
    let deleteButton;
    
    // Конфигурация отображения полей
    const fieldDisplayConfig = {
        // Основные поля
        name: { label: 'Название', icon: 'tag', priority: 1 },
        address: { label: 'Адрес', icon: 'map-marker-alt', priority: 2 },
        description: { label: 'Описание', icon: 'info-circle', priority: 3 },
        phone: { label: 'Телефон', icon: 'phone', priority: 4, type: 'contact' },
        email: { label: 'Email', icon: 'envelope', priority: 5, type: 'contact' },
        website: { label: 'Веб-сайт', icon: 'globe', priority: 6, type: 'contact' },
        working_hours: { label: 'Часы работы', icon: 'clock', priority: 7 },
        
        // Специфичные поля
        floors: { label: 'Этажей', icon: 'building', priority: 8 },
        year_built: { label: 'Год постройки', icon: 'calendar', priority: 9 },
        capacity: { label: 'Вместимость', icon: 'users', priority: 10 },
        services: { label: 'Услуги', icon: 'concierge-bell', priority: 11, type: 'list' },
        
        // Университетские поля
        faculties: { label: 'Факультеты', icon: 'graduation-cap', priority: 12, type: 'list' },
        departments: { label: 'Кафедры', icon: 'chalkboard-teacher', priority: 13, type: 'list' },
        room_numbers: { label: 'Аудитории', icon: 'door-open', priority: 14, type: 'list' },
        
        // Общежития
        total_places: { label: 'Всего мест', icon: 'bed', priority: 15 },
        available_places: { label: 'Свободно мест', icon: 'bed', priority: 16 },
        cost_per_month: { label: 'Стоимость/месяц', icon: 'money-bill', priority: 17, type: 'currency' },
        
        // Лаборатории
        safety_level: { label: 'Уровень безопасности', icon: 'shield-alt', priority: 18 },
        equipment_list: { label: 'Оборудование', icon: 'cogs', priority: 19, type: 'list' },
        
        // Транспорт
        routes: { label: 'Маршруты', icon: 'route', priority: 20, type: 'list' },
        schedule: { label: 'Расписание', icon: 'clock', priority: 21 }
    };
    
    /**
     * Инициализация информационной панели
     */
    function init() {
        try {
            panelElement = document.getElementById('info-panel');
            titleElement = document.getElementById('info-panel-title');
            contentElement = document.getElementById('info-content');
            actionsElement = document.querySelector('.info-actions');
            
            if (!panelElement || !contentElement) {
                console.error('Элементы информационной панели не найдены');
                return false;
            }
            
            // Получаем кнопки действий
            editButton = document.getElementById('edit-object');
            saveButton = document.getElementById('save-changes');
            cancelButton = document.getElementById('cancel-edit');
            deleteButton = document.getElementById('delete-object');
            
            // Настраиваем обработчики событий
            setupEventListeners();
            
            console.log('InfoPanel инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации InfoPanel:', error);
            return false;
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    function setupEventListeners() {
        // Кнопка закрытия панели
        const closeButton = document.getElementById('close-info-panel');
        if (closeButton) {
            closeButton.addEventListener('click', hidePanel);
        }
        
        // Кнопки действий
        if (editButton) {
            editButton.addEventListener('click', handleEditClick);
        }
        
        if (saveButton) {
            saveButton.addEventListener('click', handleSaveClick);
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', handleCancelClick);
        }
        
        if (deleteButton) {
            deleteButton.addEventListener('click', handleDeleteClick);
        }
        
        // Клавиатурные сокращения
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Закрытие панели при клике вне её
        document.addEventListener('click', handleOutsideClick);
    }
    
    /**
     * Показ информации об объекте
     */
    function showObjectInfo(objectId, layerName, objectData = null) {
        try {
            // Получаем данные объекта
            let featureData = objectData;
            
            if (!featureData && window.LayerManager) {
                const featureInfo = window.LayerManager.findFeatureById(objectId, layerName);
                if (featureInfo) {
                    featureData = {
                        id: objectId,
                        layer: layerName,
                        properties: featureInfo.feature.getProperties(),
                        geometry: featureInfo.feature.getGeometry()
                    };
                }
            }
            
            if (!featureData) {
                console.error('Данные объекта не найдены');
                return false;
            }
            
            currentObject = objectId;
            currentObjectData = featureData;
            
            // Обновляем заголовок
            updatePanelTitle(featureData);
            
            // Отображаем информацию
            displayObjectInfo(featureData);
            
            // Обновляем кнопки действий
            updateActionButtons();
            
            // Показываем панель
            showPanel();
            
            return true;
            
        } catch (error) {
            console.error('Ошибка отображения информации об объекте:', error);
            return false;
        }
    }
    
    /**
     * Обновление заголовка панели
     */
    function updatePanelTitle(featureData) {
        const objectName = featureData.properties?.name || 
                          featureData.properties?.title || 
                          'Объект без названия';
        
        const layerDisplayName = getLayerDisplayName(featureData.layer);
        
        if (titleElement) {
            titleElement.innerHTML = `
                <i class="fas fa-${getLayerIcon(featureData.layer)}"></i>
                ${isEditMode ? 'Редактирование:' : 'Информация об объекте'}
            `;
        }
    }
    
    /**
     * Отображение информации об объекте
     */
    function displayObjectInfo(featureData) {
        if (!contentElement) return;
        
        if (isEditMode) {
            displayEditForm(featureData);
        } else {
            displayReadOnlyInfo(featureData);
        }
    }
    
    /**
     * Отображение информации в режиме просмотра
     */
    function displayReadOnlyInfo(featureData) {
        const properties = featureData.properties || {};
        const objectName = properties.name || properties.title || 'Объект без названия';
        const layerDisplayName = getLayerDisplayName(featureData.layer);
        
        // Сортируем поля по приоритету
        const sortedFields = Object.keys(properties)
            .filter(key => properties[key] !== null && properties[key] !== undefined && properties[key] !== '')
            .sort((a, b) => {
                const aPriority = fieldDisplayConfig[a]?.priority || 999;
                const bPriority = fieldDisplayConfig[b]?.priority || 999;
                return aPriority - bPriority;
            });
        
        const html = `
            <div class="object-info">
                <div class="info-header">
                    <h2 class="object-title">
                        <i class="fas fa-${getLayerIcon(featureData.layer)}"></i>
                        ${objectName}
                    </h2>
                    <div class="object-type">${layerDisplayName}</div>
                </div>
                
                ${createInfoSections(sortedFields, properties)}
                
                ${createLocationSection(featureData.geometry)}
                
                ${createMetadataSection(featureData)}
            </div>
        `;
        
        contentElement.innerHTML = html;
        
        // Добавляем обработчики для контактных ссылок
        addContactHandlers();
    }
    
    /**
     * Создание секций информации
     */
    function createInfoSections(fields, properties) {
        // Группируем поля по секциям
        const sections = {
            basic: { title: 'Основная информация', icon: 'info-circle', fields: [] },
            contact: { title: 'Контактная информация', icon: 'address-book', fields: [] },
            details: { title: 'Дополнительные сведения', icon: 'list-ul', fields: [] },
            services: { title: 'Услуги и удобства', icon: 'concierge-bell', fields: [] }
        };
        
        fields.forEach(field => {
            const config = fieldDisplayConfig[field];
            const value = properties[field];
            
            if (!value) return;
            
            // Определяем секцию
            let sectionKey = 'details';
            if (['name', 'address', 'description', 'floors', 'year_built'].includes(field)) {
                sectionKey = 'basic';
            } else if (['phone', 'email', 'website', 'working_hours'].includes(field)) {
                sectionKey = 'contact';
            } else if (field.includes('service') || field.includes('amenities') || field.includes('has_')) {
                sectionKey = 'services';
            }
            
            sections[sectionKey].fields.push({
                field: field,
                config: config,
                value: value
            });
        });
        
        // Создаем HTML для секций
        return Object.entries(sections)
            .filter(([key, section]) => section.fields.length > 0)
            .map(([key, section]) => `
                <div class="info-section">
                    <h3 class="section-title">
                        <i class="fas fa-${section.icon}"></i>
                        ${section.title}
                    </h3>
                    <div class="info-grid">
                        ${section.fields.map(item => createInfoItem(item.field, item.config, item.value)).join('')}
                    </div>
                </div>
            `).join('');
    }
    
    /**
     * Создание элемента информации
     */
    function createInfoItem(field, config, value) {
        const label = config?.label || field;
        const icon = config?.icon || 'info';
        const type = config?.type || 'text';
        
        let displayValue = formatFieldValue(value, type);
        
        return `
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-${icon}"></i>
                    ${label}
                </div>
                <div class="info-value ${type}">
                    ${displayValue}
                </div>
            </div>
        `;
    }
    
    /**
     * Форматирование значения поля
     */
    function formatFieldValue(value, type) {
        if (!value) return '<span class="empty">Не указано</span>';
        
        switch (type) {
            case 'contact':
                if (value.includes('@')) {
                    return `<a href="mailto:${value}" class="contact-link">${value}</a>`;
                } else if (value.startsWith('http')) {
                    return `<a href="${value}" target="_blank" class="contact-link">${value}</a>`;
                } else if (value.match(/[\d\-\+\(\)\s]+/)) {
                    return `<a href="tel:${value.replace(/[^\d\+]/g, '')}" class="contact-link">${value}</a>`;
                }
                return value;
                
            case 'list':
                if (Array.isArray(value)) {
                    return value.map(item => `<span class="info-tag">${item}</span>`).join('');
                } else if (typeof value === 'string' && value.includes(',')) {
                    return value.split(',').map(item => `<span class="info-tag">${item.trim()}</span>`).join('');
                }
                return value;
                
            case 'currency':
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    return new Intl.NumberFormat('ru-RU', { 
                        style: 'currency', 
                        currency: 'RUB' 
                    }).format(numValue);
                }
                return value;
                
            case 'boolean':
                return value ? '<span class="info-tag success">Да</span>' : '<span class="info-tag">Нет</span>';
                
            default:
                return value;
        }
    }
    
    /**
     * Создание секции местоположения
     */
    function createLocationSection(geometry) {
        if (!geometry) return '';
        
        const center = window.MapUtils.getGeometryCenter(geometry);
        const coords = center.map(coord => coord.toFixed(6)).join(', ');
        
        return `
            <div class="info-section">
                <h3 class="section-title">
                    <i class="fas fa-map-marked-alt"></i>
                    Местоположение
                </h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-crosshairs"></i>
                            Координаты
                        </div>
                        <div class="info-value">
                            <code>${coords}</code>
                            <button class="copy-coords" data-coords="${coords}" title="Копировать координаты">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-shapes"></i>
                            Тип геометрии
                        </div>
                        <div class="info-value">${geometry.getType()}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Создание секции метаданных
     */
    function createMetadataSection(featureData) {
        return `
            <div class="info-section">
                <h3 class="section-title">
                    <i class="fas fa-database"></i>
                    Метаданные
                </h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-tag"></i>
                            ID объекта
                        </div>
                        <div class="info-value">
                            <code>${featureData.id || 'Не назначен'}</code>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-layer-group"></i>
                            Слой
                        </div>
                        <div class="info-value">${getLayerDisplayName(featureData.layer)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">
                            <i class="fas fa-clock"></i>
                            Последнее обновление
                        </div>
                        <div class="info-value">
                            ${featureData.properties?.last_updated || 'Неизвестно'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Отображение формы редактирования
     */
    function displayEditForm(featureData) {
        if (!window.DataForms) {
            console.error('DataForms не инициализирован');
            return;
        }
        
        // Определяем тип объекта для формы
        const objectType = getObjectTypeForForm(featureData.layer);
        
        // Создаем форму
        const form = window.DataForms.createForm(objectType, featureData.properties, contentElement);
        
        if (!form) {
            // Создаем простую форму, если специализированная недоступна
            createSimpleEditForm(featureData);
        }
    }
    
    /**
     * Создание простой формы редактирования
     */
    function createSimpleEditForm(featureData) {
        const properties = featureData.properties || {};
        
        const html = `
            <div class="simple-edit-form">
                <div class="form-section">
                    <h3 class="section-title">
                        <i class="fas fa-edit"></i>
                        Редактирование объекта
                    </h3>
                    <div class="form-content">
                        ${Object.keys(properties).map(key => {
                            const value = properties[key];
                            const config = fieldDisplayConfig[key] || { label: key, icon: 'edit' };
                            
                            return `
                                <div class="form-field">
                                    <label class="field-label">
                                        <i class="fas fa-${config.icon}"></i>
                                        ${config.label}
                                    </label>
                                    <input type="text" name="${key}" value="${value || ''}" class="field-input">
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        contentElement.innerHTML = html;
    }
    
    /**
     * Добавление обработчиков для контактов
     */
    function addContactHandlers() {
        // Копирование координат
        const copyButtons = contentElement.querySelectorAll('.copy-coords');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const coords = button.getAttribute('data-coords');
                navigator.clipboard.writeText(coords).then(() => {
                    window.MapUtils.showNotification('Координаты скопированы', 'success', 2000);
                });
            });
        });
        
        // Обработка контактных ссылок
        const contactLinks = contentElement.querySelectorAll('.contact-link');
        contactLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Дополнительная обработка, если нужна
            });
        });
    }
    
    /**
     * Обработка клика по кнопке редактирования
     */
    function handleEditClick() {
        if (!currentObjectData) return;
        
        // Проверяем, доступен ли режим разработки
        if (window.DevMode && !window.DevMode.isEnabled()) {
            window.MapUtils.showNotification('Включите режим разработки для редактирования', 'warning');
            return;
        }
        
        isEditMode = true;
        displayObjectInfo(currentObjectData);
        updateActionButtons();
    }
    
    /**
     * Обработка клика по кнопке сохранения
     */
    function handleSaveClick() {
        if (!currentObjectData || !isEditMode) return;
        
        try {
            let formData;
            
            // Получаем данные из формы
            if (window.DataForms && window.DataForms.getFormData()) {
                formData = window.DataForms.getFormData();
                
                // Валидируем форму
                if (!window.DataForms.validateForm()) {
                    window.MapUtils.showNotification('Исправьте ошибки в форме', 'error');
                    return;
                }
            } else {
                // Получаем данные из простой формы
                formData = getSimpleFormData();
            }
            
            if (!formData) {
                window.MapUtils.showNotification('Нет данных для сохранения', 'error');
                return;
            }
            
            // Обновляем объект
            updateObjectProperties(formData);
            
            // Выходим из режима редактирования
            isEditMode = false;
            currentObjectData.properties = { ...currentObjectData.properties, ...formData };
            
            // Обновляем отображение
            displayObjectInfo(currentObjectData);
            updateActionButtons();
            
            window.MapUtils.showNotification('Изменения сохранены', 'success');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            window.MapUtils.showNotification('Ошибка сохранения изменений', 'error');
        }
    }
    
    /**
     * Обработка клика по кнопке отмены
     */
    function handleCancelClick() {
        if (!currentObjectData) return;
        
        // Проверяем наличие несохраненных изменений
        if (window.DataForms && window.DataForms.hasUnsavedChanges()) {
            const confirmed = confirm('У вас есть несохраненные изменения. Вы уверены, что хотите отменить редактирование?');
            if (!confirmed) return;
        }
        
        isEditMode = false;
        displayObjectInfo(currentObjectData);
        updateActionButtons();
    }
    
    /**
     * Обработка клика по кнопке удаления
     */
    function handleDeleteClick() {
        if (!currentObject || !currentObjectData) return;
        
        const objectName = currentObjectData.properties?.name || 'объект';
        const confirmed = confirm(`Вы уверены, что хотите удалить ${objectName}? Это действие нельзя отменить.`);
        
        if (!confirmed) return;
        
        try {
            // Здесь должна быть логика удаления объекта
            // Пока просто скрываем панель
            hidePanel();
            window.MapUtils.showNotification(`Объект "${objectName}" удален`, 'info');
            
        } catch (error) {
            console.error('Ошибка удаления объекта:', error);
            window.MapUtils.showNotification('Ошибка удаления объекта', 'error');
        }
    }
    
    /**
     * Получение данных из простой формы
     */
    function getSimpleFormData() {
        const form = contentElement.querySelector('.simple-edit-form');
        if (!form) return null;
        
        const formData = {};
        const inputs = form.querySelectorAll('.field-input');
        
        inputs.forEach(input => {
            formData[input.name] = input.value;
        });
        
        return formData;
    }
    
    /**
     * Обновление свойств объекта
     */
    function updateObjectProperties(newProperties) {
        if (!window.LayerManager || !currentObject || !currentObjectData) return;
        
        const featureInfo = window.LayerManager.findFeatureById(currentObject, currentObjectData.layer);
        
        if (featureInfo) {
            // Обновляем свойства feature
            Object.keys(newProperties).forEach(key => {
                featureInfo.feature.set(key, newProperties[key]);
            });
            
            // Обновляем данные поиска
            if (window.SearchModule) {
                window.SearchModule.addSearchData(currentObjectData.layer, [featureInfo.feature]);
            }
        }
    }
    
    /**
     * Обновление кнопок действий
     */
    function updateActionButtons() {
        if (!actionsElement) return;
        
        const isDevMode = window.DevMode && window.DevMode.isEnabled();
        
        // Показываем/скрываем кнопки в зависимости от режима
        if (editButton) {
            editButton.style.display = (!isEditMode && isDevMode) ? 'inline-flex' : 'none';
        }
        
        if (saveButton) {
            saveButton.style.display = isEditMode ? 'inline-flex' : 'none';
        }
        
        if (cancelButton) {
            cancelButton.style.display = isEditMode ? 'inline-flex' : 'none';
        }
        
        if (deleteButton) {
            deleteButton.style.display = (!isEditMode && isDevMode) ? 'inline-flex' : 'none';
        }
    }
    
    /**
     * Показ панели
     */
    function showPanel() {
        if (panelElement) {
            panelElement.classList.add('show');
            isVisible = true;
            
            // Анимация появления
            panelElement.style.transform = 'translateX(0)';
        }
    }
    
    /**
     * Скрытие панели
     */
    function hidePanel() {
        if (panelElement) {
            panelElement.classList.remove('show');
            isVisible = false;
            
            // Сброс состояния
            currentObject = null;
            currentObjectData = null;
            isEditMode = false;
            
            // Очистка содержимого
            if (contentElement) {
                contentElement.innerHTML = `
                    <div class="no-selection">
                        <i class="fas fa-mouse-pointer"></i>
                        <p>Кликните на объект на карте, чтобы увидеть информацию</p>
                    </div>
                `;
            }
            
            updateActionButtons();
        }
    }
    
    /**
     * Обработка горячих клавиш
     */
    function handleKeyboardShortcuts(event) {
        if (!isVisible) return;
        
        switch (event.key) {
            case 'Escape':
                if (isEditMode) {
                    handleCancelClick();
                } else {
                    hidePanel();
                }
                break;
                
            case 'e':
                if (event.ctrlKey && !isEditMode) {
                    event.preventDefault();
                    handleEditClick();
                }
                break;
                
            case 's':
                if (event.ctrlKey && isEditMode) {
                    event.preventDefault();
                    handleSaveClick();
                }
                break;
        }
    }
    
    /**
     * Обработка кликов вне панели
     */
    function handleOutsideClick(event) {
        if (!isVisible || !panelElement) return;
        
        // Не закрываем панель при клике на саму панель или элементы управления
        if (panelElement.contains(event.target)) return;
        
        // Не закрываем при клике на карту (это обрабатывается отдельно)
        const mapElement = document.getElementById('map');
        if (mapElement && mapElement.contains(event.target)) return;
        
        // Не закрываем в режиме редактирования
        if (isEditMode) return;
        
        hidePanel();
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
            sport_buildings: 'Спортивный объект',
            buildings_in_university: 'Университетское здание',
            museum_buildings: 'Музей',
            cafe_buildings: 'Кафе/ресторан',
            gov_buildings: 'Государственное учреждение',
            metro_stations: 'Станция метро',
            metro_entrance: 'Вход в метро',
            metro_platforms: 'Платформа метро',
            tram_stops: 'Трамвайная остановка',
            bus_stops: 'Автобусная остановка'
        };
        
        return names[layerName] || layerName;
    }
    
    /**
     * Получение иконки слоя
     */
    function getLayerIcon(layerName) {
        const icons = {
            main_building: 'university',
            university_buildings: 'school',
            dormitory_buildings: 'home',
            lab_buildings: 'flask',
            library_buildings: 'book',
            sport_buildings: 'dumbbell',
            buildings_in_university: 'building-columns',
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
     * Получение типа объекта для формы
     */
    function getObjectTypeForForm(layerName) {
        // Маппинг слоев к типам форм
        const typeMapping = {
            main_building: 'main_building',
            university_buildings: 'university_buildings',
            dormitory_buildings: 'dormitory_buildings',
            lab_buildings: 'lab_buildings',
            library_buildings: 'library_buildings',
            sport_buildings: 'sport_buildings'
        };
        
        return typeMapping[layerName] || 'university_buildings';
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        showObjectInfo: showObjectInfo,
        hidePanel: hidePanel,
        
        /**
         * Показ панели с пустым состоянием
         */
        showEmptyState: function() {
            showPanel();
            if (contentElement) {
                contentElement.innerHTML = `
                    <div class="no-selection">
                        <i class="fas fa-info-circle"></i>
                        <p>Выберите объект для просмотра информации</p>
                    </div>
                `;
            }
        },
        
        /**
         * Проверка видимости панели
         */
        isVisible: function() {
            return isVisible;
        },
        
        /**
         * Получение текущего объекта
         */
        getCurrentObject: function() {
            return currentObject;
        },
        
        /**
         * Переключение в режим редактирования
         */
        enterEditMode: function() {
            if (currentObjectData) {
                handleEditClick();
            }
        },
        
        /**
         * Выход из режима редактирования
         */
        exitEditMode: function() {
            if (isEditMode) {
                handleCancelClick();
            }
        },
        
        /**
         * Проверка режима редактирования
         */
        isInEditMode: function() {
            return isEditMode;
        },
        
        /**
         * Обновление информации об объекте
         */
        refreshObjectInfo: function() {
            if (currentObject && currentObjectData) {
                showObjectInfo(currentObject, currentObjectData.layer, currentObjectData);
            }
        }
    };
    
})();