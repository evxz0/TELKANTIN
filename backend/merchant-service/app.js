const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const cors = require('cors');


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telkantin';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Berhasil terhubung ke MongoDB'))
  .catch(err => {
    console.error('❌ Gagal terhubung ke MongoDB:', err.message);
    process.exit(1);
  });


const merchantSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  location: { type: String, maxlength: 255, default: null }
}, { timestamps: true });

const menuSchema = new mongoose.Schema({
  merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  name: { type: String, required: true, maxlength: 100 },
  price: { type: Number, required: true }
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);
const Menu = mongoose.model('Menu', menuSchema);


const schema = buildSchema(`
  type Toko {
    id: String!
    nama: String!
    lokasi: String
  }

  type Menu {
    id: String!
    id_toko: String!
    nama_menu: String!
    harga: Float!
  }

  type Query {
    semuaToko: [Toko]
    tokoBerdasarkanId(id: String!): Toko
    menuToko(id_toko: String!): [Menu]
  }

  type Mutation {
    tambahToko(nama: String!, lokasi: String): Toko
    tambahMenu(id_toko: String!, nama_menu: String!, harga: Float!): Menu
  }
`);


const root = {
  // Mengambil semua data toko dari database
  semuaToko: async () => {
    try {
      const merchants = await Merchant.find();
      return merchants.map(m => ({
        id: m._id.toString(),
        nama: m.name,
        lokasi: m.location
      }));
    } catch (error) {
      throw new Error('Gagal mengambil data semua toko: ' + error.message);
    }
  },

  // Mengambil data satu toko berdasarkan ID
  tokoBerdasarkanId: async ({ id }) => {
    try {
      const m = await Merchant.findById(id);
      if (!m) return null;
      return { id: m._id.toString(), nama: m.name, lokasi: m.location };
    } catch (error) {
      throw new Error('Gagal mengambil data toko: ' + error.message);
    }
  },

  // Mengambil daftar menu berdasarkan ID toko
  menuToko: async ({ id_toko }) => {
    try {
      const menus = await Menu.find({ merchant_id: id_toko });
      return menus.map(m => ({
        id: m._id.toString(),
        id_toko: m.merchant_id.toString(),
        nama_menu: m.name,
        harga: m.price
      }));
    } catch (error) {
      throw new Error('Gagal mengambil data menu: ' + error.message);
    }
  },

  // Menambahkan toko baru ke database
  tambahToko: async ({ nama, lokasi }) => {
    try {
      const merchant = await Merchant.create({ name: nama, location: lokasi || null });
      return { id: merchant._id.toString(), nama: merchant.name, lokasi: merchant.location };
    } catch (error) {
      throw new Error('Gagal menambahkan toko baru: ' + error.message);
    }
  },

  // Menambahkan menu baru ke database
  tambahMenu: async ({ id_toko, nama_menu, harga }) => {
    try {
      const menu = await Menu.create({ merchant_id: id_toko, name: nama_menu, price: harga });
      return {
        id: menu._id.toString(),
        id_toko: menu.merchant_id.toString(),
        nama_menu: menu.name,
        harga: menu.price
      };
    } catch (error) {
      throw new Error('Gagal menambahkan menu baru: ' + error.message);
    }
  }
};

// ── Express Server ───────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

// Rute sederhana untuk mengecek apakah server menyala
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    layanan: 'merchant-service (Layanan Toko - Node.js)',
    database: { type: 'MongoDB', status: dbState }
  });
});

// Mengatur jalur (endpoint) utama untuk GraphQL
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Mengaktifkan tampilan UI GraphiQL agar mudah diuji coba di browser
}));

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Layanan Toko berjalan di http://localhost:${PORT}`);
  console.log(`Halaman Uji Coba GraphQL: http://localhost:${PORT}/graphql`);
});
