const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.post(['/signup', '/register'], async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, phone || null, 'customer'],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
                    return res.status(500).json({ error: 'Registration failed' });
                }
                const user = { id: this.lastID, name, email, role: 'customer' };
                const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
                res.status(201).json({ user, token });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});



// NEW: Send OTP Endpoint (Mock)
router.post('/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    // In production, send SMS here. For now, just return success.
    console.log(`OTP sent to ${phone}: 123456`);
    res.json({ message: 'OTP sent successfully' });
});

// NEW: Login with OTP Endpoint
router.post('/login-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    if (otp !== '123456') return res.status(401).json({ error: 'Invalid OTP' });

    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!row) {
            // OPTIONAL: Auto-register if not exists? User said "NO signup", implying existing users only.
            // But for testing, if admin doesn't exist, we might fail.
            // Let's assume existing user. If not found, create one for "Customer" tab ease?
            // User instruction: "Customer Tab -> Any phone -> CustomerDashboard". This implies auto-signup or mock.
            // Let's auto-create if missing to ensure "Any phone" works.
            const tempEmail = `${phone}@hygienix.in`;
            db.run('INSERT INTO users (name, email, phone, role) VALUES (?, ?, ?, ?)',
                ['Guest Customer', tempEmail, phone, 'customer'],
                function (err) {
                    if (err) return res.status(500).json({ error: 'Login failed' });
                    const user = { id: this.lastID, name: 'Guest Customer', role: 'customer', phone };
                    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
                    return res.json({ user, token });
                }
            );
        } else {
            const user = { id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone };
            const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
            res.json({ user, token });
        }
    });
});


router.post(['/login', '/customer/login'], (req, res) => {
    const { identifier, password, email } = req.body; // identifier can be email or phone
    const loginId = identifier || email;

    if (!loginId || !password) return res.status(400).json({ error: 'Email/Phone and password required' });

    db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [loginId, loginId], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const user = { id: row.id, name: row.name, email: row.email, role: row.role, phone: row.phone };
        const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
        res.json({ user, token });
    });
});



// TEMPORARY: Set password for a user by phone (Helper for Admin)
router.get('/set-password/:phone/:password', async (req, res) => {
    const { phone, password } = req.params;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run("UPDATE users SET password_hash = ? WHERE phone = ?", [hash, phone], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: `Password updated for ${phone}.` });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// TEMPORARY: Endpoint to promote a user to admin by phone
router.get('/promote/:phone', (req, res) => {
    const { phone } = req.params;
    db.run("UPDATE users SET role = 'admin' WHERE phone = ?", [phone], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found with that phone number' });
        res.json({ message: `Success! User with phone ${phone} is now an ADMIN. Please login again.` });
    });
});

router.post('/forgot', (req, res) => {
    const { email } = req.body;
    db.get('SELECT id, email FROM users WHERE email = ?', [email], (err, row) => {
        if (err || !row) return res.json({ message: 'If that email exists, a reset link was sent.' });
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000;
        db.run('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?', [token, expires, row.id], () => {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
            });
            const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
            transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: email,
                subject: 'Password Reset - Hygienix',
                text: `Link: ${resetLink}`
            }, () => res.json({ message: 'If that email exists, a reset link was sent.' }));
        });
    });
});

router.post('/reset', async (req, res) => {
    const { token, newPassword } = req.body;
    db.get('SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > ?', [token, Date.now()], async (err, row) => {
        if (!row) return res.status(400).json({ error: 'Invalid or expired token' });
        const hash = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?', [hash, row.id], () => {
            res.json({ message: 'Password reset successful' });
        });
    });
});

module.exports = router;
