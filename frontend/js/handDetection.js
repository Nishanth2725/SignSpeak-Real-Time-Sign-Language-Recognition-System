// handDetection.js - Handles MediaPipe Tasks Vision Setup and Inference

let handLandmarker = undefined;
let runningMode = "VIDEO";

async function initializeHandLandmarker() {
    try {
        const { FilesetResolver, HandLandmarker } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0");
        
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: runningMode,
            numHands: 2
        });
        console.log("HandLandmarker loaded successfully");
        return true;
    } catch (error) {
        console.error("Error loading HandLandmarker:", error);
        return false;
    }
}

function processVideoFrame(videoElement, timestamp) {
    if (!handLandmarker) return null;
    try {
        return handLandmarker.detectForVideo(videoElement, timestamp);
    } catch (error) {
        console.error("Inference error:", error);
        return null;
    }
}

// Drawing utilities for canvas
function drawLandmarks(canvasCtx, landmarks) {
    canvasCtx.fillStyle = "#00d2ff";
    canvasCtx.strokeStyle = "#ffffff";
    canvasCtx.lineWidth = 2;

    for (const landmark of landmarks) {
        for (const point of landmark) {
            canvasCtx.beginPath();
            canvasCtx.arc(point.x * canvasCtx.canvas.width, point.y * canvasCtx.canvas.height, 4, 0, 2 * Math.PI);
            canvasCtx.fill();
            canvasCtx.stroke();
        }
        
        // Connect the dots (simplified for prototype)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [0, 17] // Palm base
        ];
        
        canvasCtx.beginPath();
        for (const conn of connections) {
            const p1 = landmark[conn[0]];
            const p2 = landmark[conn[1]];
            canvasCtx.moveTo(p1.x * canvasCtx.canvas.width, p1.y * canvasCtx.canvas.height);
            canvasCtx.lineTo(p2.x * canvasCtx.canvas.width, p2.y * canvasCtx.canvas.height);
        }
        canvasCtx.stroke();
    }
}
