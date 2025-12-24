const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWhatsApp, adminNumber } = require('../services/whatsapp');

router.post('/', (req, res) => {
    const { items, total, name, phone, address, date } = req.body;
    const itemsStr = JSON.stringify(items || []);
    const finalName = name || req.body.customerName || 'Guest';
    const finalPhone = phone || req.body.customerPhone;
    const finalDate = date || req.body.service_date;

    db.run(
        'INSERT INTO orders (customer_name, customer_phone, address, service_date, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [finalName, finalPhone, address, finalDate, itemsStr, total || 0, 'pending'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const orderId = this.lastID;

            db.run('INSERT INTO notifications (type, title, message, meta) VALUES (?, ?, ?, ?)', ['order', 'New Booking', `Legacy Booking #${orderId} from ${finalName}`, JSON.stringify({ orderId })]);

            const msg = `*New Booking #${orderId}*\nName: ${finalName}\nPhone: ${finalPhone}\nTotal: ₹${total}`;
            sendWhatsApp({ to: finalPhone, body: `Hi ${finalName}, your booking is received!` });
            sendWhatsApp({ to: adminNumber, body: `ADMIN: ${msg}` });

            res.status(201).json({ id: orderId, message: 'Booking created', success: true });
        }
    );
});

module.exports = router;
