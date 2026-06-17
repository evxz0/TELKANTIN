const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// ── Konfigurasi URL Service ──────────────────────────────────────────
const SERVICES = {
  USER:             process.env.USER_SERVICE_URL             || 'http://localhost:3001',
  MERCHANT:         process.env.MERCHANT_SERVICE_URL         || 'http://localhost:3002',
  ORDER:            process.env.ORDER_SERVICE_URL            || 'http://localhost:3003',
  PAYMENT:          process.env.PAYMENT_SERVICE_URL          || 'http://localhost:3004',
  ANALYTICS:        process.env.ANALYTICS_SERVICE_URL        || 'http://localhost:8000',
  MERCHANT_GRAPHQL: process.env.MERCHANT_GRAPHQL_URL         || 'http://localhost:4001',
  ORDER_GRAPHQL:    process.env.ORDER_GRAPHQL_URL            || 'http://localhost:4002',
};

// ── Opsi Proxy Umum ─────────────────────────────────────────────────
const proxyOptions = (target, pathRewrite = {}) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    proxyReq: (proxyReq, req) => {
      console.log(`[Gateway] ${req.method} ${req.originalUrl} → ${target}`);
    },
    error: (err, req, res) => {
      console.error(`[Gateway] Proxy error: ${err.message}`);
      res.status(502).json({
        error: 'Bad Gateway',
        message: `Service tidak dapat dijangkau: ${err.message}`,
      });
    },
  },
});

// ── Health Check Gateway ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    routes: {
      users:            `${SERVICES.USER}/health`,
      merchants:        `${SERVICES.MERCHANT}/health`,
      orders:           `${SERVICES.ORDER}/health`,
      payments:         `${SERVICES.PAYMENT}/health`,
      analytics:        `${SERVICES.ANALYTICS}/health`,
      merchant_graphql: `${SERVICES.MERCHANT_GRAPHQL}/health`,
      order_graphql:    `${SERVICES.ORDER_GRAPHQL}/health`,
    },
  });
});

// ── Routing: User Service (Go/Gin - REST) ────────────────────────────
app.use('/api/users', createProxyMiddleware(
  proxyOptions(SERVICES.USER, { '^/api/users': '/users' })
));

// ── Routing: Merchant Service (Node.js - REST & GraphQL asli) ────────
app.use('/api/merchants', createProxyMiddleware(
  proxyOptions(SERVICES.MERCHANT, { '^/api/merchants': '' })
));

// ── Routing: Merchant GraphQL (Layer terpisah) ───────────────────────
app.use('/merchant/graphql', createProxyMiddleware(
  proxyOptions(SERVICES.MERCHANT_GRAPHQL, { '^/merchant/graphql': '/graphql' })
));

// ── Routing: Order Service (Python/FastAPI - REST) ───────────────────
app.use('/api/orders', createProxyMiddleware(
  proxyOptions(SERVICES.ORDER, { '^/api/orders': '/api/orders' })
));

// ── Routing: Order GraphQL (Layer terpisah) ──────────────────────────
app.use('/order/graphql', createProxyMiddleware(
  proxyOptions(SERVICES.ORDER_GRAPHQL, { '^/order/graphql': '/graphql' })
));

// ── Routing: Payment Service (Python/FastAPI - REST) ─────────────────
app.use('/api/payments', createProxyMiddleware(
  proxyOptions(SERVICES.PAYMENT, { '^/api/payments': '/api/payments' })
));

// ── Routing: Analytics Service (Python/FastAPI - REST) ───────────────
app.use('/api/analytics', createProxyMiddleware(
  proxyOptions(SERVICES.ANALYTICS, { '^/api/analytics': '/api/analytics' })
));

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan di API Gateway`,
    available_routes: [
      'GET  /health',
      'ANY  /api/users/*',
      'ANY  /api/merchants/*',
      'ANY  /api/orders/*',
      'ANY  /api/payments/*',
      'ANY  /api/analytics/*',
      'ANY  /merchant/graphql',
      'ANY  /order/graphql',
    ],
  });
});

// ── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway berjalan di http://localhost:${PORT}`);
  console.log(`\n📡 Routing Konfigurasi:`);
  console.log(`   /api/users/*        → ${SERVICES.USER}`);
  console.log(`   /api/merchants/*    → ${SERVICES.MERCHANT}`);
  console.log(`   /api/orders/*       → ${SERVICES.ORDER}`);
  console.log(`   /api/payments/*     → ${SERVICES.PAYMENT}`);
  console.log(`   /api/analytics/*    → ${SERVICES.ANALYTICS}`);
  console.log(`   /merchant/graphql   → ${SERVICES.MERCHANT_GRAPHQL}`);
  console.log(`   /order/graphql      → ${SERVICES.ORDER_GRAPHQL}`);
  console.log('');
});
