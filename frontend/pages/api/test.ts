import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

interface Table {
  name: string;
}

interface FunctionCount {
  count: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbPath = path.join(process.cwd(), 'cpg.db');

    const db = new Database(dbPath, { readonly: true });

    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' LIMIT 5
    `).all() as Table[];

    const funcCount = db.prepare('SELECT COUNT(*) as count FROM dashboard_function_detail').get() as FunctionCount;

    db.close();

    res.status(200).json({
      status: 'success',
      message: 'Database connected successfully',
      database: {
        path: dbPath,
        tables: tables.map(t => t.name),
        functionCount_hahaha: funcCount.count
      }
    });
  } catch (error: any) {
    console.error('❌ Database error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}