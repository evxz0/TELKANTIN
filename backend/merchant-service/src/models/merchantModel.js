const prisma = require('../config/prisma');

async function createMerchant(data) {
  return prisma.merchant.create({
    data,
  });
}

async function getMerchantById(id) {
  return prisma.merchant.findUnique({
    where: { id },
  });
}

async function getMerchants() {
  return prisma.merchant.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

async function updateMerchant(id, data) {
  return prisma.merchant.update({
    where: { id },
    data,
  });
}

async function deleteMerchant(id) {
  return prisma.merchant.delete({
    where: { id },
  });
}

module.exports = {
  createMerchant,
  getMerchantById,
  getMerchants,
  updateMerchant,
  deleteMerchant,
};
