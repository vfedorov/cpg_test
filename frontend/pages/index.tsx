import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatsPanel } from '@/components/Stats/StatsPanel';

export default function Home() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(data => {
        setDbStatus(data);
        setLoading(false);
      })
      .catch(err => {
        setDbStatus({ status: 'error', message: err.message });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          🚀 CPG Explorer
        </h1>
        {loading ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700">Checking database connection...</p>
          </div>
        ) : dbStatus?.status === 'success' ? (
          <div className="bg-green-50 p-4 rounded-lg mb-8">
            <p className="text-green-700 font-semibold">✅ Database connected successfully!</p>
            <p className="text-green-600 text-sm mt-1">
              Found {dbStatus.database.functionCount} functions
            </p>
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-lg mb-8">
            <p className="text-red-700 font-semibold">❌ Database connection failed</p>
            <p className="text-red-600 text-sm mt-1">{dbStatus?.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/explorer"
            className="p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">🔍 Graph Explorer</h2>
            <p className="text-purple-100">Visualize function call graphs and explore code</p>
          </Link>

          <Link
            href="/functions"
            className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">📋 Function List</h2>
            <p className="text-blue-100">Browse all functions in the database</p>
          </Link>

          <a
            href="/api/test"
            target="_blank"
            className="p-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">🔌 API Test</h2>
            <p className="text-gray-100">Direct API endpoint test</p>
          </a>

          <a
            href="/api/functions?limit=5"
            target="_blank"
            className="p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">📡 Functions API</h2>
            <p className="text-green-100">Sample API response (5 functions)</p>
          </a>
        </div>
        <div className="mb-8">
          <StatsPanel />
        </div>
      </div>
    </div>
  );
}