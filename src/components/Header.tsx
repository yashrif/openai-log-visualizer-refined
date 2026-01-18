"use client";

import React from 'react';
import { AudioLines, Wifi, Clock, Settings, User, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

interface HeaderProps {
  fileName?: string | null;
  onReset?: () => void;
}

const Header: React.FC<HeaderProps> = ({ fileName, onReset }) => {
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
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
            <Wifi className="size-[18px]" />
            <span className="font-mono text-xs">45ms</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
            <Clock className="size-[18px]" />
            <span className="font-mono text-xs">05:22</span>
          </button>
        </div>

        <ModeToggle />

        <button className="size-9 rounded-full hover:bg-accent flex items-center justify-center transition-all text-muted-foreground hover:text-foreground">
          <Settings className="size-5" />
        </button>

        <div className="size-9 rounded-full bg-gradient-to-br from-secondary/50 to-primary/50 p-[1px] shadow-lg shadow-black/20 dark:shadow-black/50">
          <div className="size-full rounded-full bg-background flex items-center justify-center">
            <User className="size-4 text-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
