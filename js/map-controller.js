/**
 * КОНТРОЛЛЕР КАРТЫ
 * Основной модуль для управления картой OpenLayers и координации всех компонентов
 */

window.MapController = (function() {
    
    // Приватные переменные
    let map = null;
    let view = null;
    let baseLayer = null;
    let isInitialized = false;
    let currentInteraction = null;
    let selectedFeature = null;
    let highlightLayer = null;
    
    // Конфигурация карты
    const mapConfig = {
        // Координаты центра карты (можно изменить на координаты вашего университета)
        center: [4186194.82, 7509177.8], // Примерные координаты в проекции EPSG:3857
        zoom: 16,
        minZoom: 10,
        maxZoom: 22,
        
        // Настройки подложки
        tileLayer: {
            url: 'tiles/podlozka_for_map/{z}/{x}/{y}.png',
            fallbackUrl: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© Карта университета'
        }
    };
    
    // Стили для подсветки объектов
    const highlightStyles = {
        default: new ol.style.Style({
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
        }),
        
        selected: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 0.6)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 4
            }),
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 0.6)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ff0000',
                    width: 4
                })
            })
        })
    };
    
    /**
     * Инициализация контроллера карты
     */
    function init() {
        try {
            // Инициализируем карту
            initializeMap();
            
            // Создаем слой подсветки
            createHighlightLayer();
            
            // Настраиваем взаимодействия
            setupInteractions();
            
            // Настраиваем элементы управления
            setupControls();
            
            // Настраиваем обработчики событий
            setupEventListeners();
            
            isInitialized = true;
            console.log('MapController инициализирован');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации MapController:', error);
            return false;
        }
    }
    
    /**
     * Инициализация карты OpenLayers
     */
    function initializeMap() {
        // Создаем проекцию
        const projection = ol.proj.get('EPSG:3857');
        
        // Создаем view
        view = new ol.View({
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            minZoom: mapConfig.minZoom,
            maxZoom: mapConfig.maxZoom,
            projection: projection,
            enableRotation: false,
            constrainResolution: true
        });
        
        // Создаем базовый слой
        createBaseLayer();

        // Массив слоёв карты
        const mapLayers = [baseLayer];

        // Добавляем все природные слои из папки data/nature/
        const natureLayers = [
            { name: 'beach',    file: 'data/nature/beach.geojson',      color: 'rgba(255, 236, 179, 0.5)' },
            { name: 'fields',   file: 'data/nature/fields.geojson',     color: 'rgba(205, 255, 181, 0.5)' },
            { name: 'forest',   file: 'data/nature/forest.geojson',     color: 'rgba(34, 139, 34, 0.3)' },
            { name: 'grassland',file: 'data/nature/grassland.geojson',  color: 'rgba(181, 255, 181, 0.4)' },
            { name: 'greenhouse',file:'data/nature/greenhouse.geojson', color: 'rgba(200,255,255,0.3)' },
            { name: 'orchdeal', file: 'data/nature/orchdeal.geojson',   color: 'rgba(255, 255, 200, 0.3)' },
            { name: 'parks',    file: 'data/nature/parks.geojson',      color: 'rgba(144, 238, 144, 0.4)' },
            { name: 'pitch',    file: 'data/nature/pitch.geojson',      color: 'rgba(0, 255, 0, 0.2)' },
            { name: 'water',    file: 'data/nature/water.geojson',      color: 'rgba(0, 191, 255, 0.3)' }
        ];
        natureLayers.forEach(layerInfo => {
            mapLayers.push(new ol.layer.Vector({
                source: new ol.source.Vector({
                    url: layerInfo.file,
                    format: new ol.format.GeoJSON()
                }),
                name: layerInfo.name,
                title: layerInfo.name.charAt(0).toUpperCase() + layerInfo.name.slice(1),
                zIndex: 10,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({ color: layerInfo.color }),
                    stroke: new ol.style.Stroke({ color: '#4caf50', width: 1 })
                })
            }));
        });

        // Создаем карту
        map = new ol.Map({
            target: 'map',
            layers: mapLayers,
            view: view,
            controls: (ol.control.defaults && typeof ol.control.defaults === 'function')
                ? ol.control.defaults()
                : undefined,
            interactions: (ol.interaction.defaults && typeof ol.interaction.defaults === 'function')
                ? ol.interaction.defaults({
                    doubleClickZoom: false,
                    keyboardPan: true,
                    keyboardZoom: true,
                    mouseWheelZoom: true,
                    pinchRotate: false,
                    pinchZoom: true
                })
                : undefined
        });
        
        // Скрываем индикатор загрузки после инициализации
        setTimeout(() => {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }, 1000);
    }
    
    /**
     * Создание базового слоя
     */
    function createBaseLayer() {
        // Создаем векторный слой подложки из GeoJSON
        baseLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: 'data/buildings/podlozka_for_map.geojson',
                format: new ol.format.GeoJSON(),
                attributions: mapConfig.tileLayer.attribution
            }),
            name: 'customBase',
            title: 'Кастомная подложка',
            zIndex: 0,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(220,220,220,0.7)' }),
                stroke: new ol.style.Stroke({ color: '#888', width: 1 })
            })
        });
    }
    
    /**
     * Создание слоя подсветки
     */
    function createHighlightLayer() {
        highlightLayer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            name: 'highlight',
            title: 'Подсветка объектов',
            zIndex: 1000
        });
        
        map.addLayer(highlightLayer);
    }
    
    /**
     * Настройка взаимодействий
     */
    function setupInteractions() {
        // Взаимодействие для кликов по объектам
        const selectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.click,
            layers: function(layer) {
                // Только интерактивные слои
                return layer.get('interactive') === true;
            },
            style: highlightStyles.selected
        });
        
        map.addInteraction(selectInteraction);
        currentInteraction = selectInteraction;
        
        // Обработчик выбора объектов
        selectInteraction.on('select', handleFeatureSelect);
        
        // Взаимодействие для наведения курсора
        const hoverInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            layers: function(layer) {
                return layer.get('interactive') === true;
            },
            style: highlightStyles.default
        });
        
        map.addInteraction(hoverInteraction);
        
        // Изменение курсора при наведении
        hoverInteraction.on('select', function(event) {
            let mapElement = map.getTarget();
            if (typeof mapElement === 'string') {
                mapElement = document.getElementById(mapElement);
            }
            if (mapElement && mapElement.style) {
                mapElement.style.cursor = (event.selected.length > 0) ? 'pointer' : '';
            }
        });
    }
    
    /**
     * Настройка элементов управления
     */
    function setupControls() {
        // Кнопка сброса вида
        const resetViewBtn = document.getElementById('reset-view');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', resetView);
        }
        
        // Кнопка геолокации
        const locateBtn = document.getElementById('locate-user');
        if (locateBtn) {
            locateBtn.addEventListener('click', locateUser);
        }
        
        // Кнопка полноэкранного режима
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    function setupEventListeners() {
        // Событие изменения размера карты
        window.addEventListener('resize', () => {
            if (map) {
                setTimeout(() => {
                    map.updateSize();
                }, 200);
            }
        });
        
        // Событие изменения вида карты
        if (view) {
            view.on('change:center', saveMapState);
            view.on('change:zoom', saveMapState);
        }
        
        // Клик по карте (для снятия выделения)
        map.on('click', handleMapClick);
        
        // Событие окончания движения карты
        map.on('moveend', handleMoveEnd);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    /**
     * Обработка выбора объекта
     */
    function handleFeatureSelect(event) {
        const selected = event.selected;
        const deselected = event.deselected;
        
        // Убираем предыдущее выделение
        if (deselected.length > 0) {
            selectedFeature = null;
        }
        
        // Обрабатываем новое выделение
        if (selected.length > 0) {
            const feature = selected[0];
            selectedFeature = feature;
            
            // Получаем информацию о слое
            const layer = getFeatureLayer(feature);
            const layerName = layer ? layer.get('name') : 'unknown';
            
            // Показываем информацию об объекте
            if (window.InfoPanel) {
                const objectData = {
                    id: feature.getId() || feature.get('id'),
                    layer: layerName,
                    properties: feature.getProperties(),
                    geometry: feature.getGeometry()
                };
                
                window.InfoPanel.showObjectInfo(objectData.id, layerName, objectData);
            }
            
            // Центрируем карту на объекте (опционально)
            if (feature.getGeometry()) {
                const geometry = feature.getGeometry();
                const center = window.MapUtils.getGeometryCenter(geometry);
                
                // Плавно перемещаемся к объекту
                view.animate({
                    center: center,
                    duration: 500
                });
            }
        } else {
            // Скрываем информационную панель если ничего не выбрано
            if (window.InfoPanel) {
                window.InfoPanel.hidePanel();
            }
        }
    }
    
    /**
     * Обработка клика по карте
     */
    function handleMapClick(event) {
        // Проверяем, попали ли мы в объект
        const feature = map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
            if (layer && layer.get('interactive')) {
                return feature;
            }
        });
        
        // Если не попали в интерактивный объект, снимаем выделение
        if (!feature && currentInteraction) {
            currentInteraction.getFeatures().clear();
        }
    }
    
    /**
     * Обработка окончания движения карты
     */
    function handleMoveEnd(event) {
        // Обновляем видимые объекты в поиске
        if (window.SearchModule) {
            // Можно добавить логику обновления поиска по видимой области
        }
    }
    
    /**
     * Получение слоя, содержащего объект
     */
    function getFeatureLayer(feature) {
        let foundLayer = null;
        
        map.getLayers().forEach(function(layer) {
            if (layer instanceof ol.layer.Vector) {
                const source = layer.getSource();
                if (source.getFeatures().includes(feature)) {
                    foundLayer = layer;
                }
            }
        });
        
        return foundLayer;
    }
    
    /**
     * Сброс вида карты
     */
    function resetView() {
        if (view) {
            view.animate({
                center: mapConfig.center,
                zoom: mapConfig.zoom,
                duration: 1000
            });
            
            window.MapUtils.showNotification('Вид карты сброшен', 'info', 2000);
        }
    }
    
    /**
     * Геолокация пользователя
     */
    function locateUser() {
        if (!navigator.geolocation) {
            window.MapUtils.showNotification('Геолокация не поддерживается', 'error');
            return;
        }
        
        const locateBtn = document.getElementById('locate-user');
        if (locateBtn) {
            locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const coords = ol.proj.fromLonLat([
                    position.coords.longitude,
                    position.coords.latitude
                ]);
                
                // Перемещаемся к местоположению пользователя
                view.animate({
                    center: coords,
                    zoom: 18,
                    duration: 1000
                });
                
                // Добавляем маркер местоположения
                addLocationMarker(coords);
                
                window.MapUtils.showNotification('Местоположение найдено', 'success');
            },
            function(error) {
                console.error('Ошибка геолокации:', error);
                window.MapUtils.showNotification('Не удалось определить местоположение', 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
        
        // Восстанавливаем иконку кнопки
        setTimeout(() => {
            if (locateBtn) {
                locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }
        }, 2000);
    }
    
    /**
     * Добавление маркера местоположения
     */
    function addLocationMarker(coords) {
        // Удаляем предыдущий маркер
        const existingMarker = highlightLayer.getSource().getFeatures().find(
            feature => feature.get('type') === 'user-location'
        );
        
        if (existingMarker) {
            highlightLayer.getSource().removeFeature(existingMarker);
        }
        
        // Создаем новый маркер
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(coords),
            type: 'user-location'
        });
        
        marker.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: 'rgba(0, 123, 255, 0.8)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 3
                })
            })
        }));
        
        highlightLayer.getSource().addFeature(marker);
        
        // Удаляем маркер через 10 секунд
        setTimeout(() => {
            highlightLayer.getSource().removeFeature(marker);
        }, 10000);
    }
    
    /**
     * Переключение полноэкранного режима
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                const btn = document.getElementById('fullscreen-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-compress"></i>';
                }
            });
        } else {
            document.exitFullscreen().then(() => {
                const btn = document.getElementById('fullscreen-btn');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-expand"></i>';
                }
            });
        }
    }
    
    /**
     * Обработка горячих клавиш
     */
    function handleKeyboardShortcuts(event) {
        // Игнорируем, если фокус на поле ввода
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.key) {
            case 'Home':
                event.preventDefault();
                resetView();
                break;
                
            case 'f':
                if (event.ctrlKey) {
                    event.preventDefault();
                    if (window.SearchModule) {
                        window.SearchModule.focus();
                    }
                }
                break;
                
            case 'F11':
                event.preventDefault();
                toggleFullscreen();
                break;
                
            case '+':
            case '=':
                if (event.ctrlKey) {
                    event.preventDefault();
                    zoomIn();
                }
                break;
                
            case '-':
                if (event.ctrlKey) {
                    event.preventDefault();
                    zoomOut();
                }
                break;
                
            case 'Escape':
                if (selectedFeature && currentInteraction) {
                    currentInteraction.getFeatures().clear();
                }
                break;
        }
        
        // Навигация стрелками
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            if (event.shiftKey) {
                event.preventDefault();
                panMap(event.key);
            }
        }
    }
    
    /**
     * Масштабирование карты
     */
    function zoomIn() {
        if (view) {
            const currentZoom = view.getZoom();
            view.animate({
                zoom: currentZoom + 1,
                duration: 300
            });
        }
    }
    
    function zoomOut() {
        if (view) {
            const currentZoom = view.getZoom();
            view.animate({
                zoom: currentZoom - 1,
                duration: 300
            });
        }
    }
    
    /**
     * Перемещение карты
     */
    function panMap(direction) {
        if (!view) return;
        
        const center = view.getCenter();
        const resolution = view.getResolution();
        const delta = 50 * resolution;
        
        let newCenter = [...center];
        
        switch (direction) {
            case 'ArrowUp':
                newCenter[1] += delta;
                break;
            case 'ArrowDown':
                newCenter[1] -= delta;
                break;
            case 'ArrowLeft':
                newCenter[0] -= delta;
                break;
            case 'ArrowRight':
                newCenter[0] += delta;
                break;
        }
        
        view.animate({
            center: newCenter,
            duration: 300
        });
    }
    
    /**
     * Сохранение состояния карты
     */
    function saveMapState() {
        if (!view) return;
        
        const state = {
            center: view.getCenter(),
            zoom: view.getZoom(),
            timestamp: Date.now()
        };
        
        window.MapUtils.saveToStorage('mapState', state);
    }
    
    /**
     * Загрузка состояния карты
     */
    function loadMapState() {
        const state = window.MapUtils.loadFromStorage('mapState');
        
        if (state && state.center && state.zoom) {
            view.setCenter(state.center);
            view.setZoom(state.zoom);
        }
    }
    
    /**
     * Фокусировка на объекте
     */
    function focusOnObject(objectId, layerName) {
        if (!window.LayerManager) return false;
        
        try {
            const featureInfo = window.LayerManager.findFeatureById(objectId, layerName);
            
            if (!featureInfo) {
                console.warn(`Объект ${objectId} в слое ${layerName} не найден`);
                return false;
            }
            
            const feature = featureInfo.feature;
            const geometry = feature.getGeometry();
            
            if (!geometry) return false;
            
            // Выделяем объект
            if (currentInteraction) {
                currentInteraction.getFeatures().clear();
                currentInteraction.getFeatures().push(feature);
            }
            
            // Центрируем карту на объекте
            const center = window.MapUtils.getGeometryCenter(geometry);
            
            view.animate({
                center: center,
                zoom: Math.max(view.getZoom(), 18),
                duration: 1000
            });
            
            // Подсвечиваем объект
            if (window.LayerManager) {
                window.LayerManager.highlightFeature(feature, featureInfo.layer);
            }
            
            return true;
            
        } catch (error) {
            console.error('Ошибка фокусировки на объекте:', error);
            return false;
        }
    }
    
    /**
     * Подсветка результатов поиска
     */
    function highlightSearchResults(query) {
        // Очищаем предыдущие результаты
        clearHighlights();
        
        if (!window.SearchModule || !query) return;
        
        // Получаем результаты поиска
        const searchResults = window.SearchModule.getCurrentResults();
        const matchingFeatures = [];
        
        searchResults.forEach(result => {
            if (result.name && result.name.toLowerCase().includes(query.toLowerCase())) {
                const featureInfo = window.LayerManager.findFeatureById(result.id, result.layer);
                if (featureInfo) {
                    matchingFeatures.push(featureInfo.feature);
                }
            }
        });
        
        if (matchingFeatures.length > 0) {
            // Подсвечиваем найденные объекты
            matchingFeatures.forEach(feature => {
                const highlightFeature = feature.clone();
                highlightFeature.setStyle(highlightStyles.default);
                highlightLayer.getSource().addFeature(highlightFeature);
            });
            
            // Масштабируемся к результатам
            if (matchingFeatures.length === 1) {
                const center = window.MapUtils.getGeometryCenter(matchingFeatures[0].getGeometry());
                view.animate({
                    center: center,
                    zoom: 18,
                    duration: 1000
                });
            } else {
                // Масштабируемся ко всем результатам
                const extent = new ol.extent.createEmpty();
                matchingFeatures.forEach(feature => {
                    ol.extent.extend(extent, feature.getGeometry().getExtent());
                });
                
                view.fit(extent, {
                    padding: [50, 50, 50, 50],
                    duration: 1000
                });
            }
            
            window.MapUtils.showNotification(`Найдено ${matchingFeatures.length} объектов`, 'success');
        } else {
            window.MapUtils.showNotification('Объекты не найдены', 'warning');
        }
    }
    
    /**
     * Очистка подсветки
     */
    function clearHighlights() {
        if (highlightLayer) {
            highlightLayer.getSource().clear();
        }
    }
    
    // =====================================
    // ПУБЛИЧНЫЙ API
    // =====================================
    
    return {
        init: init,
        
        /**
         * Получение экземпляра карты
         */
        getMap: function() {
            return map;
        },
        
        /**
         * Получение view карты
         */
        getView: function() {
            return view;
        },
        
        /**
         * Фокусировка на объекте
         */
        focusOnObject: focusOnObject,
        
        /**
         * Подсветка результатов поиска
         */
        highlightSearchResults: highlightSearchResults,
        
        /**
         * Очистка подсветки
         */
        clearHighlights: clearHighlights,
        
        /**
         * Сброс вида карты
         */
        resetView: resetView,
        
        /**
         * Масштабирование
         */
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        
        /**
         * Центрирование карты
         */
        centerOn: function(coordinates) {
            if (view && coordinates) {
                view.animate({
                    center: coordinates,
                    duration: 500
                });
            }
        },
        
        /**
         * Масштабирование к границам
         */
        fitExtent: function(extent, options = {}) {
            if (view && extent) {
                const fitOptions = {
                    padding: [20, 20, 20, 20],
                    duration: 500,
                    ...options
                };
                
                view.fit(extent, fitOptions);
            }
        },
        
        /**
         * Получение текущего выбранного объекта
         */
        getSelectedFeature: function() {
            return selectedFeature;
        },
        
        /**
         * Снятие выделения
         */
        clearSelection: function() {
            if (currentInteraction) {
                currentInteraction.getFeatures().clear();
            }
        },
        
        /**
         * Обновление размера карты
         */
        updateSize: function() {
            if (map) {
                setTimeout(() => {
                    map.updateSize();
                }, 100);
            }
        },
        
        /**
         * Сохранение состояния карты
         */
        saveState: saveMapState,
        
        /**
         * Загрузка состояния карты
         */
        loadState: loadMapState,
        
        /**
         * Проверка инициализации
         */
        isInitialized: function() {
            return isInitialized;
        }
    };
    
})();