import React, { useState } from 'react';
import { 
  BarChart3, Activity, Trees, Thermometer, ShieldAlert, Sparkles, 
  MapPin, Flame, Droplets, ArrowUpRight, Check, Compass, Sun
} from 'lucide-react';
import { CITY_PRESETS } from '../data/projectData';

export const AnalyticsPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState(CITY_PRESETS[0]);
  const [treeCanopyBudget, setTreeCanopyBudget] = useState(250);

  // Computed environmental impact numbers
  const surfaceTempReduction = (treeCanopyBudget * 0.018).toFixed(1);
  const co2SequesteredTons = (treeCanopyBudget * 0.048).toFixed(1);
  const shadedSquareMeters = Math.round(treeCanopyBudget * 38.5);
  const humanHeatIllnessAverted = Math.round(treeCanopyBudget * 0.12);

  return (
    <div className="flex-1 overflow-y-auto bg-[#070709] p-4 sm:p-6 lg:p-10 text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              MUNICIPAL CLIMATE RESILIENCE & UHI DECK
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Urban Heat Island (UHI) Analytics
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Quantitative microclimate modeling, Mean Radiant Temperature (MRT) mitigation, and urban tree canopy investment simulations.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#121216] p-2 rounded-2xl border border-zinc-800">
            <span className="text-xs text-zinc-400 px-2 font-mono">Target City:</span>
            <select
              value={selectedCity.id}
              onChange={(e) => {
                const found = CITY_PRESETS.find(c => c.id === e.target.value);
                if (found) setSelectedCity(found);
              }}
              className="bg-zinc-900 text-xs text-zinc-100 font-semibold px-3 py-1.5 rounded-xl border border-zinc-700 focus:outline-none"
            >
              {CITY_PRESETS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Peak {c.typicalSummerHighC}°C)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High-level Metric Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center justify-between mb-2">
              <span>Avg UHI Heat Penalty</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 font-mono">
              +{selectedCity.urbanHeatIslandPenaltyC}°C
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Urban core vs rural baseline
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center justify-between mb-2">
              <span>Active Sensor Stations</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-blue-400 font-mono">
              34 Mesonets
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              100% telemetry online
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center justify-between mb-2">
              <span>Current Sidewalk Shade</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-300 font-mono">
              31.8%
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              Target for 2030: 55.0%
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121216] border border-zinc-800">
            <div className="text-xs text-zinc-400 flex items-center justify-between mb-2">
              <span>Pedestrian Comfort Score</span>
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-purple-400 font-mono">
              74 / 100
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              +18 pts via Splinter routing
            </div>
          </div>
        </div>

        {/* Tree Canopy Simulation Studio */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#121216] border border-zinc-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-400" />
                Municipal Shade Canopy Investment Simulator
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Slide to model the microclimate cooling dividend of planting new urban trees across the downtown pedestrian core.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">Canopy Investment:</span>
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/50">
                {treeCanopyBudget} Trees
              </span>
            </div>
          </div>

          <input
            type="range"
            min={20}
            max={1000}
            step={10}
            value={treeCanopyBudget}
            onChange={(e) => setTreeCanopyBudget(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-400">Surface Temp Drop</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">-{surfaceTempReduction}°C</div>
              <div className="text-[11px] text-zinc-400">Localized sidewalk cooling</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-400">New Shaded Footprint</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{shadedSquareMeters.toLocaleString()} m²</div>
              <div className="text-[11px] text-zinc-400">Active pedestrian canopy</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-400">CO₂ Sequestered</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{co2SequesteredTons} Tons/yr</div>
              <div className="text-[11px] text-zinc-400">Carbon offset yield</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-400">Heat Incidents Averted</div>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">~{humanHeatIllnessAverted} Cases</div>
              <div className="text-[11px] text-zinc-400">Annual emergency savings</div>
            </div>
          </div>
        </div>

        {/* Diurnal Thermal Profile Table */}
        <div className="p-6 rounded-3xl bg-[#121216] border border-zinc-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-rose-400" />
            Diurnal Solar Exposure Profile ({selectedCity.name})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
                  <th className="py-3 px-4">Time Interval</th>
                  <th className="py-3 px-4">Solar Azimuth</th>
                  <th className="py-3 px-4">Solar Altitude</th>
                  <th className="py-3 px-4">Direct Sun MRT</th>
                  <th className="py-3 px-4">Splinter Shaded MRT</th>
                  <th className="py-3 px-4">Cooling Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">09:00 (Morning)</td>
                  <td className="py-3 px-4">102.4° (East)</td>
                  <td className="py-3 px-4">38.2°</td>
                  <td className="py-3 px-4 text-rose-300">38.4°C</td>
                  <td className="py-3 px-4 text-emerald-300">24.2°C</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">-14.2°C</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">13:00 (Solar Noon)</td>
                  <td className="py-3 px-4">180.0° (South)</td>
                  <td className="py-3 px-4">81.5° (High Overhead)</td>
                  <td className="py-3 px-4 text-rose-400">54.6°C</td>
                  <td className="py-3 px-4 text-emerald-300">33.1°C</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">-21.5°C</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">16:30 (Peak UHI Heat)</td>
                  <td className="py-3 px-4">242.8° (West)</td>
                  <td className="py-3 px-4">42.1°</td>
                  <td className="py-3 px-4 text-rose-500 font-bold">58.2°C</td>
                  <td className="py-3 px-4 text-emerald-400">29.4°C</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">-28.8°C</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
