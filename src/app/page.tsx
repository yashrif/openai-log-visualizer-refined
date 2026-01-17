"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MainLog from '@/components/MainLog';
import Inspector from '@/components/Inspector';
import { SESSIONS, CURRENT_LOGS } from '@/lib/constants';

export default function Home() {
  const [activeSessionId] = useState('sess_9429...a1b');
  const [logs] = useState(CURRENT_LOGS);

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-300 font-sans">
      {/* Background Depth Effect */}
      <div className="fixed inset-0 bg-depth-overlay pointer-events-none z-0"></div>

      <Header />

      <div className="flex flex-1 overflow-hidden z-20">
        <Sidebar sessions={SESSIONS} activeSessionId={activeSessionId} />
        <MainLog logs={logs} />
        <Inspector />
      </div>
    </div>
  );
}
