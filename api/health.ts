// Vercel Serverless Function: Health Check
export default function handler(req: any, res: any) {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString()
  });
}
