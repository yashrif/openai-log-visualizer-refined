"use client";

import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, FileText, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  maxHeight?: string;
  showCopyButton?: boolean;
  indentWidth?: number;
  className?: string;
}

// Keys that typically contain markdown content
const MARKDOWN_KEYS = ['instructions', 'description', 'content', 'text', 'system_prompt'];

// Keys that contain binary/base64 data that should be truncated
const BINARY_KEYS = ['audio', 'delta'];

// Standard HTML tags to ignore during transformation
const STANDARD_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote',
  'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'i', 'iframe', 'img',
  'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark',
  'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
  'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub',
  'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
]);

/**
 * Preprocess markdown to handle non-standard XML tags by converting them to
 * temporary markers. This allows the Markdown parser to process the content inside
 * the tags (e.g. lists, bold text) which would otherwise be suppressed if wrapped
 * in HTML block tags.
 *
 * A custom Rehype plugin then converts these markers back into styled div blocks.
 */
const preprocessMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Mask fenced code blocks to protect them (and preserve formatting/lang)
  const fencedBlocks: string[] = [];
  let processed = markdown;

  // Mask fenced code blocks (```...```)
  processed = processed.replace(/^```[\s\S]*?^```/gm, (match) => {
    fencedBlocks.push(match);
    return `__FENCED_BLOCK_${fencedBlocks.length - 1}__`;
  });
  // Also catch simple inline-style fenced blocks if any
  if (processed.includes('```')) {
     processed = processed.replace(/```[\s\S]*?```/g, (match) => {
         if (match.startsWith('__FENCED')) return match; // Already masked
         fencedBlocks.push(match);
         return `__FENCED_BLOCK_${fencedBlocks.length - 1}__`;
     });
  }

  // 2. Convert inline code blocks to HTML <code> to enforce code rendering context
  // Regex matches pairs of backticks (one or more)
  processed = processed.replace(/(`+)([\s\S]*?)\1/g, (match, ticks, content) => {
    return `<code>${escapeHtml(content)}</code>`;
  });

  // 3. Process tags recursively
  // Generalized Regex to find balanced pairs of ANY tag
  const pairRegex = /(<([a-zA-Z][a-zA-Z0-9_\-]*)((?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)*?)\s*(\/?)>)([\s\S]*?)(<\/\2\s*>)/g;

  let current = processed;
  // Use recursion to process nested tags correctly
  current = current.replace(pairRegex, (match, openTag, tagName, attrs, slash, content, closeTag) => {
    // Guard: specific check for self-closing tags
    if (slash === '/' || openTag.trim().endsWith('/>')) {
      return match;
    }

    // Process Content recursively
    const processedContent = preprocessMarkdown(content);

    // If tag is standard HTML, preserve it
    if (STANDARD_TAGS.has(tagName.toLowerCase())) {
      return `${openTag}${processedContent}${closeTag}`;
    }

    // Convert to Special Markers to allow Markdown parsing
    // We surround markers with double newlines to ensure they act as block boundaries
    return `\n\n:::CUSTOM_TAG_START|${tagName}|${attrs}:::\n\n${processedContent}\n\n:::CUSTOM_TAG_END|${tagName}:::\n\n`;
  });

  // 4. Restore fenced code blocks
  return current.replace(/__FENCED_BLOCK_(\d+)__/g, (match, index) => {
    return fencedBlocks[parseInt(index)] || match;
  });
};

// Helper to restructure the HAST tree based on markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupSiblings = (children: any[]): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newChildren: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentContainer: any = null;

    // Regex to match markers: :::CUSTOM_TAG_START|tagName|attrs:::
    const startRegex = /^:::CUSTOM_TAG_START\|([^|]+)\|(.*):::$/;
    const endRegex = /^:::CUSTOM_TAG_END\|([^|]+):::$/;

    for (const child of children) {
        let isMarker = false;
        let markerMatch = null;
        let isStart = false;

        // Check if child is a paragraph containing ONLY our marker text
        // Remark parses ':::' lines as text paragraphs
        if (child.tagName === 'p' && child.children && child.children.length === 1 && child.children[0].type === 'text') {
            const text = child.children[0].value ? child.children[0].value.trim() : '';
            const sMatch = text.match(startRegex);
            const eMatch = text.match(endRegex);

            if (sMatch) {
                isMarker = true;
                isStart = true;
                markerMatch = sMatch;
            } else if (eMatch) {
                 isMarker = true;
                 isStart = false;
                 markerMatch = eMatch;
            }
        }

        if (isMarker && markerMatch) {
            if (isStart) {
                const tagName = markerMatch[1];
                const attrsString = markerMatch[2];

                const displayTag = tagName.includes('-') ? tagName.replace(/-/g, '_') : tagName;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const properties: any = {
                    className: ['prompt-tag', `prompt-tag-${displayTag.toLowerCase()}`],
                    'data-tag': displayTag
                };

                if (attrsString && attrsString.trim()) {
                     properties['data-attributes'] = attrsString.trim();
                }

                const newContainer = {
                    type: 'element',
                    tagName: 'div',
                    properties: properties,
                    children: []
                };

                if (currentContainer) {
                    currentContainer.children.push(newContainer);
                } else {
                    newChildren.push(newContainer);
                }

                stack.push(currentContainer);
                currentContainer = newContainer;

            } else {
                // End Marker
                if (stack.length > 0) {
                    const parent = stack.pop();
                    currentContainer = parent;
                } else {
                    // Unbalanced end tag or at root
                    currentContainer = null;
                }
            }
        } else {
            // Normal node
            if (currentContainer) {
                currentContainer.children.push(child);
            } else {
                newChildren.push(child);
            }
        }
    }

    return newChildren;
};

// Recursive transformer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformChildren = (node: any) => {
    if (node.children && node.children.length > 0) {
        node.children = groupSiblings(node.children);
        // Recurse into children (including new containers)
        node.children.forEach(transformChildren);
    }
};

// Rehype plugin to transform custom marker paragraphs into stylized divs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypeTransformCustomTags = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
      transformChildren(tree);
  };
};

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  initialExpanded = true,
  maxHeight = '400px',
  showCopyButton = true,
  indentWidth = 10,
  className = '',
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
    <div className={`relative group ${className}`}>
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Copy JSON"
        >
          {copied ? (
            <Check className="size-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      )}
      <div
        className="bg-card dark:bg-black/60 p-4 rounded-2xl border border-border overflow-auto font-mono text-xs shadow-inner"
        style={{ maxHeight }}
      >
        <JsonNode
          data={data}
          initialExpanded={initialExpanded}
          depth={0}
          indentWidth={indentWidth}
        />
      </div>
    </div>
  );
};

interface JsonNodeProps {
  data: unknown;
  initialExpanded: boolean;
  depth: number;
  indentWidth: number;
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
        {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-muted-foreground italic">[Base64 audio data: {value.length.toLocaleString()} chars]</span>
      </span>
    );
  }

  // Try to parse JSON if it looks like a JSON object or array
  let jsonContent: unknown = null;
  let isJson = false;
  if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
    try {
      jsonContent = JSON.parse(value);
      isJson = true;
    } catch {
      // Not valid JSON, ignore
    }
  }

  if (isJson && jsonContent && typeof jsonContent === 'object') {
    return (
      <div>
        {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <div className="mt-2 pl-2 border-l-2 border-border">
           <JsonNode
              data={jsonContent}
              initialExpanded={true}
              depth={0}
              indentWidth={10}
           />
        </div>
      </div>
    );
  }

  const isLong = value.length > 200;
  const displayValue = expanded || !isLong ? value : value.substring(0, 200);

  return (
    <div className="inline">
      {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
      {keyName && ': '}
      {isLong && isMarkdown && showMarkdown ? (
        <div className="mt-2 p-4 rounded-lg bg-muted border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <FileText className="size-3" />
              <span>Markdown Content</span>
            </div>
            <button
              onClick={() => setShowMarkdown(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Show Raw
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-xs leading-relaxed [&_h1]:text-lg [&_h1]:text-cyber-primary [&_h1]:my-2 [&_h2]:text-base [&_h2]:text-cyber-secondary [&_h2]:my-2 [&_h3]:text-sm [&_h3]:text-blue-400 [&_h3]:my-2 [&_p]:text-foreground [&_li]:text-foreground [&_strong]:text-foreground [&_code]:text-cyan-600 dark:[&_code]:text-cyan-400 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_th]:text-left [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-4 [&_ul]:pl-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeTransformCustomTags]}
            >
              {preprocessMarkdown(value)}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          <span className="text-green-600 dark:text-green-400 whitespace-pre-wrap break-all">&quot;{displayValue}</span>
          {!expanded && isLong && (
            <>
              <span className="text-muted-foreground">...</span>
              <button
                onClick={() => setExpanded(true)}
                className="ml-2 text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 inline-flex items-center gap-1"
              >
                <Maximize2 className="size-3" />
                Show all ({value.length.toLocaleString()} chars)
              </button>
            </>
          )}
          {(expanded || !isLong) && <span className="text-green-600 dark:text-green-400">&quot;</span>}
          {expanded && isLong && (
            <button
              onClick={() => setExpanded(false)}
              className="ml-2 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Collapse
            </button>
          )}
          {isLong && isMarkdown && !showMarkdown && (
            <button
              onClick={() => setShowMarkdown(true)}
              className="ml-2 text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 inline-flex items-center gap-1"
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

const JsonNode: React.FC<JsonNodeProps> = ({ data, initialExpanded, depth, indentWidth, keyName }) => {
  const [expanded, setExpanded] = useState(initialExpanded && depth < 3);

  const isMarkdownKey = !!keyName && MARKDOWN_KEYS.some(k => keyName.toLowerCase().includes(k));

  if (data === null) {
    return (
      <span className="text-muted-foreground">
        {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-muted-foreground">null</span>
      </span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span>
        {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-orange-600 dark:text-orange-400">{data.toString()}</span>
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span>
        {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
        {keyName && ': '}
        <span className="text-orange-600 dark:text-orange-400">{data}</span>
      </span>
    );
  }

  if (typeof data === 'string') {
    return <ExpandableString value={data} keyName={keyName} isMarkdown={isMarkdownKey} />;
  }

  const headerStyle = { marginLeft: -indentWidth, paddingLeft: indentWidth };
  const childrenStyle = { marginLeft: indentWidth };

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-muted-foreground">[]</span>
        </span>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-muted/50 rounded"
          style={headerStyle}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="size-3 text-muted-foreground mr-1" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground mr-1" />
          )}
          {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-muted-foreground">[</span>
          {!expanded && (
            <span className="text-muted-foreground ml-1">
              {data.length} items...]
            </span>
          )}
        </div>
        {expanded && (
          <>
            <div style={childrenStyle}>
              {data.map((item, index) => (
                <div key={index} className="py-0.5">
                  <JsonNode
                    data={item}
                    initialExpanded={initialExpanded}
                    depth={depth + 1}
                    indentWidth={indentWidth}
                  />
                  {index < data.length - 1 && <span className="text-muted-foreground">,</span>}
                </div>
              ))}
            </div>
            <span className="text-muted-foreground">]</span>
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
          {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-muted-foreground">{'{}'}</span>
        </span>
      );
    }

    return (
      <div>
        <div
          className="flex items-center cursor-pointer hover:bg-muted/50 rounded"
          style={headerStyle}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="size-3 text-muted-foreground mr-1" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground mr-1" />
          )}
          {keyName && <span className="text-blue-600 dark:text-blue-400">&quot;{keyName}&quot;</span>}
          {keyName && ': '}
          <span className="text-muted-foreground">{'{'}</span>
          {!expanded && (
            <span className="text-muted-foreground ml-1">
              {entries.length} keys...{'}'}
            </span>
          )}
        </div>
        {expanded && (
          <>
            <div style={childrenStyle}>
              {entries.map(([key, value], index) => (
                <div key={key} className="py-0.5">
                  <JsonNode
                    data={value}
                    keyName={key}
                    initialExpanded={initialExpanded}
                    depth={depth + 1}
                    indentWidth={indentWidth}
                  />
                  {index < entries.length - 1 && <span className="text-muted-foreground">,</span>}
                </div>
              ))}
            </div>
            <span className="text-muted-foreground">{'}'}</span>
          </>
        )}
      </div>
    );
  }

  return <span className="text-muted-foreground">unknown</span>;
};

export default JsonViewer;
