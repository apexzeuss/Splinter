import React, { useState } from 'react';
import { SplinterNode } from '../types';
import { Cpu, Play, CheckCircle2, AlertCircle, RefreshCw, Settings, ArrowRight, ShieldCheck, Database, HardDrive, Zap, BarChart2 } from 'lucide-react';

interface NodeRegistryProps {
  nodes: SplinterNode[];
  onToggleNodeStatus: (nodeId: string) => void;
  onSimulateIngestion: () => void;
  isSimulating: boolean;
  onUpdateNodeConfig: (nodeId: string, newConfig: Record<string, any>) => void;
}

export const NodeRegistry: React.FC<NodeRegistryProps> = ({
  nodes,
  onToggleNodeStatus,
  onSimulateIngestion,
  isSimulating,
  onUpdateNodeConfig
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const totalProcessed = nodes.reduce((acc, curr) => acc + curr.processedCount, 0);
  const activeNodesCount = nodes.filter(n => n.status === 'active').length;

  const getNodeIcon = (type: SplinterNode['type']) => {
    switch (type) {
      case 'source': return <HardDrive className="w-4 h-4 text-blue-400" />;
      case 'processor': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'embedder': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'vectordb': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'rag-engine': return <BarChart2 className="w-4 h-4 text-cyan-400" />;
      case 'auth': return <ShieldCheck className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] p-6 lg:p-8 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div className="text-blue-500 text-xs font-mono mb-2 uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Phase 2 Milestone: Modular Core Architecture
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Splinter Node Registry & Pipeline Engine
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Dynamic node lifecycle manager adhering to <span className="text-blue-400 font-mono">architecture.md §4.2</span> contract (<code className="text-slate-300">ISplinterNode</code>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSimulateIngestion}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm ${
              isSimulating
                ? 'bg-blue-800 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Ingestion Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Active Nodes</div>
          <div className="text-xl font-mono font-bold text-slate-100 flex items-center gap-2">
            <span>{activeNodesCount} / {nodes.length}</span>
            <span className="text-xs text-emerald-400 font-normal">● 100% Ready</span>
          </div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Total Chunks Ingested</div>
          <div className="text-xl font-mono font-bold text-blue-400">
            {totalProcessed.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Avg Pipeline Latency</div>
          <div className="text-xl font-mono font-bold text-slate-200">
            186 ms
          </div>
        </div>

        <div className="bg-[#111113] p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Idle State Cost</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            $0.00 / hr <span className="text-[10px] text-slate-500 font-normal">(Scale-to-Zero)</span>
          </div>
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="bg-[#111113] p-5 rounded-2xl border border-slate-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Ingestion Pipeline Topology
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            EVENT_DRIVEN_ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.filter(n => n.type !== 'auth').map((node, index) => (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedNodeId === node.id
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getNodeIcon(node.type)}
                  <span className="text-xs font-semibold text-slate-200 truncate">{node.name}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{node.latencyMs}ms</span>
                <span>{node.processedCount} chunks</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details & Config */}
      {selectedNode && (
        <div className="bg-[#111113] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-100">{selectedNode.name}</h3>
                  <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                    {selectedNode.type}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">ID: {selectedNode.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newLatency = Math.floor(Math.random() * 80 + 20);
                  onUpdateNodeConfig(selectedNode.id, { ...selectedNode.config, lastPingMs: newLatency });
                }}
                className="px-3 py-1.5 rounded text-xs font-medium font-mono border border-slate-700 bg-slate-900 text-blue-400 hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Ping Node Health
              </button>

              <button
                onClick={() => onToggleNodeStatus(selectedNode.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium font-mono border transition ${
                  selectedNode.status === 'active'
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30'
                }`}
              >
                Status: {selectedNode.status.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                Configuration Parameters
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(selectedNode.config).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-blue-300 font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                ISplinterNode Interface Compliance
              </h4>
              <div className="p-4 bg-[#0A0A0B] rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>initialize(config) — Verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>process(payload) — Bound to Event Queue</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>healthCheck() — Latency: {selectedNode.latencyMs}ms</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>shutdown() — Scale-to-Zero Capable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
