import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GraphView } from '@/components/Graph/GraphView';
import { SourceViewer } from '@/components/SourceViewer/SourceViewer';

interface SourceData {
  content: string;
  path: string;
  functionName?: string;
}

export default function Explorer() {
  const router = useRouter();
  const { functionId: urlFunctionId } = router.query;

  const [functionId, setFunctionId] = useState('');
  const [graphData, setGraphData] = useState<any>(null);
  const [sourceData, setSourceData] = useState<SourceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState<boolean>(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [graphDepth, setGraphDepth] = useState(3);

  const loadGraph = async (id: string, depth: number) => {
    const url = `/api/graph/neighborhood/${encodeURIComponent(id)}?depth=${depth}`;
    setLoading(true);
    setError(null);

    try {
      const url = `/api/graph/neighborhood/${encodeURIComponent(id)}`;

      const res = await fetch(url);

      const data = await res.json();

      if (res.ok) {
        setGraphData(data);
      } else {
        setError(data.error || 'Failed to load graph');
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSource = async (nodeId: string) => {
    setSourceLoading(true);
    setSourceError(null);
    try {
      const res = await fetch(`/api/source/${encodeURIComponent(nodeId)}`);
      const data = await res.json();

      if (res.ok) {
        setSourceData(data);
      } else {
        console.error('❌ Failed to load source:', data.error);
        setSourceData(null);
      }
    } catch (err: any) {
      console.error('❌ Error loading source:', err);
      setSourceData(null);
      setSourceError(err.message);
    } finally {
      setSourceLoading(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    loadSource(nodeId);
    navigateToFunction(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    navigateToFunction(nodeId);
  };

  useEffect(() => {
    if (urlFunctionId && typeof urlFunctionId === 'string') {
      setFunctionId(urlFunctionId);
      loadGraph(urlFunctionId, graphDepth);
    }
  }, [urlFunctionId]);

  const centerFunction = graphData?.nodes?.find((n: any) => n.isCenter);

  const navigateToFunction = (nodeId: string) => {
    router.push(`/explorer?functionId=${encodeURIComponent(nodeId)}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
          <Link href="/functions" className="text-blue-600 hover:underline">
            Functions List
          </Link>
          <h1 className="text-xl font-semibold ml-4">Call Graph Explorer</h1>
        </div>
        <div className="text-sm text-gray-500">
          {graphData && `${graphData.nodes?.length || 0} nodes, ${graphData.edges?.length || 0} edges`}
        </div>
      </header>

      <select value={graphDepth} onChange={(e) => setGraphDepth(Number(e.target.value))}>
        <option value={1}>Depth 1</option>
        <option value={2}>Depth 2</option>
        <option value={3}>Depth 3</option>
      </select>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/4 bg-white border-r overflow-auto p-4">
          <h2 className="font-semibold mb-3">Function Info</h2>
          {centerFunction ? (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <p className="font-mono text-sm break-all">
                  {centerFunction.name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">File</label>
                <p className="font-mono text-sm break-all">
                  {centerFunction.file || 'Unknown'}
                </p>
              </div>
              {centerFunction.line && (
                <div>
                  <label className="text-xs text-gray-500">Line</label>
                  <p className="font-mono text-sm">
                    {centerFunction.line}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500">ID</label>
                <p className="font-mono text-xs break-all text-gray-600">
                  {functionId}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm">No function selected</p>
              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2 p-4">
          <div className="h-full bg-white rounded-lg border shadow-sm overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-500">Loading graph...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-red-500">
                  <p>Error loading graph</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            ) : graphData ? (
              <GraphView
                nodes={graphData.nodes || []}
                edges={graphData.edges || []}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                height="100%"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p>Select a function to explore</p>
                  <p className="text-sm mt-1">from the Functions List</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/4 bg-white border-l overflow-auto">
          <SourceViewer
            source={sourceData?.content}
            fileName={sourceData?.path}
            functionName={sourceData?.functionName}
          />
        </div>
      </div>

      <footer className="bg-white border-t px-6 py-2 text-xs text-gray-500">
      </footer>
    </div>
  );
}