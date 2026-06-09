-- ============================================
-- TELKANTIN Merchant Service - Database Schema
-- Jalankan query ini di phpMyAdmin XAMPP
-- ============================================

CREATE DATABASE IF NOT EXISTS telkantin;
USE telkantin;

-- Tabel Merchants (warung/stand kantin)
CREATE TABLE IF NOT EXISTS merchants (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_open BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_owner_id (owner_id)
);

-- Tabel Categories (kategori menu per merchant)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  INDEX idx_merchant_id (merchant_id)
);

-- Tabel Menus (makanan/minuman)
CREATE TABLE IF NOT EXISTS menus (
  id CHAR(36) NOT NULL PRIMARY KEY,
  merchant_id CHAR(36) NOT NULL,
  category_id INT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  stock INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_category_id (category_id)
);
