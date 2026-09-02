import { 
  getSupabaseClient, 
  getSupabaseCredentials,
  initSupabaseFromRemote,
  PROJECTIONS, 
  getFromCache, 
  setInCache, 
  invalidateCache 
} from '../lib/supabase';
import { uploadImageToSupabaseStorage } from '../lib/imageOptimization';
import { Product } from '../types';
import { 
  AdminOrder, 
  AdminProduct, 
  BakeryHubLocation, 
  BlackoutDate, 
  ArchivedItem, 
  OrderStatus, 
  PaymentStatus,
  normalizeOrderStatus 
} from '../components/admin/types';
import { normalizeProductCategory } from '../data/bakeryStore';

// Safe query execution helper with robust timeout management
async function executeWithTimeout<T>(
  queryPromise: PromiseLike<T> | Promise<T>, 
  timeoutMs = 15000
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Query timeout limit exceeded')), timeoutMs);
  });

  try {
    const result = await Promise.race([
      Promise.resolve(queryPromise),
      timeoutPromise
    ]);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Helper to map any Supabase row format to a Product
export function mapSupabaseRowToProduct(row: any): Product {
  const isInStock = 
    row.in_stock === true || 
    row.in_stock === 'true' || 
    row.is_available === true || 
    row.is_available === 'true' || 
    row.available === true ||
    row.available === 'true' ||
    row.status === 'active' ||
    row.status === 'available' ||
    (typeof row.stock === 'number' && row.stock > 0) || 
    row.availability === 'In Stock' || 
    (row.in_stock === undefined && row.is_available === undefined && row.availability !== 'Sold Out');

  const category = normalizeProductCategory(row.category || row.type || row.collection || row.tag || 'Pastries');
  const nameLower = String(row.name || row.title || '').toLowerCase();
  const rawId = String(row.id || row.product_id || row.uuid || '');

  // Exact image extraction without injecting hardcoded mock product photos
  const rawImage = 
    row.image || 
    row.image_url || 
    row.imageUrl ||
    row.photo || 
    row.photo_url ||
    row.photoUrl ||
    row.img || 
    row.picture || 
    row.thumbnail || 
    row.cover_image ||
    row.cover_image_url ||
    row.product_image ||
    (Array.isArray(row.images) && row.images[0]) || 
    (Array.isArray(row.gallery_images) && row.gallery_images[0]) ||
    '';

  const mainImage = rawImage;

  let imagesList = mainImage ? [mainImage] : [];
  if (Array.isArray(row.images) && row.images.length > 0) {
    imagesList = row.images.filter(Boolean);
  } else if (Array.isArray(row.gallery_images) && row.gallery_images.length > 0) {
    imagesList = row.gallery_images.filter(Boolean);
  } else if (typeof row.images === 'string' && row.images.trim()) {
    try {
      if (row.images.startsWith('[')) {
        const parsed = JSON.parse(row.images);
        if (Array.isArray(parsed) && parsed.length > 0) imagesList = parsed.filter(Boolean);
      } else {
        imagesList = row.images.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } catch {
      imagesList = [row.images];
    }
  }

  let detailsList = [
    'Freshly baked daily using premium ingredients',
    'No artificial preservatives',
    'Artisan crafted recipe'
  ];
  if (Array.isArray(row.details) && row.details.length > 0) {
    detailsList = row.details;
  } else if (typeof row.details === 'string' && row.details.trim()) {
    try {
      if (row.details.startsWith('[')) detailsList = JSON.parse(row.details);
      else detailsList = row.details.split('\n').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      detailsList = [row.details];
    }
  }

  let allergensList = ['Wheat', 'Dairy', 'Eggs'];
  if (Array.isArray(row.allergens) && row.allergens.length > 0) {
    allergensList = row.allergens;
  } else if (typeof row.allergens === 'string' && row.allergens.trim()) {
    try {
      if (row.allergens.startsWith('[')) allergensList = JSON.parse(row.allergens);
      else allergensList = row.allergens.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch {
      allergensList = [row.allergens];
    }
  }

  let boxVariantsList = ['Box of 10', 'Box of 15', 'Box of 20'];
  if (Array.isArray(row.box_variants) && row.box_variants.length > 0) {
    boxVariantsList = row.box_variants;
  } else if (Array.isArray(row.variants) && row.variants.length > 0) {
    boxVariantsList = row.variants;
  } else if (typeof row.box_variants === 'string' && row.box_variants.trim()) {
    try {
      if (row.box_variants.startsWith('[')) boxVariantsList = JSON.parse(row.box_variants);
    } catch {
      // fallback
    }
  } else if (typeof row.variants === 'string' && row.variants.trim()) {
    try {
      if (row.variants.startsWith('[')) boxVariantsList = JSON.parse(row.variants);
    } catch {
      // fallback
    }
  }

  const rawPrice = Number(row.price ?? row.base_price ?? row.unit_price ?? row.amount ?? row.cost ?? 350);
  const rawBasePrice = Number(row.base_price ?? row.price ?? row.unit_price ?? row.amount ?? 350);

  return {
    id: String(row.id || row.product_id || row.uuid || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
    name: row.name || row.title || row.product_name || row.item_name || row.label || 'Artisan Bakery Creation',
    category: normalizeProductCategory(row.category || row.type || row.collection || row.tag || 'Pastries'),
    price: isNaN(rawPrice) || rawPrice <= 0 ? 350 : rawPrice,
    basePrice: isNaN(rawBasePrice) || rawBasePrice <= 0 ? 350 : rawBasePrice,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    description: row.description || row.desc || row.summary || row.about || '',
    details: detailsList,
    image: mainImage,
    images: imagesList,
    galleryImages: imagesList,
    badge: row.badge || undefined,
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || row.review_count || 85),
    isNew: Boolean(row.is_new || row.is_new_arrival),
    prepTime: row.prep_time || row.lead_time || 'Baked Fresh Daily',
    leadTime: row.lead_time || row.prep_time || '24 hrs',
    allergens: allergensList,
    availability: isInStock ? 'In Stock' : 'Sold Out',
    inStock: isInStock,
    storageInstructions: row.storage_instructions || 'Keep in a cool dry place or refrigerate to preserve freshness.',
    reheatingInstructions: row.reheating_instructions || 'Warm in a toaster oven for 2-3 minutes before serving for best bakery aroma.',
    boxVariants: boxVariantsList,
    variants: boxVariantsList
  };
}

// Diagnostic helper to test Supabase connection
export async function testSupabaseHealth(): Promise<{
  success: boolean;
  message: string;
  count: number;
  url?: string;
}> {
  await initSupabaseFromRemote();
  const { url, key } = getSupabaseCredentials();

  // 1. Check server endpoint
  try {
    const headers: Record<string, string> = {};
    if (url && key) {
      headers['x-supabase-url'] = url;
      headers['x-supabase-key'] = key;
    }
    const res = await fetch('/api/supabase/status', { headers });
    if (res.ok) {
      const json = await res.json();
      if (json.connected) {
        return {
          success: true,
          message: `Connected successfully! Found ${json.productCount} product(s) in Supabase.`,
          count: json.productCount,
          url: json.url
        };
      } else if (json.configured) {
        return {
          success: false,
          message: `Connected to Supabase URL, but products query returned: ${json.error || 'No response'}`,
          count: 0,
          url: json.url
        };
      }
    }
  } catch {
    // continue to client test
  }

  // 2. Test direct client query
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials are not configured yet.',
      count: 0
    };
  }

  try {
    const { error, count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: `Query failed: ${error.message}. (Check if table "products" exists and RLS allows public read)`,
        count: 0
      };
    }

    return {
      success: true,
      message: `Connected directly! Found ${count ?? 0} product(s) in database.`,
      count: count ?? 0
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection error: ${err?.message || 'Network error'}`,
      count: 0
    };
  }
}

// Helper to invalidate server-side in-memory cache
export function notifyServerCacheInvalidation(): void {
  if (typeof window !== 'undefined') {
    fetch('/api/supabase/invalidate-cache', { method: 'POST' }).catch(() => {});
  }
}

// ==============================================================================
// 1. PRODUCTS CRUD (FAST-PATH DIRECT QUERY + SERVER FALLBACK + REALTIME)
// ==============================================================================

export async function fetchSupabaseProducts(forceRefresh = false): Promise<Product[] | null> {
  const cacheKey = 'products_all';
  if (!forceRefresh) {
    const cached = getFromCache<Product[]>(cacheKey);
    if (cached && cached.length > 0) return cached;
  }

  await initSupabaseFromRemote();
  const supabase = getSupabaseClient();
  const { url, key } = getSupabaseCredentials();

  let rawProductsData: any[] | null = null;

  // 1. FAST-PATH: Direct Client PostgREST Query with Indexed created_at Ordering
  if (supabase) {
    try {
      const { data, error } = await executeWithTimeout(
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300),
        4000 // Fast 4-second timeout for direct query
      );

      if (!error && Array.isArray(data)) {
        rawProductsData = data;
      } else if (error && (error.code === '42P01' || error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('relation'))) {
        const fallback = await supabase.from('Products').select('*').limit(300);
        if (!fallback.error && Array.isArray(fallback.data)) {
          rawProductsData = fallback.data;
        }
      }
    } catch (directErr) {
      console.info('[Supabase] Direct client query notice: switching to server gateway fallback');
    }
  }

  // 2. SERVER GATEWAY FALLBACK: If direct client query had network/auth restriction
  if (rawProductsData === null && (url || supabase)) {
    try {
      const headers: Record<string, string> = {};
      if (url && key) {
        headers['x-supabase-url'] = url;
        headers['x-supabase-key'] = key;
      }
      const queryParam = forceRefresh ? '?fresh=true' : '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const serverRes = await fetch(`/api/supabase/products${queryParam}`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (Array.isArray(json.products)) {
          rawProductsData = json.products;
        }
      }
    } catch (err) {
      console.info('[Supabase] Server gateway fallback finished');
    }
  }

  if (rawProductsData === null) {
    return null;
  }

  if (rawProductsData.length === 0) {
    setInCache(cacheKey, []);
    return [];
  }

  const mapped: Product[] = rawProductsData.map(mapSupabaseRowToProduct);

  setInCache(cacheKey, mapped);
  return mapped;
}

export async function createSupabaseProduct(prod: Product | AdminProduct): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const isStorefront = 'price' in prod;
    const priceVal = isStorefront ? (prod as Product).price : (prod as AdminProduct).basePrice;
    const category = normalizeProductCategory(prod.category);
    const boxVariants = (prod as any).boxVariants || (prod as any).variants || ['Box of 10', 'Box of 15', 'Box of 20'];

    // If image is a base64 string, upload to storage bucket first
    let mainImage = prod.image;
    if (mainImage && (mainImage.startsWith('data:image/') || mainImage.startsWith('blob:'))) {
      mainImage = await uploadImageToSupabaseStorage(mainImage, 'product-images');
    }

    const rawImages: string[] = (prod as any).images || [mainImage];
    const sanitizedImages: string[] = await Promise.all(
      rawImages.map(async (img) => {
        if (img && (img.startsWith('data:image/') || img.startsWith('blob:'))) {
          return await uploadImageToSupabaseStorage(img, 'product-images');
        }
        return img;
      })
    );

    const finalImages = sanitizedImages.length > 0 ? sanitizedImages : [mainImage];

    const row: any = {
      id: prod.id,
      name: prod.name,
      category,
      base_price: priceVal,
      price: priceVal,
      images: finalImages,
      box_variants: boxVariants,
      in_stock: (prod as any).inStock !== undefined ? (prod as any).inStock : true,
      availability: (prod as any).inStock !== false ? 'In Stock' : 'Sold Out',
      description: prod.description || ''
    };

    // Low Egress: Do not request the whole row back on insert
    const { error } = await supabase
      .from('products')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Failed to create/upsert product:', error.message);
      return false;
    }

    invalidateCache('products');
    notifyServerCacheInvalidation();
    return true;
  } catch (err) {
    console.warn('[Supabase] Create product error:', err);
    return false;
  }
}

export async function updateSupabaseProduct(
  productId: string, 
  updates: Partial<AdminProduct | Product>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = normalizeProductCategory(updates.category);
    if ('basePrice' in updates && updates.basePrice !== undefined) {
      payload.base_price = updates.basePrice;
      payload.price = updates.basePrice;
    }
    if ('price' in updates && updates.price !== undefined) {
      payload.price = updates.price;
      payload.base_price = updates.price;
    }
    if (updates.images !== undefined || updates.image !== undefined || (updates as any).galleryImages !== undefined) {
      const rawImageList: string[] = updates.images && updates.images.length > 0
        ? updates.images
        : (updates as any).galleryImages && (updates as any).galleryImages.length > 0
        ? (updates as any).galleryImages
        : updates.image
        ? [updates.image]
        : [];

      const sanitized = await Promise.all(
        rawImageList.map(async (img) => {
          if (img && (img.startsWith('data:image/') || img.startsWith('blob:'))) {
            return await uploadImageToSupabaseStorage(img, 'product-images');
          }
          return img;
        })
      );
      payload.images = sanitized;
    }
    if ('boxVariants' in updates && updates.boxVariants !== undefined) payload.box_variants = updates.boxVariants;
    if (updates.inStock !== undefined) {
      payload.in_stock = updates.inStock;
      payload.availability = updates.inStock ? 'In Stock' : 'Sold Out';
    }
    if (updates.description !== undefined) payload.description = updates.description;

    // Low Egress: Specify select('id') to avoid returning the entire row
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('id');

    if (error) {
      console.warn('[Supabase] Failed to update product:', error.message);
      return false;
    }

    invalidateCache('products');
    notifyServerCacheInvalidation();
    return true;
  } catch (err) {
    console.warn('[Supabase] Update product error:', err);
    return false;
  }
}

export async function deleteSupabaseProduct(productId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.warn('[Supabase] Failed to delete product:', error.message);
      return false;
    }

    invalidateCache('products');
    notifyServerCacheInvalidation();
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete product error:', err);
    return false;
  }
}

export async function toggleSupabaseProductStock(productId: string, inStock: boolean): Promise<boolean> {
  return updateSupabaseProduct(productId, {
    inStock,
    availability: inStock ? 'In Stock' : 'Sold Out'
  } as any);
}

/**
 * Migration Utility: Scans database for products with raw base64 data images,
 * automatically uploads each image to the 'product-images' bucket, and replaces
 * the huge base64 strings with clean, lightweight Supabase Storage public URLs.
 * Queries IDs first so it never fails with payload/buffer size errors.
 */
export async function sanitizeAndMigrateBase64ImagesToBucket(): Promise<{
  totalChecked: number;
  migratedCount: number;
  errors: string[];
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { totalChecked: 0, migratedCount: 0, errors: ['Supabase client is not connected. Please check your Supabase credentials in Settings.'] };
  }

  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // 1. Fetch ONLY lightweight ID & name list first (never crashes browser with oversized Base64 payloads)
    const { data: productIds, error: listError } = await supabase
      .from('products')
      .select('id, name');

    if (listError || !Array.isArray(productIds)) {
      return { totalChecked: 0, migratedCount: 0, errors: [listError?.message || 'Failed to list product IDs from Supabase'] };
    }

    if (productIds.length === 0) {
      return { totalChecked: 0, migratedCount: 0, errors: [] };
    }

    // 2. Process products one-by-one to keep network requests small and responsive
    for (const item of productIds) {
      try {
        const { data: singleProd, error: itemError } = await supabase
          .from('products')
          .select('id, name, image, images, gallery_images')
          .eq('id', item.id)
          .maybeSingle();

        if (itemError || !singleProd) {
          errors.push(`Could not fetch details for product ${item.name || item.id}`);
          continue;
        }

        let needsUpdate = false;
        let newMainImage = singleProd.image;
        let newImages = Array.isArray(singleProd.images) ? [...singleProd.images] : (singleProd.image ? [singleProd.image] : []);
        let newGallery = Array.isArray(singleProd.gallery_images) ? [...singleProd.gallery_images] : newImages;

        // Check main image
        if (newMainImage && (newMainImage.startsWith('data:image/') || newMainImage.startsWith('blob:'))) {
          try {
            newMainImage = await uploadImageToSupabaseStorage(newMainImage, 'product-images');
            needsUpdate = true;
          } catch (e: any) {
            errors.push(`Failed to upload main image for ${item.name || item.id}: ${e?.message}`);
          }
        }

        // Check images array
        const updatedImages: string[] = [];
        for (const img of newImages) {
          if (img && (img.startsWith('data:image/') || img.startsWith('blob:'))) {
            try {
              const uploadedUrl = await uploadImageToSupabaseStorage(img, 'product-images');
              updatedImages.push(uploadedUrl);
              needsUpdate = true;
            } catch (e: any) {
              updatedImages.push(img);
              errors.push(`Failed to upload gallery image for ${item.name || item.id}`);
            }
          } else if (img) {
            updatedImages.push(img);
          }
        }
        newImages = updatedImages.length > 0 ? updatedImages : (newMainImage ? [newMainImage] : []);

        // Check gallery_images array
        const updatedGallery: string[] = [];
        for (const img of newGallery) {
          if (img && (img.startsWith('data:image/') || img.startsWith('blob:'))) {
            try {
              const uploadedUrl = await uploadImageToSupabaseStorage(img, 'product-images');
              updatedGallery.push(uploadedUrl);
              needsUpdate = true;
            } catch (e: any) {
              updatedGallery.push(img);
            }
          } else if (img) {
            updatedGallery.push(img);
          }
        }
        newGallery = updatedGallery.length > 0 ? updatedGallery : newImages;

        if (needsUpdate) {
          const { error: updateErr } = await supabase
            .from('products')
            .update({
              image: newMainImage,
              images: newImages,
              gallery_images: newGallery
            })
            .eq('id', item.id);

          if (!updateErr) {
            migratedCount++;
          } else {
            errors.push(`Failed updating row in Supabase for ${item.name || item.id}: ${updateErr.message}`);
          }
        }
      } catch (rowErr: any) {
        errors.push(`Error processing ${item.name || item.id}: ${rowErr?.message || rowErr}`);
      }
    }

    invalidateCache('products');
    notifyServerCacheInvalidation();

    return {
      totalChecked: productIds.length,
      migratedCount,
      errors
    };
  } catch (err: any) {
    return {
      totalChecked: 0,
      migratedCount: 0,
      errors: [err?.message || 'Unexpected migration exception']
    };
  }
}

// ==============================================================================
// SUPABASE REALTIME LISTENERS (Push instant updates without page reload)
// ==============================================================================

/**
 * Subscribes to Supabase Realtime changes on public.products
 * Receives INSERT, UPDATE, DELETE events immediately over WebSocket
 */
export function subscribeToSupabaseProducts(
  onUpsert: (product: Product) => void,
  onDelete: (productId: string) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('realtime:products_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          invalidateCache('products');
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.id) {
              const product = mapSupabaseRowToProduct(payload.new);
              onUpsert(product);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              onDelete(deletedId);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Supabase Realtime] Connected to products channel');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to subscribe to products:', err);
    return () => {};
  }
}

/**
 * Subscribes to Supabase Realtime changes on public.orders
 * Receives live checkout orders and status modifications
 */
export function subscribeToSupabaseOrders(
  onUpsert: (order: AdminOrder) => void,
  onDelete: (orderId: string) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('realtime:live_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          invalidateCache('orders');
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.id) {
              const row = payload.new;
              const order: AdminOrder = {
                id: row.id,
                orderNumber: row.order_number,
                customerName: row.customer_name,
                customerPhone: row.customer_phone,
                customerEmail: row.customer_email || undefined,
                type: row.type as any,
                paymentMethod: row.payment_method as any,
                status: normalizeOrderStatus(row.status),
                totalAmount: Number(row.total_amount || 0),
                items: Array.isArray(row.items) ? row.items : [],
                address: row.address || undefined,
                deliveryAddress: row.delivery_address || undefined,
                deliveryNotes: row.delivery_notes || undefined,
                referenceNumber: row.reference_number || undefined,
                pickupHub: row.pickup_hub || 'Main Bakery Counter, Davao City',
                allergyWarnings: row.allergy_warnings || undefined,
                customCakeNotes: row.custom_cake_notes || undefined,
                deliveryDate: row.delivery_date || undefined,
                targetDate: row.target_date || undefined,
                targetTime: row.target_time || undefined,
                createdAt: row.created_at ? new Date(row.created_at).toLocaleString('en-US') : 'Just now'
              };
              onUpsert(order);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              onDelete(deletedId);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Supabase Realtime] Connected to orders stream');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to subscribe to orders:', err);
    return () => {};
  }
}

// ==============================================================================
// 2. ORDERS CRUD (RECENT STREAMS & LIVE ORDERS)
// ==============================================================================

export async function fetchSupabaseOrders(forceRefresh = false): Promise<AdminOrder[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const cacheKey = 'orders_all';
  if (!forceRefresh) {
    const cached = getFromCache<AdminOrder[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const query = supabase
      .from('orders')
      .select(PROJECTIONS.ORDERS_LIST)
      .limit(200);

    const { data, error } = await executeWithTimeout(query, 12000);

    if (error) {
      if (error.message?.includes('timeout') || error.message?.includes('canceling statement')) {
        console.info('[Supabase] Orders query notice: using local cached orders.');
      } else {
        console.info('[Supabase] Notice on orders query:', error.message);
      }
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    const mapped: AdminOrder[] = data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email || undefined,
      type: row.type as any,
      paymentMethod: row.payment_method as any,
      status: normalizeOrderStatus(row.status),
      totalAmount: Number(row.total_amount || 0),
      items: Array.isArray(row.items) ? row.items : [],
      address: row.address || undefined,
      deliveryAddress: row.delivery_address || undefined,
      deliveryNotes: row.delivery_notes || undefined,
      referenceNumber: row.reference_number || undefined,
      pickupHub: row.pickup_hub || 'Main Bakery Counter, Davao City',
      allergyWarnings: row.allergy_warnings || undefined,
      customCakeNotes: row.custom_cake_notes || undefined,
      deliveryDate: row.delivery_date || undefined,
      targetDate: row.target_date || undefined,
      targetTime: row.target_time || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toLocaleString('en-US') : 'Just now'
    }));

    setInCache(cacheKey, mapped);
    return mapped;
  } catch (err: any) {
    console.info('[Supabase] Orders fetch handled with local store fallback');
    return null;
  }
}

export async function createSupabaseOrder(order: AdminOrder): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      type: order.type,
      payment_method: order.paymentMethod,
      status: normalizeOrderStatus(order.status),
      total_amount: order.totalAmount,
      items: order.items || [],
      address: order.address || null,
      delivery_address: order.deliveryAddress || null,
      delivery_notes: order.deliveryNotes || null,
      reference_number: order.referenceNumber || null,
      pickup_hub: order.pickupHub || 'Main Bakery Flagship Kitchen',
      allergy_warnings: order.allergyWarnings || null,
      custom_cake_notes: order.customCakeNotes || null,
      delivery_date: order.deliveryDate || null,
      target_date: order.targetDate || null,
      target_time: order.targetTime || null
    };

    const { error } = await supabase
      .from('orders')
      .insert(row);

    if (error) {
      console.warn('[Supabase] Failed to insert order:', error.message);
      return false;
    }

    invalidateCache('orders');
    return true;
  } catch (err) {
    console.warn('[Supabase] Create order error:', err);
    return false;
  }
}

export async function updateSupabaseOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: normalizeOrderStatus(status),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('id');

    if (error) {
      console.warn('[Supabase] Failed to update order status:', error.message);
      return false;
    }

    invalidateCache('orders');
    return true;
  } catch (err) {
    console.warn('[Supabase] Update order status error:', err);
    return false;
  }
}

export async function updateSupabaseOrderPayment(orderId: string, paymentMethod: PaymentStatus): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('id');

    if (error) {
      console.warn('[Supabase] Failed to update payment status:', error.message);
      return false;
    }

    invalidateCache('orders');
    return true;
  } catch (err) {
    console.warn('[Supabase] Update payment status error:', err);
    return false;
  }
}

export async function deleteSupabaseOrder(orderId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Failed to delete order:', error.message);
      return false;
    }

    invalidateCache('orders');
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete order error:', err);
    return false;
  }
}

// ==============================================================================
// 3. BAKERY HUBS CRUD
// ==============================================================================

export async function fetchSupabaseHubs(forceRefresh = false): Promise<BakeryHubLocation[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const cacheKey = 'hubs_all';
  if (!forceRefresh) {
    const cached = getFromCache<BakeryHubLocation[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const query = supabase
      .from('bakery_hubs')
      .select('id, name, address, hours, phone, is_active')
      .limit(50);

    const { data, error } = await executeWithTimeout(query, 12000);

    if (error) {
      return null;
    }

    if (!data) return [];

    const mapped: BakeryHubLocation[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      hours: r.hours,
      phone: r.phone,
      isActive: Boolean(r.is_active)
    }));

    setInCache(cacheKey, mapped);
    return mapped;
  } catch {
    return null;
  }
}

export async function createSupabaseHub(hub: BakeryHubLocation): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('bakery_hubs')
      .upsert({
        id: hub.id,
        name: hub.name,
        address: hub.address,
        hours: hub.hours,
        phone: hub.phone,
        is_active: hub.isActive
      });

    if (error) {
      console.warn('[Supabase] Create hub error:', error.message);
      return false;
    }

    invalidateCache('hubs');
    return true;
  } catch (err) {
    console.warn('[Supabase] Create hub exception:', err);
    return false;
  }
}

export async function deleteSupabaseHub(hubId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('bakery_hubs')
      .delete()
      .eq('id', hubId);

    if (error) {
      console.warn('[Supabase] Delete hub error:', error.message);
      return false;
    }

    invalidateCache('hubs');
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete hub exception:', err);
    return false;
  }
}

export async function toggleSupabaseHubActive(hubId: string, isActive: boolean): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('bakery_hubs')
      .update({ is_active: isActive })
      .eq('id', hubId)
      .select('id');

    if (error) {
      console.warn('[Supabase] Toggle hub active error:', error.message);
      return false;
    }

    invalidateCache('hubs');
    return true;
  } catch (err) {
    console.warn('[Supabase] Toggle hub active exception:', err);
    return false;
  }
}

// ==============================================================================
// 4. BLACKOUT DATES CRUD
// ==============================================================================

export async function fetchSupabaseBlackouts(forceRefresh = false): Promise<BlackoutDate[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const cacheKey = 'blackouts_all';
  if (!forceRefresh) {
    const cached = getFromCache<BlackoutDate[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const query = supabase
      .from('blackout_dates')
      .select('id, date, reason')
      .limit(100);

    const { data, error } = await executeWithTimeout(query, 12000);

    if (error) {
      return null;
    }

    if (!data) return [];

    const mapped: BlackoutDate[] = data.map((r: any) => ({
      id: r.id,
      date: r.date,
      reason: r.reason
    }));

    setInCache(cacheKey, mapped);
    return mapped;
  } catch {
    return null;
  }
}

export async function createSupabaseBlackout(date: string, reason: string): Promise<BlackoutDate | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const newItem: BlackoutDate = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date,
    reason
  };

  try {
    const { error } = await supabase
      .from('blackout_dates')
      .upsert({
        id: newItem.id,
        date: newItem.date,
        reason: newItem.reason
      });

    if (error) {
      console.warn('[Supabase] Create blackout error:', error.message);
      return null;
    }

    invalidateCache('blackouts');
    return newItem;
  } catch (err) {
    console.warn('[Supabase] Create blackout exception:', err);
    return null;
  }
}

export async function deleteSupabaseBlackout(blackoutId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('blackout_dates')
      .delete()
      .eq('id', blackoutId);

    if (error) {
      console.warn('[Supabase] Delete blackout error:', error.message);
      return false;
    }

    invalidateCache('blackouts');
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete blackout exception:', err);
    return false;
  }
}

// ==============================================================================
// 5. ARCHIVED ITEMS CRUD (ARCHIVE VAULT)
// ==============================================================================

export async function fetchSupabaseArchivedItems(forceRefresh = false): Promise<ArchivedItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const cacheKey = 'archives_all';
  if (!forceRefresh) {
    const cached = getFromCache<ArchivedItem[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const query = supabase
      .from('archived_items')
      .select(PROJECTIONS.ARCHIVES)
      .limit(100);

    const { data, error } = await executeWithTimeout(query, 12000);

    if (error) {
      return null;
    }

    if (!data) return [];

    const mapped: ArchivedItem[] = data.map((r: any) => ({
      id: r.id,
      originalId: r.original_id,
      type: r.type as any,
      title: r.title,
      referenceNumber: r.reference_number || undefined,
      subtitle: r.subtitle || undefined,
      categoryOrStatus: r.category_or_status || undefined,
      archivedAt: r.archived_at,
      archivedBy: r.archived_by || 'Chef Reme (Admin)',
      reason: r.reason || undefined,
      priceOrAmount: r.price_or_amount ? Number(r.price_or_amount) : undefined,
      tags: Array.isArray(r.tags) ? r.tags : [],
      originalPayload: r.original_payload
    }));

    const seenIds = new Set<string>();
    const deduplicatedMapped = mapped.filter((item) => {
      if (!item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    setInCache(cacheKey, deduplicatedMapped);
    return deduplicatedMapped;
  } catch {
    return null;
  }
}

export async function createSupabaseArchivedItem(item: ArchivedItem): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('archived_items')
      .insert({
        id: item.id,
        original_id: item.originalId,
        type: item.type,
        title: item.title,
        reference_number: item.referenceNumber || null,
        subtitle: item.subtitle || null,
        category_or_status: item.categoryOrStatus || null,
        archived_at: item.archivedAt,
        archived_by: item.archivedBy || 'Chef Reme (Admin)',
        reason: item.reason || null,
        price_or_amount: item.priceOrAmount || null,
        tags: item.tags || [],
        original_payload: item.originalPayload
      });

    if (error) {
      console.warn('[Supabase] Create archive error:', error.message);
      return false;
    }

    invalidateCache('archives');
    return true;
  } catch (err) {
    console.warn('[Supabase] Create archive exception:', err);
    return false;
  }
}

export async function deleteSupabaseArchivedItem(itemId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('archived_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.warn('[Supabase] Delete archive error:', error.message);
      return false;
    }

    invalidateCache('archives');
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete archive exception:', err);
    return false;
  }
}

export async function bulkDeleteSupabaseArchivedItems(itemIds: string[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || itemIds.length === 0) return false;

  try {
    const { error } = await supabase
      .from('archived_items')
      .delete()
      .in('id', itemIds);

    if (error) {
      console.warn('[Supabase] Bulk delete archive error:', error.message);
      return false;
    }

    invalidateCache('archives');
    return true;
  } catch (err) {
    console.warn('[Supabase] Bulk delete archive exception:', err);
    return false;
  }
}

// ==============================================================================
// 6. STORE SETTINGS & SOCIAL LINKS
// ==============================================================================

export async function fetchSupabaseSocialLinks(): Promise<{ instagram: string; facebook: string; tiktok: string } | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'social_links')
      .maybeSingle();

    if (error || !data) return null;
    return data.value;
  } catch (err) {
    console.warn('[Supabase] Fetch social links error:', err);
    return null;
  }
}

export async function saveSupabaseSocialLinks(links: { instagram: string; facebook: string; tiktok: string }): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        key: 'social_links',
        value: links,
        updated_at: new Date().toISOString()
      });

    return !error;
  } catch (err) {
    console.warn('[Supabase] Save social links exception:', err);
    return false;
  }
}

// ==============================================================================
// 7. SEED / SYNC UTILITY (ONE-CLICK DATABASE POPULATOR)
// ==============================================================================

export async function syncAllLocalDataToSupabase(
  products: Product[],
  orders: AdminOrder[],
  hubs: BakeryHubLocation[],
  blackouts: BlackoutDate[],
  archives: ArchivedItem[]
): Promise<{ success: boolean; count: number; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { 
      success: false, 
      count: 0, 
      message: 'Supabase credentials are not configured or connected.' 
    };
  }

  try {
    let syncedCount = 0;

    // 1. Sync Products
    if (products.length > 0) {
      const productRows = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: normalizeProductCategory(p.category),
        base_price: p.price,
        price: p.price,
        original_price: p.originalPrice || null,
        image: p.image,
        images: p.galleryImages || [p.image],
        gallery_images: p.galleryImages || [p.image],
        box_variants: p.boxVariants || p.variants || ['Box of 10', 'Box of 15', 'Box of 20'],
        lead_time: p.leadTime || '24 hrs',
        prep_time: p.prepTime || 'Baked Fresh Daily',
        in_stock: p.inStock !== false,
        availability: p.inStock !== false ? 'In Stock' : 'Sold Out',
        allergens: p.allergens || ['Wheat', 'Dairy', 'Eggs'],
        description: p.description || '',
        details: p.details || ['Freshly baked daily', 'Artisan recipe'],
        badge: p.badge || null,
        rating: p.rating || 4.9,
        reviews_count: p.reviewsCount || 85,
        is_new: p.isNew || false
      }));

      const { error: prodErr } = await supabase
        .from('products')
        .upsert(productRows, { onConflict: 'id' });

      if (!prodErr) syncedCount += productRows.length;
    }

    // 2. Sync Hubs
    if (hubs.length > 0) {
      const hubRows = hubs.map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        hours: h.hours,
        phone: h.phone,
        is_active: h.isActive
      }));

      const { error: hubErr } = await supabase
        .from('bakery_hubs')
        .upsert(hubRows, { onConflict: 'id' });

      if (!hubErr) syncedCount += hubRows.length;
    }

    // 3. Sync Blackouts
    if (blackouts.length > 0) {
      const blackoutRows = blackouts.map((b) => ({
        id: b.id,
        date: b.date,
        reason: b.reason
      }));

      const { error: blkErr } = await supabase
        .from('blackout_dates')
        .upsert(blackoutRows, { onConflict: 'id' });

      if (!blkErr) syncedCount += blackoutRows.length;
    }

    // 4. Sync Orders
    if (orders.length > 0) {
      const orderRows = orders.map((o) => ({
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        customer_phone: o.customerPhone,
        customer_email: o.customerEmail || null,
        type: o.type,
        payment_method: o.paymentMethod,
        status: normalizeOrderStatus(o.status),
        total_amount: o.totalAmount,
        items: o.items,
        pickup_hub: o.pickupHub,
        delivery_date: o.deliveryDate,
        target_date: o.targetDate,
        target_time: o.targetTime
      }));

      const { error: ordErr } = await supabase
        .from('orders')
        .upsert(orderRows, { onConflict: 'id' });

      if (!ordErr) syncedCount += orderRows.length;
    }

    // Invalidate caches
    invalidateCache();

    return {
      success: true,
      count: syncedCount,
      message: `Successfully synchronized ${syncedCount} records to Supabase tables!`
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `Failed to synchronize: ${err?.message || 'Unknown network error'}`
    };
  }
}
