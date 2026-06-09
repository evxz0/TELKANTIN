const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Middleware autentikasi JWT.
 * Memverifikasi token dari header Authorization dan attach user ke req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token akses diperlukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user payload dari token ke request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

/**
 * Middleware otorisasi berdasarkan role.
 * @param  {...string} roles - Daftar role yang diizinkan (e.g. 'mahasiswa', 'merchant')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Autentikasi diperlukan.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk operasi ini.' });
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
