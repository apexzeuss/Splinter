import React from 'react';
import { Terminal, Shield, RefreshCw, Cpu, Layers, BookOpen, Search, CheckCircle2, Sun, Sparkles, Navigation2, Activity } from 'lucide-react';

interface HeaderProps {
  activeView: 'handoff' | 'docs' | 'nodes' | 'rag' | 'memory' | 'simulator';
  setActiveView: (view: 'handoff' | 'docs' | 'nodes' | 'rag' | 'memory' | 'simulator') => void;
  lastSyncTime: string;
  isSyncing: boolean;
  onSync: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  lastSyncTime,
  isSyncing,
  onSync,
  completedTasksCount,
  totalTasksCount
}) => {
  return (
    <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 bg-[#0a0a0d]/90 backdrop-blur-md select-none z-30 shrink-0 sticky top-0">
      {/* Brand & Repository Context */}
      <div className="flex items-center gap-3.5">
        <div className="relative group cursor-pointer" onClick={() => setActiveView('simulator')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-500 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0a0a0d] rounded-[11px] flex items-center justify-center font-bold text-white tracking-wider">
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" style={{ animationDuration: '24s' }} />
            </div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0a0d] rounded-full"></span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Splinter
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition hidden sm:inline">
              thermal-mesh
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
              GIS 2.5D
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 hidden md:inline-block">
            Pedestrian Thermal Shadow Routing Engine
          </span>
        </div>
      </div>

      {/* Navigation Switchers */}
      <div className="hidden lg:flex items-center gap-1 bg-[#121216] p-1 rounded-xl border border-zinc-800/80 shadow-inner">
        <button
          onClick={() => setActiveView('simulator')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeView === 'simulator'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Thermal Router</span>
        </button>

        <button
          onClick={() => setActiveView('handoff')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'handoff'
              ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Handoff & Tasks</span>
          {totalTasksCount > 0 && (
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-700/60 text-zinc-300">
              {completedTasksCount}/{totalTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('docs')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'docs'
              ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Docs</span>
        </button>

        <button
          onClick={() => setActiveView('nodes')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'nodes'
              ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Node Mesh</span>
        </button>

        <button
          onClick={() => setActiveView('rag')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'rag'
              ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>RAG Sandbox</span>
        </button>

        <button
          onClick={() => setActiveView('memory')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeView === 'memory'
              ? 'bg-zinc-800 text-blue-400 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Memory Console</span>
        </button>
      </div>

      {/* Right status & indicators */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onSync}
          title="Synchronize memory and pipeline state"
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
          <span className="hidden sm:inline font-medium">Sync State</span>
        </button>

        {/* Live Engine Telemetry Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
          <span className="font-semibold tracking-wide text-[11px]">SOLAR_ENGINE_ONLINE</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1 pr-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            N
          </div>
          <span className="text-xs font-medium text-zinc-300 hidden sm:inline">apexzeuss</span>
        </div>
      </div>
    </header>
  );
};

