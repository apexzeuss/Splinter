/**
 * Planar geometry primitives for the simulator canvas.
 *
 * Everything here works in SVG pixel space. METERS_PER_PX is the single place
 * that converts to real-world units — previously the simulator used 1.4 m/px for
 * route distances and a separate 0.82 factor for shadow lengths, so the two were
 * dimensionally inconsistent with each other.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/**
 * Scale of the simulator canvas: one SVG pixel is this many metres.
 *
 * The canvas is 850x550 px, so it depicts roughly 1190 x 770 m — about eight
 * downtown blocks, which matches the street grid drawn on it.
 */
export const METERS_PER_PX = 1.4;

export const pxToM = (px: number): number => px * METERS_PER_PX;
export const mToPx = (m: number): number => m / METERS_PER_PX;

export const distancePx = (a: Pt, b: Pt): number => Math.hypot(b.x - a.x, b.y - a.y);
export const distanceM = (a: Pt, b: Pt): number => pxToM(distancePx(a, b));

/**
 * Convex hull by Andrew's monotone chain, returned counter-clockwise without a
 * duplicated closing vertex.
 *
 * architecture.md section 2.4 specifies the shadow polygon as
 * ConvexHull(V union V_projected). The previous code emitted a fixed six-vertex
 * ring instead, which self-intersects once the sun moves out of one quadrant —
 * that both rendered wrong and made point-in-polygon tests meaningless.
 */
export function convexHull(points: Pt[]): Pt[] {
  // Deduplicate, otherwise a zero-length shadow collapses the hull.
  const seen = new Set<string>();
  const pts: Pt[] = [];
  for (const p of points) {
    const key = `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pts.push(p);
  }

  if (pts.length < 3) return pts;

  pts.sort((a, b) => a.x - b.x || a.y - b.y);

  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);

  // Degenerate input (all points collinear) can leave fewer than 3 vertices.
  return hull.length >= 3 ? hull : pts;
}

/** Ray-casting point-in-polygon. Polygon is an implicitly closed vertex ring. */
export function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  if (poly.length < 3) return false;

  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const { x: xi, y: yi } = poly[i];
    const { x: xj, y: yj } = poly[j];
    const straddles = yi > p.y !== yj > p.y;
    if (straddles && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInCircle(p: Pt, c: Circle): boolean {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

/** Georeferencing anchor: which real coordinate a given canvas pixel sits at. */
export interface GeoAnchor {
  latitude: number;
  longitude: number;
  originPx: Pt;
}

const METERS_PER_DEG_LAT = 111_320;

/**
 * Project a canvas pixel to [longitude, latitude] for GeoJSON export.
 *
 * An equirectangular approximation, which is accurate enough over a canvas
 * covering about a kilometre. The street grid itself is synthetic — this only
 * makes the exported file well-formed and positioned near the selected city,
 * rather than emitting raw pixel pairs into a `coordinates` array as before.
 */
export function canvasToLngLat(p: Pt, anchor: GeoAnchor): [number, number] {
  const eastM = pxToM(p.x - anchor.originPx.x);
  const southM = pxToM(p.y - anchor.originPx.y);

  const latitude = anchor.latitude - southM / METERS_PER_DEG_LAT;
  const metersPerDegLng =
    METERS_PER_DEG_LAT * Math.cos((anchor.latitude * Math.PI) / 180);
  const longitude =
    anchor.longitude + (metersPerDegLng === 0 ? 0 : eastM / metersPerDegLng);

  return [longitude, latitude];
}

export interface ShadeGeometry {
  /** Building shadow polygons. */
  polygons: Pt[][];
  /** Tree canopy shadow ellipses, approximated as circles. */
  circles: Circle[];
}

/** Whether a single point falls inside any shadow. */
export function isShaded(p: Pt, shade: ShadeGeometry): boolean {
  return (
    shade.polygons.some((poly) => pointInPolygon(p, poly)) ||
    shade.circles.some((c) => pointInCircle(p, c))
  );
}

/**
 * Fraction of segment [a, b] that falls inside any shadow, in [0, 1].
 *
 * This is architecture.md section 2.3's
 *   Coverage(E) = Length(E intersect union(S)) / Length(E)
 * evaluated by uniform sampling rather than exact line clipping. Sampling at
 * midpoints avoids double-counting the endpoints, and the union is handled for
 * free because a sample only ever counts once no matter how many shadows overlap
 * it. At the default 64 samples the error on a 200 px edge is under 2 px.
 */
export function shadedFraction(
  a: Pt,
  b: Pt,
  shade: ShadeGeometry,
  samples = 64,
): number {
  if (samples < 1) return 0;

  let covered = 0;
  for (let i = 0; i < samples; i++) {
    const t = (i + 0.5) / samples;
    const p: Pt = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (isShaded(p, shade)) covered++;
  }
  return covered / samples;
}
