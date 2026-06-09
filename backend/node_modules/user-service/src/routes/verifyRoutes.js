const express = require('express');
const { verifyToken } = require('../utils/auth');

const router = express.Router();

/**
 * POST /api/auth/verify
 *
 * Internal endpoint for other microservices to validate a JWT.
 * Accepts { token } in the body and returns the decoded payload.
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, message: 'Token diperlukan.' });
  }

  try {
    const decoded = verifyToken(token);
    return res.json({
      valid: true,
      user: { id: decoded.id, email: decoded.email, role: decoded.role },
    });
  } catch (error) {
    return res.status(401).json({ valid: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
});

module.exports = router;
