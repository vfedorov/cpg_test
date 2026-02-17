'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface SourceViewerProps {
  source?: string;
  fileName?: string;
  functionName?: string;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
                                                            source,
                                                            fileName,
                                                            functionName
                                                          }) => {
  if (!source) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-4">
        <p className="text-center">Click a node to view source code</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm flex justify-between items-center">
        <span className="font-mono truncate">{fileName || 'source.go'}</span>
        {functionName && (
          <span className="text-gray-400 text-xs ml-2 truncate">{functionName}</span>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language="go"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            minHeight: '100%',
            fontSize: '13px'
          }}
          showLineNumbers
          wrapLines
        >
          {source}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};