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
            
            // Переходим к следующему заданию или уровню
            setTimeout(() => {
                this.progressToNextTask();
            }, 1500);
        } else {
            // Показываем сообщение об ошибке
            this.showTemporaryMessage(`Правильных пар: ${correctCount} из ${this.connections.length}. Начните уровень заново.`, 'error');
            
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
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game");
    
    // Создаем экземпляр игры
    const game = new CoinPairingGame();
    
    // Сохраняем ссылку на игру в глобальной области видимости для отладки
    window.coinGame = game;
}); 