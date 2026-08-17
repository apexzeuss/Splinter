import React, { useState } from 'react';
import { Database, Clock, ShieldCheck, Download, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface MemoryConsoleProps {
  onSync: () => void;
  isSyncing: boolean;
  lastSyncTime: string;
}

export const MemoryConsole: React.FC<MemoryConsoleProps> = ({
  onSync,
  isSyncing,
  lastSyncTime
}) => {
  const [snapshotExported, setSnapshotExported] = useState(false);

  const sessionEvents = [
    {
      id: 'evt-1',
      time: '18:22:01',
      title: 'Handoff Transition Protocol Ingested',
      details: 'Preserved core architectural requirements and ISplinterNode interfaces.',
      status: 'success'
    },
    {
      id: 'evt-2',
      time: '18:12:30',
      title: 'Cross-Session Memory State Recorded',
      details: 'Task ID task_e_6a809a7420ac8325a91c1e9b50cdb6ad indexed into memory.md.',
      status: 'success'
    },
    {
      id: 'evt-3',
      time: '18:05:45',
      title: 'System Architecture Specification §4.2 Validated',
      details: 'Modular interface contracts locked for multi-node pipeline extension.',
      status: 'success'
    },
    {
      id: 'evt-4',
      time: '17:57:18',
      title: 'Repository Initialized on GitHub',
      details: 'Commit 228449c registered on main branch.',
      status: 'success'
    }
  ];

  const handleExportSnapshot = () => {
    const snapshot = {
      activeSession: 'ACTIVE_SESSION_03',
      taskId: 'e_6a809a7420ac8325a91c1e9b50cdb6ad',
      lastSync: lastSyncTime,
      repository: 'https://github.com/apexzeuss/Splinter-',
      events: sessionEvents
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splinter-session-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnapshotExported(true);
    setTimeout(() => setSnapshotExported(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] p-6 lg:p-8 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div className="text-blue-500 text-xs font-mono mb-2 uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            State Persistence & Session Journal
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Cross-Session Memory & Continuity
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Maintains fragmented task memory and session continuity in accordance with <span className="text-blue-400 font-mono">memory.md</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync Memory Journal</span>
          </button>

          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{snapshotExported ? 'Exported!' : 'Export Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Memory Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Active Session</div>
          <div className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
            <span>ACTIVE_SESSION_03</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Persisted Task ID</div>
          <div className="text-sm font-mono text-blue-400 truncate">
            e_6a809a7420ac8325a91c1e9b50cdb6ad
          </div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Last Synchronized</div>
          <div className="text-sm font-mono text-slate-300">
            {lastSyncTime}
          </div>
        </div>
      </div>

      {/* Session Journal Timeline */}
      <div className="bg-[#111113] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Session Event Timeline (memory.md)</span>
        </h3>

        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {sessionEvents.map((evt) => (
            <div key={evt.id} className="relative pl-8">
              <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-[#111113] border-2 border-blue-500"></div>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-200">{evt.title}</span>
                  <span className="text-xs font-mono text-slate-500">{evt.time}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {evt.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
