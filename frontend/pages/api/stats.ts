import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';

interface DatabaseStats {
  overview: {
    totalNodes: number;
    totalEdges: number;
    totalFunctions: number;
    totalFiles: number;
    totalPackages: number;
  };
  nodeTypes: Array<{ type: string; count: number }>;
  edgeTypes: Array<{ type: string; count: number }>;
  topFunctions: Array<{
    name: string;
    file: string;
    complexity: number;
    calls: number;
    lines: number;
  }>;
  packageStats: Array<{
    package: string;
    functions: number;
    complexity: number;
    files: number;
  }>;
  recentQueries: Array<{ name: string; description: string }>;
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

    const stats: Partial<DatabaseStats> = {};

    try {
      const overview = db.prepare(`
        SELECT * FROM dashboard_overview
      `).get() as any;

      if (overview) {
        stats.overview = {
          totalNodes: overview.total_nodes || 0,
          totalEdges: overview.total_edges || 0,
          totalFunctions: overview.total_functions || 0,
          totalFiles: overview.total_files || 0,
          totalPackages: overview.total_packages || 0
        };
      }
    } catch (e) {
      console.log('dashboard_overview not available, using direct counts');
    }

    if (!stats.overview) {
      const counts = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM nodes) as totalNodes,
          (SELECT COUNT(*) FROM edges) as totalEdges,
          (SELECT COUNT(*) FROM dashboard_function_detail) as totalFunctions,
          (SELECT COUNT(*) FROM sources) as totalFiles,
          (SELECT COUNT(*) FROM (SELECT DISTINCT package FROM nodes WHERE package IS NOT NULL)) as totalPackages
      `).get() as any;

      stats.overview = {
        totalNodes: counts.totalNodes || 0,
        totalEdges: counts.totalEdges || 0,
        totalFunctions: counts.totalFunctions || 0,
        totalFiles: counts.totalFiles || 0,
        totalPackages: counts.totalPackages || 0
      };
    }

    try {
      stats.nodeTypes = db.prepare(`
        SELECT kind as type, COUNT(*) as count
        FROM nodes
        GROUP BY kind
        ORDER BY count DESC
        LIMIT 10
      `).all() as Array<{ type: string; count: number }>;
    } catch (e) {
      stats.nodeTypes = [];
    }

    try {
      stats.edgeTypes = db.prepare(`
        SELECT kind as type, COUNT(*) as count
        FROM edges
        GROUP BY kind
        ORDER BY count DESC
        LIMIT 10
      `).all() as Array<{ type: string; count: number }>;
    } catch (e) {
      stats.edgeTypes = [];
    }

    try {
      stats.topFunctions = db.prepare(`
        SELECT 
          name,
          file,
          complexity,
          calls,
          lines as loc
        FROM dashboard_function_detail
        WHERE complexity > 0
        ORDER BY complexity DESC
        LIMIT 10
      `).all() as Array<{
        name: string;
        file: string;
        complexity: number;
        calls: number;
        lines: number;
      }>;
    } catch (e) {
      stats.topFunctions = db.prepare(`
        SELECT 
          name,
          file,
          CAST(JSON_EXTRACT(properties, '$.complexity') as INTEGER) as complexity,
          CAST(JSON_EXTRACT(properties, '$.calls') as INTEGER) as calls,
          CAST(JSON_EXTRACT(properties, '$.loc') as INTEGER) as lines
        FROM nodes
        WHERE kind = 'function' 
          AND properties IS NOT NULL
        ORDER BY CAST(JSON_EXTRACT(properties, '$.complexity') as INTEGER) DESC
        LIMIT 10
      `).all() as any;
    }

    try {
      stats.packageStats = db.prepare(`
        SELECT 
          package,
          COUNT(DISTINCT id) as functions,
          SUM(CAST(JSON_EXTRACT(properties, '$.complexity') as INTEGER)) as complexity,
          COUNT(DISTINCT file) as files
        FROM nodes
        WHERE kind = 'function' 
          AND package IS NOT NULL
        GROUP BY package
        ORDER BY complexity DESC
        LIMIT 10
      `).all() as Array<{
        package: string;
        functions: number;
        complexity: number;
        files: number;
      }>;
    } catch (e) {
      stats.packageStats = [];
    }

    try {
      stats.recentQueries = db.prepare(`
        SELECT name, description
        FROM queries
        WHERE description IS NOT NULL
        LIMIT 5
      `).all() as Array<{ name: string; description: string }>;
    } catch (e) {
      stats.recentQueries = [];
    }

    db.close();

    res.status(200).json(stats);
  } catch (error: any) {
    console.error('❌ Stats API error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
}