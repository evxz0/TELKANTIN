const menuModel = require('../models/menuModel');

exports.createMenu = async (req, res) => {
  try {
    const { merchant_id, category_id, name, description, price, stock, image_url } = req.body;

    const newMenu = await menuModel.createMenu({
      merchant_id,
      category_id,
      name,
      description,
      price,
      stock,
      image_url
    });

    res.status(201).json({
      message: 'Menu berhasil ditambahkan',
      data: newMenu
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.getMenusByMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const menus = await menuModel.getMenusByMerchant(merchantId);

    res.status(200).json({ data: menus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await menuModel.getMenuById(id);

    if (!menu) {
      return res.status(404).json({ message: 'Menu tidak ditemukan' });
    }

    res.status(200).json({ data: menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, stock, is_available, image_url } = req.body;

    const updated = await menuModel.updateMenu(id, {
      category_id,
      name,
      description,
      price,
      stock,
      is_available,
      image_url
    });

    if (!updated) {
      return res.status(404).json({ message: 'Menu tidak ditemukan' });
    }

    res.status(200).json({ message: 'Menu berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await menuModel.deleteMenu(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Menu tidak ditemukan' });
    }

    res.status(200).json({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
