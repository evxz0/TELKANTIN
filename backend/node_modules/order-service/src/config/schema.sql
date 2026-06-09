-- ============================================================
-- TELKANTIN Order Service — Database Schema
-- Mounted as /docker-entrypoint-initdb.d/02-order-schema.sql
-- ============================================================

USE telkantin;

-- ── Carts ────────────────────────────────────────────────────
-- Setiap user hanya punya satu keranjang aktif.
CREATE TABLE IF NOT EXISTS carts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user (user_id)
);

-- ── Cart Items ───────────────────────────────────────────────
-- Item di keranjang, merujuk ke menu di merchant-service.
CREATE TABLE IF NOT EXISTS cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cart_id     INT NOT NULL,
  menu_id     VARCHAR(36) NOT NULL,
  merchant_id VARCHAR(36) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  price       DECIMAL(12,2) NOT NULL,
  notes       TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_cart_menu (cart_id, menu_id)
);

-- ── Orders ───────────────────────────────────────────────────
-- Satu order per warung. Checkout multi-warung = multi-order.
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  merchant_id     VARCHAR(36) NOT NULL,
  status          ENUM('pending','confirmed','preparing','ready','completed','cancelled')
                    NOT NULL DEFAULT 'pending',
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status  ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  notes           TEXT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_merchant (merchant_id),
  INDEX idx_status (status)
);

-- ── Order Items ──────────────────────────────────────────────
-- Snapshot item yang dipesan (immutable setelah checkout).
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  menu_id     VARCHAR(36) NOT NULL,
  menu_name   VARCHAR(100) NOT NULL,
  quantity    INT NOT NULL,
  price       DECIMAL(12,2) NOT NULL,
  notes       TEXT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
