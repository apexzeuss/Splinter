import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Sun, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Footprints, 
  Search, 
  Crosshair, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  Thermometer,
  RotateCcw,
  Compass,
  Wind,
  Droplets,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  Globe,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { fetchRealPedestrianRoute, RealRoutingResult, ComputedRoute, StepInstruction } from '../services/realRoutingService';
import { searchRealPlaces, GeocodedPlace } from '../services/geocodingService';
import { calculateRealSolarPosition, SolarPosition } from '../services/solarService';
import { fetchRealLiveWeather, LiveWeatherReport } from '../services/weatherService';

interface UnifiedDashboardProps {
  userCoords: { lat: number; lng: number; city: string; tempC: number; isLive?: boolean };
  onLocationChange: (lat: number, lng: number, city: string) => void;
  onOpenLocationModal: () => void;
  onRequestLocation: () => void;
  isLocating: boolean;
}

const PRESET_CITIES = [
  { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, tag: 'High Desert Heat' },
  { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038, tag: 'Urban Canyon' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, tag: 'Canopy Corridors' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, tag: 'Dense High-Rise' },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, tag: 'Extreme Solar' },
];

export const UnifiedCoolWalkDashboard: React.FC<UnifiedDashboardProps> = ({
  userCoords,
  onLocationChange,
  onOpenLocationModal,
  onRequestLocation,
  isLocating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Search States
  const [originQuery, setOriginQuery] = useState(userCoords.city);
  const [destQuery, setDestQuery] = useState(`Destination near ${userCoords.city}`);
  const [originSuggestions, setOriginSuggestions] = useState<GeocodedPlace[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Selected Origin and Destination Points
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number; name: string }>({
    lat: userCoords.lat,
    lng: userCoords.lng,
    name: userCoords.city,
  });

  const [destPoint, setDestPoint] = useState<{ lat: number; lng: number; name: string }>({
    lat: userCoords.lat + 0.0055,
    lng: userCoords.lng + 0.0065,
    name: `Destination near ${userCoords.city}`,
  });

  // Routing State
  const [routingResult, setRoutingResult] = useState<RealRoutingResult | null>(null);
  const [activeRouteType, setActiveRouteType] = useState<'shaded' | 'direct'>('shaded');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [clickMode, setClickMode] = useState<'origin' | 'dest' | null>(null);
  const [selectedStep, setSelectedStep] = useState<StepInstruction | null>(null);

  // Solar & Time Simulation
  const [timeSliderHours, setTimeSliderHours] = useState<number>(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });
  const [solar, setSolar] = useState<SolarPosition>(() => calculateRealSolarPosition(userCoords.lat, userCoords.lng));

  // Live Weather Report
  const [weather, setWeather] = useState<LiveWeatherReport | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Sync with incoming prop changes (e.g. from GPS or modal)
  useEffect(() => {
    setOriginPoint({
      lat: userCoords.lat,
      lng: userCoords.lng,
      name: userCoords.city,
    });
    setDestPoint({
      lat: userCoords.lat + 0.0055,
      lng: userCoords.lng + 0.0065,
      name: `Destination near ${userCoords.city}`,
    });
    setOriginQuery(userCoords.city);
    setDestQuery(`Destination near ${userCoords.city}`);
  }, [userCoords.lat, userCoords.lng, userCoords.city]);

  // Recalculate solar position on coordinate or time changes
  useEffect(() => {
    const simDate = new Date();
    const h = Math.floor(timeSliderHours);
    const m = Math.floor((timeSliderHours - h) * 60);
    simDate.setHours(h, m, 0, 0);
    const newSolar = calculateRealSolarPosition(originPoint.lat, originPoint.lng, simDate);
    setSolar(newSolar);
  }, [timeSliderHours, originPoint.lat, originPoint.lng]);

  // Load Real Open-Meteo Weather
  useEffect(() => {
    let isCancelled = false;
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const data = await fetchRealLiveWeather(originPoint.lat, originPoint.lng, originPoint.name);
        if (!isCancelled) {
          setWeather(data);
        }
      } catch (err) {
        console.error("Live weather fetch error:", err);
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    };
    fetchWeather();
    return () => { isCancelled = true; };
  }, [originPoint.lat, originPoint.lng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [originPoint.lat, originPoint.lng],
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager tiles for crisp contrast and street names
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      // Handle map clicks to set origin/destination
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (clickMode === 'origin') {
          const name = `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setOriginPoint({ lat, lng, name });
          setOriginQuery(name);
          setClickMode(null);
        } else if (clickMode === 'dest') {
          const name = `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setDestPoint({ lat, lng, name });
          setDestQuery(name);
          setClickMode(null);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center map on origin changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([originPoint.lat, originPoint.lng], 15);
    }
  }, [originPoint.lat, originPoint.lng]);

  // Compute Real OSRM Pedestrian Route
  const executeRouting = async () => {
    setIsLoadingRoute(true);
    setSelectedStep(null);
    try {
      const simDate = new Date();
      const h = Math.floor(timeSliderHours);
      const m = Math.floor((timeSliderHours - h) * 60);
      simDate.setHours(h, m, 0, 0);

      const result = await fetchRealPedestrianRoute(originPoint, destPoint, weather?.temperatureC || userCoords.tempC, simDate);
      setRoutingResult(result);
      drawRoutes(result);
    } catch (e) {
      console.error("Routing calculation failed:", e);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    executeRouting();
  }, [originPoint.lat, originPoint.lng, destPoint.lat, destPoint.lng, solar.azimuthDeg, solar.elevationDeg]);

  // Draw Polylines & Markers on Leaflet
  const drawRoutes = (res: RealRoutingResult) => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // Start Marker (Emerald)
    const originIcon = L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/50 border-2 border-white ring-4 ring-emerald-500/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Destination Marker (Rose)
    const destIcon = L.divIcon({
      className: 'custom-dest-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 text-white shadow-xl shadow-rose-500/50 border-2 border-white ring-4 ring-rose-500/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([res.origin.lat, res.origin.lng], { icon: originIcon })
      .bindPopup(`<div class="font-sans font-bold text-slate-800 text-sm">Start: ${res.origin.name}</div>`)
      .addTo(group);

    L.marker([res.destination.lat, res.destination.lng], { icon: destIcon })
      .bindPopup(`<div class="font-sans font-bold text-slate-800 text-sm">End: ${res.destination.name}</div>`)
      .addTo(group);

    // Direct Walk Route (Orange/Gray Dashed)
    if (res.directRoute.coordinates.length > 0) {
      const isDirectActive = activeRouteType === 'direct';
      L.polyline(res.directRoute.coordinates, {
        color: isDirectActive ? '#f97316' : '#94a3b8',
        weight: isDirectActive ? 6 : 3.5,
        opacity: isDirectActive ? 0.95 : 0.45,
        dashArray: isDirectActive ? undefined : '5, 5',
      }).bindPopup(`<b>Direct Route</b><br/>${(res.directRoute.distanceMeters / 1000).toFixed(2)} km · ~${Math.round(res.directRoute.durationSeconds / 60)} min<br/>Avg Shade: ${res.directRoute.averageShadePercent}%`)
        .addTo(group);
    }

    // Cool Shaded Route (Glowing Emerald)
    if (res.coolRoute.coordinates.length > 0) {
      const isCoolActive = activeRouteType === 'shaded';
      if (isCoolActive) {
        L.polyline(res.coolRoute.coordinates, {
          color: '#10b981',
          weight: 11,
          opacity: 0.25,
        }).addTo(group);
      }

      L.polyline(res.coolRoute.coordinates, {
        color: isCoolActive ? '#059669' : '#6ee7b7',
        weight: isCoolActive ? 6 : 4,
        opacity: isCoolActive ? 1.0 : 0.6,
      }).bindPopup(`<b>Cool Walk (Maximum Shade)</b><br/>${(res.coolRoute.distanceMeters / 1000).toFixed(2)} km · ~${Math.round(res.coolRoute.durationSeconds / 60)} min<br/>Avg Shade: ${res.coolRoute.averageShadePercent}% · Perceived Drop: ${res.coolRoute.perceivedTempDeltaC}°C`)
        .addTo(group);
    }

    const bounds = L.latLngBounds([
      [res.origin.lat, res.origin.lng],
      [res.destination.lat, res.destination.lng],
      ...res.directRoute.coordinates,
      ...res.coolRoute.coordinates,
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  useEffect(() => {
    if (routingResult) drawRoutes(routingResult);
  }, [activeRouteType]);

  // Autocomplete Geocoding Search
  const handleOriginSearch = async (val: string) => {
    setOriginQuery(val);
    if (val.length >= 2) {
      setIsSearchingOrigin(true);
      const res = await searchRealPlaces(val);
      setOriginSuggestions(res);
      setIsSearchingOrigin(false);
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleDestSearch = async (val: string) => {
    setDestQuery(val);
    if (val.length >= 2) {
      setIsSearchingDest(true);
      const res = await searchRealPlaces(val);
      setDestSuggestions(res);
      setIsSearchingDest(false);
    } else {
      setDestSuggestions([]);
    }
  };

  const selectOrigin = (p: GeocodedPlace) => {
    setOriginPoint({ lat: p.lat, lng: p.lng, name: p.displayName });
    setOriginQuery(p.displayName);
    setOriginSuggestions([]);
    onLocationChange(p.lat, p.lng, p.name);
  };

  const selectDest = (p: GeocodedPlace) => {
    setDestPoint({ lat: p.lat, lng: p.lng, name: p.displayName });
    setDestQuery(p.displayName);
    setDestSuggestions([]);
  };

  const activeRouteData: ComputedRoute | null = routingResult
    ? (activeRouteType === 'shaded' ? routingResult.coolRoute : routingResult.directRoute)
    : null;

  return (
    <div className="h-full w-full bg-[#070709] text-zinc-100 overflow-y-auto select-none">
      <div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
        
        {/* =========================================================================
            1. TOP COMMAND BAR: Quick Cities, GPS Locator, & Microclimate Summary
           ========================================================================= */}
        <div className="bg-[#101014] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Active City & Live Weather Pill */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  REAL-TIME PEDESTRIAN SHADE OBSERVATORY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  0% Mock Data
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  {originPoint.name}
                </h1>
                
                {weather && (
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-xl">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span className="text-base font-bold text-white font-mono">{weather.temperatureC}°C</span>
                    <span className="text-xs text-zinc-400 font-mono">({weather.weatherDescription})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Preset Cities */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onRequestLocation}
                disabled={isLocating}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS'}</span>
              </button>

              <button
                onClick={onOpenLocationModal}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Search World</span>
              </button>

              {/* Preset City Chips */}
              <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                {PRESET_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setOriginPoint({ lat: c.lat, lng: c.lng, name: c.name });
                      setOriginQuery(c.name);
                      setDestPoint({ lat: c.lat + 0.0055, lng: c.lng + 0.0065, name: `Destination near ${c.name}` });
                      setDestQuery(`Destination near ${c.name}`);
                      onLocationChange(c.lat, c.lng, c.name);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white border border-zinc-800 transition"
                  >
                    {c.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. MAIN WORKSPACE: Interactive Map & Live Navigation Panel
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT: Search Controls, Sun Slider, Route Comparison, & Steps (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search and Route Input Deck */}
            <div className="bg-[#101014] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Route Planner & Solar Dial
                </span>
                <span className="font-mono text-[10px] text-zinc-500">OSRM Walk Graph</span>
              </div>

              {/* Origin Search */}
              <div className="relative">
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" /> Start Point (Origin)
                  </span>
                  <button
                    onClick={() => setClickMode('origin')}
                    className={`text-[10px] px-2 py-0.5 rounded transition ${clickMode === 'origin' ? 'bg-emerald-500 text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {clickMode === 'origin' ? 'Click on Map...' : 'Pin on Map'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={originQuery}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    placeholder="Search origin landmark..."
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-9"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                </div>
                {originSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-800">
                    {originSuggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectOrigin(p)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-950/40 text-zinc-200"
                      >
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{p.displayName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Search */}
              <div className="relative">
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-rose-400">
                    <MapPin className="w-3.5 h-3.5" /> Destination Point (End)
                  </span>
                  <button
                    onClick={() => setClickMode('dest')}
                    className={`text-[10px] px-2 py-0.5 rounded transition ${clickMode === 'dest' ? 'bg-rose-500 text-white font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {clickMode === 'dest' ? 'Click on Map...' : 'Pin on Map'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destQuery}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    placeholder="Search destination address..."
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 pr-9"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                </div>
                {destSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-800">
                    {destSuggestions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectDest(p)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-rose-950/40 text-zinc-200"
                      >
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{p.displayName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time of Day Slider & Solar Azimuth Indicator */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Sun className="w-3.5 h-3.5" />
                    Simulated Sun Time:
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {String(Math.floor(timeSliderHours)).padStart(2, '0')}:{String(Math.floor((timeSliderHours % 1) * 60)).padStart(2, '0')}
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="0.25"
                  value={timeSliderHours}
                  onChange={(e) => setTimeSliderHours(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>06:00 (Sunrise)</span>
                  <span>13:00 (Solar Peak: {solar.elevationDeg}°)</span>
                  <span>20:00 (Dusk)</span>
                </div>
              </div>
            </div>

            {/* Route Options Comparison Cards */}
            {routingResult && (
              <div className="bg-[#101014] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Choose Navigation Mode</span>
                  {isLoadingRoute && <span className="text-emerald-400 animate-pulse text-[11px]">Computing...</span>}
                </div>

                {/* 1. COOL SHADED ROUTE (HERO OPTION) */}
                <button
                  onClick={() => setActiveRouteType('shaded')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeRouteType === 'shaded'
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          Cool Walk (Maximum Shade)
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                            RECOMMENDED
                          </span>
                        </div>
                        <div className="text-xs text-emerald-400 font-medium">
                          {routingResult.coolRoute.averageShadePercent}% Tree & Building Shade
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-white text-base">
                        {Math.round(routingResult.coolRoute.durationSeconds / 60)} min
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {(routingResult.coolRoute.distanceMeters / 1000).toFixed(2)} km
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-900/40 text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-emerald-300">
                      <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Feels <b>{routingResult.coolRoute.perceivedTempDeltaC}°C cooler</b></span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-300">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span><b>-{routingResult.coolRoute.solarRadiationReductionPercent}%</b> UV/Sun radiation</span>
                    </div>
                  </div>
                </button>

                {/* 2. DIRECT SHORT ROUTE */}
                <button
                  onClick={() => setActiveRouteType('direct')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    activeRouteType === 'direct'
                      ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Footprints className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs">Direct Walk (Shortest)</div>
                        <div className="text-[11px] text-amber-400/90 font-medium">
                          {routingResult.directRoute.averageShadePercent}% Shade (Exposed Asphalt)
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-white text-sm">
                        {Math.round(routingResult.directRoute.durationSeconds / 60)} min
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {(routingResult.directRoute.distanceMeters / 1000).toFixed(2)} km
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Turn-by-Turn Maneuver List */}
            {activeRouteData && (
              <div className="bg-[#101014] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-2.5 max-h-72 overflow-y-auto shadow-xl">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-2">
                  <span>Turn-by-Turn Steps ({activeRouteData.steps.length})</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Click to zoom map</span>
                </div>
                {activeRouteData.steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setSelectedStep(step);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(step.coordinates, 17, { duration: 0.8 });
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                      selectedStep?.id === step.id
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-300 font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-zinc-100">{step.instruction}</div>
                        <div className="flex items-center gap-2.5 mt-1 text-[10.5px] text-zinc-400 font-mono">
                          {step.distanceMeters > 0 && <span>{step.distanceMeters}m</span>}
                          <span className={`px-1.5 py-0.2 rounded ${
                            step.shadePercent >= 65 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {step.shadePercent}% Shade
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Live Interactive Map (7 cols) */}
          <div className="lg:col-span-7 h-[540px] sm:h-[620px] lg:h-[720px] rounded-3xl overflow-hidden border border-zinc-800 relative shadow-2xl bg-zinc-950">
            
            {/* The Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Live Astronomical Solar Dial Overlay */}
            <div className="absolute top-4 right-4 z-20 bg-[#101014]/95 border border-zinc-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs max-w-[240px] pointer-events-auto">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Sun className="w-4 h-4 animate-spin-slow" />
                  <span>NOAA Sun Geometry</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                  LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] mt-2">
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Elevation:</span>
                  <span className="text-white font-bold">{solar.elevationDeg}°</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Azimuth:</span>
                  <span className="text-white font-bold">{solar.azimuthDeg}°</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                <span>Solar Intensity: <b>{solar.intensityPercent}%</b></span>
                <span>{solar.isDaylight ? '☀️ Sun Up' : '🌙 Night'}</span>
              </div>
            </div>

            {/* Floating Map Legend Overlay */}
            <div className="absolute bottom-5 left-5 z-20 bg-[#101014]/95 border border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1 pointer-events-auto">
              <div className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">
                Route Polyline Key
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                <span className="w-3.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>Cool Shaded Route (Canopy + Shadows)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                <span className="w-3.5 h-1.5 bg-amber-500 rounded-full" />
                <span>Direct Walking Route (Exposed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. LIVE MICROCLIMATE STATION (Real Open-Meteo & NOAA Observational Grid)
           ========================================================================= */}
        <div className="bg-[#101014] border border-zinc-800/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Activity className="w-4 h-4" /> Live Observational Atmospheric Telemetry
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                Real Microclimate & Radiation Profile — {originPoint.name}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Fetched via Open-Meteo & NOAA Astronomical Models
            </span>
          </div>

          {/* 4 Telemetry Gauges */}
          {weather && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Air Temperature */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    Ambient Temperature
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">LIVE</span>
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {weather.temperatureC}°C
                </div>
                <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span>Apparent (Feels Like):</span>
                  <span className="font-bold text-white font-mono">{weather.apparentTemperatureC}°C</span>
                </div>
              </div>

              {/* UV Radiation */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
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
                <div className="text-3xl font-black text-amber-300 font-mono">
                  {weather.uvIndex} <span className="text-sm font-normal text-zinc-500">/ 12</span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span>Solar Irradiance:</span>
                  <span className="font-bold text-white font-mono">{weather.directNormalIrradianceWm2} W/m²</span>
                </div>
              </div>

              {/* Sun Geometry Dial */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Compass className="w-4 h-4 text-blue-400" />
                    NOAA Sun Trajectory
                  </span>
                  <span className="font-mono text-blue-400 text-[11px]">Astronomical</span>
                </div>
                <div className="text-2xl font-black text-blue-300 font-mono">
                  {solar.elevationDeg}° <span className="text-xs text-zinc-500">Elev</span> · {solar.azimuthDeg}° <span className="text-xs text-zinc-500">Az</span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span>Daylight State:</span>
                  <span className="font-bold text-white">{solar.isDaylight ? '☀️ Daylight' : '🌙 Night'}</span>
                </div>
              </div>

              {/* Wind & Humidity */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    Atmospheric Flow
                  </span>
                  <span className="font-mono text-cyan-400 text-[11px]">{weather.weatherDescription}</span>
                </div>
                <div className="text-3xl font-black text-cyan-300 font-mono">
                  {weather.windSpeedKmh} <span className="text-sm font-normal text-zinc-500">km/h</span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span>Relative Humidity:</span>
                  <span className="font-bold text-white font-mono">{weather.relativeHumidity}%</span>
                </div>
              </div>

            </div>
          )}

          {/* 24-Hour Real Open-Meteo Hourly Solar Curve */}
          {weather && weather.hourly.time.length > 0 && (
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  24-Hour Solar Radiation & Temperature Curve (Open-Meteo)
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">Hourly Progression</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 overflow-x-auto pb-1">
                {weather.hourly.time.map((t, idx) => {
                  const hourLabel = t.split('T')[1] || t;
                  const temp = weather.hourly.temperature[idx];
                  const uv = weather.hourly.uvIndex[idx];
                  return (
                    <div key={idx} className="bg-zinc-800/70 border border-zinc-700/60 p-2.5 rounded-xl text-center space-y-1 min-w-[85px]">
                      <div className="text-[10.5px] font-mono text-zinc-400 font-bold">{hourLabel}</div>
                      <div className="text-base font-bold text-white font-mono">{temp}°C</div>
                      <div className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
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
        </div>

        {/* =========================================================================
            4. SCIENTIFIC GROUNDING & METHODOLOGY (Integrated on the single page)
           ========================================================================= */}
        <div className="bg-[#101014] border border-zinc-800/80 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Activity className="w-4 h-4" /> The Science of Urban Heat & Mean Radiant Temperature (T_mrt)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Mean Radiant Temperature (MRT)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Standard air temperature accounts for only 20% of human heat stress. Direct solar radiation and asphalt infrared reflection elevate perceived thermal load by up to 12°C.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Building Canyon Geometry</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We calculate street shadow length via $L = H / \tan(\alpha)$ and street-sun angle divergence $\theta$, determining exactly which sidewalk side remains sheltered.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Open Data Pipeline</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Powered transparently by OpenStreetMap OSRM routing network, Open-Meteo weather APIs, and NOAA solar position equations.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
