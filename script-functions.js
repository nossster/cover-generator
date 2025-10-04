// Функция для заполнения выпадающих списков из конфигурации
function populateSelectOptionsFromConfig() {
    if (!coverSettings) return;
    
    // Заполняем список типов обложек
    const coverTypeSelect = document.getElementById('coverTypeSelect');
    if (coverTypeSelect) {
        // Очищаем текущие опции
        coverTypeSelect.innerHTML = '';
        
        // Добавляем опции из конфигурации
        Object.entries(coverSettings.coverTypes).forEach(([typeId, typeData]) => {
            const optionElement = document.createElement('option');
            optionElement.value = typeId;
            optionElement.textContent = typeData.name || typeId;
            if (typeId === state.coverType) {
                optionElement.selected = true;
            }
            coverTypeSelect.appendChild(optionElement);
        });
    }
    
    // Заполняем список фильтров
    const topLayerColorFilter = document.getElementById('topLayerColorFilter');
    if (topLayerColorFilter) {
        // Очищаем текущие опции
        topLayerColorFilter.innerHTML = '';
        
        // Добавляем опции из конфигурации
        const filterOptions = coverSettings.defaultSettings.filters.options;
        filterOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            if (option.id === 'none') {
                optionElement.selected = true;
            }
            topLayerColorFilter.appendChild(optionElement);
        });
    }
    
    // Заполняем список режимов смешивания для фильтра
    const filterBlendMode = document.getElementById('filterBlendMode');
    if (filterBlendMode) {
        // Очищаем текущие опции
        filterBlendMode.innerHTML = '';
        
        // Добавляем опции из конфигурации
        const blendModes = coverSettings.defaultSettings.filters.blendModes;
        blendModes.forEach(mode => {
            const optionElement = document.createElement('option');
            optionElement.value = mode.id;
            optionElement.textContent = mode.name;
            if (mode.id === coverSettings.defaultSettings.filters.defaultBlendMode) {
                optionElement.selected = true;
            }
            filterBlendMode.appendChild(optionElement);
        });
    }
    
    // Заполняем список режимов смешивания для логотипа
    const logoColorBlendMode = document.getElementById('logoColorBlendMode');
    if (logoColorBlendMode) {
        // Очищаем текущие опции
        logoColorBlendMode.innerHTML = '';
        
        // Добавляем опции из конфигурации
        const blendModes = coverSettings.defaultSettings.logo.blendModes;
        blendModes.forEach(mode => {
            const optionElement = document.createElement('option');
            optionElement.value = mode.id;
            optionElement.textContent = mode.name;
            if (mode.id === coverSettings.defaultSettings.logo.defaultBlendMode) {
                optionElement.selected = true;
            }
            logoColorBlendMode.appendChild(optionElement);
        });
    }
    
    // Заполняем список режимов смешивания для доп. картинки
    const topMostColorBlendMode = document.getElementById('topMostColorBlendMode');
    if (topMostColorBlendMode) {
        // Очищаем текущие опции
        topMostColorBlendMode.innerHTML = '';
        
        // Добавляем опции из конфигурации
        const blendModes = coverSettings.defaultSettings.logo.blendModes;
        blendModes.forEach(mode => {
            const optionElement = document.createElement('option');
            optionElement.value = mode.id;
            optionElement.textContent = mode.name;
            if (mode.id === coverSettings.defaultSettings.logo.defaultBlendMode) {
                optionElement.selected = true;
            }
            topMostColorBlendMode.appendChild(optionElement);
        });
    }
}

// Функция для обновления состояния и перерисовки канваса
function updateParamAndDraw(param, value) {
    // Обновляем соответствующий параметр в объекте state
    if (param.includes('.')) {
        const [obj, prop] = param.split('.');
        state[obj][prop] = value;
    } else {
        state[param] = value;
    }
    
    // Перерисовываем канвас
    drawCanvas();
}

// Проверяем, на каком изображении произошел клик
function checkImageClick(x, y) {
    // Проверяем сначала самое верхнее изображение (чтобы его можно было перетаскивать поверх других)
    if (state.images.topMostCustom) {
        const { x: imgX, y: imgY, scale } = state.topMostCustomImage;
        const imgWidth = state.images.topMostCustom.width * scale;
        const imgHeight = state.images.topMostCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            state.activeDragImage = 'topmost';
            state.topMostCustomImage.isDragging = true;
            state.topMostCustomImage.lastX = x;
            state.topMostCustomImage.lastY = y;
            return true;
        }
    }
    
    // Затем проверяем верхнее изображение (логотип)
    if (state.images.topCustom) {
        const { x: imgX, y: imgY, scale } = state.topCustomImage;
        const imgWidth = state.images.topCustom.width * scale;
        const imgHeight = state.images.topCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            state.activeDragImage = 'top';
            state.topCustomImage.isDragging = true;
            state.topCustomImage.lastX = x;
            state.topCustomImage.lastY = y;
            return true;
        }
    }
    
    // Проверяем нижнее изображение (фон)
    if (state.images.bottomCustom) {
        const { x: imgX, y: imgY, scale } = state.bottomCustomImage;
        const imgWidth = state.images.bottomCustom.width * scale;
        const imgHeight = state.images.bottomCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            state.activeDragImage = 'bottom';
            state.bottomCustomImage.isDragging = true;
            state.bottomCustomImage.lastX = x;
            state.bottomCustomImage.lastY = y;
            return true;
        }
    }
    
    return false;
}

