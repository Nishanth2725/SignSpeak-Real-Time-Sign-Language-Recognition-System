# SignSpeak – Real-Time Sign Language Recognition System

SignSpeak is a modern, full-stack web application designed to break communication barriers by translating hand gestures into meaningful text using real-time, browser-based computer vision.

## 1. Project Overview
The system captures video from the user's webcam, processes the frames locally in the browser using MediaPipe's machine learning models, and classifies static hand gestures into recognizable signs. It includes a built-in sentence constructor and text-to-speech capabilities.

## 2. Features
- **Real-Time Recognition**: Processes webcam feeds instantly with zero server round-trip delay.
- **Privacy First**: Video streams are processed entirely on your local device.
- **Heuristic Classifier**: Translates hand landmarks into gestures (e.g., Hello, Stop, Peace).
- **Sentence Builder**: Automatically strings recognized words together.
- **Voice Output**: Uses the Web Speech API to read the generated sentences aloud.
- **Dashboard & History**: Keeps track of recognized signs, sessions, and confidence statistics.
- **Glassmorphism UI**: A premium, futuristic dark-navy design.

## 3. Technologies
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript
- **Computer Vision**: Google MediaPipe Tasks Vision (`HandLandmarker`)
- **Backend**: Node.js, Express.js
- **Storage**: Local JSON databases (Prototype implementation)

## 4. Folder Structure
```
signspeak/
├── backend/
│   ├── data/             # JSON databases for users, history, etc.
│   ├── routes/           # Express API endpoints
│   ├── services/         # Storage and helper services
│   └── server.js         # Main Express entry point
├── frontend/
│   ├── css/              # Stylesheets (Glassmorphism theme)
│   ├── js/
│   │   ├── app.js                 # Global utilities & Auth
│   │   ├── camera.js              # Webcam UI & Render Loop
│   │   ├── handDetection.js       # MediaPipe Integration
│   │   ├── gestureRecognition.js  # Heuristic ML Classifier
│   │   └── speech.js              # Web Speech API wrapper
│   └── *.html            # Application Views (Dashboard, Recognition, etc.)
└── README.md
```

## 5. Installation
Make sure you have Node.js installed on your machine.

1. Clone or download this repository.
2. Navigate to the project root directory (`signspeak`).
3. Install dependencies:
   ```bash
   npm install
   ```

## 6. Backend Setup & 7. Frontend Setup
The project is configured so that the backend Express server automatically serves the frontend static files. No separate frontend build step is required since it uses Vanilla HTML/CSS/JS.

## 8. How to Run
From the root directory, start the server:
```bash
npm start
```
*Note: If `npm start` is not configured in package.json, you can run `node backend/server.js` directly.*

Open your browser and navigate to: `http://localhost:3000`

## 9. Camera Permissions
When you first navigate to the "Live Recognition" page, your browser will prompt you for camera access. You must grant permission for the application to function. Ensure you are running the app on `localhost` or via `HTTPS`, as modern browsers block webcam access on insecure connections.

## 10. Supported Gestures (Prototype Vocabulary)
- **Hello / Open Palm**: All fingers extended.
- **Stop / Fist**: All fingers curled.
- **Good / Thumbs Up**: Fist with thumb pointing up.
- **Bad / Thumbs Down**: Fist with thumb pointing down.
- **Peace / V-Sign**: Index and middle fingers extended.

## 11. How Gesture Recognition Works
1. The video stream is passed to the MediaPipe `HandLandmarker`.
2. MediaPipe identifies 21 3D landmarks (joints/tips) on the hand.
3. The custom `gestureRecognition.js` module calculates the distances and relative positions of finger tips to their joints.
4. If the geometry matches a known heuristic (e.g., index tip is further from the wrist than the index knuckle), it determines which fingers are extended and classifies the gesture.

## 12. How to Add New Gestures
To add new gestures, modify `frontend/js/gestureRecognition.js`:
1. Add a new entry to the `GESTURES` dictionary.
2. Inside `classifyGesture()`, write an `if` statement that checks the required finger states. For example, for an "I Love You" sign (Thumb, Index, Pinky extended):
   ```javascript
   if (isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended && isThumbExtended) {
       return { sign: GESTURES.ILOVEYOU, confidence: 90 };
   }
   ```

## 13. API Documentation
- `POST /api/auth/register`: Expects `{ fullName, email, password }`
- `POST /api/auth/login`: Expects `{ email, password }`. Returns JWT token.
- `GET /api/history`: Retrieves user recognition history.
- `POST /api/history`: Saves a new recognized sign/sentence.
- `GET /api/stats`: Retrieves dashboard statistics.

## 14. Troubleshooting
- **Camera not starting**: Check if another application (like Zoom or OBS) is using the webcam. Ensure you are on `localhost`.
- **Model not loading**: The MediaPipe WASM files are loaded from a CDN. Ensure you have an active internet connection.
- **History not saving**: Ensure the `backend/data` folder is writable by the Node process.

## 15. Future Improvements
- Integrate a trained TensorFlow.js neural network for dynamic gesture classification (recognizing movement over time).
- Add support for ASL/BSL specific vocabularies.
- Replace JSON storage with MongoDB or PostgreSQL for production scaling.
