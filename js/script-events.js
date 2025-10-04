// Функция для настройки обработчиков событий
function setupEventListeners() {
    // Обработчики для выбора типа обложки и иконки
    const coverTypeSelect = document.getElementById('coverTypeSelect');
    const iconSelect = document.getElementById('iconSelect');
    
    // Обработчик выбора иконки
    iconSelect.addEventListener('change', (e) => {
        state.selectedIcon = e.target.value;
        updateIcon(state.selectedIcon);
    });
    
    // Обработчик выбора типа обложки
    coverTypeSelect.addEventListener('change', async (e) => {
        state.coverType = e.target.value;
        
        // Сбрасываем загруженные пользовательские изображения
        state.images.bottomCustom = null;
        state.images.topCustom = null;
        state.images.topMostCustom = null;
        
        // Обновляем интерфейс и скрываем настройки
        document.getElementById('settingsPanel').classList.add('d-none');
        
        // Обновляем параметры позиционирования для выбранного типа обложки
        updateLogoPositioningParams();
        
        // Если выбран кастомный тип, показываем кнопки загрузки и скрываем выбор иконки
        if (state.coverType === 'custom') {
            // Деактивируем выбор иконки для кастомного типа
            iconSelect.disabled = true;
            iconSelect.value = 'none';
            state.selectedIcon = 'none';
            state.images.icon = null;
            
            // Сбрасываем фоновое изображение и верхний слой
            state.images.background = null;
            state.images.topLayer = null;
            
            drawCanvas();
        } else {
            // Активируем выбор иконки для стандартных типов
            iconSelect.disabled = false;
            
            // Загружаем изображения для выбранного типа обложки
            try {
                const imgFolder = coverSettings?.coverTypes[state.coverType]?.imageFolder || 
                    (state.coverType === 'type1' ? './img/' : './img2/');
                const backgroundImage = coverSettings?.coverTypes[state.coverType]?.backgroundImage || 'Bgiconsize.png';
                const topLayerImage = coverSettings?.coverTypes[state.coverType]?.topLayerImage || 'Toplayer.png';
                
                state.images.background = await loadImage(imgFolder + backgroundImage);
                state.images.topLayer = await loadImage(imgFolder + topLayerImage);
                await updateIcon(state.selectedIcon);
                
                drawCanvas();
            } catch (error) {
                console.error('Ошибка при загрузке изображений для типа обложки:', error);
            }
        }
    });
    
    // Обработчики для загрузки изображений
    const uploadBtn1 = document.getElementById('uploadBtn1');
    const imageUpload1 = document.getElementById('imageUpload1');
    const uploadBtn2 = document.getElementById('uploadBtn2');
    const imageUpload2 = document.getElementById('imageUpload2');
    const uploadBtn3 = document.getElementById('uploadBtn3');
    const imageUpload3 = document.getElementById('imageUpload3');
    
    uploadBtn1.addEventListener('click', () => {
        imageUpload1.click();
    });

    uploadBtn2.addEventListener('click', () => {
        imageUpload2.click();
        
        // Активируем вкладку настроек логотипа при загрузке логотипа
        document.getElementById('settingsPanel').classList.remove('d-none');
        document.getElementById('logo-tab').click();
    });

    uploadBtn3.addEventListener('click', () => {
        imageUpload3.click();
        
        // Активируем вкладку настроек доп. картинки при загрузке доп. картинки
        document.getElementById('settingsPanel').classList.remove('d-none');
        document.getElementById('topmost-tab').click();
    });

    imageUpload1.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 600;
                    const maxHeight = 900;
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height) * 0.8;
                    
                    state.images.bottomCustom = img;
                    
                    state.bottomCustomImage = {
                        x: (canvas.width - img.width * scale) / 2,
                        y: (canvas.height - img.height * scale) / 2,
                        scale: scale,
                        isDragging: false,
                        lastX: 0,
                        lastY: 0
                    };
                    
                    drawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    imageUpload2.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Используем параметры из state.logoPositioningParams
                    const maxWidth = state.logoPositioningParams.maxWidth;
                    const maxHeight = state.logoPositioningParams.maxHeight;
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    
                    state.images.topCustom = img;
                    
                    // Центрирование с учетом параметров позиционирования
                    const upperBound = state.logoPositioningParams.upperBound;
                    const verticalOffset = state.logoPositioningParams.verticalOffset;
                    
                    state.topCustomImage = {
                        x: (canvas.width - img.width * scale) / 2, // Центрирование по горизонтали
                        y: upperBound + (state.logoPositioningParams.maxHeight - img.height * scale) / 2 + verticalOffset,
                        scale: scale,
                        isDragging: false,
                        lastX: 0,
                        lastY: 0,
                        shadowEnabled: state.topCustomImage.shadowEnabled
                    };
                    
                    drawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    imageUpload3.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 600;
                    const maxHeight = 900;
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height) * 0.8;
                    
                    state.images.topMostCustom = img;
                    
                    // Инициализируем объект с параметрами, если он не существует
                    if (!state.topMostCustomImage) {
                        state.topMostCustomImage = {
                            x: 0,
                            y: 0,
                            scale: 1.0,
                            isDragging: false,
                            lastX: 0,
                            lastY: 0,
                            shadowEnabled: false
                        };
                    }
                    
                    state.topMostCustomImage = {
                        x: (canvas.width - img.width * scale) / 2,
                        y: (canvas.height - img.height * scale) / 2,
                        scale: scale,
                        isDragging: false,
                        lastX: 0,
                        lastY: 0,
                        shadowEnabled: state.topMostCustomImage ? state.topMostCustomImage.shadowEnabled : false
                    };
                    
                    drawCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Обработчики для кнопок сохранения
    const saveManual = document.getElementById('saveManual');
    const saveBlobUrl = document.getElementById('saveBlobUrl');
    const saveDataUrl = document.getElementById('saveDataUrl');
    
    saveManual.addEventListener('click', () => {
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', 'game-cover.png');
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            downloadLink.setAttribute('href', url);
            downloadLink.click();
            URL.revokeObjectURL(url);
        });
    });
    
    saveBlobUrl.addEventListener('click', () => {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const newTab = window.open();
            newTab.location.href = url;
        });
    });
    
    saveDataUrl.addEventListener('click', () => {
        const dataUrl = canvas.toDataURL('image/png');
        const newTab = window.open();
        newTab.document.write(`<img src="${dataUrl}" alt="Game Cover">`);
    });
    
    // Обработчики перетаскивания и масштабирования изображений
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Проверяем, кликнули ли на какое-то изображение
        checkImageClick(x, y);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Перемещение при перетаскивании
        if (state.activeDragImage) {
            let imageState;
            
            if (state.activeDragImage === 'top') {
                imageState = state.topCustomImage;
            } else if (state.activeDragImage === 'bottom') {
                imageState = state.bottomCustomImage;
            } else if (state.activeDragImage === 'topmost') {
                imageState = state.topMostCustomImage;
            }
            
            if (imageState && imageState.isDragging) {
                const dx = x - imageState.lastX;
                const dy = y - imageState.lastY;
                
                imageState.x += dx;
                imageState.y += dy;
                
                imageState.lastX = x;
                imageState.lastY = y;
                
                drawCanvas();
            }
        }
        
        // Подсветка изображения под курсором (если не перетаскиваем)
        if (!state.activeDragImage) {
            const hoveredImage = getImageUnderCursor(x, y);
            
            if (hoveredImage !== state.activeHoverImage) {
                state.activeHoverImage = hoveredImage;
                drawCanvas();
            }
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        // Прекращаем перетаскивание
        if (state.activeDragImage) {
            if (state.activeDragImage === 'top') {
                state.topCustomImage.isDragging = false;
            } else if (state.activeDragImage === 'bottom') {
                state.bottomCustomImage.isDragging = false;
            } else if (state.activeDragImage === 'topmost') {
                state.topMostCustomImage.isDragging = false;
            }
            
            state.activeDragImage = null;
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        // Прекращаем перетаскивание и убираем подсветку при выходе курсора с холста
        if (state.activeDragImage) {
            if (state.activeDragImage === 'top') {
                state.topCustomImage.isDragging = false;
            } else if (state.activeDragImage === 'bottom') {
                state.bottomCustomImage.isDragging = false;
            } else if (state.activeDragImage === 'topmost') {
                state.topMostCustomImage.isDragging = false;
            }
            
            state.activeDragImage = null;
        }
        
        // Убираем подсветку
        if (state.activeHoverImage) {
            state.activeHoverImage = null;
            drawCanvas();
        }
    });
    
    // Масштабирование колесиком мыши
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        // Проверяем, над каким изображением находится курсор
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const hoveredImage = getImageUnderCursor(x, y);
        
        if (hoveredImage) {
            // Определяем шаг масштабирования
            const scaleFactor = e.shiftKey ? 0.01 : 0.05;
            const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
            
            // Применяем масштабирование к нужному изображению
            if (hoveredImage === 'top' && state.images.topCustom) {
                state.topCustomImage.scale = Math.max(0.1, state.topCustomImage.scale + delta);
            } else if (hoveredImage === 'bottom' && state.images.bottomCustom) {
                state.bottomCustomImage.scale = Math.max(0.1, state.bottomCustomImage.scale + delta);
            } else if (hoveredImage === 'topmost' && state.images.topMostCustom) {
                state.topMostCustomImage.scale = Math.max(0.1, state.topMostCustomImage.scale + delta);
            }
            
            drawCanvas();
        }
    });
    
    // Добавляем обработчик клавиатуры для перемещения логотипа стрелками
    document.addEventListener('keydown', (e) => {
        // Проверяем, что загружен логотип
        if (!state.images.topCustom) return;
        
        // Определяем размер шага: 1px с Shift, 5px без Shift
        const step = e.shiftKey ? 1 : 5;
        
        // Определяем, какая стрелка была нажата
        switch (e.key) {
            case 'ArrowLeft':
                // Перемещаем логотип влево
                moveLogoHorizontal(-step);
                e.preventDefault(); // Предотвращаем скроллинг страницы
                break;
            case 'ArrowRight':
                // Перемещаем логотип вправо
                moveLogoHorizontal(step);
                e.preventDefault();
                break;
            case 'ArrowUp':
                // Перемещаем логотип вверх
                moveLogoVertical(-step);
                e.preventDefault();
                break;
            case 'ArrowDown':
                // Перемещаем логотип вниз
                moveLogoVertical(step);
                e.preventDefault();
                break;
        }
    });
    
    // Обработчики для фильтра цвета верхнего слоя
    const topLayerColorFilter = document.getElementById('topLayerColorFilter');
    const customColorContainer = document.getElementById('customColorContainer');
    const customTopLayerColor = document.getElementById('customTopLayerColor');
    const filterOptionsContainer = document.getElementById('filterOptionsContainer');
    const filterIntensity = document.getElementById('filterIntensity');
    const filterIntensityValue = document.getElementById('filterIntensityValue');
    const filterBlendMode = document.getElementById('filterBlendMode');
    
    topLayerColorFilter.addEventListener('change', (e) => {
        state.topLayerFilter.color = e.target.value;
        
        // Показываем или скрываем селектор пользовательского цвета
        if (e.target.value === 'custom') {
            customColorContainer.classList.remove('d-none');
        } else {
            customColorContainer.classList.add('d-none');
        }
        
        // Показываем дополнительные настройки фильтра, если выбран фильтр
        if (e.target.value === 'none') {
            filterOptionsContainer.classList.add('d-none');
        } else {
            filterOptionsContainer.classList.remove('d-none');
            // Активируем вкладку с фильтрами при выборе фильтра
            document.getElementById('settingsPanel').classList.remove('d-none');
            document.getElementById('filters-tab').click();
        }
        
        drawCanvas();
    });
    
    customTopLayerColor.addEventListener('input', (e) => {
        state.topLayerFilter.customColor = e.target.value;
        drawCanvas();
    });
    
    filterIntensity.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.topLayerFilter.intensity = value / 100;
        filterIntensityValue.textContent = value + '%';
        drawCanvas();
    });
    
    filterBlendMode.addEventListener('change', (e) => {
        state.topLayerFilter.blendMode = e.target.value;
        drawCanvas();
    });

    // Обработчик для включения/выключения тени логотипа
    const logoShadowEnabled = document.getElementById('logoShadowEnabled');
    logoShadowEnabled.addEventListener('change', (e) => {
        state.topCustomImage.shadowEnabled = e.target.checked;
        drawCanvas();
    });

    // Обработчики для настроек цвета логотипа
    const logoColorPicker = document.getElementById('logoColorPicker');
    const logoColorBlendMode = document.getElementById('logoColorBlendMode');
    const logoColorIntensity = document.getElementById('logoColorIntensity');
    const logoColorIntensityValue = document.getElementById('logoColorIntensityValue');
    
    logoColorPicker.addEventListener('input', (e) => {
        state.logoColorValue = e.target.value;
        drawCanvas();
    });
    
    logoColorBlendMode.addEventListener('change', (e) => {
        state.logoColorBlendMode = e.target.value;
        drawCanvas();
    });
    
    logoColorIntensity.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.logoColorIntensity = value / 100;
        logoColorIntensityValue.textContent = value + '%';
        drawCanvas();
    });

    // Обработчики для настроек доп. картинки
    const topMostShadowEnabled = document.getElementById('topMostShadowEnabled');
    const topMostColorPicker = document.getElementById('topMostColorPicker');
    const topMostColorBlendMode = document.getElementById('topMostColorBlendMode');
    const topMostColorIntensity = document.getElementById('topMostColorIntensity');
    const topMostColorIntensityValue = document.getElementById('topMostColorIntensityValue');
    
    topMostShadowEnabled.addEventListener('change', (e) => {
        state.topMostCustomImage.shadowEnabled = e.target.checked;
        drawCanvas();
    });
    
    topMostColorPicker.addEventListener('input', (e) => {
        state.topMostColorValue = e.target.value;
        drawCanvas();
    });
    
    topMostColorBlendMode.addEventListener('change', (e) => {
        state.topMostColorBlendMode = e.target.value;
        drawCanvas();
    });
    
    topMostColorIntensity.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.topMostColorIntensity = value / 100;
        topMostColorIntensityValue.textContent = value + '%';
        drawCanvas();
    });

    // Сброс настроек логотипа
    document.getElementById('resetLogoSettings').addEventListener('click', () => {
        if (!coverSettings) return;
        
        const logoSettings = coverSettings.defaultSettings.logo;
        
        // Сбрасываем значения в состоянии
        state.topCustomImage.shadowEnabled = false;
        state.logoColorValue = logoSettings.defaultColor;
        state.logoColorBlendMode = logoSettings.defaultBlendMode;
        state.logoColorIntensity = logoSettings.defaultIntensity;
        
        // Обновляем элементы интерфейса
        logoShadowEnabled.checked = false;
        logoColorPicker.value = logoSettings.defaultColor;
        logoColorBlendMode.value = logoSettings.defaultBlendMode;
        logoColorIntensity.value = logoSettings.defaultIntensity * 100;
        logoColorIntensityValue.textContent = (logoSettings.defaultIntensity * 100) + '%';
        
        drawCanvas();
    });
    
    // Сброс настроек дополнительной картинки
    document.getElementById('resetTopMostSettings').addEventListener('click', () => {
        if (!coverSettings) return;
        
        const logoSettings = coverSettings.defaultSettings.logo;
        
        // Сбрасываем значения в состоянии
        state.topMostCustomImage.shadowEnabled = false;
        state.topMostColorValue = logoSettings.defaultColor;
        state.topMostColorBlendMode = logoSettings.defaultBlendMode;
        state.topMostColorIntensity = logoSettings.defaultIntensity;
        
        // Обновляем элементы интерфейса
        topMostShadowEnabled.checked = false;
        topMostColorPicker.value = logoSettings.defaultColor;
        topMostColorBlendMode.value = logoSettings.defaultBlendMode;
        topMostColorIntensity.value = logoSettings.defaultIntensity * 100;
        topMostColorIntensityValue.textContent = (logoSettings.defaultIntensity * 100) + '%';
        
        drawCanvas();
    });

    // Настройка центрирования и размера логотипа
    const logoCenter = document.getElementById('logo-center');
    const logoRecommendedSize = document.getElementById('logo-recommended-size');
    
    logoCenter.addEventListener('click', () => {
        if (!state.images.topCustom) return;
        
        // Центрируем логотип только по горизонтали, не трогая вертикальную позицию
        state.topCustomImage.x = (canvas.width - state.images.topCustom.width * state.topCustomImage.scale) / 2;
        
        drawCanvas();
    });
    
    logoRecommendedSize.addEventListener('click', () => {
        if (!state.images.topCustom || !state.logoPositioningParams) return;
        
        // Получаем параметры из конфига
        const { maxWidth, maxHeight, upperBound, verticalOffset } = state.logoPositioningParams;
        
        // Вычисляем масштаб для рекомендуемых размеров
        const scale = Math.min(
            maxWidth / state.images.topCustom.width,
            maxHeight / state.images.topCustom.height
        );
        
        // Применяем новый масштаб
        state.topCustomImage.scale = scale;
        
        // Центрируем логотип горизонтально
        state.topCustomImage.x = (canvas.width - state.images.topCustom.width * scale) / 2;
        
        // Устанавливаем вертикальную позицию точно по параметрам из конфига
        state.topCustomImage.y = upperBound + verticalOffset;
        
        drawCanvas();
    });

    // Обработчики для слайдеров и настроек изображений
    const addEventListenerIfExists = (elementId, eventType, handler) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
        }
    };

    addEventListenerIfExists('logoOpacity', 'input', function() {
        updateParamAndDraw('logoOpacity', this.value / 100);
        const valueElement = document.getElementById('logoOpacityValue');
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
    });

    addEventListenerIfExists('logoScale', 'input', function() {
        const scale = parseFloat(this.value) / 100;
        updateParamAndDraw('logo.scale', scale);
        const valueElement = document.getElementById('logoScaleValue');
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
    });

    addEventListenerIfExists('logoShadowOpacity', 'input', function() {
        updateParamAndDraw('logoShadowOpacity', this.value / 100);
        const valueElement = document.getElementById('logoShadowOpacityValue');
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
    });

    addEventListenerIfExists('topImageOpacity', 'input', function() {
        updateParamAndDraw('topImageOpacity', this.value / 100);
        const valueElement = document.getElementById('topImageOpacityValue');
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
    });

    addEventListenerIfExists('blendMode', 'change', function() {
        updateParamAndDraw('blendMode', this.value);
    });

    addEventListenerIfExists('filters', 'change', function() {
        const selectedFilter = this.value;
        updateParamAndDraw('selectedFilter', selectedFilter);
        
        // Показываем/скрываем селектор цвета в зависимости от выбранного фильтра
        if (selectedFilter === 'custom' && customColorContainer) {
            customColorContainer.classList.remove('d-none');
            // Активируем вкладку фильтров
            const filterTabBtn = document.getElementById('filterTabBtn');
            if (filterTabBtn) {
                filterTabBtn.click();
            }
        } else if (customColorContainer) {
            customColorContainer.classList.add('d-none');
        }
        
        // Показываем/скрываем опции фильтра в зависимости от выбранного фильтра
        if (selectedFilter !== 'none' && selectedFilter !== 'custom' && filterOptionsContainer) {
            filterOptionsContainer.classList.remove('d-none');
            // Активируем вкладку фильтров
            const filterTabBtn = document.getElementById('filterTabBtn');
            if (filterTabBtn) {
                filterTabBtn.click();
            }
        } else if (filterOptionsContainer) {
            filterOptionsContainer.classList.add('d-none');
        }
    });

    addEventListenerIfExists('filterOpacity', 'input', function() {
        updateParamAndDraw('filterOpacity', this.value / 100);
        const valueElement = document.getElementById('filterOpacityValue');
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
    });

    addEventListenerIfExists('customColor', 'input', function() {
        updateParamAndDraw('customColor', this.value);
    });
    
    // При загрузке страницы
    window.addEventListener('load', () => {
        // Инициализируем параметры позиционирования логотипа через функцию updateLogoPositioningParams
        updateLogoPositioningParams();
        
        // Настраиваем канвас
        resizeCanvas();
        
        // Скрываем элементы управления до загрузки изображений
        filterOptionsContainer.classList.add('d-none');
        customColorContainer.classList.add('d-none');
        document.getElementById('settingsPanel').classList.add('d-none');
        
        drawCanvas();
    });
}
