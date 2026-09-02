// Vercel Serverless Function: Query PayMongo Checkout Session
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const secretKey = (
    process.env.PAYMONGO_SECRET_KEY ||
    process.env.VITE_PAYMONGO_SECRET_KEY ||
    ''
  ).trim();

  if (secretKey && secretKey !== 'sk_test_...' && !id.startsWith('cs_sim_')) {
    try {
      const base64Key = Buffer.from(`${secretKey}:`).toString('base64');
      const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${id}`, {
        headers: {
          'Authorization': `Basic ${base64Key}`
        }
      });

      const responseData: any = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(responseData);
      }

      const session = responseData.data;
      const payments = session.attributes.payments || [];
      const isPaid =
        payments.some((p: any) => p.attributes?.status === 'paid') ||
        session.attributes.status === 'paid';

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
          paidAt: p.attributes?.paid_at
            ? new Date(p.attributes.paid_at * 1000).toISOString()
            : null
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to query PayMongo session' });
    }
  }

  return res.json({
    id,
    status: 'paid',
    isPaid: true,
    simulated: true
  });
}
