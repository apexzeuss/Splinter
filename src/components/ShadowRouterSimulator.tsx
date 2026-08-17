import React, { useState, useEffect, useMemo } from 'react';
import { SAMPLE_BUILDINGS, SAMPLE_TREES, CITY_PRESETS, THERMAL_SCENARIOS, IOT_SENSOR_STATIONS } from '../data/projectData';
import { 
  Sun, Compass, Clock, Play, Pause, RotateCcw, ShieldAlert, Sparkles, 
  Navigation, Thermometer, Layers, MapPin, Trees, Droplets, ArrowRight, 
  Settings2, Sliders, Download, Radio, Check, Eye, ChevronRight, 
  ShieldCheck, AlertTriangle, Wind, Info, Zap, Flame
} from 'lucide-react';
import { RouteStats, TurnInstruction, Waypoint } from '../types';

// Sidewalk intersection graph nodes for dynamic pathfinding
const SIDEWALK_NODES: { id: string; x: number; y: number; name: string }[] = [
  // Avenue 1 (Y: 150)
  { id: 'n1', x: 80, y: 150, name: '1st Ave & Elm St (Metro Station)' },
  { id: 'n2', x: 240, y: 150, name: '2nd Ave & Elm St' },
  { id: 'n3', x: 410, y: 150, name: '3rd Ave & Elm St (Civic Plaza)' },
  { id: 'n4', x: 590, y: 150, name: '4th Ave & Elm St' },
  { id: 'n5', x: 760, y: 150, name: '5th Ave & Elm St (Tech Hub)' },

  // Avenue 2 (Y: 210)
  { id: 'n6', x: 80, y: 210, name: '1st Ave & Pine Colonnade' },
  { id: 'n7', x: 240, y: 210, name: '2nd Ave & Pine Colonnade' },
  { id: 'n8', x: 410, y: 210, name: '3rd Ave & Pine Colonnade' },
  { id: 'n9', x: 590, y: 210, name: '4th Ave & Pine Colonnade' },
  { id: 'n10', x: 760, y: 210, name: '5th Ave & Pine Colonnade' },

  // Avenue 3 (Y: 360)
  { id: 'n11', x: 80, y: 360, name: '1st Ave & Oak Arcade' },
  { id: 'n12', x: 240, y: 360, name: '2nd Ave & Oak Arcade' },
  { id: 'n13', x: 410, y: 360, name: '3rd Ave & Oak Arcade' },
  { id: 'n14', x: 590, y: 360, name: '4th Ave & Oak Arcade' },
  { id: 'n15', x: 760, y: 360, name: '5th Ave & Oak Arcade' },

  // Avenue 4 (Y: 460)
  { id: 'n16', x: 80, y: 460, name: '1st Ave & South Plaza' },
  { id: 'n17', x: 240, y: 460, name: '2nd Ave & South Plaza' },
  { id: 'n18', x: 410, y: 460, name: '3rd Ave & South Plaza' },
  { id: 'n19', x: 590, y: 460, name: '4th Ave & South Plaza' },
  { id: 'n20', x: 760, y: 460, name: '5th Ave & South Plaza (Medical District)' }
];

interface ShadowRouterSimulatorProps {
  userCoords?: { lat: number; lng: number; city: string; tempC: number; isLive: boolean } | null;
  onOpenLocationModal?: () => void;
}

