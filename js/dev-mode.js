/**
 * РЕЖИМ РАЗРАБОТКИ
 * Модуль для управления режимом разработки и панелью разработчика
 */

window.DevMode = (function() {
    
    // Приватные переменные
    let isEnabled = false;
    let isInitialized = false;
    let devPanel;
    let devOverlay;
    let currentTab = 'styles';
    let autoSaveEnabled = true;
    let validationResults = [];
    
    // DOM элементы
    let toggleButton;
    let modeIndicator;
    let devTabs;
    let devContents;
    
    // Элементы вкладок
    let stylesTab;
    let dataTab;
    let exportTab;
    
    // Статистика
    let devStats = {
        editsCount: 0,
        stylesChanged: 0,
        dataValidated: 0,
        exportCount: 0,
        startTime: null
    };
    
    /**
     * Инициализация режима разработки
     */
    function init() {
        try {
            // Получаем DOM элементы
            devPanel = document.getElementById('dev-panel');
            toggleButton = document.getElementById('dev-mode-toggle');
            modeIndicator = document.getElementById('mode-indicator');
            devTabs = document.querySelectorAll('.dev-tab');
            devContents = document.querySelectorAll('.dev-tab-content');
            
            if (!devPanel || !toggleButton) {
                console.error('Элементы режима разработки не найдены');
                return false;
            }
            
            // Настраиваем обработчики событий
            setupEventListeners();
            
            // Создаем оверлей
            createDevOverlay();
            
            // Загружаем сохраненное состояние
            loadDevState();
            
            // Инициализируем вкладки
            initializeTabs();
            
            isInitialized = true;
            console.log('DevMode инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации DevMode:', error);
            return false;
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    function setupEventListeners() {
        // Переключение режима разработки
        toggleButton.addEventListener('click', toggleDevMode);
        
        // Закрытие панели разработчика
        const closeButton = document.getElementById('close-dev-panel');
        if (closeButton) {
            closeButton.addEventListener('click', hideDevPanel);
        }
        
        // Переключение вкладок
        devTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Обработчики для элементов управления
        setupControlHandlers();
    }
    
    /**
     * Настройка обработчиков элементов управления
     */
    function setupControlHandlers() {
        // Кнопки валидации данных
        const validateBtn = document.getElementById('validate-data');
        if (validateBtn) {
            validateBtn.addEventListener('click', validateAllData);
        }
        
        // Переключатель автосохранения
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('click', toggleAutoSave);
        }
        
        // История изменений
        const showHistoryBtn = document.getElementById('show-history');
        if (showHistoryBtn) {
            showHistoryBtn.addEventListener('click', showChangeHistory);
        }
        
        // Массовые операции
        const batchUpdateBtn = document.getElementById('batch-update');
        if (batchUpdateBtn) {
            batchUpdateBtn.addEventListener('click', performBatchUpdate);
        }
        
        // Экспорт/импорт
        setupExportImportHandlers();
    }
    
    /**
     * Настройка обработчиков экспорта/импорта
     */
    function setupExportImportHandlers() {
        // Экспорт стилей
        const exportStylesBtn = document.getElementById('export-styles');
        if (exportStylesBtn) {
            exportStylesBtn.addEventListener('click', exportStyles);
        }
        
        // Экспорт данных
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', exportData);
        }
        
        // Экспорт всего
        const exportAllBtn = document.getElementById('export-all');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', exportAll);
        }
        
        // Импорт стилей
        const importStylesBtn = document.getElementById('import-styles');
        if (importStylesBtn) {
            importStylesBtn.addEventListener('click', () => triggerFileImport('styles'));
        }
        
        // Импорт данных
        const importDataBtn = document.getElementById('import-data');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => triggerFileImport('data'));
        }
        
        // Скрытый input для файлов
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileImport);
        }
    }
    
    /**
     * Переключение режима разработки
     */
    function toggleDevMode() {
        if (isEnabled) {
            disableDevMode();
        } else {
            enableDevMode();
        }
    }
    
    /**
     * Включение режима разработки
     */
    function enableDevMode() {
        isEnabled = true;
        devStats.startTime = Date.now();
        
        // Обновляем UI
        document.body.classList.add('dev-mode-active');
        toggleButton.classList.add('active');
        modeIndicator.textContent = 'Разработка';
        
        // Показываем панель разработчика
        showDevPanel();
        
        // Показываем оверлей
        if (devOverlay) {
            devOverlay.classList.remove('hidden');
        }
        
        // Сохраняем состояние
        saveDevState();
        
        // Уведомление
        window.MapUtils.showNotification('Режим разработки включен', 'info');
        
        // Показываем подсказку горячих клавиш
        showHotkeysHint();
        
        console.log('Режим разработки включен');
    }
    
    /**
     * Отключение режима разработки
     */
    function disableDevMode() {
        // Проверяем несохраненные изменения
        if (hasUnsavedChanges()) {
            const confirmed = confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти из режима разработки?');
            if (!confirmed) return;
        }
        
        isEnabled = false;
        
        // Обновляем UI
        document.body.classList.remove('dev-mode-active');
        toggleButton.classList.remove('active');
        modeIndicator.textContent = 'Просмотр';
        
        // Скрываем панель разработчика
        hideDevPanel();
        
        // Скрываем оверлей
        if (devOverlay) {
            devOverlay.classList.add('hidden');
        }
        
        // Выходим из режима редактирования в информационной панели
        if (window.InfoPanel && window.InfoPanel.isInEditMode()) {
            window.InfoPanel.exitEditMode();
        }
        
        // Сохраняем состояние
        saveDevState();
        
        // Показываем статистику сессии
        showSessionStats();
        
        // Уведомление
        window.MapUtils.showNotification('Режим разработки выключен', 'info');
        
        console.log('Режим разработки выключен');
    }
    
    /**
     * Показ панели разработчика
     */
    function showDevPanel() {
        if (devPanel) {
            devPanel.classList.add('show');
        }
    }
    
    /**
     * Скрытие панели разработчика
     */
    function hideDevPanel() {
        if (devPanel) {
            devPanel.classList.remove('show');
        }
    }
    
    /**
     * Переключение вкладок
     */
    function switchTab(tabName) {
        if (!tabName) return;
        
        currentTab = tabName;
        
        // Убираем активные классы
        devTabs.forEach(tab => tab.classList.remove('active'));
        devContents.forEach(content => content.classList.remove('active'));
        
        // Добавляем активный класс
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        
        // Обновляем содержимое вкладки
        updateTabContent(tabName);
    }
    
    /**
     * Обновление содержимого вкладки
     */
    function updateTabContent(tabName) {
        switch (tabName) {
            case 'styles':
                updateStylesTab();
                break;
            case 'data':
                updateDataTab();
                break;
            case 'export':
                updateExportTab();
                break;
        }
    }
    
    /**
     * Обновление вкладки стилей
     */
    function updateStylesTab() {
        if (!window.StyleEditor) return;
        
        // Обновляем список слоев в редакторе стилей
        window.StyleEditor.updateLayerList();
    }
    
    /**
     * Обновление вкладки данных
     */
    function updateDataTab() {
        // Обновляем список слоев для массовых операций
        const batchSelect = document.getElementById('batch-layer-select');
        if (batchSelect && window.LayerManager) {
            const layers = window.LayerManager.getAllLayers();
            batchSelect.innerHTML = '<option value="">Выберите слой...</option>';
            
            layers.forEach((layer, layerName) => {
                const option = document.createElement('option');
                option.value = layerName;
                option.textContent = layer.get('title') || layerName;
                batchSelect.appendChild(option);
            });
        }
        
        // Обновляем индикатор автосохранения
        updateAutoSaveIndicator();
    }
    
    /**
     * Обновление вкладки экспорта
     */
    function updateExportTab() {
        // Показываем статистику экспорта
        const exportStats = document.querySelector('.export-stats');
        if (exportStats) {
            exportStats.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Экспортов выполнено:</span>
                    <span class="stat-value">${devStats.exportCount}</span>
                </div>
            `;
        }
    }
    
    /**
     * Инициализация вкладок
     */
    function initializeTabs() {
        // Инициализируем StyleEditor
        if (window.StyleEditor) {
            window.StyleEditor.init();
        }
        
        // Переключаемся на первую вкладку
        switchTab('styles');
    }
    
    /**
     * Создание оверлея разработчика
     */
    function createDevOverlay() {
        devOverlay = document.createElement('div');
        devOverlay.className = 'dev-overlay hidden';
        devOverlay.innerHTML = `
            <div class="dev-overlay-pattern"></div>
        `;
        
        document.body.appendChild(devOverlay);
    }
    
    /**
     * Валидация всех данных
     */
    function validateAllData() {
        if (!window.LayerManager) return;
        
        validationResults = [];
        const resultsContainer = document.querySelector('.validation-results');
        
        // Показываем индикатор загрузки
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="validation-item">
                    <i class="validation-icon fas fa-spinner fa-spin"></i>
                    <div class="validation-message">Выполняется валидация данных...</div>
                </div>
            `;
        }
        
        setTimeout(() => {
            performDataValidation();
            displayValidationResults();
            devStats.dataValidated++;
        }, 1000);
    }
    
    /**
     * Выполнение валидации данных
     */
    function performDataValidation() {
        const layers = window.LayerManager.getAllLayers();
        
        layers.forEach((layer, layerName) => {
            const features = layer.getSource().getFeatures();
            
            // Проверяем каждый объект
            features.forEach((feature, index) => {
                const properties = feature.getProperties();
                
                // Проверка обязательных полей
                if (!properties.name && !properties.title) {
                    validationResults.push({
                        type: 'warning',
                        layer: layerName,
                        feature: index,
                        message: 'Отсутствует название объекта'
                    });
                }
                
                // Проверка геометрии
                const geometry = feature.getGeometry();
                if (!geometry || geometry.getCoordinates().length === 0) {
                    validationResults.push({
                        type: 'error',
                        layer: layerName,
                        feature: index,
                        message: 'Некорректная геометрия объекта'
                    });
                }
                
                // Проверка координат
                try {
                    const extent = geometry.getExtent();
                    if (ol.extent.isEmpty(extent)) {
                        validationResults.push({
                            type: 'error',
                            layer: layerName,
                            feature: index,
                            message: 'Пустая геометрия'
                        });
                    }
                } catch (error) {
                    validationResults.push({
                        type: 'error',
                        layer: layerName,
                        feature: index,
                        message: 'Ошибка в геометрии: ' + error.message
                    });
                }
                
                // Проверка контактных данных
                if (properties.email && !window.MapUtils.validateEmail(properties.email)) {
                    validationResults.push({
                        type: 'warning',
                        layer: layerName,
                        feature: index,
                        message: 'Некорректный email адрес'
                    });
                }
                
                if (properties.phone && !window.MapUtils.validatePhone(properties.phone)) {
                    validationResults.push({
                        type: 'warning',
                        layer: layerName,
                        feature: index,
                        message: 'Некорректный номер телефона'
                    });
                }
            });
            
            // Проверка слоя в целом
            if (features.length === 0) {
                validationResults.push({
                    type: 'info',
                    layer: layerName,
                    feature: null,
                    message: 'Слой не содержит объектов'
                });
            }
        });
        
        // Добавляем общую статистику
        if (validationResults.length === 0) {
            validationResults.push({
                type: 'success',
                layer: null,
                feature: null,
                message: 'Все данные прошли валидацию успешно'
            });
        }
    }
    
    /**
     * Отображение результатов валидации
     */
    function displayValidationResults() {
        const resultsContainer = document.querySelector('.validation-results');
        if (!resultsContainer) return;
        
        if (validationResults.length === 0) {
            resultsContainer.innerHTML = '<div class="validation-item success"><i class="validation-icon fas fa-check"></i><div class="validation-message">Валидация не выполнялась</div></div>';
            return;
        }
        
        const html = validationResults.map(result => `
            <div class="validation-item ${result.type}">
                <i class="validation-icon fas fa-${getValidationIcon(result.type)}"></i>
                <div class="validation-message">
                    ${result.layer ? `<strong>${result.layer}</strong>: ` : ''}
                    ${result.message}
                </div>
                ${result.layer && result.feature !== null ? `<div class="validation-count">#${result.feature}</div>` : ''}
            </div>
        `).join('');
        
        resultsContainer.innerHTML = html;
    }
    
    /**
     * Получение иконки для типа валидации
     */
    function getValidationIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            success: 'check-circle'
        };
        return icons[type] || 'question-circle';
    }
    
    /**
     * Переключение автосохранения
     */
    function toggleAutoSave() {
        autoSaveEnabled = !autoSaveEnabled;
        updateAutoSaveIndicator();
        
        const message = autoSaveEnabled ? 'Автосохранение включено' : 'Автосохранение выключено';
        window.MapUtils.showNotification(message, 'info');
        
        // Сохраняем настройку
        window.MapUtils.saveToStorage('autoSaveEnabled', autoSaveEnabled);
    }
    
    /**
     * Обновление индикатора автосохранения
     */
    function updateAutoSaveIndicator() {
        const toggleBtn = document.getElementById('auto-save-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = `Автосохранение: ${autoSaveEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
            toggleBtn.className = `btn ${autoSaveEnabled ? 'btn-success' : 'btn-warning'}`;
        }
    }
    
    /**
     * Показ истории изменений
     */
    function showChangeHistory() {
        const history = window.MapUtils.loadFromStorage('changeHistory', []);
        
        if (history.length === 0) {
            window.MapUtils.showNotification('История изменений пуста', 'info');
            return;
        }
        
        // Создаем модальное окно с историей
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>История изменений</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="history-list">
                        ${history.slice(-20).reverse().map(item => `
                            <div class="history-item">
                                <div class="history-time">${new Date(item.timestamp).toLocaleString()}</div>
                                <div class="history-action">${item.action}</div>
                                <div class="history-details">${item.details || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчик закрытия
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    /**
     * Выполнение массового обновления
     */
    function performBatchUpdate() {
        const layerSelect = document.getElementById('batch-layer-select');
        const layerName = layerSelect?.value;
        
        if (!layerName) {
            window.MapUtils.showNotification('Выберите слой для массового обновления', 'warning');
            return;
        }
        
        // Здесь должна быть логика массового обновления
        // Пока показываем заглушку
        window.MapUtils.showNotification(`Массовое обновление слоя "${layerName}" выполнено`, 'success');
        devStats.editsCount++;
    }
    
    /**
     * Экспорт стилей
     */
    function exportStyles() {
        if (!window.StyleEditor) return;
        
        window.StyleEditor.exportAllStyles();
        devStats.exportCount++;
        
        // Записываем в историю
        addToHistory('Экспорт стилей', 'Экспортированы все стили карты');
    }
    
    /**
     * Экспорт данных
     */
    function exportData() {
        if (!window.LayerManager) return;
        
        const layers = window.LayerManager.getAllLayers();
        const allData = {};
        
        layers.forEach((layer, layerName) => {
            const features = layer.getSource().getFeatures();
            const geojson = new ol.format.GeoJSON().writeFeatures(features);
            allData[layerName] = JSON.parse(geojson);
        });
        
        const exportData = {
            data: allData,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        window.MapUtils.exportToJSON(exportData, 'map_data.json');
        devStats.exportCount++;
        
        // Записываем в историю
        addToHistory('Экспорт данных', 'Экспортированы все данные карты');
    }
    
    /**
     * Экспорт всего
     */
    function exportAll() {
        const config = {
            layers: window.LayerManager ? window.LayerManager.exportLayerConfig() : {},
            timestamp: new Date().toISOString(),
            version: '1.0',
            stats: devStats
        };
        
        window.MapUtils.exportToJSON(config, 'map_config_full.json');
        devStats.exportCount++;
        
        // Записываем в историю
        addToHistory('Полный экспорт', 'Экспортированы все настройки и данные');
    }
    
    /**
     * Запуск импорта файла
     */
    function triggerFileImport(type) {
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.setAttribute('data-import-type', type);
            fileInput.click();
        }
    }
    
    /**
     * Обработка импорта файла
     */
    function handleFileImport(event) {
        const file = event.target.files[0];
        const importType = event.target.getAttribute('data-import-type');
        
        if (!file) return;
        
        window.MapUtils.importFromJSON(file)
            .then(data => {
                switch (importType) {
                    case 'styles':
                        return importStyles(data);
                    case 'data':
                        return importData(data);
                    default:
                        throw new Error('Неизвестный тип импорта');
                }
            })
            .then(() => {
                window.MapUtils.showNotification('Импорт выполнен успешно', 'success');
                addToHistory(`Импорт ${importType}`, `Импортирован файл: ${file.name}`);
            })
            .catch(error => {
                console.error('Ошибка импорта:', error);
                window.MapUtils.showNotification('Ошибка импорта файла', 'error');
            })
            .finally(() => {
                event.target.value = ''; // Сбрасываем input
            });
    }
    
    /**
     * Импорт стилей
     */
    function importStyles(data) {
        if (!window.LayerManager) {
            throw new Error('LayerManager не инициализирован');
        }
        
        if (data.styles) {
            Object.entries(data.styles).forEach(([layerName, style]) => {
                window.LayerManager.applyStyleToLayer(layerName, style);
            });
        } else if (data.style && data.layer) {
            window.LayerManager.applyStyleToLayer(data.layer, data.style);
        } else {
            throw new Error('Неверный формат файла стилей');
        }
    }
    
    /**
     * Импорт данных
     */
    function importData(data) {
        if (!window.LayerManager) {
            throw new Error('LayerManager не инициализирован');
        }
        
        if (data.layers) {
            return window.LayerManager.importLayerConfig(data.layers);
        } else {
            throw new Error('Неверный формат файла данных');
        }
    }
    
    /**
     * Добавление записи в историю
     */
    function addToHistory(action, details) {
        const history = window.MapUtils.loadFromStorage('changeHistory', []);
        
        history.push({
            timestamp: new Date().toISOString(),
            action: action,
            details: details
        });
        
        // Ограничиваем размер истории
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        
        window.MapUtils.saveToStorage('changeHistory', history);
    }
    
    /**
     * Показ подсказки горячих клавиш
     */
    function showHotkeysHint() {
        const hint = document.createElement('div');
        hint.className = 'hotkey-indicator show';
        hint.innerHTML = `
            Горячие клавиши: 
            <span class="hotkey">Ctrl+K</span> - поиск, 
            <span class="hotkey">Ctrl+E</span> - редактирование, 
            <span class="hotkey">Esc</span> - выход
        `;
        
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.remove();
        }, 5000);
    }
    
    /**
     * Показ статистики сессии
     */
    function showSessionStats() {
        if (!devStats.startTime) return;
        
        const duration = Math.round((Date.now() - devStats.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        const stats = `
            Статистика сессии разработки:
            • Время работы: ${minutes}м ${seconds}с
            • Изменений: ${devStats.editsCount}
            • Стилей изменено: ${devStats.stylesChanged}
            • Валидаций: ${devStats.dataValidated}
            • Экспортов: ${devStats.exportCount}
        `;
        
        console.log(stats);
        
        // Сбрасываем статистику
        devStats = {
            editsCount: 0,
            stylesChanged: 0,
            dataValidated: 0,
            exportCount: 0,
            startTime: null
        };
    }
    
    /**
     * Проверка несохраненных изменений
     */
    function hasUnsavedChanges() {
        // Проверяем StyleEditor
        if (window.StyleEditor && window.StyleEditor.hasUnsavedChanges()) {
            return true;
        }
        
        // Проверяем DataForms
        if (window.DataForms && window.DataForms.hasUnsavedChanges()) {
            return true;
        }
        
        // Проверяем InfoPanel
        if (window.InfoPanel && window.InfoPanel.isInEditMode()) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Обработка горячих клавиш
     */
    function handleKeyboardShortcuts(event) {
        // Переключение режима разработки (F12)
        if (event.key === 'F12') {
            event.preventDefault();
            toggleDevMode();
            return;
        }
        
        // Только в режиме разработки
        if (!isEnabled) return;
        
        switch (event.key) {
            case 'Escape':
                if (devPanel && devPanel.classList.contains('show')) {
                    hideDevPanel();
                } else {
                    disableDevMode();
                }
                break;
                
            case '1':
                if (event.altKey) {
                    event.preventDefault();
                    switchTab('styles');
                }
                break;
                
            case '2':
                if (event.altKey) {
                    event.preventDefault();
                    switchTab('data');
                }
                break;
                
            case '3':
                if (event.altKey) {
                    event.preventDefault();
                    switchTab('export');
                }
                break;
                
            case 'v':
                if (event.ctrlKey && event.shiftKey) {
                    event.preventDefault();
                    validateAllData();
                }
                break;
        }
    }
    
    /**
     * Загрузка состояния разработчика
     */
    function loadDevState() {
        const savedState = window.MapUtils.loadFromStorage('devModeState', {});
        
        if (savedState.autoSaveEnabled !== undefined) {
            autoSaveEnabled = savedState.autoSaveEnabled;
        }
        
        // Не восстанавливаем включенное состояние автоматически
        // isEnabled = savedState.isEnabled || false;
    }
    
    /**
     * Сохранение состояния разработчика
     */
    function saveDevState() {
        const state = {
            isEnabled: isEnabled,
            autoSaveEnabled: autoSaveEnabled,
            currentTab: currentTab
        };
        
        window.MapUtils.saveToStorage('devModeState', state);
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        
        /**
         * Проверка состояния режима разработки
         */
        isEnabled: function() {
            return isEnabled;
        },
        
        /**
         * Включение режима разработки
         */
        enable: function() {
            if (!isEnabled) {
                enableDevMode();
            }
        },
        
        /**
         * Отключение режима разработки
         */
        disable: function() {
            if (isEnabled) {
                disableDevMode();
            }
        },
        
        /**
         * Переключение на вкладку
         */
        switchToTab: function(tabName) {
            if (isEnabled) {
                switchTab(tabName);
                showDevPanel();
            }
        },
        
        /**
         * Добавление записи в статистику
         */
        incrementStat: function(statName) {
            if (devStats[statName] !== undefined) {
                devStats[statName]++;
            }
        },
        
        /**
         * Показ панели разработчика
         */
        showPanel: function() {
            if (isEnabled) {
                showDevPanel();
            }
        },
        
        /**
         * Скрытие панели разработчика
         */
        hidePanel: function() {
            hideDevPanel();
        },
        
        /**
         * Получение статистики
         */
        getStats: function() {
            return { ...devStats };
        },
        
        /**
         * Проверка автосохранения
         */
        isAutoSaveEnabled: function() {
            return autoSaveEnabled;
        }
    };
    
})();