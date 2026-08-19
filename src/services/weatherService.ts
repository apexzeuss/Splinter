export interface LiveWeatherReport {
  latitude: number;
  longitude: number;
  cityName: string;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  uvIndex: number;
  directNormalIrradianceWm2: number;
  cloudCoverPercent: number;
  weatherCode: number;
  weatherDescription: string;
  hourly: {
    time: string[];
    temperature: number[];
    apparentTemp: number[];
    uvIndex: number[];
    solarRadiation: number[];
  };
  fetchedAt: string;
}

export function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Clear Sky (Full Sun)';
    case 1: return 'Mainly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45: case 48: return 'Foggy';
    case 51: case 53: case 55: return 'Light Drizzle';
    case 61: case 63: case 65: return 'Rain';
    case 80: case 81: case 82: return 'Rain Showers';
    case 95: return 'Thunderstorm';
    default: return 'Fair / Sunny';
  }
}

export async function fetchRealLiveWeather(
  lat: number,
  lng: number,
  cityName: string = 'Current Location'
): Promise<LiveWeatherReport> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,direct_normal_irradiance,uv_index&hourly=temperature_2m,apparent_temperature,uv_index,direct_normal_irradiance&timezone=auto&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP error: ${res.status}`);
  }
  const data = await res.json();

  const current = data.current || {};
  const hourly = data.hourly || { time: [], temperature_2m: [], apparent_temperature: [], uv_index: [], direct_normal_irradiance: [] };

  return {
    latitude: lat,
    longitude: lng,
    cityName,
    temperatureC: Math.round(current.temperature_2m * 10) / 10,
    apparentTemperatureC: Math.round(current.apparent_temperature * 10) / 10,
    relativeHumidity: Math.round(current.relative_humidity_2m),
    windSpeedKmh: Math.round(current.wind_speed_10m * 10) / 10,
    windDirectionDeg: Math.round(current.wind_direction_10m),
    uvIndex: Math.round((current.uv_index || 0) * 10) / 10,
    directNormalIrradianceWm2: Math.round(current.direct_normal_irradiance || 0),
    cloudCoverPercent: Math.round(current.cloud_cover || 0),
    weatherCode: current.weather_code || 0,
    weatherDescription: getWeatherDescription(current.weather_code || 0),
    hourly: {
      time: (hourly.time || []).slice(6, 22), // 6 AM to 10 PM
      temperature: (hourly.temperature_2m || []).slice(6, 22),
      apparentTemp: (hourly.apparent_temperature || []).slice(6, 22),
      uvIndex: (hourly.uv_index || []).slice(6, 22),
      solarRadiation: (hourly.direct_normal_irradiance || []).slice(6, 22),
    },
    fetchedAt: new Date().toLocaleTimeString(),
  };
}
