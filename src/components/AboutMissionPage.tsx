import React from 'react';
import { 
  Sun, Compass, ShieldCheck, Heart, Sparkles, MapPin, 
  ExternalLink, ArrowRight, Activity, Droplets, Trees
} from 'lucide-react';

export const AboutMissionPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] p-4 sm:p-6 lg:p-10 text-zinc-100">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            OUR MISSION & CLIMATE CHARTER
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Protecting pedestrian health in an era of unprecedented urban heat.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            As global summer temperatures break historical records, standard navigation apps blindly route pedestrians along the shortest asphalt path—ignoring solar radiation and lethal surface heat. Splinter treats shade as critical public health infrastructure.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Solar Geometry</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We model the exact physical physics of light and shadow, calculating building extrusions, albedo reflection, and canopy penumbras.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Heat Equity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Vulnerable communities often suffer from 40% less tree canopy. Splinter provides free tools to highlight shaded corridors and advocate for tree planting.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Open Urban Mesh</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open APIs for cities, transit authorities, and open-source civic developers to integrate thermal routing into public transit displays.
            </p>
          </div>
        </div>

        {/* Scientific Grounding */}
        <div className="p-8 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            The Science: Why Mean Radiant Temperature (MRT) Matters
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Standard thermometer air temperature (e.g., 38°C / 100°F) only accounts for 20% of human heat sensation. The other 80% is driven by <strong>solar radiation and surface emissions (Mean Radiant Temperature)</strong>. Direct sun exposure can make a 38°C day feel like 52°C on human physiology, drastically elevating cardiac stress and dehydration.
          </p>
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="text-xs text-zinc-300">
              Splinter is built in accordance with the <strong>Universal Thermal Climate Index (UTCI)</strong> and WMO Urban Microclimate Standards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
