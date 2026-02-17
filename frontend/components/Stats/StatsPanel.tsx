'use client';

import React, { useEffect, useState } from 'react';

interface Stats {
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

export const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();

        if (res.ok) {
          setStats(data);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading stats: {error}
      </div>
    );
  }

  if (!stats) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium">Nodes</div>
          <div className="text-xl font-bold text-blue-700">{formatNumber(stats.overview.totalNodes)}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium">Edges</div>
          <div className="text-xl font-bold text-green-700">{formatNumber(stats.overview.totalEdges)}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-xs text-purple-600 font-medium">Functions</div>
          <div className="text-xl font-bold text-purple-700">{formatNumber(stats.overview.totalFunctions)}</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-xs text-orange-600 font-medium">Files</div>
          <div className="text-xl font-bold text-orange-700">{formatNumber(stats.overview.totalFiles)}</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-600 font-medium">Packages</div>
          <div className="text-xl font-bold text-indigo-700">{formatNumber(stats.overview.totalPackages)}</div>
        </div>
      </div>

      {/* Node Types */}
      {stats.nodeTypes.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 text-sm">Top Node Types</h3>
          <div className="space-y-2">
            {stats.nodeTypes.map((item) => (
              <div key={item.type} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.type || 'unknown'}</span>
                <span className="font-mono">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge Types */}
      {stats.edgeTypes.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 text-sm">Top Edge Types</h3>
          <div className="space-y-2">
            {stats.edgeTypes.map((item) => (
              <div key={item.type} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.type}</span>
                <span className="font-mono">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Functions */}
      {stats.topFunctions.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 text-sm">Most Complex Functions</h3>
          <div className="space-y-3">
            {stats.topFunctions.map((func, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-medium truncate">{func.name}</div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Complexity: {func.complexity || 0}</span>
                  <span>Calls: {func.calls || 0}</span>
                  <span>Lines: {func.lines || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Stats */}
      {stats.packageStats.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 text-sm">Top Packages by Complexity</h3>
          <div className="space-y-3">
            {stats.packageStats.map((pkg, idx) => (
              <div key={idx} className="text-sm">
                <div className="font-medium truncate">{pkg.package || 'unknown'}</div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Functions: {pkg.functions}</span>
                  <span>Complexity: {pkg.complexity || 0}</span>
                  <span>Files: {pkg.files}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Queries */}
      {stats.recentQueries.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-3 text-sm">Available Queries</h3>
          <div className="space-y-2">
            {stats.recentQueries.map((query) => (
              <div key={query.name} className="text-xs">
                <span className="font-mono text-blue-600">{query.name}</span>
                {query.description && (
                  <p className="text-gray-500 mt-1">{query.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};