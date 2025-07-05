/**
 * УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * Модуль содержит общие функции для работы с картой университета
 */

// Глобальный объект для утилит
window.MapUtils = {
    
    // =====================================
    // РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ
    // =====================================
    
    /**
     * Сохранение данных в localStorage с обработкой ошибок
     * @param {string} key - Ключ для сохранения
     * @param {*} data - Данные для сохранения
     * @returns {boolean} - Успешность операции
     */
    saveToStorage: function(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            return false;
        }
    },
    
    /**
     * Загрузка данных из localStorage
     * @param {string} key - Ключ для загрузки
     * @param {*} defaultValue - Значение по умолчанию
     * @returns {*} - Загруженные данные или значение по умолчанию
     */
    loadFromStorage: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Удаление данных из localStorage
     * @param {string} key - Ключ для удаления
     */
    removeFromStorage: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
        }
    },
    
    // =====================================
    // РАБОТА С ГЕОДАННЫМИ
    // =====================================
    
    /**
     * Загрузка GeoJSON файла с обработкой ошибок
     * @param {string} url - URL файла
     * @returns {Promise<Object>} - Промис с данными GeoJSON
     */
    loadGeoJSON: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Ошибка загрузки GeoJSON ${url}:`, error);
            // Возвращаем пустой GeoJSON в случае ошибки
            return {
                type: "FeatureCollection",
                features: []
            };
        }
    },
    
    /**
     * Валидация GeoJSON данных
     * @param {Object} geojson - Данные GeoJSON
     * @returns {boolean} - Валидность данных
     */
    validateGeoJSON: function(geojson) {
        if (!geojson || typeof geojson !== 'object') return false;
        if (geojson.type !== 'FeatureCollection') return false;
        if (!Array.isArray(geojson.features)) return false;
        
        return geojson.features.every(feature => {
            return feature.type === 'Feature' &&
                   feature.geometry &&
                   feature.properties;
        });
    },
    
    /**
     * Вычисление центра геометрии
     * @param {Object} geometry - Геометрия OpenLayers
     * @returns {Array} - Координаты центра [x, y]
     */
    getGeometryCenter: function(geometry) {
        if (!geometry) return [0, 0];
        
        try {
            const extent = geometry.getExtent();
            return ol.extent.getCenter(extent);
        } catch (error) {
            console.error('Ошибка вычисления центра геометрии:', error);
            return [0, 0];
        }
    },
    
    /**
     * Вычисление расстояния между двумя точками
     * @param {Array} coord1 - Первая координата [x, y]
     * @param {Array} coord2 - Вторая координата [x, y]
     * @returns {number} - Расстояние в метрах
     */
    calculateDistance: function(coord1, coord2) {
        const dx = coord1[0] - coord2[0];
        const dy = coord1[1] - coord2[1];
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // =====================================
    // РАБОТА СО СТИЛЯМИ
    // =====================================
    
    /**
     * Создание стиля OpenLayers
     * @param {Object} config - Конфигурация стиля
     * @returns {ol.style.Style} - Стиль OpenLayers
     */
    createStyle: function(config) {
        const defaultConfig = {
            fillColor: '#3498db',
            fillOpacity: 0.7,
            strokeColor: '#2980b9',
            strokeWidth: 2,
            strokeOpacity: 1
        };
        
        const style = Object.assign({}, defaultConfig, config);
        
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: this.hexToRgba(style.fillColor, style.fillOpacity)
            }),
            stroke: new ol.style.Stroke({
                color: this.hexToRgba(style.strokeColor, style.strokeOpacity),
                width: style.strokeWidth
            }),
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({
                    color: this.hexToRgba(style.fillColor, style.fillOpacity)
                }),
                stroke: new ol.style.Stroke({
                    color: this.hexToRgba(style.strokeColor, style.strokeOpacity),
                    width: style.strokeWidth
                })
            })
        });
    },
    
    /**
     * Преобразование HEX цвета в RGBA
     * @param {string} hex - HEX цвет
     * @param {number} alpha - Прозрачность (0-1)
     * @returns {string} - RGBA строка
     */
    hexToRgba: function(hex, alpha = 1) {
        if (!hex) return `rgba(52, 152, 219, ${alpha})`;
        
        // Удаляем # если есть
        hex = hex.replace('#', '');
        
        // Если короткий формат, расширяем
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    /**
     * Преобразование RGBA в HEX
     * @param {string} rgba - RGBA строка
     * @returns {string} - HEX цвет
     */
    rgbaToHex: function(rgba) {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return '#3498db';
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    // =====================================
    // РАБОТА С DOM
    // =====================================
    
    /**
     * Показ уведомления
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип уведомления (success, error, warning, info)
     * @param {number} duration - Длительность показа в мс
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentNode.parentNode.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Добавляем стили, если их нет
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 70px;
                    right: 20px;
                    z-index: 2000;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    overflow: hidden;
                    animation: slideInRight 0.3s ease;
                    max-width: 350px;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 15px 20px;
                }
                .notification-success { border-left: 4px solid #28a745; }
                .notification-error { border-left: 4px solid #dc3545; }
                .notification-warning { border-left: 4px solid #ffc107; }
                .notification-info { border-left: 4px solid #17a2b8; }
                .notification-close {
                    background: none;
                    border: none;
                    color: #6c757d;
                    cursor: pointer;
                    margin-left: auto;
                    padding: 5px;
                    border-radius: 4px;
                }
                .notification-close:hover {
                    background: #f8f9fa;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },
    
    /**
     * Получение иконки для уведомления
     * @param {string} type - Тип уведомления
     * @returns {string} - Класс иконки
     */
    getNotificationIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    /**
     * Создание элемента с атрибутами
     * @param {string} tag - Тег элемента
     * @param {Object} attributes - Атрибуты элемента
     * @param {string} content - Содержимое элемента
     * @returns {HTMLElement} - Созданный элемент
     */
    createElement: function(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'onclick' && typeof attributes[key] === 'function') {
                element.addEventListener('click', attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },
    
    // =====================================
    // УТИЛИТЫ АНИМАЦИИ
    // =====================================
    
    /**
     * Плавная анимация скролла к элементу
     * @param {HTMLElement} element - Целевой элемент
     * @param {number} duration - Длительность анимации в мс
     */
    scrollToElement: function(element, duration = 500) {
        if (!element) return;
        
        const start = window.pageYOffset;
        const target = element.getBoundingClientRect().top + start;
        const startTime = performance.now();
        
        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Функция сглаживания
            const easeInOutCubic = progress => 
                progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
            
            const currentPosition = start + (target - start) * easeInOutCubic(progress);
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    },
    
    /**
     * Добавление класса с анимацией
     * @param {HTMLElement} element - Элемент
     * @param {string} className - Класс для добавления
     * @param {number} delay - Задержка в мс
     */
    addClassWithDelay: function(element, className, delay = 0) {
        setTimeout(() => {
            if (element) {
                element.classList.add(className);
            }
        }, delay);
    },
    
    // =====================================
    // РАБОТА С ФОРМАМИ
    // =====================================
    
    /**
     * Сериализация формы в объект
     * @param {HTMLFormElement} form - Форма
     * @returns {Object} - Объект с данными формы
     */
    serializeForm: function(form) {
        const formData = new FormData(form);
        const result = {};
        
        for (let [key, value] of formData.entries()) {
            if (result[key]) {
                // Если ключ уже существует, создаем массив
                if (!Array.isArray(result[key])) {
                    result[key] = [result[key]];
                }
                result[key].push(value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    },
    
    /**
     * Валидация email адреса
     * @param {string} email - Email для проверки
     * @returns {boolean} - Валидность email
     */
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Валидация телефона
     * @param {string} phone - Телефон для проверки
     * @returns {boolean} - Валидность телефона
     */
    validatePhone: function(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },
    
    // =====================================
    // УТИЛИТЫ ДЕБАГГИНГА
    // =====================================
    
    /**
     * Логирование с временной меткой
     * @param {string} message - Сообщение
     * @param {*} data - Дополнительные данные
     */
    log: function(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data || '');
    },
    
    /**
     * Измерение производительности функции
     * @param {Function} func - Функция для измерения
     * @param {string} name - Название операции
     * @returns {*} - Результат выполнения функции
     */
    measurePerformance: function(func, name = 'Operation') {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} заняла ${(end - start).toFixed(2)} мс`);
        return result;
    },
    
    // =====================================
    // УТИЛИТЫ ЭКСПОРТА/ИМПОРТА
    // =====================================
    
    /**
     * Экспорт данных в JSON файл
     * @param {Object} data - Данные для экспорта
     * @param {string} filename - Имя файла
     */
    exportToJSON: function(data, filename = 'export.json') {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('Файл успешно экспортирован', 'success');
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('Ошибка экспорта файла', 'error');
        }
    },
    
    /**
     * Импорт JSON файла
     * @param {File} file - Файл для импорта
     * @returns {Promise<Object>} - Промис с данными
     */
    importFromJSON: function(file) {
        return new Promise((resolve, reject) => {
            if (!file || file.type !== 'application/json') {
                reject(new Error('Неверный тип файла'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Ошибка парсинга JSON'));
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    },
    
    // =====================================
    // УТИЛИТЫ ДЕБАУНСА И ТРОТТЛИНГА
    // =====================================
    
    /**
     * Дебаунс функции
     * @param {Function} func - Функция для дебаунса
     * @param {number} wait - Время ожидания в мс
     * @returns {Function} - Дебаунсированная функция
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Троттлинг функции
     * @param {Function} func - Функция для троттлинга
     * @param {number} limit - Лимит времени в мс
     * @returns {Function} - Троттлированная функция
     */
    throttle: function(func, limit) {
        let lastFunc;
        let lastRan;
        return function(...args) {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MapUtils;
}