# Посчитай кубики

Образовательная игра для развития пространственного мышления и навыков счета у детей.

![Превью игры](preview.png)

## Описание

"Посчитай кубики" - это интерактивная браузерная игра, в которой ребенку предлагается посчитать количество кубиков, расположенных на платформе в изометрической проекции. Игра развивает:

- Пространственное мышление
- Навыки счета
- Внимательность
- Логическое мышление

## Особенности

- Прогрессивная система уровней с увеличивающейся сложностью
- Изометрический 3D-вид для развития пространственного мышления
- Специальная кнопка "присядка" для временного уменьшения высоты кубиков, чтобы увидеть скрытые кубики
- Сохранение прогресса через URL-хеш (можно поделиться ссылкой на конкретный уровень)
- Разноцветные кубики для лучшего визуального восприятия
- Адаптация уровня сложности в зависимости от успехов ребенка

## Как играть

1. Внимательно рассмотрите 3D-сцену с кубиками
2. Посчитайте, сколько всего кубиков на платформе
3. Введите ваш ответ в поле и нажмите "Далее" или Enter
4. Используйте кнопку ⇅, если не уверены, видите ли вы все кубики (временно сжимает высоту для лучшего обзора)
5. После 3-х правильных ответов игра автоматически переходит на следующий уровень

## Технические детали

- Чистый JavaScript без внешних зависимостей
- HTML5 Canvas для отрисовки 3D-сцены
- Алгоритм проекции с учетом правильного отображения и перекрытия кубиков
- Адаптивный дизайн для различных размеров экрана
- Система предотвращения перекрытия высоких башен низкими для обеспечения видимости всех кубиков

## Установка и запуск

1. Клонируйте репозиторий:
```
git clone https://github.com/username/cube-counting-game.git
```

2. Откройте файл `cubes.html` в любом современном браузере

Поскольку игра не использует внешние зависимости и серверную часть, она полностью функциональна как есть, без дополнительной настройки.

### Запуск на iPad

Игра может быть запущена на iPad с помощью приложения [HTML Viewer Q](https://apps.apple.com/ru/app/html-viewer-q/id810042973) или аналогичных приложений для просмотра HTML-файлов:

1. Загрузите файл `cubes.html` в приложение через iTunes File Sharing или iCloud Drive
2. Откройте файл в приложении и наслаждайтесь игрой на мобильном устройстве

## Для разработчиков

Игра специально написана на чистом JavaScript без использования фреймворков, чтобы ее можно было легко модифицировать и расширять. Основные компоненты:

- Функции изометрического преобразования координат
- Алгоритм генерации башен с корректным расположением
- Система проверки и оценки ответов
- Механизм сохранения прогресса через URL-хеш

## Лицензия

MIT License

Copyright (c) 2023

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 