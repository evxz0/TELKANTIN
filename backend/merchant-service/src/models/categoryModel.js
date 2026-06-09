const db = require('../config/database');

async function createCategory({ merchant_id, name }) {
  const [result] = await db.execute(
    'INSERT INTO categories (merchant_id, name) VALUES (?, ?)',
    [merchant_id, name]
  );
  return { id: result.insertId, merchant_id, name };
}

async function getCategoriesByMerchant(merchantId) {
  const [rows] = await db.execute(
    `SELECT c.*, COUNT(m.id) AS menu_count
     FROM categories c
     LEFT JOIN menus m ON c.id = m.category_id
     WHERE c.merchant_id = ?
     GROUP BY c.id`,
    [merchantId]
  );
  return rows;
}

async function getCategoryById(id) {
  const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateCategory(id, { name }) {
  const [result] = await db.execute(
    'UPDATE categories SET name = ? WHERE id = ?',
    [name, id]
  );
  return result.affectedRows > 0;
}

async function deleteCategory(id) {
  const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createCategory,
  getCategoriesByMerchant,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
