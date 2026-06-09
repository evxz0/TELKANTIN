/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('merchant'), handler);
 *   router.get('/staff', authenticate, authorize('dosen', 'merchant'), handler);
 *
 * Must be used AFTER the `authenticate` middleware (which sets req.user).
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses ke resource ini.',
      });
    }
    return next();
  };
}

module.exports = { authorize };
