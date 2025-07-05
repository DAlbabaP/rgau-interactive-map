/**
 * УПРАВЛЕНИЕ СЛОЯМИ КАРТЫ
 * Модуль для загрузки, управления и стилизации слоев GeoJSON
 */

window.LayerManager = (function() {
    
    // Приватные переменные
    let map = null;
    let layers = new Map();
    let layerStates = new Map();
    let defaultStyles = new Map();
    let loadingPromises = new Map();
    
    // Конфигурация слоев
    const layerConfig = {
        // Интерактивные слои (кликабельные)
        interactive: {
            // Университетские здания
            main_building: {
                url: 'data/buildings/university/main_building.geojson',
                name: 'Главное здание',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#667eea',
                    fillOpacity: 0.8,
                    strokeColor: '#4834d4',
                    strokeWidth: 2
                }
            },
            university_buildings: {
                url: 'data/buildings/university/university_buildings.geojson',
                name: 'Учебные здания',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#3742fa',
                    fillOpacity: 0.7,
                    strokeColor: '#2f3542',
                    strokeWidth: 2
                }
            },
            dormitory_buildings: {
                url: 'data/buildings/university/dormitory_buildings.geojson',
                name: 'Общежития',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#2ed573',
                    fillOpacity: 0.7,
                    strokeColor: '#1e824c',
                    strokeWidth: 2
                }
            },
            lab_buildings: {
                url: 'data/buildings/university/lab_buildings.geojson',
                name: 'Лабораторные здания',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#ff4757',
                    fillOpacity: 0.7,
                    strokeColor: '#c44569',
                    strokeWidth: 2
                }
            },
            library_buildings: {
                url: 'data/buildings/university/library_buildings.geojson',
                name: 'Библиотечные здания',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#ffa502',
                    fillOpacity: 0.7,
                    strokeColor: '#ff6348',
                    strokeWidth: 2
                }
            },
            sport_buildings: {
                url: 'data/buildings/university/sport_buildings.geojson',
                name: 'Спортивные здания',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#ff6b6b',
                    fillOpacity: 0.7,
                    strokeColor: '#ee5a52',
                    strokeWidth: 2
                }
            },
            buildings_in_university: {
                url: 'data/buildings/university/buildings_in_university.geojson',
                name: 'Дополнительные здания',
                category: 'university',
                interactive: true,
                style: {
                    fillColor: '#a55eea',
                    fillOpacity: 0.7,
                    strokeColor: '#8854d0',
                    strokeWidth: 2
                }
            },
            
            // Общественные здания
            museum_buildings: {
                url: 'data/buildings/public/museum_buildings.geojson',
                name: 'Музейные здания',
                category: 'public',
                interactive: true,
                style: {
                    fillColor: '#fd79a8',
                    fillOpacity: 0.7,
                    strokeColor: '#e84393',
                    strokeWidth: 2
                }
            },
            cafe_buildings: {
                url: 'data/buildings/public/cafe_buildings.geojson',
                name: 'Кафе и рестораны',
                category: 'public',
                interactive: true,
                style: {
                    fillColor: '#fdcb6e',
                    fillOpacity: 0.7,
                    strokeColor: '#e17055',
                    strokeWidth: 2
                }
            },
            gov_buildings: {
                url: 'data/buildings/public/gov_buildings.geojson',
                name: 'Правительственные здания',
                category: 'public',
                interactive: true,
                style: {
                    fillColor: '#6c5ce7',
                    fillOpacity: 0.7,
                    strokeColor: '#5f3dc4',
                    strokeWidth: 2
                }
            },
            
            // Транспортные объекты
            metro_stations: {
                url: 'data/transport/metro_stations.geojson',
                name: 'Станции метро',
                category: 'transport',
                interactive: true,
                style: {
                    fillColor: '#00b894',
                    fillOpacity: 0.8,
                    strokeColor: '#00a085',
                    strokeWidth: 3
                }
            },
            metro_entrance: {
                url: 'data/transport/metro_entrance.geojson',
                name: 'Входы в метро',
                category: 'transport',
                interactive: true,
                style: {
                    fillColor: '#00cec9',
                    fillOpacity: 0.8,
                    strokeColor: '#00b894',
                    strokeWidth: 2
                }
            },
            metro_platforms: {
                url: 'data/transport/metro_platforms.geojson',
                name: 'Платформы метро',
                category: 'transport',
                interactive: true,
                style: {
                    fillColor: '#55a3ff',
                    fillOpacity: 0.7,
                    strokeColor: '#3867d6',
                    strokeWidth: 2
                }
            },
            tram_stops: {
                url: 'data/transport/tram_stops.geojson',
                name: 'Трамвайные остановки',
                category: 'transport',
                interactive: true,
                style: {
                    fillColor: '#f39c12',
                    fillOpacity: 0.8,
                    strokeColor: '#d35400',
                    strokeWidth: 2
                }
            },
            bus_stops: {
                url: 'data/transport/bus_stops.geojson',
                name: 'Автобусные остановки',
                category: 'transport',
                interactive: true,
                style: {
                    fillColor: '#e74c3c',
                    fillOpacity: 0.8,
                    strokeColor: '#c0392b',
                    strokeWidth: 2
                }
            }
        },
        
        // Базовые слои (только отображение)
        base: {
            roads: {
                url: 'data/infrastructure/roads.geojson',
                name: 'Дорожная сеть',
                category: 'infrastructure',
                interactive: false,
                style: {
                    strokeColor: '#34495e',
                    strokeWidth: 1,
                    strokeOpacity: 0.6
                }
            },
            railways: {
                url: 'data/infrastructure/railways.geojson',
                name: 'Железные дороги',
                category: 'infrastructure',
                interactive: false,
                style: {
                    strokeColor: '#2c3e50',
                    strokeWidth: 2,
                    strokeOpacity: 0.8
                }
            },
            // nature_layers: {
            //     url: 'data/infrastructure/nature_layers.geojson',
            //     name: 'Природные объекты',
            //     category: 'infrastructure',
            //     interactive: false,
            //     style: {
            //         fillColor: '#27ae60',
            //         fillOpacity: 0.3,
            //         strokeColor: '#229954',
            //         strokeWidth: 1
            //     }
            // },
            other_buildings: {
                url: 'data/buildings/other_buildings.geojson',
                name: 'Прочие здания',
                category: 'infrastructure',
                interactive: false,
                style: {
                    fillColor: '#95a5a6',
                    fillOpacity: 0.4,
                    strokeColor: '#7f8c8d',
                    strokeWidth: 1
                }
            },
            buildings_for_map: {
                url: 'data/buildings/buildings_for_map.geojson',
                name: 'Здания для карты',
                category: 'infrastructure',
                interactive: false,
                style: {
                    fillColor: '#bdc3c7',
                    fillOpacity: 0.3,
                    strokeColor: '#95a5a6',
                    strokeWidth: 1
                }
            }
        }
    };
    
    /**
     * Инициализация менеджера слоев
     */
    function init(mapInstance) {
        try {
            map = mapInstance;
            
            // Загружаем сохраненные состояния слоев
            loadLayerStates();
            
            // Загружаем пользовательские стили
            loadCustomStyles();
            
            console.log('LayerManager инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации LayerManager:', error);
            return false;
        }
    }
    
    /**
     * Загрузка всех слоев
     */
    async function loadAllLayers() {
        try {
            // Показываем индикатор загрузки
            showLoadingIndicator(true);
            
            // Сначала загружаем базовые слои
            await loadLayerGroup('base');
            
            // Затем интерактивные слои
            await loadLayerGroup('interactive');
            
            // Обновляем счетчики объектов
            updateObjectCounts();
            
            // Скрываем индикатор загрузки
            showLoadingIndicator(false);
            
            console.log('Все слои загружены успешно');
            
        } catch (error) {
            console.error('Ошибка загрузки слоев:', error);
            showLoadingIndicator(false);
            window.MapUtils.showNotification('Ошибка загрузки слоев карты', 'error');
        }
    }
    
    /**
     * Загрузка группы слоев
     */
    async function loadLayerGroup(groupName) {
        const group = layerConfig[groupName];
        const promises = [];
        
        for (const [layerName, config] of Object.entries(group)) {
            promises.push(loadLayer(layerName, config));
        }
        
        await Promise.all(promises);
    }
    
    /**
     * Загрузка отдельного слоя
     */
    async function loadLayer(layerName, config) {
        // Избегаем повторной загрузки
        if (loadingPromises.has(layerName)) {
            return loadingPromises.get(layerName);
        }
        
        const promise = performLayerLoad(layerName, config);
        loadingPromises.set(layerName, promise);
        
        try {
            await promise;
        } finally {
            loadingPromises.delete(layerName);
        }
        
        return promise;
    }
    
    /**
     * Выполнение загрузки слоя
     */
    async function performLayerLoad(layerName, config) {
        try {
            // Загружаем GeoJSON данные
            const geojsonData = await window.MapUtils.loadGeoJSON(config.url);
            
            // Валидируем данные
            if (!window.MapUtils.validateGeoJSON(geojsonData)) {
                console.warn(`Невалидные данные GeoJSON для слоя ${layerName}`);
                return;
            }
            
            // Создаем источник данных
            const source = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(geojsonData, {
                    featureProjection: map.getView().getProjection()
                })
            });
            
            // Создаем стиль слоя
            const style = createLayerStyle(layerName, config.style);
            
            // Создаем векторный слой
            const vectorLayer = new ol.layer.Vector({
                source: source,
                style: style,
                name: layerName,
                title: config.name,
                category: config.category,
                interactive: config.interactive
            });
            
            // Добавляем слой на карту
            map.addLayer(vectorLayer);
            
            // Сохраняем ссылку на слой
            layers.set(layerName, vectorLayer);
            
            // Устанавливаем видимость слоя
            const isVisible = getLayerState(layerName);
            vectorLayer.setVisible(isVisible);
            
            // Добавляем обработчики событий для интерактивных слоев
            if (config.interactive) {
                addLayerInteractivity(vectorLayer);
            }
            
            // Добавляем данные в поиск
            if (window.SearchModule && config.interactive) {
                window.SearchModule.addSearchData(layerName, source.getFeatures());
            }
            
            console.log(`Слой ${layerName} загружен успешно (${source.getFeatures().length} объектов)`);
            
        } catch (error) {
            console.error(`Ошибка загрузки слоя ${layerName}:`, error);
            
            // Создаем пустой слой в случае ошибки
            const emptyLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                name: layerName,
                title: config.name,
                category: config.category
            });
            
            map.addLayer(emptyLayer);
            layers.set(layerName, emptyLayer);
        }
    }
    
    /**
     * Создание стиля слоя
     */
    function createLayerStyle(layerName, styleConfig) {
        // Проверяем, есть ли пользовательский стиль
        const customStyle = getCustomStyle(layerName);
        const finalStyle = customStyle || styleConfig;
        
        // Сохраняем стиль по умолчанию
        if (!defaultStyles.has(layerName)) {
            defaultStyles.set(layerName, styleConfig);
        }
        
        return window.MapUtils.createStyle(finalStyle);
    }
    
    /**
     * Добавление интерактивности к слою
     */
    function addLayerInteractivity(layer) {
        // Обработчик кликов добавляется на уровне карты
        // в MapController для избежания дублирования
    }
    
    /**
     * Переключение видимости слоя
     */
    function toggleLayerVisibility(layerName) {
        const layer = layers.get(layerName);
        if (!layer) {
            console.warn(`Слой ${layerName} не найден`);
            return false;
        }
        
        const newVisibility = !layer.getVisible();
        layer.setVisible(newVisibility);
        
        // Сохраняем состояние
        setLayerState(layerName, newVisibility);
        
        // Обновляем UI
        updateLayerToggle(layerName, newVisibility);
        
        // Уведомление
        const action = newVisibility ? 'включен' : 'выключен';
        const layerTitle = layer.get('title') || layerName;
        
        return newVisibility;
    }
    
    /**
     * Установка видимости слоя
     */
    function setLayerVisibility(layerName, visible) {
        const layer = layers.get(layerName);
        if (!layer) return false;
        
        layer.setVisible(visible);
        setLayerState(layerName, visible);
        updateLayerToggle(layerName, visible);
        
        return true;
    }
    
    /**
     * Переключение всех слоев
     */
    function toggleAllLayers() {
        const allVisible = Array.from(layers.values()).every(layer => layer.getVisible());
        const newVisibility = !allVisible;
        
        layers.forEach((layer, layerName) => {
            layer.setVisible(newVisibility);
            setLayerState(layerName, newVisibility);
            updateLayerToggle(layerName, newVisibility);
        });
        
        // Обновляем кнопку
        const toggleBtn = document.getElementById('toggle-all-layers');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = newVisibility ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
            toggleBtn.title = newVisibility ? 'Выключить все слои' : 'Включить все слои';
        }
        
        const action = newVisibility ? 'включены' : 'выключены';
        window.MapUtils.showNotification(`Все слои ${action}`, 'info');
    }
    
    /**
     * Применение стиля к слою
     */
    function applyStyleToLayer(layerName, styleConfig) {
        const layer = layers.get(layerName);
        if (!layer) {
            console.warn(`Слой ${layerName} не найден`);
            return false;
        }
        
        try {
            const style = window.MapUtils.createStyle(styleConfig);
            layer.setStyle(style);
            
            // Сохраняем пользовательский стиль
            saveCustomStyle(layerName, styleConfig);
            
            return true;
            
        } catch (error) {
            console.error(`Ошибка применения стиля к слою ${layerName}:`, error);
            return false;
        }
    }
    
    /**
     * Сброс стиля слоя к умолчанию
     */
    function resetLayerStyle(layerName) {
        const defaultStyle = defaultStyles.get(layerName);
        if (!defaultStyle) {
            console.warn(`Стиль по умолчанию для слоя ${layerName} не найден`);
            return false;
        }
        
        const success = applyStyleToLayer(layerName, defaultStyle);
        if (success) {
            // Удаляем пользовательский стиль
            removeCustomStyle(layerName);
        }
        
        return success;
    }
    
    /**
     * Получение информации о слое
     */
    function getLayerInfo(layerName) {
        const layer = layers.get(layerName);
        if (!layer) return null;
        
        const source = layer.getSource();
        const features = source.getFeatures();
        
        return {
            name: layerName,
            title: layer.get('title'),
            category: layer.get('category'),
            interactive: layer.get('interactive'),
            visible: layer.getVisible(),
            featureCount: features.length,
            extent: source.getExtent(),
            style: getCurrentStyle(layerName)
        };
    }
    
    /**
     * Получение всех слоев по категории
     */
    function getLayersByCategory(category) {
        const result = [];
        
        layers.forEach((layer, layerName) => {
            if (layer.get('category') === category) {
                result.push({
                    name: layerName,
                    layer: layer,
                    info: getLayerInfo(layerName)
                });
            }
        });
        
        return result;
    }
    
    /**
     * Поиск объекта по ID
     */
    function findFeatureById(featureId, layerName = null) {
        const searchLayers = layerName ? [layers.get(layerName)] : Array.from(layers.values());
        
        for (const layer of searchLayers) {
            if (!layer) continue;
            
            const source = layer.getSource();
            const features = source.getFeatures();
            
            for (const feature of features) {
                if (feature.getId() === featureId || feature.get('id') === featureId) {
                    return {
                        feature: feature,
                        layer: layer,
                        layerName: layer.get('name')
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Подсветка объекта
     */
    function highlightFeature(feature, layer) {
        // Создаем стиль подсветки
        const highlightStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 0, 0.6)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffff00',
                width: 3
            }),
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 0, 0.6)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffff00',
                    width: 3
                })
            })
        });
        
        // Применяем стиль подсветки
        feature.setStyle(highlightStyle);
        
        // Убираем подсветку через 3 секунды
        setTimeout(() => {
            feature.setStyle(null);
        }, 3000);
    }
    
    /**
     * Масштабирование к слою
     */
    function zoomToLayer(layerName) {
        const layer = layers.get(layerName);
        if (!layer) return false;
        
        const source = layer.getSource();
        const extent = source.getExtent();
        
        if (ol.extent.isEmpty(extent)) {
            return false;
        }
        
        map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });
        
        return true;
    }
    
    /**
     * Обновление счетчиков объектов
     */
    function updateObjectCounts() {
        // Обновляем счетчики для каждого слоя
        layers.forEach((layer, layerName) => {
            const count = layer.getSource().getFeatures().length;
            updateLayerCount(layerName, count);
        });
        
        // Обновляем общие счетчики по категориям
        updateCategoryCounts();
    }
    
    /**
     * Обновление счетчика слоя в UI
     */
    function updateLayerCount(layerName, count) {
        const layerElement = document.querySelector(`[data-layer="${layerName}"] .layer-count`);
        if (layerElement) {
            layerElement.textContent = count;
        }
    }
    
    /**
     * Обновление счетчиков категорий
     */
    function updateCategoryCounts() {
        const categories = ['university', 'public', 'transport'];
        
        categories.forEach(category => {
            const categoryLayers = getLayersByCategory(category);
            const totalCount = categoryLayers.reduce((sum, item) => {
                return sum + item.info.featureCount;
            }, 0);
            
            const categoryElement = document.querySelector(`[data-category="${category}"] .object-count`);
            if (categoryElement) {
                categoryElement.textContent = totalCount;
            }
        });
    }
    
    /**
     * Обновление переключателя слоя в UI
     */
    function updateLayerToggle(layerName, visible) {
        const toggle = document.querySelector(`[data-layer="${layerName}"] input[type="checkbox"]`);
        if (toggle) {
            toggle.checked = visible;
        }
        
        const layerItem = document.querySelector(`[data-layer="${layerName}"]`);
        if (layerItem) {
            layerItem.classList.toggle('disabled', !visible);
        }
    }
    
    /**
     * Показ/скрытие индикатора загрузки
     */
    function showLoadingIndicator(show) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
    }
    
    /**
     * Управление состояниями слоев
     */
    function getLayerState(layerName) {
        return layerStates.get(layerName) !== false; // по умолчанию true
    }
    
    function setLayerState(layerName, visible) {
        layerStates.set(layerName, visible);
        saveLayerStates();
    }
    
    function loadLayerStates() {
        const savedStates = window.MapUtils.loadFromStorage('layerStates', {});
        for (const [layerName, visible] of Object.entries(savedStates)) {
            layerStates.set(layerName, visible);
        }
    }
    
    function saveLayerStates() {
        const statesObject = {};
        layerStates.forEach((visible, layerName) => {
            statesObject[layerName] = visible;
        });
        window.MapUtils.saveToStorage('layerStates', statesObject);
    }
    
    /**
     * Управление пользовательскими стилями
     */
    function getCustomStyle(layerName) {
        const customStyles = window.MapUtils.loadFromStorage('customStyles', {});
        return customStyles[layerName] || null;
    }
    
    function saveCustomStyle(layerName, styleConfig) {
        const customStyles = window.MapUtils.loadFromStorage('customStyles', {});
        customStyles[layerName] = styleConfig;
        window.MapUtils.saveToStorage('customStyles', customStyles);
    }
    
    function removeCustomStyle(layerName) {
        const customStyles = window.MapUtils.loadFromStorage('customStyles', {});
        delete customStyles[layerName];
        window.MapUtils.saveToStorage('customStyles', customStyles);
    }
    
    function loadCustomStyles() {
        // Стили загружаются по мере необходимости в createLayerStyle
    }
    
    function getCurrentStyle(layerName) {
        return getCustomStyle(layerName) || defaultStyles.get(layerName);
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        loadAllLayers: loadAllLayers,
        loadLayer: loadLayer,
        
        // Управление видимостью
        toggleLayerVisibility: toggleLayerVisibility,
        setLayerVisibility: setLayerVisibility,
        toggleAllLayers: toggleAllLayers,
        
        // Управление стилями
        applyStyleToLayer: applyStyleToLayer,
        resetLayerStyle: resetLayerStyle,
        getCurrentStyle: getCurrentStyle,
        
        // Получение информации
        getLayerInfo: getLayerInfo,
        getLayersByCategory: getLayersByCategory,
        getAllLayers: () => layers,
        getLayerConfig: () => layerConfig,
        
        // Поиск и навигация
        findFeatureById: findFeatureById,
        highlightFeature: highlightFeature,
        zoomToLayer: zoomToLayer,
        
        // Утилиты
        updateObjectCounts: updateObjectCounts,
        
        /**
         * Экспорт конфигурации слоев
         */
        exportLayerConfig: function() {
            const config = {
                layerStates: {},
                customStyles: window.MapUtils.loadFromStorage('customStyles', {})
            };
            
            layerStates.forEach((visible, layerName) => {
                config.layerStates[layerName] = visible;
            });
            
            return config;
        },
        
        /**
         * Импорт конфигурации слоев
         */
        importLayerConfig: function(config) {
            try {
                // Импортируем состояния слоев
                if (config.layerStates) {
                    Object.entries(config.layerStates).forEach(([layerName, visible]) => {
                        setLayerVisibility(layerName, visible);
                    });
                }
                
                // Импортируем пользовательские стили
                if (config.customStyles) {
                    window.MapUtils.saveToStorage('customStyles', config.customStyles);
                    
                    // Применяем стили к загруженным слоям
                    Object.entries(config.customStyles).forEach(([layerName, style]) => {
                        if (layers.has(layerName)) {
                            applyStyleToLayer(layerName, style);
                        }
                    });
                }
                
                return true;
                
            } catch (error) {
                console.error('Ошибка импорта конфигурации слоев:', error);
                return false;
            }
        }
    };
    
})();