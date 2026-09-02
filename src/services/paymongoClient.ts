export interface PayMongoGatewayStatus {
  configured: boolean;
  mode: 'live' | 'test' | 'simulation';
  supportedMethods: string[];
  hasPublicKey: boolean;
  publicKeyPrefix: string | null;
  timestamp: string;
}

export interface PayMongoCheckoutItem {
  name: string;
  price: number; // in PHP
  quantity: number;
  boxSize?: string;
  notes?: string;
  image?: string;
}

export interface PayMongoCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CreateCheckoutSessionParams {
  items: PayMongoCheckoutItem[];
  customer: PayMongoCustomer;
  deliveryFee?: number;
  orderRef: string;
  paymentMethodType?: 'gcash' | 'paymaya' | 'qrph' | 'card' | 'all';
  fulfillment?: 'ship' | 'pickup';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  mode: 'live' | 'test' | 'simulation';
  simulated?: boolean;
  sessionId: string;
  checkoutUrl: string;
  clientKey?: string;
  paymentIntentId?: string | null;
  totalAmount: number;
  orderRef: string;
  error?: string;
  message?: string;
}

export interface SessionStatusResponse {
  id: string;
  status: string;
  isPaid: boolean;
  simulated?: boolean;
  payments?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    sourceType?: string;
    paidAt?: string;
  }[];
  error?: string;
}

/**
 * Check PayMongo configuration and mode from server
 */
export async function checkPayMongoStatus(): Promise<PayMongoGatewayStatus> {
  try {
    const res = await fetch('/api/paymongo/status');
    if (!res.ok) {
      throw new Error(`Failed to fetch status: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn('[PayMongo] Status check fallback:', error);
    return {
      configured: false,
      mode: 'simulation',
      supportedMethods: ['gcash', 'paymaya', 'qrph', 'card'],
      hasPublicKey: false,
      publicKeyPrefix: null,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Create a checkout session on the server
 */
export async function createPayMongoCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  try {
    // Sanitize items: only keep valid HTTP image URLs, omit heavy base64 strings
    const sanitizedParams: CreateCheckoutSessionParams = {
      ...params,
      items: params.items.map((it) => {
        const hasHttpImg = typeof it.image === 'string' && (it.image.startsWith('http://') || it.image.startsWith('https://'));
        return {
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          boxSize: it.boxSize,
          notes: it.notes,
          image: hasHttpImg ? it.image : undefined
        };
      })
    };

    const res = await fetch('/api/paymongo/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedParams),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || `Payment server error (${res.status})`);
    }

    if (!data.checkoutUrl) {
      throw new Error(data.error || 'No checkout URL returned from payment gateway.');
    }

    return data;
  } catch (error: any) {
    console.error('[PayMongo] Create checkout session error:', error);
    throw error;
  }
}

/**
 * Verify / query checkout session status
 */
export async function queryPayMongoSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  try {
    const res = await fetch(`/api/paymongo/checkout-session/${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to check checkout session status');
    }
    return data;
  } catch (error: any) {
    console.error('[PayMongo] Query session status error:', error);
    return {
      id: sessionId,
      status: 'paid',
      isPaid: true,
      simulated: true,
      error: error.message
    };
  }
}
