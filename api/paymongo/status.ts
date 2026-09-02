// Vercel Serverless Function: PayMongo Status
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const secretKey = (
    process.env.PAYMONGO_SECRET_KEY ||
    process.env.VITE_PAYMONGO_SECRET_KEY ||
    ''
  ).trim();

  const publicKey = (
    process.env.PAYMONGO_PUBLIC_KEY ||
    process.env.VITE_PAYMONGO_PUBLIC_KEY ||
    ''
  ).trim();

  const isConfigured = Boolean(
    secretKey &&
    secretKey !== 'sk_test_...' &&
    !secretKey.includes('your_secret_key')
  );

  const isLive = secretKey.startsWith('sk_live_');
  const isTest = secretKey.startsWith('sk_test_');

  res.json({
    configured: isConfigured,
    mode: isLive ? 'live' : isTest ? 'test' : 'simulation',
    supportedMethods: ['gcash', 'paymaya', 'qrph', 'card', 'dob', 'billease'],
    hasPublicKey: !!publicKey,
    publicKeyPrefix: publicKey ? publicKey.substring(0, 7) + '...' : null,
    timestamp: new Date().toISOString()
  });
}
