const db = require('../config/database');
const menuServiceClient = require('../services/menuServiceClient');

/**
 * Buat pesanan dari keranjang menggunakan MySQL Transaction.
 *
 * FLOW TRANSAKSI:
 *   BEGIN
 *     1. Ambil semua cart_items, group by merchant_id
 *     2. Untuk setiap merchant:
 *        a. Validasi stok/harga ke Menu Service (jika tersedia)
 *        b. INSERT INTO orders → dapatkan order_id
 *        c. INSERT INTO order_items (batch per order)
 *     3. Hapus cart_items yang sudah di-checkout
 *   COMMIT  (ROLLBACK jika ada error di langkah manapun)
 *
 * @param {number} userId - ID user yang melakukan checkout
 * @param {string|null} notes - Catatan umum dari user
 * @returns {Array} - Daftar order yang berhasil dibuat
 */
async function createOrdersFromCart(userId, notes = null) {
  // Dapatkan koneksi dedicated dari pool untuk transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Ambil cart user
    const [carts] = await connection.execute(
      'SELECT id FROM carts WHERE user_id = ?',
      [userId]
    );

    if (carts.length === 0) {
      throw new Error('Keranjang tidak ditemukan.');
    }

    const cartId = carts[0].id;

    // 2. Ambil semua item di keranjang
    const [cartItems] = await connection.execute(
      'SELECT * FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    if (cartItems.length === 0) {
      throw new Error('Keranjang kosong. Tambahkan item terlebih dahulu.');
    }

    // 3. Group by merchant_id
    const merchantGroups = {};
    for (const item of cartItems) {
      if (!merchantGroups[item.merchant_id]) {
        merchantGroups[item.merchant_id] = [];
      }
      merchantGroups[item.merchant_id].push(item);
    }

    const createdOrders = [];

    // 4. Untuk setiap merchant, buat order terpisah
    for (const [merchantId, items] of Object.entries(merchantGroups)) {

      // 4a. Validasi setiap item ke Menu Service (harga & ketersediaan)
      for (const item of items) {
        const menuData = await menuServiceClient.getMenuById(item.menu_id);

        if (menuData) {
          // Jika Menu Service merespons, validasi
          if (!menuData.isAvailable) {
            throw new Error(`Menu "${menuData.name || item.menu_id}" tidak tersedia saat ini.`);
          }
          if (menuData.stock !== undefined && menuData.stock < item.quantity) {
            throw new Error(
              `Stok menu "${menuData.name || item.menu_id}" tidak mencukupi. ` +
              `Tersedia: ${menuData.stock}, diminta: ${item.quantity}.`
            );
          }
          // Update harga ke harga terbaru dari Menu Service
          item.latest_price = parseFloat(menuData.price) || item.price;
          item.menu_name = menuData.name || 'Unknown';
        } else {
          // Fallback: gunakan data dari cart (Menu Service belum ready)
          item.latest_price = item.price;
          item.menu_name = `Menu-${item.menu_id.substring(0, 8)}`;
        }
      }

      // 4b. Hitung total
      const totalAmount = items.reduce(
        (sum, item) => sum + (item.latest_price * item.quantity),
        0
      );

      // 4c. INSERT order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, merchant_id, status, total_amount, payment_status, notes)
         VALUES (?, ?, 'pending', ?, 'unpaid', ?)`,
        [userId, merchantId, totalAmount, notes]
      );

      const orderId = orderResult.insertId;

      // 4d. INSERT order_items (batch)
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, menu_id, menu_name, quantity, price, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.menu_id, item.menu_name, item.quantity, item.latest_price, item.notes]
        );
      }

      createdOrders.push({
        id: orderId,
        user_id: userId,
        merchant_id: merchantId,
        status: 'pending',
        total_amount: totalAmount,
        payment_status: 'unpaid',
        notes,
        items: items.map(item => ({
          menu_id: item.menu_id,
          menu_name: item.menu_name,
          quantity: item.quantity,
          price: item.latest_price,
          notes: item.notes,
        })),
      });
    }

    // 5. Kosongkan keranjang setelah checkout berhasil
    await connection.execute(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );

    // COMMIT — semua berhasil
    await connection.commit();

    return createdOrders;
  } catch (error) {
    // ROLLBACK — gagal, kembalikan semua perubahan
    await connection.rollback();
    throw error;
  } finally {
    // Kembalikan koneksi ke pool
    connection.release();
  }
}

/**
 * Dapatkan semua pesanan milik user, termasuk order_items.
 */
async function getOrdersByUser(userId) {
  const [orders] = await db.execute(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  // Attach items ke setiap order
  for (const order of orders) {
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = items;
  }

  return orders;
}

/**
 * Dapatkan detail satu pesanan berdasarkan ID.
 */
async function getOrderById(orderId) {
  const [orders] = await db.execute(
    'SELECT * FROM orders WHERE id = ?',
    [orderId]
  );

  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  const [items] = await db.execute(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId]
  );
  order.items = items;

  return order;
}

/**
 * Dapatkan semua pesanan yang masuk ke merchant tertentu.
 */
async function getOrdersByMerchant(merchantId) {
  const [orders] = await db.execute(
    'SELECT * FROM orders WHERE merchant_id = ? ORDER BY created_at DESC',
    [merchantId]
  );

  for (const order of orders) {
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = items;
  }

  return orders;
}

/**
 * Update status pesanan (oleh merchant).
 * Validasi transisi status:
 *   pending → confirmed → preparing → ready → completed
 *   pending/confirmed → cancelled
 */
async function updateOrderStatus(orderId, newStatus) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready'],
    ready: ['completed'],
    completed: [],
    cancelled: [],
  };

  // Dapatkan status saat ini
  const [orders] = await db.execute(
    'SELECT status FROM orders WHERE id = ?',
    [orderId]
  );

  if (orders.length === 0) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  const currentStatus = orders[0].status;
  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Tidak dapat mengubah status dari "${currentStatus}" ke "${newStatus}". ` +
      `Transisi yang diizinkan: ${allowed.join(', ') || 'tidak ada'}.`
    );
  }

  const [result] = await db.execute(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [newStatus, orderId]
  );

  return result.affectedRows > 0;
}

/**
 * Update status pembayaran pesanan.
 * Dipanggil oleh Payment Service (via REST callback).
 */
async function updatePaymentStatus(orderId, paymentStatus) {
  const validStatuses = ['unpaid', 'paid', 'refunded'];

  if (!validStatuses.includes(paymentStatus)) {
    throw new Error(`Status pembayaran tidak valid: "${paymentStatus}".`);
  }

  const [result] = await db.execute(
    'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?',
    [paymentStatus, orderId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createOrdersFromCart,
  getOrdersByUser,
  getOrderById,
  getOrdersByMerchant,
  updateOrderStatus,
  updatePaymentStatus,
};
