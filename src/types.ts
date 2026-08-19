export interface UserCoords {
  lat: number;
  lng: number;
  city: string;
  tempC: number;
  /**
   * True only when lat/lng came from GPS, IP lookup or an explicit user choice.
   * The built-in default must set this false — the footer and header render a
   * "live" state from it, and they previously claimed live GPS while showing
   * hardcoded Phoenix coordinates.
   */
  isLive: boolean;
  source: 'GPS' | 'IP' | 'MANUAL' | 'DEFAULT';
  /** Real local UTC offset when known, e.g. from Open-Meteo's utc_offset_seconds. */
  utcOffsetHours?: number;
}

export type DocId = 'README.md' | 'project-plan.md' | 'prd.md' | 'architecture.md' | 'memory.md' | 'handoff.md';

export interface ProjectDoc {
  id: DocId;
  name: string;
  title: string;
  category: 'Strategic' | 'Requirements' | 'Technical' | 'State' | 'Execution';
  icon: string;
  lastUpdated: string;
  content: string;
}

export interface TaskItem {
  id: string;
  text: string;
  category: 'Verification' | 'Core' | 'Auth' | 'Memory' | 'Pipeline' | 'Tests';
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  notes?: string;
}

export interface ArchitectureDirective {
  id: string;
  title: string;
  description: string;
  sectionRef: string;
  status: 'compliant' | 'in-progress' | 'review';
  tags: string[];
}

export interface SplinterNode {
  id: string;
  name: string;
  type: 'source' | 'processor' | 'embedder' | 'vectordb' | 'rag-engine' | 'auth';
  status: 'active' | 'idle' | 'syncing' | 'error';
  latencyMs: number;
  processedCount: number;
  errorRate: number;
  config: Record<string, string | number | boolean>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  city: string;
  baseTemperatureC: number;
  relativeHumidity: number;
  timeOfDay: string;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  buildingsCount: number;
  summary: string;
}

export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buildingHeightM: number;
  color?: string;
}

export interface Tree {
  id: string;
  x: number;
  y: number;
  radius: number;
  species: string;
  foliageDensity: number; // 0 to 1
}

export interface CityPreset {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  typicalSummerHighC: number;
  /** Published urban-core-vs-rural heat delta. Reference figure, not measured here. */
  urbanHeatIslandPenaltyC?: number;
  /** Real local UTC offset when known; otherwise estimated from longitude. */
  utcOffsetHours?: number;
}

export interface Waypoint {
  id: 'start' | 'end';
  label: string;
  x: number;
  y: number;
  streetName: string;
}

export interface TurnInstruction {
  id: string;
  instruction: string;
  distanceMeters: number;
  /** Measured against the current shadow geometry, not assumed. */
  shadePercent: number;
  /** Simplified exposure-weighted temperature. See router.ts effectiveTempC. */
  effectiveTempC: number;
  /** Name of the graph node this leg ends at. */
  toNodeName: string;
}

/**
 * Route statistics. Every field is derived from the graph and the current
 * shadow geometry.
 *
 * Fields deliberately absent, because the app has no basis for them:
 * meanRadiantTempC, perceivedTempC, thermalDiscomfortIndex and
 * estimatedSweatLossMl. Those were presented as physiological measurements but
 * were linear guesses off a single input, and sweat loss was literally
 * `(perceivedTemp / 30) * 480`. Reinstate them only alongside a real UTCI or PET
 * implementation with wind and humidity inputs.
 */
export interface RouteStats {
  distanceMeters: number;
  walkingTimeMin: number;
  shadeCoveragePercent: number;
  /** Simplified exposure-weighted temperature. Not MRT, PET or UTCI. */
  effectiveTempC: number;
  /** Clear-sky estimate from solar elevation, not a measurement. */
  uvIndexEstimate: number;
  steps: TurnInstruction[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}
