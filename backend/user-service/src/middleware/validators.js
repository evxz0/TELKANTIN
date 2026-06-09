const { body, validationResult } = require('express-validator');

/**
 * Centralized handler — collects all validation errors and returns 400.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validasi gagal.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
}

// ── Register ────────────────────────────────────────────────────────────
const registerRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Nama lengkap wajib diisi.')
    .isLength({ max: 100 })
    .withMessage('Nama lengkap maksimal 100 karakter.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email wajib diisi.')
    .isEmail()
    .withMessage('Format email tidak valid.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi.')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter.'),

  body('role')
    .optional()
    .isIn(['mahasiswa', 'dosen', 'merchant'])
    .withMessage('Role harus salah satu dari: mahasiswa, dosen, merchant.'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone('id-ID')
    .withMessage('Format nomor telepon tidak valid.'),

  body('nim_nip')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('NIM/NIP maksimal 30 karakter.'),
];

// ── Login ───────────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email wajib diisi.')
    .isEmail()
    .withMessage('Format email tidak valid.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi.'),
];

// ── Update Profile ──────────────────────────────────────────────────────
const updateProfileRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Nama lengkap wajib diisi.')
    .isLength({ max: 100 })
    .withMessage('Nama lengkap maksimal 100 karakter.'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone('id-ID')
    .withMessage('Format nomor telepon tidak valid.'),

  body('nim_nip')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('NIM/NIP maksimal 30 karakter.'),
];

module.exports = {
  handleValidationErrors,
  registerRules,
  loginRules,
  updateProfileRules,
};
