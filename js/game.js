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
        
        // Базовые пары кучек (будут масштабироваться в зависимости от уровня)
        this.basePairs = [
            { relativeAmount: 150, basePair: ["$1 и 50¢", "25¢"] },
            { relativeAmount: 200, basePair: ["$1", "25¢"] },
            { relativeAmount: 175, basePair: ["$1 и 25¢", "25¢"] }
        ];
        
        // Состояние соединений
        this.connections = [];
        
        // Для отслеживания текущей линии при drag-and-drop
        this.dragging = false;
        this.lineStart = null;
        this.currentLine = null;
        
        // Информация о монетах (размеры и масштаб)
        this.coinData = {
            1: { width: 100, height: 100, src: 'money_1.png' },
            5: { width: 110, height: 110, src: 'money_5.png' },
            10: { width: 120, height: 120, src: 'money_10.png' },
            25: { width: 140, height: 140, src: 'money_25.png' },
            50: { width: 160, height: 160, src: 'money_50.png' },
            100: { width: 212, height: 90, src: 'money_100.png' }
        };
        
        // Множитель масштабирования
        this.itemScale = 0.3;
        
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
        
        // Кнопка для показа легенды
        this.legendButton = document.getElementById('show-legend');
        this.legendPanel = document.getElementById('legend-panel');
        
        // Элемент отображения текущего уровня
        this.levelDisplay = document.getElementById('current-level');
        
        // Устанавливаем текущий уровень в отображении
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.level;
        }
        
        // Игровые кнопки
        this.checkButton = document.getElementById('check-btn');
        this.resetButton = document.getElementById('reset-btn');
        this.nextLevelButton = document.getElementById('next-level-btn');
        
        // Добавляем обработчики событий
        this.addEventListeners();
        
        // Запускаем первый уровень
        this.startLevel(this.level);
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
        
        // Обработчик для кнопки проверки ответов
        if (this.checkButton) {
            this.checkButton.addEventListener('click', () => {
                this.checkAnswers();
            });
        }
        
        // Обработчик для кнопки сброса
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetConnections();
            });
        }
        
        // Обработчик для кнопки следующего уровня
        if (this.nextLevelButton) {
            this.nextLevelButton.addEventListener('click', () => {
                this.level = Math.min(this.level + 1, 3); // Максимум 3 уровня
                this.startLevel(this.level);
                this.nextLevelButton.style.display = 'none';
                
                // Обновляем отображение уровня
                if (this.levelDisplay) {
                    this.levelDisplay.textContent = this.level;
                }
            });
        }
        
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
        
        // Получаем размеры контейнера игры для корректировки координат
        const gameContainer = document.querySelector('.game-container');
        const gameRect = gameContainer.getBoundingClientRect();
        
        // Устанавливаем размеры SVG равными размерам контейнера
        this.connectionsLayer.setAttribute('width', '100%');
        this.connectionsLayer.setAttribute('height', '100%');
        
        // Добавляем обработчики для каждой кучки
        this.pileContainers.forEach(pile => {
            // Стилизуем курсор для индикации возможности перетаскивания
            pile.style.cursor = 'pointer';
            
            // Начало перетаскивания
            pile.addEventListener('mousedown', (e) => {
                e.preventDefault();
                console.log("Mousedown on pile:", pile.id);
                
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
                // Обновляем координаты конца линии относительно SVG
                const x = e.clientX - gameRect.left;
                const y = e.clientY - gameRect.top;
                
                this.currentLine.setAttribute('x2', x);
                this.currentLine.setAttribute('y2', y);
            }
        });
        
        // Обработчик для отпускания кнопки мыши
        document.addEventListener('mouseup', (e) => {
            if (this.dragging && this.currentLine && this.lineStart) {
                console.log("Mouseup, checking target...");
                
                // Проверяем, над какой кучкой отпустили мышь
                let targetPile = null;
                
                this.pileContainers.forEach(pile => {
                    const rect = pile.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right &&
                        e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        // Убедимся, что это не та же самая кучка, с которой начали
                        if (pile !== this.lineStart) {
                            targetPile = pile;
                            console.log("Found target pile:", pile.id);
                        }
                    }
                });
                
                if (targetPile) {
                    // Получаем координаты центра целевой кучки относительно SVG
                    const rect = targetPile.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2 - gameRect.left;
                    const centerY = rect.top + rect.height / 2 - gameRect.top;
                    
                    // Обновляем конечную точку линии
                    this.currentLine.setAttribute('x2', centerX);
                    this.currentLine.setAttribute('y2', centerY);
                    this.currentLine.setAttribute('data-end-pile', targetPile.id);
                    
                    // Сохраняем соединение (без проверки на правильность)
                    this.connections.push({
                        start: this.lineStart.id,
                        end: targetPile.id,
                        line: this.currentLine,
                        startAmount: parseInt(this.lineStart.dataset.amount || '0'),
                        endAmount: parseInt(targetPile.dataset.amount || '0')
                    });
                    
                    // Проверяем, все ли кучки соединены
                    this.checkIfAllPilesConnected();
                } else {
                    // Если отпустили не над кучкой, удаляем линию
                    if (this.connectionsLayer.contains(this.currentLine)) {
                        this.connectionsLayer.removeChild(this.currentLine);
                    }
                }
                
                // Сбрасываем состояние перетаскивания
                this.dragging = false;
                this.lineStart = null;
                this.currentLine = null;
            }
        });
        
        // Добавляем обработчик для сенсорных устройств (touch)
        this.pileContainers.forEach(pile => {
            pile.addEventListener('touchstart', (e) => {
                e.preventDefault();
                
                // Получаем координаты первого касания
                const touch = e.touches[0];
                
                // Аналогично обработчику mousedown
                this.dragging = true;
                this.lineStart = pile;
                
                const rect = pile.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2 - gameRect.left;
                const centerY = rect.top + rect.height / 2 - gameRect.top;
                
                this.currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                this.currentLine.setAttribute('x1', centerX);
                this.currentLine.setAttribute('y1', centerY);
                this.currentLine.setAttribute('x2', centerX);
                this.currentLine.setAttribute('y2', centerY);
                this.currentLine.setAttribute('stroke', '#2196F3'); // Синий цвет для всех соединений
                this.currentLine.setAttribute('stroke-width', '4');
                this.currentLine.setAttribute('data-start-pile', pile.id);
                
                this.connectionsLayer.appendChild(this.currentLine);
            });
        });
        
        document.addEventListener('touchmove', (e) => {
            if (this.dragging && this.currentLine) {
                e.preventDefault();
                
                // Получаем координаты первого касания
                const touch = e.touches[0];
                const x = touch.clientX - gameRect.left;
                const y = touch.clientY - gameRect.top;
                
                this.currentLine.setAttribute('x2', x);
                this.currentLine.setAttribute('y2', y);
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.dragging && this.currentLine && this.lineStart) {
                // Завершение касания
                // Логика аналогична mouseup, но нужно определить последнюю позицию касания
                const touch = e.changedTouches[0];
                
                let targetPile = null;
                this.pileContainers.forEach(pile => {
                    const rect = pile.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom &&
                        pile !== this.lineStart) {
                        targetPile = pile;
                    }
                });
                
                // Дальнейшая обработка аналогична mouseup
                if (targetPile) {
                    const rect = targetPile.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2 - gameRect.left;
                    const centerY = rect.top + rect.height / 2 - gameRect.top;
                    
                    this.currentLine.setAttribute('x2', centerX);
                    this.currentLine.setAttribute('y2', centerY);
                    this.currentLine.setAttribute('data-end-pile', targetPile.id);
                    
                    // Сохраняем соединение (без проверки на правильность)
                    this.connections.push({
                        start: this.lineStart.id,
                        end: targetPile.id,
                        line: this.currentLine,
                        startAmount: parseInt(this.lineStart.dataset.amount || '0'),
                        endAmount: parseInt(targetPile.dataset.amount || '0')
                    });
                    
                    // Проверяем, все ли кучки соединены
                    this.checkIfAllPilesConnected();
                } else {
                    if (this.connectionsLayer.contains(this.currentLine)) {
                        this.connectionsLayer.removeChild(this.currentLine);
                    }
                }
                
                this.dragging = false;
                this.lineStart = null;
                this.currentLine = null;
            }
        });
    }
    
    /**
     * Проверяет, все ли кучки соединены
     */
    checkIfAllPilesConnected() {
        // Получаем количество уникальных кучек в соединениях
        const connectedPiles = new Set();
        for (const connection of this.connections) {
            connectedPiles.add(connection.start);
            connectedPiles.add(connection.end);
        }
        
        // Если все 6 кучек соединены (3 пары), активируем кнопку проверки
        if (connectedPiles.size === 6) {
            // Делаем кнопку проверки более заметной
            if (this.checkButton) {
                this.checkButton.classList.add('pulse-animation');
            }
        }
    }
    
    /**
     * Создает новый уровень с заданиями
     * @param {number} level - Номер уровня
     */
    startLevel(level) {
        console.log(`Starting level ${level}...`);
        
        // Генерируем данные для текущего уровня
        const levelData = this.generateLevelData(level);
        
        // Отображаем кучки на экране
        this.renderPiles(levelData);
        
        // Сбрасываем все соединения
        this.resetConnections();
    }
    
    /**
     * Генерирует данные для уровня с учетом формулы масштабирования
     * @param {number} level - Номер уровня
     * @returns {Array} - Данные для уровня
     */
    generateLevelData(level) {
        // Количество монет для текущего уровня по формуле number = 5 + level * 5
        const coinsPerPile = 5 + level * 5;
        console.log(`Generating level ${level} with ${coinsPerPile} coins per pile`);
        
        // Генерируем пары кучек для уровня
        const levelData = [];
        
        for (const basePair of this.basePairs) {
            // Масштабируем сумму в зависимости от уровня
            const amount = basePair.relativeAmount + (level - 1) * 50;
            
            // Создаем пары монет, масштабируя количество
            const pile1Composition = this.generateComposition(basePair.basePair[0], amount, coinsPerPile);
            const pile2Composition = this.generateComposition(basePair.basePair[1], amount, coinsPerPile);
            
            levelData.push({
                amount: amount,
                pair: [pile1Composition, pile2Composition]
            });
        }
        
        return levelData;
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
        
        // Разбираем базовый тип, чтобы понять какие монеты преобладают
        let primaryDenomination = 25; // По умолчанию 25 центов
        
        if (baseType.includes("$1")) {
            primaryDenomination = 100; // Доллары
        } else if (baseType.includes("50¢")) {
            primaryDenomination = 50; // 50 центов
        }
        
        // Монеты, которые мы можем использовать
        const denominations = this.allowedDenominations;
        
        // Создаем композицию монет
        const coinValues = [];
        let remainingAmount = totalAmount;
        
        // Сначала добавляем основной номинал, но не более 40% от целевого количества
        const primaryCoins = Math.min(
            Math.floor(remainingAmount / primaryDenomination),
            Math.floor(targetCoins * 0.4) // Максимум 40% монет - основной номинал
        );
        
        for (let i = 0; i < primaryCoins; i++) {
            coinValues.push(primaryDenomination);
            remainingAmount -= primaryDenomination;
        }
        
        // Добавляем монеты других номиналов, чтобы достичь целевого количества
        while (coinValues.length < targetCoins && remainingAmount > 0) {
            // Находим подходящие номиналы
            let suitableDenominations = denominations.filter(d => d <= remainingAmount);
            
            if (suitableDenominations.length === 0) {
                // Если не осталось подходящих номиналов, добавляем монету в 1 цент
                coinValues.push(1);
                remainingAmount -= 1;
            } else {
                // Выбираем случайный номинал из подходящих
                const randIndex = Math.floor(Math.random() * suitableDenominations.length);
                const value = suitableDenominations[randIndex];
                
                coinValues.push(value);
                remainingAmount -= value;
            }
        }
        
        // Если мы не достигли целевого количества монет, добавляем монеты по 1 центу
        while (coinValues.length < targetCoins) {
            coinValues.push(1);
        }
        
        // Перемешиваем монеты в случайном порядке
        for (let i = coinValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coinValues[i], coinValues[j]] = [coinValues[j], coinValues[i]];
        }
        
        return coinValues;
    }
    
    /**
     * Отображает кучки на экране
     * @param {Array} levelData - Данные для уровня
     */
    renderPiles(levelData) {
        console.log("Rendering piles...");
        
        // Массив для всех кучек 
        const allPiles = [];
        
        // Обрабатываем каждую пару
        for (let i = 0; i < levelData.length; i++) {
            const pairData = levelData[i];
            
            // Создаем две кучки для пары
            allPiles.push({
                id: i * 2,
                amount: pairData.amount,
                composition: pairData.pair[0]
            });
            
            allPiles.push({
                id: i * 2 + 1,
                amount: pairData.amount,
                composition: pairData.pair[1]
            });
        }
        
        // Перемешиваем кучки
        for (let i = allPiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPiles[i], allPiles[j]] = [allPiles[j], allPiles[i]];
        }
        
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
                this.pileContainers[i].dataset.pileId = pile.id;
                this.pileContainers[i].dataset.amount = pile.amount;
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
            
            // Стилизуем монету в зависимости от номинала
            if (validDenomination === 100) { // $1
                coinElement.style.borderRadius = '5px'; // Прямоугольная форма с закругленными углами
                // Не добавляем border для доллара
            } else {
                coinElement.style.backgroundColor = this.getCoinColor(validDenomination);
                coinElement.style.borderRadius = '50%'; // Круглая форма для монет
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
            this.connectionsLayer.innerHTML = '';
        }
    }
    
    /**
     * Проверяет правильность соединений
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
        }
        
        // Перебираем все соединения и проверяем их
        for (const connection of this.connections) {
            // Проверяем, совпадают ли суммы
            if (connection.startAmount === connection.endAmount) {
                // Правильное соединение - меняем цвет на зеленый
                connection.line.setAttribute('stroke', '#4CAF50');
                correctCount++;
            } else {
                // Неправильное соединение - меняем цвет на красный
                connection.line.setAttribute('stroke', '#F44336');
                allCorrect = false;
            }
        }
        
        // Выводим сообщение о результатах
        if (allCorrect) {
            setTimeout(() => {
                alert(`Все соединения верны! Вы нашли все ${correctCount} пар.`);
                
                // Показываем кнопку следующего уровня, если все пары найдены
                if (correctCount === 3) {
                    if (this.nextLevelButton) {
                        this.nextLevelButton.style.display = 'block';
                    }
                }
            }, 300);
        } else {
            setTimeout(() => {
                alert(`Проверено ${this.connections.length} соединений. Найдено ${correctCount} правильных пар.`);
            }, 300);
        }
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