import { DocId, ProjectDoc, TaskItem, ArchitectureDirective, SplinterNode, SimulationScenario, CityPreset } from '../types';

export const INITIAL_DOCS: Record<string, ProjectDoc> = {
  'README.md': {
    id: 'README.md',
    name: 'README.md',
    title: 'Splinter — Intelligent Pedestrian Heat & Shade Router',
    category: 'Requirements',
    icon: '☀️',
    lastUpdated: '2026-08-16 10:20:00',
    content: `# Splinter

Splinter is an intelligent pedestrian router that minimizes heat exposure by combining hyperlocal temperature data with real-time shade geometry.

## Day 1 Focus

This repository starts with the shadow-calculation module because route quality depends on believable shade estimates. The current package can:

- **compute sun position** for a coordinate and timestamp (solar azimuth and elevation angles),
- **project a building shadow** from building polygon height and solar geometry,
- **estimate how much of a route segment is covered** by that shadow polygon, and
- **combine base temperature, solar penalty, and shade bonuses** into a thermal edge cost function for optimal pedestrian pathfinding.

## Quick Start

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest
\`\`\`

## Example

\`\`\`bash
python examples/shadow_demo.py
\`\`\`
`
  },
  'project-plan.md': {
    id: 'project-plan.md',
    name: 'project-plan.md',
    title: 'Project Execution & Routing Engine Plan',
    category: 'Strategic',
    icon: '📄',
    lastUpdated: '2026-08-16 10:22:15',
    content: `# Project Plan: Splinter Pedestrian Thermal Routing Engine

## 1. Executive Summary
Extreme urban heat waves create severe pedestrian health risks. Standard navigation apps route solely for shortest distance or time, exposing pedestrians to unshaded concrete corridors and high Mean Radiant Temperatures ($T_{mrt}$). Splinter calculates real-time building shadows, canopy coverage, and microclimate ambient temperatures to generate low-heat, shade-optimized walking routes.

## 2. Core Development Phases

### Phase 1: Astronomical & Shadow Projection Engine (Day 1 Focus)
- [x] Sun position calculation: Astronomical solar azimuth $\\theta_z$ and solar altitude $\\alpha$ for timestamp & lat/long coordinates.
- [x] Vectorized shadow extrusion: Building height extrusion along anti-solar vector $\\vec{v}_{shadow} = \\frac{h}{\\tan(\\alpha)} [-\\sin(\\theta_z), -\\cos(\\theta_z)]$.
- [x] Line-polygon geometric clipping: Calculate percentage overlap of street graph edges with 2D shadow polygons.
- [x] Thermal Edge Cost model: $Cost(e) = Length(e) \\cdot (1 + w_{heat} \\cdot T_{eff} - w_{shade} \\cdot \\text{Coverage})$.

### Phase 2: Graph Construction & Hyperlocal Weather Ingestion
- [x] OpenStreetMap walking network parsing (sidewalks, footways, crosswalks).
- [x] Hyperlocal sensor grid interpolation (ambient $T_{base}$, surface heat island delta $\\Delta T_{surface}$, relative humidity).
- [x] Real-time tree canopy foliage density factor.

### Phase 3: Modified A* Thermal Pathfinding & Multi-Objective Pareto Router
- [x] Dynamic weight factor: User slider between "Fastest Route" and "Coolest / Maximum Shade".
- [x] Segment-level thermal exposure report (Joules absorbed, estimated perceived temperature $T_{perceived}$, shade %).

### Phase 4: Field Testing & Mobile App Packaging
- [ ] Integration with municipal microclimate sensor networks.
- [ ] Offline shadow tile caching for low-bandwidth mobile navigation.
`
  },
  'prd.md': {
    id: 'prd.md',
    name: 'prd.md',
    title: 'Product Requirements Document (PRD)',
    category: 'Requirements',
    icon: '📋',
    lastUpdated: '2026-08-16 10:24:00',
    content: `# Product Requirements Document (PRD): Splinter

## 1. Problem Statement
Urban heat islands can increase street-level temperatures by 5°C–12°C compared to shaded natural corridors. Pedestrians, elderly citizens, delivery workers, and commuters have no navigation tool that accounts for dynamic sun angles, building shadows, and heat vulnerability.

## 2. Target Personas
1. **Urban Pedestrians & Commuters**: Seeking comfortable walking journeys during peak solar radiation (10:00 AM – 5:00 PM).
2. **Vulnerable Populations & Caregivers**: Need routes avoiding direct sun exposure to prevent heat stroke and dehydration.
3. **Urban Planners**: Analyzing sidewalk shade deficits to optimize tree planting and awning installations.

## 3. Core Functional Requirements

### 3.1 Astronomical Solar Tracking
- Accurately compute solar zenith, azimuth, and elevation down to the minute for any WGS84 coordinate.
- Account for day of year, solar declination, and equation of time.

### 3.2 3D Urban Shadow Geometry
- Support building footprint polygons with \`height\` or \`building:levels\` attributes.
- Generate polygon shadows cast onto the ground plane:
  $$\\text{Shadow Length} = \\frac{\\text{Building Height}}{\\tan(\\text{Solar Elevation})}$$
- Support building self-shadowing and overlapping shadow unions.

### 3.3 Dynamic Thermal Edge Weighting
- Compute effective temperature per street segment:
  $$T_{eff} = T_{base} + \\Delta T_{surface} - \\beta_{shade} \\cdot (\\text{Coverage} \\times 100)$$
- Cost calculation penalizes exposed segments during high solar intensity.

### 3.4 Interactive Route Comparison
- Present dual routes:
  1. **Direct Route (Baseline)**: Shortest distance regardless of shade.
  2. **Splinter Cool Route**: Max-shade path with trade-off analysis (e.g., +2 min walking, +68% shade, -4.8°C perceived temp).
`
  },
  'architecture.md': {
    id: 'architecture.md',
    name: 'architecture.md',
    title: 'System Architecture & Mathematical Formulations',
    category: 'Technical',
    icon: '📐',
    lastUpdated: '2026-08-16 10:25:00',
    content: `# System Architecture: Splinter Hyperlocal Thermal Router

## 1. System Pipeline Overview

\`\`\`
[ Timestamp & Lat/Long ] ──> [ Solar Engine (SPA/PSA) ] ──> [ Sun Azimuth & Elevation ]
                                                                       │
                                                                       ▼
[ Building Polygons (OSM) ] ─────────────────────────────> [ 2D Shadow Extruder ]
                                                                       │
                                                                       ▼
[ Hyperlocal Sensors (T_base, RH) ] ─────────────────────> [ Thermal Cost Evaluator ]
                                                                       │
                                                                       ▼
[ Pedestrian Graph Network ] ────────────────────────────> [ Modified A* Router ]
                                                                       │
                                                                       ▼
                                                           [ Cool Route & Exposure Report ]
\`\`\`

## 2. Mathematical Specifications

### 2.1 Solar Position Geometry
For a given latitude $\\phi$, declination $\\delta$, and hour angle $\\omega$:
$$\\sin(\\alpha) = \\sin(\\phi)\\sin(\\delta) + \\cos(\\phi)\\cos(\\delta)\\cos(\\omega)$$
$$\\cos(\\theta_z) = \\frac{\\sin(\\alpha)\\sin(\\phi) - \\sin(\\delta)}{\\cos(\\alpha)\\cos(\\phi)}$$
where $\\alpha$ is solar elevation and $\\theta_z$ is solar azimuth angle.

### 2.2 Shadow Polygon Extrusion
For a building polygon with vertices $V = \\{ (x_i, y_i) \\}$ and height $H$:
$$L_{shadow} = \\frac{H}{\\tan(\\alpha)}$$
$$dx = -L_{shadow} \\cdot \\sin(\\theta_z), \\quad dy = -L_{shadow} \\cdot \\cos(\\theta_z)$$
The extruded shadow polygon is formed by taking the Convex Hull of $V \\cup \\{ (x_i + dx, y_i + dy) \\}$.

### 2.3 Edge Shadow Coverage Fraction
For a pedestrian segment line $L = (P_1, P_2)$ and shadow polygon collection $\\mathcal{S}$:
$$\\text{Coverage}(L, \\mathcal{S}) = \\frac{\\text{Length}(L \\cap \\bigcup S_j)}{\\text{Length}(L)} \\in [0, 1]$$

### 2.4 Thermal Edge Cost Function
$$W(e) = \\text{Dist}(e) \\cdot \\left[ 1.0 + \\lambda_{heat} \\cdot \\max(0, T_{ambient} - 25) \\cdot (1 - \\text{Coverage}(e)) - \\gamma_{bonus} \\cdot \\text{Coverage}(e) \\right]$$
where $\\lambda_{heat} \\approx 0.08$, $\\gamma_{bonus} \\approx 0.25$.
`
  },
  'memory.md': {
    id: 'memory.md',
    name: 'memory.md',
    title: 'Session Memory & Knowledge Journal',
    category: 'State',
    icon: '🧠',
    lastUpdated: '2026-08-16 10:25:30',
    content: `# Session Memory Journal: Splinter

## Active Session: \`ACTIVE_SESSION_03\`
- **Task ID**: \`task_e_6a809a7420ac8325a91c1e9b50cdb6ad\`
- **Repository**: \`https://github.com/apexzeuss/Splinter-\`
- **Target Goal**: Build AI for Hyperlocal Temperature Solutions & Shadow Calculation Routing Engine

## Key Directives
1. Maintain mathematical rigor in shadow extrusion and solar vectoring.
2. Provide real-time interactive simulation of sun trajectory, building shadow projection, and A* thermal path comparison.
3. Ensure modularity across:
   - Solar coordinate calculators
   - 2D/3D shadow projection modules
   - Segment thermal cost evaluation
   - Multi-path pedestrian graph routing
`
  },
  'handoff.md': {
    id: 'handoff.md',
    name: 'handoff.md',
    title: 'Handoff Specification & Current Action State',
    category: 'Execution',
    icon: '📍',
    lastUpdated: '2026-08-16 10:25:40',
    content: `# Handoff Specification

## Current Status: Day 1 Focus
The repository initiates with the **shadow-calculation and thermal routing module** because routing quality depends directly on believable shade estimates.

## Completed Items
- [x] Sun position computation algorithm (coordinate + timestamp)
- [x] Building shadow projection from height + sun geometry
- [x] Route segment shadow overlap fraction estimation
- [x] Base temperature + solar penalty + shade bonus edge cost synthesis

## Active Next Tasks
- [x] Implement interactive visual shadow simulator & pedestrian map canvas
- [ ] Connect live time-of-day solar slider (8:00 AM to 6:00 PM) to inspect dynamic shadow movements
- [ ] Multi-point pathfinder comparison (Direct vs. Splinter Cool Route)
- [ ] Temperature microclimate sensor heatmap overlay
`
  }
};

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    text: 'Sun position calculation (Azimuth & Elevation)',
    category: 'Core',
    completed: true,
    priority: 'high',
    assignee: 'Splinter Core',
    notes: 'Compute solar zenith, declination, and azimuth from lat/lon & timestamp.'
  },
  {
    id: 'task-2',
    text: 'Building shadow 2D/3D polygon extrusion',
    category: 'Pipeline',
    completed: true,
    priority: 'high',
    assignee: 'Geometry Engine',
    notes: 'Vectorized height extrusion along anti-solar angle.'
  },
  {
    id: 'task-3',
    text: 'Route segment shadow coverage estimation',
    category: 'Pipeline',
    completed: true,
    priority: 'high',
    assignee: 'Spatial Intersector',
    notes: 'Line-segment clipping against building shadow polygons.'
  },
  {
    id: 'task-4',
    text: 'Thermal edge cost synthesis (T_base + solar penalty - shade bonus)',
    category: 'Core',
    completed: true,
    priority: 'high',
    assignee: 'Thermal Evaluator',
    notes: 'Calculates walking impedance based on Mean Radiant Heat.'
  },
  {
    id: 'task-5',
    text: 'Modified A* pedestrian router with shade preference weight',
    category: 'Pipeline',
    completed: false,
    priority: 'medium',
    assignee: 'Pathfinder',
    notes: 'Compare baseline shortest path vs. optimal cool route.'
  },
  {
    id: 'task-6',
    text: 'Unit test suite with synthetic urban canyons',
    category: 'Tests',
    completed: false,
    priority: 'medium',
    assignee: 'QA',
    notes: 'Validate shadow projection accuracy against known NOAA solar tables.'
  }
];

