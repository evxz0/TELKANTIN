const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');

// ── Koneksi MongoDB ──────────────────────────────────────────────────
// Menggunakan koneksi yang sama dengan merchant-service
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telkantin';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ [Merchant-GraphQL] Berhasil terhubung ke MongoDB'))
  .catch(err => {
    console.error('❌ [Merchant-GraphQL] Gagal terhubung ke MongoDB:', err.message);
    process.exit(1);
  });

// ── Model Mongoose (sama dengan merchant-service) ────────────────────
const merchantSchema = new mongoose.Schema({
  name:     { type: String, required: true, maxlength: 100 },
  location: { type: String, maxlength: 255, default: null }
}, { timestamps: true });

const menuSchema = new mongoose.Schema({
  merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  name:        { type: String, required: true, maxlength: 100 },
  price:       { type: Number, required: true }
}, { timestamps: true });

const Merchant = mongoose.model('Merchant', merchantSchema);
const Menu     = mongoose.model('Menu', menuSchema);

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const http = require('http');

// ── Skema GraphQL ────────────────────────────────────────────────────
const typeDefs = `#graphql
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
`;

// ── Resolvers ────────────────────────────────────────────────────────
const resolvers = {
  Query: {
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
    tokoBerdasarkanId: async (_, { id }) => {
      try {
        const m = await Merchant.findById(id);
        if (!m) return null;
        return { id: m._id.toString(), nama: m.name, lokasi: m.location };
      } catch (error) {
        throw new Error('Gagal mengambil data toko: ' + error.message);
      }
    },

    // Mengambil daftar menu berdasarkan ID toko
    menuToko: async (_, { id_toko }) => {
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
    }
  },
  Mutation: {
    // Menambahkan toko baru ke database
    tambahToko: async (_, { nama, lokasi }) => {
      try {
        const merchant = await Merchant.create({ name: nama, location: lokasi || null });
        return { id: merchant._id.toString(), nama: merchant.name, lokasi: merchant.location };
      } catch (error) {
        throw new Error('Gagal menambahkan toko baru: ' + error.message);
      }
    },

    // Menambahkan menu baru ke database
    tambahMenu: async (_, { id_toko, nama_menu, harga }) => {
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
  }
};

// ── Express Server ───────────────────────────────────────────────────
async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get('/health', async (req, res) => {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ok',
      layanan: 'merchant-graphql (Apollo GraphQL - Toko)',
      database: { type: 'MongoDB', status: dbState }
    });
  });

  // Endpoint utama GraphQL
  app.use(
    '/graphql',
    expressMiddleware(server)
  );

  const PORT = process.env.PORT || 4001;

  httpServer.listen(PORT, () => {
    console.log(`🛍️  Merchant-GraphQL (Apollo) berjalan di http://localhost:${PORT}`);
    console.log(`📊 Apollo Sandbox Uji Coba: http://localhost:${PORT}/graphql`);
  });
}

startApolloServer().catch(err => {
  console.error("Gagal memulai Apollo Server:", err);
});
