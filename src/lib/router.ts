/**
 * Pedestrian thermal router.
 *
 * Implements architecture.md sections 2.3 and 2.4: a real sidewalk graph, real
 * per-edge shade coverage, the documented thermal edge cost, and Dijkstra over
 * both a distance objective and a thermal objective.
 *
 * This replaces two hardcoded polyline string literals that were selected by
 * `if (solarAzimuthDeg > 180)`, and shade percentages that were computed from
 * solar elevation alone with no reference to the shadows actually on screen.
 */

import { Pt, ShadeGeometry, distanceM, shadedFraction } from './geometry';
import { RouteStats, TurnInstruction } from '../types';

export interface GraphNode extends Pt {
  id: string;
  name: string;
}

export interface NodePair {
  fromId: string;
  toId: string;
}

export interface WeightedEdge extends NodePair {
  lengthM: number;
  /** Fraction of this edge lying in shadow, in [0, 1]. */
  coverage: number;
}

/** Pedestrian pace, about 4.8 km/h. */
export const WALKING_SPEED_M_PER_MIN = 80;

/**
 * Weights for the thermal edge cost, per architecture.md section 2.4.
 *
 * `minMultiplier` is not in the spec but is required in practice: Dijkstra needs
 * non-negative edge costs, and a sufficiently large `shade` bonus relative to
 * the heat penalty can drive the multiplier negative on a fully shaded edge.
 */
export interface ThermalWeights {
  heat: number;
  shade: number;
  minMultiplier: number;
}

export const DEFAULT_THERMAL_WEIGHTS: ThermalWeights = {
  heat: 0.08,
  shade: 0.35,
  minMultiplier: 0.05,
};

/**
 * Uplift over ambient on a fully exposed surface with the sun directly overhead.
 *
 * This is a calibration constant for the simplified model below, not a measured
 * quantity.
 */
export const MAX_RADIANT_UPLIFT_C = 15;

/**
 * Simplified exposure-weighted temperature.
 *
 * Ambient plus a solar uplift that scales with sin(elevation) — direct beam
 * irradiance on a horizontal surface is proportional to it — attenuated by shade
 * coverage.
 *
 * This is deliberately NOT Mean Radiant Temperature, PET or UTCI. Those need
 * wind speed, humidity, surface albedo, longwave exchange and a body model, none
 * of which this app has. Earlier versions of the UI labelled numbers from a
 * formula of this kind as "MRT" and "UTCI"; they were never either.
 */
export function effectiveTempC(
  ambientC: number,
  coverage: number,
  solarElevationDeg: number,
): number {
  if (solarElevationDeg <= 0) return ambientC;
  const beamFactor = Math.sin((solarElevationDeg * Math.PI) / 180);
  return ambientC + MAX_RADIANT_UPLIFT_C * beamFactor * (1 - coverage);
}

/** Thermal cost multiplier for one edge, per architecture.md section 2.4. */
export function thermalCostMultiplier(
  coverage: number,
  ambientC: number,
  weights: ThermalWeights = DEFAULT_THERMAL_WEIGHTS,
): number {
  const heatLoad = Math.max(0, ambientC - 25);
  const raw = 1 + weights.heat * heatLoad * (1 - coverage) - weights.shade * coverage;
  return Math.max(weights.minMultiplier, raw);
}

/**
 * Connect each node to its orthogonal neighbours on the street grid.
 *
 * Nodes sharing a y coordinate are linked along their row, nodes sharing an x
 * coordinate along their column. The previous code declared the node list but
 * never built any edges, so there was no graph to search.
 */
export function buildSidewalkEdges(nodes: GraphNode[]): NodePair[] {
  const pairs: NodePair[] = [];

  const groupBy = (key: (n: GraphNode) => number): GraphNode[][] => {
    const groups = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      const k = key(n);
      const existing = groups.get(k);
      if (existing) existing.push(n);
      else groups.set(k, [n]);
    }
    return [...groups.values()];
  };

  for (const row of groupBy((n) => n.y)) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      pairs.push({ fromId: row[i - 1].id, toId: row[i].id });
    }
  }

  for (const col of groupBy((n) => n.x)) {
    col.sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i++) {
      pairs.push({ fromId: col[i - 1].id, toId: col[i].id });
    }
  }

  return pairs;
}

/** Measure length and shade coverage for every edge against the current shadows. */
export function weightEdges(
  nodes: GraphNode[],
  pairs: NodePair[],
  shade: ShadeGeometry,
  samplesPerEdge = 64,
): WeightedEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: WeightedEdge[] = [];

  for (const pair of pairs) {
    const a = byId.get(pair.fromId);
    const b = byId.get(pair.toId);
    if (!a || !b) continue;

    edges.push({
      ...pair,
      lengthM: distanceM(a, b),
      coverage: shadedFraction(a, b, shade, samplesPerEdge),
    });
  }

  return edges;
}

/**
 * Dijkstra over the undirected sidewalk graph.
 *
 * O(n^2) selection rather than a heap: the grid is 20 nodes, and the simpler
 * implementation is easier to keep correct. Returns [] when no path exists.
 */
