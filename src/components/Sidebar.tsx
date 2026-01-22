"use client";

import React from 'react';
import { Search, AudioLines, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Session } from '@/lib/ui-types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onSessionSelect?: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onSessionSelect }) => {
  return (
    <aside className="w-full h-full flex flex-col glass-sidebar">
      <div className="p-6">
        <div className="relative group">
          <Search className="absolute left-4 top-3 size-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            className="w-full bg-muted/50 border border-input rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-accent placeholder:text-muted-foreground font-mono transition-all h-auto"
            placeholder="Filter sessions..."
            type="text"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {sessions.map((session, index) => {
          const isActive = session.id === activeSessionId;
          const isError = session.status === 'error';

          return (
            <div
              key={session.id}
              onClick={() => onSessionSelect?.(session.id)}
              className={`group flex cursor-pointer gap-4 p-4 rounded-3xl transition-all ${
                isActive
                  ? 'bg-primary/5 border border-primary/20 shadow-neon-cyan dark:shadow-neon-cyan shadow-sm'
                  : 'border border-transparent hover:border-border hover:bg-accent'
              }`}
            >
              <div className="mt-0.5">
                {isActive ? (
                   <AudioLines className="size-[22px] text-primary" />
                ) : isError ? (
                   <AlertCircle className="size-[22px] text-muted-foreground group-hover:text-foreground" />
                ) : (
                   <span className="flex items-center justify-center size-[22px] rounded-full border border-muted-foreground/30 text-[10px] font-mono font-medium text-muted-foreground group-hover:text-foreground group-hover:border-foreground/50 transition-colors">
                     {sessions.length - index}
                   </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`text-sm font-mono truncate ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {session.name}
                  </h3>
                  {isActive && (
                    <span className="flex size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-[11px] uppercase tracking-wider font-medium ${isActive ? 'text-muted-foreground opacity-100 font-bold' : 'text-muted-foreground'}`}>
                    {session.dateStr}
                    {session.duration && ` • ${session.duration}`}
                  </p>
                  {session.eventCount !== undefined && (
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {session.eventCount} events
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
