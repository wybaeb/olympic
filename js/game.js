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
        
        // Общее количество заданий на уровне
        this.tasksPerLevel = 3;
        
        // Базовые пары кучек (будут масштабироваться в зависимости от уровня)
        this.basePairs = [
            // Уровень 1: Простые пары с небольшими суммами
            { relativeAmount: 25, basePair: ["25¢", "5¢ + 10¢ + 10¢"] },
            { relativeAmount: 50, basePair: ["50¢", "25¢ + 25¢"] },
            { relativeAmount: 75, basePair: ["25¢ + 50¢", "25¢ + 25¢ + 25¢"] },
            
            // Уровень 2: Средние пары с использованием разных монет
            { relativeAmount: 100, basePair: ["$1", "50¢ + 50¢"] },
            { relativeAmount: 125, basePair: ["$1 + 25¢", "50¢ + 50¢ + 25¢"] },
            { relativeAmount: 150, basePair: ["$1 + 50¢", "50¢ + 50¢ + 50¢"] },
            
            // Уровень 3: Сложные пары с большими суммами
            { relativeAmount: 175, basePair: ["$1 + 50¢ + 25¢", "25¢ x 7"] },
            { relativeAmount: 200, basePair: ["$1 x 2", "50¢ x 4"] },
            { relativeAmount: 250, basePair: ["$1 x 2 + 50¢", "25¢ x 10"] }
        ];
        
        // Состояние соединений
        this.connections = [];
        
        // Для отслеживания текущей линии при drag-and-drop
        this.dragging = false;
        this.lineStart = null;
        this.currentLine = null;
        
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
        
        // Допустимые номиналы
        this.allowedDenominations = [1, 5, 10, 25, 50, 100];
        
        // Инициализируем игровые элементы
        this.initElements();
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
     * Подстраивает размер SVG под размер контейнера
     */
    adjustSVGSize() {
        if (this.connectionsLayer) {
            const gameContainer = document.querySelector('.game-container');
            const gameRect = gameContainer.getBoundingClientRect();
            
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
        
        const gameContainer = document.querySelector('.game-container');
        const gameRect = gameContainer.getBoundingClientRect();
        
        this.connections.forEach(connection => {
            const startPile = document.getElementById(connection.start);
            const endPile = document.getElementById(connection.end);
            
            if (startPile && endPile && connection.line) {
                const startRect = startPile.getBoundingClientRect();
                const endRect = endPile.getBoundingClientRect();
                
                const startX = startRect.left + startRect.width / 2 - gameRect.left;
                const startY = startRect.top + startRect.height / 2 - gameRect.top;
                const endX = endRect.left + endRect.width / 2 - gameRect.left;
                const endY = endRect.top + endRect.height / 2 - gameRect.top;
                
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
        
        // Обработчик для кнопки проверки ответов
        if (this.checkButton) {
            this.checkButton.addEventListener('click', () => {
                this.checkAnswers();
            });
            // Кнопка проверки изначально неактивна
            this.checkButton.disabled = true;
        }
        
        // Обработчик для кнопки сброса
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetConnections();
                // Деактивируем кнопку проверки после сброса
                if (this.checkButton) {
                    this.checkButton.disabled = true;
                    this.checkButton.classList.remove('pulse-animation');
                }
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
        
        // Добавляем обработчики для каждой кучки
        this.pileContainers.forEach(pile => {
            // Стилизуем курсор для индикации возможности перетаскивания
            pile.style.cursor = 'pointer';
            
            // Начало перетаскивания
            pile.addEventListener('mousedown', (e) => {
                e.preventDefault();
                console.log("Mousedown on pile:", pile.id);
                
                // Обновляем размеры контейнера игры для корректных координат
                const gameRect = gameContainer.getBoundingClientRect();
                
                // Начинаем рисовать линию
                this.dragging = true;
                this.lineStart = pile;
                
                // Получаем координаты центра кучки относительно SVG
                const rect = pile.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2 - gameRect.left;
                const centerY = rect.top + rect.height / 2 - gameRect.top;
                
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
            });
            
            // Добавляем обработчик для сенсорных устройств
            pile.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log("Touchstart on pile:", pile.id);
                
                // Обновляем размеры контейнера игры для корректных координат
                const gameRect = gameContainer.getBoundingClientRect();
                
                // Получаем координаты первого касания
                const touch = e.touches[0];
                
                // Начинаем рисовать линию
                this.dragging = true;
                this.lineStart = pile;
                
                // Получаем координаты центра кучки относительно SVG
                const rect = pile.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2 - gameRect.left;
                const centerY = rect.top + rect.height / 2 - gameRect.top;
                
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
            });
        });
        
        // Обработчик для движения мыши
        document.addEventListener('mousemove', (e) => {
            if (this.dragging && this.currentLine) {
                // Обновляем размеры контейнера игры для корректных координат
                const gameRect = gameContainer.getBoundingClientRect();
                
                // Получаем координаты курсора
                const mouseX = e.clientX - gameRect.left;
                const mouseY = e.clientY - gameRect.top;
                
                // Обновляем конечную точку линии
                this.currentLine.setAttribute('x2', mouseX);
                this.currentLine.setAttribute('y2', mouseY);
            }
        });
        
        // Обработчик для сенсорного перемещения
        document.addEventListener('touchmove', (e) => {
            if (this.dragging && this.currentLine) {
                e.preventDefault();
                
                // Обновляем размеры контейнера игры для корректных координат
                const gameRect = gameContainer.getBoundingClientRect();
                
                // Получаем координаты первого касания
                const touch = e.touches[0];
                const touchX = touch.clientX - gameRect.left;
                const touchY = touch.clientY - gameRect.top;
                
                // Обновляем конечную точку линии
                this.currentLine.setAttribute('x2', touchX);
                this.currentLine.setAttribute('y2', touchY);
            }
        });
        
        // Обработчик для окончания перетаскивания
        document.addEventListener('mouseup', (e) => {
            if (!this.dragging || !this.currentLine) {
                return;
            }
            
            console.log("Mouse up - checking for connection");
            
            // Обновляем размеры контейнера игры для корректных координат
            const gameRect = gameContainer.getBoundingClientRect();
            
            // Получаем координаты курсора
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            // Проверяем, находится ли курсор над какой-либо кучкой
            this.pileContainers.forEach(pile => {
                const rect = pile.getBoundingClientRect();
                
                // Если курсор над кучкой и это не та же самая кучка, откуда началось перетаскивание
                if (
                    pile !== this.lineStart &&
                    mouseX >= rect.left && 
                    mouseX <= rect.right && 
                    mouseY >= rect.top && 
                    mouseY <= rect.bottom
                ) {
                    // Обрабатываем успешное соединение
                    console.log(`Connected ${this.lineStart.id} to ${pile.id}`);
                    
                    // Подстраиваем линию к центрам кучек
                    const startRect = this.lineStart.getBoundingClientRect();
                    const endRect = pile.getBoundingClientRect();
                    
                    const startX = startRect.left + startRect.width / 2 - gameRect.left;
                    const startY = startRect.top + startRect.height / 2 - gameRect.top;
                    const endX = endRect.left + endRect.width / 2 - gameRect.left;
                    const endY = endRect.top + endRect.height / 2 - gameRect.top;
                    
                    this.currentLine.setAttribute('x1', startX);
                    this.currentLine.setAttribute('y1', startY);
                    this.currentLine.setAttribute('x2', endX);
                    this.currentLine.setAttribute('y2', endY);
                    
                    // Добавляем соединение в массив
                    this.connections.push({
                        start: this.lineStart.id,
                        end: pile.id,
                        line: this.currentLine
                    });
                    
                    // Сохраняем линию и проверяем, все ли кучки соединены
                    this.currentLine = null;
                    
                    // Проверяем, все ли кучки соединены
                    const allConnected = this.checkIfAllPilesConnected();
                    if (allConnected && this.checkButton) {
                        // Активируем кнопку проверки
                        this.checkButton.disabled = false;
                        // Добавляем анимацию пульсации
                        this.checkButton.classList.add('pulse-animation');
                    }
                    
                    return;
                }
            });
            
            // Если соединение не было создано, удаляем текущую линию
            if (this.currentLine && this.currentLine.parentNode) {
                this.currentLine.parentNode.removeChild(this.currentLine);
            }
            
            // Сбрасываем состояние перетаскивания
            this.dragging = false;
            this.lineStart = null;
            this.currentLine = null;
        });
        
        // Обработчик окончания касания для сенсорных устройств
        document.addEventListener('touchend', (e) => {
            if (!this.dragging || !this.currentLine) {
                return;
            }
            
            console.log("Touch end - checking for connection");
            
            // Обновляем размеры контейнера игры для корректных координат
            const gameRect = gameContainer.getBoundingClientRect();
            
            // Получаем координаты последнего касания
            const touch = e.changedTouches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // Проверяем, находится ли касание над какой-либо кучкой
            this.pileContainers.forEach(pile => {
                const rect = pile.getBoundingClientRect();
                
                // Если касание над кучкой и это не та же самая кучка, откуда началось перетаскивание
                if (
                    pile !== this.lineStart &&
                    touchX >= rect.left && 
                    touchX <= rect.right && 
                    touchY >= rect.top && 
                    touchY <= rect.bottom
                ) {
                    // Обрабатываем успешное соединение
                    console.log(`Touch connected ${this.lineStart.id} to ${pile.id}`);
                    
                    // Подстраиваем линию к центрам кучек
                    const startRect = this.lineStart.getBoundingClientRect();
                    const endRect = pile.getBoundingClientRect();
                    
                    const startX = startRect.left + startRect.width / 2 - gameRect.left;
                    const startY = startRect.top + startRect.height / 2 - gameRect.top;
                    const endX = endRect.left + endRect.width / 2 - gameRect.left;
                    const endY = endRect.top + endRect.height / 2 - gameRect.top;
                    
                    this.currentLine.setAttribute('x1', startX);
                    this.currentLine.setAttribute('y1', startY);
                    this.currentLine.setAttribute('x2', endX);
                    this.currentLine.setAttribute('y2', endY);
                    
                    // Добавляем соединение в массив
                    this.connections.push({
                        start: this.lineStart.id,
                        end: pile.id,
                        line: this.currentLine
                    });
                    
                    // Сохраняем линию и проверяем, все ли кучки соединены
                    this.currentLine = null;
                    
                    // Проверяем, все ли кучки соединены
                    const allConnected = this.checkIfAllPilesConnected();
                    if (allConnected && this.checkButton) {
                        // Активируем кнопку проверки
                        this.checkButton.disabled = false;
                        // Добавляем анимацию пульсации
                        this.checkButton.classList.add('pulse-animation');
                    }
                    
                    return;
                }
            });
            
            // Если соединение не было создано, удаляем текущую линию
            if (this.currentLine && this.currentLine.parentNode) {
                this.currentLine.parentNode.removeChild(this.currentLine);
            }
            
            // Сбрасываем состояние перетаскивания
            this.dragging = false;
            this.lineStart = null;
            this.currentLine = null;
        });
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
            if (allConnected) {
                this.checkButton.disabled = false;
                this.checkButton.classList.add('pulse-animation');
            } else {
                this.checkButton.disabled = true;
                this.checkButton.classList.remove('pulse-animation');
            }
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
    }
    
    /**
     * Генерирует данные для указанного уровня и задания
     * @param {number} level - Номер уровня
     * @param {number} task - Номер задания в рамках уровня
     * @returns {Object} Данные для уровня
     */
    generateLevelData(level, task = 1) {
        console.log(`Generating data for level ${level}, task ${task}...`);
        
        // Определяем, какие базовые пары использовать в зависимости от уровня
        let levelPairs = [];
        
        if (level === 1) {
            // Используем первые 3 пары (простые)
            levelPairs = this.basePairs.slice(0, 3);
        } else if (level === 2) {
            // Используем средние 3 пары
            levelPairs = this.basePairs.slice(3, 6);
        } else {
            // Используем последние 3 пары (сложные)
            levelPairs = this.basePairs.slice(6, 9);
        }
        
        // Выбираем пару на основе текущего задания (1, 2, 3)
        const pairIndex = (task - 1) % levelPairs.length;
        const basePairData = levelPairs[pairIndex];
        
        // Количество монет увеличивается с уровнем
        const coinsPerPile = 5 + level * 3;
        console.log(`Generating level ${level}, task ${task} with ${coinsPerPile} coins per pile`);
        
        // Создаем пары монет
        const pair1Amount = basePairData.relativeAmount;
        const pair2Amount = Math.floor(pair1Amount * 1.4); // 40% больше, минимум отличие 10¢
        const pair3Amount = Math.floor(pair1Amount * 0.6); // 40% меньше, но не менее 10¢
        
        // Убеждаемся, что суммы отличаются минимум на 5¢
        const ensureUniqueSums = () => {
            if (pair2Amount - pair1Amount < 5) {
                return Math.max(pair1Amount + 5, pair2Amount);
            }
            return pair2Amount;
        };
        
        const ensureMinSum = (amount) => {
            return Math.max(10, amount); // Минимальная сумма 10¢
        };
        
        const validPair2Amount = ensureUniqueSums();
        const validPair3Amount = ensureMinSum(pair3Amount);
        
        // Создаем 3 пары с разными суммами
        const pairs = [
            {
                amount: pair1Amount,
                compositions: [
                    this.generateComposition(basePairData.basePair[0], pair1Amount, coinsPerPile),
                    this.generateComposition(basePairData.basePair[1], pair1Amount, coinsPerPile)
                ]
            },
            {
                amount: validPair2Amount,
                compositions: [
                    this.generateComposition("$1", validPair2Amount, coinsPerPile),
                    this.generateComposition("25¢", validPair2Amount, coinsPerPile)
                ]
            },
            {
                amount: validPair3Amount,
                compositions: [
                    this.generateComposition("10¢", validPair3Amount, coinsPerPile),
                    this.generateComposition("5¢", validPair3Amount, coinsPerPile)
                ]
            }
        ];
        
        return { pairs };
    }
    
    /**
     * Генерирует массив монет для кучки
     * @param {string} baseType - Базовый тип монет ("$1", "25¢" и т.д.)
     * @param {number} totalAmount - Общая сумма в центах
     * @param {number} targetCoins - Целевое количество монет
     * @returns {Array} - Массив номиналов монет
     */
    generateComposition(baseType, totalAmount, targetCoins) {
        console.log(`Generating composition for ${baseType}, amount ${totalAmount}, target coins ${targetCoins}`);
        
        // Допустимые номиналы монет (от большего к меньшему)
        const denominations = [...this.allowedDenominations].sort((a, b) => b - a);
        
        // Приоритетный номинал на основе базового типа
        let primaryDenomination = 25; // По умолчанию 25 центов
        
        if (baseType.includes("$1")) {
            primaryDenomination = 100; // Доллары
        } else if (baseType.includes("50¢")) {
            primaryDenomination = 50; // 50 центов
        }
        
        // Создаем композицию монет по новому алгоритму
        const coinValues = [];
        let remainingAmount = totalAmount;
        
        // 1. Сначала добавляем одну монету приоритетного типа (если возможно)
        if (remainingAmount >= primaryDenomination) {
            coinValues.push(primaryDenomination);
            remainingAmount -= primaryDenomination;
        }
        
        // 2. Жадный алгоритм: используем монеты от больших к малым
        while (remainingAmount > 0) {
            let added = false;
            
            for (const denom of denominations) {
                if (denom <= remainingAmount) {
                    coinValues.push(denom);
                    remainingAmount -= denom;
                    added = true;
                    break;
                }
            }
            
            // Если не смогли добавить ни одной монеты (странный случай)
            if (!added && remainingAmount > 0) {
                coinValues.push(1); // Добавляем минимальную монету
                remainingAmount -= 1;
            }
        }
        
        // 3. Проверяем, достаточно ли монет - если нет, разбиваем крупные
        while (coinValues.length < targetCoins) {
            // Находим крупную монету для разбивки (номинал > 1)
            const largeCoins = coinValues.filter(c => c > 1);
            
            if (largeCoins.length === 0) {
                // Больше нечего разбивать, добавляем монеты по 1 центу
                coinValues.push(1);
                continue;
            }
            
            // Выбираем случайную крупную монету
            const randomIndex = Math.floor(Math.random() * largeCoins.length);
            const coinToSplit = largeCoins[randomIndex];
            const coinIndex = coinValues.indexOf(coinToSplit);
            
            // Удаляем выбранную монету
            coinValues.splice(coinIndex, 1);
            
            // Разбиваем монету на более мелкие
            let valueToDistribute = coinToSplit;
            while (valueToDistribute > 0) {
                // Находим подходящий номинал (меньше чем разбиваемая монета)
                const suitableDenoms = denominations.filter(d => d < coinToSplit && d <= valueToDistribute);
                
                if (suitableDenoms.length > 0) {
                    // Выбираем случайный номинал из подходящих
                    const randomDenom = suitableDenoms[Math.floor(Math.random() * suitableDenoms.length)];
                    coinValues.push(randomDenom);
                    valueToDistribute -= randomDenom;
                } else {
                    // Добавляем монеты по 1 центу для остатка
                    coinValues.push(1);
                    valueToDistribute -= 1;
                }
            }
        }
        
        // Если у нас слишком много монет, удаляем самые мелкие
        while (coinValues.length > targetCoins) {
            // Сортируем копию массива, чтобы найти минимальные значения
            const sortedCoins = [...coinValues].sort((a, b) => a - b);
            const minCoin = sortedCoins[0];
            const minIndex = coinValues.indexOf(minCoin);
            coinValues.splice(minIndex, 1);
        }
        
        // Перемешиваем монеты в случайном порядке
        for (let i = coinValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coinValues[i], coinValues[j]] = [coinValues[j], coinValues[i]];
        }
        
        // Проверка: убедимся, что сумма равна требуемой
        const totalSum = coinValues.reduce((sum, val) => sum + val, 0);
        if (totalSum !== totalAmount) {
            console.error(`Error in coin composition! Expected sum: ${totalAmount}, actual sum: ${totalSum}`);
            
            // Корректируем ошибку, если есть
            const difference = totalAmount - totalSum;
            
            if (difference > 0) {
                // Не хватает, добавляем монеты
                let remainingDiff = difference;
                while (remainingDiff > 0) {
                    // Пытаемся найти подходящую монету
                    const suitableDenom = denominations.find(d => d <= remainingDiff);
                    if (suitableDenom) {
                        coinValues.push(suitableDenom);
                        remainingDiff -= suitableDenom;
                    } else {
                        coinValues.push(1);
                        remainingDiff -= 1;
                    }
                }
            } else if (difference < 0) {
                // Переизбыток, удаляем монеты
                let remainingDiff = -difference;
                while (remainingDiff > 0) {
                    // Ищем монету, которую можно удалить
                    const coinToRemove = coinValues.find(c => c <= remainingDiff);
                    if (coinToRemove) {
                        const index = coinValues.indexOf(coinToRemove);
                        coinValues.splice(index, 1);
                        remainingDiff -= coinToRemove;
                    } else {
                        // Не нашли подходящую монету, удаляем любую минимальную
                        const minCoin = Math.min(...coinValues);
                        const minIndex = coinValues.indexOf(minCoin);
                        coinValues.splice(minIndex, 1);
                        remainingDiff = 0; // Прерываем цикл
                    }
                }
            }
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
        
        // Создаем кучки из пар с одинаковой суммой
        levelData.pairs.forEach((pair, index) => {
            // Первая кучка пары
            allPiles.push({
                id: `pile-${allPiles.length + 1}`,
                amount: pair.amount,
                composition: pair.compositions[0],
                pairIndex: index  // Сохраняем индекс пары для проверки
            });
            
            // Вторая кучка пары
            allPiles.push({
                id: `pile-${allPiles.length + 1}`,
                amount: pair.amount,
                composition: pair.compositions[1],
                pairIndex: index  // Тот же индекс пары
            });
        });
        
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
                
                // Создаем элемент для отображения суммы
                const amountElement = document.createElement('div');
                amountElement.className = 'pile-amount';
                amountElement.textContent = this.formatAmount(pile.amount);
                amountElement.style.fontSize = '24px';
                amountElement.style.fontWeight = 'bold';
                amountElement.style.textAlign = 'center';
                amountElement.style.marginBottom = '10px';
                
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
                container.appendChild(amountElement);
                container.appendChild(coinsElement);
                
                // Сохраняем данные в атрибуте
                this.pileContainers[i].dataset.pileId = this.pileContainers[i].id;
                this.pileContainers[i].dataset.amount = pile.amount;
                this.pileContainers[i].dataset.pairIndex = pile.pairIndex; // Сохраняем индекс пары
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
                // Проверяем, что соединены кучи из одной пары (одинаковые суммы)
                if (startPile.dataset.amount === endPile.dataset.amount) {
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
            // Проверяем, завершена ли игра (последнее задание последнего уровня)
            if (this.currentTask === this.tasksPerLevel && this.level >= 3) {
                // Если это последнее задание последнего уровня, показываем сообщение о завершении игры
                this.showTemporaryMessage('Поздравляем! Вы прошли все задания!', 'success', 3000);
            } else {
                // Создаем временное уведомление о выполнении текущего задания
                this.showTemporaryMessage(`Отлично! Задание ${this.currentTask} выполнено!`, 'success');
            }
            
            // Переходим к следующему заданию или уровню
            setTimeout(() => {
                // Если игра завершена, не переходим к следующему заданию
                if (this.currentTask === this.tasksPerLevel && this.level >= 3) {
                    // Можно добавить дополнительные действия при завершении игры
                    console.log("Игра завершена!");
                } else {
                    this.progressToNextTask();
                }
            }, 1500);
        } else {
            // Показываем сообщение об ошибке
            this.showTemporaryMessage(`Правильных пар: ${correctCount} из ${this.connections.length}. Попробуйте снова.`, 'error');
            
            // Ждем немного и сбрасываем уровень
            setTimeout(() => {
                this.startLevel(this.level, this.currentTask);
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
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game");
    
    // Создаем экземпляр игры
    const game = new CoinPairingGame();
    
    // Сохраняем ссылку на игру в глобальной области видимости для отладки
    window.coinGame = game;
}); 