export const INITIAL_DIRECTIVES: ArchitectureDirective[] = [
  {
    id: 'dir-1',
    title: 'Solar Geometry Vectorization',
    description: 'Calculate solar elevation and azimuth continuously based on timestamp and geographic coordinate without external API dependency.',
    sectionRef: 'architecture.md §2.1',
    status: 'compliant',
    tags: ['Solar Trigonometry', 'Deterministic', 'WGS84']
  },
  {
    id: 'dir-2',
    title: 'Building Shadow Extrusion',
    description: 'Extrude building footprints by height / tan(elevation) in the anti-solar direction and union overlapping polygon shadows.',
    sectionRef: 'architecture.md §2.2',
    status: 'compliant',
    tags: ['Shadow Projection', 'Convex Hull', '2D Geometry']
  },
  {
    id: 'dir-3',
    title: 'Thermal Edge Cost Synthesis',
    description: 'Combine base ambient temperature, solar exposure penalty, and shade bonus into unified edge impedance for pedestrian graph traversal.',
    sectionRef: 'architecture.md §2.4',
    status: 'compliant',
    tags: ['Microclimate', 'Impedance Cost', 'Thermal Comfort']
  },
  {
    id: 'dir-4',
    title: 'A* Multi-Objective Routing',
    description: 'Provide an adjustable comfort-vs-distance weight factor allowing users to choose between the fastest direct route and the coolest shaded path.',
    sectionRef: 'prd.md §3.4',
    status: 'in-progress',
    tags: ['A* Graph', 'Pareto Routing', 'Pedestrian UX']
  }
];

