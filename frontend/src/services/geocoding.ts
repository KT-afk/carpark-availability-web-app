// Geocoding service — calls backend reverse geocode endpoint
const geocodeCache = new Map<string, { address: string; postalCode: string | null }>();

export interface GeocodeResult {
  address: string | null;
  postalCode: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export async function getAddressAndPostalCode(lat: number, lng: number): Promise<GeocodeResult> {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const url = `${API_URL}/geocode/reverse?lat=${lat}&lng=${lng}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.address) {
      const result = { address: data.address, postalCode: data.postalCode };
      geocodeCache.set(cacheKey, result);
      return result;
    }

    return { address: null, postalCode: null };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { address: null, postalCode: null };
  }
}
