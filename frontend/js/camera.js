// camera.js - Main UI and Camera Loop

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const canvasCtx = canvas ? canvas.getContext('2d') : null;
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const statusDot = document.getElementById('cam-status-dot');
const statusText = document.getElementById('cam-status-text');
const currentSignEl = document.getElementById('current-sign');
const confidenceText = document.getElementById('confidence-text');
const confidenceBar = document.getElementById('confidence-bar');
const sentenceBox = document.getElementById('sentence-box');
const errorMsg = document.getElementById('error-message');
const videoContainer = document.getElementById('video-container');

let stream = null;
let isRunning = false;
let lastVideoTime = -1;
let animationFrameId = null;

// Debounce settings for sentence builder
let lastRecognizedSign = '';
let signStableCount = 0;
const STABLE_THRESHOLD = 15; // frames needed to confirm a sign

// Load settings
const confThreshold = localStorage.getItem('confThreshold') ? parseInt(localStorage.getItem('confThreshold')) : 80;
const showLandmarks = localStorage.getItem('showLandmarks') !== 'false';
const autoSpeak = localStorage.getItem('autoSpeak') === 'true';

async function setup() {
    if (!video) return; // Not on recognition page
    const loaded = await initializeHandLandmarker();
    if (!loaded) {
        errorMsg.innerText = "Failed to load ML model. Please check network.";
        btnStart.disabled = true;
    }
}

async function startCamera() {
    errorMsg.innerText = '';
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        video.srcObject = stream;
        
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            isRunning = true;
            statusDot.classList.add('active');
            statusText.innerText = 'Camera Active';
            videoContainer.classList.add('active');
            
            btnStart.disabled = true;
            btnStop.disabled = false;
            
            predictWebcam();
        });
    } catch (err) {
        console.error("Camera error:", err);
        if (err.name === 'NotAllowedError') {
            errorMsg.innerText = "Camera permission denied. Please allow camera access.";
        } else if (err.name === 'NotFoundError') {
            errorMsg.innerText = "No camera found on this device.";
        } else {
            errorMsg.innerText = "Error accessing camera: " + err.message;
        }
    }
}

function stopCamera() {
    isRunning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    statusDot.classList.remove('active');
    statusText.innerText = 'Camera Off';
    videoContainer.classList.remove('active');
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (canvasCtx) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    btnStart.disabled = false;
    btnStop.disabled = true;
    
    currentSignEl.innerText = '...';
    confidenceBar.style.width = '0%';
    confidenceText.innerText = '0%';
}

function updateSentence(newWord) {
    if (newWord === GESTURES.NONE) return;
    
    // Extract just the word part (e.g. "Hello" from "Hello / Open Palm")
    const word = newWord.split('/')[0].trim().toUpperCase();
    
    let currentText = sentenceBox.value;
    const words = currentText.split(' ').filter(w => w.length > 0);
    
    // Prevent immediate consecutive duplicate words
    if (words.length > 0 && words[words.length - 1] === word) {
        return;
    }
    
    sentenceBox.value = currentText ? currentText + ' ' + word : word;
    
    if (autoSpeak) {
        speakText(word);
    }
}

function predictWebcam() {
    if (!isRunning) return;

    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = processVideoFrame(video, performance.now());
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results && results.landmarks && results.landmarks.length > 0) {
            statusText.innerText = 'Hand Detected';
            
            if (showLandmarks) {
                drawLandmarks(canvasCtx, results.landmarks);
            }
            
            // Pass all detected hands to the classifier
            const prediction = classifyGesture(results.landmarks);
            if (prediction.confidence >= confThreshold) {
                currentSignEl.innerText = prediction.sign;
                confidenceBar.style.width = prediction.confidence + '%';
                confidenceText.innerText = prediction.confidence + '%';
                
                // Stability check for sentence building
                if (prediction.sign === lastRecognizedSign) {
                    signStableCount++;
                    if (signStableCount === STABLE_THRESHOLD) {
                        updateSentence(prediction.sign);
                    }
                } else {
                    lastRecognizedSign = prediction.sign;
                    signStableCount = 1;
                }
            } else {
                currentSignEl.innerText = 'Unclear';
                confidenceBar.style.width = prediction.confidence + '%';
                confidenceText.innerText = prediction.confidence + '%';
                signStableCount = 0;
            }
            
        } else {
            statusText.innerText = 'Camera Active';
            currentSignEl.innerText = '...';
            confidenceBar.style.width = '0%';
            confidenceText.innerText = '0%';
            signStableCount = 0;
        }
    }
    
    if (isRunning) {
        animationFrameId = requestAnimationFrame(predictWebcam);
    }
}

// Event Listeners
if (btnStart) btnStart.addEventListener('click', startCamera);
if (btnStop) btnStop.addEventListener('click', stopCamera);

const btnUndo = document.getElementById('btn-undo');
if (btnUndo) {
    btnUndo.addEventListener('click', () => {
        const words = sentenceBox.value.trim().split(' ');
        words.pop();
        sentenceBox.value = words.join(' ');
    });
}

const btnClear = document.getElementById('btn-clear');
if (btnClear) {
    btnClear.addEventListener('click', () => {
        sentenceBox.value = '';
    });
}

const btnSpeak = document.getElementById('btn-speak');
if (btnSpeak) {
    btnSpeak.addEventListener('click', () => {
        speakText(sentenceBox.value);
    });
}

const btnSave = document.getElementById('btn-save');
if (btnSave) {
    btnSave.addEventListener('click', async () => {
        if (!sentenceBox.value.trim() && currentSignEl.innerText === '...') {
            alert('Nothing to save.');
            return;
        }
        
        try {
            const body = {
                sign: currentSignEl.innerText !== '...' && currentSignEl.innerText !== 'Unclear' ? currentSignEl.innerText : 'Sentence',
                confidence: parseInt(confidenceText.innerText) || 100,
                sentence: sentenceBox.value
            };
            
            await apiCall('/history', 'POST', body);
            
            // Show brief success state
            const originalText = btnSave.innerText;
            btnSave.innerText = 'Saved!';
            btnSave.classList.remove('btn-outline');
            btnSave.classList.add('btn-primary');
            setTimeout(() => {
                btnSave.innerText = originalText;
                btnSave.classList.add('btn-outline');
                btnSave.classList.remove('btn-primary');
            }, 2000);
            
        } catch (err) {
            alert('Failed to save: ' + err.message);
        }
    });
}

// Stop camera on page leave
window.addEventListener('beforeunload', stopCamera);

// Initialize
setup();
