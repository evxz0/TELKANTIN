const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

/**
 * Cek status pembayaran pesanan dari Payment Service.
 *
 * @param {number} orderId - ID pesanan
 * @returns {object|null} - Data pembayaran atau null jika service tidak tersedia
 */
async function getPaymentStatus(orderId) {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/payments/order/${orderId}`, {
      timeout: 5000,
    });

    return response.data.data || response.data;
  } catch (error) {
    console.warn(
      `[PaymentServiceClient] Gagal mengambil status bayar order ${orderId}: ${error.message}. ` +
      `Menggunakan status default.`
    );
    return null;
  }
}

/**
 * Beritahu Payment Service bahwa order baru telah dibuat.
 * Payment Service akan membuat record pembayaran dan mengembalikan info pembayaran.
 *
 * @param {number} orderId - ID pesanan
 * @param {number} amount - Total jumlah yang harus dibayar
 * @param {number} userId - ID user yang melakukan order
 * @returns {object|null} - Data pembayaran atau null jika service tidak tersedia
 */
async function notifyOrderCreated(orderId, amount, userId) {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE_URL}/api/payments`,
      {
        order_id: orderId,
        amount,
        user_id: userId,
      },
      { timeout: 5000 }
    );

    return response.data.data || response.data;
  } catch (error) {
    console.warn(
      `[PaymentServiceClient] Gagal mengirim notifikasi order ${orderId}: ${error.message}.`
    );
    return null;
  }
}

module.exports = {
  getPaymentStatus,
  notifyOrderCreated,
};
