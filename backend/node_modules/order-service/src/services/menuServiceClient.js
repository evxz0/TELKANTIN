const axios = require('axios');

const MENU_SERVICE_URL = process.env.MENU_SERVICE_URL || 'http://localhost:3002';

/**
 * Ambil detail menu dari Menu/Merchant Service.
 * Digunakan saat add-to-cart (validasi harga) dan checkout (validasi stok).
 *
 * @param {string} menuId - UUID menu dari merchant-service
 * @returns {object|null} - Data menu atau null jika service tidak tersedia
 */
async function getMenuById(menuId) {
  try {
    const response = await axios.get(`${MENU_SERVICE_URL}/api/menus/${menuId}`, {
      timeout: 5000, // 5 detik timeout
    });

    return response.data.data || response.data;
  } catch (error) {
    // Log warning tapi jangan gagalkan operasi — fallback ke data cart
    console.warn(
      `[MenuServiceClient] Gagal mengambil data menu ${menuId}: ${error.message}. ` +
      `Menggunakan data fallback.`
    );
    return null;
  }
}

/**
 * Kurangi stok menu setelah checkout berhasil.
 * Endpoint ini mungkin belum tersedia di merchant-service.
 *
 * @param {string} menuId - UUID menu
 * @param {number} quantity - Jumlah yang dipesan
 * @returns {boolean} - true jika berhasil, false jika gagal
 */
async function decrementStock(menuId, quantity) {
  try {
    await axios.patch(
      `${MENU_SERVICE_URL}/api/menus/${menuId}`,
      { stock: -quantity }, // Merchant service perlu handle decrement
      { timeout: 5000 }
    );
    return true;
  } catch (error) {
    console.warn(
      `[MenuServiceClient] Gagal mengurangi stok menu ${menuId}: ${error.message}.`
    );
    return false;
  }
}

module.exports = {
  getMenuById,
  decrementStock,
};
