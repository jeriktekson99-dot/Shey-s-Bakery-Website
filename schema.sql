-- ==============================================================================
-- SHEY'S BAKERY DAVAO - ULTRA-FAST SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Optimized for instant real-time performance, minimal payload, and direct display
-- of actual product inventory with Supabase Realtime WebSocket synchronization.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional cleanup if migrating from older schema versions
DROP TABLE IF EXISTS public.blackout_dates CASCADE;
DROP TABLE IF EXISTS public.bakery_hubs CASCADE;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- TABLE: PRODUCTS (Streamlined for Ultra-Fast Retrieval and Real-Time Speed)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pastries',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    box_variants TEXT[] DEFAULT ARRAY['Box of 10', 'Box of 15', 'Box of 20']::TEXT[],
    description TEXT DEFAULT '',
    in_stock BOOLEAN NOT NULL DEFAULT true,
    availability TEXT NOT NULL DEFAULT 'In Stock',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration safety for existing databases: drop removed / redundant image columns
ALTER TABLE public.products DROP COLUMN IF EXISTS gallery_images CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS image CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS original_price CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS lead_time CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS prep_time CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS allergens CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS details CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS badge CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS rating CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS ratings CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS reviews_count CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS view_counts CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS views CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS storage_instructions CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS reheating_instructions CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS sku CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS origin CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS daily_cap CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_new CASCADE;

-- TABLE: ORDERS (Real-Time Live Orders & Customer Dispatch)
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

-- TABLE: ARCHIVED_ITEMS (Archive Vault for Soft-Deleted Records)
CREATE TABLE IF NOT EXISTS public.archived_items (
    id TEXT PRIMARY KEY,
    original_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'product' | 'order' | 'custom'
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
-- 3. HIGH-SPEED INDEXES (Optimized for Instant WHERE Clauses and Ordering)
-- ==============================================================================

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products (in_stock);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products (availability);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_cat_stock ON public.products (category, in_stock);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders (type);
CREATE INDEX IF NOT EXISTS idx_orders_target_date ON public.orders (target_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Vault Indexes
CREATE INDEX IF NOT EXISTS idx_archived_type ON public.archived_items (type);
CREATE INDEX IF NOT EXISTS idx_archived_created_at ON public.archived_items (created_at DESC);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- PRODUCTS POLICIES:
-- Fast unrestricted catalog viewing for storefront
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (true);

-- Authenticated/Admin full access for products management
DROP POLICY IF EXISTS "Admin full access to products" ON public.products;
CREATE POLICY "Admin full access to products" 
ON public.products FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- ORDERS POLICIES:
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin and users can view and update orders" ON public.orders;
CREATE POLICY "Admin and users can view and update orders" 
ON public.orders FOR ALL 
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
-- 5. SUPABASE REALTIME CONFIGURATION (Instant Push Updates Over WebSocket)
-- ==============================================================================

-- Set Replica Identity to FULL so Realtime payloads include complete old & new row data
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.archived_items REPLICA IDENTITY FULL;
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
DO $$
BEGIN
    -- Add products
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;

    -- Add orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    -- Add archived_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'archived_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.archived_items;
    END IF;

    -- Add store_settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'store_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET CONFIGURATION (product-images)
-- ==============================================================================

-- Create public storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for product-images bucket
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public and authenticated can upload product images" ON storage.objects;
CREATE POLICY "Public and authenticated can upload product images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public and authenticated can update product images" ON storage.objects;
CREATE POLICY "Public and authenticated can update product images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public and authenticated can delete product images" ON storage.objects;
CREATE POLICY "Public and authenticated can delete product images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');

-- ==============================================================================
-- 7. INITIAL STORE SETTINGS MASTER DATA
-- ==============================================================================

INSERT INTO public.store_settings (key, value) VALUES
('social_links', '{"instagram":"https://instagram.com/sheysbakery.ph","facebook":"https://facebook.com/sheysbakeryofficial","tiktok":"https://tiktok.com/@sheysbakery"}'::JSONB),
('admin_config', '{"businessName":"Shey''s Bakery Davao","currency":"PHP","currencySymbol":"₱","taxRate":0.00,"contactPhone":"+63 (082) 224-8891","contactEmail":"orders@sheysbakery.ph"}'::JSONB)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==============================================================================
-- END OF SCHEMA.SQL
-- ==============================================================================
