"use client";

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, Clipboard, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogLoaderProps {
  onLogLoaded: (content: string, fileName?: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function LogLoader({ onLogLoaded, isLoading = false, error }: LogLoaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedContent, setPastedContent] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFileName(file.name);
    const content = await file.text();
    onLogLoaded(content, file.name);
  };

  const handlePasteSubmit = () => {
    if (pastedContent.trim()) {
      onLogLoaded(pastedContent.trim(), 'pasted-logs.log');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedContent(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            OpenAI Realtime Log Visualizer
          </h1>
          <p className="text-slate-400">
            Load or paste your OpenAI Realtime API logs to analyze and visualize the conversation flow
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'paste'
                ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Paste Logs
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-12 cursor-pointer transition-all ${
                isDragOver
                  ? 'bg-cyan-500/10 border-2 border-dashed border-cyan-500/50'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-4 transition-all ${
                  isDragOver ? 'bg-cyan-500/20' : 'bg-slate-800'
                }`}>
                  {isLoading ? (
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  ) : (
                    <FileText className={`w-10 h-10 ${isDragOver ? 'text-cyan-400' : 'text-slate-500'}`} />
                  )}
                </div>
                {selectedFileName && !isLoading ? (
                  <>
                    <p className="text-lg font-medium text-slate-200 mb-1">{selectedFileName}</p>
                    <p className="text-sm text-slate-500">Click or drag to select a different file</p>
                  </>
                ) : isLoading ? (
                  <p className="text-lg font-medium text-cyan-400">Processing log file...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium text-slate-300 mb-1">
                      Drop your log file here
                    </p>
                    <p className="text-sm text-slate-500">
                      or click to browse • Supports .log and .txt files
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-400">
                  Paste your log content below
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste from Clipboard
                </Button>
              </div>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder={`2025-01-15T10:30:00.123Z [session-id] [USER] {"type":"conversation_input_text",...}
2025-01-15T10:30:00.456Z [session-id] [OPENAI] {"type":"conversation.item.created",...}`}
                className="w-full h-64 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-slate-500">
                  {pastedContent.split('\n').filter(l => l.trim()).length} lines
                </p>
                <Button
                  onClick={handlePasteSubmit}
                  disabled={!pastedContent.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Visualize Logs
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Error loading logs</p>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Format Hint */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <p className="text-xs font-medium text-slate-400 mb-2">Expected log format:</p>
          <code className="text-xs text-cyan-400/80 font-mono">
            {'{ISO_TIMESTAMP}'} [{'{SESSION_ID}'}] [{'{SOURCE}'}] {'{JSON_PAYLOAD}'}
          </code>
          <p className="text-xs text-slate-500 mt-2">
            Source can be <span className="text-cyan-400">USER</span> (client events) or{' '}
            <span className="text-purple-400">OPENAI</span> (server events)
          </p>
        </div>
      </div>
    </div>
  );
}
