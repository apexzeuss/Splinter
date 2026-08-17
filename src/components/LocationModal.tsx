import React, { useState } from 'react';
import { 
  MapPin, Search, Navigation, Globe, Compass, CheckCircle2, 
  AlertTriangle, X, Thermometer, RefreshCw, Sun, Loader2, Sparkles
} from 'lucide-react';
import { UserCoords } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: UserCoords | null;
  onSelectLocation: (coords: UserCoords) => void;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  country_code?: string;
}

const PRESET_HOTSPOTS = [
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, defaultTemp: 23.5 },
  { city: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431, defaultTemp: 37.0 },
  { city: 'Phoenix', country: 'United States', lat: 33.4484, lng: -112.0740, defaultTemp: 41.5 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, defaultTemp: 43.0 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, defaultTemp: 31.0 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, defaultTemp: 32.5 },
  { city: 'Seville', country: 'Spain', lat: 37.3891, lng: -5.9845, defaultTemp: 38.5 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, defaultTemp: 33.0 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, defaultTemp: 29.5 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, defaultTemp: 26.0 },
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  onSelectLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [customLat, setCustomLat] = useState<string>(userCoords ? userCoords.lat.toString() : '33.4484');
  const [customLng, setCustomLng] = useState<string>(userCoords ? userCoords.lng.toString() : '-112.0740');
  const [activeTab, setActiveTab] = useState<'search' | 'gps' | 'custom'>('search');

  if (!isOpen) return null;

  // Search Open-Meteo Geocoding API (free, reliable, global, no-key)
  const handleSearchCities = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.warn("Geocoding search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch live weather for selected coordinate
  const applyCoordinates = async (lat: number, lng: number, cityName: string, source: 'GPS' | 'IP' | 'MANUAL') => {
    setStatusMessage(`Fetching live weather for ${cityName}...`);
    let temp = 30.0;

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      );
      if (weatherRes.ok) {
        const data = await weatherRes.json();
        if (data.current_weather && typeof data.current_weather.temperature === 'number') {
          temp = data.current_weather.temperature;
        }
      }
    } catch (e) {
      console.warn("Weather lookup failed, using local estimate", e);
    }

    const newCoords: UserCoords = {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      city: cityName,
      tempC: Math.round(temp * 10) / 10,
      isLive: true,
      source
    };

    onSelectLocation(newCoords);
    setStatusMessage(`Location updated to ${cityName} (${newCoords.tempC}°C)`);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Hardware GPS Request
  const handleTriggerGPS = () => {
    setIsLocatingGPS(true);
    setStatusMessage('Requesting GPS permission from browser...');

    if (!('geolocation' in navigator)) {
      setStatusMessage('HTML5 Geolocation is not supported by your browser.');
      setIsLocatingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setStatusMessage('GPS acquired. Resolving location name...');

        let resolvedName = `GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
        try {
          const geo = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          if (geo.ok) {
            const gdata = await geo.json();
            const place = gdata.city || gdata.locality || gdata.principalSubdivision;
            if (place) {
              resolvedName = `${place}${gdata.countryCode ? `, ${gdata.countryCode}` : ''}`;
            }
          }
        } catch (e) {
          console.warn("Reverse geocode fallback", e);
        }

        await applyCoordinates(lat, lng, resolvedName, 'GPS');
        setIsLocatingGPS(false);
      },
      async (err) => {
        console.warn("GPS error:", err);
        setStatusMessage(`GPS error: ${err.message}. Falling back to IP Geolocation mesh...`);

        try {
          const ipRes = await fetch('https://ipwho.is/');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData.success && typeof ipData.latitude === 'number') {
              const name = `${ipData.city || 'Local Area'}, ${ipData.country_code || ''}`;
              await applyCoordinates(ipData.latitude, ipData.longitude, name, 'IP');
              setIsLocatingGPS(false);
              return;
            }
          }
        } catch (e) {
          console.warn("IP Geolocation 1 failed", e);
        }

        // Secondary fallback: freeipapi.com
        try {
          const freeIpRes = await fetch('https://freeipapi.com/api/json');
          if (freeIpRes.ok) {
            const freeIpData = await freeIpRes.json();
            if (typeof freeIpData.latitude === 'number') {
              const name = `${freeIpData.cityName || 'Local Area'}, ${freeIpData.countryCode || ''}`;
              await applyCoordinates(freeIpData.latitude, freeIpData.longitude, name, 'IP');
              setIsLocatingGPS(false);
              return;
            }
          }
        } catch (e2) {
          console.warn("freeipapi failed", e2);
        }

        setStatusMessage('GPS permission not available. Please use Search City or select a hotspot.');
        setIsLocatingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1015] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Set Active Location & Microclimate
              </h2>
              <p className="text-xs text-zinc-400">
                Calibrates solar shadow angles and real-time ambient temperature
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Location Banner */}
        {userCoords && (
          <div className="px-5 py-3 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <span className="text-xs font-semibold text-emerald-300">
                  Current: {userCoords.city}
                </span>
                <span className="text-[11px] text-zinc-400 ml-2">
                  ({userCoords.lat}°, {userCoords.lng}°)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>{userCoords.tempC}°C</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search City</span>
          </button>

          <button
            onClick={() => setActiveTab('gps')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'gps'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Device GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'custom'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Custom Coords</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: SEARCH CITY */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Type any city (e.g., London, Austin, Lagos, Dubai, Tokyo, New York)..."
                  value={searchQuery}
                  onChange={(e) => handleSearchCities(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin absolute right-3.5 top-3.5" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1.5 bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                  <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-400 px-2">
                    Search Results
                  </span>
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const fullName = `${r.name}${r.country ? `, ${r.country}` : ''}`;
                        applyCoordinates(r.latitude, r.longitude, fullName, 'MANUAL');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-600/20 hover:border-blue-500/30 border border-transparent text-left transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-sm font-semibold text-zinc-100 group-hover:text-blue-300">
                            {r.name}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {[r.admin1, r.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-400 group-hover:text-blue-200">
                        {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Heat Hotspots Grid */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Popular Global Hotspots & Urban Hubs
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_HOTSPOTS.map((p) => (
                    <button
                      key={p.city}
                      onClick={() => applyCoordinates(p.lat, p.lng, `${p.city}, ${p.country}`, 'MANUAL')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition text-left group"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-200 group-hover:text-white">
                          {p.city}
                        </p>
                        <p className="text-[10.5px] text-zinc-400 truncate max-w-[120px]">
                          {p.country}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {p.defaultTemp}°C
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEVICE GPS */}
          {activeTab === 'gps' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                <Navigation className={`w-8 h-8 ${isLocatingGPS ? 'animate-spin text-amber-400' : ''}`} />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-white">
                  Acquire Device GPS Coordinates
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Queries browser HTML5 Geolocation with automatic IP-mesh fallback, then fetches real-time Open-Meteo weather.
                </p>
              </div>

              <button
                onClick={handleTriggerGPS}
                disabled={isLocatingGPS}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
              >
                {isLocatingGPS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Detect My Exact GPS Location</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: CUSTOM COORDINATES */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                    Latitude (-90 to +90)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                    Longitude (-180 to +180)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const lat = parseFloat(customLat);
                  const lng = parseFloat(customLng);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    applyCoordinates(lat, lng, `Custom (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`, 'MANUAL');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
              >
                Apply Custom Coordinates & Sync Weather
              </button>
            </div>
          )}

          {/* Live Status Diagnostics */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Powered by Open-Meteo & BigDataCloud</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
