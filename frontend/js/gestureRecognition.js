// gestureRecognition.js - Advanced Multi-Hand Heuristic Classifier

const GESTURES = {
    NONE: '...',
    // Single Hand
    HELLO: 'Hello / Raised Hand',
    FIST: 'Fist (Protest/Strength)',
    GOOD: 'Thumbs Up',
    BAD: 'Thumbs Down',
    PEACE: 'Peace / Victory',
    ILOVEYOU: 'I Love You',
    ROCKON: 'Rock On',
    CALLME: 'Call Me',
    OK: 'OK',
    POINTING_UP: 'Pointing Up',
    POINTING_DOWN: 'Pointing Down',
    POINTING_LEFT: 'Pointing Left',
    POINTING_RIGHT: 'Pointing Right',
    YOU: 'You',
    MIDDLE_FINGER: 'Middle Finger',
    PINCH: 'Pinch / A little',
    CROSSED: 'Good Luck (Crossed)',
    VULCAN: 'Live Long and Prosper',
    
    // Two Hands
    TIME: 'Time / Clock',
    STOP_BOTH: 'Stop (Both Hands)',
    SURPRISE: 'Joy / Surprise',
    HUG: 'Hug',
    PRAY: 'Pray / Please',
    MEASURE: 'Measuring (Size)'
};

function calculateDistance3D(p1, p2) {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + 
        Math.pow(p1.y - p2.y, 2) + 
        Math.pow(p1.z - p2.z, 2)
    );
}

// Analyze a single hand's landmarks to extract features
function analyzeHand(landmarks) {
    // Finger extension checks using 3D distance from wrist
    const isIndexExtended = calculateDistance3D(landmarks[0], landmarks[8]) > calculateDistance3D(landmarks[0], landmarks[6]);
    const isMiddleExtended = calculateDistance3D(landmarks[0], landmarks[12]) > calculateDistance3D(landmarks[0], landmarks[10]);
    const isRingExtended = calculateDistance3D(landmarks[0], landmarks[16]) > calculateDistance3D(landmarks[0], landmarks[14]);
    const isPinkyExtended = calculateDistance3D(landmarks[0], landmarks[20]) > calculateDistance3D(landmarks[0], landmarks[18]);

    // Thumb extension
    const isThumbExtended = calculateDistance3D(landmarks[4], landmarks[17]) > calculateDistance3D(landmarks[3], landmarks[17]);

    const extendedCount = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(Boolean).length;

    return {
        landmarks,
        isIndexExtended,
        isMiddleExtended,
        isRingExtended,
        isPinkyExtended,
        isThumbExtended,
        extendedCount
    };
}

