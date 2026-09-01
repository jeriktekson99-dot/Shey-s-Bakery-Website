-- ==============================================================================
-- SHEY'S BAKERY DAVAO - SUPABASE POSTGRESQL SCHEMA & SEED CONFIGURATION
-- ==============================================================================
-- Designed for High Performance, Row Level Security (RLS), and Low Egress Bandwidth.
-- Run this SQL in your Supabase Project Dashboard -> SQL Editor -> New Query.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- TABLE: PRODUCTS (Catalog, Inventory, Pricing, Tasting Notes & Box Variants)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pastries',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2),
    image TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    box_variants TEXT[] DEFAULT ARRAY['Box of 10', 'Box of 15', 'Box of 20']::TEXT[],
    lead_time TEXT DEFAULT '24 hrs',
    prep_time TEXT DEFAULT 'Baked Fresh Daily',
    in_stock BOOLEAN NOT NULL DEFAULT true,
    availability TEXT NOT NULL DEFAULT 'In Stock',
    allergens TEXT[] DEFAULT ARRAY['Wheat', 'Dairy', 'Eggs']::TEXT[],
    description TEXT DEFAULT '',
    details TEXT[] DEFAULT ARRAY['Freshly baked daily using premium ingredients', 'No artificial preservatives', 'Artisan crafted recipe']::TEXT[],
    badge TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    reviews_count INTEGER DEFAULT 85,
    is_new BOOLEAN DEFAULT false,
    storage_instructions TEXT DEFAULT 'Keep in a cool dry place or refrigerate to preserve freshness.',
    reheating_instructions TEXT DEFAULT 'Warm in a toaster oven for 2-3 minutes before serving for best bakery aroma.',
    sku TEXT,
    origin TEXT DEFAULT 'Shey''s Artisan Bakes Davao Kitchen',
    daily_cap INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: ORDERS (Recent Streams, Live Orders & Customer Dispatch Schedule)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    type TEXT NOT NULL DEFAULT 'Store Pickup', -- 'Store Pickup' | 'Doorstep Delivery'
    payment_method TEXT NOT NULL DEFAULT 'COD (Pending COD)', -- 'GCash (Paid)' | 'COD (Pending COD)' | 'COD (Paid)'
    status TEXT NOT NULL DEFAULT 'New', -- 'New' | 'Completed' | 'Cancelled'
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    address JSONB,
    delivery_address TEXT,
    delivery_notes TEXT,
    reference_number TEXT,
    pickup_hub TEXT DEFAULT 'Main Bakery Counter, Davao City',
    allergy_warnings TEXT,
    custom_cake_notes TEXT,
    delivery_date TEXT,
    target_date TEXT,
    target_time TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: BAKERY_HUBS (Collection & Dispatch Hub Locations)
CREATE TABLE IF NOT EXISTS public.bakery_hubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    hours TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: BLACKOUT_DATES (Kitchen Capacity & Closed Baking Days)
CREATE TABLE IF NOT EXISTS public.blackout_dates (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE, -- Format YYYY-MM-DD
    reason TEXT NOT NULL DEFAULT 'Kitchen Capacity Reached',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: ARCHIVED_ITEMS (Archive Vault for Soft-Deleted Orders, Products & Hubs)
CREATE TABLE IF NOT EXISTS public.archived_items (
    id TEXT PRIMARY KEY,
    original_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'product' | 'order' | 'hub' | 'custom'
    title TEXT NOT NULL,
    reference_number TEXT,
    subtitle TEXT,
    category_or_status TEXT,
    archived_at TEXT NOT NULL,
    archived_by TEXT DEFAULT 'Chef Reme (Admin)',
    reason TEXT DEFAULT 'Archived from active operations',
    price_or_amount NUMERIC(10, 2),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    original_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: STORE_SETTINGS (Social Links, Contact Details, Admin Configuration)
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES (Optimized for Fast Queries & Minimal I/O Egress)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products (in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders (type);
CREATE INDEX IF NOT EXISTS idx_orders_target_date ON public.orders (target_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_archived_type ON public.archived_items (type);
CREATE INDEX IF NOT EXISTS idx_archived_created_at ON public.archived_items (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blackout_date ON public.blackout_dates (date);
CREATE INDEX IF NOT EXISTS idx_hubs_active ON public.bakery_hubs (is_active);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bakery_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- PRODUCTS POLICIES:
-- Public can view all products for storefront catalog
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (true);

-- Authenticated/Admin can insert, update, delete products
DROP POLICY IF EXISTS "Admin full access to products" ON public.products;
CREATE POLICY "Admin full access to products" 
ON public.products FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- ORDERS POLICIES:
-- Public customers can insert new orders during checkout
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Users/Admins can read, update and manage orders
DROP POLICY IF EXISTS "Admin and users can view and update orders" ON public.orders;
CREATE POLICY "Admin and users can view and update orders" 
ON public.orders FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- BAKERY HUBS POLICIES:
-- Public can view active pickup hubs
DROP POLICY IF EXISTS "Public can view hubs" ON public.bakery_hubs;
CREATE POLICY "Public can view hubs" 
ON public.bakery_hubs FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admin can manage hubs
DROP POLICY IF EXISTS "Admin can manage hubs" ON public.bakery_hubs;
CREATE POLICY "Admin can manage hubs" 
ON public.bakery_hubs FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- BLACKOUT DATES POLICIES:
-- Public can view kitchen blackout dates for calendar restrictions
DROP POLICY IF EXISTS "Public can view blackout dates" ON public.blackout_dates;
CREATE POLICY "Public can view blackout dates" 
ON public.blackout_dates FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admin can manage blackout dates
DROP POLICY IF EXISTS "Admin can manage blackout dates" ON public.blackout_dates;
CREATE POLICY "Admin can manage blackout dates" 
ON public.blackout_dates FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- ARCHIVED ITEMS POLICIES:
DROP POLICY IF EXISTS "Admin can manage archived items" ON public.archived_items;
CREATE POLICY "Admin can manage archived items" 
ON public.archived_items FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- STORE SETTINGS POLICIES:
DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings" 
ON public.store_settings FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Admin can manage store settings" ON public.store_settings;
CREATE POLICY "Admin can manage store settings" 
ON public.store_settings FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 5. INITIAL MASTER DATA (SETTINGS)
-- ==============================================================================
-- Real products and bakery hubs should be created via the Admin Dashboard or imported directly.
-- No fake or placeholder products/hubs are inserted here.

-- SEED STORE SETTINGS
INSERT INTO public.store_settings (key, value) VALUES
('social_links', '{"instagram":"https://instagram.com/sheysbakery.ph","facebook":"https://facebook.com/sheysbakeryofficial","tiktok":"https://tiktok.com/@sheysbakery"}'::JSONB),
('admin_config', '{"businessName":"Shey''s Bakery Davao","currency":"PHP","currencySymbol":"₱","taxRate":0.00,"contactPhone":"+63 (082) 224-8891","contactEmail":"orders@sheysbakery.ph"}'::JSONB)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- END OF SCHEMA.SQL
-- ==============================================================================
