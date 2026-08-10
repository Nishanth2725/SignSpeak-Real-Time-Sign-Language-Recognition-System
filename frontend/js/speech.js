// speech.js - Handles Web Speech API for Text-to-Speech

const synth = window.speechSynthesis;

function speakText(text) {
    if (synth.speaking) {
        console.warn('SpeechSynthesis is already speaking.');
        return;
    }
    if (text !== '') {
        const utterThis = new SpeechSynthesisUtterance(text);
        
        // Optional: configure voice/rate/pitch here
        utterThis.rate = 1;
        utterThis.pitch = 1;
        
        utterThis.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
        };
        
        synth.speak(utterThis);
    }
}