// Main classifier function
window.classifyGesture = function(landmarksArray) {
    if (!landmarksArray || landmarksArray.length === 0) {
        return { sign: GESTURES.NONE, confidence: 0 };
    }

    const hands = landmarksArray.map(analyzeHand);

    // --- TWO-HANDED GESTURES ---
    if (hands.length === 2) {
        const h1 = hands[0];
        const h2 = hands[1];

        const dWrists = calculateDistance3D(h1.landmarks[0], h2.landmarks[0]);

        // 1. PRAY / PLEASE (Palms together)
        // Wrists are very close, index tips are close, pinky tips are close
        const dIndexTips = calculateDistance3D(h1.landmarks[8], h2.landmarks[8]);
        if (dWrists < 0.15 && dIndexTips < 0.15 && h1.extendedCount >= 3 && h2.extendedCount >= 3) {
            return { sign: GESTURES.PRAY, confidence: 95 };
        }

        // 2. TIME / CLOCK (One hand points to the wrist of the other)
        if (h1.extendedCount === 1 && h1.isIndexExtended && h2.extendedCount === 0) {
            const dTipToWrist = calculateDistance3D(h1.landmarks[8], h2.landmarks[0]);
            if (dTipToWrist < 0.1) return { sign: GESTURES.TIME, confidence: 90 };
        } else if (h2.extendedCount === 1 && h2.isIndexExtended && h1.extendedCount === 0) {
            const dTipToWrist = calculateDistance3D(h2.landmarks[8], h1.landmarks[0]);
            if (dTipToWrist < 0.1) return { sign: GESTURES.TIME, confidence: 90 };
        }

        // 3. SURPRISE / JOY (Both open palms, wrists close to each other, hands up)
        if (h1.extendedCount === 4 && h2.extendedCount === 4 && h1.isThumbExtended && h2.isThumbExtended && dWrists < 0.4 && h1.landmarks[0].y > h1.landmarks[8].y) {
            return { sign: GESTURES.SURPRISE, confidence: 90 };
        }

        // 4. HUG (Both open palms, wide apart)
        if (h1.extendedCount === 4 && h2.extendedCount === 4 && dWrists > 0.6) {
            return { sign: GESTURES.HUG, confidence: 85 };
        }
        
        // 5. STOP (Both Hands)
        if (h1.extendedCount === 4 && h2.extendedCount === 4 && !h1.isThumbExtended && !h2.isThumbExtended) {
            return { sign: GESTURES.STOP_BOTH, confidence: 90 };
        }
        
        // 6. MEASURING (Size) (Both hands index and thumb extended, parallel)
        if (h1.extendedCount === 0 && h2.extendedCount === 0 && h1.isIndexExtended && h2.isIndexExtended) {
             return { sign: GESTURES.MEASURE, confidence: 85 };
        }
    }

    // --- SINGLE-HANDED GESTURES ---
    const h = hands[0]; // Evaluate primary hand
    
    // Middle Finger (Hate)
    if (!h.isIndexExtended && h.isMiddleExtended && !h.isRingExtended && !h.isPinkyExtended && !h.isThumbExtended) {
        return { sign: GESTURES.MIDDLE_FINGER, confidence: 98 };
    }

    // OK HAND
    const dThumbIndex = calculateDistance3D(h.landmarks[4], h.landmarks[8]);
    if (dThumbIndex < 0.1 && h.isMiddleExtended && h.isRingExtended && h.isPinkyExtended) {
        return { sign: GESTURES.OK, confidence: 90 };
    }

    // Pinch / Small Amount
    if (h.extendedCount === 0 && h.isIndexExtended && h.isThumbExtended === false) {
        if (dThumbIndex > 0.02 && dThumbIndex < 0.12 && !h.isMiddleExtended) {
            return { sign: GESTURES.PINCH, confidence: 85 };
        }
    }

    // Crossed Fingers (Good Luck)
    if (h.isIndexExtended && h.isMiddleExtended && !h.isRingExtended && !h.isPinkyExtended && !h.isThumbExtended) {
        const dX = Math.abs(h.landmarks[12].x - h.landmarks[8].x);
        if (dX < 0.03) {
            return { sign: GESTURES.CROSSED, confidence: 85 };
        }
    }

    // Vulcan (Wish to Prosper)
    if (h.extendedCount === 4) {
        const dMiddleRing = calculateDistance3D(h.landmarks[12], h.landmarks[16]);
        if (dMiddleRing > 0.08) {
            return { sign: GESTURES.VULCAN, confidence: 90 };
        }
    }

    // Open Palm (Hello / Raised Hand)
    if (h.extendedCount === 4 && h.isThumbExtended) {
        return { sign: GESTURES.HELLO, confidence: 95 };
    }
    
    // Fist (Stop / Protest / Strength)
    if (h.extendedCount === 0 && !h.isThumbExtended) {
        return { sign: GESTURES.FIST, confidence: 92 };
    }

    // Thumbs Up / Down
    if (h.extendedCount === 0 && h.isThumbExtended) {
        if (h.landmarks[4].y < h.landmarks[3].y) return { sign: GESTURES.GOOD, confidence: 90 };
        else return { sign: GESTURES.BAD, confidence: 90 };
    }

    // Peace Sign
    if (h.isIndexExtended && h.isMiddleExtended && !h.isRingExtended && !h.isPinkyExtended && !h.isThumbExtended) {
        return { sign: GESTURES.PEACE, confidence: 85 };
    }

    // I Love You
    if (h.isIndexExtended && !h.isMiddleExtended && !h.isRingExtended && h.isPinkyExtended && h.isThumbExtended) {
        return { sign: GESTURES.ILOVEYOU, confidence: 85 };
    }

    // Rock On
    if (h.isIndexExtended && !h.isMiddleExtended && !h.isRingExtended && h.isPinkyExtended && !h.isThumbExtended) {
        return { sign: GESTURES.ROCKON, confidence: 85 };
    }

    // Call Me
    if (!h.isIndexExtended && !h.isMiddleExtended && !h.isRingExtended && h.isPinkyExtended && h.isThumbExtended) {
        return { sign: GESTURES.CALLME, confidence: 85 };
    }

    // Pointing / You
    if (h.isIndexExtended && !h.isMiddleExtended && !h.isRingExtended && !h.isPinkyExtended && !h.isThumbExtended) {
        const indexTip = h.landmarks[8];
        const indexBase = h.landmarks[5];
        
        if (indexTip.z < indexBase.z - 0.05) {
            return { sign: GESTURES.YOU, confidence: 88 };
        }

        const dx = indexTip.x - indexBase.x;
        const dy = indexTip.y - indexBase.y;
        
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0) return { sign: GESTURES.POINTING_UP, confidence: 85 };
            else return { sign: GESTURES.POINTING_DOWN, confidence: 85 };
        } else {
            if (dx < 0) return { sign: GESTURES.POINTING_LEFT, confidence: 85 };
            else return { sign: GESTURES.POINTING_RIGHT, confidence: 85 };
        }
    }

    return { sign: GESTURES.NONE, confidence: 0 };
};
