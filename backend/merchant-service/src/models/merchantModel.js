const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function createMerchant({ owner_id, name, description }) {
  const id = uuidv4();
  const [result] = await db.execute(
    'INSERT INTO merchants (id, owner_id, name, description, is_open, created_at, updated_at) VALUES (?, ?, ?, ?, true, NOW(), NOW())',
    [id, owner_id, name, description || null]
  );
  return { id, owner_id, name, description, is_open: true };
}

async function getMerchants() {
  const [rows] = await db.execute('SELECT * FROM merchants ORDER BY created_at DESC');
  return rows;
}

async function getMerchantById(id) {
  const [rows] = await db.execute('SELECT * FROM merchants WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getMerchantByOwnerId(ownerId) {
  const [rows] = await db.execute('SELECT * FROM merchants WHERE owner_id = ?', [ownerId]);
  return rows[0] || null;
}

async function updateMerchant(id, { name, description, is_open }) {
  const [result] = await db.execute(
    'UPDATE merchants SET name = ?, description = ?, is_open = ?, updated_at = NOW() WHERE id = ?',
    [name, description, is_open, id]
  );
  return result.affectedRows > 0;
}

async function deleteMerchant(id) {
  const [result] = await db.execute('DELETE FROM merchants WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createMerchant,
  getMerchants,
  getMerchantById,
  getMerchantByOwnerId,
  updateMerchant,
  deleteMerchant,
};
