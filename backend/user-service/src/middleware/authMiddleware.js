const { verifyToken } = require('../utils/auth');
const { findUserById } = require('../models/userModel');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token akses diperlukan.' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

module.exports = { authenticate };
