export interface Node {
  id: string;
  name?: string;
  kind: string;
  package?: string;
  file?: string;
  line?: number;
  isCenter?: boolean;
  direction?: 'caller' | 'callee';
}

export interface Edge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface FunctionInfo {
  functionId: string;
  name: string;
  file: string;
  complexity?: number;
  calls?: number;
}