// Получаем изображение под курсором (для подсветки)
function getImageUnderCursor(x, y) {
    // Проверяем сначала самое верхнее изображение
    if (state.images.topMostCustom && state.topMostCustomImage) {
        const { x: imgX, y: imgY, scale } = state.topMostCustomImage;
        const imgWidth = state.images.topMostCustom.width * scale;
        const imgHeight = state.images.topMostCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            return 'topmost';
        }
    }
    
    // Затем проверяем верхнее изображение (логотип)
    if (state.images.topCustom && state.topCustomImage) {
        const { x: imgX, y: imgY, scale } = state.topCustomImage;
        const imgWidth = state.images.topCustom.width * scale;
        const imgHeight = state.images.topCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            return 'top';
        }
    }
    
    // Проверяем нижнее изображение (фон)
    if (state.images.bottomCustom && state.bottomCustomImage) {
        const { x: imgX, y: imgY, scale } = state.bottomCustomImage;
        const imgWidth = state.images.bottomCustom.width * scale;
        const imgHeight = state.images.bottomCustom.height * scale;
        
        if (
            x >= imgX && 
            x <= imgX + imgWidth && 
            y >= imgY && 
            y <= imgY + imgHeight
        ) {
            return 'bottom';
        }
    }
    
    return null;
}

// Функция для горизонтального перемещения логотипа
function moveLogoHorizontal(step) {
    // Получаем текущие параметры логотипа
    const { scale } = state.topCustomImage;
    const width = state.images.topCustom.width * scale;
    
    // Рассчитываем новую позицию
    let newX = state.topCustomImage.x + step;
    
    // Ограничиваем горизонтальное перемещение
    newX = Math.max(0, Math.min(newX, canvas.width - width));
    
    // Применяем новую позицию
    state.topCustomImage.x = newX;
    
    // Обновляем canvas
    drawCanvas();
}

// Функция для вертикального перемещения логотипа
function moveLogoVertical(step) {
    // Получаем текущие параметры логотипа
    const { scale } = state.topCustomImage;
    const height = state.images.topCustom.height * scale;
    
    // Рассчитываем новую позицию
    let newY = state.topCustomImage.y + step;
    
    // Используем параметры из logoPositioningParams
    const upperBound = state.logoPositioningParams.upperBound;
    const maxHeight = state.logoPositioningParams.maxHeight;
    const verticalOffset = state.logoPositioningParams.verticalOffset;
    
    // Ограничиваем вертикальное перемещение в пределах области
    const effectiveUpperBound = upperBound + verticalOffset;
    const lowerBound = effectiveUpperBound + maxHeight - height;
    newY = Math.max(effectiveUpperBound, Math.min(newY, lowerBound));
    
    // Применяем новую позицию
    state.topCustomImage.y = newY;
    
    // Обновляем canvas
    drawCanvas();
}

async function updateIcon(iconType) {
    try {
        if (iconType === 'none') {
            state.images.icon = null;
            drawCanvas();
        } else {
            // Используем директорию из текущего типа обложки
            const imgFolder = coverSettings?.coverTypes[state.coverType]?.imageFolder || 
                (state.coverType === 'type1' ? './img/' : './img2/');
            
            state.images.icon = await loadImage(`${imgFolder}${iconType}.png`);
            drawCanvas();
        }
    } catch (error) {
        console.error('Ошибка при загрузке иконки:', error);
    }
}

// Загрузка изображений для выбранного типа обложки
async function loadCoverImages() {
    try {
        const imgFolder = coverSettings?.coverTypes[state.coverType]?.imageFolder || 
            (state.coverType === 'type1' ? './img/' : './img2/');
        const backgroundImage = coverSettings?.coverTypes[state.coverType]?.backgroundImage || 'Bgiconsize.png';
        const topLayerImage = coverSettings?.coverTypes[state.coverType]?.topLayerImage || 'Toplayer.png';
        
        // Загружаем фоновое изображение и верхний слой
        state.images.background = await loadImage(imgFolder + backgroundImage);
        state.images.topLayer = await loadImage(imgFolder + topLayerImage);
        
        // Обновляем иконку, если она выбрана
        if (state.selectedIcon !== 'none') {
            await updateIcon(state.selectedIcon);
        }
        
        // Обновляем canvas
        drawCanvas();
    } catch (error) {
        console.error('Ошибка при загрузке изображений для типа обложки:', error);
    }
}
