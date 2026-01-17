"use client";

import React from 'react';
import { Download, Trash2, Lock, Play, User, Bot, Wrench } from 'lucide-react';
import { LogEntry } from '@/lib/ui-types';

interface MainLogProps {
  logs: LogEntry[];
}

const Waveform: React.FC<{ color: 'primary' | 'secondary' }> = ({ color }) => {
  const bgClass = color === 'primary' ? 'bg-primary' : 'bg-secondary';
  // Randomized heights for visual variety
  const heights = [30, 60, 40, 80, 50, 70, 30, 90, 45, 20];

  return (
    <div className="flex items-end gap-1.5 h-10 px-4 py-2 bg-black/40 rounded-2xl border border-white/5 w-full">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${bgClass}`}
          style={{ height: `${h}%`, opacity: Math.max(0.3, h / 100) }}
        ></div>
      ))}
    </div>
  );
};

const SmallWaveform: React.FC = () => (
  <div className="h-5 w-40 flex items-end gap-1 opacity-60">
    <div className="w-1 h-3 bg-secondary rounded-full waveform-bar"></div>
    <div className="w-1 h-5 bg-secondary rounded-full waveform-bar"></div>
    <div className="w-1 h-2 bg-secondary rounded-full waveform-bar"></div>
    <div className="w-1 h-6 bg-secondary rounded-full waveform-bar"></div>
    <div className="w-1 h-4 bg-secondary rounded-full waveform-bar"></div>
    <div className="w-1 h-3 bg-secondary rounded-full waveform-bar"></div>
  </div>
);


const MainLog: React.FC<MainLogProps> = ({ logs }) => {
  return (
    <main className="flex-1 flex flex-col relative bg-transparent min-w-0">
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-bg-deep/40 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">Session ID</span>
          <span className="text-white font-mono bg-white/5 border border-white/5 px-3 py-1 rounded-full text-xs select-all shadow-inner">
            sess_9429_x8712_visualizer
          </span>
        </div>
        <div className="flex gap-2">
          <button className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <Download className="size-5" />
          </button>
          <button className="size-8 flex items-center justify-center hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {logs.map((log) => {
          if (log.type === 'system') {
            return (
              <div key={log.id} className="flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  {log.content} • {log.timestamp}
                </span>
              </div>
            );
          }

          if (log.type === 'user') {
            return (
              <div key={log.id} className="flex justify-end gap-5 group">
                <div className="flex flex-col items-end max-w-xl">
                  <div className="flex items-center gap-3 mb-2 opacity-60">
                    <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">User Agent</span>
                  </div>
                  <div className="p-6 rounded-[32px] rounded-tr-none bg-secondary/10 border border-secondary/20 text-white shadow-neon-purple ethereal-card">
                    {log.isAudio && (
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                            <button className="size-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20 hover:scale-105 transition-transform">
                                <Play className="size-5" />
                            </button>
                            <SmallWaveform />
                        </div>
                    )}
                    <p className="text-[15px] leading-relaxed text-slate-100">{log.content}</p>
                  </div>
                </div>
                <div className="size-12 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center shrink-0 shadow-neon-purple mt-6">
                  <User className="size-6 text-secondary" />
                </div>
              </div>
            );
          }

          if (log.type === 'assistant') {
            return (
              <div key={log.id} className="flex justify-start gap-5 group">
                <div className="size-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 shadow-neon-cyan mt-6">
                  <Bot className="size-6 text-primary" />
                </div>
                <div className="flex flex-col items-start max-w-xl">
                  <div className="flex items-center gap-3 mb-2 opacity-60">
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Assistant Node</span>
                    <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="p-6 rounded-[32px] rounded-tl-none bg-primary/10 border border-primary/20 text-white shadow-neon-cyan ethereal-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                    <p className="text-[15px] leading-relaxed mb-6 text-slate-100">{log.content}</p>
                    {log.isAudio && <Waveform color="primary" />}
                  </div>
                </div>
              </div>
            );
          }

          if (log.type === 'tool') {
            return (
              <div key={log.id} className="flex justify-center my-6">
                <div className="ethereal-card rounded-[28px] p-0 max-w-2xl w-full border-l-[6px] border-l-orange-500/50 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-6 py-4 bg-orange-500/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Wrench className="size-[18px] text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Tool Execution</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">call_{log.id.slice(-5)}</span>
                  </div>
                  <div className="p-6 font-mono text-xs space-y-3">
                    <div className="flex gap-6">
                      <span className="text-slate-500 w-20 shrink-0">Function:</span>
                      <span className="text-white font-bold">{log.toolName}</span>
                    </div>
                    <div className="flex gap-6">
                      <span className="text-slate-500 w-20 shrink-0">Arguments:</span>
                      <span className="text-green-400/90 leading-relaxed">{log.toolArgs}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
        <div className="h-20"></div>
      </div>

      <div className="p-6 border-t border-white/5 bg-bg-deep/40 backdrop-blur-md z-10">
        <div className="relative">
          <input
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm text-slate-500 cursor-not-allowed font-mono focus:outline-none"
            disabled
            placeholder="Visualizer Mode - Read Only"
            type="text"
          />
          <Lock className="absolute right-6 top-4 size-5 text-slate-600" />
        </div>
      </div>
    </main>
  );
};

export default MainLog;
