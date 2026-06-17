# Sistem Kantin Kampus (Microservices)

Sistem Kantin Kampus adalah aplikasi berbasis **Microservices Architecture** yang dirancang untuk mengelola pemesanan, pengguna, pembayaran, dan analitik untuk sistem kantin. 

Proyek ini menggunakan arsitektur *polyglot* dengan struktur file *flat* yang ringan, didukung oleh Docker Compose, menggunakan kombinasi Go, Node.js, dan Python.

## 🏗 Arsitektur Sistem

Proyek ini terdiri dari 5 *microservice* mandiri, 2 *GraphQL layer* terpisah, dan 1 *API Gateway* sebagai entry point tunggal. Menggunakan arsitektur *polyglot persistence* — MySQL, PostgreSQL, dan MongoDB.

### Microservices

| Service | Port | Teknologi Utama | Deskripsi | API Tipe |
|---------|------|-----------------|-----------|----------|
| **User Service** | `3001` | Go, Gin | Manajemen pengguna, registrasi, login | REST |
| **Merchant Service** | `3002` | Node.js, Express, GraphQL, **MongoDB** | Manajemen data toko/kantin dan menu | GraphQL |
| **Order Service** | `3003` | Python, FastAPI, Strawberry | Mengurus keranjang belanja dan transaksi checkout | GraphQL & REST |
| **Payment Service** | `3004` | Python, FastAPI | Validasi pembayaran | REST |
| **Analytics Service** | `8000` | Python, FastAPI | Mengolah data penjualan dan menu terlaris | REST |

### GraphQL Layer (Terpisah)

| Service | Port | Teknologi Utama | Deskripsi |
|---------|------|-----------------|-----------|
| **Merchant GraphQL** | `4001` | Node.js, Express, GraphQL, MongoDB | GraphQL layer terpisah untuk domain merchant |
| **Order GraphQL** | `4002` | Python, FastAPI, Strawberry, httpx | GraphQL layer terpisah untuk domain order (proxy ke Order Service) |

### API Gateway

| Service | Port | Teknologi Utama | Deskripsi |
|---------|------|-----------------|-----------|
| **API Gateway** | `4000` | Node.js, Express, http-proxy-middleware | Single entry point untuk semua service |

#### Routing API Gateway

| Path | Target Service |
|------|---------------|
| `/api/users/*` | User Service (3001) |
| `/api/merchants/*` | Merchant Service (3002) |
| `/api/orders/*` | Order Service (3003) |
| `/api/payments/*` | Payment Service (3004) |
| `/api/analytics/*` | Analytics Service (8000) |
| `/merchant/graphql` | Merchant GraphQL (4001) |
| `/order/graphql` | Order GraphQL (4002) |

## 📁 Struktur Direktori
Semua *microservice* memiliki struktur folder yang datar (*flat architecture*) agar mudah dipahami:
```text
backend/
├── api-gateway/         # API Gateway (Node.js) - Entry point tunggal
├── merchant-graphql/    # GraphQL Layer - Merchant (Node.js)
├── order-graphql/       # GraphQL Layer - Order (Python)
├── user-service/        # Microservice Go (REST)
├── merchant-service/    # Microservice Node.js (GraphQL)
├── order-service/       # Microservice Python (FastAPI + GraphQL)
├── payment-service/     # Microservice Python (FastAPI)
├── analytics-service/   # Microservice Python (FastAPI)
└── docker-compose.yml   # Orkestrasi seluruh container
```

## 🚀 Panduan Menjalankan Proyek (Untuk Kelompok)

Karena seluruh konfigurasi (*environment*, dependensi, struktur database) sudah disatukan di dalam Docker, cara menjalankan proyek ini sangat mudah agar semua anggota kelompok memiliki environment yang persis sama.

### Prasyarat
- **Docker** dan **Docker Compose** telah terinstal di sistem Anda.
- Git (untuk mengunduh *source code*).

### Langkah-Langkah:
1. **Clone Repository**
   Buka terminal dan lakukan *clone* repositori ini (atau `git pull` jika sudah ada).
   ```bash
   git clone https://github.com/evxz0/TELKANTIN.git
   cd TELKANTIN/backend
   ```

2. **Jalankan Docker Compose**
   Pastikan Docker Engine Anda sudah menyala, lalu jalankan perintah berikut:
   ```bash
   docker-compose up -d --build
   ```
   Perintah ini akan secara otomatis:
    - Mengunduh *image* yang dibutuhkan (Go, Node.js, Python, MySQL, MongoDB).
   - Menginstal semua modul dependensi tiap layanan.
   - Membuat otomatis tabel-tabel database (melalui file `.sql` yang ada).
   - Menjalankan ke-8 layanan (5 microservice + 2 GraphQL layer + 1 API Gateway).

3. **Cek Status Container**
   Pastikan semua *container* berjalan dengan baik (berstatus `Up`):
   ```bash
   docker-compose ps
   ```

4. **Akses Melalui API Gateway**
   Semua request dapat diarahkan melalui API Gateway di port `4000`:
   ```bash
   # Health check gateway
   curl http://localhost:4000/health
   
   # Akses user service via gateway
   curl http://localhost:4000/api/users
   
   # Akses merchant GraphQL via gateway
   curl -X POST http://localhost:4000/merchant/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ semuaToko { id nama lokasi } }"}'
   
   # Akses order GraphQL via gateway
   curl -X POST http://localhost:4000/order/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ orders { id userId merchantId totalAmount status } }"}'
   ```

## 🧪 Cara Menguji API

Kami telah menyertakan koleksi **Postman** untuk memudahkan proses *testing* semua *endpoint* (termasuk *query* GraphQL).

1. Buka aplikasi **Postman**.
2. Klik tombol **Import**.
3. Pilih *file* `TELKANTIN_Postman_Collection.json` yang ada di root direktori repositori ini.
4. Anda akan melihat daftar *request* lengkap (Health Check, GET, POST, serta GraphQL *Query* & *Mutation*) untuk seluruh layanan. Anda tinggal menekan tombol **Send** untuk mengujinya.

### Port Referensi

| Layanan | Port Langsung | Via API Gateway |
|---------|--------------|-----------------|
| API Gateway | `4000` | - |
| User Service | `3001` | `localhost:4000/api/users/*` |
| Merchant Service | `3002` | `localhost:4000/api/merchants/*` |
| Order Service | `3003` | `localhost:4000/api/orders/*` |
| Payment Service | `3004` | `localhost:4000/api/payments/*` |
| Analytics Service | `8000` | `localhost:4000/api/analytics/*` |
| Merchant GraphQL | `4001` | `localhost:4000/merchant/graphql` |
| Order GraphQL | `4002` | `localhost:4000/order/graphql` |

## 🧹 Menghentikan Layanan
Jika Anda ingin menghentikan sementara seluruh layanan, jalankan:
```bash
docker-compose stop
```
Jika Anda ingin menghapus layanan secara permanen (menghapus *container* dan volume database lokal), jalankan:
```bash
docker-compose down -v
```

---
*Dibuat untuk tugas Microservices Kantin Kampus.*