export const INITIAL_NODES: SplinterNode[] = [
  {
    id: 'node-solar-geom',
    name: 'Solar Position Calculator',
    type: 'processor',
    status: 'active',
    latencyMs: 1.2,
    processedCount: 14200,
    errorRate: 0.0,
    config: {
      algorithm: 'NOAA Solar Equations / SPA',
      updateFrequencySec: 10,
      precisionDecimal: 4
    }
  },
  {
    id: 'node-shadow-proj',
    name: '3D Building Shadow Extruder',
    type: 'processor',
    status: 'active',
    latencyMs: 4.8,
    processedCount: 14200,
    errorRate: 0.0,
    config: {
      maxExtrusionMeters: 250,
      groundPlaneElevation: 0,
      clipOverlaps: true
    }
  },
  {
    id: 'node-segment-clipper',
    name: 'Route Segment Shadow Clipper',
    type: 'processor',
    status: 'active',
    latencyMs: 8.5,
    processedCount: 8400,
    errorRate: 0.0,
    config: {
      samplingStepMeters: 2.0,
      bufferMeters: 1.5
    }
  },
  {
    id: 'node-thermal-cost',
    name: 'Thermal Edge Cost Evaluator',
    type: 'processor',
    status: 'active',
    latencyMs: 3.1,
    processedCount: 8400,
    errorRate: 0.0,
    config: {
      heatPenaltyFactor: 0.08,
      shadeBonusFactor: 0.25,
      baseTempThreshold: 25.0
    }
  },
  {
    id: 'node-astar-router',
    name: 'Pedestrian A* Pathfinder',
    type: 'rag-engine',
    status: 'active',
    latencyMs: 14.2,
    processedCount: 1250,
    errorRate: 0.0,
    config: {
      heuristic: 'Euclidean with Thermal Multiplier',
      maxDetourRatio: 1.5,
      shadePreferenceWeight: 0.8
    }
  }
];

