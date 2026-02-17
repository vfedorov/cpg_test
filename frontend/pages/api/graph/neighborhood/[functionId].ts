import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';


interface Edge {
  source: string;
  target: string;
  type: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { functionId } = req.query;


    if (!functionId || Array.isArray(functionId)) {
      return res.status(400).json({ error: 'Invalid functionId' });
    }

    const dbPath = path.join(process.cwd(), 'cpg.db');

    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({ error: 'Database file not found' });
    }

    const db = new Database(dbPath, { readonly: true });

    const queriesTable = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='queries'
    `).get();

    const queryRow = db.prepare(
      "SELECT sql FROM queries WHERE name = 'function_neighborhood'"
    ).get() as { sql: string } | undefined;

    if (!queryRow) {
      return res.status(500).json({ error: 'Query function_neighborhood not found' });
    }


    const neighbors = db.prepare(queryRow.sql).all({ function_id: functionId });

    const center = db.prepare(
      "SELECT id, name, package, file, line FROM nodes WHERE id = ?"
    ).get(functionId) as any;


    db.close();

    const nodes = [];
    const edges: Edge[] = [];
    const nodeMap = new Set();

    if (center) {
      nodes.push({
        id: center.id,
        name: center.name || center.id.split('::').pop() || 'unknown',
        kind: 'function',
        file: center.file,
        line: center.line,
        isCenter: true
      });
      nodeMap.add(center.id);
    }

    neighbors.forEach((n: any) => {
      if (!nodeMap.has(n.id)) {
        nodes.push({
          id: n.id,
          name: n.name || n.id.split('::').pop() || 'unknown',
          kind: 'function',
          file: n.file,
          line: n.line,
          direction: n.direction
        });
        nodeMap.add(n.id);
      }

      if (center) {
        edges.push({
          source: n.direction === 'caller' ? n.id : center.id,
          target: n.direction === 'caller' ? center.id : n.id,
          type: 'call'
        });
      }
    });

    res.status(200).json({ nodes, edges });

  } catch (error: any) {
    console.error('❌ Graph API error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}