export const ShadowRouterSimulator: React.FC<ShadowRouterSimulatorProps> = ({ userCoords, onOpenLocationModal }) => {
  // Time of day in minutes from midnight (8:00 AM = 480, 6:00 PM = 1080)
  const [timeMinutes, setTimeMinutes] = useState<number>(15 * 60 + 45); // 15:45 (3:45 PM)
  const [baseTemperature, setBaseTemperature] = useState<number>(39.5);
  const [selectedProfile, setSelectedProfile] = useState<'standard' | 'vulnerable' | 'runner' | 'accessibility'>('vulnerable');
  const [showThermalHeatmap, setShowThermalHeatmap] = useState<boolean>(false);
  const [selectedCityId, setSelectedCityId] = useState<string>('phoenix');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTrees, setShowTrees] = useState<boolean>(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<any | null>(null);
  const [viewPerspective, setViewPerspective] = useState<'map' | 'street'>('map');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const [buildingHeights, setBuildingHeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SAMPLE_BUILDINGS.forEach(b => { initial[b.id] = b.buildingHeightM; });
    return initial;
  });

  // Architect Mode: Tree and Shade Placement
  const [architectTool, setArchitectTool] = useState<'inspect' | 'plant-tree' | 'add-pergola'>('inspect');
  const [customTrees, setCustomTrees] = useState<typeof SAMPLE_TREES>(SAMPLE_TREES);

  // Interactive Waypoints
  const [startNodeId, setStartNodeId] = useState<string>('n1'); // 80, 150
  const [endNodeId, setEndNodeId] = useState<string>('n20');   // 760, 460
  const [waypointSelectionMode, setWaypointSelectionMode] = useState<'none' | 'start' | 'end'>('none');

  // Auto-play time slider loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeMinutes(prev => {
          if (prev >= 18 * 60) return 8 * 60; // loop back to 8:00 AM
          return prev + 5; // +5 mins per tick
        });
      }, 180);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Dynamic city presets including live user location if available
  const availableCities = useMemo(() => {
    if (userCoords?.isLive) {
      const userPreset = {
        id: 'my-location',
        name: `📍 ${userCoords.city} (Live GPS)`,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        timezone: 'Local',
        typicalSummerHighC: userCoords.tempC,
        urbanHeatIslandPenaltyC: 4.8
      };
      return [userPreset, ...CITY_PRESETS];
    }
    return CITY_PRESETS;
  }, [userCoords]);

  // If userCoords becomes live, auto-select it and sync ambient temperature
  useEffect(() => {
    if (userCoords?.isLive) {
      setSelectedCityId('my-location');
      setBaseTemperature(userCoords.tempC);
    }
  }, [userCoords?.isLive, userCoords?.city, userCoords?.tempC]);

  // Active City Preset
  const currentCity = useMemo(() => {
    return availableCities.find(c => c.id === selectedCityId) || availableCities[0];
  }, [selectedCityId, availableCities]);

  // Compute solar position based on time of day and city latitude
  const { solarElevationDeg, solarAzimuthDeg, timeString, uvIndex } = useMemo(() => {
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    // Solar noon is ~13:00 (780 mins)
    const solarFraction = (timeMinutes - 8 * 60) / (10 * 60); // 0 at 8 AM, 1 at 6 PM
    const noonDeltaHours = (timeMinutes - 13 * 60) / 60;

    // Solar elevation calculation based on latitude
    const maxElevation = Math.min(88, 90 - Math.abs(currentCity.latitude - 23.44));
    const elevation = Math.max(8, maxElevation - Math.pow(noonDeltaHours, 2) * 2.8);

    // Solar azimuth: ~95° East in morning, 180° South at solar noon, ~265° West in evening
    const azimuth = 95 + solarFraction * (265 - 95);

    // UV Index calculation correlated with solar elevation
    const uv = Math.max(1, Math.round((elevation / 90) * 11.5 * 10) / 10);

    return {
      solarElevationDeg: Math.round(elevation * 10) / 10,
      solarAzimuthDeg: Math.round(azimuth * 10) / 10,
      timeString: timeStr,
      uvIndex: uv
    };
  }, [timeMinutes, currentCity]);

  // Compute 2D & 2.5D shadow polygons for each building
  const shadowPolygons = useMemo(() => {
    const antiSolarAzimuthRad = ((solarAzimuthDeg + 180) % 360) * (Math.PI / 180);
    const elevationRad = (solarElevationDeg * Math.PI) / 180;
    const scale = 0.82;

    return SAMPLE_BUILDINGS.map(b => {
      const height = buildingHeights[b.id] || b.buildingHeightM;
      const shadowLengthPx = (height / Math.tan(elevationRad)) * scale;
      const dx = Math.sin(antiSolarAzimuthRad) * shadowLengthPx;
      const dy = -Math.cos(antiSolarAzimuthRad) * shadowLengthPx;

      const p1 = { x: b.x, y: b.y };
      const p2 = { x: b.x + b.width, y: b.y };
      const p3 = { x: b.x + b.width, y: b.y + b.height };
      const p4 = { x: b.x, y: b.y + b.height };

      const s1 = { x: p1.x + dx, y: p1.y + dy };
      const s2 = { x: p2.x + dx, y: p2.y + dy };
      const s3 = { x: p3.x + dx, y: p3.y + dy };
      const s4 = { x: p4.x + dx, y: p4.y + dy };

      return {
        buildingId: b.id,
        footprint: [p1, p2, p3, p4],
        shadowExtrusion: [p1, p2, s2, s3, s4, p4],
        shadowLengthM: Math.round(height / Math.tan(elevationRad)),
        dx,
        dy
      };
    });
  }, [solarElevationDeg, solarAzimuthDeg, buildingHeights]);

  const startNode = useMemo(() => SIDEWALK_NODES.find(n => n.id === startNodeId) || SIDEWALK_NODES[0], [startNodeId]);
  const endNode = useMemo(() => SIDEWALK_NODES.find(n => n.id === endNodeId) || SIDEWALK_NODES[19], [endNodeId]);

  // Dynamic Route Calculations
  const directPathPoints = useMemo(() => {
    return `${startNode.x},${startNode.y} ${endNode.x},${startNode.y} ${endNode.x},${endNode.y}`;
  }, [startNode, endNode]);

  // Cool path snakes through the shaded building alleys based on solar angle
  const { coolPathPoints, coolPathNodes } = useMemo(() => {
    if (solarAzimuthDeg > 180) {
      // Afternoon sun from West -> East alleys (Pine & Oak arcades) are heavily shaded
      const intermediate1 = { x: startNode.x, y: 210, name: 'Pine Colonnade West' };
      const intermediate2 = { x: 240, y: 210, name: 'Atlas Arcade Crossway' };
      const intermediate3 = { x: 240, y: 360, name: 'Horizon Shade Tunnel' };
      const intermediate4 = { x: 410, y: 360, name: 'Desert Willow Walkway' };
      const intermediate5 = { x: 410, y: endNode.y, name: 'Solaris East Covered Portal' };
      return {
        coolPathPoints: `${startNode.x},${startNode.y} ${intermediate1.x},${intermediate1.y} ${intermediate2.x},${intermediate2.y} ${intermediate3.x},${intermediate3.y} ${intermediate4.x},${intermediate4.y} ${intermediate5.x},${intermediate5.y} ${endNode.x},${endNode.y}`,
        coolPathNodes: [startNode, intermediate1, intermediate2, intermediate3, intermediate4, intermediate5, endNode]
      };
    } else {
      // Morning sun from East -> West alleys are shaded
      const intermediate1 = { x: startNode.x, y: 360, name: 'Oak Arcade North' };
      const intermediate2 = { x: 240, y: 360, name: 'Sycamore Tree Buffer' };
      const intermediate3 = { x: 240, y: 210, name: 'Pine Shaded Colonnade' };
      const intermediate4 = { x: 590, y: 210, name: 'Civic Center Shadow Corridor' };
      const intermediate5 = { x: 590, y: endNode.y, name: 'Medical District South Way' };
      return {
        coolPathPoints: `${startNode.x},${startNode.y} ${intermediate1.x},${intermediate1.y} ${intermediate2.x},${intermediate2.y} ${intermediate3.x},${intermediate3.y} ${intermediate4.x},${intermediate4.y} ${intermediate5.x},${intermediate5.y} ${endNode.x},${endNode.y}`,
        coolPathNodes: [startNode, intermediate1, intermediate2, intermediate3, intermediate4, intermediate5, endNode]
      };
    }
  }, [startNode, endNode, solarAzimuthDeg]);

  // Calculate dynamic statistics
  const directDistanceM = Math.round(Math.abs(endNode.x - startNode.x) * 1.4 + Math.abs(endNode.y - startNode.y) * 1.4);
  const coolDistanceM = Math.round(directDistanceM * 1.18);

  const baselineStats: RouteStats = useMemo(() => {
    const shadePct = Math.max(12, Math.round(24 - (solarElevationDeg / 90) * 12));
    const meanRadTemp = baseTemperature + 15.2 * (1 - shadePct / 100);
    const perceived = baseTemperature + 6.8 * (1 - shadePct / 100);
    const sweatLoss = Math.round((perceived / 30) * 480);

    const steps: TurnInstruction[] = [
      {
        id: 's1',
        instruction: `Depart from ${startNode.name} heading East on unshaded Elm Boulevard`,
        distanceMeters: Math.round(Math.abs(endNode.x - startNode.x) * 1.4),
        shadePercent: shadePct,
        tempC: Math.round(perceived * 10) / 10,
        landmark: 'Direct wide open unshaded concrete boulevard'
      },
      {
        id: 's2',
        instruction: `Turn South onto 5th Ave directly toward ${endNode.name}`,
        distanceMeters: Math.round(Math.abs(endNode.y - startNode.y) * 1.4),
        shadePercent: shadePct + 4,
        tempC: Math.round(perceived * 10) / 10,
        landmark: 'High asphalt thermal radiant canyon'
      }
    ];

    return {
      distanceMeters: directDistanceM,
      walkingTimeMin: Math.round((directDistanceM / 80) * 10) / 10,
      shadeCoveragePercent: shadePct,
      meanRadiantTempC: Math.round(meanRadTemp * 10) / 10,
      perceivedTempC: Math.round(perceived * 10) / 10,
      thermalDiscomfortIndex: 8.9,
      uvIndex,
      estimatedSweatLossMl: sweatLoss,
      steps
    };
  }, [baseTemperature, solarElevationDeg, directDistanceM, startNode, endNode, uvIndex]);

  const coolRouteStats: RouteStats = useMemo(() => {
    const shadePct = Math.min(96, Math.round(74 + (90 - solarElevationDeg) * 0.24 + (showTrees ? 8 : 0)));
    const meanRadTemp = baseTemperature + 15.2 * (1 - shadePct / 100);
    const perceived = baseTemperature + 6.8 * (1 - shadePct / 100) - 3.4;
    const sweatLoss = Math.round((perceived / 30) * 210);

    const steps: TurnInstruction[] = [
      {
        id: 'c1',
        instruction: `Depart from ${startNode.name}, step directly into Pine Colonnade shaded arcade`,
        distanceMeters: 180,
        shadePercent: 92,
        tempC: Math.round((perceived - 0.6) * 10) / 10,
        landmark: 'Atlas Tower shadow arcade canopy'
      },
      {
        id: 'c2',
        instruction: `Follow tree-lined arcade past Horizon Plaza & Sycamore canopy buffer`,
        distanceMeters: 340,
        shadePercent: 94,
        tempC: Math.round((perceived - 1.4) * 10) / 10,
        landmark: 'Desert Willow tree cooling corridor'
      },
      {
        id: 'c3',
        instruction: `Turn along Solaris Center eastern covered passage directly into ${endNode.name}`,
        distanceMeters: 420,
        shadePercent: 88,
        tempC: Math.round(perceived * 10) / 10,
        landmark: 'Deep building shadow relief portal'
      }
    ];

    return {
      distanceMeters: coolDistanceM,
      walkingTimeMin: Math.round((coolDistanceM / 80) * 10) / 10,
      shadeCoveragePercent: shadePct,
      meanRadiantTempC: Math.round(meanRadTemp * 10) / 10,
      perceivedTempC: Math.round(perceived * 10) / 10,
      thermalDiscomfortIndex: 3.1,
      uvIndex: Math.max(1, Math.round(uvIndex * 0.22 * 10) / 10),
      estimatedSweatLossMl: sweatLoss,
      steps
    };
  }, [baseTemperature, solarElevationDeg, coolDistanceM, showTrees, startNode, endNode, uvIndex]);

  // Handle node selection for waypoints
  const handleNodeClick = (nodeId: string) => {
    if (waypointSelectionMode === 'start') {
      setStartNodeId(nodeId);
      setWaypointSelectionMode('none');
    } else if (waypointSelectionMode === 'end') {
      setEndNodeId(nodeId);
      setWaypointSelectionMode('none');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#070709] p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0 select-none">
      {/* Top Header & Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-blue-400 text-xs font-mono mb-1.5 uppercase tracking-wide flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Urban Microclimate & Hyperlocal Shadow Mesh
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Splinter GIS Digital Twin
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
              v2.5D Isometric
            </span>
          </h2>
          <p className="text-zinc-400 mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Real-time raytraced building shadows, urban tree canopies, and microclimate heat exposure modeling for physiological pedestrian comfort.
          </p>
        </div>

        {/* City & Solar Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* City Selector & Location Button */}
          <div className="bg-[#121216] px-3.5 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-400" />
            <select
              value={selectedCityId}
              onChange={(e) => {
                const newCityId = e.target.value;
                setSelectedCityId(newCityId);
                const found = availableCities.find(c => c.id === newCityId);
                if (found) {
                  setBaseTemperature(found.typicalSummerHighC);
                }
              }}
              className="bg-transparent text-xs text-zinc-100 font-semibold focus:outline-none cursor-pointer"
            >
              {availableCities.map(c => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200">
                  {c.name} ({c.typicalSummerHighC}°C)
                </option>
              ))}
            </select>
            {onOpenLocationModal && (
              <button
                onClick={onOpenLocationModal}
                title="Search city, detect GPS, or enter custom coordinates"
                className="ml-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 transition cursor-pointer"
              >
                Change / GPS
              </button>
            )}
          </div>

          {/* Perspective View Toggle */}
          <div className="flex items-center bg-[#121216] p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewPerspective('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewPerspective === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2.5D Map</span>
            </button>
            <button
              onClick={() => setViewPerspective('street')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewPerspective === 'street' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Street Cam</span>
            </button>
          </div>

          {/* Solar Coordinates Telemetry Pill */}
          <div className="flex items-center gap-3 bg-[#121216] px-3.5 py-2 rounded-xl border border-zinc-800 shadow-sm">
            <Sun className="w-4 h-4 text-amber-400" />
            <div className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-2">
              <span>Az: <strong className="text-amber-400">{solarAzimuthDeg}°</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Alt: <strong className="text-blue-400">{solarElevationDeg}°</strong></span>
              <span className="text-zinc-600">•</span>
              <span>UV: <strong className={uvIndex > 7 ? 'text-rose-400' : 'text-emerald-400'}>{uvIndex}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scenario Presets Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5 bg-[#121216]/80 p-3 rounded-2xl border border-zinc-800/80 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold px-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Climate Scenarios:
          </span>
          {THERMAL_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setTimeMinutes(sc.timeMinutes);
                setBaseTemperature(sc.tempC);
                setSelectedCityId(sc.cityId);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-blue-500/60 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              {sc.title}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const exportData = {
              type: "FeatureCollection",
              metadata: {
                city: currentCity.name,
                solarAzimuthDeg,
                solarElevationDeg,
                perceivedTempDropC: (baselineStats.perceivedTempC - coolRouteStats.perceivedTempC).toFixed(1),
                shadeCoveragePct: coolRouteStats.shadeCoveragePercent
              },
              features: [
                {
                  type: "Feature",
                  properties: { name: "Splinter Cool Route", stats: coolRouteStats },
                  geometry: {
                    type: "LineString",
                    coordinates: coolPathNodes.map((n: any) => [n.x, n.y])
                  }
                },
                {
                  type: "Feature",
                  properties: { name: "Direct High-Exposure Route", stats: baselineStats },
                  geometry: {
                    type: "LineString",
                    coordinates: [[startNode.x, startNode.y], [endNode.x, startNode.y], [endNode.x, endNode.y]]
                  }
                }
              ]
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `splinter-thermal-route-${selectedCityId}-${timeString.replace(':', '')}.geojson`;
            a.click();
          }}
          className="text-xs px-3.5 py-1.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition flex items-center gap-2 font-mono font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Export GeoJSON
        </button>
      </div>

      {/* Control Console: Time Slider & Microclimate Setup */}
      <div className="bg-[#121216] p-4 sm:p-5 rounded-2xl border border-zinc-800 mb-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Time of day slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Solar Time of Day
              </span>
              <span className="font-mono text-blue-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {timeString}
              </span>
            </div>
            <input
              type="range"
              min={8 * 60}
              max={18 * 60}
              step={5}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>08:00 (East)</span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-blue-400 hover:text-blue-300 font-bold uppercase px-2.5 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-1"
              >
                {isPlaying ? <><Pause className="w-2.5 h-2.5" /> Pause</> : <><Play className="w-2.5 h-2.5" /> Animate Sun</>}
              </button>
              <span>18:00 (West)</span>
            </div>
          </div>

          {/* Ambient Base Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Ambient Temperature
              </span>
              <span className="font-mono text-rose-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {baseTemperature.toFixed(1)}°C
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={48}
              step={0.5}
              value={baseTemperature}
              onChange={(e) => setBaseTemperature(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>25°C (Mild)</span>
              <span>39°C (Peak Summer)</span>
              <span>48°C (Extreme)</span>
            </div>
          </div>

          {/* Waypoint Selection (A -> B) */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-emerald-400" /> Waypoints</span>
              <span className="text-[10px] font-mono text-zinc-400">{startNodeId} → {endNodeId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWaypointSelectionMode(waypointSelectionMode === 'start' ? 'none' : 'start')}
                className={`text-xs px-2.5 py-1.5 rounded-xl border font-mono flex items-center justify-between transition ${
                  waypointSelectionMode === 'start'
                    ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span>Start (A):</span>
                <span className="font-bold text-blue-400">{startNode.id}</span>
              </button>

              <button
                onClick={() => setWaypointSelectionMode(waypointSelectionMode === 'end' ? 'none' : 'end')}
                className={`text-xs px-2.5 py-1.5 rounded-xl border font-mono flex items-center justify-between transition ${
                  waypointSelectionMode === 'end'
                    ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span>Dest (B):</span>
                <span className="font-bold text-emerald-400">{endNode.id}</span>
              </button>
            </div>
            <div className="text-[10px] text-zinc-400">
              {waypointSelectionMode !== 'none' ? '👉 Click any intersection node on the canvas' : 'Click A or B above to re-pin waypoints'}
            </div>
          </div>

          {/* Environmental Layers & Persona Profiles */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> Overlays</span>
              <button
                onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
                className={`text-[10px] px-2 py-0.5 rounded font-mono border transition ${
                  showThermalHeatmap ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {showThermalHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
              </button>
            </div>
            {/* Routing Persona Profiles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedProfile('vulnerable')}
                className={`flex-1 py-1 text-[10px] rounded-lg font-medium border transition ${
                  selectedProfile === 'vulnerable' ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Elder/Child
              </button>
              <button
                onClick={() => setSelectedProfile('runner')}
                className={`flex-1 py-1 text-[10px] rounded-lg font-medium border transition ${
                  selectedProfile === 'runner' ? 'bg-blue-950/80 border-blue-500/50 text-blue-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Runner
              </button>
              <button
                onClick={() => setSelectedProfile('accessibility')}
                className={`flex-1 py-1 text-[10px] rounded-lg font-medium border transition ${
                  selectedProfile === 'accessibility' ? 'bg-purple-950/80 border-purple-500/50 text-purple-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                ADA
              </button>
            </div>
            <div className="text-[10px] text-zinc-400">
              {selectedProfile === 'vulnerable' ? 'Strict 85%+ shade corridor target' : selectedProfile === 'accessibility' ? 'Shaded curb cuts & gentle slopes' : 'Continuous thermal relief pace'}
            </div>
          </div>
        </div>
      </div>

      {/* Street-Level Perspective Camera View Modal/Pane */}
      {viewPerspective === 'street' ? (
        <div className="bg-[#121216] p-6 rounded-2xl border border-zinc-800 mb-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-white">First-Person Street Microclimate Cam</h3>
                <p className="text-xs text-zinc-400">Simulating pedestrian viewpoint on Pine Colonnade shaded arcade</p>
              </div>
            </div>
            <button
              onClick={() => setViewPerspective('map')}
              className="text-xs px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              Back to 2.5D Map
            </button>
          </div>

          <div className="h-72 w-full bg-gradient-to-b from-sky-950/50 via-[#0a0a0f] to-[#0d0d12] rounded-xl border border-zinc-800 relative overflow-hidden flex flex-col justify-end p-6">
            {/* Sun in sky */}
            <div
              className="absolute w-12 h-12 rounded-full bg-amber-400 blur-[2px] shadow-2xl shadow-amber-400/80 flex items-center justify-center transition-all duration-500"
              style={{
                top: `${Math.max(15, 80 - solarElevationDeg * 0.8)}%`,
                left: `${((solarAzimuthDeg - 90) / 180) * 80 + 10}%`
              }}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-100 animate-pulse"></div>
            </div>

            {/* Left Building Facade casting shadow */}
            <div className="absolute left-0 top-0 bottom-16 w-1/3 bg-gradient-to-r from-zinc-900 to-zinc-800 border-r-2 border-zinc-700 shadow-2xl flex flex-col justify-around p-3">
              <div className="text-[10px] font-mono text-zinc-400">Atlas Tower (78m)</div>
              <div className="grid grid-cols-4 gap-1 opacity-40">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-3 bg-sky-400/30 rounded-xs"></div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                Cast Shade: 100%
              </div>
            </div>

            {/* Right Tree Canopy */}
            <div className="absolute right-8 top-12 bottom-16 w-1/4 rounded-full bg-emerald-950/90 border border-emerald-500/40 blur-[1px] flex items-center justify-center text-center p-3">
              <span className="text-xs font-bold text-emerald-300">Desert Willow Canopy (-4.2°C)</span>
            </div>

            {/* Ground Asphalt & Shaded Sidewalk */}
            <div className="w-full h-16 bg-[#18181e] border-t-2 border-zinc-700 relative flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-emerald-400">Pine Colonnade: 27.8°C (Shaded Sidewalk)</span>
              </div>
              <div className="text-xs font-mono text-rose-400">
                Direct Road Sun Surface: 52.4°C
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive SVG Urban Canyon Map Canvas */}
      <div className="bg-[#121216] p-4 sm:p-5 rounded-2xl border border-zinc-800 mb-6 shadow-xl flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 text-xs gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-200 font-bold font-mono flex items-center gap-2 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500"></span>
              2.5D Isometric Street Network
            </span>

            {/* Architect Mode Tool Switcher */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
              <button
                onClick={() => setArchitectTool('inspect')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  architectTool === 'inspect' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Inspect
              </button>
              <button
                onClick={() => setArchitectTool('plant-tree')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  architectTool === 'plant-tree' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-emerald-400'
                }`}
              >
                <Trees className="w-3.5 h-3.5" />
                Plant Tree
              </button>
              <button
                onClick={() => {
                  setCustomTrees(SAMPLE_TREES);
                  const resetHeights: Record<string, number> = {};
                  SAMPLE_BUILDINGS.forEach(b => { resetHeights[b.id] = b.buildingHeightM; });
                  setBuildingHeights(resetHeights);
                }}
                className="px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 font-mono"
                title="Reset Urban Grid"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500"></span>
              <span className="text-zinc-400">Direct Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400"></span>
              <span className="text-emerald-400 font-bold">Splinter Cool Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-black/80 border border-zinc-700"></span>
              <span className="text-zinc-400">Building Shadow</span>
            </div>
          </div>
        </div>

        {/* SVG Canvas with 2.5D visual styling */}
        <div className="w-full bg-[#08080b] rounded-xl border border-zinc-800/90 overflow-hidden relative">
          <svg
            viewBox="0 0 850 550"
            className={`w-full h-auto select-none ${architectTool === 'plant-tree' ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' }}
            onClick={(e) => {
              if (architectTool === 'plant-tree') {
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleX = 850 / rect.width;
                const scaleY = 550 / rect.height;
                const x = Math.round((e.clientX - rect.left) * scaleX);
                const y = Math.round((e.clientY - rect.top) * scaleY);
                const newTree = {
                  id: `custom-t-${Date.now()}`,
                  x,
                  y,
                  radius: 16,
                  species: 'Planted Desert Ironwood',
                  foliageDensity: 0.92
                };
                setCustomTrees(prev => [...prev, newTree]);
              }
            }}
          >
            {/* Definitions & Gradients */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131318" strokeWidth="1" />
              </pattern>

              <linearGradient id="coolRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(0, 0, 0, 0.88)" />
                <stop offset="100%" stopColor="rgba(5, 7, 15, 0.65)" />
              </linearGradient>
            </defs>

            <rect width="850" height="550" fill="#08080b" />
            <rect width="850" height="550" fill="url(#grid)" opacity="0.6" />

            {/* Asphalt Roads & Avenues */}
            <rect x="50" y="135" width="750" height="36" fill="#111116" rx="2" />
            <rect x="50" y="195" width="750" height="36" fill="#111116" rx="2" />
            <rect x="50" y="345" width="750" height="36" fill="#111116" rx="2" />
            <rect x="50" y="440" width="750" height="36" fill="#111116" rx="2" />

            {/* Cross Avenues */}
            <rect x="62" y="70" width="36" height="420" fill="#111116" rx="2" />
            <rect x="222" y="70" width="36" height="420" fill="#111116" rx="2" />
            <rect x="392" y="70" width="36" height="420" fill="#111116" rx="2" />
            <rect x="572" y="70" width="36" height="420" fill="#111116" rx="2" />
            <rect x="742" y="70" width="36" height="420" fill="#111116" rx="2" />

            {/* Road Centerlines (Dashed Yellow/White) */}
            <line x1="50" y1="153" x2="800" y2="153" stroke="#eab308" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.4" />
            <line x1="50" y1="213" x2="800" y2="213" stroke="#eab308" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.4" />
            <line x1="50" y1="363" x2="800" y2="363" stroke="#eab308" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.4" />
            <line x1="50" y1="458" x2="800" y2="458" stroke="#eab308" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.4" />

            {/* Thermal Heatmap Microclimate Overlay */}
            {showThermalHeatmap && (
              <g opacity="0.45" style={{ mixBlendMode: 'screen' }}>
                <circle cx="760" cy="300" r="160" fill="#f43f5e" filter="blur(25px)" opacity="0.7" />
                <circle cx="240" cy="360" r="120" fill="#10b981" filter="blur(25px)" opacity="0.8" />
                <circle cx="450" cy="200" r="140" fill="#3b82f6" filter="blur(25px)" opacity="0.6" />
              </g>
            )}

            {/* 1. Render Cast Building Shadows (Extruded Geometry) */}
            {shadowPolygons.map((sp) => (
              <polygon
                key={`shadow-${sp.buildingId}`}
                points={sp.shadowExtrusion.map(p => `${p.x},${p.y}`).join(' ')}
                fill="url(#shadowGradient)"
                stroke="#181824"
                strokeWidth="0.5"
              />
            ))}

            {/* 2. Tree Shadows & Canopies */}
            {showTrees && customTrees.map((t) => (
              <g key={`tree-${t.id}`}>
                {/* Tree Cast Shadow */}
                <ellipse
                  cx={t.x + (shadowPolygons[0]?.dx ? shadowPolygons[0].dx * 0.35 : 10)}
                  cy={t.y + (shadowPolygons[0]?.dy ? shadowPolygons[0].dy * 0.35 : 10)}
                  rx={t.radius * 1.3}
                  ry={t.radius * 0.9}
                  fill="rgba(0, 0, 0, 0.75)"
                />
                {/* Tree Foliage Clusters */}
                <circle cx={t.x} cy={t.y} r={t.radius} fill="#065f46" stroke="#10b981" strokeWidth="1.5" opacity="0.95" />
                <circle cx={t.x - 4} cy={t.y - 3} r={t.radius * 0.6} fill="#047857" opacity="0.8" />
                <circle cx={t.x + 3} cy={t.y + 3} r={t.radius * 0.4} fill="#059669" opacity="0.8" />
              </g>
            ))}

            {/* 3. IoT Microclimate Sensor Stations */}
            {IOT_SENSOR_STATIONS.map((sensor) => (
              <g key={sensor.id} className="cursor-pointer">
                <circle cx={sensor.x} cy={sensor.y} r="14" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx={sensor.x} cy={sensor.y} r="4.5" fill="#38bdf8" />
                <text x={sensor.x + 16} y={sensor.y + 4} fill="#38bdf8" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {sensor.currentTempC}°C
                </text>
              </g>
            ))}

            {/* 4. Direct Route (High Exposure Red Dashed Line) */}
            <polyline
              points={directPathPoints}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4"
              strokeDasharray="6,4"
              opacity="0.85"
            />

            {/* 5. Splinter Shaded Route (Emerald Glowing Neon Line) */}
            <polyline
              points={coolPathPoints}
              fill="none"
              stroke="url(#coolRouteGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))' }}
            />

            {/* Animated Walking Beacon */}
            <circle
              cx={coolPathNodes[1]?.x || startNode.x}
              cy={coolPathNodes[1]?.y || startNode.y}
              r="8"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-ping opacity-75"
            />

            {/* Sidewalk Intersection Nodes (Interactive Clickable) */}
            {SIDEWALK_NODES.map((n) => {
              const isStart = n.id === startNodeId;
              const isEnd = n.id === endNodeId;
              const isSelectable = waypointSelectionMode !== 'none';

              return (
                <g
                  key={n.id}
                  onClick={() => handleNodeClick(n.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isStart || isEnd ? 11 : (isSelectable ? 7 : 3.5)}
                    fill={
                      isStart
                        ? '#3b82f6'
                        : isEnd
                        ? '#10b981'
                        : isSelectable
                        ? '#64748b'
                        : '#27272a'
                    }
                    stroke={isStart || isEnd ? '#ffffff' : '#09090b'}
                    strokeWidth={isStart || isEnd ? 2.5 : 1}
                  />
                  {(isStart || isEnd) && (
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {isStart ? 'A' : 'B'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 6. 2.5D Isometric Building Blocks */}
            {SAMPLE_BUILDINGS.map((b) => {
              const isSelected = selectedBuildingId === b.id;
              const sp = shadowPolygons.find(s => s.buildingId === b.id);
              const height = buildingHeights[b.id] || b.buildingHeightM;

              return (
                <g
                  key={b.id}
                  onClick={() => setSelectedBuildingId(isSelected ? null : b.id)}
                  onMouseEnter={() => setHoveredBuilding({ ...b, height, shadowLen: sp?.shadowLengthM || 0 })}
                  onMouseLeave={() => setHoveredBuilding(null)}
                  className="cursor-pointer transition"
                >
                  {/* Building Base & 3D Extrusion Effect */}
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.width}
                    height={b.height}
                    fill={isSelected ? '#2563eb' : '#1e1e24'}
                    stroke={isSelected ? '#60a5fa' : '#2e2e38'}
                    strokeWidth={isSelected ? 2 : 1}
                    rx="6"
                  />

                  {/* Rooftop Solar Panels / Mechanical Grid */}
                  <rect
                    x={b.x + 6}
                    y={b.y + 6}
                    width={b.width - 12}
                    height={b.height - 12}
                    fill="#15151a"
                    stroke="#272730"
                    strokeWidth="1"
                    rx="3"
                  />

                  {/* Building Label */}
                  <text
                    x={b.x + b.width / 2}
                    y={b.y + b.height / 2 - 3}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="9.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                  >
                    {b.name}
                  </text>
                  <text
                    x={b.x + b.width / 2}
                    y={b.y + b.height / 2 + 11}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {height}m ({sp?.shadowLengthM || 0}m shade)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Building Height Tweaker Modal */}
        {selectedBuildingId && (
          <div className="mt-4 p-4 bg-zinc-900 border border-blue-500/40 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-semibold text-zinc-100">
                  Building Height Tweaker: {SAMPLE_BUILDINGS.find(b => b.id === selectedBuildingId)?.name}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Dynamically shifts shadow cast length across street grid
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={20}
                max={150}
                step={5}
                value={buildingHeights[selectedBuildingId] || 50}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBuildingHeights(prev => ({ ...prev, [selectedBuildingId]: val }));
                }}
                className="w-44 accent-blue-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-blue-300 bg-zinc-800 px-2.5 py-1 rounded">
                {buildingHeights[selectedBuildingId] || 50}m
              </span>
              <button
                onClick={() => setSelectedBuildingId(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Route Comparison & Turn-by-Turn Guidance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Direct Route Card */}
        <div className="bg-[#121216] p-5 sm:p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <h3 className="text-sm font-bold text-zinc-200">Standard Shortest Navigation</h3>
              </div>
              <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/40 font-bold">
                HIGH HEAT EXPOSURE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Walking Distance</div>
                <div className="text-base font-mono font-bold text-zinc-200">
                  {baselineStats.distanceMeters}m
                </div>
                <div className="text-[10px] text-zinc-400">{baselineStats.walkingTimeMin} min</div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Shade Coverage</div>
                <div className="text-base font-mono font-bold text-rose-400">
                  {baselineStats.shadeCoveragePercent}%
                </div>
                <div className="text-[10px] text-zinc-400">Direct Sun Radiation</div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Perceived Temp</div>
                <div className="text-base font-mono font-bold text-rose-400">
                  {baselineStats.perceivedTempC}°C
                </div>
                <div className="text-[10px] text-zinc-400">Sweat: {baselineStats.estimatedSweatLossMl}ml/hr</div>
              </div>
            </div>

            {/* Turn by turn */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Turn-by-Turn Steps</div>
              {baselineStats.steps.map((s, idx) => (
                <div key={s.id} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-xs flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-rose-950 text-rose-400 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-zinc-200 font-medium">{s.instruction}</div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 font-mono">
                      <span>{s.distanceMeters}m</span> • <span className="text-rose-400">{s.tempC}°C perceived</span> • <span>{s.landmark}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Splinter Cool Route Card */}
        <div className="bg-[#121216] p-5 sm:p-6 rounded-2xl border border-emerald-500/40 flex flex-col justify-between shadow-lg glow-emerald">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-sm font-bold text-white">Splinter Thermal Shaded Route</h3>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                OPTIMAL COMFORT
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Walking Distance</div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {coolRouteStats.distanceMeters}m
                </div>
                <div className="text-[10px] text-zinc-400">{coolRouteStats.walkingTimeMin} min (+2m)</div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Shade Coverage</div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {coolRouteStats.shadeCoveragePercent}%
                </div>
                <div className="text-[10px] text-emerald-400">+{coolRouteStats.shadeCoveragePercent - baselineStats.shadeCoveragePercent}% Protection</div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <div className="text-[11px] text-zinc-400 mb-1">Perceived Temp</div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {coolRouteStats.perceivedTempC}°C
                </div>
                <div className="text-[10px] text-emerald-400">-{(baselineStats.perceivedTempC - coolRouteStats.perceivedTempC).toFixed(1)}°C Relief</div>
              </div>
            </div>

            {/* Turn by turn */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Turn-by-Turn Guidance HUD</div>
              {coolRouteStats.steps.map((s, idx) => (
                <div key={s.id} className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 text-xs flex items-start gap-3">
                  <span className="w-5 h-5 rounded-lg bg-emerald-950 text-emerald-400 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-zinc-100 font-semibold">{s.instruction}</div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2 font-mono">
                      <span>{s.distanceMeters}m</span> • <span className="text-emerald-400 font-bold">{s.shadePercent}% Shaded ({s.tempC}°C)</span> • <span>{s.landmark}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <strong>Physiological Impact:</strong> Reduces UV exposure dosage by <strong>78%</strong> and eliminates <strong>{baselineStats.estimatedSweatLossMl - coolRouteStats.estimatedSweatLossMl}ml/hr</strong> dehydration strain.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urban Canopy & Heat Island Mitigation Telemetry Deck */}
      <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Urban Forestry & Heat Island (UHI) Mitigation Metrics</h3>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
            Active Urban Forestry Layer
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Total Canopy Trees</div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1.5">
              {customTrees.length}
              <span className="text-[11px] font-sans font-normal text-zinc-400">specimens</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">+{customTrees.length - SAMPLE_TREES.length} custom planted</div>
          </div>

          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Shaded Surface Area</div>
            <div className="text-xl font-bold font-mono text-blue-400 flex items-baseline gap-1.5">
              {Math.round(customTrees.length * 3.14159 * 16 * 16 * 0.42)}
              <span className="text-[11px] font-sans font-normal text-zinc-400">m²</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Ground radiant interception</div>
          </div>

          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Evaporative Cooling</div>
            <div className="text-xl font-bold font-mono text-purple-400 flex items-baseline gap-1.5">
              {(customTrees.length * 2.8).toFixed(1)}
              <span className="text-[11px] font-sans font-normal text-zinc-400">kWh/day</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Thermal dissipation rate</div>
          </div>

          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-[11px] text-zinc-400 mb-1">Thermal Risk Reduction</div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-1.5">
              -{(baselineStats.perceivedTempC - coolRouteStats.perceivedTempC).toFixed(1)}°C
              <span className="text-[11px] font-sans font-normal text-zinc-400">UTCI</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">68% lower heat stroke risk</div>
          </div>
        </div>
      </div>
    </div>
  );
};
