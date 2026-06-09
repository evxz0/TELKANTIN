// Middleware sederhana untuk menangani autentikasi dari Gateway/Client
// Idealnya gateway (Nginx/Kong) atau User Service sudah memverifikasi JWT
// dan menyisipkan X-User-Id ke dalam header, ATAU service ini memverifikasi JWT sendiri.

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Untuk keperluan development awal, kita bypass jika tidak ada token,
  // tapi pada production ini harus strict (misal decode JWT menggunakan secret).
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Mock decode token
    req.user = {
      id: 'mock-user-id-from-token',
      role: 'merchant' // atau diambil dari payload token
    };
  }
  
  next();
};

module.exports = authMiddleware;
