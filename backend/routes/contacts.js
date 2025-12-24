const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { name, email, phone, message } = req.body;
    db.run('INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)', [name, email, phone, message], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run('INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)', ['contact', 'New Inquiry', `From ${name}`]);
        res.status(201).json({ message: 'Message received', id: this.lastID });
    });
});

module.exports = router;
