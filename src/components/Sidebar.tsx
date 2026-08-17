import React from 'react';
import { DocId, ProjectDoc } from '../types';
import { FileText, MapPin, Cpu, Database, Sparkles, GitBranch, ShieldCheck, CheckCircle, Clock, Layers, Sun, Navigation, Trees, Terminal } from 'lucide-react';

interface SidebarProps {
  docs: Record<string, ProjectDoc>;
  selectedDocId: DocId;
  onSelectDoc: (id: DocId) => void;
  activeView: 'handoff' | 'docs' | 'nodes' | 'rag' | 'memory' | 'simulator';
  setActiveView: (view: 'handoff' | 'docs' | 'nodes' | 'rag' | 'memory' | 'simulator') => void;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  docs,
  selectedDocId,
  onSelectDoc,
  activeView,
  setActiveView,
  completedTasksCount,
  totalTasksCount
}) => {
  const docList: DocId[] = ['project-plan.md', 'prd.md', 'architecture.md', 'memory.md', 'handoff.md'];

  return (
    <aside className="w-64 bg-[#0a0a0d] border-r border-zinc-800/80 flex flex-col shrink-0 select-none overflow-y-auto hidden md:flex">
      {/* Primary Navigation Sections */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-mono">
            Core Engines
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
            ONLINE
          </span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveView('simulator')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
              activeView === 'simulator'
                ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sun className={`w-4 h-4 ${activeView === 'simulator' ? 'text-amber-400' : 'text-zinc-400 group-hover:text-amber-400'}`} />
              <span className="text-xs">Thermal Router 2.5D</span>
            </div>
            <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
              SOLAR
            </span>
          </button>

          <button
            onClick={() => setActiveView('handoff')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
              activeView === 'handoff'
                ? 'bg-zinc-800/80 text-blue-400 border border-zinc-700 font-medium shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className={`w-4 h-4 ${activeView === 'handoff' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-emerald-400'}`} />
              <span className="text-xs">Tasks & Handoff</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
              {completedTasksCount}/{totalTasksCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('nodes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
              activeView === 'nodes'
                ? 'bg-zinc-800/80 text-blue-400 border border-zinc-700 font-medium'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className={`w-4 h-4 ${activeView === 'nodes' ? 'text-blue-400' : 'text-zinc-400 group-hover:text-blue-400'}`} />
              <span className="text-xs">Node Mesh §4.2</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          <button
            onClick={() => setActiveView('rag')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
              activeView === 'rag'
                ? 'bg-zinc-800/80 text-blue-400 border border-zinc-700 font-medium'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeView === 'rag' ? 'text-purple-400' : 'text-zinc-400 group-hover:text-purple-400'}`} />
              <span className="text-xs">Vector RAG Console</span>
            </div>
            <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">
              AI
            </span>
          </button>

          <button
            onClick={() => setActiveView('memory')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
              activeView === 'memory'
                ? 'bg-zinc-800/80 text-blue-400 border border-zinc-700 font-medium'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal className={`w-4 h-4 ${activeView === 'memory' ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-cyan-400'}`} />
              <span className="text-xs">Memory Context</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded">
              JSON
            </span>
          </button>
        </div>
      </div>

      {/* Project Knowledge section */}
      <div className="p-3.5 pt-3 flex-1">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-mono">
            Project Knowledge
          </div>
          <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            5 ARTIFACTS
          </span>
        </div>

        <nav className="space-y-1">
          {docList.map((docId) => {
            const doc = docs[docId];
            const isHandoff = docId === 'handoff.md';
            const isDocSelected = activeView === 'docs' && selectedDocId === docId;
            const isHandoffActive = activeView === 'handoff' && isHandoff;

            const isHighlighted = isDocSelected || isHandoffActive;

            return (
              <button
                key={docId}
                onClick={() => {
                  onSelectDoc(docId);
                  if (isHandoff) {
                    setActiveView('handoff');
                  } else {
                    setActiveView('docs');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-all group ${
                  isHighlighted
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? 'text-blue-400' : 'text-zinc-400 group-hover:text-blue-400'}`} />
                  <span className="text-xs truncate font-mono">{docId}</span>
                </div>

                {isHandoff && (
                  <span className="text-[8px] font-mono uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-bold">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Task progress widget */}
      <div className="p-3 mx-3 my-2 bg-[#121216] rounded-xl border border-zinc-800/80">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
          <span className="font-medium text-[11px]">Handoff Checklist</span>
          <span className="font-mono text-emerald-400 text-xs font-semibold">
            {Math.round((completedTasksCount / (totalTasksCount || 1)) * 100)}%
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round((completedTasksCount / (totalTasksCount || 1)) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Repository footer info */}
      <div className="p-3.5 border-t border-zinc-800/80 bg-[#08080a]">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 truncate mb-1">
          <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">apexzeuss/Splinter-</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>branch: main</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Synced
          </span>
        </div>
      </div>
    </aside>
  );
};

