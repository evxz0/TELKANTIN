const menuModel = require('../models/menuModel');
const categoryModel = require('../models/categoryModel');

exports.createMenu = async (req, res) => {
  try {
    const { merchantId, categoryId, name, description, price, stock, imageUrl } = req.body;

    const newMenu = await menuModel.createMenu({
      merchantId,
      categoryId,
      name,
      description,
      price,
      stock,
      imageUrl
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
    const { categoryId, name, description, price, stock, isAvailable, imageUrl } = req.body;

    const updatedMenu = await menuModel.updateMenu(id, {
      categoryId,
      name,
      description,
      price,
      stock,
      isAvailable,
      imageUrl
    });

    res.status(200).json({
      message: 'Menu berhasil diupdate',
      data: updatedMenu
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await menuModel.deleteMenu(id);
    res.status(200).json({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
