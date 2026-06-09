const { hashPassword, comparePassword, signToken } = require('../utils/auth');
const { createUser, findUserByEmail } = require('../models/userModel');

async function register(req, res) {
  try {
    const { full_name, email, password, role = 'mahasiswa', phone, nim_nip } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const password_hash = await hashPassword(password);
    const userId = await createUser({ full_name, email, password_hash, role, phone, nim_nip });

    const token = signToken({ id: userId, email, role });

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      token,
      user: { id: userId, full_name, email, role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat registrasi.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      message: 'Login berhasil.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat login.' });
  }
}

module.exports = {
  register,
  login,
};
