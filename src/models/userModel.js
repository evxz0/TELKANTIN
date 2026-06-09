const db = require('../config/database');

async function createUser({ full_name, email, password_hash, role = 'mahasiswa', phone = null, nim_nip = null }) {
  const [result] = await db.execute(
    'INSERT INTO users (full_name, email, password_hash, role, phone, nim_nip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [full_name, email, password_hash, role, phone, nim_nip]
  );

  return result.insertId;
}

async function findUserByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await db.execute('SELECT id, full_name, email, role, phone, nim_nip, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateUserProfile(id, { full_name, phone, nim_nip }) {
  const [result] = await db.execute(
    'UPDATE users SET full_name = ?, phone = ?, nim_nip = ?, updated_at = NOW() WHERE id = ?',
    [full_name, phone, nim_nip, id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
};
