"use client";

import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  maxHeight?: string;
  showCopyButton?: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  initialExpanded = true,
  maxHeight = '400px',
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group">
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Copy JSON"
        >
          {copied ? (
            <Check className="size-4 text-green-400" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      )}
      <div
        className="bg-black/60 p-4 rounded-2xl border border-white/5 overflow-auto font-mono text-xs"
        style={{ maxHeight }}
      >
        <JsonNode data={data} initialExpanded={initialExpanded} depth={0} />
      </div>
    </div>
  );
};

interface JsonNodeProps {
  data: unknown;
  initialExpanded: boolean;
  depth: number;
  keyName?: string;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, initialExpanded, depth, keyName }) => {
  const [expanded, setExpanded] = useState(initialExpanded && depth < 2);

  const indent = depth * 16;

  if (data === null) {
    return (
      <span className="text-gray-500">
        {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-gray-500">null</span>
      </span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span>
        {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-orange-400">{data.toString()}</span>
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span>
        {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-orange-400">{data}</span>
      </span>
    );
  }

  if (typeof data === 'string') {
    // Truncate long strings
    const displayValue = data.length > 100 ? data.substring(0, 100) + '...' : data;
    return (
      <span>
        {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-green-400">&quot;{displayValue}&quot;</span>
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-slate-500">[]</span>
        </span>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-white/5 -ml-4 pl-4 rounded"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="size-3 text-slate-500 mr-1" />
          ) : (
            <ChevronRight className="size-3 text-slate-500 mr-1" />
          )}
          {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-slate-500">[</span>
          {!expanded && (
            <span className="text-slate-500 ml-1">
              {data.length} items...]
            </span>
          )}
        </div>
        {expanded && (
          <>
            <div style={{ marginLeft: indent + 16 }}>
              {data.map((item, index) => (
                <div key={index} className="py-0.5">
                  <JsonNode
                    data={item}
                    initialExpanded={initialExpanded}
                    depth={depth + 1}
                  />
                  {index < data.length - 1 && <span className="text-slate-500">,</span>}
                </div>
              ))}
            </div>
            <span className="text-slate-500" style={{ marginLeft: indent }}>]</span>
          </>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <span>
          {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-slate-500">{'{}'}</span>
        </span>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-white/5 -ml-4 pl-4 rounded"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="size-3 text-slate-500 mr-1" />
          ) : (
            <ChevronRight className="size-3 text-slate-500 mr-1" />
          )}
          {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-slate-500">{'{'}</span>
          {!expanded && (
            <span className="text-slate-500 ml-1">
              {entries.length} keys...{'}'}
            </span>
          )}
        </div>
        {expanded && (
          <>
            <div style={{ marginLeft: indent + 16 }}>
              {entries.map(([key, value], index) => (
                <div key={key} className="py-0.5">
                  <JsonNode
                    data={value}
                    keyName={key}
                    initialExpanded={initialExpanded}
                    depth={depth + 1}
                  />
                  {index < entries.length - 1 && <span className="text-slate-500">,</span>}
                </div>
              ))}
            </div>
            <span className="text-slate-500" style={{ marginLeft: indent }}>{'}'}</span>
          </>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">unknown</span>;
};

export default JsonViewer;
