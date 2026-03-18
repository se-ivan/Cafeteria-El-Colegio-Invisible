-- POS System Schema for "El Colegio Invisible"
-- Neon PostgreSQL Database

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS alert_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS recipe_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS supplies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS supply_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER');
CREATE TYPE supply_status AS ENUM ('AVAILABLE', 'LOW', 'OUT');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD');

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'CASHIER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Supplies (inventory items/ingredients)
CREATE TABLE supplies (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 0,
  unit TEXT DEFAULT 'unidad',
  reorder_point INTEGER DEFAULT 4,
  status supply_status DEFAULT 'AVAILABLE',
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products (menu items)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe items (product -> supplies relationship)
CREATE TABLE recipe_items (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  supply_id TEXT REFERENCES supplies(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL,
  UNIQUE(product_id, supply_id)
);

-- Sales
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items
CREATE TABLE sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Alert logs for WhatsApp notifications
CREATE TABLE alert_logs (
  id TEXT PRIMARY KEY,
  supply_id TEXT REFERENCES supplies(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_supplies_status ON supplies(status);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_recipe_items_product ON recipe_items(product_id);
CREATE INDEX idx_recipe_items_supply ON recipe_items(supply_id);
