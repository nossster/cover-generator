const canvas = document.getElementById('iconCanvas');
const ctx = canvas.getContext('2d');
const iconSelect = document.getElementById('iconSelect');
const uploadBtn1 = document.getElementById('uploadBtn1');
const imageUpload1 = document.getElementById('imageUpload1');
const uploadBtn2 = document.getElementById('uploadBtn2');
const imageUpload2 = document.getElementById('imageUpload2');
const uploadBtn3 = document.getElementById('uploadBtn3');
const imageUpload3 = document.getElementById('imageUpload3');

const offscreenCanvasCache = new Map();
const filterColorTemplates = new Map();
const fallbackFilterTemplates = {
    red: 'rgba(255, 0, 0, $opacity)',
    green: 'rgba(0, 255, 0, $opacity)',
    blue: 'rgba(0, 0, 255, $opacity)',
    yellow: 'rgba(255, 255, 0, $opacity)',
    purple: 'rgba(128, 0, 128, $opacity)',
    orange: 'rgba(255, 165, 0, $opacity)'
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function resetContextState(context) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.filter = 'none';
    context.shadowColor = 'rgba(0, 0, 0, 0)';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
}

function getOffscreenCanvas(key, width, height) {
    let entry = offscreenCanvasCache.get(key);

    if (!entry) {
        const offscreen = document.createElement('canvas');
        entry = {
            canvas: offscreen,
            ctx: offscreen.getContext('2d')
        };
        offscreenCanvasCache.set(key, entry);
    }

    if (entry.canvas.width !== width || entry.canvas.height !== height) {
        entry.canvas.width = width;
        entry.canvas.height = height;
    }

    resetContextState(entry.ctx);
    entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height);

    return entry;
}

