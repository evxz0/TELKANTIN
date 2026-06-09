const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function createMenu({ merchant_id, category_id, name, description, price, stock, image_url }) {
  const id = uuidv4();
  const [result] = await db.execute(
    'INSERT INTO menus (id, merchant_id, category_id, name, description, price, stock, is_available, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, true, ?, NOW(), NOW())',
    [id, merchant_id, category_id || null, name, description || null, price, stock || 0, image_url || null]
  );
  return { id, merchant_id, category_id, name, description, price, stock: stock || 0, is_available: true, image_url };
}

async function getMenuById(id) {
  const [rows] = await db.execute(
    `SELECT m.*, c.name AS category_name, mc.name AS merchant_name, mc.is_open AS merchant_is_open
     FROM menus m
     LEFT JOIN categories c ON m.category_id = c.id
     LEFT JOIN merchants mc ON m.merchant_id = mc.id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getMenusByMerchant(merchantId) {
  const [rows] = await db.execute(
    `SELECT m.*, c.name AS category_name
     FROM menus m
     LEFT JOIN categories c ON m.category_id = c.id
     WHERE m.merchant_id = ?
     ORDER BY m.created_at DESC`,
    [merchantId]
  );
  return rows;
}

async function updateMenu(id, { category_id, name, description, price, stock, is_available, image_url }) {
  const [result] = await db.execute(
    'UPDATE menus SET category_id = ?, name = ?, description = ?, price = ?, stock = ?, is_available = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
    [category_id || null, name, description, price, stock, is_available, image_url || null, id]
  );
  return result.affectedRows > 0;
}

async function deleteMenu(id) {
  const [result] = await db.execute('DELETE FROM menus WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createMenu,
  getMenuById,
  getMenusByMerchant,
  updateMenu,
  deleteMenu,
};
