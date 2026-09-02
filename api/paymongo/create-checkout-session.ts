// Vercel Serverless Function: Create PayMongo Checkout Session
export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }

    const secretKey = (
      process.env.PAYMONGO_SECRET_KEY ||
      process.env.VITE_PAYMONGO_SECRET_KEY ||
      ''
    ).trim();

    const requestOrigin =
      (req.headers['origin'] as string) ||
      (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') ||
      (req.headers['x-forwarded-host'] ? `https://${req.headers['x-forwarded-host']}` : '');

    const appUrl = requestOrigin || process.env.APP_URL || 'http://localhost:3000';

    // Map line items into PayMongo format (amounts in centavos, PHP currency)
    const lineItems = items.map((item: any) => {
      const unitAmountCentavos = Math.round(Number(item.price || item.amount) * 100);
      const isHttpImg =
        typeof item.image === 'string' &&
        (item.image.startsWith('http://') || item.image.startsWith('https://'));
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

    // Determine payment methods to enable (GCash, Maya, QR Ph, Card)
    let allowedPaymentMethods: string[] = ['gcash', 'paymaya', 'qrph', 'card'];
    if (paymentMethodType === 'gcash') {
      allowedPaymentMethods = ['gcash', 'qrph'];
    } else if (paymentMethodType === 'paymaya') {
      allowedPaymentMethods = ['paymaya', 'qrph'];
    } else if (paymentMethodType === 'qrph') {
      allowedPaymentMethods = ['qrph', 'gcash', 'paymaya'];
    } else if (paymentMethodType === 'card') {
      allowedPaymentMethods = ['card'];
    }

    const totalCentavos = lineItems.reduce(
      (sum: number, it: any) => sum + it.amount * it.quantity,
      0
    );

    // IF SECRET KEY IS PROVIDED: Send real API request to PayMongo
    if (secretKey && secretKey !== 'sk_test_...' && !secretKey.includes('your_secret_key')) {
      const base64Key = Buffer.from(`${secretKey}:`).toString('base64');
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
            customer_phone: customer?.phone || undefined
          }
        }
      };

      const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${base64Key}`
        },
        body: JSON.stringify(paymongoPayload)
      });

      const responseData: any = await response.json();

      if (!response.ok) {
        console.error('[PayMongo Vercel Function] API Error:', responseData);
        return res.status(response.status).json({
          error: responseData.errors?.[0]?.detail || 'PayMongo API request failed',
          details: responseData
        });
      }

      const session = responseData.data;
      const checkoutUrl = session.attributes.checkout_url;
      const sessionId = session.id;

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

    // If secret key is not provided:
    return res.status(400).json({
      error: 'PAYMONGO_SECRET_KEY is not configured in Vercel Environment Variables. Please set PAYMONGO_SECRET_KEY in your Vercel Project Settings (Settings -> Environment Variables).',
      mode: 'unconfigured'
    });

  } catch (error: any) {
    console.error('[PayMongo Vercel Function] Exception:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
