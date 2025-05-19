/**
 * Предельно упрощенная версия игры Coin Pairing Game
 * Использует фиксированные данные вместо генерации
 */
class CoinPairingGame {
    /**
     * Создает экземпляр игры
     */
    constructor() {
        console.log("Initializing game...");
        
        // Текущий уровень игры
        this.level = 1;
        
        // Текущее задание в рамках уровня
        this.currentTask = 1;
        
        // Проверяем URL на наличие хеша для перехода на конкретный уровень
        this.checkUrlHash();
        
        // Общее количество заданий на уровне
        this.tasksPerLevel = 3;
        
        // Допустимые номиналы
        this.allowedDenominations = [1, 5, 10, 25, 50, 100];
        
        // Информация о монетах (размеры и масштаб)
        this.coinData = {
            1: { width: 253, height: 253, src: 'money_1.png' },
            5: { width: 285, height: 285, src: 'money_5.png' },
            10: { width: 229, height: 229, src: 'money_10.png' },
            25: { width: 326, height: 326, src: 'money_25.png' },
            50: { width: 405, height: 405, src: 'money_50.png' },
            100: { width: 842, height: 355, src: 'money_100.png' }
        };
        
        // Множитель масштабирования
        this.itemScale = 0.15;
        
        // Состояние соединений
        this.connections = [];
        
        // Для отслеживания текущей линии при drag-and-drop
        this.dragging = false;
        this.lineStart = null;
        this.currentLine = null;
        
        // Инициализируем игровые элементы
        this.initElements();
        
        // Адаптация к высоте экрана (iPad и мобильные устройства)
        this.adjustForMobileViewport();
        
        // Добавляем обработчик хеша URL
        window.addEventListener('hashchange', () => this.checkUrlHash());
    }
    