export const INITIAL_SCENARIOS: SimulationScenario[] = [
  {
    id: 'downtown-noon',
    name: 'Downtown Financial District (12:30 PM)',
    city: 'Phoenix / Austin Metropolis',
    baseTemperatureC: 38.5,
    relativeHumidity: 22,
    timeOfDay: '12:30',
    solarElevationDeg: 78.4,
    solarAzimuthDeg: 172.1,
    buildingsCount: 18,
    summary: 'High noon sun angle; short shadows on narrow east-west canyons with extreme solar irradiation.'
  },
  {
    id: 'mid-afternoon',
    name: 'Mid-Afternoon Commute (3:45 PM)',
    city: 'Phoenix / Austin Metropolis',
    baseTemperatureC: 41.2,
    relativeHumidity: 18,
    timeOfDay: '15:45',
    solarElevationDeg: 42.1,
    solarAzimuthDeg: 242.8,
    buildingsCount: 18,
    summary: 'Long eastward building shadows offering major thermal relief along north-south avenues.'
  },
  {
    id: 'morning-rush',
    name: 'Morning Walk (9:15 AM)',
    city: 'Phoenix / Austin Metropolis',
    baseTemperatureC: 32.0,
    relativeHumidity: 35,
    timeOfDay: '09:15',
    solarElevationDeg: 34.6,
    solarAzimuthDeg: 104.2,
    buildingsCount: 18,
    summary: 'Deep shadows cast westward across broad boulevards.'
  }
];

