import { availableCarparkResponse } from "@/types/types";
import { APIProvider, InfoWindow, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Star, MapPin as MapPinIcon } from "lucide-react";
import { isFavorite, addFavorite, removeFavorite } from "@/services/localStorage";
import { getAddressAndPostalCode, GeocodeResult } from "@/services/geocoding";
import { logger } from "@/utils/logger";

export interface CarparkMapRef {
  panToCarpark: (lat: number, lng: number) => void;
  panToAndSelectCarpark: (carpark: availableCarparkResponse) => void;
  closeInfoWindow: () => void;
  clearSelection: () => void;
}

interface CarparkMapProps {
  carparks: availableCarparkResponse[];
  onMapClick?: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Inner component that uses useMap() - must be rendered INSIDE <Map>
const MapController = forwardRef<CarparkMapRef, { 
  carparks: availableCarparkResponse[], 
  onMapClick?: () => void,
  userLocation?: { lat: number; lng: number } | null
}>(
  ({ carparks, onMapClick, userLocation }, ref) => {
    const map = useMap(); 
    const [selectedCarpark, setSelectedCarpark] = useState<availableCarparkResponse | null>(null);
    const [showInfoWindow, setShowInfoWindow] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [geocodeData, setGeocodeData] = useState<GeocodeResult>({ address: null, postalCode: null });
    const [loadingGeocode, setLoadingGeocode] = useState(false);

    // Fetch address and postal code when carpark is selected
    useEffect(() => {
      if (selectedCarpark && showInfoWindow) {
        logger.debug('🗺️ Fetching geocode data for:', selectedCarpark.development);
        setLoadingGeocode(true);
        getAddressAndPostalCode(selectedCarpark.latitude, selectedCarpark.longitude)
          .then(data => {
            logger.debug('🗺️ Geocode data received:', data);
            setGeocodeData(data);
            setLoadingGeocode(false);
          })
          .catch((error) => {
            console.error('🗺️ Geocode error:', error);
            setGeocodeData({ address: null, postalCode: null });
            setLoadingGeocode(false);
          });
      } else {
        setGeocodeData({ address: null, postalCode: null });
      }
    }, [selectedCarpark, showInfoWindow]);

    const handleFavoriteToggle = (carpark: availableCarparkResponse) => {
      if (isFavorite(carpark.carpark_num)) {
        removeFavorite(carpark.carpark_num);
      } else {
        addFavorite({
          carpark_num: carpark.carpark_num,
          development: carpark.development,
          area: carpark.area,
        });
      }
      setForceUpdate(prev => prev + 1); // Force re-render to update star icon
    };

    useImperativeHandle(ref, () => ({
      panToCarpark: (lat: number, lng: number) => {
        if (map) {
          logger.debug(`🗺️ Panning map to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          map.panTo({ lat, lng });
          map.setZoom(17);
          logger.debug(`🗺️ Map center after pan:`, map.getCenter()?.toJSON());
        }
      },
      panToAndSelectCarpark: (carpark: availableCarparkResponse) => {
        if (map) {
          logger.debug(`🗺️ Panning to and selecting: ${carpark.development}`);
          map.panTo({ lat: carpark.latitude, lng: carpark.longitude });
          map.setZoom(17);
          setSelectedCarpark(carpark);
          setShowInfoWindow(true);
        }
      },
      closeInfoWindow: () => {
        logger.debug('🗺️ Closing InfoWindow (marker stays selected)');
        setShowInfoWindow(false);
        // Note: selectedCarpark stays set, so marker remains highlighted
      },
      clearSelection: () => {
        logger.debug('🗺️ Clearing selection completely');
        setSelectedCarpark(null);
        setShowInfoWindow(false);
      }
    }));

    return (
      <>
        {/* User location marker with accuracy circle */}
        {userLocation && (
          <>
            {/* Blue dot for user location */}
            <Marker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                scale: 10,
              }}
              title="Your Location"
              zIndex={1000}
            />
            {/* Optional: Add a larger circle for accuracy visualization */}
          </>
        )}
        
        {/* Carpark markers from search results */}
        {carparks.map(carpark => {
          const isSelected = selectedCarpark?.carpark_num === carpark.carpark_num;
          
          return (
            <Marker
              key={carpark.carpark_num}
              position={{ lat: carpark.latitude, lng: carpark.longitude }}
              onClick={() => {
                setSelectedCarpark(carpark);
                setShowInfoWindow(true);
              }}
              // Highlight selected marker with custom icon
              icon={isSelected ? {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#EF4444', // Red color for selected
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                scale: 12,
              } : undefined}
              zIndex={isSelected ? 100 : 1}
            />
          );
        })}
        
        {/* Always render the selected carpark marker, even if not in current search results */}
        {selectedCarpark && !carparks.some(cp => cp.carpark_num === selectedCarpark.carpark_num) && (
          <Marker
            key={`selected-${selectedCarpark.carpark_num}`}
            position={{ lat: selectedCarpark.latitude, lng: selectedCarpark.longitude }}
            onClick={() => {
              setShowInfoWindow(true);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#EF4444', // Red color for selected
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
              scale: 12,
            }}
            zIndex={100}
          />
        )}
        
        {selectedCarpark && showInfoWindow && (
          <InfoWindow
            position={{ lat: selectedCarpark.latitude, lng: selectedCarpark.longitude }}
            onCloseClick={() => setShowInfoWindow(false)}
          >
            <div className="min-w-[280px] max-w-[320px]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base leading-snug">
                    {selectedCarpark.development}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedCarpark.carpark_num} • {selectedCarpark.area}
                  </p>
                  
                  {/* Address and Postal Code Section */}
                  {loadingGeocode ? (
                    <p className="text-xs text-gray-500 italic mt-1.5">Loading address...</p>
                  ) : (
                    <div className="mt-1.5 space-y-0.5">
                      {/* Full Address from Google */}
                      {geocodeData.address && (
                        <div className="flex items-start gap-1 text-xs text-gray-600">
                          <MapPinIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="leading-snug">{geocodeData.address}</span>
                        </div>
                      )}
                      
                      {/* Postal Code */}
                      {geocodeData.postalCode && (
                        <div className="text-xs text-gray-700">
                          📮 <span className="font-medium">{geocodeData.postalCode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteToggle(selectedCarpark);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  title={isFavorite(selectedCarpark.carpark_num) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star 
                    className={`w-4 h-4 ${isFavorite(selectedCarpark.carpark_num) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1 font-semibold">
                  Available Lots: {selectedCarpark.car_lots + selectedCarpark.motorcycle_lots + selectedCarpark.heavy_vehicle_lots}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCarpark.car_lots > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      🚗 {selectedCarpark.car_lots} cars
                    </span>
                  )}
                  {selectedCarpark.motorcycle_lots > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      🏍️ {selectedCarpark.motorcycle_lots} bikes
                    </span>
                  )}
                  {selectedCarpark.heavy_vehicle_lots > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      🚛 {selectedCarpark.heavy_vehicle_lots} heavy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </>
    );
  }
);

// Outer component
const CarparkMap = forwardRef<CarparkMapRef, CarparkMapProps>(({ carparks, onMapClick, userLocation }, ref) => {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: "100%", height: "100%" }}
        defaultCenter={{ lat: 1.3521, lng: 103.8198 }} // Singapore
        defaultZoom={13}
        onClick={onMapClick} // Trigger callback when map is clicked
      >
        <MapController ref={ref} carparks={carparks} onMapClick={onMapClick} userLocation={userLocation} />
      </Map>
    </APIProvider>
  );
});

export default CarparkMap;
