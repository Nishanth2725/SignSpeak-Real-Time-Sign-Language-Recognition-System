const express = require('express');
const router = express.Router();
const { readData } = require('../services/storageService');

router.get('/', (req, res) => {
    const history = readData('history.json');
    const authHeader = req.headers.authorization;
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const jwt = require('jsonwebtoken');
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signspeak-super-secret-key');
            userId = decoded.id;
        } catch (e) {}
    }

    const userHistory = history.filter(h => h.userId === userId);
    
    const totalSigns = userHistory.length;
    const today = new Date().toISOString().split('T')[0];
    const todaySigns = userHistory.filter(h => h.timestamp.startsWith(today)).length;
    
    const signCounts = {};
    let totalConfidence = 0;
    userHistory.forEach(h => {
        signCounts[h.sign] = (signCounts[h.sign] || 0) + 1;
        totalConfidence += parseFloat(h.confidence);
    });

    const averageConfidence = totalSigns > 0 ? (totalConfidence / totalSigns).toFixed(1) : 0;
    
    const mostFrequent = Object.keys(signCounts).sort((a, b) => signCounts[b] - signCounts[a]).slice(0, 5);

    res.json({
        totalSigns,
        todaySigns,
        averageConfidence,
        mostFrequent
    });
});

module.exports = router;
