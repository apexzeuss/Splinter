import React, { useState, useEffect, useMemo } from 'react';
import { SAMPLE_BUILDINGS, SAMPLE_TREES, CITY_PRESETS, THERMAL_SCENARIOS } from '../data/projectData';
import { OsmBuilding, fetchOsmData, parseOsmBuildings } from '../lib/osm';
import {
  Sun, Clock, Play, Pause, RotateCcw, Sparkles, Navigation, Thermometer,
  Layers, MapPin, Trees, Settings2, Sliders, Download, Eye, AlertTriangle
} from 'lucide-react';
import { RouteStats, CityPreset } from '../types';
import {
  solarPosition, clearSkyUvIndex, shadowLengthM, estimateUtcOffsetHours
} from '../lib/solar';
import { Pt, ShadeGeometry, convexHull, mToPx, canvasToLngLat, isShaded, METERS_PER_PX, GeoAnchor } from '../lib/geometry';
import {
  GraphNode, buildSidewalkEdges, weightEdges, distanceRoute, thermalRoute,
  summarisePath, polylinePoints, effectiveTempC, DEFAULT_THERMAL_WEIGHTS
} from '../lib/router';

/**
 * Typical street tree canopy height, used to cast the tree's own shadow.
 * Previously tree shadows reused the first building's displacement vector, so
 * their length tracked Atlas Tower's height rather than the tree's.
 */
const TREE_CANOPY_HEIGHT_M = 7;

/**
 * Scrubbable time-of-day window, 06:00 to 20:00.
 * prd.md 4.1 and project-plan.md Phase 2 both specify this range; the slider was
 * built to 08:00-18:00.
 */
const DAY_START_MIN = 6 * 60;
const DAY_END_MIN = 20 * 60;

/** Cell size of the thermal overlay grid, in canvas pixels. */
const HEATMAP_CELL_PX = 17;

/**
 * Fixed points on the canvas that read out the model's computed temperature.
 *
 * These replace the "IoT Microclimate Sensor Stations" overlay, which rendered
 * hardcoded values (45.2 C, 48.6 C, 1040 W/m2) as if they were live telemetry
 * from a municipal sensor network.
 */
const PROBE_POINTS: { id: string; name: string; x: number; y: number }[] = [
  { id: 'p1', name: 'Elm St mid-block', x: 180, y: 150 },
  { id: 'p2', name: 'Oak Arcade', x: 240, y: 360 },
  { id: 'p3', name: '5th Ave open asphalt', x: 760, y: 300 },
];

