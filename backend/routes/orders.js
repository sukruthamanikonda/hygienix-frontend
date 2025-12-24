const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin, tryAuthenticateToken } = require('../middleware/auth');
const { sendWhatsApp, adminNumber } = require('../services/whatsapp');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS,
    },
});

router.get('/my', authenticateToken, (req, res) => {
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items || '[]') })));
    });
});

router.get('/admin', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items || '[]') })));
    });
});

router.post('/', tryAuthenticateToken, (req, res) => {
    const { items, total, customer_name, customer_phone, customer_email, address, service_date } = req.body;
    const name = customer_name || 'Guest';
    const itemsStr = JSON.stringify(items || []);

    db.run(
        'INSERT INTO orders (user_id, items, total, status, customer_name, customer_phone, address, service_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user ? req.user.id : null, itemsStr, total, 'pending', name, customer_phone, address, service_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const orderId = this.lastID;

            db.run('INSERT INTO notifications (type, title, message, meta) VALUES (?, ?, ?, ?)', ['order', 'New Booking', `Order #${orderId} from ${name}`, JSON.stringify({ orderId })]);

            const msg = `Booking #${orderId} confirmed for ${name}! Total: ₹${total}.`;
            if (customer_phone) sendWhatsApp({ to: customer_phone, body: `Hi ${name}, ${msg}` });
            if (adminNumber) sendWhatsApp({ to: adminNumber, body: `New Order #${orderId} from ${name}.` });

            if (customer_email || process.env.ADMIN_EMAIL) {
                const adminEmail = process.env.ADMIN_EMAIL || 'admin@hygienix.in';
                if (customer_email) {
                    transporter.sendMail({
                        from: process.env.GMAIL_USER || process.env.EMAIL_USER,
                        to: customer_email,
                        subject: `Booking #${orderId} Confirmed`,
                        text: `Confirmed! Total: ₹${total}`
                    }).catch(e => console.error(e));
                }
                transporter.sendMail({
                    from: process.env.GMAIL_USER || process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `New Booking #${orderId}`,
                    text: `New order from ${name}. Total: ₹${total}`
                }).catch(e => console.error(e));
            }

            res.status(201).json({ id: orderId, message: 'Order created successfully' });
        }
    );
});

module.exports = router;
