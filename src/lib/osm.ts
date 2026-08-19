/**
 * OpenStreetMap data fetching and parsing.
 *
 * Implements the first part of handoff.md's Priority 1: connecting the
 * simulator to live OpenStreetMap data via the Overpass API. This allows the
 * app to move from a synthetic grid to real-world geometry.
 *
 * Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import { Pt, GeoAnchor } from './geometry';

/** A building footprint fetched from OSM, with its vertices in pixels. */
export interface OsmBuilding {
  id: number;
  footprint: Pt[];
  // OSM buildings often have a 'height' or 'building:levels' tag, but coverage
  // is sparse. We will need a fallback strategy for missing height data.
  heightM?: number;
}

/**
 * Fetches building footprints for a given coordinate bounding box.
 *
 * @param bbox The [min_lon, min_lat, max_lon, max_lat] bounding box.
 * @returns A promise that resolves to the raw Overpass API JSON response.
 */
export async function fetchOsmData(bbox: [number, number, number, number]): Promise<any> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const query = `
    [out:json][timeout:25];
    (
      way"building";
    );
    out body;
    >;
    out skel qt;
  `;

  const endpoint = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Overpass API query failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * (Placeholder) Parses raw Overpass JSON into an array of building objects.
 * This will be the next step to implement.
 *
 * @param osmData Raw Overpass API JSON response.
 * @param anchor Projection origin used to convert lng/lat into canvas space.
 * @param pxPerMeter Canvas scale, i.e. `1 / METERS_PER_PX`.
 */
export function parseOsmBuildings(
  osmData: any,
  anchor: GeoAnchor,
  pxPerMeter: number,
): OsmBuilding[] {
  // TODO: Convert OSM nodes and ways into arrays of OsmBuilding objects.
  // This will involve mapping node IDs to their lat/lon coordinates and then
  // assembling the ways (building outlines) from those nodes, projecting each
  // vertex through `anchor` and scaling by `pxPerMeter`.
  console.log('Raw OSM data received, parsing not yet implemented:', osmData);
  return [];
}