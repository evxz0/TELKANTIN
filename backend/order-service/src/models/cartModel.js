const db = require('../config/database');

/**
 * Dapatkan atau buat keranjang untuk user.
 * Setiap user hanya punya satu keranjang aktif (enforced oleh UNIQUE KEY).
 */
async function getOrCreateCart(userId) {
  // Coba dapatkan cart yang sudah ada
  const [rows] = await db.execute(
    'SELECT * FROM carts WHERE user_id = ?',
    [userId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Buat cart baru
  const [result] = await db.execute(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );

  return { id: result.insertId, user_id: userId };
}

/**
 * Dapatkan semua item di keranjang beserta detailnya.
 */
async function getCartItems(cartId) {
  const [rows] = await db.execute(
    'SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC',
    [cartId]
  );
  return rows;
}

/**
 * Tambah item ke keranjang.
 * Jika menu_id sudah ada di cart, quantity akan ditambahkan (ON DUPLICATE KEY UPDATE).
 */
async function addCartItem(cartId, { menu_id, merchant_id, quantity, price, notes }) {
  const [result] = await db.execute(
    `INSERT INTO cart_items (cart_id, menu_id, merchant_id, quantity, price, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       quantity = quantity + VALUES(quantity),
       price = VALUES(price),
       notes = COALESCE(VALUES(notes), notes)`,
    [cartId, menu_id, merchant_id, quantity, price, notes || null]
  );

  return result;
}

/**
 * Update jumlah item di keranjang.
 * Jika quantity <= 0, item akan dihapus.
 */
async function updateCartItemQuantity(itemId, quantity, cartId) {
  if (quantity <= 0) {
    return removeCartItem(itemId, cartId);
  }

  const [result] = await db.execute(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
    [quantity, itemId, cartId]
  );

  return result;
}

/**
 * Hapus satu item dari keranjang.
 */
async function removeCartItem(itemId, cartId) {
  const [result] = await db.execute(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [itemId, cartId]
  );

  return result;
}

/**
 * Kosongkan seluruh isi keranjang.
 */
async function clearCart(cartId) {
  const [result] = await db.execute(
    'DELETE FROM cart_items WHERE cart_id = ?',
    [cartId]
  );

  return result;
}

/**
 * Dapatkan cart items yang dikelompokkan per merchant.
 * Digunakan saat checkout untuk membuat order per-merchant.
 */
async function getCartItemsGroupedByMerchant(cartId) {
  const [rows] = await db.execute(
    'SELECT * FROM cart_items WHERE cart_id = ? ORDER BY merchant_id, created_at ASC',
    [cartId]
  );

  // Group by merchant_id
  const grouped = {};
  for (const item of rows) {
    if (!grouped[item.merchant_id]) {
      grouped[item.merchant_id] = [];
    }
    grouped[item.merchant_id].push(item);
  }

  return grouped;
}

module.exports = {
  getOrCreateCart,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  getCartItemsGroupedByMerchant,
};
