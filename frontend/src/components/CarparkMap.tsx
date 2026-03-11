import { availableCarparkResponse } from "@/types/types";
import { APIProvider, Map, Marker, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
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

function markerColor(lots: number): string {
  if (lots > 10) return '#22c55e';
  if (lots > 0) return '#f97316';
  return '#ef4444';
}

function CarparkMarker({ lots, selected }: { lots: number; selected: boolean }) {
  const bg = markerColor(lots);
  return (
    <div style={{
      background: bg,
      borderRadius: '50%',
      width: selected ? 36 : 28,
      height: selected ? 36 : 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: selected
        ? `0 0 0 3px #fff, 0 0 0 5px ${bg}`
        : '0 2px 4px rgba(0,0,0,0.35)',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    }}>
      <svg width={selected ? 20 : 16} height={selected ? 20 : 16} viewBox="0 0 24 24" fill="white">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  );
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
          <AdvancedMarker
            key={carpark.carpark_num}
            position={{ lat: carpark.latitude, lng: carpark.longitude }}
            onClick={() => onSelect(carpark)}
            zIndex={isSelected ? 100 : 1}
          >
            <CarparkMarker lots={carpark.car_lots} selected={isSelected} />
          </AdvancedMarker>
        );
      })}

      {/* Keep selected marker visible even if not in current search results */}
      {selectedCarpark && !carparks.some(cp => cp.carpark_num === selectedCarpark.carpark_num) && (
        <AdvancedMarker
          key={`selected-${selectedCarpark.carpark_num}`}
          position={{ lat: selectedCarpark.latitude, lng: selectedCarpark.longitude }}
          onClick={() => onSelect(selectedCarpark)}
          zIndex={100}
        >
          <CarparkMarker lots={selectedCarpark.car_lots} selected={true} />
        </AdvancedMarker>
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
