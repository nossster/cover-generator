// Инициализация приложения
async function init() {
    // Загружаем настройки из JSON файла
    const settingsLoaded = await loadCoverSettings();
    if (!settingsLoaded) {
        console.error('Не удалось загрузить настройки обложек. Используем значения по умолчанию.');
    } else {
        // Заполняем выпадающие списки из конфигурации
        populateSelectOptionsFromConfig();
        
        // Устанавливаем размеры canvas из конфигурации
        const defaultWidth = coverSettings?.defaultSettings?.canvas?.width || 1024;
        const defaultHeight = coverSettings?.defaultSettings?.canvas?.height || 1024;
        
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
        
        // Устанавливаем размеры canvas-container
        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.style.width = defaultWidth + 'px';
        canvasContainer.style.height = defaultHeight + 'px';
        canvasContainer.style.maxWidth = '100%';
        
        // Инициализируем размеры в state для custom режима
        state.canvasSize.width = defaultWidth;
        state.canvasSize.height = defaultHeight;
    }
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Загружаем изображения типа и иконки по умолчанию
    try {
        const imgFolder = coverSettings?.coverTypes[state.coverType]?.imageFolder || './img/';
        const backgroundImage = coverSettings?.coverTypes[state.coverType]?.backgroundImage || 'Bgiconsize.png';
        const topLayerImage = coverSettings?.coverTypes[state.coverType]?.topLayerImage || 'Toplayer.png';
        
        state.images.background = await loadImage(imgFolder + backgroundImage);
        state.images.topLayer = await loadImage(imgFolder + topLayerImage);
        
        // Если выбрана иконка, загружаем её
        if (state.selectedIcon !== 'none') {
            await updateIcon(state.selectedIcon);
        }
        
        drawCanvas();
    } catch (error) {
        console.error('Ошибка при загрузке изображений:', error);
    }
}

// Обработчик события выбора типа обложки
document.getElementById('coverTypeSelect').addEventListener('change', function() {
    const selectedType = this.value;
    state.coverType = selectedType;
    
    // Обновляем параметры позиционирования для выбранного типа обложки
    updateLogoPositioningParams();
    
    // Получаем элементы DOM
    const iconSelectContainer = document.getElementById('icon-select-container');
    const customLayersContainer = document.getElementById('custom-layers-container');
    const bgUploadBtn = document.getElementById('upload-bg-btn');
    const topLayerUploadBtn = document.getElementById('upload-top-layer-btn');
    const canvasContainer = document.querySelector('.canvas-container');
    
    if (selectedType === 'custom') {
        // Для кастомного типа показываем все варианты загрузки и скрываем выбор иконки
        iconSelectContainer.style.display = 'none';
        customLayersContainer.style.display = 'block';
        
        // Деактивируем выбор иконки
        iconSelect.disabled = true;
        iconSelect.value = 'none';
        state.selectedIcon = 'none';
        state.images.icon = null;
        
        // Меняем тексты кнопок
        bgUploadBtn.textContent = 'Загрузить PNG с прозрачностью (маской)';
        topLayerUploadBtn.textContent = 'Загрузить верхний слой';
        
        // Устанавливаем начальные размеры для полей ввода
        document.getElementById('custom-width').value = state.canvasSize.width;
        document.getElementById('custom-height').value = state.canvasSize.height;
        
        // Устанавливаем размеры контейнера в соответствии с кастомными размерами
        canvasContainer.style.width = state.canvasSize.width + 'px';
        canvasContainer.style.height = state.canvasSize.height + 'px';
        canvasContainer.style.maxWidth = '100%';
        
        // Создаем пустой фон для кастомного режима, если не загружен пользовательский
        if (!state.customBackgroundUploaded) {
            state.images.background = null;
        }
        if (!state.customTopLayerUploaded) {
            state.images.topLayer = null;
        }
        
        // Обновляем canvas
        drawCanvas();
    } else {
        // Возвращаем стандартные размеры для обычных типов обложек
        const defaultWidth = coverSettings?.defaultSettings?.canvas?.width || 1024;
        const defaultHeight = coverSettings?.defaultSettings?.canvas?.height || 1024;
        
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
        
        // Обновляем размеры контейнера для стандартных типов
        canvasContainer.style.width = defaultWidth + 'px';
        canvasContainer.style.height = defaultHeight + 'px';
        canvasContainer.style.maxWidth = '100%';
        
        // Для стандартных типов показываем выбор иконки и скрываем кастомные загрузки
        iconSelectContainer.style.display = 'block';
        customLayersContainer.style.display = 'none';
        
        // Активируем выбор иконки
        iconSelect.disabled = false;
        
        // Сбрасываем флаги пользовательских изображений
        state.customBackgroundUploaded = false;
        state.customTopLayerUploaded = false;
        
        // Загружаем изображения для выбранного типа обложки
        loadCoverImages();
    }
});

// Добавляем обработчик для кнопки применения размера canvas
document.getElementById('apply-custom-size').addEventListener('click', function() {
    const widthInput = document.getElementById('custom-width');
    const heightInput = document.getElementById('custom-height');
    
    // Получаем значения из полей ввода
    let newWidth = parseInt(widthInput.value);
    let newHeight = parseInt(heightInput.value);
    
    // Проверяем валидность значений
    newWidth = Math.max(100, Math.min(newWidth, 3000));
    newHeight = Math.max(100, Math.min(newHeight, 3000));
    
    // Обновляем значения в полях ввода
    widthInput.value = newWidth;
    heightInput.value = newHeight;
    
    // Обновляем размеры в состоянии
    state.canvasSize.width = newWidth;
    state.canvasSize.height = newHeight;
    
    // Применяем размеры к canvas
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Обновляем размеры canvas-container
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.width = newWidth + 'px';
    canvasContainer.style.height = newHeight + 'px';
    canvasContainer.style.maxWidth = '100%'; // Чтобы контейнер не выходил за границы родителя на маленьких экранах
    
    // Перерисовываем canvas
    drawCanvas();
});

// Добавляем обработчики для загрузки фона с маской и верхнего слоя
const uploadBgBtn = document.getElementById('upload-bg-btn');
const bgUpload = document.getElementById('bg-upload');
const uploadTopLayerBtn = document.getElementById('upload-top-layer-btn');
const topLayerUpload = document.getElementById('top-layer-upload');

uploadBgBtn.addEventListener('click', () => {
    bgUpload.click();
});

bgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.images.background = img;
                state.customBackgroundUploaded = true;
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

uploadTopLayerBtn.addEventListener('click', () => {
    topLayerUpload.click();
});

topLayerUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.images.topLayer = img;
                state.customTopLayerUploaded = true;
                drawCanvas();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});
