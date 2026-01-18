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
    <aside className="w-full h-full flex flex-col">
      <div className="p-6">
        <div className="relative group">
          <Search className="absolute left-4 top-3 size-[18px] text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input
            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-white/10 placeholder:text-slate-600 font-mono transition-all h-auto"
            placeholder="Filter sessions..."
            type="text"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isError = session.status === 'error';

          return (
            <div
              key={session.id}
              onClick={() => onSessionSelect?.(session.id)}
              className={`group flex cursor-pointer gap-4 p-4 rounded-3xl transition-all ${
                isActive
                  ? 'bg-primary/5 border border-primary/20 shadow-neon-cyan'
                  : 'border border-transparent hover:border-white/10 hover:bg-white/5'
              }`}
            >
              <div className="mt-0.5">
                {isActive ? (
                   <AudioLines className="size-[22px] text-primary" />
                ) : isError ? (
                   <AlertCircle className="size-[22px] text-slate-600 group-hover:text-slate-400" />
                ) : (
                   <CheckCircle className="size-[22px] text-slate-600 group-hover:text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`text-sm font-mono truncate ${isActive ? 'text-white font-semibold' : 'text-slate-300 group-hover:text-white'}`}>
                    {session.name}
                  </h3>
                  {isActive && (
                    <span className="flex size-1.5 rounded-full bg-primary shadow-[0_0_8px_#00ebd3]"></span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-[11px] uppercase tracking-wider font-medium ${isActive ? 'text-slate-400 opacity-60 font-bold' : 'text-slate-500'}`}>
                    {session.dateStr}
                    {session.duration && ` • ${session.duration}`}
                  </p>
                  {session.eventCount !== undefined && (
                    <span className="text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
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
