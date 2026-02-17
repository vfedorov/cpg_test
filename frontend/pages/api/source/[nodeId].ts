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
    const { nodeId } = req.query;

    if (!nodeId || Array.isArray(nodeId)) {
      return res.status(400).json({ error: 'Invalid nodeId' });
    }

    const dbPath = path.join(process.cwd(), 'cpg.db');
    const db = new Database(dbPath, { readonly: true });

    console.log('🔍 Looking for node:', nodeId);

    interface NodeInfo {
      id: string;
      name: string;
      kind: string;
      file: string | null;
      line: number | null;
      package: string | null;
    }

    const node = db.prepare(`
      SELECT id, name, kind, file, line, package 
      FROM nodes 
      WHERE id = ?
    `).get(nodeId) as NodeInfo | undefined;

    if (!node) {
      console.log('❌ Node not found');
      db.close();
      return res.status(404).json({ error: 'Node not found' });
    }

    console.log('✅ Node found:', node);

    interface SourceInfo {
      content: string;
      file: string;
    }

    let source: SourceInfo | undefined;

    if (node.file) {
      const searchPath = node.file.replace(/\\/g, '/');

      console.log('🔍 Looking for source with file:', searchPath);

      source = db.prepare(`
        SELECT content, file 
        FROM sources 
        WHERE file = ? 
           OR file LIKE ? 
           OR file LIKE ?
        LIMIT 1
      `).get(
        searchPath,
        `%${searchPath}`,
        `%${searchPath.split('/').pop()}`
      ) as SourceInfo | undefined;
    }

    if (!source && node.name) {
      console.log('🔍 Looking in dashboard_function_detail for:', node.name);

      interface FunctionInfo {
        file: string;
      }

      const funcInfo = db.prepare(`
        SELECT file 
        FROM dashboard_function_detail 
        WHERE function_id = ? OR name = ?
        LIMIT 1
      `).get(nodeId, node.name) as FunctionInfo | undefined;

      if (funcInfo && funcInfo.file) {
        const funcPath = funcInfo.file.replace(/\\/g, '/');
        source = db.prepare(`
          SELECT content, file 
          FROM sources 
          WHERE file = ? OR file LIKE ?
          LIMIT 1
        `).get(funcPath, `%${funcPath}`) as SourceInfo | undefined;
      }
    }

    db.close();

    if (source) {
      console.log('✅ Source found');
      res.status(200).json({
        content: source.content,
        path: source.file,
        functionName: node.name || 'unknown'
      });
    } else {
      res.status(200).json({
        content: `// Source code not found in database
// Node ID: ${node.id}
// Node name: ${node.name || 'N/A'}
// Node kind: ${node.kind}
// File: ${node.file || 'N/A'}
// 
// This is a placeholder. The actual source code should be in the 'sources' table.`,
        path: node.file || 'unknown.go',
        functionName: node.name || 'unknown'
      });
    }
  } catch (error: any) {
    console.error('❌ Source API error:', error);
    res.status(500).json({ error: error.message });
  }
}