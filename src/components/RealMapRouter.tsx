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
  Info
} from 'lucide-react';
import { fetchRealPedestrianRoute, RealRoutingResult, ComputedRoute, StepInstruction } from '../services/realRoutingService';
import { searchRealPlaces, GeocodedPlace } from '../services/geocodingService';
import { calculateRealSolarPosition, SolarPosition } from '../services/solarService';

interface RealMapRouterProps {
  userCoords: { lat: number; lng: number; city: string; tempC: number };
  onLocationChange: (lat: number, lng: number, city: string) => void;
  onOpenLocationModal: () => void;
}

export const RealMapRouter: React.FC<RealMapRouterProps> = ({
  userCoords,
  onLocationChange,
  onOpenLocationModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Search States
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<GeocodedPlace[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Selected Points
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number; name: string }>({
    lat: userCoords.lat,
    lng: userCoords.lng,
    name: userCoords.city,
  });

  const [destPoint, setDestPoint] = useState<{ lat: number; lng: number; name: string }>({
    lat: userCoords.lat + 0.006,
    lng: userCoords.lng + 0.007,
    name: 'Destination Area',
  });

  // Routing State
  const [routingResult, setRoutingResult] = useState<RealRoutingResult | null>(null);
  const [activeRouteType, setActiveRouteType] = useState<'shaded' | 'direct'>('shaded');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [solar, setSolar] = useState<SolarPosition>(calculateRealSolarPosition(userCoords.lat, userCoords.lng));
  const [timeSliderHours, setTimeSliderHours] = useState<number>(new Date().getHours() + new Date().getMinutes() / 60);
  const [clickMode, setClickMode] = useState<'origin' | 'dest' | null>(null);
  const [selectedStep, setSelectedStep] = useState<StepInstruction | null>(null);

  // Sync with prop coords
  useEffect(() => {
    setOriginPoint(prev => ({
      ...prev,
      lat: userCoords.lat,
      lng: userCoords.lng,
      name: userCoords.city,
    }));
    setDestPoint({
      lat: userCoords.lat + 0.006,
      lng: userCoords.lng + 0.007,
      name: `Destination near ${userCoords.city}`,
    });
    setOriginQuery(userCoords.city);
    setDestQuery(`Destination near ${userCoords.city}`);
  }, [userCoords.lat, userCoords.lng, userCoords.city]);

  // Recalculate solar on time slider change
  useEffect(() => {
    const simDate = new Date();
    const h = Math.floor(timeSliderHours);
    const m = Math.floor((timeSliderHours - h) * 60);
    simDate.setHours(h, m, 0, 0);
    const newSolar = calculateRealSolarPosition(originPoint.lat, originPoint.lng, simDate);
    setSolar(newSolar);
  }, [timeSliderHours, originPoint.lat, originPoint.lng]);

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

      // CartoDB Dark Matter tiles for ultra-high contrast and readability
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

  // Update map view when origin changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([originPoint.lat, originPoint.lng], 15);
    }
  }, [originPoint.lat, originPoint.lng]);

  // Perform Real Route Calculation
  const calculateRoute = async () => {
    setIsLoadingRoute(true);
    setSelectedStep(null);
    try {
      const simDate = new Date();
      const h = Math.floor(timeSliderHours);
      const m = Math.floor((timeSliderHours - h) * 60);
      simDate.setHours(h, m, 0, 0);

      const result = await fetchRealPedestrianRoute(originPoint, destPoint, userCoords.tempC, simDate);
      setRoutingResult(result);
      drawRoutesOnMap(result);
    } catch (err) {
      console.error('Failed to compute pedestrian route:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Run calculation on load or when origin/destination change
  useEffect(() => {
    calculateRoute();
  }, [originPoint.lat, originPoint.lng, destPoint.lat, destPoint.lng, solar.azimuthDeg, solar.elevationDeg]);

  // Draw Polylines and Markers on Leaflet Map
  const drawRoutesOnMap = (res: RealRoutingResult) => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const group = layersGroupRef.current;
    group.clearLayers();

    // Custom Origin Icon (Emerald Flag)
    const originIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-2 border-white ring-2 ring-emerald-500/30">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Custom Destination Icon (Rose Target)
    const destIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40 border-2 border-white ring-2 ring-rose-500/30">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add Markers
    L.marker([res.origin.lat, res.origin.lng], { icon: originIcon })
      .bindPopup(`<div class="font-sans font-bold text-slate-800 text-sm">Start: ${res.origin.name}</div>`)
      .addTo(group);

    L.marker([res.destination.lat, res.destination.lng], { icon: destIcon })
      .bindPopup(`<div class="font-sans font-bold text-slate-800 text-sm">End: ${res.destination.name}</div>`)
      .addTo(group);

    // 1. Draw Direct Route (Subtle Orange/Gray Dashed Line)
    if (res.directRoute.coordinates.length > 0) {
      const isDirectActive = activeRouteType === 'direct';
      L.polyline(res.directRoute.coordinates, {
        color: isDirectActive ? '#f97316' : '#94a3b8',
        weight: isDirectActive ? 6 : 4,
        opacity: isDirectActive ? 0.95 : 0.45,
        dashArray: isDirectActive ? undefined : '6, 6',
      }).bindPopup(`<b>Direct Route</b><br/>${(res.directRoute.distanceMeters / 1000).toFixed(2)} km · ~${Math.round(res.directRoute.durationSeconds / 60)} min<br/>Avg Shade: ${res.directRoute.averageShadePercent}%`)
        .addTo(group);
    }

    // 2. Draw Cool / Shaded Route (Glowing Emerald Solid Line)
    if (res.coolRoute.coordinates.length > 0) {
      const isCoolActive = activeRouteType === 'shaded';
      
      // Outer glow polyline
      if (isCoolActive) {
        L.polyline(res.coolRoute.coordinates, {
          color: '#10b981',
          weight: 10,
          opacity: 0.25,
        }).addTo(group);
      }

      // Inner crisp polyline
      L.polyline(res.coolRoute.coordinates, {
        color: isCoolActive ? '#059669' : '#6ee7b7',
        weight: isCoolActive ? 6 : 4,
        opacity: isCoolActive ? 1.0 : 0.6,
      }).bindPopup(`<b>Cool Walk (Maximum Shade)</b><br/>${(res.coolRoute.distanceMeters / 1000).toFixed(2)} km · ~${Math.round(res.coolRoute.durationSeconds / 60)} min<br/>Avg Shade: ${res.coolRoute.averageShadePercent}% · Perceived Drop: ${res.coolRoute.perceivedTempDeltaC}°C`)
        .addTo(group);
    }

    // Fit map bounds to encompass both points
    const bounds = L.latLngBounds([
      [res.origin.lat, res.origin.lng],
      [res.destination.lat, res.destination.lng],
      ...res.directRoute.coordinates,
      ...res.coolRoute.coordinates,
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // Re-draw when active route changes
  useEffect(() => {
    if (routingResult) {
      drawRoutesOnMap(routingResult);
    }
  }, [activeRouteType]);

  // Handle Search Input Debouncing
  const handleOriginSearch = async (val: string) => {
    setOriginQuery(val);
    if (val.length >= 2) {
      setIsSearchingOrigin(true);
      const results = await searchRealPlaces(val);
      setOriginSuggestions(results);
      setIsSearchingOrigin(false);
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleDestSearch = async (val: string) => {
    setDestQuery(val);
    if (val.length >= 2) {
      setIsSearchingDest(true);
      const results = await searchRealPlaces(val);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    } else {
      setDestSuggestions([]);
    }
  };

  const selectOriginPlace = (p: GeocodedPlace) => {
    setOriginPoint({ lat: p.lat, lng: p.lng, name: p.displayName });
    setOriginQuery(p.displayName);
    setOriginSuggestions([]);
    onLocationChange(p.lat, p.lng, p.name);
  };

  const selectDestPlace = (p: GeocodedPlace) => {
    setDestPoint({ lat: p.lat, lng: p.lng, name: p.displayName });
    setDestQuery(p.displayName);
    setDestSuggestions([]);
  };

  const activeRouteData: ComputedRoute | null = routingResult 
    ? (activeRouteType === 'shaded' ? routingResult.coolRoute : routingResult.directRoute)
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* LEFT CONTROL & ROUTE DETAILS PANEL */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex-shrink-0 flex flex-col h-full bg-slate-900/90 border-r border-slate-800 z-10 backdrop-blur-md overflow-y-auto">
        
        {/* Header & Location Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Live Pedestrian Heat Router</span>
            </div>
            <button
              onClick={onOpenLocationModal}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Change City
            </button>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            CoolWalk Real Navigation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real OpenStreetMap walking paths optimized against direct solar radiation and urban heat exposure.
          </p>
        </div>

        {/* Origin & Destination Search Inputs */}
        <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3 bg-slate-950/40">
          
          {/* ORIGIN INPUT */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
                Start (Origin)
              </span>
              <button
                onClick={() => setClickMode('origin')}
                className={`text-[11px] px-2 py-0.5 rounded transition ${clickMode === 'origin' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {clickMode === 'origin' ? 'Click Map...' : 'Pin on Map'}
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                value={originQuery}
                onChange={(e) => handleOriginSearch(e.target.value)}
                placeholder="Search starting street or landmark..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Origin Dropdown Suggestions */}
            {originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-700/50">
                {originSuggestions.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => selectOriginPlace(place)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-950/40 hover:text-emerald-300 text-slate-200 transition"
                  >
                    <div className="font-semibold text-white">{place.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{place.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DESTINATION INPUT */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400">
                <MapPin className="w-3.5 h-3.5" />
                Destination (End)
              </span>
              <button
                onClick={() => setClickMode('dest')}
                className={`text-[11px] px-2 py-0.5 rounded transition ${clickMode === 'dest' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {clickMode === 'dest' ? 'Click Map...' : 'Pin on Map'}
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                value={destQuery}
                onChange={(e) => handleDestSearch(e.target.value)}
                placeholder="Search destination address or city..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 pr-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Destination Dropdown Suggestions */}
            {destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-700/50">
                {destSuggestions.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => selectDestPlace(place)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-rose-950/40 hover:text-rose-300 text-slate-200 transition"
                  >
                    <div className="font-semibold text-white">{place.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{place.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time of Day Slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Sun className="w-3.5 h-3.5" />
                Time of Day (Sun Angle):
              </span>
              <span className="font-mono font-bold text-amber-300">
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
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>06:00 (Sunrise)</span>
              <span>13:00 (Solar Peak)</span>
              <span>20:00 (Dusk)</span>
            </div>
          </div>
        </div>

        {/* ROUTE COMPARISON CARDS */}
        {routingResult && (
          <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Walking Route Option
            </div>

            {/* COOL SHADED ROUTE BUTTON */}
            <button
              onClick={() => setActiveRouteType('shaded')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                activeRouteType === 'shaded'
                  ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      Cool Walk (Maximum Shade)
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Recommended
                      </span>
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">
                      {routingResult.coolRoute.averageShadePercent}% Tree & Building Shade
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-base">
                    {Math.round(routingResult.coolRoute.durationSeconds / 60)} min
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {(routingResult.coolRoute.distanceMeters / 1000).toFixed(2)} km
                  </div>
                </div>
              </div>

              {/* Thermal Benefit Badges */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-900/40 text-[11px]">
                <div className="flex items-center gap-1 text-emerald-300">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Feels <b>{routingResult.coolRoute.perceivedTempDeltaC}°C cooler</b></span>
                </div>
                <div className="flex items-center gap-1 text-amber-300">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span><b>-{routingResult.coolRoute.solarRadiationReductionPercent}%</b> UV / Sun exposure</span>
                </div>
              </div>
            </button>

            {/* DIRECT WALK ROUTE BUTTON */}
            <button
              onClick={() => setActiveRouteType('direct')}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                activeRouteType === 'direct'
                  ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/30'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Footprints className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-white text-sm">Direct Walk (Shortest)</div>
                    <div className="text-xs text-amber-400/90 font-medium">
                      {routingResult.directRoute.averageShadePercent}% Shade (High Sun Exposure)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-base">
                    {Math.round(routingResult.directRoute.durationSeconds / 60)} min
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {(routingResult.directRoute.distanceMeters / 1000).toFixed(2)} km
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* STEP-BY-STEP TURN INSTRUCTIONS */}
        {activeRouteData && (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <span>Turn-by-Turn Directions ({activeRouteData.steps.length} Steps)</span>
              <span className="font-mono text-[11px] text-slate-500 font-normal">Click step to locate</span>
            </div>

            <div className="space-y-2">
              {activeRouteData.steps.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setSelectedStep(step);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo(step.coordinates, 17, { duration: 0.8 });
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                    selectedStep?.id === step.id
                      ? 'bg-blue-950/60 border-blue-500 text-white'
                      : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-300 font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-100">{step.instruction}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        {step.distanceMeters > 0 && <span>{step.distanceMeters} meters</span>}
                        <span className={`px-1.5 py-0.5 rounded font-mono ${
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
          </div>
        )}
      </div>

      {/* RIGHT LEAFLET MAP VIEW */}
      <div className="flex-1 relative h-[50vh] lg:h-full bg-slate-950">
        
        {/* The Leaflet Canvas Map */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Astronomical Solar Widget Overlay */}
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sun className="w-4 h-4 animate-spin-slow" />
              <span>Solar Geometry (NOAA)</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
              {userCoords.tempC}°C Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Solar Elevation:</span>
              <span className="text-white font-bold">{solar.elevationDeg}°</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Solar Azimuth:</span>
              <span className="text-white font-bold">{solar.azimuthDeg}°</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Sun Intensity: <b>{solar.intensityPercent}%</b></span>
            <span>{solar.isDaylight ? '☀️ Daylight' : '🌙 Night'}</span>
          </div>
        </div>

        {/* Map Legend & Click Helper Overlay */}
        <div className="absolute bottom-6 left-6 z-20 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 pointer-events-auto">
          <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-1">
            Map Legend
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-4 h-1.5 bg-emerald-500 rounded-full" />
            <span>Cool Shaded Route (Canopy + Shadows)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="w-4 h-1.5 bg-amber-500 rounded-full" />
            <span>Direct Walking Route</span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Powered by real OpenStreetMap OSRM pedestrian network
          </div>
        </div>

      </div>
    </div>
  );
};
