/**
 * Класс для более эффективной упаковки кругов (монет) разного размера
 * Использует алгоритм на основе физического моделирования для оптимальной упаковки
 */
class CirclePacker {
    /**
     * Создает упаковщик кругов
     * @param {number} containerWidth - Ширина контейнера
     * @param {number} containerHeight - Высота контейнера
     * @param {number} padding - Дополнительный отступ между монетами (для лучшей визуализации)
     */
    constructor(containerWidth, containerHeight, padding = 2) {
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        this.padding = padding;
        
        // Центр контейнера
        this.centerX = containerWidth / 2;
        this.centerY = containerHeight / 2;
        
        // Параметры итеративного размещения
        this.maxIterations = 150;  // Максимальное число итераций для оптимизации
        this.stepSize = 0.5;       // Величина шага для корректировки позиций
        this.decay = 0.98;         // Коэффициент затухания для уменьшения шага с каждой итерацией
    }
    
    /**
     * Размещает коллекцию кругов и прямоугольников в контейнере
     * @param {Array<Coin>} items - Массив объектов Coin для размещения
     * @returns {Array<Coin>} - Массив объектов с обновленными координатами
     */
    pack(items) {
        if (items.length === 0) return items;
        
        // Шаг 1: Начальное размещение объектов по спирали от центра
        this._initialPlacement(items);
        
        // Шаг 2: Оптимизация размещения с помощью физического моделирования
        this._optimizePlacement(items);
        
        // Шаг 3: Проверка на выход за границы и масштабирование при необходимости
        const scaleFactor = this._checkBoundsAndScale(items);
        
        // Если требуется масштабирование, применяем его ко всем объектам
        if (scaleFactor < 1.0) {
            this._applyScaling(items, scaleFactor);
        }
        
        return items;
    }
    
    /**
     * Выполняет начальное размещение объектов по спирали от центра
     * @param {Array<Coin>} items - Массив объектов для размещения
     * @private
     */
    _initialPlacement(items) {
        // Размещаем первый элемент в центре
        const firstItem = items[0];
        firstItem.x = this.centerX;
        firstItem.y = this.centerY;
        
        if (items.length === 1) return;
        
        // Спиральное размещение для остальных элементов
        const angleStep = 2 * Math.PI / (items.length * 0.75); // 0.75 для более плотной спирали
        let angle = 0;
        let radius = 0;
        const radiusStep = Math.min(this.containerWidth, this.containerHeight) / (items.length * 2);
        
        for (let i = 1; i < items.length; i++) {
            // Увеличиваем радиус и угол для спирали
            radius += radiusStep;
            angle += angleStep;
            
            // Размещаем элемент
            const item = items[i];
            item.x = this.centerX + radius * Math.cos(angle);
            item.y = this.centerY + radius * Math.sin(angle);
        }
    }
    
