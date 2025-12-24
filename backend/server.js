require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/notifications', require('./routes/notifications'));

const BASE_PATH = process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/backend' : '');

app.get(`${BASE_PATH}/`, (req, res) => res.send('Hygienix Backend is running!'));
app.get(`${BASE_PATH}/health`, (req, res) => res.json({ status: 'ok', version: '1.0.5' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Error', details: err.message });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}

module.exports = app;
