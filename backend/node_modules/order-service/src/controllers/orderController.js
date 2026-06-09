const orderModel = require('../models/orderModel');
const paymentServiceClient = require('../services/paymentServiceClient');

/**
 * POST /api/orders/checkout
 * Checkout: buat pesanan dari isi keranjang.
 * Satu order dibuat per merchant (multi-merchant = multi-order).
 * Menggunakan MySQL Transaction untuk integritas data.
 *
 * Body: { notes? }
 */
exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    const orders = await orderModel.createOrdersFromCart(userId, notes || null);

    // Notifikasi Payment Service untuk setiap order yang dibuat
    for (const order of orders) {
      const paymentResult = await paymentServiceClient.notifyOrderCreated(
        order.id,
        order.total_amount,
        userId
      );

      if (paymentResult) {
        order.payment_info = paymentResult;
      }
    }

    res.status(201).json({
      message: `Checkout berhasil! ${orders.length} pesanan dibuat.`,
      data: orders,
    });
  } catch (error) {
    console.error('[OrderController] checkout error:', error);

    // Error dari validasi model (stok habis, keranjang kosong, dll)
    if (error.message && !error.message.includes('Internal')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * GET /api/orders
 * Lihat semua pesanan milik user yang sedang login.
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getOrdersByUser(userId);

    res.status(200).json({ data: orders });
  } catch (error) {
    console.error('[OrderController] getMyOrders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * GET /api/orders/:id
 * Lihat detail satu pesanan.
 * User hanya bisa melihat pesanannya sendiri, merchant bisa melihat pesanan yang masuk.
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    // Cek akses: user hanya bisa lihat pesanannya sendiri
    if (req.user.role !== 'merchant' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pesanan ini.' });
    }

    res.status(200).json({ data: order });
  } catch (error) {
    console.error('[OrderController] getOrderById error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * GET /api/orders/merchant/:merchantId
 * Lihat semua pesanan yang masuk untuk merchant tertentu.
 * Hanya bisa diakses oleh user dengan role 'merchant'.
 */
exports.getOrdersByMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const orders = await orderModel.getOrdersByMerchant(merchantId);

    res.status(200).json({ data: orders });
  } catch (error) {
    console.error('[OrderController] getOrdersByMerchant error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Update status pesanan (oleh merchant).
 * Validasi transisi status dilakukan di model.
 *
 * Body: { status }
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Field "status" wajib diisi.' });
    }

    // Verifikasi pesanan ada
    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    await orderModel.updateOrderStatus(id, status);

    // Dapatkan data order yang sudah diupdate
    const updatedOrder = await orderModel.getOrderById(id);

    res.status(200).json({
      message: `Status pesanan berhasil diubah menjadi "${status}".`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[OrderController] updateOrderStatus error:', error);

    // Error dari validasi transisi status
    if (error.message && error.message.includes('Tidak dapat mengubah status')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PATCH /api/orders/:id/payment
 * Update status pembayaran pesanan.
 * Endpoint ini dipanggil oleh Payment Service (callback/webhook).
 *
 * Body: { payment_status }
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({ message: 'Field "payment_status" wajib diisi.' });
    }

    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    await orderModel.updatePaymentStatus(id, payment_status);

    const updatedOrder = await orderModel.getOrderById(id);

    res.status(200).json({
      message: `Status pembayaran berhasil diubah menjadi "${payment_status}".`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[OrderController] updatePaymentStatus error:', error);

    if (error.message && error.message.includes('tidak valid')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};
