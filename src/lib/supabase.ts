import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or local overrides
let cachedServerUrl: string = '';
let cachedServerKey: string = '';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Hydrate from server endpoint if client env is not populated
export async function initSupabaseFromRemote(): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/config');
    if (!res.ok) return false;
    const json = await res.json();
    if (json.configured && json.url) {
      cachedServerUrl = json.url;
      if (json.anonKey) cachedServerKey = json.anonKey;
      supabaseInstance = null; // Re-initialize with new credentials
      return true;
    }
  } catch (e) {
    // Non-blocking network catch
  }
  return false;
}

// Auto-trigger background hydration
if (typeof window !== 'undefined') {
  initSupabaseFromRemote().catch(() => {});
}

// Check if credentials are provided and valid
export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  let url = (cachedServerUrl || ENV_SUPABASE_URL || '').trim();
  let key = (cachedServerKey || ENV_SUPABASE_ANON_KEY || '').trim();

  // Allow custom override saved in localStorage for easy user setup in UI
  try {
    const savedUrl = localStorage.getItem('sheys_supabase_url');
    const savedKey = localStorage.getItem('sheys_supabase_key');
    if (savedUrl && savedKey) {
      url = savedUrl.trim();
      key = savedKey.trim();
    }
  } catch (e) {
    // Ignore localStorage access issues
  }

  const isConfigured = Boolean(
    url && 
    key && 
    url.startsWith('http') && 
    !url.includes('your-project-ref') && 
    key !== 'your-anon-public-key'
  );

  return { url, key, isConfigured };
}

export function saveCustomSupabaseCredentials(url: string, key: string): void {
  try {
    if (!url && !key) {
      localStorage.removeItem('sheys_supabase_url');
      localStorage.removeItem('sheys_supabase_key');
    } else {
      localStorage.setItem('sheys_supabase_url', url.trim());
      localStorage.setItem('sheys_supabase_key', key.trim());
    }
  } catch (e) {
    console.warn('Failed to save Supabase credentials in storage', e);
  }
  supabaseInstance = null;
  invalidateCache();
  window.dispatchEvent(new CustomEvent('sheys_supabase_config_updated'));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)
      }
    });
  }

  return supabaseInstance;
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

// ==============================================================================
// LOW-EGRESS SELECT PROJECTIONS (MINIMIZE NETWORK PAYLOAD)
// ==============================================================================

export const PROJECTIONS = {
  // Storefront Catalog: High-speed select
  STOREFRONT_PRODUCTS: 'id, name, category, base_price, price, original_price, image, images, box_variants, lead_time, in_stock, availability, badge, rating, reviews_count, is_new, allergens',
  
  // Full Product Profile (fetched on individual product detail page view)
  FULL_PRODUCT: 'id, name, category, base_price, price, original_price, image, images, gallery_images, box_variants, lead_time, prep_time, in_stock, availability, allergens, description, details, badge, rating, reviews_count, is_new, storage_instructions, reheating_instructions, sku, origin, daily_cap',

  // Live Orders Table: Omit full addresses & heavy payload when rendering tables
  ORDERS_LIST: 'id, order_number, customer_name, customer_phone, customer_email, type, payment_method, status, total_amount, items, pickup_hub, delivery_date, target_date, target_time, created_at',

  // Recent Streams: Minimal summary row projection
  ORDERS_STREAM: 'id, order_number, customer_name, customer_phone, type, payment_method, status, total_amount, created_at',

  // Hubs
  HUBS: 'id, name, address, hours, phone, is_active',

  // Blackout Dates
  BLACKOUTS: 'id, date, reason',

  // Archive Vault
  ARCHIVES: 'id, original_id, type, title, reference_number, subtitle, category_or_status, archived_at, archived_by, reason, price_or_amount, tags, original_payload',

  // Store Settings
  SETTINGS: 'key, value, updated_at'
};

// ==============================================================================
// IN-MEMORY SWR CACHE MANAGER (REDUCES DATABASE CALLS & EGRESS USAGE)
// ==============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache TTL for high read efficiency

export function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setInCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
