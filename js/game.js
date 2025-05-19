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
        
        // Предопределенные пары кучек для каждого уровня
        this.levelData = {
            1: [
                { amount: 150, pair: ["1×$1, 1×50¢", "6×25¢"] },
                { amount: 200, pair: ["2×$1", "8×25¢"] },
                { amount: 175, pair: ["1×$1, 3×25¢", "7×25¢"] }
            ],
            2: [
                { amount: 250, pair: ["2×$1, 2×25¢", "10×25¢"] },
                { amount: 300, pair: ["3×$1", "12×25¢"] },
                { amount: 225, pair: ["2×$1, 1×25¢", "9×25¢"] }
            ],
            3: [
                { amount: 350, pair: ["3×$1, 2×25¢", "14×25¢"] },
                { amount: 400, pair: ["4×$1", "16×25¢"] },
                { amount: 325, pair: ["3×$1, 1×25¢", "13×25¢"] }
            ]
        };
        
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
        
        // Получаем данные для текущего уровня
        const levelData = this.levelData[level] || this.levelData[1];
        
        // Отображаем кучки на экране
        this.renderPiles(levelData);
        
        // Сбрасываем все соединения
        this.resetConnections();
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
                
                // Создаем элемент для отображения состава кучки
                const compositionElement = document.createElement('div');
                compositionElement.className = 'pile-composition';
                compositionElement.textContent = pile.composition;
                compositionElement.style.fontSize = '14px';
                compositionElement.style.textAlign = 'center';
                
                // Добавляем элементы в контейнер
                container.appendChild(amountElement);
                container.appendChild(compositionElement);
                
                // Сохраняем данные в атрибуте
                this.pileContainers[i].dataset.pileId = pile.id;
                this.pileContainers[i].dataset.amount = pile.amount;
            }
        }
        
        console.log("Piles rendered successfully");
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
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting game");
    
    // Создаем экземпляр игры
    const game = new CoinPairingGame();
    
    // Сохраняем ссылку на игру в глобальной области видимости для отладки
    window.coinGame = game;
}); 