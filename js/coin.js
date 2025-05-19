/**
 * Класс для представления монеты или купюры определенного номинала
 */
class Coin {
    /**
     * Создает экземпляр монеты/купюры
     * @param {number} value - Значение номинала в центах (1, 5, 10, 25, 50, 100)
     * @param {number} diameter - Диаметр монеты в пикселях
     */
    constructor(value, diameter) {
        this.value = value;
        this.diameter = diameter;
        
        // Определяем радиус из диаметра
        this.radius = diameter / 2;
        
        // Определяем, является ли это монетой или купюрой (купюра = $1 = 100 центов)
        this.isBill = (value === 100);
        
        // Задаем размеры для купюры (прямоугольник)
        if (this.isBill) {
            // Для купюры используем соотношение сторон приблизительно 2.5:1
            this.width = this.diameter * 2.5;
            this.height = this.diameter;
        }
        
        // Задаем CSS класс для отображения соответствующего изображения
        this.cssClass = `coin-${value}`;
        
        // Координаты расположения монеты в кучке (заполняются при размещении)
        this.x = 0;
        this.y = 0;
    }
    
    /**
     * Метод для проверки пересечения с другой монетой/купюрой
     * @param {Coin} other - Другая монета/купюра
     * @returns {boolean} - Пересекаются ли монеты
     */
    intersects(other) {
        // Если обе фигуры - монеты, проверяем пересечение кругов
        if (!this.isBill && !other.isBill) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (this.radius + other.radius);
        }
        
        // Если хотя бы одна фигура - купюра, используем проверку пересечения прямоугольников
        const thisRect = this.getBoundingRect();
        const otherRect = other.getBoundingRect();
        
        return !(
            thisRect.right < otherRect.left ||
            thisRect.left > otherRect.right ||
            thisRect.bottom < otherRect.top ||
            thisRect.top > otherRect.bottom
        );
    }
    
    /**
     * Получить ограничивающий прямоугольник для монеты/купюры
     * @returns {Object} - Координаты прямоугольника
     */
    getBoundingRect() {
        if (this.isBill) {
            return {
                left: this.x - this.width / 2,
                right: this.x + this.width / 2,
                top: this.y - this.height / 2,
                bottom: this.y + this.height / 2
            };
        } else {
            return {
                left: this.x - this.radius,
                right: this.x + this.radius,
                top: this.y - this.radius,
                bottom: this.y + this.radius
            };
        }
    }
    
    /**
     * Создает DOM-элемент для отображения монеты/купюры
     * @returns {HTMLElement} - DOM-элемент монеты/купюры
     */
    createDOMElement() {
        const element = document.createElement('div');
        element.className = `coin ${this.cssClass}`;
        
        if (this.isBill) {
            element.style.width = `${this.width}px`;
            element.style.height = `${this.height}px`;
            element.style.borderRadius = '5px'; // Прямоугольная форма с закругленными углами для купюры
        } else {
            element.style.width = `${this.diameter}px`;
            element.style.height = `${this.diameter}px`;
            element.style.borderRadius = '50%'; // Круглая форма для монет
        }
        
        element.style.left = `${this.x - (this.isBill ? this.width / 2 : this.radius)}px`;
        element.style.top = `${this.y - (this.isBill ? this.height / 2 : this.radius)}px`;
        
        return element;
    }
}

/**
 * Класс, представляющий кучку монет
 */
class CoinPile {
    /**
     * Создает кучку монет
     * @param {string} containerId - ID HTML-контейнера для отображения
     * @param {number} targetAmount - Целевая сумма в центах
     * @param {number} containerWidth - Ширина контейнера
     * @param {number} containerHeight - Высота контейнера
     */
    constructor(containerId, targetAmount, containerWidth, containerHeight) {
        this.containerId = containerId;
        this.targetAmount = targetAmount;
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        this.coins = [];
        this.totalAmount = 0;
        
        // Базовые размеры монет и купюр (исходный масштаб)
        this.baseSizes = {
            1: 30,    // 1 цент
            5: 40,    // 5 центов
            10: 45,   // 10 центов
            25: 55,   // 25 центов
            50: 65,   // 50 центов
            100: 70   // 1 доллар (купюра)
        };
        
        // Коэффициент масштабирования (изменяется при необходимости уместить все монеты)
        this.scaleFactor = 1.0;
    }
    