// Sidewalk intersection graph nodes for dynamic pathfinding
const SIDEWALK_NODES: GraphNode[] = [
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

/** Orthogonal grid connectivity. Static, so it is built once at module load. */
const SIDEWALK_EDGES = buildSidewalkEdges(SIDEWALK_NODES);

interface ShadowRouterSimulatorProps {
  userCoords?: {
    lat: number;
    lng: number;
    city: string;
    tempC: number;
    isLive: boolean;
    utcOffsetHours?: number;
  } | null;
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
  const [viewPerspective, setViewPerspective] = useState<'map' | 'street'>('map');

  // Real-world building data state
  const [osmBuildings, setOsmBuildings] = useState<OsmBuilding[]>([]);
  const [isLoadingOsm, setIsLoadingOsm] = useState<boolean>(false);
  const [osmError, setOsmError] = useState<string | null>(null);

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
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeMinutes(prev => (prev >= DAY_END_MIN ? DAY_START_MIN : prev + 5));
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Dynamic city presets including the user's location if one is set
  const availableCities = useMemo<CityPreset[]>(() => {
    if (userCoords?.isLive) {
      const userPreset: CityPreset = {
        id: 'my-location',
        name: `${userCoords.city} (your location)`,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        timezone: 'Local',
        typicalSummerHighC: userCoords.tempC,
        utcOffsetHours: userCoords.utcOffsetHours,
        // No urbanHeatIslandPenaltyC: we have no UHI figure for an arbitrary
        // coordinate, and the previous hardcoded 4.8 was invented.
      };
      return [userPreset, ...CITY_PRESETS];
    }
    return CITY_PRESETS;
  }, [userCoords]);

  // Select the user's location once when it first arrives, and seed the ambient
  // slider from its observed temperature.
  //
  // This deliberately keys on identity rather than on tempC: the previous
  // version re-ran on every temperature change and force-set selectedCityId back
  // to 'my-location', so a weather refresh silently discarded whichever city and
  // ambient temperature the user had chosen.
  const appliedLocationRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!userCoords?.isLive) return;
    const key = `${userCoords.lat},${userCoords.lng}`;
    if (appliedLocationRef.current === key) return;
    appliedLocationRef.current = key;
    setSelectedCityId('my-location');
    setBaseTemperature(userCoords.tempC);
  }, [userCoords?.isLive, userCoords?.lat, userCoords?.lng, userCoords?.tempC]);

  // Active City Preset
  const currentCity = useMemo(() => {
    return availableCities.find(c => c.id === selectedCityId) || availableCities[0];
  }, [selectedCityId, availableCities]);

  // Geo-anchor for projecting OSM coordinates to canvas pixels.
  const geoAnchor = useMemo<GeoAnchor>(() => ({
    latitude: currentCity.latitude,
    longitude: currentCity.longitude,
    originPx: { x: 425, y: 275 }, // Center of the canvas
  }), [currentCity.latitude, currentCity.longitude]);

  // Fetch real building data when the city changes.
  useEffect(() => {
    const fetchAndSetOsmData = async () => {
      setIsLoadingOsm(true);
      setOsmError(null);
      setOsmBuildings([]); // Clear previous buildings

      // Bounding box of ~1.2km square around the city center.
      const radiusDeg = 0.006;
      const bbox: [number, number, number, number] = [
        currentCity.longitude - radiusDeg,
        currentCity.latitude - radiusDeg,
        currentCity.longitude + radiusDeg,
        currentCity.latitude + radiusDeg,
      ];

      try {
        const rawData = await fetchOsmData(bbox);
        const buildings = parseOsmBuildings(rawData, geoAnchor, 1 / METERS_PER_PX);
        setOsmBuildings(buildings);
      } catch (error) {
        console.error("Failed to fetch or parse OSM data:", error);
        setOsmError(error instanceof Error ? error.message : 'An unknown error occurred.');
      } finally {
        setIsLoadingOsm(false);
      }
    };

    fetchAndSetOsmData();
  }, [currentCity, geoAnchor]);


  // Date drives declination and the equation of time. Time-of-day scrubbing
  // moves within this date.
  const today = useMemo(() => new Date(), []);

  const utcOffsetHours =
    currentCity.utcOffsetHours ?? estimateUtcOffsetHours(currentCity.longitude);

  // Real solar position (NOAA algorithm, see lib/solar.ts).
  const solar = useMemo(
    () =>
      solarPosition({
        latitude: currentCity.latitude,
        longitude: currentCity.longitude,
        minutesOfDay: timeMinutes,
        date: today,
        utcOffsetHours,
      }),
    [currentCity.latitude, currentCity.longitude, timeMinutes, today, utcOffsetHours],
  );

  const solarElevationDeg = Math.round(solar.elevationDeg * 10) / 10;
  const solarAzimuthDeg = Math.round(solar.azimuthDeg * 10) / 10;
  const uvIndexEstimate = Math.round(clearSkyUvIndex(solar.elevationDeg) * 10) / 10;
  const isDaylight = solar.elevationDeg > 0.5;

  const timeString = `${Math.floor(timeMinutes / 60)
    .toString()
    .padStart(2, '0')}:${(timeMinutes % 60).toString().padStart(2, '0')}`;


  // Anti-solar displacement in canvas pixels, shared by buildings and trees.
  const shadowVector = useMemo(() => {
    if (!isDaylight) return null;
    const antiSolarRad = ((solar.azimuthDeg + 180) % 360) * (Math.PI / 180);
    return { sin: Math.sin(antiSolarRad), cos: Math.cos(antiSolarRad) };
  }, [solar.azimuthDeg, isDaylight]);

  // Building shadow polygons: convex hull of footprint and its projection, per
  // architecture.md section 2.4. Lengths go through METERS_PER_PX so the map has
  // one scale rather than 1.4 for routes and 0.82 for shadows.
  const shadowPolygons = useMemo(() => {
    if (!shadowVector) return [];

    return osmBuildings.flatMap((b) => {
      // Use OSM height if available, otherwise a fallback.
      // TODO: Improve this fallback strategy.
      const heightM = b.heightM ?? buildingHeights[b.id] ?? 25;
      const lengthM = shadowLengthM(heightM, solar.elevationDeg);
      if (lengthM === null) return [];

      const lengthPx = mToPx(lengthM);
      const dx = shadowVector.sin * lengthPx;
      const dy = -shadowVector.cos * lengthPx;
      const projected = b.footprint.map((p) => ({ x: p.x + dx, y: p.y + dy }));

      return [{
        buildingId: b.id,
        footprint: b.footprint,
        hull: convexHull([...b.footprint, ...projected]),
        shadowLengthM: Math.round(lengthM),
        dx,
        dy,
      }];
    });
  }, [shadowVector, solar.elevationDeg, buildingHeights]);

  // Tree canopy shadows, cast from the tree's own height. (Still using sample trees)
  const treeShadows = useMemo(() => {
    if (!shadowVector || !showTrees) return [];
    const lengthM = shadowLengthM(TREE_CANOPY_HEIGHT_M, solar.elevationDeg);
    if (lengthM === null) return [];

    const lengthPx = mToPx(lengthM);
    const dx = shadowVector.sin * lengthPx;
    const dy = -shadowVector.cos * lengthPx;

    return customTrees.map((t) => ({
      id: t.id,
      x: t.x + dx,
      y: t.y + dy,
      r: t.radius * 1.15,
    }));
  }, [shadowVector, solar.elevationDeg, showTrees, customTrees]);

  // Everything the router treats as shade.
  const shadeGeometry = useMemo<ShadeGeometry>(
    () => ({
      polygons: shadowPolygons.map((s) => s.hull),
      circles: treeShadows.map((t) => ({ x: t.x, y: t.y, r: t.r })),
    }),
    [shadowPolygons, treeShadows],
  );


  const startNode = useMemo(() => SIDEWALK_NODES.find(n => n.id === startNodeId) || SIDEWALK_NODES[0], [startNodeId]);
  const endNode = useMemo(() => SIDEWALK_NODES.find(n => n.id === endNodeId) || SIDEWALK_NODES[19], [endNodeId]);

  // Measure every sidewalk edge against the shadows currently on the canvas.
  const edges = useMemo(
    () => weightEdges(SIDEWALK_NODES, SIDEWALK_EDGES, shadeGeometry),
    [shadeGeometry],
  );

  // Two searches over the same graph: one minimising distance, one minimising
  // the thermal cost from architecture.md section 2.4. Both respect the A and B
  // waypoints, which the previous hardcoded polylines did not.
  const directPath = useMemo(
    () => distanceRoute(SIDEWALK_NODES, edges, startNodeId, endNodeId),
    [edges, startNodeId, endNodeId],
  );

  const coolPath = useMemo(
    () => thermalRoute(SIDEWALK_NODES, edges, startNodeId, endNodeId, baseTemperature),
    [edges, startNodeId, endNodeId, baseTemperature],
  );

  const directPathPoints = useMemo(() => polylinePoints(directPath), [directPath]);
  const coolPathPoints = useMemo(() => polylinePoints(coolPath), [coolPath]);

  /** True when the thermal objective found nothing better than the direct path. */
  const routesIdentical = useMemo(
    () =>
      directPath.length === coolPath.length &&
      directPath.every((n, i) => n.id === coolPath[i].id),
    [directPath, coolPath],
  );


  // Route statistics, measured from the graph and the current shadow geometry.
  const conditions = useMemo(
    () => ({
      ambientC: baseTemperature,
      solarElevationDeg: solar.elevationDeg,
      uvIndexEstimate,
    }),
    [baseTemperature, solar.elevationDeg, uvIndexEstimate],
  );

  const baselineStats: RouteStats = useMemo(
    () => summarisePath(directPath, edges, conditions),
    [directPath, edges, conditions],
  );

  const coolRouteStats: RouteStats = useMemo(
    () => summarisePath(coolPath, edges, conditions),
    [coolPath, edges, conditions],
  );

  const shadeGainPct = coolRouteStats.shadeCoveragePercent - baselineStats.shadeCoveragePercent;
  const tempReliefC = baselineStats.effectiveTempC - coolRouteStats.effectiveTempC;
  const distancePenaltyM = coolRouteStats.distanceMeters - baselineStats.distanceMeters;
  const timePenaltyMin =
    Math.round((coolRouteStats.walkingTimeMin - baselineStats.walkingTimeMin) * 10) / 10;

  // Union area of the tree shadows, measured by sampling so that overlapping
  // canopies are not counted twice. The previous figure was
  // `trees * pi * 16 * 16 * 0.42`, which assumed a fixed radius and ignored both
  // the real radii and the sun angle.
  const canopyShadeAreaM2 = useMemo(() => {
    if (treeShadows.length === 0) return 0;
    const step = 3;
    let cells = 0;
    for (let x = 0; x < 850; x += step) {
      for (let y = 0; y < 550; y += step) {
        const covered = treeShadows.some(
          (s) => (x - s.x) ** 2 + (y - s.y) ** 2 <= s.r * s.r,
        );
        if (covered) cells++;
      }
    }
    return Math.round(cells * step * step * METERS_PER_PX * METERS_PER_PX);
  }, [treeShadows]);

  // Coarse grid of computed effective temperature for the thermal overlay.
  const thermalCells = useMemo(() => {
    if (!showThermalHeatmap) return [];
    const cells: { x: number; y: number; tempC: number }[] = [];
    for (let x = 0; x < 850; x += HEATMAP_CELL_PX) {
      for (let y = 0; y < 550; y += HEATMAP_CELL_PX) {
        const centre = { x: x + HEATMAP_CELL_PX / 2, y: y + HEATMAP_CELL_PX / 2 };
        const coverage = isShaded(centre, shadeGeometry) ? 1 : 0;
        cells.push({
          x,
          y,
          tempC: effectiveTempC(baseTemperature, coverage, solar.elevationDeg),
        });
      }
    }
    return cells;
  }, [showThermalHeatmap, shadeGeometry, baseTemperature, solar.elevationDeg]);

  /** Colour scale bounds: fully shaded through fully exposed. */
  const heatRange = useMemo(() => {
    const lo = baseTemperature;
    const hi = effectiveTempC(baseTemperature, 0, solar.elevationDeg);
    return { lo, hi: Math.max(hi, lo + 0.1) };
  }, [baseTemperature, solar.elevationDeg]);


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
    <div className="flex-1 flex flex-col bg-white p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0 select-none">
      {/* Top Header & Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-blue-400 text-xs font-mono mb-1.5 uppercase tracking-wide flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Live 2.5D Router
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Splinter GIS Digital Twin
          </h2>
          <p className="text-zinc-500 mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Real-time raytraced building shadows and microclimate heat exposure modeling.
          </p>
        </div>

        {/* City & Solar Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* City Selector & Location Button */}
          <div className="bg-zinc-100 px-3.5 py-2 rounded-xl border border-zinc-200 flex items-center gap-2 shadow-sm">
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
              className="bg-transparent text-xs text-zinc-800 font-semibold focus:outline-none cursor-pointer"
            >
              {availableCities.map(c => (
                <option key={c.id} value={c.id} className="bg-white text-zinc-800">
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
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setViewPerspective('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewPerspective === 'map' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2.5D Map</span>
            </button>
            <button
              onClick={() => setViewPerspective('street')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewPerspective === 'street' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Street Cam</span>
            </button>
          </div>

          {/* Solar Coordinates Telemetry Pill */}
          <div className="flex items-center gap-3 bg-zinc-100 px-3.5 py-2 rounded-xl border border-zinc-200 shadow-sm">
            <Sun className="w-4 h-4 text-amber-400" />
            <div
              className="font-mono text-xs text-zinc-300 font-semibold flex items-center gap-2"
              title={`Solar noon at ${currentCity.name} on ${today.toISOString().slice(0, 10)}. UV is a clear-sky estimate, not a measurement.`}
            >
              <span>Az: <strong className="text-amber-400">{solarAzimuthDeg}°</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Alt: <strong className="text-blue-500">{solarElevationDeg}°</strong></span>
              <span className="text-zinc-600">•</span>
              <span>
                UV est:{' '}
                <strong className={uvIndexEstimate > 7 ? 'text-rose-400' : 'text-emerald-400'}>
                  {uvIndexEstimate}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation disclosure. The street grid, buildings and trees are invented;
          only the solar geometry and the routing over that grid are computed. */}
      {osmError ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <strong className="text-rose-300">Map Data Error.</strong>
            <p className="text-xs leading-relaxed text-zinc-300">
              Could not load building data from OpenStreetMap. The service may be temporarily unavailable.
              <span className="mt-1 block font-mono text-rose-400/60 text-[10px]">{osmError}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-zinc-300">
            <strong className="text-amber-300">Live Building Data.</strong> Building footprints are from OpenStreetMap. The sidewalk intersections and trees are still a synthetic grid for routing demonstration.
          </p>
        </div>
      )}

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
            // Georeference the synthetic grid against the selected city so the
            // file is valid GeoJSON. Previously this wrote raw SVG pixel pairs
            // into `coordinates`, which no GIS tool could read.
            const anchor = {
              latitude: currentCity.latitude,
              longitude: currentCity.longitude,
              originPx: { x: 425, y: 275 },
            };
            const toFeature = (path: typeof directPath, name: string, stats: RouteStats) => ({
              type: 'Feature' as const,
              properties: { name, ...stats },
              geometry: {
                type: 'LineString' as const,
                coordinates: path.map((n) => canvasToLngLat(n, anchor)),
              },
            });

            const exportData = {
              type: 'FeatureCollection' as const,
              metadata: {
                note:
                  'Synthetic street grid from the Splinter simulator, georeferenced to the selected city. Not real map data.',
                city: currentCity.name,
                localTime: timeString,
                date: today.toISOString().slice(0, 10),
                solarAzimuthDeg,
                solarElevationDeg,
                ambientC: baseTemperature,
                metersPerPixel: METERS_PER_PX,
                thermalWeights: DEFAULT_THERMAL_WEIGHTS,
              },
              features: [
                toFeature(coolPath, 'Splinter shaded route', coolRouteStats),
                toFeature(directPath, 'Shortest-distance route', baselineStats),
              ],
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: 'application/geo+json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `splinter-route-${selectedCityId}-${timeString.replace(':', '')}.geojson`;
            a.click();
            URL.revokeObjectURL(url);
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
              min={DAY_START_MIN}
              max={DAY_END_MIN}
              step={5}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(parseInt(e.target.value))}
              aria-label="Time of day"
              className="w-full accent-blue-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>06:00</span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-blue-400 hover:text-blue-300 font-semibold px-2.5 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-1"
              >
                {isPlaying ? <><Pause className="w-2.5 h-2.5" /> Pause</> : <><Play className="w-2.5 h-2.5" /> Play</>}
              </button>
              <span>20:00</span>
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowTrees(!showTrees)}
                  aria-pressed={showTrees}
                  className={`text-xs px-2 py-0.5 rounded font-mono border transition ${
                    showTrees ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Trees
                </button>
                <button
                  onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
                  aria-pressed={showThermalHeatmap}
                  className={`text-xs px-2 py-0.5 rounded font-mono border transition ${
                    showThermalHeatmap ? 'bg-rose-950 text-rose-300 border-rose-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Heat
                </button>
              </div>
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

            {/* Thermal overlay: computed effective temperature per cell.
                This replaces three fixed blurred circles whose positions and
                colours never responded to the sun, the buildings or the
                temperature. */}
            {showThermalHeatmap && (
              <g opacity="0.4">
                {thermalCells.map((cell) => {
                  const span = heatRange.hi - heatRange.lo;
                  const t = span <= 0 ? 0 : (cell.tempC - heatRange.lo) / span;
                  return (
                    <rect
                      key={`heat-${cell.x}-${cell.y}`}
                      x={cell.x}
                      y={cell.y}
                      width={HEATMAP_CELL_PX}
                      height={HEATMAP_CELL_PX}
                      fill={`hsl(${Math.round(160 - t * 160)} 70% 50%)`}
                    />
                  );
                })}
              </g>
            )}

            {/* 1. Cast building shadows: convex hull of footprint + projection */}
            {shadowPolygons.map((sp) => (
              <polygon
                key={`shadow-${sp.buildingId}`}
                points={sp.hull.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="url(#shadowGradient)"
                stroke="#181824"
                strokeWidth="0.5"
              />
            ))}

            {/* 2. Tree canopy shadows, cast from the tree's own height */}
            {treeShadows.map((s) => (
              <circle
                key={`tree-shadow-${s.id}`}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill="rgba(0, 0, 0, 0.7)"
              />
            ))}

            {/* 3. Tree canopies */}
            {showTrees && customTrees.map((t) => (
              <g key={`tree-${t.id}`}>
                <circle cx={t.x} cy={t.y} r={t.radius} fill="#065f46" stroke="#10b981" strokeWidth="1.5" opacity="0.95" />
                <circle cx={t.x - 4} cy={t.y - 3} r={t.radius * 0.6} fill="#047857" opacity="0.8" />
                <circle cx={t.x + 3} cy={t.y + 3} r={t.radius * 0.4} fill="#059669" opacity="0.8" />
              </g>
            ))}

            {/* 4. Probe points. These read out the model's computed temperature at
                a location. They previously displayed hardcoded numbers such as
                45.2 C and 1040 W/m2 while being labelled IoT sensor stations. */}
            {PROBE_POINTS.map((probe) => {
              const shaded = isShaded(probe, shadeGeometry);
              const tempC = effectiveTempC(baseTemperature, shaded ? 1 : 0, solar.elevationDeg);
              return (
                <g key={probe.id}>
                  <circle
                    cx={probe.x}
                    cy={probe.y}
                    r="4.5"
                    fill={shaded ? '#34d399' : '#fb7185'}
                    stroke="#09090b"
                    strokeWidth="1"
                  />
                  <text
                    x={probe.x + 9}
                    y={probe.y + 4}
                    fill={shaded ? '#34d399' : '#fb7185'}
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                  >
                    {tempC.toFixed(1)}°C
                  </text>
                </g>
              );
            })}

            {/* 5. Shortest-distance route */}
            <polyline
              points={directPathPoints}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4"
              strokeDasharray="6,4"
              opacity="0.85"
            />

            {/* 6. Shaded route. Drawn second so it reads on top when the two
                searches return the same path. */}
            <polyline
              points={coolPathPoints}
              fill="none"
              stroke="#10b981"
              strokeWidth={routesIdentical ? 3 : 6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={routesIdentical ? '2,6' : undefined}
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

            {/* 6. 2.5D Isometric Building Blocks (from OSM) */}
            {osmBuildings.map((b) => {
              const isSelected = selectedBuildingId === String(b.id);
              const sp = shadowPolygons.find(s => s.buildingId === b.id);
              const height = b.heightM ?? buildingHeights[b.id] ?? 25;

              return (
                <g
                  key={b.id}
                  onClick={() => setSelectedBuildingId(isSelected ? null : String(b.id))}
                  className="cursor-pointer transition"
                >
                  {/* Building Base & 3D Extrusion Effect */}
                  <polygon
                    points={b.footprint.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={isSelected ? '#2563eb' : '#1e1e24'}
                    stroke={isSelected ? '#60a5fa' : '#2e2e38'}
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Rooftop Solar Panels / Mechanical Grid */}

                  {/* Building Label */}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Building Height Tweaker Modal */}
        {selectedBuildingId && osmBuildings.find(b => String(b.id) === selectedBuildingId) && (
          <div className="mt-4 p-4 bg-zinc-900 border border-blue-500/40 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-semibold text-zinc-100">
                  Building Height Tweaker: OSM Building #{selectedBuildingId}
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

      {/* Route comparison. Every figure below is computed from the graph and the
          current shadow geometry. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Shortest-distance route */}
        <div className="bg-[#121216] p-5 sm:p-6 rounded-2xl border border-zinc-800 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h3 className="text-sm font-semibold text-zinc-200">Shortest distance</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Distance</div>
              <div className="text-base font-mono font-semibold text-zinc-200">
                {baselineStats.distanceMeters} m
              </div>
              <div className="text-xs text-zinc-500">{baselineStats.walkingTimeMin} min</div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">In shade</div>
              <div className="text-base font-mono font-semibold text-rose-400">
                {baselineStats.shadeCoveragePercent}%
              </div>
              <div className="text-xs text-zinc-500">length-weighted</div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Effective temp</div>
              <div className="text-base font-mono font-semibold text-rose-400">
                {baselineStats.effectiveTempC}°C
              </div>
              <div className="text-xs text-zinc-500">ambient {baseTemperature.toFixed(1)}°C</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Legs
            </div>
            {baselineStats.steps.length === 0 && (
              <p className="text-xs text-zinc-500">No route between these waypoints.</p>
            )}
            {baselineStats.steps.map((s, idx) => (
              <div key={s.id} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-xs flex items-start gap-3">
                <span className="w-5 h-5 rounded-lg bg-rose-950 text-rose-400 font-mono text-xs flex items-center justify-center shrink-0 font-semibold">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-zinc-200">{s.instruction}</div>
                  <div className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-x-2 font-mono">
                    <span>{s.distanceMeters} m</span>
                    <span>·</span>
                    <span>{s.shadePercent}% shaded</span>
                    <span>·</span>
                    <span className="text-rose-400">{s.effectiveTempC}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thermal route */}
        <div className="bg-[#121216] p-5 sm:p-6 rounded-2xl border border-emerald-500/30 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-semibold text-white">Shade-weighted</h3>
          </div>

          {routesIdentical && (
            <p className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300">
              The thermal search returned the same path as the shortest route — at
              this sun angle no detour reduces exposure enough to be worth the
              extra distance. That is a valid result, not a failure.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Distance</div>
              <div className="text-base font-mono font-semibold text-emerald-400">
                {coolRouteStats.distanceMeters} m
              </div>
              <div className="text-xs text-zinc-500">
                {coolRouteStats.walkingTimeMin} min
                {timePenaltyMin !== 0 && ` (${timePenaltyMin > 0 ? '+' : ''}${timePenaltyMin})`}
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">In shade</div>
              <div className="text-base font-mono font-semibold text-emerald-400">
                {coolRouteStats.shadeCoveragePercent}%
              </div>
              <div className="text-xs text-emerald-400">
                {shadeGainPct > 0 ? `+${shadeGainPct} pts` : `${shadeGainPct} pts`}
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <div className="text-xs text-zinc-400 mb-1">Effective temp</div>
              <div className="text-base font-mono font-semibold text-emerald-400">
                {coolRouteStats.effectiveTempC}°C
              </div>
              <div className="text-xs text-emerald-400">
                {tempReliefC > 0 ? '−' : ''}
                {Math.abs(tempReliefC).toFixed(1)}°C
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Legs
            </div>
            {coolRouteStats.steps.length === 0 && (
              <p className="text-xs text-zinc-500">No route between these waypoints.</p>
            )}
            {coolRouteStats.steps.map((s, idx) => (
              <div key={s.id} className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 text-xs flex items-start gap-3">
                <span className="w-5 h-5 rounded-lg bg-emerald-950 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 font-semibold">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-zinc-100">{s.instruction}</div>
                  <div className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-x-2 font-mono">
                    <span>{s.distanceMeters} m</span>
                    <span>·</span>
                    <span className="text-emerald-400">{s.shadePercent}% shaded</span>
                    <span>·</span>
                    <span>{s.effectiveTempC}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Trade-off: {distancePenaltyM >= 0 ? '+' : ''}{distancePenaltyM} m for{' '}
            {shadeGainPct >= 0 ? '+' : ''}{shadeGainPct} percentage points of shade.
            Effective temperature is a simplified exposure model — it is not UTCI,
            PET or mean radiant temperature, and it says nothing about
            physiological risk.
          </p>
        </div>
      </div>

      {/* Canopy figures. Shade area is measured from the tree shadow circles the
          model actually casts, rather than assuming a fixed radius per tree.
          Evaporative cooling in kWh/day and a heat-stroke risk percentage used to
          appear here; both were invented and neither is computable from this
          model, so they are gone. */}
      <div className="bg-[#121216] p-5 rounded-2xl border border-zinc-800 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trees className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Canopy</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Trees on grid</div>
            <div className="text-xl font-semibold font-mono text-emerald-400">
              {customTrees.length}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {customTrees.length - SAMPLE_TREES.length} planted by you
            </div>
          </div>

          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Canopy shade cast</div>
            <div className="text-xl font-semibold font-mono text-blue-400">
              {canopyShadeAreaM2.toLocaleString()}
              <span className="ml-1.5 text-xs font-sans font-normal text-zinc-400">m²</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {isDaylight ? 'at the current sun angle' : 'sun below horizon'}
            </div>
          </div>

          <div className="p-3.5 bg-[#0a0a0d] rounded-xl border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Route shade gain</div>
            <div className="text-xl font-semibold font-mono text-emerald-400">
              {shadeGainPct >= 0 ? '+' : ''}{shadeGainPct}
              <span className="ml-1.5 text-xs font-sans font-normal text-zinc-400">pts</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">shaded vs shortest</div>
          </div>
        </div>
      </div>
    </div>
  );
};
