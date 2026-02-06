import SearchBar from "@/components/SearchBar";
import { DurationSelector } from "@/components/DurationSelector";
import { availableCarparkResponse } from "@/types/types";
import { useEffect, useState, useRef } from "react";
import CarparkMap from "./components/CarparkMap";
import { CarparkMapRef } from "./components/CarparkMap";
import { MapPin } from "lucide-react";

// Geocode address/postal code to coordinates using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key not found');
    return null;
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)},Singapore&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.warn('Geocoding failed:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    availableCarparkResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(true);
  const [duration, setDuration] = useState<number>(2); // Default 2 hours
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shouldSearchAfterLocation, setShouldSearchAfterLocation] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [useGPSLocation, setUseGPSLocation] = useState(true); // Toggle to disable GPS
  const mapRef = useRef<CarparkMapRef>(null);
  
  // Reusable function to request user location
  const requestUserLocation = (autoSearch = false) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsGettingLocation(true);
    setLocationError(null);
    if (autoSearch) {
      setShouldSearchAfterLocation(true);
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        setLocationError(null);
        console.log('📍 Location acquired:', location);
        console.log('📍 Full position object:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toLocaleString()
        });
        console.log('📍 Accuracy:', position.coords.accuracy, 'meters');
        
        // Pan map to user location immediately
        setTimeout(() => {
          mapRef.current?.panToCarpark(location.lat, location.lng);
          console.log('📍 Map panned to user location');
        }, 500); // Small delay to ensure map is ready
      },
      (error) => {
        console.warn('Location access error:', error);
        setIsGettingLocation(false);
        
        // Provide user-friendly error messages
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Unable to get your location.");
        }
      }
    );
  };
  
  // Get user's location on mount
  useEffect(() => {
    requestUserLocation();
  }, []);
  
  // Auto-trigger "near me" search after location is obtained (if requested)
  useEffect(() => {
    if (userLocation && shouldSearchAfterLocation) {
      setSearchTerm("near me");
      setIsDropdownVisible(true);
      setShouldSearchAfterLocation(false);
    }
  }, [userLocation, shouldSearchAfterLocation]);
  
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      // Try geocoding if search looks like address/postal code and returns no results
      let searchLocation: { lat: number; lng: number } | null = null;
      let shouldGeocode = false;
      
      // Check if search term looks like postal code (6 digits) or address
      const isPostalCode = /^\d{6}$/.test(searchTerm.trim());
      const looksLikeAddress = searchTerm.includes(' ') && (
        /\d+/.test(searchTerm) || // Contains numbers
        /road|street|avenue|crescent|drive|lane|close|singapore/i.test(searchTerm) // Address keywords
      );
      
      if (isPostalCode || looksLikeAddress) {
        console.log('🔍 Detected address/postal code format, will try geocoding if needed');
        shouldGeocode = true;
      }
      
      const url = new URL("http://localhost:5001/carparks");
      url.searchParams.append("search", searchTerm);
      url.searchParams.append("duration", duration.toString());
      url.searchParams.append("day_type", dayType);

      try {
        const response = await fetch(url);
        let data = await response.json();
        
        // If no results and should geocode, try address search
        if (data.length === 0 && shouldGeocode) {
          console.log('📍 No direct results, trying geocoding for:', searchTerm);
          searchLocation = await geocodeAddress(searchTerm);
          
          if (searchLocation) {
            console.log('📍 Geocoded to:', searchLocation);
            // Fetch all carparks to find nearby ones
            const allUrl = new URL("http://localhost:5001/carparks");
            allUrl.searchParams.append("search", ""); // Get all
            allUrl.searchParams.append("duration", duration.toString());
            allUrl.searchParams.append("day_type", dayType);
            
            const allResponse = await fetch(allUrl);
            data = await allResponse.json();
          }
        }
        
        const isNearMeSearch = searchTerm.toLowerCase().trim() === 'near me';
        
        console.log('🔍 Search type:', isNearMeSearch ? 'NEAR ME' : searchLocation ? 'ADDRESS' : 'REGULAR', 'Query:', searchTerm);
        
        // Calculate distance if user location available AND GPS is enabled, OR if we geocoded an address
        const locationToUse = searchLocation || (useGPSLocation ? userLocation : null);
        
        if (locationToUse) {
          console.log('📍 Calculating distances from:', locationToUse);
          data.forEach((carpark: availableCarparkResponse) => {
            const distance = calculateDistance(
              locationToUse.lat,
              locationToUse.lng,
              carpark.latitude,
              carpark.longitude
            );
            (carpark as any).distance = distance;
          });
          
          // Smart sorting logic:
          // 1. "Near me" or address search → sort by distance
          // 2. Empty search (browsing) → sort by cost (cheapest first)
          // 3. Specific search (e.g., "ion", "vivo") → keep backend ranking (relevance first)
          
          const isEmptySearch = !searchTerm || searchTerm.trim() === '';
          
          if (isNearMeSearch || searchLocation) {
            // "Near me" or address search - prioritize distance
            data.sort((a: any, b: any) => a.distance - b.distance);
            console.log('📍 Sorted by distance (near me/address search)');
          } else if (isEmptySearch) {
            // Empty search (browsing all) - sort by cost
            data.sort((a: any, b: any) => {
              if (a.calculated_cost !== null && b.calculated_cost !== null) {
                return a.calculated_cost - b.calculated_cost;
              } else if (a.calculated_cost !== null) {
                return -1;
              } else if (b.calculated_cost !== null) {
                return 1;
              } else {
                return a.distance - b.distance;
              }
            });
            console.log('💰 Sorted by cost (empty search)');
          } else {
            // Specific search query - preserve backend ranking (smart search)
            console.log(`🎯 Preserved backend ranking for search: "${searchTerm}"`);
            // Don't sort - keep backend's smart search order!
          }
          
          // For "near me" or address search, limit to closest 20 carparks
          if ((isNearMeSearch || searchLocation) && data.length > 20) {
            console.log(`📊 Limiting from ${data.length} to 20 closest carparks`);
            data = data.slice(0, 20);
          }
        } else {
          console.log('⚠️ No location available - cannot calculate distances');
        }
        
        setSearchResults(data || []);
        setIsLoading(false);
        console.log(
          `✅ Found ${data.length} carparks (${duration}hrs, ${dayType})`,
          locationToUse ? `| Nearest: ${(data[0] as any)?.distance?.toFixed(2)}km (${data[0]?.development})` : '| No GPS'
        );
        
        // For "near me" or address searches, pan to the location
        if ((isNearMeSearch || searchLocation) && data.length > 0 && locationToUse) {
          setTimeout(() => {
            mapRef.current?.panToCarpark(locationToUse.lat, locationToUse.lng);
          }, 200);
        }
      } catch (error) {
        console.error("Error fetching carparks:", error);
        setSearchResults([]);
        setIsLoading(false);
      }
    }, 100); // Reduced from 150ms to 100ms for faster response

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, duration, dayType, userLocation, useGPSLocation]);
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };
  
  const handleCarparkSelect = (carpark: availableCarparkResponse) => {
    mapRef.current?.panToAndSelectCarpark(carpark);
    // Dropdown will be hidden by SearchBar's handleResultClick
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownVisible(true); // Show dropdown when typing
    
    // Close any open InfoWindow when user starts typing
    // This prevents focus issues where InfoWindow steals focus from input
    mapRef.current?.closeInfoWindow();
  };
  
  const handleDismissDropdown = () => {
    setIsDropdownVisible(false);
  };
  
  const handleNearMeClick = () => {
    if (!useGPSLocation) {
      alert('GPS is disabled. Please enable GPS in the top-left corner, or search by area name instead (e.g., "punggol", "tampines")');
      return;
    }
    
    if (userLocation) {
      // Already have location - trigger search
      setSearchTerm("near me");
      setIsDropdownVisible(true);
    } else if (isGettingLocation) {
      // Already getting location - just wait
      setShouldSearchAfterLocation(true);
    } else {
      // Don't have location - try to get it again and auto-search after
      requestUserLocation(true);
    }
  };
  
  return (
    <>
    <div className="relative h-screen w-full">
      {/* Location loading indicator */}
      {isGettingLocation && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-pulse">
          📍 Getting your location...
        </div>
      )}
      
      {/* User location status indicator - always show when no search active */}
      {!isGettingLocation && !locationError && searchTerm === "" && (
        <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm ${
          userLocation 
            ? 'bg-green-500 text-white' 
            : 'bg-yellow-500 text-white'
        }`}>
          {userLocation 
            ? '✓ Location ready! Click 📍 to search nearby' 
            : '⚠️ Location not available - Click 📍 to retry'
          }
        </div>
      )}
      
      {/* Location error message */}
      {locationError && !isGettingLocation && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-md">
          <div className="flex items-center justify-between gap-3">
            <span>⚠️ {locationError}</span>
            <button 
              onClick={() => setLocationError(null)}
              className="text-white hover:text-gray-200 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <CarparkMap 
        ref={mapRef} 
        carparks={searchResults || []} 
        onMapClick={handleDismissDropdown}
        userLocation={userLocation}
      />
      <SearchBar
        value={searchTerm}
        searchResults={searchResults}
        isLoading={isLoading}
        onChange={handleSearchChange}
        onCarparkSelect={handleCarparkSelect}
        isDropdownVisible={isDropdownVisible}
        onDismissDropdown={handleDismissDropdown}
        onNearMeClick={handleNearMeClick}
        hasUserLocation={!!userLocation && useGPSLocation}
        showAvailableOnly={showAvailableOnly}
        onAvailableOnlyChange={setShowAvailableOnly}
        userLocation={useGPSLocation ? userLocation : null}
        duration={duration}
        dayType={dayType}
      />
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-20">
        <DurationSelector
          duration={duration}
          onChange={setDuration}
          dayType={dayType}
          onDayTypeChange={setDayType}
        />
      </div>
      </div>
    </>
  );
}

export default App;
