// Geocoding service to get address and postal code from coordinates
const geocodeCache = new Map<string, { address: string; postalCode: string | null }>();

export interface GeocodeResult {
  address: string | null;
  postalCode: string | null;
}

export async function getAddressAndPostalCode(lat: number, lng: number): Promise<GeocodeResult> {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    console.log('📮 Address from cache:', geocodeCache.get(cacheKey));
    return geocodeCache.get(cacheKey)!;
  }
  
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Maps API key not found');
      return { address: null, postalCode: null };
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    console.log('📮 Fetching address and postal code for:', lat, lng);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📮 Geocoding response status:', data.status);
    
    if (data.status === 'OK' && data.results.length > 0) {
      let postalCode: string | null = null;
      let address: string | null = null;
      
      // Get the first result's formatted address
      const firstResult = data.results[0];
      address = firstResult.formatted_address;
      
      // Find postal code in address components
      for (const result of data.results) {
        const postalComponent = result.address_components?.find(
          (component: any) => component.types.includes('postal_code')
        );
        
        if (postalComponent) {
          postalCode = postalComponent.long_name;
          break;
        }
      }
      
      console.log('✅ Found address:', address);
      console.log('✅ Found postal code:', postalCode);
      
      const result = { address, postalCode };
      geocodeCache.set(cacheKey, result);
      return result;
    } else {
      console.warn('⚠️ Geocoding failed:', data.status, data.error_message);
    }
    
    return { address: null, postalCode: null };
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return { address: null, postalCode: null };
  }
}

// Legacy function for backward compatibility
export async function getPostalCode(lat: number, lng: number): Promise<string | null> {
  const result = await getAddressAndPostalCode(lat, lng);
  return result.postalCode;
}
