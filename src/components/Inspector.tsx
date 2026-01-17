"use client";

import React from 'react';

const Inspector: React.FC = () => {
  return (
    <aside className="w-[440px] flex flex-col glass-inspector">
      <div className="flex border-b border-white/5 bg-white/5 p-1 mx-6 mt-6 rounded-2xl">
        <button className="flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-xl transition-all shadow-glow-sm">
          Payload
        </button>
        <button className="flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">
          Headers
        </button>
        <button className="flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">
          Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs px-6 py-8 space-y-8">

        {/* Event Manifest */}
        <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 space-y-4">
          <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">Event Manifest</h3>
          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-slate-500">Event Type</div>
            <div className="text-primary text-right font-bold">response.tool_call</div>

            <div className="text-slate-500">Internal ID</div>
            <div className="text-slate-300 text-right opacity-80">evt_282910...</div>

            <div className="text-slate-500">Unix Micro</div>
            <div className="text-slate-300 text-right opacity-80">1698248532100</div>

            <div className="text-slate-500">Rtt Latency</div>
            <div className="text-green-400 text-right font-bold">12ms</div>
          </div>
        </div>

        {/* JSON Payload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">JSON Payload</h3>
            <button className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Copy Raw</button>
          </div>
          <div className="bg-black/60 p-6 rounded-[24px] border border-white/5 overflow-x-auto shadow-inner relative group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <pre className="leading-relaxed">
              <span className="text-slate-500">{`{`}</span>
              {'\n  '}<span className="text-blue-400">&quot;type&quot;</span>: <span className="text-green-400">&quot;response.tool_call.done&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;event_id&quot;</span>: <span className="text-green-400">&quot;event_Af329s...&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;response_id&quot;</span>: <span className="text-green-400">&quot;resp_99210...&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;item_id&quot;</span>: <span className="text-green-400">&quot;item_8812x...&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;call_id&quot;</span>: <span className="text-green-400">&quot;call_8821x&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;name&quot;</span>: <span className="text-green-400">&quot;query_db&quot;</span>,
              {'\n  '}<span className="text-blue-400">&quot;arguments&quot;</span>: <span className="text-slate-500">{`{`}</span>
              {'\n    '}<span className="text-blue-400">&quot;query&quot;</span>: <span className="text-green-400">&quot;SELECT error_logs FROM app...&quot;</span>,
              {'\n    '}<span className="text-blue-400">&quot;limit&quot;</span>: <span className="text-orange-400">5</span>
              {'\n  '}<span className="text-slate-500">{`}`}</span>,
              {'\n  '}<span className="text-blue-400">&quot;usage&quot;</span>: <span className="text-slate-500">{`{`}</span>
              {'\n     '}<span className="text-blue-400">&quot;prompt_tokens&quot;</span>: <span className="text-orange-400">145</span>,
              {'\n     '}<span className="text-blue-400">&quot;completion_tokens&quot;</span>: <span className="text-orange-400">22</span>
              {'\n  '}<span className="text-slate-500">{`}`}</span>
              {'\n'}<span className="text-slate-500">{`}`}</span>
            </pre>
          </div>
        </div>

        {/* Sequence Context */}
        <div className="pt-4 space-y-4">
          <h3 className="text-slate-500 uppercase text-[10px] tracking-widest font-sans font-bold">Sequence Context</h3>
          <div className="space-y-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 cursor-pointer flex justify-between items-center group transition-all">
              <span className="text-primary/80 truncate font-bold">function_call.delta</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Previous</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-orange-500/20 cursor-pointer flex justify-between items-center group transition-all">
              <span className="text-orange-400/80 truncate font-bold">function_call.output</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Next</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Inspector;
