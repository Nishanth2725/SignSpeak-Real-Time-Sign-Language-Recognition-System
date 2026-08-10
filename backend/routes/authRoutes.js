const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../services/storageService');

const JWT_SECRET = process.env.JWT_SECRET || 'signspeak-super-secret-key';

router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    
    let users = readData('users.json');
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), fullName, email, password: hashedPassword };
    users.push(newUser);
    
    if (writeData('users.json', users)) {
        res.status(201).json({ message: 'User registered successfully.' });
    } else {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let users = readData('users.json');
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
});

module.exports = router;
