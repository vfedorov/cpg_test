'use client';

import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// @ts-ignore
cytoscape.use(coseBilkent);

interface Node {
  id: string;
  name?: string;
  kind: string;
  isCenter?: boolean;
  direction?: 'caller' | 'callee';
  file?: string;
  line?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface GraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  height?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
                                                      nodes,
                                                      edges,
                                                      onNodeClick,
                                                      onNodeDoubleClick,
                                                      height = '600px'
                                                    }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const getNodeColor = (node: Node) => {
      if (node.isCenter) return '#f6ad55';
      if (node.direction === 'caller') return '#9f7aea';
      if (node.direction === 'callee') return '#48bb78';
      return '#4299e1';
    };

    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: nodes.map(node => ({
          data: {
            id: node.id,
            label: node.name || node.id.split('::').pop() || '?',
            isCenter: node.isCenter,
            direction: node.direction
          }
        })),
        edges: edges.map(edge => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            type: edge.type
          }
        }))
      },
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 40,
            'height': 40,
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#000',
            'background-color': (ele: any) => getNodeColor(ele.data())
          }
        },
        {
          selector: 'node[isCenter="true"]',
          style: {
            'width': 60,
            'height': 60
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#cbd5e0',
            'target-arrow-color': '#cbd5e0',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge[type="call"]',
          style: {
            'line-color': '#4299e1',
            'target-arrow-color': '#4299e1'
          }
        }
      ],
      layout: {
        name: 'cose-bilkent',
        idealEdgeLength: 100,
        nodeRepulsion: 4000,
        gravity: 0.25,
        numIter: 1000
      } as any
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt: any) => {
      onNodeClick(evt.target.id());
    });

    if (onNodeDoubleClick) {
      cy.on('dbltap', 'node', (evt: any) => {
        onNodeDoubleClick(evt.target.id());
      });
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, onNodeClick, onNodeDoubleClick]);

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No graph data</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="bg-white rounded-lg border"
    />
  );
};