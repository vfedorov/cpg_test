import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const limitNum = Math.min(Number(limit), 100);
    const offsetNum = Number(offset);

    const dbPath = path.join(process.cwd(), 'cpg.db');
    const db = new Database(dbPath, { readonly: true });

    const tableInfo = db.prepare("PRAGMA table_info(dashboard_function_detail)").all();

    let idField = 'function_id';
    let nameField = 'name';
    let fileField = 'file';

    tableInfo.forEach((col: any) => {
      if (col.name.includes('id') || col.name.includes('Id')) idField = col.name;
      if (col.name === 'name') nameField = col.name;
      if (col.name.includes('file')) fileField = col.name;
    });


    let sql = `SELECT ${idField} as functionId, ${nameField} as name, ${fileField} as file FROM dashboard_function_detail`;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE ${nameField} LIKE ? OR ${fileField} LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ${nameField} LIMIT ? OFFSET ?`;
    params.push(limitNum, offsetNum);

    const functions = db.prepare(sql).all(...params);

    let countSql = `SELECT COUNT(*) as total FROM dashboard_function_detail`;
    if (search) {
      countSql += ` WHERE ${nameField} LIKE ? OR ${fileField} LIKE ?`;
      const totalRow = db.prepare(countSql).get(`%${search}%`, `%${search}%`) as { total: number };
      var total = totalRow.total;
    } else {
      const totalRow = db.prepare(countSql).get() as { total: number };
      var total = totalRow.total;
    }

    db.close();


    res.status(200).json({
      functions,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + functions.length < total
      }
    });
  } catch (error: any) {
    console.error('❌ Functions API error:', error);
    res.status(500).json({ error: error.message });
  }
}