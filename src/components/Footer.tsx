import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, ShieldCheck, Heart, ExternalLink, Globe, Lock, Info, X } from 'lucide-react';
import { LogEntry } from '../types';

interface FooterProps {
  logs: LogEntry[];
  statusText: string;
  taskId: string;
  isExecuting: boolean;
}

export const Footer: React.FC<FooterProps> = ({ logs, statusText, taskId, isExecuting }) => {
  const [showLogs, setShowLogs] = useState(false);
  const [activeTrustModal, setActiveTrustModal] = useState<'privacy' | 'terms' | 'about' | null>(null);

  return (
    <footer className="shrink-0 border-t border-zinc-800/80 bg-[#0c0c0f] select-none flex flex-col z-20" role="contentinfo" aria-label="Page Footer and Trust Signals">
      {/* Collapsible Log Terminal Drawer */}
      {showLogs && (
        <div className="h-44 bg-[#070709] border-b border-zinc-800 p-3 overflow-y-auto font-mono text-[11px] space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800/80 mb-2">
            <span className="font-semibold text-zinc-300">CoolWalk Runtime Event Console</span>
            <span>{logs.length} telemetry events logged</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-zinc-300">
              <span className="text-zinc-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={`uppercase font-semibold px-1 rounded text-[10px] shrink-0 ${
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

      {/* Main Trust, Compliance & Legal Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-400 font-sans">
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CoolWalk Climate Resilience</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <span className="text-zinc-400">© 2026 Open Pedestrian Research</span>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setActiveTrustModal('privacy')}
              className="text-zinc-400 hover:text-emerald-400 underline-offset-4 hover:underline transition"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTrustModal('terms')}
              className="text-zinc-400 hover:text-emerald-400 underline-offset-4 hover:underline transition"
            >
              Terms & Accuracy
            </button>
            <button
              onClick={() => setActiveTrustModal('about')}
              className="text-zinc-400 hover:text-emerald-400 underline-offset-4 hover:underline transition"
            >
              Open Data Attribution
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Lock className="w-3 h-3" />
            Zero Tracking / GPS Client-Only
          </span>
          <span className="text-zinc-700">·</span>
          <span>OpenStreetMap & Open-Meteo</span>
        </div>
      </div>

      {/* Developer & System Status Sub-bar */}
      <div className="h-9 px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase bg-[#09090c]">
        <div className="flex items-center gap-4">
          <div className="truncate">
            Task Session: <span className="text-zinc-300 lowercase">{taskId}</span>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            aria-expanded={showLogs}
            aria-label="Toggle system event logs drawer"
            className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition"
          >
            <Terminal className="w-3 h-3 text-blue-400" />
            <span>Logs ({logs.length})</span>
            {showLogs ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-zinc-300 font-medium">{statusText}</span>
        </div>
      </div>

      {/* Trust & Legal Modals */}
      {activeTrustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 text-zinc-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActiveTrustModal(null)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {activeTrustModal === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <Lock className="w-5 h-5" />
                  <h3>Privacy Policy & Geolocation Protection</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  CoolWalk operates under a strict <b>client-side privacy-first architecture</b>. When you use your device's GPS or search for a location, coordinate calculations are handled directly in your browser or sent exclusively to open, privacy-preserving geocoding APIs.
                </p>
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                  <li>No user tracking cookies or third-party behavioral trackers.</li>
                  <li>No personal location history is stored on any server.</li>
                  <li>All mathematical solar projections run locally in JavaScript.</li>
                </ul>
              </div>
            )}

            {activeTrustModal === 'terms' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <h3>Terms of Service & Heat Guidance Notice</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  CoolWalk routes are computed using geometric solar shadow projections ($L = H / \tan(\alpha)$) combined with street orientations and real-time Open-Meteo atmospheric telemetry.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <b>Thermal Safety Notice:</b> Always carry water, wear sun protection, and heed local municipal extreme heat advisories. Simulated shade percentages do not account for temporary road closures or unmapped construction scaffolds.
                </p>
              </div>
            )}

            {activeTrustModal === 'about' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                  <Globe className="w-5 h-5" />
                  <h3>Open Data & Scientific Attribution</h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  CoolWalk is built entirely with open data standards:
                </p>
                <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                  <li><b>OpenStreetMap (OSRM):</b> Global pedestrian graph routing under ODbL license.</li>
                  <li><b>Open-Meteo:</b> Real-time high-resolution DNI, UV, and hourly weather.</li>
                  <li><b>NOAA Solar Position Algorithm:</b> Astronomical solar elevation and azimuth geometry.</li>
                  <li><b>CartoDB Voyager:</b> Cartographic vector base tiles.</li>
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveTrustModal(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