    /**
     * Оптимизирует размещение с помощью физического моделирования
     * Объекты отталкиваются друг от друга при перекрытии и притягиваются к центру
     * @param {Array<Coin>} items - Массив объектов для оптимизации
     * @private
     */
    _optimizePlacement(items) {
        let currentStepSize = this.stepSize;
        
        // Выполняем несколько итераций оптимизации
        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            let totalMovement = 0;
            
            // Для каждой пары объектов проверяем перекрытие и отталкивание
            for (let i = 0; i < items.length; i++) {
                const itemA = items[i];
                let dx = 0, dy = 0;
                
                // Отталкивание от других объектов при перекрытии
                for (let j = 0; j < items.length; j++) {
                    if (i === j) continue;
                    
                    const itemB = items[j];
                    const [overlapX, overlapY] = this._calculateOverlap(itemA, itemB);
                    
                    // Если есть перекрытие, добавляем вектор отталкивания
                    if (overlapX !== 0 || overlapY !== 0) {
                        dx += overlapX;
                        dy += overlapY;
                    }
                }
                
                // Притяжение к центру (слабое)
                const distanceToCenter = Math.sqrt(
                    Math.pow(itemA.x - this.centerX, 2) + 
                    Math.pow(itemA.y - this.centerY, 2)
                );
                
                const gravityFactor = 0.01; // Сила притяжения к центру
                const centerDx = (this.centerX - itemA.x) * gravityFactor;
                const centerDy = (this.centerY - itemA.y) * gravityFactor;
                
                dx += centerDx;
                dy += centerDy;
                
                // Применяем движение с ограничением по величине шага
                const movementMagnitude = Math.sqrt(dx * dx + dy * dy);
                if (movementMagnitude > 0) {
                    const limitedMagnitude = Math.min(movementMagnitude, currentStepSize);
                    const factor = limitedMagnitude / movementMagnitude;
                    
                    itemA.x += dx * factor;
                    itemA.y += dy * factor;
                    
                    totalMovement += limitedMagnitude;
                }
            }
            
            // Уменьшаем величину шага с каждой итерацией
            currentStepSize *= this.decay;
            
            // Если общее движение очень мало, останавливаем процесс (оптимизация)
            if (totalMovement < 0.5) break;
        }
    }
    
    /**
     * Рассчитывает величину перекрытия между двумя объектами
     * @param {Coin} itemA - Первый объект
     * @param {Coin} itemB - Второй объект
     * @returns {Array<number>} - Вектор [dx, dy] для разрешения перекрытия
     * @private
     */
    _calculateOverlap(itemA, itemB) {
        // Для монет (кругов)
        if (!itemA.isBill && !itemB.isBill) {
            const dx = itemA.x - itemB.x;
            const dy = itemA.y - itemB.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = itemA.radius + itemB.radius + this.padding;
            
            if (distance < minDistance) {
                // Нормализуем вектор направления
                const factor = (minDistance - distance) / distance;
                return [dx * factor, dy * factor];
            }
            
            return [0, 0];
        }
        
        // Если хотя бы один объект - купюра, используем более сложную логику
        const rectA = this._getRect(itemA);
        const rectB = this._getRect(itemB);
        
        // Проверяем, есть ли перекрытие
        if (!(rectA.right < rectB.left || rectA.left > rectB.right || 
              rectA.bottom < rectB.top || rectA.top > rectB.bottom)) {
            
            // Находим минимальное расстояние для разрешения перекрытия
            const overlapX = Math.min(
                Math.abs(rectA.right - rectB.left),
                Math.abs(rectA.left - rectB.right)
            );
            
            const overlapY = Math.min(
                Math.abs(rectA.bottom - rectB.top),
                Math.abs(rectA.top - rectB.bottom)
            );
            
            // Выбираем направление с меньшим перекрытием
            if (overlapX < overlapY) {
                const sign = itemA.x < itemB.x ? -1 : 1;
                return [sign * overlapX, 0];
            } else {
                const sign = itemA.y < itemB.y ? -1 : 1;
                return [0, sign * overlapY];
            }
        }
        
        return [0, 0];
    }
    
    /**
     * Получает прямоугольные границы для объекта
     * @param {Coin} item - Объект (монета или купюра)
     * @returns {Object} - Прямоугольные границы {left, right, top, bottom}
     * @private
     */
    _getRect(item) {
        if (item.isBill) {
            return {
                left: item.x - item.width / 2,
                right: item.x + item.width / 2,
                top: item.y - item.height / 2,
                bottom: item.y + item.height / 2
            };
        } else {
            return {
                left: item.x - item.radius,
                right: item.x + item.radius,
                top: item.y - item.radius,
                bottom: item.y + item.radius
            };
        }
    }
    
    /**
     * Проверяет, выходят ли объекты за границы контейнера, и вычисляет коэффициент масштабирования
     * @param {Array<Coin>} items - Массив объектов
     * @returns {number} - Коэффициент масштабирования (1 если масштабирование не требуется)
     * @private
     */
    _checkBoundsAndScale(items) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        // Находим границы всей группы объектов
        for (const item of items) {
            const rect = this._getRect(item);
            minX = Math.min(minX, rect.left);
            maxX = Math.max(maxX, rect.right);
            minY = Math.min(minY, rect.top);
            maxY = Math.max(maxY, rect.bottom);
        }
        
        // Добавляем небольшой отступ для полного помещения внутри контейнера
        const padding = 10;
        const groupWidth = maxX - minX + padding * 2;
        const groupHeight = maxY - minY + padding * 2;
        
        // Вычисляем необходимый коэффициент масштабирования
        const scaleX = this.containerWidth / groupWidth;
        const scaleY = this.containerHeight / groupHeight;
        const scaleFactor = Math.min(scaleX, scaleY, 1); // Не увеличиваем, только уменьшаем при необходимости
        
        return scaleFactor;
    }
    
    /**
     * Применяет масштабирование ко всем объектам
     * @param {Array<Coin>} items - Массив объектов
     * @param {number} scaleFactor - Коэффициент масштабирования
     * @private
     */
    _applyScaling(items, scaleFactor) {
        for (const item of items) {
            // Сначала смещаем координаты к началу координат
            const relativeX = item.x - this.centerX;
            const relativeY = item.y - this.centerY;
            
            // Масштабируем
            const scaledX = relativeX * scaleFactor;
            const scaledY = relativeY * scaleFactor;
            
            // Возвращаем к центру
            item.x = this.centerX + scaledX;
            item.y = this.centerY + scaledY;
            
            // Масштабируем размеры объекта
            item.diameter *= scaleFactor;
            item.radius = item.diameter / 2;
            
            if (item.isBill) {
                item.width *= scaleFactor;
                item.height *= scaleFactor;
            }
        }
    }
}

/**
 * Улучшенная версия класса CoinPile, использующая алгоритм упаковки кругов
 */
class OptimizedCoinPile extends CoinPile {
    /**
     * Создает кучку монет с оптимизированной упаковкой
     * @param {string} containerId - ID HTML-контейнера для отображения
     * @param {number} targetAmount - Целевая сумма в центах
     * @param {number} containerWidth - Ширина контейнера
     * @param {number} containerHeight - Высота контейнера
     */
    constructor(containerId, targetAmount, containerWidth, containerHeight) {
        super(containerId, targetAmount, containerWidth, containerHeight);
        
        // Создаем упаковщик кругов для этой кучки
        this.packer = new CirclePacker(containerWidth, containerHeight);
    }
    
    /**
     * Размещает монеты в контейнере, используя оптимизированный алгоритм упаковки
     * @override
     */
    packCoins() {
        if (this.coins.length === 0) return;
        
        // Сортируем монеты по размеру (большие сначала) для лучшей упаковки
        this.coins.sort((a, b) => b.diameter - a.diameter);
        
        // Применяем алгоритм оптимальной упаковки
        this.packer.pack(this.coins);
        
        // Обновляем scaleFactor для совместимости с базовым классом
        this.scaleFactor = 1.0;
        
        // Проверяем, не выходит ли какой-либо объект за пределы контейнера
        for (const coin of this.coins) {
            const rect = coin.getBoundingRect();
            if (rect.left < 0 || rect.right > this.containerWidth || 
                rect.top < 0 || rect.bottom > this.containerHeight) {
                this.scaleFactor = 0.9; // Монеты выходят за пределы, был применен масштаб
                break;
            }
        }
    }
}

// Экспортируем класс для использования в других модулях
window.OptimizedCoinPile = OptimizedCoinPile;
window.CirclePacker = CirclePacker; 