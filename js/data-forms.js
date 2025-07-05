/**
 * СПЕЦИАЛИЗИРОВАННЫЕ ФОРМЫ ДАННЫХ
 * Модуль для создания и управления формами для разных типов зданий
 */

window.DataForms = (function() {
    
    // Приватные переменные
    let currentForm = null;
    let currentObject = null;
    let isEditMode = false;
    let unsavedChanges = false;
    let autoSaveInterval = null;
    
    // Конфигурация форм для разных типов объектов
    const formConfigs = {
        // Университетские здания
        main_building: {
            title: 'Главное здание университета',
            icon: 'university',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Общие данные',
                            icon: 'building',
                            fields: [
                                { name: 'name', label: 'Название здания', type: 'text', required: true },
                                { name: 'building_number', label: 'Номер здания', type: 'text' },
                                { name: 'address', label: 'Адрес', type: 'text', required: true },
                                { name: 'floors', label: 'Количество этажей', type: 'number', min: 1 },
                                { name: 'year_built', label: 'Год постройки', type: 'number', min: 1800, max: 2024 },
                                { name: 'description', label: 'Описание', type: 'textarea' }
                            ]
                        },
                        {
                            title: 'Администрация',
                            icon: 'users-cog',
                            fields: [
                                { name: 'administration', label: 'Администрация', type: 'textarea' },
                                { name: 'main_services', label: 'Основные службы', type: 'array' },
                                { name: 'working_hours', label: 'Часы работы', type: 'text' },
                                { name: 'rector_office', label: 'Ректорат', type: 'text' },
                                { name: 'admission_office', label: 'Приемная комиссия', type: 'text' }
                            ]
                        }
                    ]
                },
                {
                    id: 'history',
                    title: 'История',
                    icon: 'history',
                    sections: [
                        {
                            title: 'Историческая информация',
                            icon: 'book-open',
                            fields: [
                                { name: 'history', label: 'История здания', type: 'textarea' },
                                { name: 'historical_events', label: 'Исторические события', type: 'array' },
                                { name: 'famous_people', label: 'Известные личности', type: 'array' },
                                { name: 'architectural_style', label: 'Архитектурный стиль', type: 'text' }
                            ]
                        }
                    ]
                },
                {
                    id: 'contacts',
                    title: 'Контакты',
                    icon: 'address-book',
                    sections: [
                        {
                            title: 'Контактная информация',
                            icon: 'phone',
                            fields: [
                                { name: 'phone', label: 'Телефон', type: 'tel' },
                                { name: 'email', label: 'Email', type: 'email' },
                                { name: 'website', label: 'Веб-сайт', type: 'url' },
                                { name: 'emergency_contacts', label: 'Экстренные контакты', type: 'array' }
                            ]
                        }
                    ]
                }
            ]
        },
        
        university_buildings: {
            title: 'Учебное здание',
            icon: 'school',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Общие данные',
                            icon: 'building',
                            fields: [
                                { name: 'name', label: 'Название здания', type: 'text', required: true },
                                { name: 'building_number', label: 'Номер здания', type: 'text' },
                                { name: 'address', label: 'Адрес', type: 'text', required: true },
                                { name: 'floors', label: 'Количество этажей', type: 'number', min: 1 }
                            ]
                        }
                    ]
                },
                {
                    id: 'academic',
                    title: 'Академическая информация',
                    icon: 'graduation-cap',
                    sections: [
                        {
                            title: 'Структура',
                            icon: 'sitemap',
                            fields: [
                                { name: 'faculties', label: 'Факультеты', type: 'multi-select', options: [] },
                                { name: 'departments', label: 'Кафедры', type: 'multi-select', options: [] },
                                { name: 'has_administration', label: 'Дирекция', type: 'checkbox' },
                                { name: 'administration_type', label: 'Дирекция чего', type: 'text', conditional: 'has_administration' },
                                { name: 'administration_specialization', label: 'Специализация дирекции', type: 'text', conditional: 'has_administration' }
                            ]
                        },
                        {
                            title: 'Аудитории',
                            icon: 'chalkboard-teacher',
                            fields: [
                                { name: 'room_numbers', label: 'Номера аудиторий', type: 'array' },
                                { name: 'lecture_halls', label: 'Лекционные залы (количество)', type: 'number', min: 0 },
                                { name: 'seminar_rooms', label: 'Семинарские аудитории (количество)', type: 'number', min: 0 },
                                { name: 'computer_rooms', label: 'Компьютерные классы (количество)', type: 'number', min: 0 }
                            ]
                        }
                    ]
                },
                {
                    id: 'services',
                    title: 'Услуги и удобства',
                    icon: 'concierge-bell',
                    sections: [
                        {
                            title: 'Доступные услуги',
                            icon: 'list-check',
                            fields: [
                                { name: 'has_cafeteria', label: 'Столовая/буфет', type: 'checkbox' },
                                { name: 'has_library', label: 'Библиотека', type: 'checkbox' },
                                { name: 'has_computer_lab', label: 'Компьютерный класс', type: 'checkbox' },
                                { name: 'has_wifi', label: 'Wi-Fi зоны', type: 'checkbox' },
                                { name: 'has_medical', label: 'Медпункт', type: 'checkbox' },
                                { name: 'has_parking', label: 'Парковка', type: 'checkbox' }
                            ]
                        }
                    ]
                },
                {
                    id: 'contacts',
                    title: 'Контактная информация',
                    icon: 'address-book',
                    sections: [
                        {
                            title: 'Контакты',
                            icon: 'phone',
                            fields: [
                                { name: 'phone', label: 'Телефон', type: 'tel' },
                                { name: 'email', label: 'Email', type: 'email' },
                                { name: 'website', label: 'Веб-сайт', type: 'url' },
                                { name: 'working_hours', label: 'Часы работы', type: 'text' },
                                { name: 'administration_contacts', label: 'Контакты дирекции', type: 'textarea' }
                            ]
                        }
                    ]
                }
            ]
        },
        
        dormitory_buildings: {
            title: 'Общежитие',
            icon: 'home',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Общие данные',
                            icon: 'home',
                            fields: [
                                { name: 'name', label: 'Название общежития', type: 'text', required: true },
                                { name: 'dormitory_number', label: 'Номер общежития', type: 'text' },
                                { name: 'address', label: 'Адрес', type: 'text', required: true },
                                { name: 'year_built', label: 'Год постройки', type: 'number', min: 1900, max: 2024 }
                            ]
                        }
                    ]
                },
                {
                    id: 'accommodation',
                    title: 'Размещение',
                    icon: 'bed',
                    sections: [
                        {
                            title: 'Места и комнаты',
                            icon: 'door-closed',
                            fields: [
                                { name: 'total_places', label: 'Общее количество мест', type: 'number', min: 0, required: true },
                                { name: 'available_places', label: 'Свободные места', type: 'number', min: 0 },
                                { name: 'room_types', label: 'Типы комнат', type: 'room-types' },
                                { name: 'floors', label: 'Количество этажей', type: 'number', min: 1 },
                                { name: 'has_elevator', label: 'Наличие лифта', type: 'checkbox' }
                            ]
                        }
                    ]
                },
                {
                    id: 'amenities',
                    title: 'Удобства',
                    icon: 'concierge-bell',
                    sections: [
                        {
                            title: 'Доступные удобства',
                            icon: 'list-check',
                            fields: [
                                { name: 'kitchen_type', label: 'Кухня', type: 'select', options: [
                                    { value: 'floor', label: 'На этаже' },
                                    { value: 'common', label: 'Общая' },
                                    { value: 'none', label: 'Отсутствует' }
                                ]},
                                { name: 'has_laundry', label: 'Прачечная', type: 'checkbox' },
                                { name: 'has_study_rooms', label: 'Комнаты для занятий', type: 'checkbox' },
                                { name: 'has_internet', label: 'Интернет', type: 'checkbox' },
                                { name: 'has_parking', label: 'Парковка', type: 'checkbox' },
                                { name: 'has_gym', label: 'Спортзал', type: 'checkbox' }
                            ]
                        }
                    ]
                },
                {
                    id: 'administration',
                    title: 'Администрация',
                    icon: 'users-cog',
                    sections: [
                        {
                            title: 'Управление общежитием',
                            icon: 'user-tie',
                            fields: [
                                { name: 'commandant_office', label: 'Комендатура (контакты)', type: 'textarea' },
                                { name: 'working_hours', label: 'Часы работы', type: 'text' },
                                { name: 'emergency_phone', label: 'Телефон экстренной связи', type: 'tel' },
                                { name: 'duty_service', label: 'Дежурная служба', type: 'text' }
                            ]
                        }
                    ]
                },
                {
                    id: 'costs',
                    title: 'Стоимость и условия',
                    icon: 'money-bill',
                    sections: [
                        {
                            title: 'Финансовые условия',
                            icon: 'coins',
                            fields: [
                                { name: 'cost_per_month', label: 'Стоимость в месяц', type: 'number', min: 0 },
                                { name: 'currency', label: 'Валюта', type: 'select', options: [
                                    { value: 'RUB', label: 'Рубли' },
                                    { value: 'USD', label: 'Доллары' },
                                    { value: 'EUR', label: 'Евро' }
                                ]},
                                { name: 'utilities_included', label: 'Коммунальные услуги включены', type: 'checkbox' },
                                { name: 'deposit', label: 'Залог', type: 'number', min: 0 },
                                { name: 'settlement_conditions', label: 'Условия заселения', type: 'textarea' }
                            ]
                        }
                    ]
                }
            ]
        },
        
        lab_buildings: {
            title: 'Лабораторное здание',
            icon: 'flask',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Общие данные',
                            icon: 'building',
                            fields: [
                                { name: 'name', label: 'Название лаборатории', type: 'text', required: true },
                                { name: 'specialization', label: 'Специализация', type: 'text', required: true },
                                { name: 'department', label: 'Принадлежность к кафедре', type: 'text' },
                                { name: 'lab_type', label: 'Тип лаборатории', type: 'select', options: [
                                    { value: 'research', label: 'Исследовательская' },
                                    { value: 'teaching', label: 'Учебная' },
                                    { value: 'mixed', label: 'Смешанная' },
                                    { value: 'industrial', label: 'Промышленная' }
                                ]}
                            ]
                        }
                    ]
                },
                {
                    id: 'equipment',
                    title: 'Оборудование',
                    icon: 'cogs',
                    sections: [
                        {
                            title: 'Оборудование и инструменты',
                            icon: 'tools',
                            fields: [
                                { name: 'equipment_list', label: 'Список оборудования', type: 'array' },
                                { name: 'safety_level', label: 'Уровень безопасности', type: 'select', options: [
                                    { value: 'low', label: 'Низкий' },
                                    { value: 'medium', label: 'Средний' },
                                    { value: 'high', label: 'Высокий' },
                                    { value: 'critical', label: 'Критический' }
                                ]},
                                { name: 'special_ventilation', label: 'Специальная вентиляция', type: 'checkbox' },
                                { name: 'emergency_equipment', label: 'Аварийное оборудование', type: 'textarea' },
                                { name: 'equipment_cost', label: 'Стоимость оборудования', type: 'number', min: 0 }
                            ]
                        }
                    ]
                },
                {
                    id: 'access',
                    title: 'Доступ и безопасность',
                    icon: 'shield-alt',
                    sections: [
                        {
                            title: 'Управление доступом',
                            icon: 'key',
                            fields: [
                                { name: 'access_level', label: 'Уровень доступа', type: 'select', options: [
                                    { value: 'public', label: 'Общий' },
                                    { value: 'restricted', label: 'Ограниченный' },
                                    { value: 'confidential', label: 'Конфиденциальный' }
                                ]},
                                { name: 'responsible_person', label: 'Ответственное лицо', type: 'text' },
                                { name: 'working_hours', label: 'Часы работы', type: 'text' },
                                { name: 'booking_required', label: 'Требуется бронирование', type: 'checkbox' },
                                { name: 'safety_briefing', label: 'Инструктаж по ТБ', type: 'checkbox' },
                                { name: 'equipment_insurance', label: 'Страховка оборудования', type: 'checkbox' }
                            ]
                        }
                    ]
                },
                {
                    id: 'research',
                    title: 'Исследовательская деятельность',
                    icon: 'microscope',
                    sections: [
                        {
                            title: 'Научная работа',
                            icon: 'atom',
                            fields: [
                                { name: 'research_types', label: 'Типы исследований', type: 'array' },
                                { name: 'scientific_projects', label: 'Научные проекты', type: 'array' },
                                { name: 'publications', label: 'Публикации', type: 'array' },
                                { name: 'partners', label: 'Партнеры', type: 'array' }
                            ]
                        }
                    ]
                }
            ]
        },
        
        // Упрощенные формы для других типов
        library_buildings: {
            title: 'Библиотечное здание',
            icon: 'book',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Общие данные',
                            icon: 'book-open',
                            fields: [
                                { name: 'name', label: 'Название библиотеки', type: 'text', required: true },
                                { name: 'library_type', label: 'Тип библиотеки', type: 'select', options: [
                                    { value: 'central', label: 'Центральная' },
                                    { value: 'faculty', label: 'Факультетская' },
                                    { value: 'specialized', label: 'Специализированная' }
                                ]},
                                { name: 'collections', label: 'Фонды', type: 'textarea' },
                                { name: 'reading_halls', label: 'Читальные залы', type: 'text' },
                                { name: 'electronic_resources', label: 'Электронные ресурсы', type: 'checkbox' },
                                { name: 'working_hours', label: 'График работы', type: 'text' }
                            ]
                        }
                    ]
                }
            ]
        },
        
        sport_buildings: {
            title: 'Спортивное здание',
            icon: 'dumbbell',
            tabs: [
                {
                    id: 'basic',
                    title: 'Основная информация',
                    icon: 'info-circle',
                    sections: [
                        {
                            title: 'Спортивная информация',
                            icon: 'running',
                            fields: [
                                { name: 'name', label: 'Название', type: 'text', required: true },
                                { name: 'sport_types', label: 'Виды спорта', type: 'array' },
                                { name: 'halls', label: 'Залы', type: 'array' },
                                { name: 'equipment', label: 'Оборудование', type: 'textarea' },
                                { name: 'trainers', label: 'Тренеры', type: 'array' },
                                { name: 'schedule', label: 'Расписание', type: 'textarea' },
                                { name: 'sport_types_available', label: 'Типы спортивных объектов', type: 'multi-select', options: [
                                    { value: 'gym', label: 'Спортзал' },
                                    { value: 'pool', label: 'Бассейн' },
                                    { value: 'court', label: 'Корт' },
                                    { value: 'field', label: 'Поле' }
                                ]}
                            ]
                        }
                    ]
                }
            ]
        }
    };
    
    /**
     * Инициализация модуля форм данных
     */
    function init() {
        try {
            console.log('DataForms инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации DataForms:', error);
            return false;
        }
    }
    
    /**
     * Создание формы для объекта
     */
    function createForm(objectType, objectData = null, container = null) {
        if (!container) {
            console.error('Контейнер для формы не указан');
            return null;
        }
        
        const config = formConfigs[objectType];
        if (!config) {
            console.error(`Конфигурация формы для типа ${objectType} не найдена`);
            return null;
        }
        
        currentObject = objectData;
        isEditMode = !!objectData;
        
        // Создаем форму
        const form = document.createElement('div');
        form.className = 'dynamic-form';
        form.innerHTML = createFormHTML(config, objectData);
        
        // Очищаем контейнер и добавляем форму
        container.innerHTML = '';
        container.appendChild(form);
        
        // Настраиваем обработчики событий
        setupFormEventListeners(form, config);
        
        // Заполняем данными, если есть
        if (objectData) {
            populateForm(form, objectData);
        }
        
        // Настраиваем автосохранение
        setupAutoSave(form);
        
        currentForm = form;
        return form;
    }
    
    /**
     * Создание HTML формы
     */
    function createFormHTML(config, data) {
        const tabsHTML = config.tabs.map((tab, index) => 
            `<button class="form-tab ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">
                <i class="fas fa-${tab.icon}"></i>
                ${tab.title}
                <span class="form-tab-badge" style="display: none;">0</span>
            </button>`
        ).join('');
        
        const contentHTML = config.tabs.map((tab, index) =>
            `<div class="form-tab-content ${index === 0 ? 'active' : ''}" id="${tab.id}">
                ${createTabContentHTML(tab)}
            </div>`
        ).join('');
        
        return `
            <div class="form-tabs">
                ${tabsHTML}
            </div>
            <div class="form-content">
                ${contentHTML}
            </div>
        `;
    }
    
    /**
     * Создание содержимого вкладки
     */
    function createTabContentHTML(tab) {
        return tab.sections.map(section => 
            `<div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="fas fa-${section.icon}"></i>
                        ${section.title}
                    </h3>
                    <button class="section-toggle" type="button">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div class="section-content">
                    ${createSectionFieldsHTML(section.fields)}
                </div>
            </div>`
        ).join('');
    }
    
    /**
     * Создание HTML полей секции
     */
    function createSectionFieldsHTML(fields) {
        return fields.map(field => {
            const fieldHTML = createFieldHTML(field);
            return `<div class="form-row">${fieldHTML}</div>`;
        }).join('');
    }
    
    /**
     * Создание HTML поля
     */
    function createFieldHTML(field) {
        const isRequired = field.required ? ' required' : '';
        const conditionalAttr = field.conditional ? ` data-conditional="${field.conditional}"` : '';
        
        let inputHTML = '';
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                inputHTML = `<input type="${field.type}" id="${field.name}" name="${field.name}" class="field-input" ${isRequired}${conditionalAttr}>`;
                break;
                
            case 'number':
                const min = field.min !== undefined ? ` min="${field.min}"` : '';
                const max = field.max !== undefined ? ` max="${field.max}"` : '';
                inputHTML = `<input type="number" id="${field.name}" name="${field.name}" class="field-input"${min}${max} ${isRequired}${conditionalAttr}>`;
                break;
                
            case 'textarea':
                inputHTML = `<textarea id="${field.name}" name="${field.name}" class="field-input field-textarea" rows="4" ${isRequired}${conditionalAttr}></textarea>`;
                break;
                
            case 'select':
                const options = field.options ? field.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('') : '';
                inputHTML = `<select id="${field.name}" name="${field.name}" class="field-input field-select" ${isRequired}${conditionalAttr}>
                    <option value="">Выберите...</option>
                    ${options}
                </select>`;
                break;
                
            case 'checkbox':
                inputHTML = `
                    <label class="custom-checkbox">
                        <input type="checkbox" id="${field.name}" name="${field.name}" ${isRequired}${conditionalAttr}>
                        <span class="checkbox-checkmark"></span>
                    </label>
                `;
                break;
                
            case 'multi-select':
                inputHTML = createMultiSelectHTML(field);
                break;
                
            case 'array':
                inputHTML = createArrayFieldHTML(field);
                break;
                
            case 'room-types':
                inputHTML = createRoomTypesHTML(field);
                break;
                
            default:
                inputHTML = `<input type="text" id="${field.name}" name="${field.name}" class="field-input" ${isRequired}${conditionalAttr}>`;
        }
        
        return `
            <div class="form-field${isRequired}" data-field="${field.name}">
                <label for="${field.name}" class="field-label">${field.label}</label>
                ${inputHTML}
                <div class="field-error" style="display: none;"></div>
                <div class="field-help" style="display: none;"></div>
            </div>
        `;
    }
    
    /**
     * Создание множественного выбора
     */
    function createMultiSelectHTML(field) {
        return `
            <div class="multi-select" data-field="${field.name}">
                <div class="multi-select-header">
                    <div class="multi-select-placeholder">Выберите опции...</div>
                    <div class="multi-select-values" style="display: none;"></div>
                    <i class="fas fa-chevron-down multi-select-arrow"></i>
                </div>
                <div class="multi-select-dropdown">
                    ${field.options ? field.options.map(opt => 
                        `<div class="multi-select-option" data-value="${opt.value}">
                            <label class="custom-checkbox">
                                <input type="checkbox" value="${opt.value}">
                                <span class="checkbox-checkmark"></span>
                            </label>
                            ${opt.label}
                        </div>`
                    ).join('') : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Создание поля массива
     */
    function createArrayFieldHTML(field) {
        return `
            <div class="array-field" data-field="${field.name}">
                <div class="array-header">
                    <span class="array-title">${field.label}</span>
                    <button type="button" class="array-add">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div class="array-items">
                    <!-- Элементы будут добавляться динамически -->
                </div>
            </div>
        `;
    }
    
    /**
     * Создание селектора типов комнат
     */
    function createRoomTypesHTML(field) {
        const roomTypes = [
            { value: 'single', label: '1-местные', icon: 'bed' },
            { value: 'double', label: '2-местные', icon: 'bed' },
            { value: 'triple', label: '3-местные', icon: 'bed' },
            { value: 'block', label: 'Блоки', icon: 'door-closed' }
        ];
        
        return `
            <div class="room-types">
                ${roomTypes.map(type => 
                    `<div class="room-type-card" data-value="${type.value}">
                        <div class="room-type-icon">
                            <i class="fas fa-${type.icon}"></i>
                        </div>
                        <div class="room-type-title">${type.label}</div>
                        <div class="room-type-count">
                            <input type="number" min="0" placeholder="Количество" data-type="${type.value}">
                        </div>
                    </div>`
                ).join('')}
            </div>
        `;
    }
    
    /**
     * Настройка обработчиков событий формы
     */
    function setupFormEventListeners(form, config) {
        // Переключение вкладок
        const tabs = form.querySelectorAll('.form-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab, form));
        });
        
        // Сворачивание/разворачивание секций
        const sectionToggles = form.querySelectorAll('.section-toggle');
        sectionToggles.forEach(toggle => {
            toggle.addEventListener('click', () => toggleSection(toggle));
        });
        
        // Обработчики для полей массивов
        const arrayFields = form.querySelectorAll('.array-field');
        arrayFields.forEach(field => {
            setupArrayField(field);
        });
        
        // Множественный выбор
        const multiSelects = form.querySelectorAll('.multi-select');
        multiSelects.forEach(select => {
            setupMultiSelect(select);
        });
        
        // Условные поля
        const conditionalFields = form.querySelectorAll('[data-conditional]');
        conditionalFields.forEach(field => {
            setupConditionalField(field, form);
        });
        
        // Валидация полей
        const inputs = form.querySelectorAll('.field-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                clearFieldError(input);
                markFieldModified(input);
                trackUnsavedChanges();
            });
        });
        
        // Типы комнат
        const roomTypes = form.querySelectorAll('.room-types');
        roomTypes.forEach(roomType => {
            setupRoomTypes(roomType);
        });
    }
    
    /**
     * Переключение вкладок
     */
    function switchTab(clickedTab, form) {
        // Убираем активные классы
        form.querySelectorAll('.form-tab').forEach(tab => tab.classList.remove('active'));
        form.querySelectorAll('.form-tab-content').forEach(content => content.classList.remove('active'));
        
        // Добавляем активный класс
        clickedTab.classList.add('active');
        
        const tabId = clickedTab.getAttribute('data-tab');
        const content = form.querySelector(`#${tabId}`);
        if (content) {
            content.classList.add('active');
        }
    }
    
    /**
     * Сворачивание/разворачивание секции
     */
    function toggleSection(toggle) {
        const section = toggle.closest('.form-section');
        const content = section.querySelector('.section-content');
        const icon = toggle.querySelector('i');
        
        if (section.classList.contains('collapsed')) {
            // Разворачиваем
            section.classList.remove('collapsed');
            content.classList.remove('collapsed');
            icon.style.transform = 'rotate(0deg)';
        } else {
            // Сворачиваем
            section.classList.add('collapsed');
            content.classList.add('collapsed');
            icon.style.transform = 'rotate(-90deg)';
        }
    }
    
    /**
     * Настройка поля массива
     */
    function setupArrayField(arrayField) {
        const addButton = arrayField.querySelector('.array-add');
        const itemsContainer = arrayField.querySelector('.array-items');
        
        addButton.addEventListener('click', () => {
            addArrayItem(itemsContainer);
        });
    }
    
    /**
     * Добавление элемента массива
     */
    function addArrayItem(container, value = '') {
        const item = document.createElement('div');
        item.className = 'array-item';
        item.innerHTML = `
            <span class="array-item-drag">
                <i class="fas fa-grip-vertical"></i>
            </span>
            <input type="text" class="array-item-input" value="${value}" placeholder="Введите значение">
            <button type="button" class="array-item-remove">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(item);
        
        // Обработчик удаления
        const removeBtn = item.querySelector('.array-item-remove');
        removeBtn.addEventListener('click', () => {
            item.remove();
            trackUnsavedChanges();
        });
        
        // Обработчик изменения
        const input = item.querySelector('.array-item-input');
        input.addEventListener('input', trackUnsavedChanges);
        
        // Фокус на новом поле
        input.focus();
        
        trackUnsavedChanges();
    }
    
    /**
     * Настройка множественного выбора
     */
    function setupMultiSelect(multiSelect) {
        const header = multiSelect.querySelector('.multi-select-header');
        const dropdown = multiSelect.querySelector('.multi-select-dropdown');
        const arrow = multiSelect.querySelector('.multi-select-arrow');
        
        header.addEventListener('click', () => {
            const isOpen = dropdown.classList.contains('show');
            
            if (isOpen) {
                dropdown.classList.remove('show');
                header.classList.remove('open');
                arrow.classList.remove('open');
            } else {
                dropdown.classList.add('show');
                header.classList.add('open');
                arrow.classList.add('open');
            }
        });
        
        // Обработчики для опций
        const options = dropdown.querySelectorAll('.multi-select-option');
        options.forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            
            option.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                }
                updateMultiSelectValues(multiSelect);
                trackUnsavedChanges();
            });
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!multiSelect.contains(e.target)) {
                dropdown.classList.remove('show');
                header.classList.remove('open');
                arrow.classList.remove('open');
            }
        });
    }
    
    /**
     * Обновление значений множественного выбора
     */
    function updateMultiSelectValues(multiSelect) {
        const valuesContainer = multiSelect.querySelector('.multi-select-values');
        const placeholder = multiSelect.querySelector('.multi-select-placeholder');
        const checkedOptions = multiSelect.querySelectorAll('.multi-select-option input:checked');
        
        if (checkedOptions.length === 0) {
            valuesContainer.style.display = 'none';
            placeholder.style.display = 'block';
        } else {
            valuesContainer.style.display = 'flex';
            placeholder.style.display = 'none';
            
            valuesContainer.innerHTML = Array.from(checkedOptions).map(checkbox => {
                const option = checkbox.closest('.multi-select-option');
                const label = option.textContent.trim();
                
                return `
                    <span class="multi-select-tag">
                        ${label}
                        <button type="button" class="multi-select-tag-remove" data-value="${checkbox.value}">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                `;
            }).join('');
            
            // Обработчики удаления тегов
            const removeButtons = valuesContainer.querySelectorAll('.multi-select-tag-remove');
            removeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = btn.getAttribute('data-value');
                    const checkbox = multiSelect.querySelector(`input[value="${value}"]`);
                    if (checkbox) {
                        checkbox.checked = false;
                        updateMultiSelectValues(multiSelect);
                        trackUnsavedChanges();
                    }
                });
            });
        }
    }
    
    /**
     * Настройка условных полей
     */
    function setupConditionalField(field, form) {
        const conditionFieldName = field.getAttribute('data-conditional');
        const conditionField = form.querySelector(`[name="${conditionFieldName}"]`);
        
        if (conditionField) {
            const updateVisibility = () => {
                const isVisible = conditionField.type === 'checkbox' 
                    ? conditionField.checked 
                    : conditionField.value;
                
                const fieldContainer = field.closest('.form-field');
                fieldContainer.style.display = isVisible ? 'block' : 'none';
            };
            
            conditionField.addEventListener('change', updateVisibility);
            updateVisibility(); // Начальное состояние
        }
    }
    
    /**
     * Настройка типов комнат
     */
    function setupRoomTypes(roomTypesContainer) {
        const cards = roomTypesContainer.querySelectorAll('.room-type-card');
        
        cards.forEach(card => {
            const input = card.querySelector('input');
            
            card.addEventListener('click', () => {
                input.focus();
            });
            
            input.addEventListener('input', () => {
                const hasValue = input.value && parseInt(input.value) > 0;
                card.classList.toggle('selected', hasValue);
                trackUnsavedChanges();
            });
        });
    }
    
    /**
     * Заполнение формы данными
     */
    function populateForm(form, data) {
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (!field) return;
            
            const value = data[key];
            
            if (field.type === 'checkbox') {
                field.checked = !!value;
            } else if (field.type === 'radio') {
                if (field.value === value) {
                    field.checked = true;
                }
            } else if (field.classList.contains('multi-select')) {
                // Обработка множественного выбора
                if (Array.isArray(value)) {
                    value.forEach(val => {
                        const checkbox = field.querySelector(`input[value="${val}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                    updateMultiSelectValues(field.closest('.multi-select'));
                }
            } else if (field.closest('.array-field')) {
                // Обработка массивов
                if (Array.isArray(value)) {
                    const container = field.closest('.array-field').querySelector('.array-items');
                    value.forEach(item => {
                        addArrayItem(container, item);
                    });
                }
            } else if (field.closest('.room-types')) {
                // Обработка типов комнат
                if (typeof value === 'object') {
                    Object.keys(value).forEach(roomType => {
                        const input = field.closest('.room-types').querySelector(`input[data-type="${roomType}"]`);
                        if (input) {
                            input.value = value[roomType];
                            input.closest('.room-type-card').classList.add('selected');
                        }
                    });
                }
            } else {
                field.value = value || '';
            }
        });
    }
    
    /**
     * Валидация поля
     */
    function validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        const fieldContainer = field.closest('.form-field');
        
        // Очищаем предыдущие ошибки
        clearFieldError(field);
        
        // Проверка обязательных полей
        if (isRequired && !value) {
            showFieldError(field, 'Это поле обязательно для заполнения');
            return false;
        }
        
        // Валидация email
        if (field.type === 'email' && value) {
            if (!window.MapUtils.validateEmail(value)) {
                showFieldError(field, 'Введите корректный email адрес');
                return false;
            }
        }
        
        // Валидация телефона
        if (field.type === 'tel' && value) {
            if (!window.MapUtils.validatePhone(value)) {
                showFieldError(field, 'Введите корректный номер телефона');
                return false;
            }
        }
        
        // Валидация URL
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                showFieldError(field, 'Введите корректный URL');
                return false;
            }
        }
        
        // Показываем успех
        showFieldSuccess(field);
        return true;
    }
    
    /**
     * Показ ошибки поля
     */
    function showFieldError(field, message) {
        const fieldContainer = field.closest('.form-field');
        const errorElement = fieldContainer.querySelector('.field-error');
        
        field.classList.add('error');
        field.classList.remove('success');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    /**
     * Показ успешной валидации
     */
    function showFieldSuccess(field) {
        const fieldContainer = field.closest('.form-field');
        
        field.classList.add('success');
        field.classList.remove('error');
    }
    
    /**
     * Очистка ошибки поля
     */
    function clearFieldError(field) {
        const fieldContainer = field.closest('.form-field');
        const errorElement = fieldContainer.querySelector('.field-error');
        
        field.classList.remove('error', 'success');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    /**
     * Отметка поля как измененного
     */
    function markFieldModified(field) {
        const fieldContainer = field.closest('.form-field');
        fieldContainer.classList.add('modified');
        
        // Убираем отметку через некоторое время
        setTimeout(() => {
            fieldContainer.classList.remove('modified');
            fieldContainer.classList.add('saved');
            
            setTimeout(() => {
                fieldContainer.classList.remove('saved');
            }, 2000);
        }, 1000);
    }
    
    /**
     * Отслеживание несохраненных изменений
     */
    function trackUnsavedChanges() {
        unsavedChanges = true;
        showUnsavedIndicator(true);
    }
    
    /**
     * Показ индикатора несохраненных изменений
     */
    function showUnsavedIndicator(show) {
        let indicator = document.querySelector('.autosave-indicator');
        
        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'autosave-indicator show';
            indicator.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Есть несохраненные изменения</span>
            `;
            document.body.appendChild(indicator);
        } else if (!show && indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Настройка автосохранения
     */
    function setupAutoSave(form) {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        
        autoSaveInterval = setInterval(() => {
            if (unsavedChanges && currentObject) {
                const formData = serializeForm(form);
                saveFormData(formData);
            }
        }, 30000); // Автосохранение каждые 30 секунд
    }
    
    /**
     * Сериализация формы
     */
    function serializeForm(form) {
        const data = {};
        
        // Обычные поля
        const inputs = form.querySelectorAll('.field-input');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.name] = input.checked;
            } else if (input.type === 'radio' && input.checked) {
                data[input.name] = input.value;
            } else if (input.name) {
                data[input.name] = input.value;
            }
        });
        
        // Массивы
        const arrayFields = form.querySelectorAll('.array-field');
        arrayFields.forEach(field => {
            const fieldName = field.getAttribute('data-field');
            const items = field.querySelectorAll('.array-item-input');
            data[fieldName] = Array.from(items)
                .map(item => item.value.trim())
                .filter(value => value);
        });
        
        // Множественный выбор
        const multiSelects = form.querySelectorAll('.multi-select');
        multiSelects.forEach(select => {
            const fieldName = select.getAttribute('data-field');
            const checkedOptions = select.querySelectorAll('input:checked');
            data[fieldName] = Array.from(checkedOptions).map(option => option.value);
        });
        
        // Типы комнат
        const roomTypes = form.querySelectorAll('.room-types');
        roomTypes.forEach(roomType => {
            const roomData = {};
            const inputs = roomType.querySelectorAll('input[data-type]');
            inputs.forEach(input => {
                const value = parseInt(input.value) || 0;
                if (value > 0) {
                    roomData[input.getAttribute('data-type')] = value;
                }
            });
            if (Object.keys(roomData).length > 0) {
                data.room_types = roomData;
            }
        });
        
        return data;
    }
    
    /**
     * Сохранение данных формы
     */
    function saveFormData(data) {
        try {
            // Здесь должна быть логика сохранения на сервер
            // Пока сохраняем в localStorage
            if (currentObject && currentObject.id) {
                const savedData = window.MapUtils.loadFromStorage('formData', {});
                savedData[currentObject.id] = data;
                window.MapUtils.saveToStorage('formData', savedData);
            }
            
            unsavedChanges = false;
            showUnsavedIndicator(false);
            
            // Показываем индикатор сохранения
            showSaveIndicator('saved');
            
        } catch (error) {
            console.error('Ошибка сохранения данных формы:', error);
            showSaveIndicator('error');
        }
    }
    
    /**
     * Показ индикатора сохранения
     */
    function showSaveIndicator(status) {
        let indicator = document.querySelector('.autosave-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'autosave-indicator show';
            document.body.appendChild(indicator);
        }
        
        indicator.className = `autosave-indicator show ${status}`;
        
        switch (status) {
            case 'saving':
                indicator.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Сохранение...</span>
                `;
                break;
            case 'saved':
                indicator.innerHTML = `
                    <i class="fas fa-check"></i>
                    <span>Сохранено</span>
                `;
                break;
            case 'error':
                indicator.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Ошибка сохранения</span>
                `;
                break;
        }
        
        if (status !== 'saving') {
            setTimeout(() => {
                if (indicator) {
                    indicator.remove();
                }
            }, 3000);
        }
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        createForm: createForm,
        
        /**
         * Валидация формы
         */
        validateForm: function(form = currentForm) {
            if (!form) return false;
            
            const inputs = form.querySelectorAll('.field-input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            return isValid;
        },
        
        /**
         * Получение данных формы
         */
        getFormData: function(form = currentForm) {
            if (!form) return null;
            return serializeForm(form);
        },
        
        /**
         * Сохранение формы
         */
        saveForm: function(form = currentForm) {
            if (!form) return false;
            
            if (!this.validateForm(form)) {
                window.MapUtils.showNotification('Исправьте ошибки в форме', 'error');
                return false;
            }
            
            const data = serializeForm(form);
            saveFormData(data);
            return true;
        },
        
        /**
         * Сброс формы
         */
        resetForm: function(form = currentForm) {
            if (!form) return;
            
            form.querySelectorAll('.field-input').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
                clearFieldError(input);
            });
            
            // Очищаем массивы
            form.querySelectorAll('.array-items').forEach(container => {
                container.innerHTML = '';
            });
            
            // Сбрасываем множественный выбор
            form.querySelectorAll('.multi-select input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            form.querySelectorAll('.multi-select').forEach(select => {
                updateMultiSelectValues(select);
            });
            
            unsavedChanges = false;
            showUnsavedIndicator(false);
        },
        
        /**
         * Получение конфигурации форм
         */
        getFormConfigs: function() {
            return formConfigs;
        },
        
        /**
         * Есть ли несохраненные изменения
         */
        hasUnsavedChanges: function() {
            return unsavedChanges;
        }
    };
    
})();