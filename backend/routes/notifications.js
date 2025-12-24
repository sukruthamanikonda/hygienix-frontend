const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT * FROM notifications ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/:id/read', authenticateToken, isAdmin, (req, res) => {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
