const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Semua route order memerlukan autentikasi
router.use(authenticate);

// POST   /api/orders/checkout            → Checkout dari keranjang
router.post('/checkout', orderController.checkout);

// GET    /api/orders                      → Lihat semua pesanan user
router.get('/', orderController.getMyOrders);

// GET    /api/orders/merchant/:merchantId → Pesanan masuk untuk merchant
router.get('/merchant/:merchantId', authorize('merchant'), orderController.getOrdersByMerchant);

// GET    /api/orders/:id                  → Detail satu pesanan
router.get('/:id', orderController.getOrderById);

// PATCH  /api/orders/:id/status           → Update status pesanan (merchant)
router.patch('/:id/status', authorize('merchant'), orderController.updateOrderStatus);

// PATCH  /api/orders/:id/payment          → Update status pembayaran (dari Payment Service)
router.patch('/:id/payment', orderController.updatePaymentStatus);

module.exports = router;
