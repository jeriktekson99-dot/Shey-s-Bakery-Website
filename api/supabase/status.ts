// Vercel Serverless Function: Supabase Health & Connection Status
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const key = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  if (!url || !key || !url.startsWith('http') || key === 'your-anon-public-key') {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase URL or Key is not configured in Vercel environment variables.'
    });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return res.json({
        configured: true,
        connected: false,
        url,
        error: error.message
      });
    }

    return res.json({
      configured: true,
      connected: true,
      productCount: count || 0,
      url,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      error: err.message
    });
  }
}
