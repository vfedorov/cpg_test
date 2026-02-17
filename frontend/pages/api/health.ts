import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const dbPath = path.join(process.cwd(), 'cpg.db');
    const db = new Database(dbPath, { readonly: true });

    db.prepare('SELECT 1').get();

    db.close();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}