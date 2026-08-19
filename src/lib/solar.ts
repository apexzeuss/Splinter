/**
 * Solar position for a WGS84 coordinate and local clock time.
 *
 * Implements the NOAA Solar Calculator algorithm specified in architecture.md
 * section 2.1. Correct in both hemispheres and for every day of the year, which
 * the previous inline approximation was not: it hardcoded declination to the
 * June solstice, ramped azimuth linearly from 95 to 265 degrees regardless of
 * latitude, and pinned solar noon to 13:00 local.
 *
 * Reference: https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface SolarPosition {
  /** Degrees above the horizon. Negative when the sun is below it. */
  elevationDeg: number;
  /** Degrees clockwise from true north: 0 = N, 90 = E, 180 = S, 270 = W. */
  azimuthDeg: number;
  /** Equation of time, in minutes. */
  equationOfTimeMin: number;
  /** Solar declination, in degrees. */
  declinationDeg: number;
  /** Hour angle, in degrees. 0 at solar noon, negative before it. */
  hourAngleDeg: number;
}

/** Day of year, 1-366, read in UTC. */
export function dayOfYear(date: Date): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const thisDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((thisDay - startOfYear) / 86_400_000) + 1;
}

/**
 * Rough UTC offset inferred from longitude at 15 degrees per hour.
 *
 * Accurate to roughly an hour: it knows nothing about political time zone
 * boundaries or daylight saving. Prefer a real offset when one is available —
 * Open-Meteo returns `utc_offset_seconds` when called with `timezone=auto`.
 */
export function estimateUtcOffsetHours(longitude: number): number {
  return Math.round(longitude / 15);
}

export interface SolarPositionInput {
  latitude: number;
  longitude: number;
  /** Minutes from local midnight, in local clock time. */
  minutesOfDay: number;
  /** Date the observation falls on. Drives declination and equation of time. */
  date: Date;
  /** Local UTC offset in hours. Use estimateUtcOffsetHours if you lack a real one. */
  utcOffsetHours: number;
}

export function solarPosition(input: SolarPositionInput): SolarPosition {
  const { latitude, longitude, minutesOfDay, date, utcOffsetHours } = input;

  const doy = dayOfYear(date);
  const hourOfDay = minutesOfDay / 60;

  // Fractional year, radians.
  const g = ((2 * Math.PI) / 365) * (doy - 1 + (hourOfDay - 12) / 24);

  // Equation of time, minutes.
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));

  // Solar declination, radians.
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);

  // True solar time, minutes. Corrects for longitude within the time zone and
  // for the earth's orbital eccentricity.
  const trueSolarMin = minutesOfDay + eqTime + 4 * longitude - 60 * utcOffsetHours;

  // Hour angle, degrees, wrapped into [-180, 180].
  let hourAngleDeg = trueSolarMin / 4 - 180;
  hourAngleDeg = ((((hourAngleDeg + 180) % 360) + 360) % 360) - 180;

  const latRad = latitude * DEG;
  const haRad = hourAngleDeg * DEG;

  const sinElev =
    Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
  const elevRad = Math.asin(clamp(sinElev, -1, 1));

  // Azimuth clockwise from true north. atan2 resolves the quadrant, so this is
  // correct north and south of the equator and either side of solar noon.
  const azRad = Math.atan2(
    -Math.sin(haRad),
    Math.cos(latRad) * Math.tan(decl) - Math.sin(latRad) * Math.cos(haRad),
  );

  return {
    elevationDeg: elevRad * RAD,
    azimuthDeg: ((azRad * RAD % 360) + 360) % 360,
    equationOfTimeMin: eqTime,
    declinationDeg: decl * RAD,
    hourAngleDeg,
  };
}

/**
 * Clear-sky UV index estimated from solar elevation.
 *
 * This is a rough sea-level clear-sky approximation of the form
 * UVI ~= 12.5 * cos(zenith)^2.42, and it deliberately ignores cloud cover,
 * altitude, aerosols and ozone. It is an estimate, not a measurement — label it
 * as such wherever it is shown. For a real figure, request `uv_index` from
 * Open-Meteo instead.
 */
export function clearSkyUvIndex(elevationDeg: number): number {
  if (elevationDeg <= 0) return 0;
  const cosZenith = Math.sin(elevationDeg * DEG);
  return 12.5 * Math.pow(cosZenith, 2.42);
}

/**
 * Ground shadow length cast by a vertical object, in the same unit as `heightM`.
 *
 * Returns null when the sun is at or below the horizon, where the shadow is
 * unbounded and no meaningful ground polygon exists. Callers must handle that
 * case rather than clamping elevation to a small positive floor, which is what
 * the previous implementation did.
 */
export function shadowLengthM(heightM: number, elevationDeg: number): number | null {
  if (elevationDeg <= 0.5) return null;
  return heightM / Math.tan(elevationDeg * DEG);
}
