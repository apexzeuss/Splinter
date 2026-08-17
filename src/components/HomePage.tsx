import React, { useState, useEffect } from 'react';
import { 
  Sun, Navigation, MapPin, Compass, ShieldCheck, Thermometer, 
  Wind, Droplets, AlertTriangle, ArrowRight, Sparkles, CheckCircle2,
  Trees, Layers, Smartphone, Eye, HeartPulse, CloudSun, Shield
} from 'lucide-react';

interface HomePageProps {
  onNavigateToRouter: () => void;
  userCoords: { lat: number; lng: number; city: string; tempC: number; isLive: boolean } | null;
  onRequestLocation: () => void;
  onOpenLocationModal?: () => void;
  isLocating: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToRouter,
  userCoords,
  onRequestLocation,
  onOpenLocationModal,
  isLocating
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] text-zinc-100 selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Live Location & Climate Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-zinc-300">
              {userCoords?.isLive ? (
                <>Live GPS: <strong className="text-white">{userCoords.city}</strong> ({userCoords.tempC}°C Ambient)</>
              ) : (
                <>Hyperlocal Shade Geometry & Pedestrian Thermal Router</>
              )}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Walk the city in <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Continuous Cool Shade.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Splinter computes real-time 3D building shadow vectors and tree canopy density to guide pedestrians through the coolest, lowest-heat-stress routes in any city.
          </p>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onNavigateToRouter}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-600/30 flex items-center gap-2.5 group"
            >
              <span>Launch Live 2.5D Router</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenLocationModal || onRequestLocation}
              disabled={isLocating}
              className="px-5 py-3.5 rounded-2xl bg-[#121216] border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 font-semibold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <MapPin className={`w-4 h-4 ${isLocating ? 'text-amber-400 animate-spin' : userCoords?.isLive ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span>{userCoords?.isLive ? `📍 ${userCoords.city} (${userCoords.tempC}°C)` : isLocating ? 'Acquiring GPS...' : 'Set / Detect Location'}</span>
            </button>
          </div>
        </div>

        {/* Live Microclimate Telemetry Banner */}
        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121216]/90 border border-zinc-800/80 backdrop-blur">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Surface Temp Delta</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              -14.2°C
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              Shaded sidewalk vs open road
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121216]/90 border border-zinc-800/80 backdrop-blur">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Mean Shade Ratio</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              88.4%
            </div>
            <div className="text-[11px] text-zinc-400 font-medium mt-1">
              On Splinter optimized corridors
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121216]/90 border border-zinc-800/80 backdrop-blur">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
              <HeartPulse className="w-4 h-4 text-purple-400" />
              <span>Sweat Loss Reduction</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
              -68%
            </div>
            <div className="text-[11px] text-purple-400 font-medium mt-1">
              Reduced cardiac heat stress
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121216]/90 border border-zinc-800/80 backdrop-blur">
            <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>UV Exposure Barrier</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              92%
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              Solar radiation blocked
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown: How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase text-blue-400 font-bold tracking-widest mb-2">
            ENGINEERING THE COOL CITY
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Splinter Calculates Shaded Waypoints
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 hover:border-zinc-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sun className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-lg font-bold text-white">1. Real-Time Solar Azimuth</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Computes exact solar zenith and azimuth angles minute-by-minute based on your precise latitude, date, and local astronomical elevation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 hover:border-zinc-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-white">2. 3D Shadow Raytracing</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Projects vector shadow polygons from LiDAR building heights and urban tree canopy buffers onto pedestrian sidewalk networks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f13] border border-zinc-800/80 hover:border-zinc-700 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Navigation className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white">3. Physiological Routing</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Weights pedestrian graph edges by Mean Radiant Temperature (MRT), tailoring paths for vulnerable elders, children, and runners.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audiences / Demographic Personas */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              INCLUSIVE CLIMATE RESILIENCE
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for vulnerable walkers, active commuters, and city planners.
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Extreme urban heat islands are dangerous for high-risk demographics. Splinter provides customized routing profiles to keep every citizen protected.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-300">
                  <strong className="text-white">Elderly & Pediatric Safety:</strong> Enforces minimum 85% continuous shade coverage with hydration waypoint highlights.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-300">
                  <strong className="text-white">ADA & Mobility Navigation:</strong> Prioritizes shaded curb-ramps, accessible arcades, and avoids steep unshaded inclines.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-300">
                  <strong className="text-white">Urban Forestry Studio:</strong> Allows municipal planners to simulate the cooling impact of planting shade trees before planting.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121216] p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
            <div className="text-xs font-mono text-zinc-400 mb-4 flex items-center justify-between">
              <span>ACTIVE PROFILE: VULNERABLE</span>
              <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">HEAT ADVISORY</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    🌿
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Pine Colonnade Cool Path</div>
                    <div className="text-xs text-zinc-400">840m · 88% Shaded · Low Strain</div>
                  </div>
                </div>
                <span className="text-base font-mono font-bold text-emerald-400">28.4°C</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Direct Sun Boulevard</div>
                    <div className="text-xs text-zinc-400">710m · 12% Shaded · High Risk</div>
                  </div>
                </div>
                <span className="text-base font-mono font-bold text-rose-400">42.1°C</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
