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
  shadePercent: number;
  tempC: number;
  landmark: string;
}

export interface RouteStats {
  distanceMeters: number;
  walkingTimeMin: number;
  shadeCoveragePercent: number;
  meanRadiantTempC: number;
  perceivedTempC: number;
  thermalDiscomfortIndex: number;
  uvIndex: number;
  estimatedSweatLossMl: number;
  steps: TurnInstruction[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: string;
  message: string;
}