    /**
     * Генерирует случайный набор монет для достижения целевой суммы
     * @param {Array} [excludedValues] - Номиналы, которые нельзя использовать
     * @returns {Array} - Массив номиналов монет
     */
    generateRandomCoins(excludedValues = []) {
        const availableValues = [1, 5, 10, 25, 50, 100].filter(v => !excludedValues.includes(v));
        let remainingAmount = this.targetAmount;
        const generatedCoins = [];
        
        // Сначала добавляем несколько случайных монет для разнообразия
        const minCoins = Math.max(3, Math.floor(this.targetAmount / 50)); // Минимум 3 монеты или больше для больших сумм
        
        for (let i = 0; i < minCoins; i++) {
            // Выбираем случайный номинал
            const randIndex = Math.floor(Math.random() * availableValues.length);
            const value = availableValues[randIndex];
            
            // Если нам не хватает суммы для этого номинала, выбираем меньший
            if (value > remainingAmount) {
                // Находим максимальный подходящий номинал
                const suitableValues = availableValues.filter(v => v <= remainingAmount);
                if (suitableValues.length > 0) {
                    const maxValue = Math.max(...suitableValues);
                    generatedCoins.push(maxValue);
                    remainingAmount -= maxValue;
                } else {
                    // Если нет подходящих номиналов, добавляем самые маленькие монеты
                    generatedCoins.push(1);
                    remainingAmount -= 1;
                }
            } else {
                generatedCoins.push(value);
                remainingAmount -= value;
            }
        }
        
        // Теперь добавляем более крупные номиналы для быстрого достижения суммы
        while (remainingAmount > 0) {
            // Находим максимальный подходящий номинал
            const suitableValues = availableValues.filter(v => v <= remainingAmount);
            if (suitableValues.length > 0) {
                const maxValue = Math.max(...suitableValues);
                generatedCoins.push(maxValue);
                remainingAmount -= maxValue;
            } else {
                // Если нет подходящих номиналов, добавляем самые маленькие монеты
                generatedCoins.push(1);
                remainingAmount -= 1;
            }
        }
        
        // Перемешиваем массив монет для более естественного вида
        for (let i = generatedCoins.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [generatedCoins[i], generatedCoins[j]] = [generatedCoins[j], generatedCoins[i]];
        }
        
        this.totalAmount = generatedCoins.reduce((sum, value) => sum + value, 0);
        return generatedCoins;
    }
    
    /**
     * Создает экземпляры монет на основе массива номиналов
     * @param {Array} coinValues - Массив номиналов монет
     */
    createCoins(coinValues) {
        this.coins = [];
        
        // Создаем объекты Coin для каждого номинала
        for (const value of coinValues) {
            const diameter = this.baseSizes[value];
            const coin = new Coin(value, diameter);
            this.coins.push(coin);
        }
        
        // Сортируем монеты по размеру (большие сначала) для лучшей упаковки
        this.coins.sort((a, b) => b.diameter - a.diameter);
    }
    
