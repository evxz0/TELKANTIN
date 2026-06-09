const prisma = require('../config/prisma');

async function createCategory(data) {
  return prisma.category.create({
    data,
  });
}

async function getCategoriesByMerchant(merchantId) {
  return prisma.category.findMany({
    where: { merchantId },
    include: {
      _count: {
        select: { menus: true }
      }
    }
  });
}

async function updateCategory(id, data) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

async function deleteCategory(id) {
  return prisma.category.delete({
    where: { id },
  });
}

module.exports = {
  createCategory,
  getCategoriesByMerchant,
  updateCategory,
  deleteCategory,
};
