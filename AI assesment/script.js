let model;
const modelStatus = document.getElementById('modelStatus');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('imageFile');
const fileName = document.getElementById('fileName');
const predictBtn = document.getElementById('predictBtn');
const loader = document.getElementById('loader');
const result = document.getElementById('result');
const confidence = document.getElementById('confidence');
const instrumentIcon = document.getElementById('instrumentIcon');
const imagePreview = document.getElementById('imagePreview');

// Load the model when the page loads
async function loadModel() {
    try {
        console.log('Starting model loading...');
        model = await tf.loadLayersModel('/web_model/model.json');
        console.log('Model loaded successfully');
        
        // Update UI to show model is loaded
        modelStatus.textContent = 'Model loaded successfully!';
        modelStatus.classList.add('loaded');
        modelStatus.querySelector('.loading-spinner').style.display = 'none';
        
        // Enable the upload functionality
        fileInput.disabled = false;
        dropZone.style.opacity = '1';
        
    } catch (error) {
        console.error('Error loading model:', error);
        
        // Update UI to show error
        modelStatus.textContent = 'Error loading model: ' + error.message;
        modelStatus.classList.add('error');
        modelStatus.querySelector('.loading-spinner').style.display = 'none';
        
        // Show error in result section
        result.textContent = 'Model loading failed';
        result.style.color = 'red';
    }
}

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    } else {
        alert('Please upload an image file.');
    }
});

// Handle file selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

function handleFile(file) {
    fileName.textContent = file.name;
    predictBtn.disabled = false;
    
    // Show image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
    }
    reader.readAsDataURL(file);
}

// Update instrument icon based on prediction
function updateInstrumentIcon(prediction) {
    const iconMap = {
        'tabla': 'fa-drum',
        'piano': 'fa-piano',
        'guitar': 'fa-guitar',
        'violin': 'fa-violin',
        'flute': 'fa-flute',
        'drums': 'fa-drum-set',
        'saxophone': 'fa-saxophone',
        'trumpet': 'fa-trumpet',
        'sitar': 'fa-guitar',
        'harmonium': 'fa-piano'
    };

    const iconClass = iconMap[prediction.toLowerCase()] || 'fa-music';
    instrumentIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

// Handle form submission
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imageFile = fileInput.files[0];
    if (!imageFile) {
        alert('Please select an image.');
        return;
    }

    loader.style.display = 'flex';
    result.textContent = '-';
    confidence.textContent = '';
    
    try {
        // Process image and make prediction
        const imageData = await processImage(imageFile);
        const prediction = await model.predict(imageData);
        const predictionData = await prediction.data();
        
        // Get the predicted class and confidence
        const predictedClass = getPredictedClass(predictionData);
        const confidenceScore = (Math.max(...predictionData) * 100).toFixed(2);
        
        // Update UI
        result.textContent = predictedClass;
        confidence.textContent = `Confidence: ${confidenceScore}%`;
        updateInstrumentIcon(predictedClass);
        
        // Cleanup
        prediction.dispose();
        imageData.dispose();
    } catch (error) {
        console.error('Error making prediction:', error);
        result.textContent = 'Error processing image';
        confidence.textContent = 'Please try again';
    } finally {
        loader.style.display = 'none';
    }
});

// Process image file
async function processImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set the canvas size to match model input size (128x128 for this model)
            canvas.width = 128;
            canvas.height = 128;
            
            // Draw and resize the image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Get the image data and convert to tensor
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const tensor = tf.browser.fromPixels(imageData)
                .toFloat()
                .div(255.0)  // Normalize to [0,1]
                .expandDims(0);  // Add batch dimension
            
            resolve(tensor);
        };
        img.onerror = (error) => reject(error);
        img.src = URL.createObjectURL(file);
    });
}

// Get predicted class name
function getPredictedClass(predictions) {
    const instruments = [
        'Tabla',
        'Piano',
        'Guitar',
        'Violin',
        'Flute',
        'Drums',
        'Saxophone',
        'Trumpet',
        'Sitar',
        'Harmonium'
    ];
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return instruments[maxIndex];
}

// Load the model when the page loads
loadModel(); 