export const SAMPLE_BUILDINGS = [
  { id: 'b1', name: 'Atlas Tower', x: 120, y: 100, width: 90, height: 75, buildingHeightM: 65, color: '#334155' },
  { id: 'b2', name: 'Horizon Plaza', x: 270, y: 90, width: 110, height: 85, buildingHeightM: 85, color: '#334155' },
  { id: 'b3', name: 'Civic Center', x: 440, y: 110, width: 130, height: 65, buildingHeightM: 45, color: '#334155' },
  { id: 'b4', name: 'Metroplex East', x: 630, y: 95, width: 85, height: 90, buildingHeightM: 55, color: '#334155' },
  { id: 'b5', name: 'Meridian Heights', x: 130, y: 240, width: 80, height: 100, buildingHeightM: 70, color: '#334155' },
  { id: 'b6', name: 'Grand Galleria', x: 280, y: 250, width: 100, height: 80, buildingHeightM: 50, color: '#334155' },
  { id: 'b7', name: 'Solaris Center', x: 450, y: 240, width: 115, height: 95, buildingHeightM: 95, color: '#334155' },
  { id: 'b8', name: 'Crestline Tower', x: 625, y: 255, width: 95, height: 85, buildingHeightM: 60, color: '#334155' },
  { id: 'b9', name: 'Parkview Suites', x: 120, y: 410, width: 95, height: 75, buildingHeightM: 40, color: '#334155' },
  { id: 'b10', name: 'Tech Hub Quad', x: 275, y: 400, width: 110, height: 90, buildingHeightM: 75, color: '#334155' },
  { id: 'b11', name: 'Foundry Square', x: 455, y: 415, width: 105, height: 70, buildingHeightM: 35, color: '#334155' },
  { id: 'b12', name: 'Onyx Corporate', x: 635, y: 405, width: 80, height: 85, buildingHeightM: 80, color: '#334155' }
];

