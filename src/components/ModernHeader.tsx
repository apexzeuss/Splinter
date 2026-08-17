import React from 'react';
import { 
  Sun, Compass, ShieldCheck, MapPin, Navigation, 
  BarChart3, Users, Code2, Heart, Sparkles, Layers, BookOpen, Terminal, CheckCircle2, Cpu, Database
} from 'lucide-react';

export type AppNavPage = 'unified' | 'docs';

interface ModernHeaderProps {
  currentPage: AppNavPage;
  onNavigate: (page: AppNavPage) => void;
  userCoords: { lat: number; lng: number; city: string; tempC: number; isLive: boolean } | null;
  onRequestLocation: () => void;
  onOpenLocationModal?: () => void;
  isLocating: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  currentPage,
  onNavigate,
  userCoords,
  onRequestLocation,
  onOpenLocationModal,
  isLocating
}) => {
  return (
    <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 bg-[#0a0a0d]/95 backdrop-blur-md select-none z-30 shrink-0 sticky top-0">
      {/* Brand Logo & Tag */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('unified')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-500 p-[1px] shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-[#0a0a0d] rounded-[11px] flex items-center justify-center font-bold text-white tracking-wider">
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              CoolWalk
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold tracking-wide">
              ALL-IN-ONE OBSERVATORY
            </span>
          </div>
          <span className="text-[10.5px] text-zinc-400 hidden sm:inline-block">
            Real-Time Shade, Heat & Pedestrian Navigation
          </span>
        </div>
      </div>

      {/* Quick Navigation / Section Anchors */}
      <nav className="hidden md:flex items-center gap-1.5 bg-[#121216] p-1 rounded-xl border border-zinc-800/80 shadow-inner">
        <button
          onClick={() => {
            onNavigate('unified');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            currentPage === 'unified'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-300" />
          <span>Unified Live Dashboard</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        <button
          onClick={() => onNavigate(currentPage === 'docs' ? 'unified' : 'docs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            currentPage === 'docs'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>System & Method Docs</span>
        </button>
      </nav>

      {/* Right Controls: Real Location Button & Status */}
      <div className="flex items-center gap-2.5">
        {/* Real Geolocation Button */}
        <button
          onClick={onOpenLocationModal || onRequestLocation}
          disabled={isLocating}
          title="Click to detect GPS, search any city, or change microclimate"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
            userCoords?.isLive
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
          }`}
        >
          <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'text-amber-400 animate-spin' : userCoords?.isLive ? 'text-emerald-400' : 'text-blue-400'}`} />
          <span className="max-w-[140px] sm:max-w-none truncate font-medium">
            {isLocating ? 'Locating...' : userCoords?.isLive ? `${userCoords.city} (${userCoords.tempC}°C)` : 'Set Location'}
          </span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">▾</span>
        </button>
      </div>
    </header>
  );
};
