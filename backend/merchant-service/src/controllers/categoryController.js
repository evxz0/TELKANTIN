const categoryModel = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  try {
    const { merchantId, name } = req.body;

    const newCategory = await categoryModel.createCategory({
      merchantId,
      name
    });

    res.status(201).json({
      message: 'Kategori berhasil dibuat',
      data: newCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.getCategoriesByMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const categories = await categoryModel.getCategoriesByMerchant(merchantId);
    
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const categoryId = parseInt(id, 10);
    const updatedCategory = await categoryModel.updateCategory(categoryId, { name });

    res.status(200).json({
      message: 'Kategori berhasil diupdate',
      data: updatedCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);

    await categoryModel.deleteCategory(categoryId);
    
    res.status(200).json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