    /**
     * Размещает монеты в контейнере, используя простой алгоритм упаковки
     */
    packCoins() {
        // Центр контейнера
        const centerX = this.containerWidth / 2;
        const centerY = this.containerHeight / 2;
        
        // Начинаем с размещения первой (обычно самой большой) монеты в центре
        if (this.coins.length > 0) {
            this.coins[0].x = centerX;
            this.coins[0].y = centerY;
        }
        
        // Границы прямоугольника, который содержит все монеты
        let minX = centerX;
        let maxX = centerX;
        let minY = centerY;
        let maxY = centerY;
        
        // Для каждой последующей монеты находим место
        for (let i = 1; i < this.coins.length; i++) {
            const coin = this.coins[i];
            let bestX = 0;
            let bestY = 0;
            let minDistance = Number.MAX_VALUE;
            
            // Проверяем разные углы вокруг центра, ищем позицию без пересечений
            // и ближайшую к центру
            for (let angle = 0; angle < 360; angle += 10) {
                for (let distance = 20; distance < 500; distance += 10) {
                    const x = centerX + distance * Math.cos(angle * Math.PI / 180);
                    const y = centerY + distance * Math.sin(angle * Math.PI / 180);
                    
                    coin.x = x;
                    coin.y = y;
                    
                    // Проверяем, пересекается ли монета с уже размещенными
                    let hasIntersection = false;
                    for (let j = 0; j < i; j++) {
                        if (coin.intersects(this.coins[j])) {
                            hasIntersection = true;
                            break;
                        }
                    }
                    
                    // Если нет пересечений и позиция ближе к центру, чем предыдущая лучшая
                    if (!hasIntersection && distance < minDistance) {
                        minDistance = distance;
                        bestX = x;
                        bestY = y;
                    }
                }
            }
            
            // Устанавливаем найденную позицию
            coin.x = bestX;
            coin.y = bestY;
            
            // Обновляем границы
            minX = Math.min(minX, bestX - (coin.isBill ? coin.width / 2 : coin.radius));
            maxX = Math.max(maxX, bestX + (coin.isBill ? coin.width / 2 : coin.radius));
            minY = Math.min(minY, bestY - (coin.isBill ? coin.height / 2 : coin.radius));
            maxY = Math.max(maxY, bestY + (coin.isBill ? coin.height / 2 : coin.radius));
        }
        
        // Проверяем, не выходит ли кучка за пределы контейнера
        const pileWidth = maxX - minX;
        const pileHeight = maxY - minY;
        
        // Если кучка не помещается, масштабируем её
        if (pileWidth > this.containerWidth || pileHeight > this.containerHeight) {
            const widthRatio = this.containerWidth / pileWidth;
            const heightRatio = this.containerHeight / pileHeight;
            this.scaleFactor = Math.min(widthRatio, heightRatio) * 0.9; // 0.9 для небольшого отступа
            
            // Центрируем и масштабируем все монеты
            for (const coin of this.coins) {
                // Сначала смещаем координаты к началу координат
                const relativeX = coin.x - centerX;
                const relativeY = coin.y - centerY;
                
                // Масштабируем
                const scaledX = relativeX * this.scaleFactor;
                const scaledY = relativeY * this.scaleFactor;
                
                // Возвращаем к центру
                coin.x = centerX + scaledX;
                coin.y = centerY + scaledY;
                
                // Масштабируем размеры монеты
                coin.diameter *= this.scaleFactor;
                coin.radius = coin.diameter / 2;
                
                if (coin.isBill) {
                    coin.width *= this.scaleFactor;
                    coin.height *= this.scaleFactor;
                }
            }
        }
    }
    
    /**
     * Отрисовывает кучку монет в контейнере
     */
    render() {
        const container = document.querySelector(`#${this.containerId} .pile-content`);
        if (!container) return;
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Создаем и добавляем DOM-элементы для каждой монеты
        for (const coin of this.coins) {
            const coinElement = coin.createDOMElement();
            container.appendChild(coinElement);
        }
        
        // Добавляем сумму в виде текста над кучкой (опционально)
        const amountElement = document.createElement('div');
        amountElement.className = 'pile-amount';
        amountElement.textContent = this.getFormattedAmount();
        amountElement.style.position = 'absolute';
        amountElement.style.top = '5px';
        amountElement.style.right = '5px';
        amountElement.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        amountElement.style.padding = '2px 5px';
        amountElement.style.borderRadius = '3px';
        amountElement.style.fontSize = '12px';
        container.appendChild(amountElement);
    }
    
    /**
     * Возвращает форматированную сумму (в долларах и центах)
     * @returns {string} - Форматированная сумма
     */
    getFormattedAmount() {
        const dollars = Math.floor(this.totalAmount / 100);
        const cents = this.totalAmount % 100;
        
        if (dollars > 0) {
            return `$${dollars}.${cents.toString().padStart(2, '0')}`;
        } else {
            return `${cents}¢`;
        }
    }
    
    /**
     * Возвращает общую сумму кучки в центах
     * @returns {number} - Сумма в центах
     */
    getAmount() {
        return this.totalAmount;
    }
} 