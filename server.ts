import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper: Get Supabase Credentials
function getSupabaseServerConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    ''
  ).trim();

  const isConfigured = Boolean(
    url && 
    key && 
    url.startsWith('http') && 
    !url.includes('your-project-ref') && 
    key !== 'your-anon-public-key'
  );

  return { url, key, isConfigured };
}

let serverSupabaseClient: SupabaseClient | null = null;
function getServerSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  if (customUrl && customKey && customUrl.startsWith('http') && customKey !== 'your-anon-public-key') {
    try {
      return createClient(customUrl, customKey, { auth: { persistSession: false } });
    } catch {
      // fallback
    }
  }

  const { url, key, isConfigured } = getSupabaseServerConfig();
  if (!isConfigured) return null;
  if (!serverSupabaseClient) {
    serverSupabaseClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return serverSupabaseClient;
}

// In-memory store for webhook events and order payments if needed
const paymentTransactions: Record<string, any> = {};

// Helper: Get PayMongo Secret Key
function getPayMongoSecretKey(): string | null {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key || key.trim() === '' || key === 'sk_test_...') {
    return null;
  }
  return key.trim();
}

// Helper: Create Basic Auth Header for PayMongo API
function getPayMongoAuthHeader(secretKey: string): string {
  const base64Key = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${base64Key}`;
}

// ==========================================
// 1. Supabase Gateway & Status Endpoints
// ==========================================
app.get('/api/supabase/config', (req, res) => {
  const { url, key, isConfigured } = getSupabaseServerConfig();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    ''
  ).trim();

  const isAnonValid = Boolean(anonKey && anonKey !== 'your-anon-public-key' && !anonKey.includes('your-anon'));

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({
    configured: isConfigured,
    url: isConfigured ? url : null,
    anonKey: isAnonValid ? anonKey : (key && key !== 'your-anon-public-key' ? key : null)
  });
});

app.get('/api/supabase/status', async (req, res) => {
  const clientUrl = (req.headers['x-supabase-url'] as string) || '';
  const clientKey = (req.headers['x-supabase-key'] as string) || '';
  const { url, isConfigured } = getSupabaseServerConfig();
  const supabase = getServerSupabaseClient(clientUrl, clientKey);

  const effectiveUrl = clientUrl || url;

  if (!supabase) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase URL or Key is not configured in server environment or client settings.',
      url: effectiveUrl || null
    });
  }

  try {
    // Low Egress: Use head: true and select('id') to prevent downloading unnecessary row data
    const { error: prodErr, count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (prodErr) {
      return res.json({
        configured: true,
        connected: false,
        url: effectiveUrl,
        error: prodErr.message,
        hint: prodErr.hint || 'Check if the "products" table exists and has RLS policies configured.'
      });
    }

    return res.json({
      configured: true,
      connected: true,
      url: effectiveUrl,
      productCount: count !== null ? count : 0
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      url: effectiveUrl,
      error: err?.message || 'Failed to query Supabase.'
    });
  }
});

// Optimized projection to fetch all product data efficiently with images
const PRODUCT_METADATA_COLUMNS = 'id, name, category, price, base_price, original_price, box_variants, lead_time, prep_time, in_stock, availability, badge, rating, reviews_count, is_new, allergens, description, details, storage_instructions, reheating_instructions, sku, origin, daily_cap';

let cachedProducts: any[] | null = null;
let lastProductsCacheTime = 0;
const PRODUCTS_CACHE_TTL_MS = 300000; // 5 minutes cache TTL

app.get('/api/supabase/products', async (req, res) => {
  const clientUrl = (req.headers['x-supabase-url'] as string) || '';
  const clientKey = (req.headers['x-supabase-key'] as string) || '';
  const supabase = getServerSupabaseClient(clientUrl, clientKey);

  const forceRefresh = req.query.fresh === 'true';

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');

  if (!forceRefresh && cachedProducts && (Date.now() - lastProductsCacheTime < PRODUCTS_CACHE_TTL_MS)) {
    return res.json({ products: cachedProducts, cached: true });
  }

  if (!supabase) {
    if (cachedProducts) {
      return res.json({ products: cachedProducts, cached: true });
    }
    return res.status(503).json({ error: 'Supabase is not configured on server.', products: [] });
  }

  try {
    // 1. Fetch metadata
    let { data: metadata, error } = await supabase
      .from('products')
      .select(PRODUCT_METADATA_COLUMNS)
      .limit(500);

    if (error && (error.code === '42P01' || error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('relation'))) {
      const fallback1 = await supabase.from('Products').select(PRODUCT_METADATA_COLUMNS).limit(500);
      if (!fallback1.error && fallback1.data) {
        metadata = fallback1.data;
        error = null;
      }
    }

    if (error || !metadata) {
      if (cachedProducts) {
        return res.json({ products: cachedProducts, cached: true });
      }
      return res.status(500).json({ error: error?.message || 'Failed to query products', products: [] });
    }

    // 2. Fetch images in parallel chunks to avoid Supabase row-size statement timeouts
    const chunkSize = 8;
    const chunkCount = Math.ceil(metadata.length / chunkSize) || 3;
    const imagePromises: Promise<any>[] = [];

    for (let i = 0; i < chunkCount; i++) {
      imagePromises.push(
        (async () => {
          try {
            const res = await supabase
              .from('products')
              .select('id, image')
              .range(i * chunkSize, (i + 1) * chunkSize - 1);
            return res.data || [];
          } catch {
            return [];
          }
        })()
      );
    }

    const imageChunks = await Promise.all(imagePromises);
    const imageMap = new Map<string, string>();
    imageChunks.flat().forEach((item: any) => {
      if (item && item.id && item.image) {
        imageMap.set(item.id, item.image);
      }
    });

    const fullProducts = metadata.map((prod: any) => ({
      ...prod,
      image: imageMap.get(prod.id) || prod.image || null
    }));

    cachedProducts = fullProducts;
    lastProductsCacheTime = Date.now();

    return res.json({ products: fullProducts, cached: false });
  } catch (err: any) {
    if (cachedProducts) {
      return res.json({ products: cachedProducts, cached: true });
    }
    return res.status(500).json({ error: err?.message || 'Server query exception', products: [] });
  }
});

// ==========================================
// 2. PayMongo Gateway Status Endpoint
// ==========================================
app.get('/api/paymongo/status', (req, res) => {
  const secretKey = getPayMongoSecretKey();
  const publicKey = process.env.PAYMONGO_PUBLIC_KEY;

  const isConfigured = !!secretKey;
  const isLive = secretKey ? secretKey.startsWith('sk_live_') : false;
  const isTest = secretKey ? secretKey.startsWith('sk_test_') : false;

  res.json({
    configured: isConfigured,
    mode: isLive ? 'live' : isTest ? 'test' : 'simulation',
    supportedMethods: ['gcash', 'paymaya', 'qrph', 'card', 'dob', 'billease'],
    hasPublicKey: !!publicKey,
    publicKeyPrefix: publicKey ? publicKey.substring(0, 7) + '...' : null,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 2. Create PayMongo Checkout Session
// ==========================================
app.post('/api/paymongo/create-checkout-session', async (req, res) => {
  try {
    const {
      items,
      customer,
      deliveryFee = 0,
      orderRef,
      paymentMethodType = 'all',
      fulfillment = 'ship',
      successUrl,
      cancelUrl
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }

    const secretKey = getPayMongoSecretKey();
    const requestOrigin = (req.headers.origin as string) || (req.headers.referer ? new URL(req.headers.referer as string).origin : '');
    const appUrl = requestOrigin || process.env.APP_URL || `http://localhost:${PORT}`;

    // Map line items into PayMongo format (amounts in centavos, PHP currency)
    const lineItems = items.map((item: any) => {
      const unitAmountCentavos = Math.round(Number(item.price || item.amount) * 100);
      const isHttpImg = typeof item.image === 'string' && (item.image.startsWith('http://') || item.image.startsWith('https://'));
      return {
        currency: 'PHP',
        amount: unitAmountCentavos,
        name: item.name || 'Bakery Item',
        quantity: Number(item.quantity || 1),
        description: item.boxSize || item.notes || undefined,
        images: isHttpImg ? [item.image] : undefined
      };
    });

    // Add Delivery Fee as line item if greater than 0
    if (deliveryFee > 0 && fulfillment === 'ship') {
      lineItems.push({
        currency: 'PHP',
        amount: Math.round(deliveryFee * 100),
        name: 'Doorstep Delivery Fee',
        quantity: 1,
        description: 'Motorized baked goods delivery',
        images: undefined
      });
    }

    // Determine payment methods to enable (GCash, Maya, QR Ph)
    let allowedPaymentMethods: string[] = ['gcash', 'paymaya', 'qrph'];
    if (paymentMethodType === 'gcash') {
      allowedPaymentMethods = ['gcash', 'qrph'];
    } else if (paymentMethodType === 'paymaya') {
      allowedPaymentMethods = ['paymaya', 'qrph'];
    } else if (paymentMethodType === 'qrph') {
      allowedPaymentMethods = ['qrph', 'gcash', 'paymaya'];
    }

    const totalCentavos = lineItems.reduce((sum: number, it: any) => sum + (it.amount * it.quantity), 0);

    // IF SECRET KEY IS PROVIDED: Send real API request to PayMongo
    if (secretKey) {
      const paymongoPayload = {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: `Order ${orderRef || '#SHEY-ONLINE'} - Shey's Bakery Artisan Treats`,
            line_items: lineItems,
            payment_method_types: allowedPaymentMethods,
            reference_number: orderRef || `SHEY-${Date.now()}`,
            success_url: successUrl || `${appUrl}/?payment=success&ref=${encodeURIComponent(orderRef || '')}`,
            cancel_url: cancelUrl || `${appUrl}/?payment=cancelled&ref=${encodeURIComponent(orderRef || '')}`,
            customer_email: customer?.email || undefined,
            customer_name: customer?.name || undefined,
            customer_phone: customer?.phone || undefined,
          }
        }
      };

      const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getPayMongoAuthHeader(secretKey),
        },
        body: JSON.stringify(paymongoPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('PayMongo API Error:', responseData);
        return res.status(response.status).json({
          error: responseData.errors?.[0]?.detail || 'PayMongo API request failed',
          details: responseData
        });
      }

      const session = responseData.data;
      const checkoutUrl = session.attributes.checkout_url;
      const sessionId = session.id;

      // Track in local memory
      paymentTransactions[sessionId] = {
        sessionId,
        orderRef,
        totalAmount: totalCentavos / 100,
        status: session.attributes.status,
        customer,
        createdAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
        checkoutUrl,
        sessionId,
        clientKey: session.attributes.client_key,
        paymentIntentId: session.attributes.payment_intent?.id || null,
        totalAmount: totalCentavos / 100,
        orderRef
      });
    }

    // IF SECRET KEY IS NOT SET: Provide realistic simulated session with instant test QR & confirmation
    const simulatedSessionId = `cs_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const simulatedCheckoutUrl = `${appUrl}/?simulated_paymongo=1&session=${simulatedSessionId}&ref=${encodeURIComponent(orderRef || '')}`;

    paymentTransactions[simulatedSessionId] = {
      sessionId: simulatedSessionId,
      orderRef,
      totalAmount: totalCentavos / 100,
      status: 'active',
      customer,
      simulated: true,
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      mode: 'simulation',
      simulated: true,
      sessionId: simulatedSessionId,
      checkoutUrl: simulatedCheckoutUrl,
      totalAmount: totalCentavos / 100,
      orderRef,
      message: 'PayMongo API Key not configured. Running in Developer Simulation Mode (fully functional for testing GCash, Maya, and QR Ph).'
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ==========================================
// 3. Query PayMongo Session Status
// ==========================================
app.get('/api/paymongo/checkout-session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const secretKey = getPayMongoSecretKey();

    if (secretKey && !id.startsWith('cs_sim_')) {
      const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${id}`, {
        headers: {
          'Authorization': getPayMongoAuthHeader(secretKey),
        }
      });

      const responseData = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(responseData);
      }

      const session = responseData.data;
      const payments = session.attributes.payments || [];
      const isPaid = payments.some((p: any) => p.attributes?.status === 'paid') || session.attributes.status === 'paid';

      return res.json({
        id: session.id,
        status: isPaid ? 'paid' : session.attributes.status,
        isPaid,
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.attributes?.amount ? p.attributes.amount / 100 : 0,
          currency: p.attributes?.currency,
          status: p.attributes?.status,
          sourceType: p.attributes?.source?.type || p.attributes?.payment_method_type,
          paidAt: p.attributes?.paid_at ? new Date(p.attributes.paid_at * 1000).toISOString() : null
        }))
      });
    }

    // Handle local simulated session
    const localSession = paymentTransactions[id];
    if (localSession) {
      return res.json({
        id,
        status: localSession.status || 'paid',
        isPaid: localSession.status === 'paid',
        simulated: true
      });
    }

    return res.json({
      id,
      status: 'paid',
      isPaid: true,
      simulated: true
    });

  } catch (error: any) {
    console.error('Error checking checkout session:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ==========================================
// 4. PayMongo Webhook Listener
// ==========================================
app.post('/api/paymongo/webhook', (req, res) => {
  try {
    const event = req.body?.data?.attributes;
    const eventType = event?.type;
    console.log(`[PayMongo Webhook] Received event: ${eventType}`, event);

    if (eventType === 'checkout_session.payment.paid') {
      const paymentData = event?.data?.attributes;
      const sessionId = paymentData?.checkout_session_id || event?.data?.id;
      if (sessionId && paymentTransactions[sessionId]) {
        paymentTransactions[sessionId].status = 'paid';
        paymentTransactions[sessionId].paidAt = new Date().toISOString();
      }
    } else if (eventType === 'payment.paid' || eventType === 'qr.paid') {
      const paymentData = event?.data?.attributes;
      const sessionId = paymentData?.description || paymentData?.external_reference_number;
      if (sessionId && paymentTransactions[sessionId]) {
        paymentTransactions[sessionId].status = 'paid';
        paymentTransactions[sessionId].paidAt = new Date().toISOString();
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 5. Health Check
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// 6. Vite & Static Asset Handling
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shey's Bakery server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
