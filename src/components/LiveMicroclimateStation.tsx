import React, { useEffect, useState } from 'react';
import { 
  Sun, 
  Thermometer, 
  Wind, 
  Droplets, 
  ShieldAlert, 
  Compass, 
  Clock, 
  Activity, 
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';
import { fetchRealLiveWeather, LiveWeatherReport } from '../services/weatherService';
import { calculateRealSolarPosition, SolarPosition } from '../services/solarService';

interface LiveMicroclimateStationProps {
  userCoords: { lat: number; lng: number; city: string; tempC: number };
  onOpenLocationModal: () => void;
}

export const LiveMicroclimateStation: React.FC<LiveMicroclimateStationProps> = ({
  userCoords,
  onOpenLocationModal,
}) => {
  const [weather, setWeather] = useState<LiveWeatherReport | null>(null);
  const [solar, setSolar] = useState<SolarPosition>(calculateRealSolarPosition(userCoords.lat, userCoords.lng));
  const [isLoading, setIsLoading] = useState(false);

  const loadWeather = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRealLiveWeather(userCoords.lat, userCoords.lng, userCoords.city);
      setWeather(data);
      setSolar(calculateRealSolarPosition(userCoords.lat, userCoords.lng));
    } catch (e) {
      console.error('Failed to load live weather:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [userCoords.lat, userCoords.lng, userCoords.city]);

  return (
    <div className="h-full w-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                100% Real Live Observational Data
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Live Solar & Microclimate Station — {userCoords.city}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Coordinates: {userCoords.lat.toFixed(4)}°N, {userCoords.lng.toFixed(4)}°E · Open-Meteo & NOAA Astronomical Engine
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLocationModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition flex items-center gap-1.5"
            >
              Change Location
            </button>
            <button
              onClick={loadWeather}
              disabled={isLoading}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real Live Metrics Bento Grid */}
        {weather && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Ambient Temperature */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  Air Temperature
                </span>
                <span className="font-mono text-emerald-400 font-bold">LIVE</span>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {weather.temperatureC}°C
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span>Feels Like (Apparent):</span>
                <span className="font-bold text-white font-mono">{weather.apparentTemperatureC}°C</span>
              </div>
            </div>

            {/* 2. UV Index & Radiation */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Sun className="w-4 h-4 text-amber-400" />
                  UV Radiation Index
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                  weather.uvIndex > 7 ? 'bg-rose-500/20 text-rose-400' :
                  weather.uvIndex > 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {weather.uvIndex > 7 ? 'VERY HIGH' : weather.uvIndex > 4 ? 'MODERATE' : 'LOW'}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-amber-300 font-mono">
                {weather.uvIndex} <span className="text-sm font-normal text-slate-400">/ 12</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span>Direct Solar Irradiance:</span>
                <span className="font-bold text-white font-mono">{weather.directNormalIrradianceWm2} W/m²</span>
              </div>
            </div>

            {/* 3. Solar Astronomical Position */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Sun Position (NOAA)
                </span>
                <span className="font-mono text-blue-400 text-[11px]">Astronomical</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-300 font-mono">
                {solar.elevationDeg}° <span className="text-xs font-normal text-slate-400">Elev</span> · {solar.azimuthDeg}° <span className="text-xs font-normal text-slate-400">Az</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span>Daylight Status:</span>
                <span className="font-bold text-white">{solar.isDaylight ? '☀️ Sun Up' : '🌙 Night'}</span>
              </div>
            </div>

            {/* 4. Wind & Humidity */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Atmospheric Wind
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">{weather.weatherDescription}</span>
              </div>
              <div className="text-3xl font-extrabold text-cyan-300 font-mono">
                {weather.windSpeedKmh} <span className="text-sm font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span>Relative Humidity:</span>
                <span className="font-bold text-white font-mono">{weather.relativeHumidity}%</span>
              </div>
            </div>

          </div>
        )}

        {/* 24-Hour Real Forecast Progression */}
        {weather && weather.hourly.time.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Hourly Solar Radiation & Temperature Curve (Open-Meteo)
              </h2>
              <span className="text-xs text-slate-400 font-mono">Real Hourly Forecast</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 overflow-x-auto pb-2">
              {weather.hourly.time.map((t, idx) => {
                const hourLabel = t.split('T')[1] || t;
                const temp = weather.hourly.temperature[idx];
                const uv = weather.hourly.uvIndex[idx];
                return (
                  <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-xl text-center space-y-1.5 min-w-[90px]">
                    <div className="text-[11px] font-mono text-slate-400 font-bold">{hourLabel}</div>
                    <div className="text-base font-bold text-white font-mono">{temp}°C</div>
                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      uv > 6 ? 'bg-rose-500/20 text-rose-300' : uv > 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      UV {uv}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transparent Methodology & Verification */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Verified Transparent Data Sources
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="font-bold text-white mb-1">1. Open-Meteo Weather API</div>
              <p className="text-slate-400">
                Live atmospheric models delivering temperature, relative humidity, direct normal irradiance ($W/m^2$), and UV index without artificial multipliers.
              </p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="font-bold text-white mb-1">2. NOAA Astronomical Equations</div>
              <p className="text-slate-400">
                Exact solar zenith, elevation, and azimuth angles calculated for your exact geographic coordinates and time.
              </p>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="font-bold text-white mb-1">3. OpenStreetMap OSRM Graph</div>
              <p className="text-slate-400">
                Real pedestrian sidewalk routing networks calculating real walking distances and turn-by-turn maneuvers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
