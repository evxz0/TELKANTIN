const { findUserById, updateUserProfile } = require('../models/userModel');

async function me(req, res) {
  try {
    const user = await findUserById(req.user.id);
    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Tidak dapat mengambil profil.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { full_name, phone, nim_nip } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Nama lengkap wajib diisi.' });
    }

    const updated = await updateUserProfile(req.user.id, { full_name, phone, nim_nip });
    if (!updated) {
      return res.status(404).json({ message: 'Profil tidak ditemukan.' });
    }

    return res.json({ message: 'Profil berhasil diperbarui.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Tidak dapat memperbarui profil.' });
  }
}

module.exports = { me, updateProfile };
