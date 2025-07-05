/**
 * ГЛАВНЫЙ ФАЙЛ ИНИЦИАЛИЗАЦИИ ПРИЛОЖЕНИЯ
 * Координирует инициализацию всех модулей карты университета
 */

(function() {
    'use strict';
    
    // Глобальная конфигурация приложения
    const AppConfig = {
        version: '1.0.0',
        name: 'Интерактивная карта университета',
        debug: true,
        modules: [
            'MapUtils',
            'MapController', 
            'LayerManager',
            'SearchModule',
            'CategoryPanel',
            'InfoPanel',
            'DataForms',
            'StyleEditor',
            'DevMode'
        ],
        autoLoad: true,
        errorRetries: 3
    };
    
    // Состояние инициализации
    let initializationState = {
        started: false,
        completed: false,
        errors: [],
        startTime: null,
        endTime: null,
        modules: {}
    };
    
    /**
     * Главная функция инициализации приложения
     */
    async function initializeApplication() {
        try {
            initializationState.started = true;
            initializationState.startTime = performance.now();
            
            console.log(`🚀 Запуск ${AppConfig.name} v${AppConfig.version}`);
            
            // Проверяем готовность DOM
            await waitForDOM();
            
            // Показываем экран загрузки
            showLoadingScreen();
            
            // Проверяем поддержку браузера
            checkBrowserSupport();
            
            // Инициализируем модули в правильном порядке
            await initializeModules();
            
            // Загружаем данные карты
            await loadMapData();
            
            // Настраиваем глобальные обработчики
            setupGlobalHandlers();
            
            // Восстанавливаем состояние приложения
            restoreApplicationState();
            
            // Завершаем инициализацию
            completeInitialization();
            
        } catch (error) {
            handleInitializationError(error);
        }
    }
    
    /**
     * Ожидание готовности DOM
     */
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Показ экрана загрузки
     */
    function showLoadingScreen() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
            updateLoadingMessage('Инициализация приложения...');
        }
    }
    
    /**
     * Обновление сообщения загрузки
     */
    function updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            const messageElement = loadingElement.querySelector('span');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }
    
    /**
     * Проверка поддержки браузера
     */
    function checkBrowserSupport() {
        const requiredFeatures = [
            'fetch',
            'localStorage',
            'Promise',
            'Map',
            'Set'
        ];
        
        const unsupportedFeatures = requiredFeatures.filter(feature => {
            return typeof window[feature] === 'undefined';
        });
        
        if (unsupportedFeatures.length > 0) {
            throw new Error(`Браузер не поддерживает необходимые функции: ${unsupportedFeatures.join(', ')}`);
        }
        
        // Проверяем WebGL для OpenLayers
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.warn('WebGL не поддерживается, производительность может быть снижена');
        }
        
        console.log('✅ Браузер поддерживает все необходимые функции');
    }
    
    /**
     * Инициализация модулей
     */
    async function initializeModules() {
        console.log('📦 Инициализация модулей...');
        
        // Определяем порядок инициализации модулей
        const initializationOrder = [
            { name: 'MapUtils', required: true, init: () => window.MapUtils },
            { name: 'MapController', required: true, init: () => window.MapController?.init() },
            { name: 'LayerManager', required: true, init: () => window.LayerManager?.init(window.MapController?.getMap()) },
            { name: 'SearchModule', required: true, init: () => window.SearchModule?.init() },
            { name: 'CategoryPanel', required: true, init: () => window.CategoryPanel?.init() },
            { name: 'InfoPanel', required: true, init: () => window.InfoPanel?.init() },
            { name: 'DataForms', required: false, init: () => window.DataForms?.init() },
            { name: 'StyleEditor', required: false, init: () => window.StyleEditor?.init() },
            { name: 'DevMode', required: false, init: () => window.DevMode?.init() }
        ];
        
        for (const moduleConfig of initializationOrder) {
            await initializeModule(moduleConfig);
        }
        
        console.log('✅ Все модули инициализированы');
    }
    
    /**
     * Инициализация отдельного модуля
     */
    async function initializeModule(moduleConfig) {
        const { name, required, init } = moduleConfig;
        
        try {
            updateLoadingMessage(`Инициализация ${name}...`);
            
            // Проверяем доступность модуля
            if (!window[name] && required) {
                throw new Error(`Обязательный модуль ${name} не найден`);
            }
            
            if (!window[name]) {
                console.warn(`⚠️ Опциональный модуль ${name} не найден, пропускаем`);
                initializationState.modules[name] = { status: 'skipped', error: 'Module not found' };
                return;
            }
            
            // Инициализируем модуль
            const startTime = performance.now();
            let result = false;
            
            if (typeof init === 'function') {
                result = await init();
            }
            
            const endTime = performance.now();
            const initTime = Math.round(endTime - startTime);
            
            if (result !== false) {
                console.log(`✅ ${name} инициализирован за ${initTime}мс`);
                initializationState.modules[name] = { 
                    status: 'success', 
                    initTime: initTime,
                    instance: window[name]
                };
            } else {
                throw new Error(`Модуль ${name} вернул false при инициализации`);
            }
            
        } catch (error) {
            const errorMessage = `Ошибка инициализации ${name}: ${error.message}`;
            console.error(`❌ ${errorMessage}`);
            
            initializationState.modules[name] = { 
                status: 'error', 
                error: error.message 
            };
            
            if (required) {
                throw new Error(errorMessage);
            }
        }
    }
    
    /**
     * Загрузка данных карты
     */
    async function loadMapData() {
        try {
            updateLoadingMessage('Загрузка данных карты...');
            
            if (window.LayerManager) {
                await window.LayerManager.loadAllLayers();
                console.log('✅ Данные карты загружены');
            } else {
                console.warn('⚠️ LayerManager не доступен, пропускаем загрузку слоев');
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных карты:', error);
            // Не прерываем инициализацию, продолжаем с пустой картой
        }
    }
    
    /**
     * Настройка глобальных обработчиков
     */
    function setupGlobalHandlers() {
        console.log('🔧 Настройка глобальных обработчиков...');
        
        // Обработчик ошибок JavaScript
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
        // Обработчик изменения размера окна
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.MapController) {
                    window.MapController.updateSize();
                }
            }, 250);
        });
        
        // Обработчик изменения состояния онлайн/офлайн
        window.addEventListener('online', handleOnlineStateChange);
        window.addEventListener('offline', handleOnlineStateChange);
        
        // Обработчик смены видимости страницы
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Предотвращение случайного закрытия страницы с несохраненными изменениями
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Горячие клавиши уровня приложения
        document.addEventListener('keydown', handleGlobalKeydown);
        
        console.log('✅ Глобальные обработчики настроены');
    }
    
    /**
     * Обработка глобальных ошибок JavaScript
     */
    function handleGlobalError(event) {
        console.error('Глобальная ошибка JavaScript:', event.error);
        
        if (window.MapUtils) {
            window.MapUtils.showNotification(
                'Произошла ошибка в приложении. Проверьте консоль для деталей.',
                'error'
            );
        }
        
        // Логируем ошибку для дальнейшего анализа
        logError({
            type: 'javascript_error',
            message: event.error?.message || 'Unknown error',
            stack: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Обработка необработанных Promise rejection
     */
    function handleUnhandledRejection(event) {
        console.error('Необработанное отклонение Promise:', event.reason);
        
        if (window.MapUtils) {
            window.MapUtils.showNotification(
                'Произошла ошибка при выполнении операции',
                'error'
            );
        }
        
        logError({
            type: 'unhandled_rejection',
            reason: event.reason,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Обработка изменения состояния подключения
     */
    function handleOnlineStateChange() {
        const isOnline = navigator.onLine;
        
        if (window.MapUtils) {
            const message = isOnline ? 'Подключение восстановлено' : 'Подключение потеряно';
            const type = isOnline ? 'success' : 'warning';
            window.MapUtils.showNotification(message, type);
        }
        
        console.log(`🌐 Состояние подключения: ${isOnline ? 'онлайн' : 'офлайн'}`);
    }
    
    /**
     * Обработка изменения видимости страницы
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            // Страница скрыта - можно приостановить некоторые операции
            console.log('📱 Страница скрыта');
        } else {
            // Страница снова видима - возобновляем операции
            console.log('📱 Страница видима');
            
            // Обновляем размер карты на случай изменений
            if (window.MapController) {
                window.MapController.updateSize();
            }
        }
    }
    
    /**
     * Обработка закрытия страницы
     */
    function handleBeforeUnload(event) {
        // Проверяем наличие несохраненных изменений
        const hasUnsavedChanges = [
            window.DevMode?.hasUnsavedChanges?.(),
            window.DataForms?.hasUnsavedChanges?.(),
            window.InfoPanel?.isInEditMode?.()
        ].some(Boolean);
        
        if (hasUnsavedChanges) {
            const message = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    }
    
    /**
     * Обработка глобальных горячих клавиш
     */
    function handleGlobalKeydown(event) {
        // Сочетания клавиш уровня приложения
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    // Поиск
                    event.preventDefault();
                    if (window.SearchModule) {
                        window.SearchModule.focus();
                    }
                    break;
                    
                case 'h':
                    // Справка
                    if (event.shiftKey) {
                        event.preventDefault();
                        showHelpModal();
                    }
                    break;
                    
                case 'r':
                    // Перезагрузка данных
                    if (event.shiftKey) {
                        event.preventDefault();
                        reloadMapData();
                    }
                    break;
            }
        }
    }
    
    /**
     * Восстановление состояния приложения
     */
    function restoreApplicationState() {
        console.log('🔄 Восстановление состояния приложения...');
        
        try {
            // Восстанавливаем состояние карты
            if (window.MapController) {
                window.MapController.loadState();
            }
            
            // Восстанавливаем состояние слоев
            if (window.CategoryPanel) {
                // Состояние слоев восстанавливается автоматически в LayerManager
            }
            
            console.log('✅ Состояние приложения восстановлено');
            
        } catch (error) {
            console.warn('⚠️ Ошибка восстановления состояния:', error);
        }
    }
    
    /**
     * Завершение инициализации
     */
    function completeInitialization() {
        initializationState.completed = true;
        initializationState.endTime = performance.now();
        
        const totalTime = Math.round(initializationState.endTime - initializationState.startTime);
        
        // Скрываем экран загрузки
        hideLoadingScreen();
        
        // Показываем уведомление об успешной загрузке
        if (window.MapUtils) {
            window.MapUtils.showNotification(
                `Карта университета загружена за ${totalTime}мс`,
                'success',
                3000
            );
        }
        
        // Выводим статистику инициализации
        console.log(`🎉 Инициализация завершена за ${totalTime}мс`);
        console.log('📊 Статистика модулей:', initializationState.modules);
        
        // Отправляем событие о завершении инициализации
        document.dispatchEvent(new CustomEvent('appInitialized', {
            detail: {
                totalTime: totalTime,
                modules: initializationState.modules
            }
        }));
        
        // Запускаем пост-инициализационные задачи
        runPostInitializationTasks();
    }
    
    /**
     * Скрытие экрана загрузки
     */
    function hideLoadingScreen() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.transition = 'opacity 0.5s ease';
            loadingElement.style.opacity = '0';
            
            setTimeout(() => {
                loadingElement.classList.add('hidden');
                loadingElement.style.opacity = '';
                loadingElement.style.transition = '';
            }, 500);
        }
    }
    
    /**
     * Пост-инициализационные задачи
     */
    function runPostInitializationTasks() {
        setTimeout(() => {
            // Предварительная загрузка дополнительных ресурсов
            preloadAdditionalResources();
            
            // Проверка обновлений (если есть такая функция)
            checkForUpdates();
            
            // Инициализация аналитики (если нужна)
            initializeAnalytics();
            
        }, 1000);
    }
    
    /**
     * Предварительная загрузка ресурсов
     */
    function preloadAdditionalResources() {
        // Можно добавить предзагрузку иконок, дополнительных стилей и т.д.
        console.log('🔄 Предварительная загрузка дополнительных ресурсов...');
    }
    
    /**
     * Проверка обновлений
     */
    function checkForUpdates() {
        // Заглушка для проверки обновлений
        console.log('🔍 Проверка обновлений...');
    }
    
    /**
     * Инициализация аналитики
     */
    function initializeAnalytics() {
        // Заглушка для аналитики
        if (AppConfig.debug) {
            console.log('📈 Аналитика в режиме отладки');
        }
    }
    
    /**
     * Обработка ошибок инициализации
     */
    function handleInitializationError(error) {
        initializationState.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        console.error('💥 Критическая ошибка инициализации:', error);
        
        // Показываем экран ошибки
        showErrorScreen(error);
    }
    
    /**
     * Показ экрана ошибки
     */
    function showErrorScreen(error) {
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa;">
                    <div style="text-align: center; max-width: 500px; padding: 40px;">
                        <div style="font-size: 4rem; color: #dc3545; margin-bottom: 20px;">😞</div>
                        <h1 style="color: #dc3545; margin-bottom: 20px;">Ошибка загрузки</h1>
                        <p style="color: #6c757d; margin-bottom: 30px; line-height: 1.6;">
                            К сожалению, произошла ошибка при загрузке карты университета. 
                            Пожалуйста, перезагрузите страницу или обратитесь к администратору.
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; font-size: 0.9rem; color: #dc3545; text-align: left;">
                            ${error.message}
                        </div>
                        <button onclick="window.location.reload()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 1rem;">
                            Перезагрузить страницу
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Показ модального окна справки
     */
    function showHelpModal() {
        if (!window.MapUtils) return;
        
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.classList.add('show');
        }
    }
    
    /**
     * Перезагрузка данных карты
     */
    function reloadMapData() {
        if (window.MapUtils) {
            window.MapUtils.showNotification('Перезагрузка данных карты...', 'info');
        }
        
        if (window.LayerManager) {
            window.LayerManager.loadAllLayers()
                .then(() => {
                    if (window.MapUtils) {
                        window.MapUtils.showNotification('Данные карты обновлены', 'success');
                    }
                })
                .catch(error => {
                    console.error('Ошибка перезагрузки данных:', error);
                    if (window.MapUtils) {
                        window.MapUtils.showNotification('Ошибка обновления данных', 'error');
                    }
                });
        }
    }
    
    /**
     * Логирование ошибок
     */
    function logError(errorData) {
        // Сохраняем в localStorage для последующего анализа
        const errors = window.MapUtils?.loadFromStorage('errorLog', []) || [];
        errors.push(errorData);
        
        // Ограничиваем размер лога
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        if (window.MapUtils) {
            window.MapUtils.saveToStorage('errorLog', errors);
        }
    }
    
    /**
     * Публичный API для отладки и диагностики
     */
    window.AppDebug = {
        getInitializationState: () => initializationState,
        getConfig: () => AppConfig,
        reloadMapData: reloadMapData,
        getErrorLog: () => window.MapUtils?.loadFromStorage('errorLog', []) || [],
        clearErrorLog: () => window.MapUtils?.removeFromStorage('errorLog')
    };
    
    // Добавляем обработчик для загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApplication);
    } else {
        // DOM уже готов
        setTimeout(initializeApplication, 0);
    }
    
    // Показываем информацию о приложении в консоли
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  🎓 КАРТА УНИВЕРСИТЕТА                        ║
║                      Версия ${AppConfig.version}                           ║
║                                                               ║
║  🗺️  Интерактивная карта с полной функциональностью          ║
║  🔍  Система поиска и навигации                               ║
║  ⚙️   Режим разработки для редактирования                     ║
║  📊  Управление слоями и стилями                              ║
║                                                               ║
║  Горячие клавиши:                                             ║
║  • Ctrl+K - Поиск                                             ║
║  • Ctrl+Shift+H - Справка                                     ║
║  • F12 - Режим разработки                                     ║
║  • Ctrl+Shift+R - Перезагрузка данных                         ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    
})();