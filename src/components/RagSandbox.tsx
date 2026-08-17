import React, { useState } from 'react';
import { SAMPLE_CHUNKS } from '../data/projectData';
import { Search, Sparkles, Database, FileText, Check, ArrowRight, Sliders, Shield, Terminal, Zap } from 'lucide-react';

const PRESET_QUERIES = [
  'How does Splinter achieve scale to zero and reduce cloud idle costs?',
  'How does building height and solar azimuth determine cast shadow polygons?',
  'What is the formula for pedestrian Mean Radiant Temperature (Tmrt) and UTCI?',
  'How does the state synchronization engine prevent token exhaustion in RAG handoffs?'
];

export const RagSandbox: React.FC = () => {
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75);
  const [topK, setTopK] = useState(3);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(SAMPLE_CHUNKS);

  const handleSearch = (customQuery?: string) => {
    const qText = customQuery || query;
    if (!qText.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      const q = qText.toLowerCase();
      const updated = SAMPLE_CHUNKS.map((chunk) => {
        let boost = 0;
        if (q.includes('scale') || q.includes('cost') || q.includes('zero')) {
          if (chunk.id === 'chk-002') boost = 0.08;
        }
        if (q.includes('node') || q.includes('registry') || q.includes('architecture')) {
          if (chunk.id === 'chk-003') boost = 0.09;
        }
        if (q.includes('shadow') || q.includes('solar') || q.includes('azimuth') || q.includes('tmrt')) {
          if (chunk.id === 'chk-001') boost = 0.12;
        }
        if (q.includes('state') || q.includes('token') || q.includes('handoff')) {
          if (chunk.id === 'chk-004') boost = 0.11;
        }
        return {
          ...chunk,
          similarity: Math.min(0.98, chunk.similarity + boost)
        };
      }).filter(c => c.similarity >= similarityThreshold);

      setResults(updated);
      setIsSearching(false);
    }, 350);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0B] p-6 lg:p-8 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <div className="text-blue-500 text-xs font-mono mb-2 uppercase tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            RAG Sandbox & Vector Verification
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Semantic Vector Query Workbench
          </h2>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Verify ingested chunks, high-dimensional cosine embeddings, and synthesized responses across Splinter's architecture knowledge base.
          </p>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold px-1">Presets:</span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(preset);
              handleSearch(preset);
            }}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#111113] border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 transition font-sans flex items-center gap-1.5 truncate max-w-sm"
          >
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{preset}</span>
          </button>
        ))}
      </div>

      {/* Query Bar */}
      <div className="bg-[#111113] p-5 rounded-2xl border border-slate-800 mb-6 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter semantic query to search vectorized knowledge base..."
              className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl pl-10 pr-24 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 font-sans shadow-inner"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Query'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono">Threshold: {similarityThreshold}</span>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-24 accent-blue-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono">Top K: {topK}</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 font-mono"
                >
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span>Index: pgvector_hnsw</span>
              <span>•</span>
              <span>Distance: Cosine</span>
            </div>
          </div>
        </form>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-mono flex items-center gap-2">
            <span>Retrieved Knowledge Chunks ({results.length})</span>
          </h3>
          <span className="text-xs font-mono text-blue-400">Dim: 768 Float32</span>
        </div>

        {results.length === 0 ? (
          <div className="p-8 text-center bg-[#111113] rounded-2xl border border-slate-800 text-slate-500 text-sm">
            No chunks matched similarity threshold &gt; {similarityThreshold}. Try lowering the threshold or refining query.
          </div>
        ) : (
          results.slice(0, topK).map((chunk) => (
            <div
              key={chunk.id}
              className="bg-[#111113] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-200">{chunk.docName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Chunk #{chunk.chunkIndex}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    Score: {(chunk.similarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 bg-[#0A0A0B] p-3.5 rounded-xl border border-slate-800/80 my-3 leading-relaxed">
                "{chunk.text}"
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span className="truncate max-w-md">SHA-256: {chunk.sha256}</span>
                <span>UUID: {chunk.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
