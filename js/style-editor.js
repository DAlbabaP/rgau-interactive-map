/**
 * РЕДАКТОР СТИЛЕЙ КАРТЫ
 * Модуль для редактирования стилей слоев в режиме разработки
 */

window.StyleEditor = (function() {
    
    // Приватные переменные
    let isInitialized = false;
    let currentLayer = null;
    let currentStyle = null;
    let previewStyle = null;
    let isPreviewMode = false;
    
    // DOM элементы
    let layerSelect;
    let fillColorInput;
    let fillColorHex;
    let fillOpacitySlider;
    let strokeColorInput;
    let strokeColorHex;
    let strokeWidthSlider;
    let previewBox;
    let applyButton;
    let resetButton;
    let saveButton;
    
    // Предустановленные цветовые схемы
    const colorSchemes = {
        university: {
            name: 'Университетская схема',
            colors: ['#667eea', '#764ba2', '#3742fa', '#2f3542', '#5f27cd']
        },
        nature: {
            name: 'Природная схема',
            colors: ['#27ae60', '#2ecc71', '#16a085', '#1abc9c', '#0fb9b1']
        },
        transport: {
            name: 'Транспортная схема',
            colors: ['#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b']
        },
        modern: {
            name: 'Современная схема',
            colors: ['#3498db', '#9b59b6', '#e91e63', '#ff5722', '#795548']
        },
        pastel: {
            name: 'Пастельная схема',
            colors: ['#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43']
        }
    };
    
    // Стили по умолчанию для разных типов геометрий
    const defaultStyles = {
        polygon: {
            fillColor: '#3498db',
            fillOpacity: 0.7,
            strokeColor: '#2980b9',
            strokeWidth: 2,
            strokeOpacity: 1
        },
        line: {
            strokeColor: '#2c3e50',
            strokeWidth: 3,
            strokeOpacity: 1
        },
        point: {
            fillColor: '#e74c3c',
            fillOpacity: 0.8,
            strokeColor: '#c0392b',
            strokeWidth: 2,
            strokeOpacity: 1,
            radius: 6
        }
    };
    
    /**
     * Инициализация редактора стилей
     */
    function init() {
        try {
            // Получаем DOM элементы
            layerSelect = document.getElementById('style-layer-select');
            fillColorInput = document.getElementById('fill-color');
            fillColorHex = document.getElementById('fill-color-hex');
            fillOpacitySlider = document.getElementById('fill-opacity');
            strokeColorInput = document.getElementById('stroke-color');
            strokeColorHex = document.getElementById('stroke-color-hex');
            strokeWidthSlider = document.getElementById('stroke-width');
            previewBox = document.getElementById('style-preview-box');
            applyButton = document.getElementById('apply-style');
            resetButton = document.getElementById('reset-style');
            saveButton = document.getElementById('save-style');
            
            if (!layerSelect || !fillColorInput || !strokeColorInput) {
                console.error('Не найдены необходимые элементы редактора стилей');
                return false;
            }
            
            // Заполняем список слоев
            populateLayerSelect();
            
            // Настраиваем обработчики событий
            setupEventListeners();
            
            // Создаем цветовые схемы
            createColorSchemes();
            
            isInitialized = true;
            console.log('StyleEditor инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации StyleEditor:', error);
            return false;
        }
    }
    
    /**
     * Заполнение списка слоев
     */
    function populateLayerSelect() {
        if (!window.LayerManager) return;
        
        const layers = window.LayerManager.getAllLayers();
        layerSelect.innerHTML = '<option value="">Выберите слой...</option>';
        
        layers.forEach((layer, layerName) => {
            const layerTitle = layer.get('title') || layerName;
            const option = document.createElement('option');
            option.value = layerName;
            option.textContent = layerTitle;
            layerSelect.appendChild(option);
        });
    }
    
    /**
     * Настройка обработчиков событий
     */
    function setupEventListeners() {
        // Выбор слоя
        layerSelect.addEventListener('change', handleLayerSelect);
        
        // Цветовые контроллы заливки
        fillColorInput.addEventListener('input', handleFillColorChange);
        fillColorHex.addEventListener('input', handleFillColorHexChange);
        fillColorHex.addEventListener('blur', validateHexColor);
        
        // Прозрачность заливки
        fillOpacitySlider.addEventListener('input', handleFillOpacityChange);
        
        // Цветовые контроллы обводки
        strokeColorInput.addEventListener('input', handleStrokeColorChange);
        strokeColorHex.addEventListener('input', handleStrokeColorHexChange);
        strokeColorHex.addEventListener('blur', validateHexColor);
        
        // Толщина обводки
        strokeWidthSlider.addEventListener('input', handleStrokeWidthChange);
        
        // Кнопки действий
        applyButton.addEventListener('click', handleApplyStyle);
        resetButton.addEventListener('click', handleResetStyle);
        saveButton.addEventListener('click', handleSaveStyle);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    /**
     * Создание цветовых схем
     */
    function createColorSchemes() {
        const container = document.querySelector('.style-editor');
        if (!container) return;
        
        const schemesContainer = document.createElement('div');
        schemesContainer.className = 'color-schemes';
        schemesContainer.innerHTML = `
            <div class="form-group">
                <label>Цветовые схемы:</label>
                <div class="schemes-grid">
                    ${Object.entries(colorSchemes).map(([key, scheme]) => 
                        `<div class="color-scheme" data-scheme="${key}" title="${scheme.name}">
                            <div class="scheme-colors">
                                ${scheme.colors.map(color => 
                                    `<div class="scheme-color" style="background-color: ${color}" data-color="${color}"></div>`
                                ).join('')}
                            </div>
                            <div class="scheme-name">${scheme.name}</div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        // Вставляем схемы перед предпросмотром
        const preview = container.querySelector('.style-preview');
        container.insertBefore(schemesContainer, preview);
        
        // Добавляем обработчики
        const schemeColors = schemesContainer.querySelectorAll('.scheme-color');
        schemeColors.forEach(colorEl => {
            colorEl.addEventListener('click', () => {
                const color = colorEl.getAttribute('data-color');
                fillColorInput.value = color;
                fillColorHex.value = color;
                handleFillColorChange();
            });
        });
        
        // Добавляем стили для схем
        if (!document.querySelector('#color-schemes-styles')) {
            const styles = document.createElement('style');
            styles.id = 'color-schemes-styles';
            styles.textContent = `
                .color-schemes { margin-bottom: 20px; }
                .schemes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    margin-top: 10px;
                }
                .color-scheme {
                    background: rgba(255,255,255,0.1);
                    border-radius: 6px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .color-scheme:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .scheme-colors {
                    display: flex;
                    gap: 2px;
                    margin-bottom: 5px;
                }
                .scheme-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 3px;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .scheme-color:hover {
                    transform: scale(1.1);
                }
                .scheme-name {
                    font-size: 0.7rem;
                    color: #bdc3c7;
                    text-align: center;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    /**
     * Обработка выбора слоя
     */
    function handleLayerSelect() {
        const layerName = layerSelect.value;
        
        if (!layerName) {
            currentLayer = null;
            resetStyleEditor();
            return;
        }
        
        if (!window.LayerManager) return;
        
        currentLayer = layerName;
        
        // Получаем текущий стиль слоя
        const layerStyle = window.LayerManager.getCurrentStyle(layerName);
        
        if (layerStyle) {
            loadStyleToEditor(layerStyle);
        } else {
            // Загружаем стиль по умолчанию
            const geometryType = detectGeometryType(layerName);
            loadStyleToEditor(defaultStyles[geometryType] || defaultStyles.polygon);
        }
        
        updatePreview();
    }
    
    /**
     * Определение типа геометрии слоя
     */
    function detectGeometryType(layerName) {
        if (!window.LayerManager) return 'polygon';
        
        const layers = window.LayerManager.getAllLayers();
        const layer = layers.get(layerName);
        
        if (!layer) return 'polygon';
        
        const features = layer.getSource().getFeatures();
        if (features.length === 0) return 'polygon';
        
        const geometry = features[0].getGeometry();
        const type = geometry.getType();
        
        if (type.includes('Polygon')) return 'polygon';
        if (type.includes('LineString')) return 'line';
        if (type.includes('Point')) return 'point';
        
        return 'polygon';
    }
    
    /**
     * Загрузка стиля в редактор
     */
    function loadStyleToEditor(style) {
        if (style.fillColor) {
            fillColorInput.value = style.fillColor;
            fillColorHex.value = style.fillColor;
        }
        
        if (style.fillOpacity !== undefined) {
            fillOpacitySlider.value = Math.round(style.fillOpacity * 100);
            updateSliderValue(fillOpacitySlider, fillOpacitySlider.value + '%');
        }
        
        if (style.strokeColor) {
            strokeColorInput.value = style.strokeColor;
            strokeColorHex.value = style.strokeColor;
        }
        
        if (style.strokeWidth !== undefined) {
            strokeWidthSlider.value = style.strokeWidth;
            updateSliderValue(strokeWidthSlider, style.strokeWidth + 'px');
        }
        
        currentStyle = { ...style };
        updatePreview();
    }
    
    /**
     * Обработка изменения цвета заливки
     */
    function handleFillColorChange() {
        const color = fillColorInput.value;
        fillColorHex.value = color;
        
        if (!currentStyle) currentStyle = {};
        currentStyle.fillColor = color;
        
        updatePreview();
        enablePreviewMode();
    }
    
    /**
     * Обработка изменения HEX цвета заливки
     */
    function handleFillColorHexChange() {
        const color = fillColorHex.value;
        
        if (isValidHexColor(color)) {
            fillColorInput.value = color;
            
            if (!currentStyle) currentStyle = {};
            currentStyle.fillColor = color;
            
            updatePreview();
            enablePreviewMode();
        }
    }
    
    /**
     * Обработка изменения прозрачности заливки
     */
    function handleFillOpacityChange() {
        const opacity = parseFloat(fillOpacitySlider.value) / 100;
        updateSliderValue(fillOpacitySlider, fillOpacitySlider.value + '%');
        
        if (!currentStyle) currentStyle = {};
        currentStyle.fillOpacity = opacity;
        
        updatePreview();
        enablePreviewMode();
    }
    
    /**
     * Обработка изменения цвета обводки
     */
    function handleStrokeColorChange() {
        const color = strokeColorInput.value;
        strokeColorHex.value = color;
        
        if (!currentStyle) currentStyle = {};
        currentStyle.strokeColor = color;
        
        updatePreview();
        enablePreviewMode();
    }
    
    /**
     * Обработка изменения HEX цвета обводки
     */
    function handleStrokeColorHexChange() {
        const color = strokeColorHex.value;
        
        if (isValidHexColor(color)) {
            strokeColorInput.value = color;
            
            if (!currentStyle) currentStyle = {};
            currentStyle.strokeColor = color;
            
            updatePreview();
            enablePreviewMode();
        }
    }
    
    /**
     * Обработка изменения толщины обводки
     */
    function handleStrokeWidthChange() {
        const width = parseInt(strokeWidthSlider.value);
        updateSliderValue(strokeWidthSlider, width + 'px');
        
        if (!currentStyle) currentStyle = {};
        currentStyle.strokeWidth = width;
        
        updatePreview();
        enablePreviewMode();
    }
    
    /**
     * Валидация HEX цвета
     */
    function validateHexColor(event) {
        const input = event.target;
        const color = input.value;
        
        if (!isValidHexColor(color) && color !== '') {
            input.classList.add('error');
            showColorError(input, 'Введите корректный HEX цвет (например, #FF0000)');
        } else {
            input.classList.remove('error');
            hideColorError(input);
        }
    }
    
    /**
     * Проверка валидности HEX цвета
     */
    function isValidHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
    
    /**
     * Показ ошибки цвета
     */
    function showColorError(input, message) {
        let errorElement = input.parentNode.querySelector('.color-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'color-error';
            errorElement.style.cssText = `
                color: #e74c3c;
                font-size: 0.8rem;
                margin-top: 5px;
                animation: slideInUp 0.3s ease;
            `;
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    /**
     * Скрытие ошибки цвета
     */
    function hideColorError(input) {
        const errorElement = input.parentNode.querySelector('.color-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * Обновление значения слайдера
     */
    function updateSliderValue(slider, value) {
        const valueElement = slider.parentNode.querySelector('.slider-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
    
    /**
     * Обновление предпросмотра
     */
    function updatePreview() {
        if (!previewBox || !currentStyle) return;
        
        const fillColor = currentStyle.fillColor || '#3498db';
        const fillOpacity = currentStyle.fillOpacity !== undefined ? currentStyle.fillOpacity : 0.7;
        const strokeColor = currentStyle.strokeColor || '#2980b9';
        const strokeWidth = currentStyle.strokeWidth || 2;
        
        const fillRgba = window.MapUtils.hexToRgba(fillColor, fillOpacity);
        
        previewBox.style.backgroundColor = fillRgba;
        previewBox.style.borderColor = strokeColor;
        previewBox.style.borderWidth = strokeWidth + 'px';
        previewBox.style.borderStyle = 'solid';
        
        // Добавляем анимацию изменения
        previewBox.style.transform = 'scale(1.05)';
        setTimeout(() => {
            previewBox.style.transform = '';
        }, 200);
    }
    
    /**
     * Включение режима предпросмотра
     */
    function enablePreviewMode() {
        if (isPreviewMode || !currentLayer || !window.LayerManager) return;
        
        isPreviewMode = true;
        
        // Применяем стиль для предпросмотра
        previewStyle = { ...currentStyle };
        window.LayerManager.applyStyleToLayer(currentLayer, previewStyle);
        
        // Обновляем состояние кнопок
        applyButton.textContent = 'Применить изменения';
        applyButton.classList.add('btn-warning');
        resetButton.disabled = false;
    }
    
    /**
     * Отключение режима предпросмотра
     */
    function disablePreviewMode() {
        if (!isPreviewMode) return;
        
        isPreviewMode = false;
        previewStyle = null;
        
        // Обновляем состояние кнопок
        applyButton.textContent = 'Применить';
        applyButton.classList.remove('btn-warning');
        resetButton.disabled = true;
    }
    
    /**
     * Обработка применения стиля
     */
    function handleApplyStyle() {
        if (!currentLayer || !currentStyle || !window.LayerManager) return;
        
        try {
            const success = window.LayerManager.applyStyleToLayer(currentLayer, currentStyle);
            
            if (success) {
                disablePreviewMode();
                window.MapUtils.showNotification('Стиль применен успешно', 'success');
                
                // Анимация кнопки
                applyButton.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    applyButton.style.transform = '';
                }, 150);
                
            } else {
                window.MapUtils.showNotification('Ошибка применения стиля', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка применения стиля:', error);
            window.MapUtils.showNotification('Ошибка применения стиля', 'error');
        }
    }
    
    /**
     * Обработка сброса стиля
     */
    function handleResetStyle() {
        if (!currentLayer || !window.LayerManager) return;
        
        try {
            const success = window.LayerManager.resetLayerStyle(currentLayer);
            
            if (success) {
                // Загружаем оригинальный стиль в редактор
                const originalStyle = window.LayerManager.getCurrentStyle(currentLayer);
                if (originalStyle) {
                    loadStyleToEditor(originalStyle);
                }
                
                disablePreviewMode();
                window.MapUtils.showNotification('Стиль сброшен к значениям по умолчанию', 'info');
                
            } else {
                window.MapUtils.showNotification('Ошибка сброса стиля', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка сброса стиля:', error);
            window.MapUtils.showNotification('Ошибка сброса стиля', 'error');
        }
    }
    
    /**
     * Обработка сохранения стиля
     */
    function handleSaveStyle() {
        if (!currentStyle) {
            window.MapUtils.showNotification('Нет стиля для сохранения', 'warning');
            return;
        }
        
        try {
            // Сначала применяем стиль
            if (isPreviewMode) {
                handleApplyStyle();
            }
            
            // Экспортируем стиль
            const styleData = {
                layer: currentLayer,
                style: currentStyle,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const filename = `style_${currentLayer}_${Date.now()}.json`;
            window.MapUtils.exportToJSON(styleData, filename);
            
            window.MapUtils.showNotification('Стиль сохранен в файл', 'success');
            
        } catch (error) {
            console.error('Ошибка сохранения стиля:', error);
            window.MapUtils.showNotification('Ошибка сохранения стиля', 'error');
        }
    }
    
    /**
     * Обработка горячих клавиш
     */
    function handleKeyboardShortcuts(event) {
        if (!isInitialized) return;
        
        // Только в режиме разработки и если фокус не на поле ввода
        if (!window.DevMode || !window.DevMode.isEnabled()) return;
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch (event.key) {
            case 'Enter':
                if (event.ctrlKey && currentLayer) {
                    event.preventDefault();
                    handleApplyStyle();
                }
                break;
                
            case 'Escape':
                if (isPreviewMode) {
                    event.preventDefault();
                    handleResetStyle();
                }
                break;
                
            case 's':
                if (event.ctrlKey && currentStyle) {
                    event.preventDefault();
                    handleSaveStyle();
                }
                break;
        }
    }
    
    /**
     * Сброс редактора стилей
     */
    function resetStyleEditor() {
        currentStyle = null;
        previewStyle = null;
        
        // Сбрасываем элементы управления
        if (fillColorInput) fillColorInput.value = '#3498db';
        if (fillColorHex) fillColorHex.value = '#3498db';
        if (fillOpacitySlider) {
            fillOpacitySlider.value = 70;
            updateSliderValue(fillOpacitySlider, '70%');
        }
        if (strokeColorInput) strokeColorInput.value = '#2980b9';
        if (strokeColorHex) strokeColorHex.value = '#2980b9';
        if (strokeWidthSlider) {
            strokeWidthSlider.value = 2;
            updateSliderValue(strokeWidthSlider, '2px');
        }
        
        // Сбрасываем предпросмотр
        if (previewBox) {
            previewBox.style.backgroundColor = 'rgba(52, 152, 219, 0.7)';
            previewBox.style.borderColor = '#2980b9';
            previewBox.style.borderWidth = '2px';
        }
        
        disablePreviewMode();
    }
    
    /**
     * Создание предустановленного стиля
     */
    function createPresetStyle(type) {
        const presets = {
            university: {
                fillColor: '#667eea',
                fillOpacity: 0.8,
                strokeColor: '#4834d4',
                strokeWidth: 2
            },
            nature: {
                fillColor: '#27ae60',
                fillOpacity: 0.6,
                strokeColor: '#229954',
                strokeWidth: 1
            },
            transport: {
                fillColor: '#f39c12',
                fillOpacity: 0.8,
                strokeColor: '#d35400',
                strokeWidth: 3
            },
            highlight: {
                fillColor: '#ff4757',
                fillOpacity: 0.9,
                strokeColor: '#ff3838',
                strokeWidth: 4
            }
        };
        
        return presets[type] || presets.university;
    }
    
    /**
     * Импорт стиля из файла
     */
    function importStyleFromFile(file) {
        return new Promise((resolve, reject) => {
            window.MapUtils.importFromJSON(file)
                .then(data => {
                    if (data.style && data.layer) {
                        // Выбираем слой в селекторе
                        if (layerSelect) {
                            layerSelect.value = data.layer;
                            handleLayerSelect();
                        }
                        
                        // Загружаем стиль
                        loadStyleToEditor(data.style);
                        
                        window.MapUtils.showNotification('Стиль импортирован успешно', 'success');
                        resolve(data);
                    } else {
                        reject(new Error('Неверный формат файла стиля'));
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        
        /**
         * Редактирование стиля слоя
         */
        editLayerStyle: function(layerName) {
            if (!isInitialized) return false;
            
            // Выбираем слой в селекторе
            if (layerSelect) {
                layerSelect.value = layerName;
                handleLayerSelect();
            }
            
            // Переключаемся на вкладку стилей в панели разработчика
            if (window.DevMode) {
                window.DevMode.switchToTab('styles');
            }
            
            return true;
        },
        
        /**
         * Применение предустановленного стиля
         */
        applyPresetStyle: function(layerName, presetType) {
            if (!window.LayerManager) return false;
            
            const style = createPresetStyle(presetType);
            return window.LayerManager.applyStyleToLayer(layerName, style);
        },
        
        /**
         * Получение текущего стиля
         */
        getCurrentStyle: function() {
            return currentStyle ? { ...currentStyle } : null;
        },
        
        /**
         * Установка стиля
         */
        setStyle: function(style) {
            if (style) {
                loadStyleToEditor(style);
                return true;
            }
            return false;
        },
        
        /**
         * Импорт стиля
         */
        importStyle: function(file) {
            return importStyleFromFile(file);
        },
        
        /**
         * Экспорт всех стилей
         */
        exportAllStyles: function() {
            if (!window.LayerManager) return;
            
            const layers = window.LayerManager.getAllLayers();
            const allStyles = {};
            
            layers.forEach((layer, layerName) => {
                const style = window.LayerManager.getCurrentStyle(layerName);
                if (style) {
                    allStyles[layerName] = style;
                }
            });
            
            const exportData = {
                styles: allStyles,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            window.MapUtils.exportToJSON(exportData, 'map_styles.json');
        },
        
        /**
         * Обновление списка слоев
         */
        updateLayerList: function() {
            populateLayerSelect();
        },
        
        /**
         * Копирование стиля между слоями
         */
        copyStyle: function(fromLayer, toLayer) {
            if (!window.LayerManager) return false;
            
            const style = window.LayerManager.getCurrentStyle(fromLayer);
            if (style) {
                return window.LayerManager.applyStyleToLayer(toLayer, style);
            }
            
            return false;
        },
        
        /**
         * Проверка наличия изменений
         */
        hasUnsavedChanges: function() {
            return isPreviewMode;
        }
    };
    
})();