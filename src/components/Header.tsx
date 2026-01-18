"use client";

import React from 'react';
import { AudioLines, Wifi, Clock, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

interface HeaderProps {
  fileName?: string | null;
  onReset?: () => void;
  avgLatency?: number | null;
  duration?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  fileName,
  onReset,
  avgLatency,
  duration,
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-xl z-30 shrink-0 sticky top-0">
      <div className="flex items-center gap-5">
        <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-neon-cyan">
          <AudioLines className="size-5" />
        </div>
        <div>
          <h1 className="text-foreground text-lg font-bold tracking-tight">Realtime Log Visualizer</h1>
          <div className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">v1.0.4 • gpt-4o-realtime-preview</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Current file indicator */}
        {fileName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <FileText className="size-4 text-cyan-400 dark:text-cyan-400 text-teal-600" />
            <span className="text-sm text-foreground font-mono max-w-[200px] truncate">{fileName}</span>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-6 w-6 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive"
                title="Load different file"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        )}

        <div className="h-6 w-px bg-border mx-1"></div>

        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
          <div className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]"></div>
          <span className="text-primary text-[10px] font-bold uppercase tracking-widest">Loaded</span>
        </div>

        <div className="h-6 w-px bg-border mx-1"></div>

        <div className="flex gap-1 items-center">
          {avgLatency != null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-foreground cursor-help" title="Average Response Latency">
              <Wifi className="size-[18px]" />
              <span className="font-mono text-xs">{Math.round(avgLatency)}ms</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-foreground cursor-default" title="Session Duration">
              <Clock className="size-[18px]" />
              <span className="font-mono text-xs">{duration}</span>
            </div>
          )}
        </div>

        <div className="ml-2">
            <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
