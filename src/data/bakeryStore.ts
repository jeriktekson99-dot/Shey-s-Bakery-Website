import { Product } from '../types';
import { AdminOrder, AdminProduct, BakeryHubLocation, BlackoutDate, ArchivedItem, normalizeOrderStatus } from '../components/admin/types';
import { 
  fetchSupabaseProducts, 
  fetchSupabaseOrders, 
  fetchSupabaseHubs, 
  fetchSupabaseBlackouts, 
  fetchSupabaseArchivedItems,
  fetchSupabaseSocialLinks,
  saveSupabaseSocialLinks as persistSupabaseSocialLinks
} from '../services/supabaseService';
import { isSupabaseConfigured, initSupabaseFromRemote } from '../lib/supabase';

export const DEFAULT_BAKERY_HUBS: BakeryHubLocation[] = [];

const STORAGE_KEYS = {
  PRODUCTS: 'sheys_bakery_products_v3',
  ORDERS: 'sheys_bakery_orders_v2',
  ARCHIVE: 'sheys_bakery_archive_v2',
  HUBS: 'sheys_bakery_hubs_v2',
  BLACKOUTS: 'sheys_bakery_blackouts_v2',
  SOCIAL_LINKS: 'sheys_social_links_v2'
};

// Utility to generate collision-free unique IDs
export function generateUniqueId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Utility to deduplicate an array of objects by id and ensure strict unique keys
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const cleanList: T[] = [];

  for (const item of items) {
    if (!item) continue;
    let safeId = item.id ? String(item.id).trim() : generateUniqueId('item');
    if (!safeId || seen.has(safeId)) {
      safeId = `${safeId || 'item'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    seen.add(safeId);
    cleanList.push(Object.assign({}, item, { id: safeId }));
  }

  return cleanList;
}

export function normalizeProductCategory(category?: string): string {
  if (!category) return 'Pastries';
  const c = category.trim();
  if (c === 'Artisan Breads' || c === 'Breads & Loaves') return 'Breads';
  if (c === 'Cakes & Tarts' || c === 'Cakes & Pastries') return 'Pies & Tarts';
  if (c === 'Pastries & Buns' || c === 'Viennoiserie') return 'Pastries';
  if (c === 'Specialties' || c === 'Snacks') return 'Specialties & Snacks';
  return c;
}

// Convert a Storefront Product to AdminProduct
export function productToAdminProduct(p: Product): AdminProduct {
  return {
    id: p.id,
    name: p.name,
    category: normalizeProductCategory(p.category),
    basePrice: p.price || p.basePrice || 350,
    image: p.image,
    images: p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : [p.image],
    boxVariants: (p.boxVariants && p.boxVariants.length > 0 ? p.boxVariants : p.variants ? p.variants : ['Box of 10', 'Box of 15', 'Box of 20']) as any,
    leadTime: p.leadTime || p.prepTime || '24 hrs',
    inStock: p.inStock !== undefined ? p.inStock : (p.availability !== 'Sold Out'),
    allergens: p.allergens || ['Wheat', 'Dairy', 'Eggs'],
    description: p.description,
    badge: p.badge,
    details: p.details,
    originalPrice: p.originalPrice,
    rating: p.rating,
    reviewsCount: p.reviewsCount
  };
}

// Convert an AdminProduct to Storefront Product
export function adminProductToProduct(ap: AdminProduct, originalProd?: Product): Product {
  const isInStock = ap.inStock !== undefined ? ap.inStock : true;
  return {
    id: ap.id,
    name: ap.name,
    category: normalizeProductCategory(ap.category),
    price: ap.basePrice,
    basePrice: ap.basePrice,
    originalPrice: ap.originalPrice || (originalProd?.originalPrice),
    description: ap.description || originalProd?.description || '',
    details: ap.details || originalProd?.details || [
      'Freshly baked daily using premium ingredients',
      'No artificial preservatives',
      'Artisan crafted recipe'
    ],
    image: ap.image,
    images: ap.images && ap.images.length > 0 ? ap.images : [ap.image],
    galleryImages: ap.images && ap.images.length > 0 ? ap.images : [ap.image],
    badge: ap.badge || originalProd?.badge,
    rating: ap.rating || originalProd?.rating || 4.9,
    reviewsCount: ap.reviewsCount || originalProd?.reviewsCount || 85,
    isNew: originalProd?.isNew !== undefined ? originalProd.isNew : false,
    prepTime: ap.leadTime || originalProd?.prepTime || 'Baked Fresh Daily',
    leadTime: ap.leadTime,
    allergens: ap.allergens || originalProd?.allergens || ['Wheat', 'Dairy', 'Eggs'],
    availability: isInStock ? 'In Stock' : 'Sold Out',
    inStock: isInStock,
    storageInstructions: originalProd?.storageInstructions || 'Keep in a cool dry place or refrigerate to preserve freshness.',
    reheatingInstructions: originalProd?.reheatingInstructions || 'Warm in a toaster oven for 2-3 minutes before serving for best bakery aroma.',
    variants: (ap.boxVariants && ap.boxVariants.length > 0 ? ap.boxVariants : ['Box of 10', 'Box of 15', 'Box of 20']) as any,
    boxVariants: (ap.boxVariants && ap.boxVariants.length > 0 ? ap.boxVariants : ['Box of 10', 'Box of 15', 'Box of 20']) as any
  };
}

// Build initial products from LOCAL storage or empty array
export function getInitialProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapped = parsed.map((item: any) => {
          if (item.basePrice !== undefined && item.price === undefined) {
            return adminProductToProduct(item);
          }
          return {
            ...item,
            category: normalizeProductCategory(item.category),
            inStock: item.inStock !== undefined ? item.inStock : (item.availability !== 'Sold Out'),
            boxVariants: item.boxVariants || item.variants || ['Box of 10', 'Box of 15', 'Box of 20'],
            variants: item.variants || item.boxVariants || ['Box of 10', 'Box of 15', 'Box of 20']
          };
        });
        const clean = deduplicateById(mapped);
        if (clean.length > 0) {
          return clean;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load products from localStorage', e);
  }

  // Do not preload mock placeholder products; wait for Supabase or return empty array
  return [];
}

// Build initial orders (loads real customer orders or empty array)
export function getInitialOrders(): AdminOrder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy mock placeholder orders
        const realOrders = parsed.filter((o: any) => 
          o && o.id && !['ord-101', 'ord-102', 'ord-103', 'ord-104', 'ord-105'].includes(o.id)
        );
        const mappedOrders = realOrders.map((o: any) => ({
          ...o,
          status: normalizeOrderStatus(o.status)
        }));
        return deduplicateById(mappedOrders);
      }
    }
  } catch (e) {
    console.warn('Failed to load orders from localStorage', e);
  }
  return [];
}

// Build initial archives (loads real archives or empty array)
export function getInitialArchivedItems(): ArchivedItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ARCHIVE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Filter out legacy mock placeholder archives
        const filtered = parsed.filter((item: any) => 
          item && item.id && !['arch-101', 'arch-102'].includes(item.id)
        );
        return deduplicateById(filtered);
      }
    }
  } catch (e) {
    console.warn('Failed to load archive from localStorage', e);
  }
  return [];
}

// Build initial hubs (returns stored hubs or empty array)
export function getInitialHubs(): BakeryHubLocation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HUBS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy mock placeholder hubs
        const realHubs = parsed.filter((h: any) => h && h.id && !['hub-1', 'hub-2', 'hub-3'].includes(h.id));
        if (realHubs.length > 0) {
          return deduplicateById(realHubs);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load hubs from localStorage', e);
  }
  return [];
}

// Build initial blackout dates (loads real blackout rules or empty array)
export function getInitialBlackoutDates(): BlackoutDate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BLACKOUTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((b: any) => 
          b && b.id && !['b-1', 'b-2', 'b-3', 'b-4', 'blk-1', 'blk-2'].includes(b.id)
        );
        return deduplicateById(filtered);
      }
    }
  } catch (e) {
    console.warn('Failed to load blackouts from localStorage', e);
  }
  return [];
}

// Async loader to fetch from Supabase if connected
export async function loadInitialMasterDataFromSupabase(forceRefresh = false): Promise<{
  products?: Product[];
  orders?: AdminOrder[];
  hubs?: BakeryHubLocation[];
  blackouts?: BlackoutDate[];
  archives?: ArchivedItem[];
}> {
  try {
    // Try to hydrate credentials from server if client is not configured
    await initSupabaseFromRemote();

    const [prodRes, ordRes, hubRes, blkRes, archRes] = await Promise.allSettled([
      fetchSupabaseProducts(forceRefresh),
      fetchSupabaseOrders(forceRefresh),
      fetchSupabaseHubs(forceRefresh),
      fetchSupabaseBlackouts(forceRefresh),
      fetchSupabaseArchivedItems(forceRefresh)
    ]);

    const result: any = {};

    if (prodRes.status === 'fulfilled' && prodRes.value !== null) {
      const cleanProds = deduplicateById(prodRes.value);
      result.products = cleanProds;
      saveProductsToStorage(cleanProds);
    }
    if (ordRes.status === 'fulfilled' && ordRes.value !== null) {
      const cleanOrders = deduplicateById(ordRes.value);
      result.orders = cleanOrders;
      saveOrdersToStorage(cleanOrders);
    }
    if (hubRes.status === 'fulfilled' && hubRes.value !== null) {
      const cleanHubs = deduplicateById(hubRes.value);
      result.hubs = cleanHubs;
      saveHubsToStorage(cleanHubs);
    }
    if (blkRes.status === 'fulfilled' && blkRes.value !== null) {
      const cleanBlackouts = deduplicateById(blkRes.value);
      result.blackouts = cleanBlackouts;
      saveBlackoutsToStorage(cleanBlackouts);
    }
    if (archRes.status === 'fulfilled' && archRes.value !== null) {
      const cleanArchives = deduplicateById(archRes.value);
      result.archives = cleanArchives;
      saveArchiveToStorage(cleanArchives);
    }

    return result;
  } catch (err) {
    console.warn('Supabase initial fetch failed, fallback to local', err);
    return {};
  }
}

// Safely cleans up obsolete localStorage keys to free up browser quota
function cleanupLegacyStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (
        k.startsWith('sheys_bakery_products_v1') ||
        k.startsWith('sheys_bakery_products_v2') ||
        k.startsWith('sheys_bakery_orders_v1') ||
        k.startsWith('sheys_bakery_archive_v1') ||
        k.startsWith('sheys_admin_password')
      )) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {
    // Silently ignore
  }
}

// Compact product payload for localStorage fallback cache to avoid exceeding 5MB quota
function compactProductForCache(p: Product): any {
  if (!p) return p;
  // If an image is a massive inline base64 string (>2KB), do not duplicate in local cache
  const cleanImage = (typeof p.image === 'string' && p.image.startsWith('data:image') && p.image.length > 2048)
    ? ''
    : p.image;

  const cleanGallery = Array.isArray(p.galleryImages)
    ? p.galleryImages.filter(img => typeof img === 'string' && (!img.startsWith('data:image') || img.length <= 2048))
    : [];

  return {
    ...p,
    image: cleanImage || (cleanGallery[0] || ''),
    galleryImages: cleanGallery,
    images: cleanGallery
  };
}

// Generic quota-safe localStorage setter
function safeLocalStorageSet<T>(key: string, data: T, compactFn?: (item: T) => any): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    // Check if quota was exceeded or write failed
    cleanupLegacyStorage();
    try {
      if (compactFn) {
        const compacted = compactFn(data);
        localStorage.setItem(key, JSON.stringify(compacted));
        return;
      }
    } catch {
      // If even compacted version fails, remove the key to prevent corrupted state
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently ignore
      }
    }
  }
}

// Persistence helpers
export function saveProductsToStorage(products: Product[]): void {
  if (!Array.isArray(products) || products.length === 0) return;
  safeLocalStorageSet(
    STORAGE_KEYS.PRODUCTS,
    products,
    (prods) => prods.map(compactProductForCache)
  );
}

export function saveOrdersToStorage(orders: AdminOrder[]): void {
  if (!Array.isArray(orders)) return;
  safeLocalStorageSet(STORAGE_KEYS.ORDERS, orders);
}

export function saveArchiveToStorage(items: ArchivedItem[]): void {
  if (!Array.isArray(items)) return;
  safeLocalStorageSet(STORAGE_KEYS.ARCHIVE, items);
}

export function saveHubsToStorage(hubs: BakeryHubLocation[]): void {
  if (!Array.isArray(hubs)) return;
  safeLocalStorageSet(STORAGE_KEYS.HUBS, hubs);
}

export function saveBlackoutsToStorage(blackouts: BlackoutDate[]): void {
  if (!Array.isArray(blackouts)) return;
  safeLocalStorageSet(STORAGE_KEYS.BLACKOUTS, blackouts);
}

export interface StoreSocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
}

export const DEFAULT_SOCIAL_LINKS: StoreSocialLinks = {
  instagram: 'https://instagram.com/sheysbakery.ph',
  facebook: 'https://facebook.com/sheysbakeryofficial',
  tiktok: 'https://tiktok.com/@sheysbakery'
};

export function getSocialLinks(): StoreSocialLinks {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SOCIAL_LINKS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        instagram: parsed.instagram || DEFAULT_SOCIAL_LINKS.instagram,
        facebook: parsed.facebook || DEFAULT_SOCIAL_LINKS.facebook,
        tiktok: parsed.tiktok || DEFAULT_SOCIAL_LINKS.tiktok
      };
    }
  } catch (e) {
    console.warn('Failed to read social links from localStorage', e);
  }
  return DEFAULT_SOCIAL_LINKS;
}

export function saveSocialLinks(links: StoreSocialLinks): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOCIAL_LINKS, JSON.stringify(links));
    window.dispatchEvent(new CustomEvent('sheys_social_links_updated', { detail: links }));
    if (isSupabaseConfigured()) {
      persistSupabaseSocialLinks(links).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save social links to localStorage', e);
  }
}
