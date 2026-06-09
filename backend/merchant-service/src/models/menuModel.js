const prisma = require('../config/prisma');

async function createMenu(data) {
  return prisma.menu.create({
    data,
  });
}

async function getMenuById(id) {
  return prisma.menu.findUnique({
    where: { id },
    include: {
      category: true,
      merchant: {
        select: {
          id: true,
          name: true,
          isOpen: true
        }
      }
    }
  });
}

async function getMenusByMerchant(merchantId) {
  return prisma.menu.findMany({
    where: { merchantId },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function updateMenu(id, data) {
  return prisma.menu.update({
    where: { id },
    data,
  });
}

async function deleteMenu(id) {
  return prisma.menu.delete({
    where: { id },
  });
}

module.exports = {
  createMenu,
  getMenuById,
  getMenusByMerchant,
  updateMenu,
  deleteMenu,
};
