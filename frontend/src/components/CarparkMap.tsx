import { availableCarparkResponse } from "@/types/types";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
import { CarparkPanel } from "./CarparkPanel";
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
  duration: number;
  dayType: 'weekday' | 'saturday' | 'sunday';
}

interface MapControllerHandle {
  panToLocation: (lat: number, lng: number) => void;
}

// Inner component — must be inside <Map> to use useMap()
const MapController = forwardRef<MapControllerHandle, {
  carparks: availableCarparkResponse[];
  selectedCarpark: availableCarparkResponse | null;
  onSelect: (carpark: availableCarparkResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
}>(({ carparks, selectedCarpark, onSelect, userLocation }, ref) => {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    panToLocation: (lat: number, lng: number) => {
      if (map) {
        logger.debug(`🗺️ Panning to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        map.panTo({ lat, lng });
        map.setZoom(17);
      }
    }
  }));

  return (
    <>
      {/* User location marker */}
      {userLocation && (
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
      )}

      {/* Carpark markers */}
      {carparks.map(carpark => {
        const isSelected = selectedCarpark?.carpark_num === carpark.carpark_num;
        return (
          <Marker
            key={carpark.carpark_num}
            position={{ lat: carpark.latitude, lng: carpark.longitude }}
            onClick={() => onSelect(carpark)}
            icon={isSelected ? {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
              scale: 12,
            } : undefined}
            zIndex={isSelected ? 100 : 1}
          />
        );
      })}

      {/* Keep selected marker visible even if not in current search results */}
      {selectedCarpark && !carparks.some(cp => cp.carpark_num === selectedCarpark.carpark_num) && (
        <Marker
          key={`selected-${selectedCarpark.carpark_num}`}
          position={{ lat: selectedCarpark.latitude, lng: selectedCarpark.longitude }}
          onClick={() => onSelect(selectedCarpark)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 12,
          }}
          zIndex={100}
        />
      )}
    </>
  );
});

// Outer component — owns selection state, renders panel as sibling to Map
const CarparkMap = forwardRef<CarparkMapRef, CarparkMapProps>(
  ({ carparks, onMapClick, userLocation, duration, dayType }, ref) => {
    const [selectedCarpark, setSelectedCarpark] = useState<availableCarparkResponse | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const mapControllerRef = useRef<MapControllerHandle>(null);

    // Sync selectedCarpark when carparks prop updates (e.g. duration/dayType change)
    useEffect(() => {
      if (selectedCarpark) {
        const updated = carparks.find(cp => cp.carpark_num === selectedCarpark.carpark_num);
        if (updated) setSelectedCarpark(updated);
      }
    }, [carparks]);

    useImperativeHandle(ref, () => ({
      panToCarpark: (lat: number, lng: number) => {
        mapControllerRef.current?.panToLocation(lat, lng);
      },
      panToAndSelectCarpark: (carpark: availableCarparkResponse) => {
        mapControllerRef.current?.panToLocation(carpark.latitude, carpark.longitude);
        setSelectedCarpark(carpark);
        setShowPanel(true);
      },
      closeInfoWindow: () => {
        setShowPanel(false);
      },
      clearSelection: () => {
        setSelectedCarpark(null);
        setShowPanel(false);
      }
    }));

    const handleMapClick = () => {
      setShowPanel(false);
      onMapClick?.();
    };

    return (
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          style={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 1.3521, lng: 103.8198 }}
          defaultZoom={13}
          onClick={handleMapClick}
        >
          <MapController
            ref={mapControllerRef}
            carparks={carparks}
            selectedCarpark={selectedCarpark}
            onSelect={(carpark) => {
              setSelectedCarpark(carpark);
              setShowPanel(true);
            }}
            userLocation={userLocation}
          />
        </Map>
        <CarparkPanel
          carpark={selectedCarpark}
          show={showPanel}
          onClose={() => setShowPanel(false)}
          duration={duration}
          dayType={dayType}
        />
      </APIProvider>
    );
  }
);

export default CarparkMap;
