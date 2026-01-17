"use client";

import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, FileText, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  maxHeight?: string;
  showCopyButton?: boolean;
}

// Keys that typically contain markdown content
const MARKDOWN_KEYS = ['instructions', 'description', 'content', 'text', 'system_prompt'];

// Keys that contain binary/base64 data that should be truncated
const BINARY_KEYS = ['audio', 'delta'];

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

// Component for expandable long strings
const ExpandableString: React.FC<{
  value: string;
  keyName?: string;
  isMarkdown?: boolean;
}> = ({ value, keyName, isMarkdown }) => {
  const [expanded, setExpanded] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(isMarkdown);

  // Determine if string is likely base64 audio data
  const isBase64Audio = keyName && BINARY_KEYS.some(k => keyName.toLowerCase().includes(k)) && value.length > 1000;

  if (isBase64Audio) {
    return (
      <span>
        {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-slate-500 italic">[Base64 audio data: {value.length.toLocaleString()} chars]</span>
      </span>
    );
  }

  const isLong = value.length > 200;
  const displayValue = expanded || !isLong ? value : value.substring(0, 200);

  return (
    <div className="inline">
      {keyName && <span className="text-blue-400">&quot;{keyName}&quot;</span>}
      {keyName && ': '}
      {isLong && isMarkdown && showMarkdown ? (
        <div className="mt-2 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <FileText className="size-3" />
              <span>Markdown Content</span>
            </div>
            <button
              onClick={() => setShowMarkdown(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Show Raw
            </button>
          </div>
          <div className="prose prose-sm prose-invert prose-slate max-w-none text-slate-300 text-xs leading-relaxed [&_h1]:text-lg [&_h1]:text-white [&_h2]:text-base [&_h2]:text-white [&_h3]:text-sm [&_h3]:text-white [&_p]:text-slate-300 [&_li]:text-slate-300 [&_strong]:text-white [&_code]:text-cyan-400 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded">
            <ReactMarkdown>{value}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          <span className="text-green-400 whitespace-pre-wrap break-all">&quot;{displayValue}</span>
          {!expanded && isLong && (
            <>
              <span className="text-slate-500">...</span>
              <button
                onClick={() => setExpanded(true)}
                className="ml-2 text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
              >
                <Maximize2 className="size-3" />
                Show all ({value.length.toLocaleString()} chars)
              </button>
            </>
          )}
          {(expanded || !isLong) && <span className="text-green-400">&quot;</span>}
          {expanded && isLong && (
            <button
              onClick={() => setExpanded(false)}
              className="ml-2 text-[10px] text-slate-500 hover:text-slate-300"
            >
              Collapse
            </button>
          )}
          {isLong && isMarkdown && !showMarkdown && (
            <button
              onClick={() => setShowMarkdown(true)}
              className="ml-2 text-[10px] text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
            >
              <FileText className="size-3" />
              Render Markdown
            </button>
          )}
        </>
      )}
    </div>
  );
};

const JsonNode: React.FC<JsonNodeProps> = ({ data, initialExpanded, depth, keyName }) => {
  const [expanded, setExpanded] = useState(initialExpanded && depth < 3);

  const indent = depth * 16;
  const isMarkdownKey = keyName && MARKDOWN_KEYS.some(k => keyName.toLowerCase().includes(k));

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
    return <ExpandableString value={data} keyName={keyName} isMarkdown={isMarkdownKey} />;
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
