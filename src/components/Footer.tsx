import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LogEntry } from '../types';

interface FooterProps {
  logs: LogEntry[];
  statusText: string;
  taskId: string;
  isExecuting: boolean;
}

export const Footer: React.FC<FooterProps> = ({ logs, statusText, taskId, isExecuting }) => {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <footer className="shrink-0 border-t border-slate-800 bg-[#0F0F11] select-none flex flex-col z-20">
      {/* Collapsible Log Terminal Drawer */}
      {showLogs && (
        <div className="h-44 bg-[#0A0A0B] border-b border-slate-800 p-3 overflow-y-auto font-mono text-[11px] space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-800/80 mb-2">
            <span>Splinter Runtime Console Output</span>
            <span>{logs.length} events logged</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-slate-300">
              <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={`uppercase font-semibold px-1 rounded text-[9px] shrink-0 ${
                  log.level === 'success'
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : log.level === 'warn'
                    ? 'text-amber-400 bg-amber-950/60'
                    : log.level === 'error'
                    ? 'text-rose-400 bg-rose-950/60'
                    : 'text-blue-400 bg-blue-950/60'
                }`}
              >
                {log.source}
              </span>
              <span className="leading-tight">{log.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Footer Row matching the design exactly */}
      <div className="h-10 px-6 flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
        <div className="flex items-center gap-4">
          <div className="truncate">
            Task ID: <span className="text-slate-400 lowercase">{taskId}</span>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition"
          >
            <Terminal className="w-3 h-3 text-blue-400" />
            <span>Logs ({logs.length})</span>
            {showLogs ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}></span>
          <span className="text-slate-400">{statusText}</span>
        </div>
      </div>
    </footer>
  );
};