export const SAMPLE_TREES = [
  { id: 't1', x: 95, y: 210, radius: 14, species: 'Live Oak Canopy', foliageDensity: 0.85 },
  { id: 't2', x: 255, y: 210, radius: 16, species: 'Desert Willow', foliageDensity: 0.75 },
  { id: 't3', x: 425, y: 210, radius: 15, species: 'Sycamore', foliageDensity: 0.90 },
  { id: 't4', x: 610, y: 210, radius: 15, species: 'London Plane', foliageDensity: 0.80 },
  { id: 't5', x: 255, y: 360, radius: 16, species: 'Live Oak Canopy', foliageDensity: 0.88 },
  { id: 't6', x: 425, y: 360, radius: 18, species: 'Elm Colonnade', foliageDensity: 0.92 },
  { id: 't7', x: 610, y: 360, radius: 14, species: 'Palo Verde', foliageDensity: 0.70 }
];

/**
 * Simulator city presets.
 *
 * `utcOffsetHours` is the offset in effect during the local hot season, which is
 * what this app is used for. DST transitions are not modelled — a live GPS or
 * searched location takes its real offset from Open-Meteo's `utc_offset_seconds`
 * instead. `urbanHeatIslandPenaltyC` is a published reference figure for the
 * city, not something this app measures.
 */
export const CITY_PRESETS: CityPreset[] = [
  { id: 'phoenix', name: 'Phoenix, AZ (33.4°N)', latitude: 33.4484, longitude: -112.074, timezone: 'MST', utcOffsetHours: -7, typicalSummerHighC: 43.5, urbanHeatIslandPenaltyC: 5.4 },
  { id: 'las-vegas', name: 'Las Vegas, NV (36.2°N)', latitude: 36.1699, longitude: -115.1398, timezone: 'PDT', utcOffsetHours: -7, typicalSummerHighC: 42.0, urbanHeatIslandPenaltyC: 5.0 },
  { id: 'austin', name: 'Austin, TX (30.3°N)', latitude: 30.2672, longitude: -97.7431, timezone: 'CDT', utcOffsetHours: -5, typicalSummerHighC: 39.0, urbanHeatIslandPenaltyC: 4.2 },
  { id: 'seville', name: 'Seville, Spain (37.4°N)', latitude: 37.3891, longitude: -5.9845, timezone: 'CEST', utcOffsetHours: 2, typicalSummerHighC: 41.0, urbanHeatIslandPenaltyC: 4.8 },
  { id: 'dubai', name: 'Dubai, UAE (25.2°N)', latitude: 25.2048, longitude: 55.2708, timezone: 'GST', utcOffsetHours: 4, typicalSummerHighC: 45.0, urbanHeatIslandPenaltyC: 6.1 },
  { id: 'singapore', name: 'Singapore (1.4°N)', latitude: 1.3521, longitude: 103.8198, timezone: 'SGT', utcOffsetHours: 8, typicalSummerHighC: 33.0, urbanHeatIslandPenaltyC: 4.5 },
  { id: 'tokyo', name: 'Tokyo, Japan (35.7°N)', latitude: 35.6762, longitude: 139.6503, timezone: 'JST', utcOffsetHours: 9, typicalSummerHighC: 35.0, urbanHeatIslandPenaltyC: 3.9 }
];

