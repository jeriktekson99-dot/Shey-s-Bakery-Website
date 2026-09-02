// Vercel Serverless Function: PayMongo Webhook
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body?.data?.attributes;
    const eventType = event?.type;
    console.log(`[PayMongo Webhook] Event: ${eventType}`, event);

    return res.json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
