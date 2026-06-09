const merchantModel = require('../models/merchantModel');

exports.createMerchant = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Asumsi req.user.id di-inject oleh authMiddleware
    const ownerId = req.user ? req.user.id : 'DUMMY_OWNER_ID'; 

    const newMerchant = await merchantModel.createMerchant({
      ownerId,
      name,
      description
    });

    res.status(201).json({
      message: 'Merchant berhasil dibuat',
      data: newMerchant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.getMerchants = async (req, res) => {
  try {
    const merchants = await merchantModel.getMerchants();
    res.status(200).json({ data: merchants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.getMerchantById = async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await merchantModel.getMerchantById(id);
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant tidak ditemukan' });
    }

    res.status(200).json({ data: merchant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.updateMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isOpen } = req.body;

    const updatedMerchant = await merchantModel.updateMerchant(id, {
      name,
      description,
      isOpen
    });

    res.status(200).json({
      message: 'Merchant berhasil diupdate',
      data: updatedMerchant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

exports.deleteMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    await merchantModel.deleteMerchant(id);
    res.status(200).json({ message: 'Merchant berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