    /**
     * Проверяет хеш в URL и переходит на соответствующий уровень
     */
    checkUrlHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            // Пытаемся декодировать хеш
            const levelInfo = this.decodeLevelHash(hash);
            if (levelInfo) {
                this.level = levelInfo.level;
                this.currentTask = levelInfo.task || 1;
                // Если элементы уже инициализированы
                if (this.pileContainers) {
                    // Запускаем указанный уровень
                    this.startLevel(this.level, this.currentTask);
                }
            }
        }
    }
    
    /**
     * Декодирует хеш URL в информацию о уровне
     * @param {string} hash - Хеш из URL
     * @returns {Object|null} - Объект с информацией о уровне или null
     */
    decodeLevelHash(hash) {
        try {
            // Простое декодирование Base64
            const decoded = atob(hash);
            // Формат: level-task
            const parts = decoded.split('-');
            const level = parseInt(parts[0]);
            const task = parts.length > 1 ? parseInt(parts[1]) : 1;
            
            // Проверка валидности данных
            if (!isNaN(level) && level > 0 && !isNaN(task) && task > 0) {
                return { level, task };
            }
        } catch (e) {
            console.error('Error decoding hash:', e);
        }
        return null;
    }
    
    /**
     * Кодирует информацию об уровне в хеш для URL
     * @param {number} level - Номер уровня
     * @param {number} task - Номер задания
     * @returns {string} - Закодированный хеш
     */
    encodeLevelHash(level, task = 1) {
        // Формируем строку с инфо
        const levelInfo = `${level}-${task}`;
        // Кодируем в Base64
        return btoa(levelInfo);
    }
    
    /**
     * Обновляет URL с хешем для текущего уровня
     */
    updateUrlHash() {
        const hash = this.encodeLevelHash(this.level, this.currentTask);
        // Обновляем хеш URL без перезагрузки страницы
        window.location.hash = hash;
    }
    
    /**
     * Инициализирует игровые элементы и обработчики событий
     */
    initElements() {
        console.log("Initializing elements...");
        
        // Находим контейнеры для кучек
        this.pileContainers = document.querySelectorAll('.coin-pile');
        
        // Находим контейнер для соединений
        this.connectionsLayer = document.getElementById('connections-layer');
        
        // Подстраиваем размер SVG под размер контейнера
        this.adjustSVGSize();
        
        // Кнопка для показа легенды
        this.legendButton = document.getElementById('show-legend');
        this.legendPanel = document.getElementById('legend-panel');
        
        // Элементы отображения уровня и заданий
        this.levelDisplay = document.getElementById('current-level');
        this.taskDisplay = document.getElementById('current-task');
        this.totalTasksDisplay = document.getElementById('total-tasks');
        
        // Устанавливаем текущий уровень и задание в отображении
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.level;
        }
        
        if (this.taskDisplay) {
            this.taskDisplay.textContent = this.currentTask;
        }
        
        if (this.totalTasksDisplay) {
            this.totalTasksDisplay.textContent = this.tasksPerLevel;
        }
        
        // Игровые кнопки
        this.checkButton = document.getElementById('check-btn');
        this.resetButton = document.getElementById('reset-btn');
        
        // Добавляем обработчики событий
        this.addEventListeners();
        
        // Запускаем первый уровень
        this.startLevel(this.level, this.currentTask);
    }
    
    /**
     * Адаптирует размеры игры к мобильным устройствам с учетом высоты viewport
     */
    adjustForMobileViewport() {
        // Выполняем первичную настройку
        this.updateForViewportHeight();
        
        // Обновляем при изменении ориентации и размера окна
        window.addEventListener('resize', () => {
            this.updateForViewportHeight();
        });
        
        window.addEventListener('orientationchange', () => {
            // Небольшая задержка после изменения ориентации
            setTimeout(() => {
                this.updateForViewportHeight();
            }, 100);
        });
    }
    
    /**
     * Обновляет размеры игрового контейнера с учетом фактической высоты viewport
     */
    updateForViewportHeight() {
        const gameContainer = document.querySelector('.game-container');
        const gameControls = document.querySelector('.game-controls');
        const mainGameArea = document.querySelector('.main-game-area');
        
        if (!gameContainer || !gameControls || !mainGameArea) return;
        
        // Получаем фактическую высоту viewport (учитывает панель браузера)
        const viewportHeight = window.innerHeight;
        console.log(`Viewport height: ${viewportHeight}px`);
        
        // Устанавливаем высоту для контейнера игры
        gameContainer.style.height = `${viewportHeight}px`;
        
        // Обновляем размеры SVG контейнера
        this.adjustSVGSize();
        
        // Убеждаемся, что нижняя панель всегда видна
        const headerHeight = document.querySelector('.game-header')?.offsetHeight || 0;
        const controlsHeight = gameControls.offsetHeight;
        
        // Вычисляем максимальную доступную высоту для игрового поля
        const availableHeight = viewportHeight - headerHeight - controlsHeight;
        mainGameArea.style.height = `${availableHeight}px`;
        
        // Обновляем положение существующих соединений
        this.updateConnectionsPositions();
    }
    
    /**
     * Подстраивает размер SVG под размер контейнера
     */
    adjustSVGSize() {
        if (this.connectionsLayer) {
            const gameContainer = document.querySelector('.game-container');
            const mainGameArea = document.querySelector('.main-game-area');
            const gameRect = mainGameArea ? mainGameArea.getBoundingClientRect() : gameContainer.getBoundingClientRect();
            
            // Устанавливаем атрибуты width и height для SVG
            this.connectionsLayer.setAttribute('width', gameRect.width);
            this.connectionsLayer.setAttribute('height', gameRect.height);
            
            // Устанавливаем позиционирование
            this.connectionsLayer.style.position = 'absolute';
            this.connectionsLayer.style.top = '0';
            this.connectionsLayer.style.left = '0';
            this.connectionsLayer.style.pointerEvents = 'none';
            
            // Обновляем положение существующих соединений
            this.updateConnectionsPositions();
        }
    }
    
    /**
     * Обновляет позиции всех соединительных линий
     */
    updateConnectionsPositions() {
        if (!this.connections || this.connections.length === 0) {
            return;
        }
        
        const mainGameArea = document.querySelector('.main-game-area');
        const gameContainer = document.querySelector('.game-container');
        const coordinateContainer = mainGameArea || gameContainer;
        
        // Получаем прямоугольник контейнера для вычисления координат
        const containerRect = coordinateContainer.getBoundingClientRect();
        
        this.connections.forEach(connection => {
            const startPile = document.getElementById(connection.start);
            const endPile = document.getElementById(connection.end);
            
            if (startPile && endPile && connection.line) {
                const startRect = startPile.getBoundingClientRect();
                const endRect = endPile.getBoundingClientRect();
                
                const startX = startRect.left + startRect.width / 2 - containerRect.left;
                const startY = startRect.top + startRect.height / 2 - containerRect.top;
                const endX = endRect.left + endRect.width / 2 - containerRect.left;
                const endY = endRect.top + endRect.height / 2 - containerRect.top;
                
                connection.line.setAttribute('x1', startX);
                connection.line.setAttribute('y1', startY);
                connection.line.setAttribute('x2', endX);
                connection.line.setAttribute('y2', endY);
            }
        });
    }
    
    /**
     * Добавляет обработчики событий для игровых элементов
     */
    addEventListeners() {
        console.log("Adding event listeners...");
        
        // Обработчик для кнопки легенды
        if (this.legendButton) {
            this.legendButton.addEventListener('click', () => {
                this.legendPanel.classList.toggle('visible');
            });
        }
        
        // Обработчик для кнопки закрытия легенды
        const closeButton = document.getElementById('close-legend');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.legendPanel.classList.remove('visible');
            });
        }
        
        // Обработчик для кнопки копирования ссылки
        const shareButton = document.getElementById('share-link');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.shareCurrentLevelLink();
            });
        }
        
        // Обработчик для кнопки проверки ответов
        if (this.checkButton) {
            // Добавляем обработчик клика
            this.checkButton.addEventListener('click', (e) => {
                // Проверяем, не отключена ли кнопка
                if (this.checkButton.getAttribute('aria-disabled') === 'true') {
                    return;
                }
                this.checkAnswers();
            });
            
            // Добавляем обработчик нажатия клавиши Enter или Space для доступности
            this.checkButton.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && 
                    this.checkButton.getAttribute('aria-disabled') !== 'true') {
                    e.preventDefault();
                    this.checkAnswers();
                }
            });
            
            // Кнопка проверки изначально неактивна
            this.setCheckButtonDisabled(true);
        }
        
        // Обработчик для кнопки сброса
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetConnections();
                // Деактивируем кнопку проверки после сброса
                this.setCheckButtonDisabled(true);
            });
        }
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.adjustSVGSize();
        });
        
        // Добавляем обработчики событий drag-and-drop для кучек
        this.setupDragAndDrop();
    }
    
    /**
     * Включает или отключает кнопку проверки
     * @param {boolean} disabled - true для отключения, false для включения
     */
    setCheckButtonDisabled(disabled) {
        if (!this.checkButton) return;
        
        if (disabled) {
            this.checkButton.setAttribute('aria-disabled', 'true');
            this.checkButton.classList.remove('pulse-animation');
        } else {
            this.checkButton.setAttribute('aria-disabled', 'false');
            this.checkButton.classList.add('pulse-animation');
        }
    }
    
    /**
     * Настраивает функциональность drag-and-drop для соединения кучек
     */
    setupDragAndDrop() {
        console.log("Setting up drag and drop...");
        
        // Проверяем, существует ли SVG контейнер
        if (!this.connectionsLayer) {
            console.error("SVG container not found!");
            return;
        }
        
        // Находим контейнер игры для корректировки координат
        const gameContainer = document.querySelector('.game-container');
        const mainGameArea = document.querySelector('.main-game-area');
        
        // Определяем контейнер для вычисления координат - используем main-game-area вместо game-container
        const coordinateContainer = mainGameArea || gameContainer;
        
        // Добавляем обработчики для каждой кучки
        this.pileContainers.forEach(pile => {
            // Стилизуем курсор для индикации возможности перетаскивания
            pile.style.cursor = 'pointer';
            
            // Начало перетаскивания - используем mousedown и функцию общей обработки
            pile.addEventListener('mousedown', (e) => {
                this.handleDragStart(e, pile, 'mouse');
            });
            
            // Начало касания - используем touchstart и функцию общей обработки
            pile.addEventListener('touchstart', (e) => {
                // Предотвращаем preventDefault, чтобы не блокировать прокрутку для всей страницы
                // Вместо этого применяем его только при активном перетаскивании
                this.handleDragStart(e, pile, 'touch');
            }, { passive: true });
        });
        
        // Обработчик для движения мыши
        document.addEventListener('mousemove', (e) => {
            if (this.dragging && this.currentLine) {
                e.preventDefault();
                this.handleDragMove(e, 'mouse');
            }
        });
        
        // Обработчик для сенсорного перемещения - используем passive: false, чтобы иметь возможность вызвать preventDefault
        document.addEventListener('touchmove', (e) => {
            if (this.dragging && this.currentLine) {
                // Предотвращаем прокрутку ТОЛЬКО когда активно перетаскивание
                e.preventDefault();
                this.handleDragMove(e, 'touch');
            }
        }, { passive: false });
        
        // Обработчик для окончания перетаскивания мышью
        document.addEventListener('mouseup', (e) => {
            if (this.dragging) {
                this.handleDragEnd(e, 'mouse');
            }
        });
        
        // Обработчик для окончания касания
        document.addEventListener('touchend', (e) => {
            if (this.dragging) {
                this.handleDragEnd(e, 'touch');
            }
        });
        
        // Обработчик для отмены перетаскивания при выходе за пределы окна
        document.addEventListener('mouseleave', () => {
            if (this.dragging && this.currentLine && this.currentLine.parentNode) {
                this.currentLine.parentNode.removeChild(this.currentLine);
                this.dragging = false;
                this.lineStart = null;
                this.currentLine = null;
            }
        });
    }
    
    /**
     * Обрабатывает начало перетаскивания (общая функция для mouse и touch)
     * @param {Event} e - Событие
     * @param {HTMLElement} pile - Элемент кучки
     * @param {string} eventType - Тип события ('mouse' или 'touch')
     */
    handleDragStart(e, pile, eventType) {
        console.log(`${eventType === 'mouse' ? 'Mousedown' : 'Touchstart'} on pile:`, pile.id);
        
        // При начале перетаскивания, отменяем предотвращение по умолчанию
        // чтобы не блокировать другие действия, пока нет активного drag
        if (eventType === 'mouse') {
            e.preventDefault();
        }
        
        // Удаляем все существующие соединения с этой кучкой
        this.removeConnectionsForPile(pile);
        
        // Находим контейнер для вычисления координат
        const mainGameArea = document.querySelector('.main-game-area');
        const gameContainer = document.querySelector('.game-container');
        const coordinateContainer = mainGameArea || gameContainer;
        
        // Обновляем размеры контейнера для корректных координат
        const containerRect = coordinateContainer.getBoundingClientRect();
        
        // Начинаем рисовать линию
        this.dragging = true;
        this.lineStart = pile;
        
        // Получаем координаты центра кучки относительно контейнера координат
        const rect = pile.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - containerRect.left;
        const centerY = rect.top + rect.height / 2 - containerRect.top;
        
        // Создаем новую линию
        this.currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.currentLine.setAttribute('x1', centerX);
        this.currentLine.setAttribute('y1', centerY);
        this.currentLine.setAttribute('x2', centerX);
        this.currentLine.setAttribute('y2', centerY);
        this.currentLine.setAttribute('stroke', '#2196F3'); // Синий цвет для всех соединений
        this.currentLine.setAttribute('stroke-width', '4');
        this.currentLine.setAttribute('data-start-pile', pile.id);
        
        // Добавляем линию в SVG контейнер
        this.connectionsLayer.appendChild(this.currentLine);
    }
    
    /**
     * Обрабатывает движение при перетаскивании (общая функция для mouse и touch)
     * @param {Event} e - Событие
     * @param {string} eventType - Тип события ('mouse' или 'touch')
     */
    handleDragMove(e, eventType) {
        // Находим контейнер для вычисления координат
        const mainGameArea = document.querySelector('.main-game-area');
        const gameContainer = document.querySelector('.game-container');
        const coordinateContainer = mainGameArea || gameContainer;
        
        // Обновляем размеры контейнера для корректных координат
        const containerRect = coordinateContainer.getBoundingClientRect();
        
        // Получаем координаты курсора или касания
        let moveX, moveY;
        
        if (eventType === 'mouse') {
            moveX = e.clientX - containerRect.left;
            moveY = e.clientY - containerRect.top;
        } else { // touch
            const touch = e.touches[0];
            moveX = touch.clientX - containerRect.left;
            moveY = touch.clientY - containerRect.top;
        }
        
        // Обновляем конечную точку линии
        this.currentLine.setAttribute('x2', moveX);
        this.currentLine.setAttribute('y2', moveY);
    }
    
    /**
     * Обрабатывает окончание перетаскивания (общая функция для mouse и touch)
     * @param {Event} e - Событие
     * @param {string} eventType - Тип события ('mouse' или 'touch')
     */
    handleDragEnd(e, eventType) {
        if (!this.currentLine) {
            this.dragging = false;
            this.lineStart = null;
            return;
        }
        
        console.log(`${eventType === 'mouse' ? 'Mouse up' : 'Touch end'} - checking for connection`);
        
        // Находим контейнер для вычисления координат
        const mainGameArea = document.querySelector('.main-game-area');
        const gameContainer = document.querySelector('.game-container');
        const coordinateContainer = mainGameArea || gameContainer;
        
        // Обновляем размеры контейнера для корректных координат
        const containerRect = coordinateContainer.getBoundingClientRect();
        
        // Получаем координаты курсора или касания
        let endX, endY;
        
        if (eventType === 'mouse') {
            endX = e.clientX;
            endY = e.clientY;
        } else { // touch
            const touch = e.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;
        }
        
        // Проверяем, находится ли курсор над какой-либо кучкой
        let connectionMade = false;
        
        this.pileContainers.forEach(pile => {
            if (connectionMade) return; // Если соединение уже создано, прекращаем цикл
            
            const rect = pile.getBoundingClientRect();
            
            // Если курсор над кучкой и это не та же самая кучка, откуда началось перетаскивание
            if (pile !== this.lineStart &&
                endX >= rect.left && 
                endX <= rect.right && 
                endY >= rect.top && 
                endY <= rect.bottom) {
                
                // Обрабатываем успешное соединение
                console.log(`Connected ${this.lineStart.id} to ${pile.id}`);
                
                // Подстраиваем линию к центрам кучек
                const startRect = this.lineStart.getBoundingClientRect();
                const endRect = pile.getBoundingClientRect();
                
                const startX = startRect.left + startRect.width / 2 - containerRect.left;
                const startY = startRect.top + startRect.height / 2 - containerRect.top;
                const endX = endRect.left + endRect.width / 2 - containerRect.left;
                const endY = endRect.top + endRect.height / 2 - containerRect.top;
                
                this.currentLine.setAttribute('x1', startX);
                this.currentLine.setAttribute('y1', startY);
                this.currentLine.setAttribute('x2', endX);
                this.currentLine.setAttribute('y2', endY);
                
                // Используем новый метод для создания соединения
                this.createConnection(this.lineStart, pile, this.currentLine);
                
                // Помечаем, что соединение создано
                connectionMade = true;
            }
        });
        
        // Если соединение не было создано, удаляем текущую линию
        if (!connectionMade && this.currentLine && this.currentLine.parentNode) {
            this.currentLine.parentNode.removeChild(this.currentLine);
        }
        
        // Сбрасываем состояние перетаскивания
        this.dragging = false;
        this.lineStart = null;
        this.currentLine = null;
    }
    
    /**
     * Проверяет, все ли кучки соединены
     * @returns {boolean} - true, если все кучки соединены в пары
     */
    checkIfAllPilesConnected() {
        // Получаем количество уникальных кучек в соединениях
        const connectedPiles = new Set();
        for (const connection of this.connections) {
            connectedPiles.add(connection.start);
            connectedPiles.add(connection.end);
        }
        
        // Проверяем, что каждая кучка соединена только с одной другой
        const pileConnectionCount = {};
        for (const connection of this.connections) {
            pileConnectionCount[connection.start] = (pileConnectionCount[connection.start] || 0) + 1;
            pileConnectionCount[connection.end] = (pileConnectionCount[connection.end] || 0) + 1;
        }
        
        // Проверяем, что каждая кучка соединена ровно с одной другой
        const allProperlyCoupled = Object.values(pileConnectionCount).every(count => count === 1);
        
        // Если все 6 кучек соединены в пары (по одной связи на кучку)
        const allConnected = connectedPiles.size === 6 && allProperlyCoupled;
        
        // Обновляем состояние кнопки проверки
        if (this.checkButton) {
            this.setCheckButtonDisabled(!allConnected);
        }
        
        return allConnected;
    }
    
    /**
     * Запускает указанный уровень
     * @param {number} level - Номер уровня
     * @param {number} task - Номер задания в рамках уровня
     */
    startLevel(level, task = 1) {
        console.log(`Starting level ${level}, task ${task}...`);
        
        // Обновляем текущий уровень и задание
        this.level = level;
        this.currentTask = task;
        
        // Обновляем отображение уровня и задания
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.level;
        }
        
        if (this.taskDisplay) {
            this.taskDisplay.textContent = this.currentTask;
        }
        
        // Сбрасываем все соединения
        this.resetConnections();
        
        // Генерируем данные для текущего уровня и задания
        const levelData = this.generateLevelData(level, task);
        
        // Отображаем кучки
        this.renderPiles(levelData);
        
        // Обновляем хеш URL
        this.updateUrlHash();
    }
    
    /**
     * Генерирует данные для указанного уровня и задания
     * @param {number} level - Номер уровня
     * @param {number} task - Номер задания в рамках уровня
     * @returns {Object} Данные для уровня
     */
    generateLevelData(level, task = 1) {
        console.log(`Generating data for level ${level}, task ${task}...`);
        
        // Формулы зависимости от уровня
        // 1. Базовая сумма: увеличивается с уровнем (по формуле 25 * уровень)
        const baseAmount = 25 * level;
        
        // 2. Минимальное количество монет: увеличивается с уровнем (по формуле 3 + уровень * 2)
        const minCoins = 3 + level * 2;
        
        console.log(`Level ${level}, task ${task}: base amount ${baseAmount}, min coins ${minCoins}`);
        
        // Генерируем 3 разные суммы для 3 пар кучек
        const pairAmounts = [];
        
        // Первая пара (базовая сумма или модифицированная в зависимости от задания)
        let firstPairAmount;
        switch (task) {
            case 1:
                firstPairAmount = baseAmount;
                break;
            case 2:
                firstPairAmount = Math.floor(baseAmount * 1.4);
                break;
            case 3:
                firstPairAmount = Math.max(10, Math.floor(baseAmount * 0.6));
                break;
            default:
                firstPairAmount = baseAmount;
        }
        pairAmounts.push(firstPairAmount);
        
        // Вторая пара (базовая сумма +/- случайное значение 10-30%)
        let secondPairAmount;
        do {
            const diff = Math.random() > 0.5 ? 1 : -1;
            const percentage = 10 + Math.floor(Math.random() * 20); // 10-30%
            secondPairAmount = Math.max(10, Math.floor(baseAmount * (1.0 + diff * percentage / 100.0)));
        } while (secondPairAmount === firstPairAmount); // Убедимся, что суммы разные
        pairAmounts.push(secondPairAmount);
        
        // Третья пара (отличается от первых двух)
        let thirdPairAmount;
        do {
            const diff = Math.random() > 0.5 ? 1 : -1;
            const percentage = 15 + Math.floor(Math.random() * 25); // 15-40%
            thirdPairAmount = Math.max(10, Math.floor(baseAmount * (1.0 + diff * percentage / 100.0)));
        } while (thirdPairAmount === firstPairAmount || thirdPairAmount === secondPairAmount); // Убедимся, что сумма отличается от предыдущих
        pairAmounts.push(thirdPairAmount);
        
        console.log(`Generated pair amounts: ${pairAmounts.join(', ')}`);
        
        // Создаем 3 пары куч с соответствующими суммами
        const pairs = [];
        
        // Для каждой суммы создаем пару куч с разным составом монет, но одинаковой суммой
        for (let i = 0; i < 3; i++) {
            const pairAmount = pairAmounts[i];
            
            // Генерируем первый набор монет
            const firstPile = this.CashItemsSet(pairAmount, minCoins);
            
            // Генерируем второй набор и проверяем, что он достаточно отличается от первого
            let secondPile;
            let similarityAttempts = 0;
            const maxAttempts = 3; // Максимальное количество попыток перегенерации
            
            do {
                secondPile = this.CashItemsSet(pairAmount, minCoins);
                similarityAttempts++;
                
                // Если уже сделали максимальное число попыток, выходим, чтобы избежать зацикливания
                if (similarityAttempts >= maxAttempts) {
                    console.log(`Reached max similarity check attempts for pair ${i+1}`);
                    break;
                }
                
            } while (this.arePilesSimilar(firstPile, secondPile) && similarityAttempts < maxAttempts);
            
            pairs.push({
                pairIndex: i,
                amount: pairAmount,
                piles: [firstPile, secondPile]
            });
        }
        
        return { pairs: pairs };
    }
    
    /**
     * Проверяет, насколько похожи два набора монет
     * @param {Array} pile1 - Первый набор монет
     * @param {Array} pile2 - Второй набор монет
     * @returns {boolean} - true, если наборы слишком похожи
     */
    arePilesSimilar(pile1, pile2) {
        // Создаем копии массивов и сортируем их для сравнения
        const sortedPile1 = [...pile1].sort((a, b) => b - a);
        const sortedPile2 = [...pile2].sort((a, b) => b - a);
        
        // Если длины существенно различаются, считаем наборы разными
        if (Math.abs(pile1.length - pile2.length) > 2) {
            return false;
        }
        
        // Считаем, сколько одинаковых монет в обоих наборах
        let matchCount = 0;
        let commonSize = Math.min(sortedPile1.length, sortedPile2.length);
        
        // Сравниваем первые 5 монет (или меньше, если наборы меньше)
        const comparisonSize = Math.min(commonSize, 5);
        for (let i = 0; i < comparisonSize; i++) {
            if (sortedPile1[i] === sortedPile2[i]) {
                matchCount++;
            }
        }
        
        // Если более 70% сравниваемых монет совпадают, считаем наборы слишком похожими
        const similarityThreshold = Math.ceil(comparisonSize * 0.7);
        const tooSimilar = matchCount >= similarityThreshold;
        
        if (tooSimilar) {
            console.log("Generated piles are too similar, regenerating...");
        }
        
        return tooSimilar;
    }
    
    /**
     * Генерирует массив монет для кучки с заданной суммой и минимальным количеством
     * @param {number} moneyAmount - Общая сумма в центах
     * @param {number} minItemsNumber - Минимальное количество монет/купюр
     * @returns {Array} - Массив номиналов монет
     */
    CashItemsSet(moneyAmount, minItemsNumber) {
        console.log(`Generating cash items for amount ${moneyAmount}, min items ${minItemsNumber}`);
        
        // Допустимые номиналы монет (от большего к меньшему)
        const denominations = [100, 50, 25, 10, 5, 1];
        
        // Массив для хранения монет
        const coinValues = [];
        let remainingAmount = moneyAmount;
        
        // Шаг 1-3: Берём сумму, выбираем случайную монету и добавляем в массив
        // Находим все допустимые номиналы (не превышающие сумму)
        const validDenoms = denominations.filter(d => d <= remainingAmount);
        if (validDenoms.length > 0) {
            // Случайно выбираем один из номиналов
            const randomIndex = Math.floor(Math.random() * validDenoms.length);
            const randomDenom = validDenoms[randomIndex];
            
            // Добавляем в массив и вычитаем из оставшейся суммы
            coinValues.push(randomDenom);
            remainingAmount -= randomDenom;
        }
        
        // Шаг 4: Пока сумма не равна 0, заполняем массив делением с остатком
        while (remainingAmount > 0) {
            // Перебираем все номиналы от большего к меньшему
            let added = false;
            for (const denom of denominations) {
                if (denom <= remainingAmount) {
                    // Определяем, сколько монет данного номинала помещается в оставшуюся сумму
                    const count = Math.floor(remainingAmount / denom);
                    
                    // Добавляем все эти монеты в массив
                    for (let i = 0; i < count; i++) {
                        coinValues.push(denom);
                    }
                    
                    // Вычитаем из оставшейся суммы
                    remainingAmount -= (count * denom);
                    added = true;
                    break;
                }
            }
            
            // Если ничего не добавили (что странно), добавляем монету наименьшего номинала
            if (!added && remainingAmount > 0) {
                coinValues.push(1);
                remainingAmount -= 1;
            }
        }
        
        // Шаг 5: Проверяем, достаточно ли монет/купюр
        while (coinValues.length < minItemsNumber) {
            // Находим все монеты с номиналом > 1
            const largeCoins = coinValues.filter(c => c > 1);
            
            if (largeCoins.length === 0) {
                // Больше нечего дробить, добавляем монеты по 1 центу
                coinValues.push(1);
                continue;
            }
            
            // Случайно выбираем одну из крупных монет
            const randomIndex = Math.floor(Math.random() * largeCoins.length);
            const coinToSplit = largeCoins[randomIndex];
            
            // Находим и удаляем эту монету из массива
            const coinIndex = coinValues.indexOf(coinToSplit);
            coinValues.splice(coinIndex, 1);
            
            // Разбиваем эту монету на более мелкие, используя тот же алгоритм деления с остатком
            let tempAmount = coinToSplit;
            for (const denom of denominations) {
                // Пропускаем номиналы, которые больше или равны разбиваемой монете
                if (denom >= coinToSplit) continue;
                
                if (denom <= tempAmount) {
                    // Определяем, сколько монет данного номинала помещается
                    const count = Math.floor(tempAmount / denom);
                    
                    // Добавляем все эти монеты в массив
                    for (let i = 0; i < count; i++) {
                        coinValues.push(denom);
                    }
                    
                    // Вычитаем из временной суммы
                    tempAmount -= (count * denom);
                }
            }
            
            // Если остался остаток, добавляем монеты по 1 центу
            while (tempAmount > 0) {
                coinValues.push(1);
                tempAmount -= 1;
            }
        }
        
        // Перемешиваем монеты в случайном порядке
        for (let i = coinValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coinValues[i], coinValues[j]] = [coinValues[j], coinValues[i]];
        }
        
        // Финальная проверка, что сумма совпадает
        const actualSum = coinValues.reduce((sum, val) => sum + val, 0);
        if (actualSum !== moneyAmount) {
            console.error(`Error in CashItemsSet! Expected: ${moneyAmount}, got: ${actualSum}`);
        }
        
        return coinValues;
    }
    
    /**
     * Отображает кучки на экране
     * @param {Object} levelData - Данные для уровня и задания
     */
    renderPiles(levelData) {
        console.log("Rendering piles...");
        
        // Массив для всех кучек
        const allPiles = [];
        
        // Создаем все кучи из пар
        for (let i = 0; i < levelData.pairs.length; i++) {
            const pair = levelData.pairs[i];
            
            // Первая куча в паре
            allPiles.push({
                id: `pile-${allPiles.length + 1}`,
                amount: pair.amount,
                composition: pair.piles[0],
                pairIndex: pair.pairIndex
            });
            
            // Вторая куча в паре
            allPiles.push({
                id: `pile-${allPiles.length + 1}`,
                amount: pair.amount,
                composition: pair.piles[1],
                pairIndex: pair.pairIndex
            });
        }
        
        // Перемешиваем кучки для случайного расположения
        for (let i = allPiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPiles[i], allPiles[j]] = [allPiles[j], allPiles[i]];
        }
        
        // Сохраняем информацию о кучках
        this.piles = allPiles;
        
        // Рендерим каждую кучку
        for (let i = 0; i < Math.min(allPiles.length, this.pileContainers.length); i++) {
            const pile = allPiles[i];
            const container = this.pileContainers[i].querySelector('.pile-content');
            
            if (container) {
                // Очищаем контейнер
                container.innerHTML = '';
                
                // Создаем флекс-контейнер для монет
                const coinsElement = document.createElement('div');
                coinsElement.className = 'coins-grid';
                coinsElement.style.display = 'flex';
                coinsElement.style.flexFlow = 'row wrap';
                coinsElement.style.justifyContent = 'space-around';
                coinsElement.style.alignItems = 'center';
                coinsElement.style.width = '100%';
                coinsElement.style.gap = '8px';
                coinsElement.style.padding = '12px';
                
                // Отображаем монеты из композиции
                this.renderCoins(coinsElement, pile.composition);
                
                // Добавляем элементы в контейнер
                container.appendChild(coinsElement);
                
                // Сохраняем данные в атрибуте
                this.pileContainers[i].dataset.pileId = this.pileContainers[i].id;
                this.pileContainers[i].dataset.amount = pile.amount;
                this.pileContainers[i].dataset.pairIndex = pile.pairIndex;
            }
        }
        
        console.log("Piles rendered successfully");
    }
    
    /**
     * Отображает монеты с использованием изображений в контейнере
     * @param {HTMLElement} container - Контейнер для монет
     * @param {Array} coinValues - Массив с номиналами монет
     */
    renderCoins(container, coinValues) {
        console.log(`Rendering ${coinValues.length} coins`);
        
        // Создаем элементы монет и размещаем их в контейнере
        for (const coinValue of coinValues) {
            // Проверяем, есть ли такой номинал в нашем справочнике
            const validDenomination = this.allowedDenominations.includes(coinValue) ? 
                coinValue : this.allowedDenominations[0]; // По умолчанию 1 цент
            
            // Получаем данные о размерах монеты
            const coinInfo = this.coinData[validDenomination];
            
            // Создаем элемент для монеты
            const coinElement = document.createElement('div');
            coinElement.className = `coin coin-${validDenomination}`;
            
            // Устанавливаем стили для флекс-элемента
            coinElement.style.flex = '0 0 auto';
            coinElement.style.alignSelf = 'center';
            
            // Рассчитываем размеры с учетом масштаба
            const scaledWidth = coinInfo.width * this.itemScale;
            const scaledHeight = coinInfo.height * this.itemScale;
            
            // Применяем размеры
            coinElement.style.width = `${scaledWidth}px`;
            coinElement.style.height = `${scaledHeight}px`;
            
            // Добавляем фон и рамку в зависимости от номинала
            if (validDenomination === 100) { // $1
                // Не устанавливаем borderRadius - он будет из CSS
                // Не добавляем border для доллара
            } else {
                coinElement.style.backgroundColor = this.getCoinColor(validDenomination);
                // Не устанавливаем borderRadius - он будет из CSS
                coinElement.style.border = '1px solid #888';
            }
            
            // Общие стили для всех монет и купюр (без border для доллара)
            coinElement.style.display = 'flex';
            coinElement.style.justifyContent = 'center';
            coinElement.style.alignItems = 'center';
            coinElement.style.margin = '3px';
            
            // Добавляем изображения монет (занимают примерно 20% площади)
            if (coinInfo.src) {
                const imageElement = document.createElement('img');
                imageElement.src = coinInfo.src;
                
                // Разные размеры для доллара и монет
                if (validDenomination === 100) {
                    imageElement.style.width = '100%';
                    imageElement.style.height = '100%';
                    imageElement.style.objectFit = 'contain';
                    // Убрать фон для доллара полностью
                    coinElement.style.backgroundColor = 'transparent';
                } else {
                    // Для монет - фиксированный размер изображения
                    imageElement.style.width = '100%';
                    imageElement.style.height = '100%';
                    imageElement.style.objectFit = 'contain';
                    // Сохраняем фон, но убираем возможное задвоение изображений
                    coinElement.style.backgroundImage = 'none';
                }
                
                coinElement.appendChild(imageElement);
            } else {
                // Если изображения нет, добавляем текстовую метку
                const label = document.createElement('span');
                label.style.fontSize = `${Math.max(6, scaledWidth / 4)}px`;
                label.style.color = this.getCoinTextColor(validDenomination);
                label.style.fontWeight = 'bold';
                
                if (validDenomination === 100) {
                    label.textContent = '$1';
                } else {
                    label.textContent = `${validDenomination}¢`;
                }
                
                coinElement.appendChild(label);
            }
            
            // Добавляем монету в контейнер
            container.appendChild(coinElement);
        }
    }
    
    /**
     * Возвращает цвет монеты в зависимости от номинала
     * @param {number} value - Номинал монеты в центах
     * @returns {string} - CSS цвет
     */
    getCoinColor(value) {
        switch (value) {
            case 1: return '#B87333';  // Медный (1 цент)
            case 5: return '#A9A9A9';  // Серебристый (5 центов)
            case 10: return '#A9A9A9'; // Серебристый (10 центов)
            case 25: return '#C0C0C0'; // Серебристый (25 центов)
            case 50: return '#C0C0C0'; // Серебристый (50 центов)
            case 100: return '#FFD700'; // Золотистый (1 доллар)
            default: return '#C0C0C0';
        }
    }
    
    /**
     * Возвращает цвет текста на монете в зависимости от номинала
     * @param {number} value - Номинал монеты в центах
     * @returns {string} - CSS цвет
     */
    getCoinTextColor(value) {
        switch (value) {
            case 1: return '#FFFFFF';  // Белый текст на медной монете
            default: return '#000000'; // Черный текст для остальных
        }
    }
    
    /**
     * Сбрасывает все соединения между кучками
     */
    resetConnections() {
        console.log("Resetting connections...");
        
        // Очищаем массив соединений
        this.connections = [];
        
        // Удаляем класс connected со всех кучек
        this.pileContainers.forEach(pile => {
            pile.classList.remove('connected');
        });
        
        // Очищаем визуальное отображение соединений
        if (this.connectionsLayer) {
            // Сохраняем атрибуты SVG
            const width = this.connectionsLayer.getAttribute('width');
            const height = this.connectionsLayer.getAttribute('height');
            const style = this.connectionsLayer.getAttribute('style');
            
            // Очищаем SVG от всех линий
            this.connectionsLayer.innerHTML = '';
            
            // Восстанавливаем атрибуты
            if (width) this.connectionsLayer.setAttribute('width', width);
            if (height) this.connectionsLayer.setAttribute('height', height);
            if (style) this.connectionsLayer.setAttribute('style', style);
        }
    }
    
    /**
     * Проверяет ответы игрока
     */
    checkAnswers() {
        // Проверяем все соединения
        let allCorrect = true;
        let correctCount = 0;
        
        if (this.connections.length === 0) {
            alert("Нет соединений для проверки.");
            return;
        }
        
        // Убираем анимацию с кнопки проверки
        if (this.checkButton) {
            this.checkButton.classList.remove('pulse-animation');
            this.checkButton.disabled = true;
        }
        
        // Перебираем все соединения и проверяем их
        for (const connection of this.connections) {
            const startPile = document.getElementById(connection.start);
            const endPile = document.getElementById(connection.end);
            
            if (startPile && endPile) {
                // Проверяем, что соединены кучи из одной пары (по pairIndex)
                if (startPile.dataset.pairIndex === endPile.dataset.pairIndex) {
                    // Правильное соединение - меняем цвет на зеленый
                    connection.line.setAttribute('stroke', '#4CAF50');
                    connection.line.setAttribute('stroke-width', '5');
                    correctCount++;
                } else {
                    // Неправильное соединение - меняем цвет на красный
                    connection.line.setAttribute('stroke', '#F44336');
                    connection.line.setAttribute('stroke-width', '3');
                    allCorrect = false;
                }
            }
        }
        
        // Показываем временное уведомление и автоматически переходим к следующему шагу
        if (allCorrect) {
            // Создаем временное уведомление о выполнении текущего задания
            this.showTemporaryMessage(`Отлично! Задание ${this.currentTask} выполнено!`, 'success');
            
            // Удаляем класс connected со всех кучек
            this.pileContainers.forEach(pile => {
                pile.classList.remove('connected');
            });
            
            // Переходим к следующему заданию или уровню
            setTimeout(() => {
                this.progressToNextTask();
            }, 1500);
        } else {
            // Показываем сообщение об ошибке
            this.showTemporaryMessage(`Правильных пар: ${correctCount} из ${this.connections.length}. Начните уровень заново.`, 'error');
            
            // Удаляем класс connected со всех кучек
            this.pileContainers.forEach(pile => {
                pile.classList.remove('connected');
            });
            
            // Ждем немного и возвращаем пользователя к ПЕРВОМУ заданию текущего уровня
            setTimeout(() => {
                this.currentTask = 1; // Сбрасываем до первого задания
                this.startLevel(this.level, 1);
            }, 1500);
        }
    }
    
    /**
     * Переходит к следующему заданию или уровню
     */
    progressToNextTask() {
        // Проверяем, есть ли ещё задания на текущем уровне
        if (this.currentTask < this.tasksPerLevel) {
            // Переходим к следующему заданию текущего уровня
            this.startLevel(this.level, this.currentTask + 1);
        } else {
            // Переходим к первому заданию следующего уровня
            this.startLevel(this.level + 1, 1);
        }
    }
    
    /**
     * Показывает временное сообщение без необходимости подтверждения
     * @param {string} message - текст сообщения
     * @param {string} type - тип сообщения ('success', 'error')
     * @param {number} duration - продолжительность отображения в мс (по умолчанию 1500)
     */
    showTemporaryMessage(message, type = 'success', duration = 1500) {
        // Проверяем, существует ли уже окно сообщения
        let messageBox = document.getElementById('game-message');
        
        if (!messageBox) {
            // Создаем новое окно сообщения
            messageBox = document.createElement('div');
            messageBox.id = 'game-message';
            messageBox.style.position = 'fixed';
            messageBox.style.top = '50%';
            messageBox.style.left = '50%';
            messageBox.style.transform = 'translate(-50%, -50%)';
            messageBox.style.padding = '15px 25px';
            messageBox.style.borderRadius = '8px';
            messageBox.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            messageBox.style.zIndex = '1000';
            messageBox.style.fontWeight = 'bold';
            messageBox.style.textAlign = 'center';
            messageBox.style.minWidth = '250px';
            messageBox.style.opacity = '0';
            messageBox.style.transition = 'opacity 0.3s ease';
            
            document.body.appendChild(messageBox);
        }
        
        // Устанавливаем цвет в зависимости от типа сообщения
        if (type === 'success') {
            messageBox.style.backgroundColor = '#4CAF50';
            messageBox.style.color = '#fff';
        } else if (type === 'error') {
            messageBox.style.backgroundColor = '#F44336';
            messageBox.style.color = '#fff';
        }
        
        // Устанавливаем текст сообщения
        messageBox.textContent = message;
        
        // Показываем сообщение с анимацией
        setTimeout(() => {
            messageBox.style.opacity = '1';
        }, 10);
        
        // Скрываем сообщение после указанной продолжительности
        setTimeout(() => {
            messageBox.style.opacity = '0';
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Форматирует сумму для отображения
     * @param {number} amount - Сумма в центах
     * @returns {string} - Форматированная сумма
     */
    formatAmount(amount) {
        const dollars = Math.floor(amount / 100);
        const cents = amount % 100;
        
        if (dollars > 0) {
            return `$${dollars}.${cents.toString().padStart(2, '0')}`;
        } else {
            return `${cents}¢`;
        }
    }
    
    /**
     * Создает новое соединение между кучками и удаляет существующие соединения для этих кучек
     * @param {HTMLElement} startPile - Начальная кучка
     * @param {HTMLElement} endPile - Конечная кучка
     * @param {SVGLineElement} line - Линия соединения
     */
    createConnection(startPile, endPile, line) {
        // Удаляем существующие соединения для этих кучек
        this.connections = this.connections.filter(conn => {
            if (conn.start === startPile.id || conn.end === startPile.id ||
                conn.start === endPile.id || conn.end === endPile.id) {
                
                // Удаляем класс connected с кучек, которые были ранее соединены
                const pileA = document.getElementById(conn.start);
                const pileB = document.getElementById(conn.end);
                if (pileA) pileA.classList.remove('connected');
                if (pileB) pileB.classList.remove('connected');
                
                // Удаляем линию из SVG
                if (conn.line && conn.line.parentNode) {
                    conn.line.parentNode.removeChild(conn.line);
                }
                
                return false;
            }
            return true;
        });
        
        // Добавляем новое соединение
        this.connections.push({
            start: startPile.id,
            end: endPile.id,
            line: line
        });
        
        // Добавляем класс connected для визуального выделения
        startPile.classList.add('connected');
        endPile.classList.add('connected');
        
        // Проверяем, все ли кучки соединены
        this.checkIfAllPilesConnected();
    }
    
    /**
     * Удаляет все соединения, связанные с указанной кучкой
     * @param {HTMLElement} pile - Кучка, соединения с которой нужно удалить
     */
    removeConnectionsForPile(pile) {
        // Фильтруем массив соединений, удаляя те, которые связаны с указанной кучкой
        this.connections = this.connections.filter(conn => {
            if (conn.start === pile.id || conn.end === pile.id) {
                // Удаляем класс connected с обеих кучек в соединении
                const pileA = document.getElementById(conn.start);
                const pileB = document.getElementById(conn.end);
                if (pileA) pileA.classList.remove('connected');
                if (pileB) pileB.classList.remove('connected');
                
                // Удаляем линию из SVG
                if (conn.line && conn.line.parentNode) {
                    conn.line.parentNode.removeChild(conn.line);
                }
                
                return false;
            }
            return true;
        });
        
        // Проверяем, все ли кучки соединены после удаления
        this.checkIfAllPilesConnected();
    }
    
    /**
     * Копирует в буфер обмена ссылку на текущий уровень
     */
    shareCurrentLevelLink() {
        const url = new URL(window.location.href);
        url.hash = this.encodeLevelHash(this.level, this.currentTask);
        
        // Копируем ссылку в буфер обмена
        navigator.clipboard.writeText(url.href)
            .then(() => {
                // Показываем уведомление об успешном копировании
                const toast = document.getElementById('share-toast');
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Не удалось скопировать ссылку: ', err);
                // Показываем уведомление об ошибке
                this.showTemporaryMessage('Failed to copy link', 'error');
            });
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game");
    
    // Создаем экземпляр игры
    const game = new CoinPairingGame();
    
    // Сохраняем ссылку на игру в глобальной области видимости для отладки
    window.coinGame = game;
}); 