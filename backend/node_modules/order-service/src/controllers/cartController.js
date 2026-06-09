const cartModel = require('../models/cartModel');
const menuServiceClient = require('../services/menuServiceClient');

/**
 * GET /api/cart
 * Lihat isi keranjang user yang sedang login.
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getOrCreateCart(userId);
    const items = await cartModel.getCartItems(cart.id);

    res.status(200).json({
      data: {
        id: cart.id,
        user_id: userId,
        items,
      },
    });
  } catch (error) {
    console.error('[CartController] getCart error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * POST /api/cart/items
 * Tambah item ke keranjang.
 *
 * Body: { menu_id, merchant_id, quantity, notes? }
 * Harga akan diambil dari Menu Service jika tersedia, fallback ke body.price.
 */
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menu_id, merchant_id, quantity, price, notes } = req.body;

    // Validasi input dasar
    if (!menu_id || !merchant_id || !quantity || quantity < 1) {
      return res.status(400).json({
        message: 'menu_id, merchant_id, dan quantity (min 1) wajib diisi.',
      });
    }

    // Coba ambil harga terbaru dari Menu Service
    let finalPrice = price;
    const menuData = await menuServiceClient.getMenuById(menu_id);

    if (menuData) {
      // Validasi ketersediaan
      if (menuData.isAvailable === false) {
        return res.status(400).json({
          message: `Menu "${menuData.name}" sedang tidak tersedia.`,
        });
      }
      // Gunakan harga dari Menu Service
      finalPrice = parseFloat(menuData.price) || price;
    }

    if (!finalPrice || finalPrice <= 0) {
      return res.status(400).json({
        message: 'Harga item tidak valid. Sertakan field "price" jika Menu Service belum tersedia.',
      });
    }

    const cart = await cartModel.getOrCreateCart(userId);
    await cartModel.addCartItem(cart.id, {
      menu_id,
      merchant_id,
      quantity,
      price: finalPrice,
      notes,
    });

    // Return cart terbaru
    const items = await cartModel.getCartItems(cart.id);

    res.status(201).json({
      message: 'Item berhasil ditambahkan ke keranjang.',
      data: {
        id: cart.id,
        user_id: userId,
        items,
      },
    });
  } catch (error) {
    console.error('[CartController] addItem error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PATCH /api/cart/items/:itemId
 * Update jumlah item di keranjang.
 *
 * Body: { quantity }
 */
exports.updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'Field "quantity" wajib diisi.' });
    }

    const cart = await cartModel.getOrCreateCart(userId);
    const result = await cartModel.updateCartItemQuantity(itemId, quantity, cart.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan di keranjang.' });
    }

    const items = await cartModel.getCartItems(cart.id);

    res.status(200).json({
      message: quantity <= 0
        ? 'Item berhasil dihapus dari keranjang.'
        : 'Jumlah item berhasil diupdate.',
      data: {
        id: cart.id,
        user_id: userId,
        items,
      },
    });
  } catch (error) {
    console.error('[CartController] updateItemQuantity error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * DELETE /api/cart/items/:itemId
 * Hapus satu item dari keranjang.
 */
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await cartModel.getOrCreateCart(userId);
    const result = await cartModel.removeCartItem(itemId, cart.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan di keranjang.' });
    }

    const items = await cartModel.getCartItems(cart.id);

    res.status(200).json({
      message: 'Item berhasil dihapus dari keranjang.',
      data: {
        id: cart.id,
        user_id: userId,
        items,
      },
    });
  } catch (error) {
    console.error('[CartController] removeItem error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * DELETE /api/cart
 * Kosongkan seluruh isi keranjang.
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getOrCreateCart(userId);

    await cartModel.clearCart(cart.id);

    res.status(200).json({
      message: 'Keranjang berhasil dikosongkan.',
    });
  } catch (error) {
    console.error('[CartController] clearCart error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};
