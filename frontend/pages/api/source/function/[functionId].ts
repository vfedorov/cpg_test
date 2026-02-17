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
    const { functionId } = req.query;

    if (!functionId || Array.isArray(functionId)) {
      return res.status(400).json({ error: 'Invalid functionId' });
    }

    const dbPath = path.join(process.cwd(), 'cpg.db');
    const db = new Database(dbPath, { readonly: true });

    interface FunctionInfo {
      function_id: string;
      name: string;
      file: string;
    }

    interface SourceInfo {
      content: string;
      file: string;
    }

    const funcInfo = db.prepare(`
        SELECT function_id, name, file
        FROM dashboard_function_detail
        WHERE function_id = ?
    `).get(functionId) as FunctionInfo | undefined;

    if (!funcInfo) {
      db.close();
      return res.status(404).json({ error: 'Function not found' });
    }

    const filePath = funcInfo.file.replace(/\\/g, '/');

    const source = db.prepare(`
      SELECT content, file 
      FROM sources 
      WHERE file = ? OR file LIKE ? OR file LIKE ?
    `).get(
      filePath,
      `%${filePath}`,
      `%${filePath.split('/').pop()}`
    ) as SourceInfo | undefined;

    db.close();

    if (source) {
      res.status(200).json({
        content: source.content,
        path: source.file,
        functionName: funcInfo.name
      });
    } else {
      res.status(200).json({
        content: `// Source code not found for function: ${funcInfo.name}\n// File: ${funcInfo.file}`,
        path: funcInfo.file,
        functionName: funcInfo.name
      });
    }
  } catch (error: any) {
    console.error('❌ Source API error:', error);
    res.status(500).json({ error: error.message });
  }
}