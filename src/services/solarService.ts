/**
 * Real Astronomical Solar Position & Street Shadow Geometry Service
 * Implements standard NOAA Solar Calculations for exact Sun Elevation and Azimuth.
 */

export interface SolarPosition {
  elevationDeg: number; // Altitude above horizon (0° to 90°)
  azimuthDeg: number;   // Angle from True North (0° = N, 90° = E, 180° = S, 270° = W)
  zenithDeg: number;    // 90° - elevation
  isDaylight: boolean;
  intensityPercent: number; // 0 to 100 based on solar altitude
}

export function calculateRealSolarPosition(
  lat: number,
  lng: number,
  date: Date = new Date()
): SolarPosition {
  // Day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Local solar time calculation
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  
  // Fractional year in radians
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hours - 12) / 24);

  // Equation of time in minutes
  const eqtime = 229.18 * (
    0.000075 + 
    0.001868 * Math.cos(gamma) - 
    0.032077 * Math.sin(gamma) - 
    0.014615 * Math.cos(2 * gamma) - 
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination angle in radians
  const decl = 0.006918 - 
    0.399912 * Math.cos(gamma) + 
    0.070257 * Math.sin(gamma) - 
    0.006758 * Math.cos(2 * gamma) + 
    0.000907 * Math.sin(2 * gamma) - 
    0.002697 * Math.cos(3 * gamma) + 
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes
  // Standard timezone estimate based on longitude: lng / 15
  const timezoneOffsetHours = -date.getTimezoneOffset() / 60;
  const timeOffset = eqtime + 4 * lng - 60 * timezoneOffsetHours;

  // True solar time in minutes
  let tst = hours * 60 + timeOffset;
  tst = (tst + 1440) % 1440;

  // Solar hour angle in degrees
  let ha = (tst / 4) - 180;
  if (ha < -180) ha += 360;
  const haRad = ha * (Math.PI / 180);

  const latRad = lat * (Math.PI / 180);

  // Solar zenith angle in radians
  const cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const zenithDeg = zenithRad * (180 / Math.PI);
  const elevationDeg = 90 - zenithDeg;

  // Solar azimuth angle in radians from North
  const cosAzimuth = (Math.sin(decl) - Math.sin(latRad) * Math.cos(zenithRad)) / (Math.cos(latRad) * Math.sin(zenithRad));
  let azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
  let azimuthDeg = azimuthRad * (180 / Math.PI);
  if (ha > 0) {
    azimuthDeg = 360 - azimuthDeg;
  }

  const isDaylight = elevationDeg > 0;
  const intensityPercent = isDaylight ? Math.min(100, Math.max(0, Math.sin(elevationDeg * Math.PI / 180) * 100)) : 0;

  return {
    elevationDeg: Math.round(elevationDeg * 10) / 10,
    azimuthDeg: Math.round(azimuthDeg * 10) / 10,
    zenithDeg: Math.round(zenithDeg * 10) / 10,
    isDaylight,
    intensityPercent: Math.round(intensityPercent),
  };
}

/**
 * Calculates bearing in degrees (0 to 360) between two coordinate points
 */
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin((lng2 - lng1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lng2 - lng1) * (Math.PI / 180));
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/**
 * Evaluates the solar exposure factor (0 = full shade, 1 = direct scorching sun)
 * of a street segment given its geographic orientation and current solar position.
 */
export function evaluateStreetShadeFactor(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  solar: SolarPosition,
  avgBuildingAspectH_W: number = 1.2
): {
  shadePercent: number;
  exposureCategory: 'shaded' | 'partial' | 'exposed';
  sunAngleDelta: number;
} {
  if (!solar.isDaylight) {
    return { shadePercent: 100, exposureCategory: 'shaded', sunAngleDelta: 0 };
  }

  const streetBearing = calculateBearing(lat1, lng1, lat2, lng2);
  
  // Angle difference between street axis and solar azimuth
  let angleDiff = Math.abs(streetBearing - solar.azimuthDeg);
  angleDiff = angleDiff % 180;
  if (angleDiff > 90) angleDiff = 180 - angleDiff;

  // When street runs parallel to sun rays (angleDiff -> 0), sunlight penetrates deep along the canyon axis (less shade)
  // When street runs perpendicular (angleDiff -> 90), building facades on the sunny side cast deep cross-street shadows
  const perpFactor = Math.sin(angleDiff * (Math.PI / 180));

  // Shadow length ratio = 1 / tan(solarElevation)
  const elevRad = Math.max(0.1, solar.elevationDeg) * (Math.PI / 180);
  const shadowLengthRatio = 1 / Math.tan(elevRad);

  // Canyon shade estimate = (avgBuildingAspect * shadowLengthRatio * perpFactor)
  let rawShade = avgBuildingAspectH_W * shadowLengthRatio * perpFactor * 0.75;
  // Account for typical tree canopy coverage (15-25% baseline)
  rawShade += 0.20;

  // High solar noon with elevation > 70° casts very little sidewalk shade
  if (solar.elevationDeg > 70) {
    rawShade *= 0.4;
  }

  const shadePercent = Math.min(95, Math.max(10, Math.round(rawShade * 100)));

  let exposureCategory: 'shaded' | 'partial' | 'exposed' = 'partial';
  if (shadePercent >= 65) exposureCategory = 'shaded';
  else if (shadePercent <= 35) exposureCategory = 'exposed';

  return {
    shadePercent,
    exposureCategory,
    sunAngleDelta: Math.round(angleDiff),
  };
}