export function shortestPath(
  nodes: GraphNode[],
  edges: WeightedEdge[],
  startId: string,
  endId: string,
  edgeCost: (edge: WeightedEdge) => number,
): GraphNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (!byId.has(startId) || !byId.has(endId)) return [];
  if (startId === endId) {
    const only = byId.get(startId);
    return only ? [only] : [];
  }

  const adjacency = new Map<string, WeightedEdge[]>();
  const link = (id: string, edge: WeightedEdge) => {
    const existing = adjacency.get(id);
    if (existing) existing.push(edge);
    else adjacency.set(id, [edge]);
  };
  for (const e of edges) {
    link(e.fromId, e);
    link(e.toId, { ...e, fromId: e.toId, toId: e.fromId });
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  for (const n of nodes) dist.set(n.id, Number.POSITIVE_INFINITY);
  dist.set(startId, 0);

  for (;;) {
    let currentId = '';
    let currentDist = Number.POSITIVE_INFINITY;
    for (const n of nodes) {
      if (visited.has(n.id)) continue;
      const d = dist.get(n.id) ?? Number.POSITIVE_INFINITY;
      if (d < currentDist) {
        currentDist = d;
        currentId = n.id;
      }
    }

    if (currentId === '' || currentDist === Number.POSITIVE_INFINITY) break;
    if (currentId === endId) break;
    visited.add(currentId);

    for (const edge of adjacency.get(currentId) ?? []) {
      if (visited.has(edge.toId)) continue;
      const candidate = currentDist + edgeCost(edge);
      if (candidate < (dist.get(edge.toId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.toId, candidate);
        prev.set(edge.toId, currentId);
      }
    }
  }

  if ((dist.get(endId) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) return [];

  const path: GraphNode[] = [];
  let cursor: string | undefined = endId;
  while (cursor !== undefined) {
    const node = byId.get(cursor);
    if (!node) break;
    path.unshift(node);
    if (cursor === startId) break;
    cursor = prev.get(cursor);
  }

  return path.length > 0 && path[0].id === startId ? path : [];
}

/** Shortest path by geometric distance only. */
export function distanceRoute(
  nodes: GraphNode[],
  edges: WeightedEdge[],
  startId: string,
  endId: string,
): GraphNode[] {
  return shortestPath(nodes, edges, startId, endId, (e) => e.lengthM);
}

/** Shortest path by the thermal edge cost. */
export function thermalRoute(
  nodes: GraphNode[],
  edges: WeightedEdge[],
  startId: string,
  endId: string,
  ambientC: number,
  weights: ThermalWeights = DEFAULT_THERMAL_WEIGHTS,
): GraphNode[] {
  return shortestPath(
    nodes,
    edges,
    startId,
    endId,
    (e) => e.lengthM * thermalCostMultiplier(e.coverage, ambientC, weights),
  );
}

type Heading = 'north' | 'south' | 'east' | 'west';

const headingOf = (a: Pt, b: Pt): Heading => {
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) return b.x > a.x ? 'east' : 'west';
  // SVG y grows downward, so a larger y is further south.
  return b.y > a.y ? 'south' : 'north';
};

/** SVG `points` attribute for a path. */
export function polylinePoints(path: GraphNode[]): string {
  return path.map((n) => `${n.x},${n.y}`).join(' ');
}

/**
 * Real statistics for a path: length-weighted mean coverage, walking time, and
 * turn-by-turn legs derived from actual heading changes.
 *
 * Every number here is computed from the path and the current shadow geometry.
 * Nothing is a literal.
 */
export function summarisePath(
  path: GraphNode[],
  edges: WeightedEdge[],
  conditions: { ambientC: number; solarElevationDeg: number; uvIndexEstimate: number },
): RouteStats {
  const empty: RouteStats = {
    distanceMeters: 0,
    walkingTimeMin: 0,
    shadeCoveragePercent: 0,
    effectiveTempC: conditions.ambientC,
    uvIndexEstimate: conditions.uvIndexEstimate,
    steps: [],
  };
  if (path.length < 2) return empty;

  const coverageOf = (fromId: string, toId: string): number => {
    const edge = edges.find(
      (e) =>
        (e.fromId === fromId && e.toId === toId) || (e.fromId === toId && e.toId === fromId),
    );
    return edge ? edge.coverage : 0;
  };

  interface Leg {
    heading: Heading;
    lengthM: number;
    shadedM: number;
    toNode: GraphNode;
  }

  const legs: Leg[] = [];
  let totalM = 0;
  let totalShadedM = 0;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const lengthM = distanceM(a, b);
    const coverage = coverageOf(a.id, b.id);
    const shadedM = lengthM * coverage;
    const heading = headingOf(a, b);

    totalM += lengthM;
    totalShadedM += shadedM;

    const last = legs[legs.length - 1];
    if (last && last.heading === heading) {
      last.lengthM += lengthM;
      last.shadedM += shadedM;
      last.toNode = b;
    } else {
      legs.push({ heading, lengthM, shadedM, toNode: b });
    }
  }

  if (totalM === 0) return empty;

  const meanCoverage = totalShadedM / totalM;

  const steps: TurnInstruction[] = legs.map((leg, index) => {
    const legCoverage = leg.lengthM > 0 ? leg.shadedM / leg.lengthM : 0;
    const verb = index === 0 ? 'Head' : 'Turn';
    const arriving = index === legs.length - 1 ? ' and arrive' : '';
    return {
      id: `leg-${index}`,
      instruction: `${verb} ${leg.heading}${arriving} to ${leg.toNode.name}`,
      distanceMeters: Math.round(leg.lengthM),
      shadePercent: Math.round(legCoverage * 100),
      effectiveTempC:
        Math.round(
          effectiveTempC(conditions.ambientC, legCoverage, conditions.solarElevationDeg) * 10,
        ) / 10,
      toNodeName: leg.toNode.name,
    };
  });

  return {
    distanceMeters: Math.round(totalM),
    walkingTimeMin: Math.round((totalM / WALKING_SPEED_M_PER_MIN) * 10) / 10,
    shadeCoveragePercent: Math.round(meanCoverage * 100),
    effectiveTempC:
      Math.round(
        effectiveTempC(conditions.ambientC, meanCoverage, conditions.solarElevationDeg) * 10,
      ) / 10,
    uvIndexEstimate: conditions.uvIndexEstimate,
    steps,
  };
}
