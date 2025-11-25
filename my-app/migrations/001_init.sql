-- migrations/001_init.sql
-- Basic schema for POS manager backend

-- Users / Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0, -- use numeric for fractional units
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders and order items (history)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  employee_id INTEGER REFERENCES employees(id),
  total NUMERIC NOT NULL,
  tax NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'complete' -- e.g. 'complete', 'void', 'return'
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id),
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  quantity NUMERIC NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- daily_till: running counters that X-report reads and Z-report resets
CREATE TABLE IF NOT EXISTS daily_till (
  id INTEGER PRIMARY KEY DEFAULT 1, -- singleton row with id=1
  sales NUMERIC NOT NULL DEFAULT 0,
  returns NUMERIC NOT NULL DEFAULT 0,
  voids NUMERIC NOT NULL DEFAULT 0,
  discards NUMERIC NOT NULL DEFAULT 0,
  payment_methods JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the singleton exists
INSERT INTO daily_till (id) VALUES (1) ON CONFLICT DO NOTHING;

-- z_reports: snapshot of the daily totals when Z is run
CREATE TABLE IF NOT EXISTS z_reports (
  id SERIAL PRIMARY KEY,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  run_date DATE NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For auditing: keep a separate table of sales_by_item snapshots (optional)
CREATE TABLE IF NOT EXISTS z_sales_items (
  id SERIAL PRIMARY KEY,
  z_report_id INTEGER REFERENCES z_reports(id) ON DELETE CASCADE,
  menu_item_id INTEGER,
  quantity NUMERIC,
  total NUMERIC
);