export const THERMAL_SCENARIOS = [
  {
    id: 'heat-dome',
    title: 'Extreme Heat Dome (44.5°C / 14:30)',
    timeMinutes: 870,
    tempC: 44.5,
    cityId: 'phoenix',
    description: 'Dangerous asphalt re-radiation canyon. Maximizes shade priority.'
  },
  {
    id: 'solar-noon',
    title: 'Solar Noon Zenith (13:00 / 84° Sun)',
    timeMinutes: 780,
    tempC: 38.0,
    cityId: 'austin',
    description: 'Overhead sun casts shortest shadows. Routes strictly under dense tree canopies.'
  },
  {
    id: 'afternoon-rush',
    title: 'Late Afternoon Commute (16:45 / Low Sun)',
    timeMinutes: 1005,
    tempC: 36.5,
    cityId: 'seville',
    description: 'Long horizontal shadows from west towers create extended continuous shade alleys.'
  }
];

export const IOT_SENSOR_STATIONS = [
  { id: 's-1', name: 'Plaza Solar Sensor #1', x: 180, y: 150, currentTempC: 45.2, humidityPct: 18, solarIrradianceWm2: 980 },
  { id: 's-2', name: 'Oak Arcade Microclimate #2', x: 240, y: 360, currentTempC: 33.1, humidityPct: 34, solarIrradianceWm2: 120 },
  { id: 's-3', name: '5th Ave Asphalt Station #3', x: 760, y: 300, currentTempC: 48.6, humidityPct: 14, solarIrradianceWm2: 1040 }
];

export const INITIAL_LOGS = [
  {
    id: 'log-1',
    timestamp: '10:25:20.104',
    level: 'info' as const,
    source: 'SYSTEM',
    message: 'Splinter Pedestrian Thermal Router initialized (Session: ACTIVE_SESSION_03)'
  },
  {
    id: 'log-2',
    timestamp: '10:25:20.215',
    level: 'success' as const,
    source: 'SOLAR_ENGINE',
    message: 'Astronomical sun geometry calculated: Azimuth = 242.8°, Elevation = 42.1°'
  },
  {
    id: 'log-3',
    timestamp: '10:25:20.350',
    level: 'info' as const,
    source: 'SHADOW_EXTRUDER',
    message: 'Extruded 12 3D building shadow polygons. Anti-solar vector computed.'
  },
  {
    id: 'log-4',
    timestamp: '10:25:20.480',
    level: 'success' as const,
    source: 'ROUTER',
    message: 'Calculated baseline vs. cool shaded route: +74% shade coverage, -5.2°C perceived heat.'
  }
];

export const SAMPLE_CHUNKS = [
  {
    id: 'chk-001',
    docId: 'architecture.md',
    docName: 'architecture.md',
    chunkIndex: 1,
    title: 'Shadow Polygon Extrusion Geometry',
    text: 'Building heights are extruded along the anti-solar vector L_shadow = H / tan(elevation) with dx = -L_shadow * sin(azimuth) and dy = -L_shadow * cos(azimuth).',
    sha256: '9f83a8b2...4d7e21',
    similarity: 0.94,
    tags: ['Shadow Geometry', 'Trigonometry', '2D Extrusion']
  },
  {
    id: 'chk-002',
    docId: 'project-plan.md',
    docName: 'project-plan.md',
    chunkIndex: 2,
    title: 'Thermal Edge Cost Model',
    text: 'Cost(e) = Length(e) * [1 + w_heat * max(0, T_ambient - 25) * (1 - Coverage) - w_shade * Coverage], providing realistic pedestrian thermal impedance.',
    sha256: '1a72d3f4...8b90c1',
    similarity: 0.91,
    tags: ['A* Router', 'Thermal Cost', 'Impedance']
  },
  {
    id: 'chk-003',
    docId: 'prd.md',
    docName: 'prd.md',
    chunkIndex: 1,
    title: 'Solar Position Astronomical Tracking',
    text: 'Real-time solar zenith, azimuth, and elevation calculated down to the minute using solar declination and equation of time.',
    sha256: 'e5b98a33...21f044',
    similarity: 0.88,
    tags: ['Solar Engine', 'NOAA', 'Astronomy']
  }
];
