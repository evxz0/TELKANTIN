const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ── Security headers ────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ───────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak request, coba lagi nanti.' },
});

app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────────────────
const merchantRoutes = require('./routes/merchantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Health check for Docker HEALTHCHECK & load balancers
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'merchant-service', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ message: 'TELKANTIN Merchant & Menu Service is running.' });
});

app.use('/api/merchants', merchantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/categories', categoryRoutes);

// ── Global error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Merchant & Menu Service running on port ${PORT}`);
});

module.exports = app;
