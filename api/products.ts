// Vercel Serverless Function: High Speed Cached Product Catalog
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

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
    return res.status(503).json({ error: 'Supabase is not configured on server.', products: [] });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      return res.status(500).json({ error: error.message, products: [] });
    }

    return res.json({ products: products || [], cached: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, products: [] });
  }
}
