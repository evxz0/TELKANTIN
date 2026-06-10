const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql2/promise');
const cors = require('cors');

// Membuat koneksi ke database MySQL (Pool Koneksi)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'telkantin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Membuat struktur skema GraphQL menggunakan Bahasa Indonesia
const schema = buildSchema(`
  type Toko {
    id: Int!
    nama: String!
    lokasi: String
  }

  type Menu {
    id: Int!
    id_toko: Int!
    nama_menu: String!
    harga: Float!
  }

  type Query {
    semuaToko: [Toko]
    tokoBerdasarkanId(id: Int!): Toko
    menuToko(id_toko: Int!): [Menu]
  }

  type Mutation {
    tambahToko(nama: String!, lokasi: String): Toko
    tambahMenu(id_toko: Int!, nama_menu: String!, harga: Float!): Menu
  }
`);

// Fungsi-fungsi untuk menangani perintah GraphQL (Resolvers)
const root = {
  // Mengambil semua data toko dari database
  semuaToko: async () => {
    try {
      const [baris] = await pool.query('SELECT * FROM merchants');
      // Menyesuaikan nama kolom database (Inggris) ke struktur GraphQL (Indonesia)
      return baris.map(data => ({
        id: data.id,
        nama: data.name,
        lokasi: data.location
      }));
    } catch (error) {
      throw new Error('Gagal mengambil data semua toko: ' + error.message);
    }
  },

  // Mengambil data satu toko berdasarkan ID
  tokoBerdasarkanId: async ({ id }) => {
    try {
      const [baris] = await pool.query('SELECT * FROM merchants WHERE id = ?', [id]);
      if (baris.length === 0) return null;
      const data = baris[0];
      return { id: data.id, nama: data.name, lokasi: data.location };
    } catch (error) {
      throw new Error('Gagal mengambil data toko: ' + error.message);
    }
  },

  // Mengambil daftar menu berdasarkan ID toko
  menuToko: async ({ id_toko }) => {
    try {
      const [baris] = await pool.query('SELECT * FROM menus WHERE merchant_id = ?', [id_toko]);
      return baris.map(data => ({
        id: data.id,
        id_toko: data.merchant_id,
        nama_menu: data.name,
        harga: data.price
      }));
    } catch (error) {
      throw new Error('Gagal mengambil data menu: ' + error.message);
    }
  },

  // Menambahkan toko baru ke database
  tambahToko: async ({ nama, lokasi }) => {
    try {
      const [hasil] = await pool.query(
        'INSERT INTO merchants (name, location) VALUES (?, ?)',
        [nama, lokasi || null]
      );
      return { id: hasil.insertId, nama: nama, lokasi: lokasi };
    } catch (error) {
      throw new Error('Gagal menambahkan toko baru: ' + error.message);
    }
  },

  // Menambahkan menu baru ke database
  tambahMenu: async ({ id_toko, nama_menu, harga }) => {
    try {
      const [hasil] = await pool.query(
        'INSERT INTO menus (merchant_id, name, price) VALUES (?, ?, ?)',
        [id_toko, nama_menu, harga]
      );
      return { id: hasil.insertId, id_toko: id_toko, nama_menu: nama_menu, harga: harga };
    } catch (error) {
      throw new Error('Gagal menambahkan menu baru: ' + error.message);
    }
  }
};

const app = express();

app.use(cors());
app.use(express.json());

// Rute sederhana untuk mengecek apakah server menyala
app.get('/health', (req, res) => {
  res.json({ status: 'ok', layanan: 'merchant-service (Layanan Toko - Node.js)' });
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
