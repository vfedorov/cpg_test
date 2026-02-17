import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface FunctionInfo {
  functionId: string;
  name: string;
  file: string;
  complexity?: number;
  calls?: number;
}

export default function FunctionsPage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debug, setDebug] = useState<any>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  const loadFunctions = async (searchTerm = '', offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString(),
        ...(searchTerm && { search: searchTerm })
      });


      const res = await fetch(`/api/functions?${params}`);
      const data = await res.json();


      if (res.ok) {
        setFunctions(data.functions || []);
        setPagination(data.pagination || { total: 0, limit: 50, offset: 0, hasMore: false });
        setError(null);
        setDebug({ firstFunction: data.functions?.[0] });
      } else {
        setError(data.error || 'Failed to load functions');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunctions();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFunctions(search, 0);
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      loadFunctions(search, pagination.offset + pagination.limit);
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      loadFunctions(search, pagination.offset - pagination.limit);
    }
  };

  const handleViewGraph = (functionId: string) => {
    if (functionId && functionId !== 'No ID') {
      router.push(`/explorer?functionId=${encodeURIComponent(functionId)}`);
    } else {
      alert('Cannot view graph: Invalid function ID');
    }
  };

  const formatFunctionId = (id: string | undefined) => {
    if (!id) return 'N/A';
    if (id.length <= 50) return id;
    return id.substring(0, 47) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold mt-2">Functions</h1>
          </div>
          <div className="text-gray-600">
            Total: {pagination.total} functions
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search functions by name or file..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading functions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            Error: {error}
          </div>
        ) : functions.length === 0 ? (
          <div className="bg-yellow-50 p-8 rounded-lg text-center">
            <p className="text-yellow-700">No functions found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {functions.map((func, index) => (
                  <tr
                    key={func.functionId || index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewGraph(func.functionId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {func.name || 'Unnamed'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {formatFunctionId(func.functionId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {func.file || 'Unknown file'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {func.functionId && func.functionId !== 'No ID' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewGraph(func.functionId);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Graph →
                        </button>
                      ) : (
                        <span className="text-gray-400">No ID</span>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            {pagination.total > pagination.limit && (
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Showing {pagination.offset + 1} - {Math.min(pagination.offset + functions.length, pagination.total)} of {pagination.total}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}