function hexToRgba(hex, alpha = 1) {
    if (typeof hex !== 'string') {
        return null;
    }

    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;

    if (normalized.length !== 6) {
        return null;
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    if ([r, g, b].some(Number.isNaN)) {
        return null;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveFilterColor(colorId, intensity, customColor) {
    const opacity = clamp(intensity ?? 0, 0, 1);

    if (colorId === 'none' || opacity === 0) {
        return null;
    }

    if (colorId === 'custom') {
        return hexToRgba(customColor, opacity) ?? customColor;
    }

    const template = filterColorTemplates.get(colorId) ?? fallbackFilterTemplates[colorId];

    if (!template) {
        return null;
    }

    return template.replace('$opacity', opacity);
}

function updateFilterTemplateCache() {
    filterColorTemplates.clear();

    const options = coverSettings?.defaultSettings?.filters?.options;

    if (!Array.isArray(options)) {
        return;
    }

    for (const option of options) {
        if (option?.id && option?.color) {
            filterColorTemplates.set(option.id, option.color);
        }
    }
}

// Объект для хранения настроек обложек, загружается из JSON
let coverSettings = null;

// Объект состояния приложения
const state = {
    coverType: 'type1', // Тип обложки по умолчанию
    selectedIcon: 'none', // Выбранная иконка
    logoColorValue: '#ffffff', // Цвет логотипа (иконки)
    logoColorBlendMode: 'multiply', // Режим наложения цвета логотипа
    logoColorIntensity: 0.5, // Интенсивность цвета логотипа
    logoOpacity: 1.0, // Прозрачность логотипа
    topLayerFilter: {
        color: 'none', // Цвет фильтра для верхнего слоя
        blendMode: 'overlay', // Режим наложения для фильтра
        intensity: 0.5, // Интенсивность фильтра
        customColor: '#ff0000' // Пользовательский цвет для фильтра
    },
    images: {
        background: null, // Фоновое изображение с маской
        topLayer: null, // Верхний слой (контур)
        icon: null, // Иконка
        topCustom: null, // Верхнее пользовательское изображение (logo)
        bottomCustom: null, // Нижнее пользовательское изображение (watermark)
        topMostCustom: null // Самое верхнее пользовательское изображение
    },
    // Настройки для позиционирования логотипа
    topCustomImage: {
        x: 0,
        y: 0,
        scale: 1.0,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        shadowEnabled: false
    },
    // Настройки для позиционирования нижнего изображения
    bottomCustomImage: {
        x: 0,
        y: 0,
        scale: 1.0,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        shadowEnabled: false
    },
    // Настройки для позиционирования самого верхнего изображения
    topMostCustomImage: {
        x: 0,
        y: 0,
        scale: 1.0,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        shadowEnabled: false
    },
    activeDragImage: null,
    activeHoverImage: null,
    // Флаги для отслеживания загрузки пользовательских изображений
    customBackgroundUploaded: false,
    customTopLayerUploaded: false,
    // Размеры холста для custom режима
    canvasSize: {
        width: 1024,
        height: 1024
    },
    // Настройки слоев
    topImageOpacity: 1.0, // Прозрачность верхнего изображения
    bottomImageOpacity: 1.0, // Прозрачность нижнего изображения
    blendMode: 'normal', // Режим наложения для основных изображений
    selectedFilter: 'none', // Выбранный фильтр
    filterOpacity: 0.7, // Прозрачность фильтра
    customColor: '#ff0000', // Пользовательский цвет для фильтра
    logoPositioningParams: null, // Параметры позиционирования логотипа
    topMostColorValue: '#000000', // Цвет для самого верхнего изображения
    topMostColorBlendMode: 'normal', // Режим наложения для самого верхнего изображения
    topMostColorIntensity: 1.0 // Интенсивность цвета для самого верхнего изображения
};

// Загрузка настроек из JSON файла
async function loadCoverSettings() {
    try {
        const response = await fetch('config/cover-settings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        coverSettings = await response.json();
        
        // Инициализируем настройки по умолчанию из загруженного JSON
        initializeDefaultSettings();
        
        // После загрузки настроек инициализируем приложение
        return true;
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        return false;
    }
}

// Инициализация настроек по умолчанию из JSON
function initializeDefaultSettings() {
    if (!coverSettings) return;

    updateFilterTemplateCache();

    // Применяем настройки фильтров
    const filterSettings = coverSettings.defaultSettings.filters;
    state.topLayerFilter.intensity = filterSettings.defaultIntensity;
    state.topLayerFilter.blendMode = filterSettings.defaultBlendMode;
    state.topLayerFilter.customColor = filterSettings.defaultCustomColor;
    
    // Применяем настройки логотипа
    const logoSettings = coverSettings.defaultSettings.logo;
    state.logoOpacity = logoSettings.defaultOpacity;
    state.logoColorValue = logoSettings.defaultColor;
    state.logoColorBlendMode = logoSettings.defaultBlendMode;
    state.logoColorIntensity = logoSettings.defaultIntensity;
    
    // Применяем настройки изображений
    const imageSettings = coverSettings.defaultSettings.images;
    state.topImageOpacity = imageSettings.defaultOpacity;
    state.bottomImageOpacity = imageSettings.defaultOpacity;
    
    // Устанавливаем параметры позиционирования для выбранного типа обложки
    updateLogoPositioningParams();
}

// Обновление параметров позиционирования в зависимости от типа обложки
function updateLogoPositioningParams() {
    if (!coverSettings) return;
    
    const coverType = state.coverType;
    const coverTypeSettings = coverSettings.coverTypes[coverType];
    
    if (coverTypeSettings && coverTypeSettings.logoPositioningParams) {
        state.logoPositioningParams = { ...coverTypeSettings.logoPositioningParams };
        
        // Обновляем upperBound на основе размера canvas
        if (canvas) {
            state.logoPositioningParams.upperBound = (canvas.height - state.logoPositioningParams.maxHeight) / 2;
        }
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function drawCanvas() {
    // При выборе custom типа и нажатии на кнопку применения размера
    // установим размеры canvas согласно введенным значениям
    if (state.coverType === 'custom') {
        canvas.width = state.canvasSize.width;
        canvas.height = state.canvasSize.height;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Создаем временный canvas для работы
    const { canvas: tempCanvas, ctx: tempCtx } = getOffscreenCanvas('temp', canvas.width, canvas.height);
    
    // Для кастомного типа обложки мы пропускаем создание маски и просто рисуем слои друг на друга
    if (state.coverType === 'custom') {
        // Если фон загружен, рисуем его
        if (state.images.background) {
            tempCtx.drawImage(state.images.background, 0, 0, tempCanvas.width, tempCanvas.height);
        } else {
            // Рисуем временный серый фон если фон не загружен
            tempCtx.fillStyle = "#e0e0e0";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Добавляем текст-подсказку
            tempCtx.fillStyle = "#888888";
            tempCtx.font = "bold 18px Arial";
            tempCtx.textAlign = "center";
            tempCtx.fillText("Загрузите фоновое изображение", tempCanvas.width/2, tempCanvas.height/2);
        }
        
        // Далее код для рисования остается без изменений...
    } else {
        // Сначала рисуем фон на временном canvas
        if (state.images.background) {
            tempCtx.drawImage(state.images.background, 0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Сохраняем маску из фона
        const { canvas: maskCanvas, ctx: maskCtx } = getOffscreenCanvas('mask', canvas.width, canvas.height);
        
        if (state.images.background) {
            maskCtx.drawImage(state.images.background, 0, 0, maskCanvas.width, maskCanvas.height);
        }
        
        // Рисуем фон
        if (state.images.background) {
            tempCtx.drawImage(state.images.background, 0, 0, tempCanvas.width, tempCanvas.height);
        }
    }
    
    // Рисуем нижнее пользовательское изображение (после фона)
    if (state.images.bottomCustom) {
        const { x, y, scale } = state.bottomCustomImage;
        const width = state.images.bottomCustom.width * scale;
        const height = state.images.bottomCustom.height * scale;
        
        // Применяем прозрачность, если она задана
        if (state.bottomImageOpacity !== undefined) {
            tempCtx.globalAlpha = state.bottomImageOpacity;
        }
        
        tempCtx.drawImage(state.images.bottomCustom, x, y, width, height);
        
        // Восстанавливаем прозрачность
        tempCtx.globalAlpha = 1.0;
    }
    
    // Рисуем верхний слой (контур) с применением фильтра если он выбран
    if (state.images.topLayer) {
        // Создаем отдельный canvas для верхнего слоя с фильтром
        const { canvas: topLayerCanvas, ctx: topLayerCtx } = getOffscreenCanvas('topLayer', canvas.width, canvas.height);

        // Рисуем верхний слой
        topLayerCtx.drawImage(state.images.topLayer, 0, 0, topLayerCanvas.width, topLayerCanvas.height);

        // Применяем цветовой фильтр, если он выбран
        const filterColor = resolveFilterColor(
            state.topLayerFilter.color,
            state.topLayerFilter.intensity,
            state.topLayerFilter.customColor
        );

        if (filterColor) {
            // Используем выбранный режим наложения
            topLayerCtx.globalCompositeOperation = state.topLayerFilter.blendMode;
            topLayerCtx.fillStyle = filterColor;
            topLayerCtx.fillRect(0, 0, topLayerCanvas.width, topLayerCanvas.height);

            // После применения цветового фильтра, возвращаем исходную прозрачность (альфа-канал)
            topLayerCtx.globalCompositeOperation = 'destination-in';
            topLayerCtx.drawImage(state.images.topLayer, 0, 0, topLayerCanvas.width, topLayerCanvas.height);

            // Возвращаем стандартный режим отрисовки
            topLayerCtx.globalCompositeOperation = 'source-over';
        }

        // Рисуем обработанный верхний слой на основной временный холст
        tempCtx.drawImage(topLayerCanvas, 0, 0);
    }
    
    // Рисуем верхнее пользовательское изображение
    if (state.images.topCustom) {
        const { x, y, scale, shadowEnabled } = state.topCustomImage;
        const width = state.images.topCustom.width * scale;
        const height = state.images.topCustom.height * scale;

        // Создаем отдельный canvas для логотипа с эффектами
        const { canvas: logoCanvas, ctx: logoCtx } = getOffscreenCanvas('logo', width + 80, height + 80);

        // Подготавливаем изображение с цветовым фильтром, если нужно
        const { canvas: processedImage, ctx: processedCtx } = getOffscreenCanvas('logoProcessed', width, height);

        // Применяем прозрачность, если она задана
        if (state.logoOpacity !== undefined) {
            processedCtx.globalAlpha = state.logoOpacity;
        }
        
        // Сначала рисуем оригинальное изображение
        processedCtx.drawImage(state.images.topCustom, 0, 0, width, height);
        
        // Восстанавливаем прозрачность
        processedCtx.globalAlpha = 1.0;

        // Применяем цветовой фильтр (наложение), если не normal
        if (state.logoColorBlendMode !== 'normal') {
            // Создаем временный canvas для цвета
            const { canvas: colorCanvas, ctx: colorCtx } = getOffscreenCanvas('logoColor', width, height);

            // Рисуем оригинальное изображение для получения маски
            colorCtx.drawImage(state.images.topCustom, 0, 0, width, height);

            // Применяем выбранный цвет только к непрозрачным пикселям
            colorCtx.globalCompositeOperation = 'source-in';

            // Анализируем цвет и корректируем с учетом интенсивности
            const logoColorIntensity = clamp(state.logoColorIntensity ?? 1, 0, 1);
            const overlayColor =
                logoColorIntensity < 1
                    ? hexToRgba(state.logoColorValue, logoColorIntensity) ?? state.logoColorValue
                    : state.logoColorValue;

            colorCtx.fillStyle = overlayColor;
            colorCtx.fillRect(0, 0, width, height);

            // Накладываем цвет на оригинал с выбранным режимом смешивания
            processedCtx.globalCompositeOperation = state.logoColorBlendMode;
            processedCtx.drawImage(colorCanvas, 0, 0);
            processedCtx.globalCompositeOperation = 'source-over';
        }

        // Если тень включена, применяем её
        if (shadowEnabled) {
            // Настраиваем тень используя параметры из конфигурации
            const shadowSettings = coverSettings?.defaultSettings?.logo || {
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 39,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            };
            
            logoCtx.shadowColor = shadowSettings.shadowColor;
            logoCtx.shadowBlur = shadowSettings.shadowBlur;
            logoCtx.shadowOffsetX = shadowSettings.shadowOffsetX;
            logoCtx.shadowOffsetY = shadowSettings.shadowOffsetY;
            
            // Рисуем обработанное изображение с тенью в центре логотипа canvas
            logoCtx.drawImage(processedImage, 40, 40);
        } else {
            // Рисуем без тени
            logoCtx.drawImage(processedImage, 40, 40);
        }
        
        // Рисуем canvas с логотипом и эффектами на основной холст
        tempCtx.drawImage(logoCanvas, x - 40, y - 40);
    }
    
    // Рисуем самое верхнее пользовательское изображение
    if (state.images.topMostCustom) {
        const { x, y, scale, shadowEnabled } = state.topMostCustomImage;
        const width = state.images.topMostCustom.width * scale;
        const height = state.images.topMostCustom.height * scale;

        // Создаем отдельный canvas для доп. картинки с эффектами
        const { canvas: topMostCanvas, ctx: topMostCtx } = getOffscreenCanvas('topMost', width + 80, height + 80);

        // Подготавливаем изображение с цветовым фильтром, если нужно
        const { canvas: processedTopMost, ctx: processedTopMostCtx } = getOffscreenCanvas('topMostProcessed', width, height);

        // Применяем прозрачность, если она задана
        if (state.topImageOpacity !== undefined) {
            processedTopMostCtx.globalAlpha = state.topImageOpacity;
        }
        
        // Сначала рисуем оригинальное изображение
        processedTopMostCtx.drawImage(state.images.topMostCustom, 0, 0, width, height);
        
        // Восстанавливаем прозрачность
        processedTopMostCtx.globalAlpha = 1.0;
        
        // Применяем цветовой фильтр (наложение), если не normal
        if (state.topMostColorBlendMode !== 'normal') {
            // Создаем временный canvas для цвета
            const { canvas: colorCanvas, ctx: colorCtx } = getOffscreenCanvas('topMostColor', width, height);

            // Рисуем оригинальное изображение для получения маски
            colorCtx.drawImage(state.images.topMostCustom, 0, 0, width, height);

            // Применяем выбранный цвет только к непрозрачным пикселям
            colorCtx.globalCompositeOperation = 'source-in';

            // Анализируем цвет и корректируем с учетом интенсивности
            const topMostIntensity = clamp(state.topMostColorIntensity ?? 1, 0, 1);
            const topMostColor =
                topMostIntensity < 1
                    ? hexToRgba(state.topMostColorValue, topMostIntensity) ?? state.topMostColorValue
                    : state.topMostColorValue;

            colorCtx.fillStyle = topMostColor;
            colorCtx.fillRect(0, 0, width, height);

            // Накладываем цвет на оригинал с выбранным режимом смешивания
            processedTopMostCtx.globalCompositeOperation = state.topMostColorBlendMode;
            processedTopMostCtx.drawImage(colorCanvas, 0, 0);
            processedTopMostCtx.globalCompositeOperation = 'source-over';
        }
        
        // Если тень включена, применяем её
        if (shadowEnabled) {
            // Настраиваем тень используя параметры из конфигурации
            const shadowSettings = coverSettings?.defaultSettings?.logo || {
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 39,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            };
            
            topMostCtx.shadowColor = shadowSettings.shadowColor;
            topMostCtx.shadowBlur = shadowSettings.shadowBlur;
            topMostCtx.shadowOffsetX = shadowSettings.shadowOffsetX;
            topMostCtx.shadowOffsetY = shadowSettings.shadowOffsetY;
            
            // Рисуем обработанное изображение с тенью в центре canvas
            topMostCtx.drawImage(processedTopMost, 40, 40);
        } else {
            // Рисуем без тени
            topMostCtx.drawImage(processedTopMost, 40, 40);
        }
        
        // Рисуем canvas с доп. картинкой и эффектами на основной холст
        tempCtx.drawImage(topMostCanvas, x - 40, y - 40);
    }
    
    // Рисуем иконку (поверх всех изображений)
    if (state.images.icon) {
        tempCtx.drawImage(state.images.icon, 0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    // Финальный рендеринг отличается для кастомного типа и стандартных
    if (state.coverType === 'custom') {
        // Для кастомного типа проверяем, загружен ли фон
        if (state.images.background && state.customBackgroundUploaded) {
            // Если фон с маской загружен пользователем, применяем маскирование
            const { canvas: resultCanvas, ctx: resultCtx } = getOffscreenCanvas('result', canvas.width, canvas.height);

            // Создаем маску из загруженного фона
            const { canvas: maskCanvas, ctx: maskCtx } = getOffscreenCanvas('maskResult', canvas.width, canvas.height);

            // Рисуем маску на весь канвас
            maskCtx.drawImage(state.images.background, 0, 0, maskCanvas.width, maskCanvas.height);

            // Копируем маску в результирующий канвас
            resultCtx.drawImage(maskCanvas, 0, 0);
            
            // Применяем режим маскирования
            resultCtx.globalCompositeOperation = 'source-in';
            
            // Рисуем все слои через маску
            resultCtx.drawImage(tempCanvas, 0, 0);
            
            // Выводим результат на основной холст
            ctx.drawImage(resultCanvas, 0, 0);
        } else {
            // Если фон не загружен, просто копируем временный canvas на основной
            ctx.drawImage(tempCanvas, 0, 0);
        }
    } else {
        // Для стандартных типов применяем маску
        const { canvas: resultCanvas, ctx: resultCtx } = getOffscreenCanvas('result', canvas.width, canvas.height);

        // Рисуем маску
        const { canvas: maskCanvas, ctx: maskCtx } = getOffscreenCanvas('maskResult', canvas.width, canvas.height);
        
        if (state.images.background) {
            maskCtx.drawImage(state.images.background, 0, 0, maskCanvas.width, maskCanvas.height);
        }
        
        resultCtx.drawImage(maskCanvas, 0, 0);
        
        // Применяем режим маскирования
        resultCtx.globalCompositeOperation = 'source-in';
        
        // Рисуем все слои через маску
        resultCtx.drawImage(tempCanvas, 0, 0);
        
        // Выводим результат на основной холст
        ctx.drawImage(resultCanvas, 0, 0);
    }
    
    // Если у нас есть активное изображение под курсором, рисуем рамку вокруг него
    if (state.activeHoverImage) {
        let imageObj, imageState;
        
        if (state.activeHoverImage === 'top' && state.images.topCustom) {
            imageObj = state.images.topCustom;
            imageState = state.topCustomImage;
        } else if (state.activeHoverImage === 'bottom' && state.images.bottomCustom) {
            imageObj = state.images.bottomCustom;
            imageState = state.bottomCustomImage;
        } else if (state.activeHoverImage === 'topmost' && state.images.topMostCustom) {
            imageObj = state.images.topMostCustom;
            imageState = state.topMostCustomImage;
        } else {
            return; // Если изображение не найдено, выходим
        }
        
        const { x, y, scale } = imageState;
        const width = imageObj.width * scale;
        const height = imageObj.height * scale;
        
        // Рисуем рамку с цветом, зависящим от типа изображения
        if (state.activeHoverImage === 'top') {
            ctx.strokeStyle = '#db4437'; // Красный для логотипа
        } else if (state.activeHoverImage === 'bottom') {
            ctx.strokeStyle = '#0f9d58'; // Зеленый для фона
        } else if (state.activeHoverImage === 'topmost') {
            ctx.strokeStyle = '#f4b400'; // Желтый для верхнего слоя
        }
        
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
    }
}
