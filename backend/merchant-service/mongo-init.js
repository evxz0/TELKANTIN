// Skrip seed MongoDB untuk Merchant Service
// Jalankan: mongosh telkantin mongo-init.js

db = db.getSiblingDB('telkantin');

// Membuat koleksi merchants dengan validasi
db.createCollection('merchants', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        name:     { bsonType: 'string', maxLength: 100, description: 'Nama toko - wajib diisi' },
        location: { bsonType: ['string', 'null'], maxLength: 255, description: 'Lokasi toko' }
      }
    }
  }
});

// Membuat koleksi menus dengan validasi
db.createCollection('menus', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['merchant_id', 'name', 'price'],
      properties: {
        merchant_id: { bsonType: 'objectId', description: 'Referensi ke toko - wajib diisi' },
        name:        { bsonType: 'string', maxLength: 100, description: 'Nama menu - wajib diisi' },
        price:       { bsonType: 'number', minimum: 0, description: 'Harga menu - wajib diisi' }
      }
    }
  }
});

// Membuat indeks untuk performa query
db.merchants.createIndex({ name: 1 });
db.menus.createIndex({ merchant_id: 1 });

print('✅ Koleksi merchants dan menus berhasil dibuat!');
