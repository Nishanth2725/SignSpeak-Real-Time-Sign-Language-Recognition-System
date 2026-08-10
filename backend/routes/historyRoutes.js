const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../services/storageService');

// Middleware to mock authentication check (in a real app, verify JWT here)
function authMiddleware(req, res, next) {
    // For prototype simplicity, we'll assume a 'userId' might be passed in headers, or we just allow it.
    // We will parse the Authorization header if present.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'signspeak-super-secret-key';
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (e) {
            console.error('Invalid token');
        }
    }
    next();
}

router.use(authMiddleware);

router.get('/', (req, res) => {
    const history = readData('history.json');
    // If logged in, filter by user (optional for prototype)
    const userHistory = req.user ? history.filter(h => h.userId === req.user.id) : history;
    res.json(userHistory.reverse()); // Newest first
});

router.post('/', (req, res) => {
    const { sign, confidence, sentence } = req.body;
    if (!sign) {
        return res.status(400).json({ error: 'Sign is required' });
    }
    
    const history = readData('history.json');
    const newEntry = {
        id: Date.now().toString(),
        userId: req.user ? req.user.id : 'anonymous',
        sign,
        confidence: confidence || 100,
        sentence: sentence || sign,
        timestamp: new Date().toISOString()
    };
    
    history.push(newEntry);
    writeData('history.json', history);
    res.status(201).json(newEntry);
});

router.delete('/:id', (req, res) => {
    let history = readData('history.json');
    history = history.filter(h => h.id !== req.params.id);
    writeData('history.json', history);
    res.json({ message: 'Deleted' });
});

router.delete('/', (req, res) => {
    // Clear all for user
    if (req.user) {
        let history = readData('history.json');
        history = history.filter(h => h.userId !== req.user.id);
        writeData('history.json', history);
    } else {
        writeData('history.json', []);
    }
    res.json({ message: 'History cleared' });
});

module.exports = router;
