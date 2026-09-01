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
-- 5. INITIAL MASTER DATA (AUTHENTIC SHEY'S BAKERY DAVAO PRODUCTS, HUBS & SETTINGS)
-- ==============================================================================

-- SEED AUTHENTIC STORE PRODUCTS
INSERT INTO public.products (
    id, name, category, base_price, price, original_price, image, 
    box_variants, lead_time, in_stock, availability, allergens, description, 
    badge, rating, reviews_count, is_new
) VALUES
('prod-mango', 'Mango Tango', 'Pies & Tarts', 1275.00, 1275.00, 1450.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', ARRAY['Box of 10', 'Box of 15', 'Box of 20'], '48 hrs', true, 'In Stock', ARRAY['Wheat (Gluten)', 'Dairy (Fresh Milk & Cream)', 'Eggs'], 'Enjoy layers of sweet Guimaras mango cubes, moist vanilla sponge cake, and delicate mousse, covered with light chantilly cream.', 'Bestseller Cake', 4.98, 184, true),
('prod-1', 'Signature French Butter Croissant (Pack of 3)', 'Pastries', 320.00, 320.00, 380.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', ARRAY['Box of 10', 'Box of 15', 'Box of 20'], 'Freshly Baked Daily', true, 'In Stock', ARRAY['Wheat', 'Dairy', 'Eggs'], 'Flaky, golden, 72-layer butter croissants baked fresh every morning with 100% French Normandy butter.', 'Buy 2 Take 1 Special', 4.90, 342, true),
('prod-2', 'Artisan Country Sourdough Loaf', 'Breads', 280.00, 280.00, NULL, 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80', ARRAY[]::TEXT[], '36-hour wild yeast fermentation', true, 'In Stock', ARRAY['Wheat (Gluten)'], 'Naturally fermented for 36 hours. Crisp, dark crust with a soft, airy, delightfully chewy interior.', 'Baker Choice', 4.92, 195, false),
('prod-3', 'Premium Ube Cheese Ensaymada (Box of 4)', 'Pastries', 450.00, 450.00, NULL, 'https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=800&q=80', ARRAY['Box of 10', 'Box of 15', 'Box of 20'], 'Made to order', true, 'In Stock', ARRAY['Wheat', 'Dairy', 'Eggs'], 'Rich, pillowy sweet brioche topped with real Halaya Ube, pure butter spread, and generously grated Queso de Bola.', 'Bestseller', 4.95, 230, false),
('prod-4', 'San Sebastian Basque Burnt Cheesecake (6")', 'Pies & Tarts', 980.00, 980.00, NULL, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', ARRAY['Box of 10'], 'Requires 4-hour chill time', true, 'In Stock', ARRAY['Dairy', 'Eggs'], 'Silky smooth, caramelized top with a rich creamy molten center. Crafted with imported cream cheese and Madagascar vanilla.', 'Signature Cake', 4.96, 178, false),
('prod-5', 'Dark Chocolate Pain au Chocolat (Box of 4)', 'Pastries', 390.00, 390.00, NULL, 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80', ARRAY['Box of 10', 'Box of 15'], '24 hrs', true, 'In Stock', ARRAY['Wheat', 'Dairy', 'Eggs', 'Soy'], 'Laminated flaky pastry dough rolled around double batons of 70% Malagos & Valrhona dark chocolate.', 'Popular', 4.88, 140, false)
ON CONFLICT (id) DO NOTHING;

-- SEED BAKERY HUBS
INSERT INTO public.bakery_hubs (id, name, address, hours, phone, is_active) VALUES
('hub-1', 'Main Bakery Flagship Kitchen', '124 J.P. Laurel Ave, Bajada, Davao City', '7:00 AM - 8:00 PM Daily', '+63 (082) 224-8891', true),
('hub-2', 'Matina Artisan Collection Hub', 'G/F Matina Town Square, McArthur Hwy, Davao City', '8:00 AM - 9:00 PM Mon-Sat', '+63 (082) 297-3304', true),
('hub-3', 'Lanang Premier Pickup Station', 'Lanang Business Park, Lanang, Davao City', '9:00 AM - 7:00 PM Tue-Sun', '+63 (082) 305-1192', true)
ON CONFLICT (id) DO NOTHING;

-- SEED STORE SETTINGS
INSERT INTO public.store_settings (key, value) VALUES
('social_links', '{"instagram":"https://instagram.com/sheysbakery.ph","facebook":"https://facebook.com/sheysbakeryofficial","tiktok":"https://tiktok.com/@sheysbakery"}'::JSONB),
('admin_config', '{"businessName":"Shey''s Bakery Davao","currency":"PHP","currencySymbol":"₱","taxRate":0.00,"contactPhone":"+63 (082) 224-8891","contactEmail":"orders@sheysbakery.ph"}'::JSONB)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- END OF SCHEMA.SQL
-- ==============================================================================
