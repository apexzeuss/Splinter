import React from 'react';
import { 
  Sun, Compass, ShieldCheck, Heart, Sparkles, MapPin, 
  ExternalLink, ArrowRight, Activity, Droplets, Trees, CheckCircle2, Globe, Database
} from 'lucide-react';

export const AboutMissionPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] p-4 sm:p-6 lg:p-10 text-zinc-100">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            METHODOLOGY & REAL OPEN DATA CHARTER
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Protecting pedestrian health with real-world solar physics & open data.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            Standard navigation algorithms calculate only Euclidean or shortest-distance paths—funneling pedestrians onto unshaded, heat-absorbing asphalt during peak solar hours. CoolWalk computes the true physical trajectory of sunlight, direct irradiance, and sidewalk shade coverage.
          </p>
        </div>

        {/* Real Data Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Open-Meteo Weather API</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fetches real-time ambient air temperature, relative humidity, wind speed, cloud cover, and Direct Normal Irradiance ($W/m^2$) for any coordinate on Earth with 0% mock data.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. NOAA Astronomical Engine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculates the exact solar altitude/elevation angle ($\alpha$) and solar azimuth ($\theta_z$) for your exact latitude, longitude, and minute of the day using standard solar equations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. OpenStreetMap OSRM Graph</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Streams real global pedestrian walking networks, sidewalks, and crosswalks with turn-by-turn routing instructions, precise distances, and walking durations.
            </p>
          </div>
        </div>

        {/* Scientific Grounding: Mean Radiant Temperature */}
        <div className="p-8 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            The Science: Why Mean Radiant Temperature (MRT) Matters
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Standard ambient thermometer temperature (e.g., 34°C / 93°F) only accounts for roughly 20% of human physiological heat strain. The remaining 80% is governed by <strong>Mean Radiant Temperature (T_mrt)</strong>—the sum of direct solar radiation, diffuse atmospheric scattering, and surface thermal re-radiation from asphalt. Under direct midday sunlight, human skin experiences an effective radiative heat load equivalent to an ambient temperature 10°C to 15°C higher.
          </p>
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div className="text-xs text-zinc-300">
              CoolWalk adheres to the <strong>Universal Thermal Climate Index (UTCI)</strong> and WMO Urban Microclimate Standards.
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Real Science
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
