export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country?: string;
  admin1?: string;
}

export async function searchRealPlaces(query: string): Promise<GeocodedPlace[]> {
  if (!query || query.trim().length < 2) return [];

  const clean = encodeURIComponent(query.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${clean}&count=8&language=en&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding query error');
    const data = await res.json();
    if (!data.results || data.results.length === 0) return [];

    return data.results.map((r: any) => {
      const parts = [r.name, r.admin1, r.country].filter(Boolean);
      return {
        id: `${r.id || r.name}-${r.latitude}-${r.longitude}`,
        name: r.name,
        displayName: parts.join(', '),
        lat: r.latitude,
        lng: r.longitude,
        country: r.country,
        admin1: r.admin1,
      };
    });
  } catch (err) {
    console.warn('Geocoding search failed:', err);
    return [];
  }
}
