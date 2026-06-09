const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// Semua route cart memerlukan autentikasi
router.use(authenticate);

// GET    /api/cart              → Lihat isi keranjang
router.get('/', cartController.getCart);

// POST   /api/cart/items        → Tambah item ke keranjang
router.post('/items', cartController.addItem);

// PATCH  /api/cart/items/:itemId → Update jumlah item
router.patch('/items/:itemId', cartController.updateItemQuantity);

// DELETE /api/cart/items/:itemId → Hapus item dari keranjang
router.delete('/items/:itemId', cartController.removeItem);

// DELETE /api/cart              → Kosongkan keranjang
router.delete('/', cartController.clearCart);

module.exports = router;
