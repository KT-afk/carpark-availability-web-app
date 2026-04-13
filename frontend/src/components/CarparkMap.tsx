import { availableCarparkResponse } from "@/types/types";
import { logger } from "@/utils/logger";
import type { Cluster } from "@googlemaps/markerclusterer";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { AdvancedMarker, APIProvider, Map as GoogleMap, Pin, useMap } from "@vis.gl/react-google-maps";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CarparkPanel } from "./CarparkPanel";

export interface CarparkMapRef {
  panToCarpark: (lat: number, lng: number) => void;
  panToAndSelectCarpark: (carpark: availableCarparkResponse) => void;
  closeInfoWindow: () => void;
  clearSelection: () => void;
}

interface CarparkMapProps {
  carparks: availableCarparkResponse[];
  onMapClick?: () => void;
  selectedCarpark: availableCarparkResponse | null;
  setSelectedCarpark: (carpark: availableCarparkResponse | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  duration: number;
  dayType: 'weekday' | 'saturday' | 'sunday';
}

interface MapControllerHandle {
  panToLocation: (lat: number, lng: number) => void;
}

const CAR_SVG_PATH = "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z";

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
        ? `0 0 0 3px #fff, 0 0 0 6px #1d4ed8`
        : '0 2px 4px rgba(0,0,0,0.35)',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
    }}>
      <svg width={selected ? 20 : 16} height={selected ? 20 : 16} viewBox="0 0 24 24" fill="white">
        <path d={CAR_SVG_PATH} />
      </svg>
    </div>
  );
}

/** Build a native DOM element for use with AdvancedMarkerElement (imperative clustering) */
function buildMarkerElement(lots: number): HTMLDivElement {
  const bg = markerColor(lots);
  const el = document.createElement('div');
  el.style.cssText = `background:${bg};border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.35);cursor:pointer;`;
  el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="${CAR_SVG_PATH}"/></svg>`;
  el.dataset.lots = String(lots);
  return el;
}

// Custom cluster renderer — badge colour reflects best availability in cluster
const clusterRenderer = {
  render(cluster: Cluster): google.maps.marker.AdvancedMarkerElement {
    const markers = cluster.markers as google.maps.marker.AdvancedMarkerElement[];
    const lots = markers.map(m => parseInt((m.content as HTMLElement)?.dataset?.lots ?? '0'));
    const bestLots = Math.max(...lots);
    const bg = markerColor(bestLots);
    const count = cluster.count;

    const el = document.createElement('div');
    el.style.cssText = `background:${bg};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:pointer;border:2px solid white;`;
    el.textContent = String(count);

    return new google.maps.marker.AdvancedMarkerElement({
      position: cluster.position,
      content: el,
      zIndex: 50,
    });
  },
};

// Inner component — must be inside <Map> to use useMap()
const MapController = forwardRef<MapControllerHandle, {
  carparks: availableCarparkResponse[];
  selectedCarpark: availableCarparkResponse | null;
  onSelect: (carpark: availableCarparkResponse) => void;
  userLocation?: { lat: number; lng: number } | null;
}>(({ carparks, selectedCarpark, onSelect, userLocation }, ref) => {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const nativeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useImperativeHandle(ref, () => ({
    panToLocation: (lat: number, lng: number) => {
      if (map) {
        logger.debug(`🗺️ Panning to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        map.panTo({ lat, lng });
        map.setZoom(17);
      }
    }
  }));

  // Manage clustered markers imperatively
  useEffect(() => {
    if (!map) return;

    // Remove old native markers
    nativeMarkersRef.current.forEach(m => { m.map = null; });
    nativeMarkersRef.current.clear();
    clustererRef.current?.clearMarkers();

    // Build markers for all carparks except selected (selected rendered via React AdvancedMarker)
    const toCluster = carparks.filter(cp => cp.carpark_num !== selectedCarpark?.carpark_num);
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    for (const carpark of toCluster) {
      const content = buildMarkerElement(carpark.car_lots);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: carpark.latitude, lng: carpark.longitude },
        content,
      });
      marker.addListener('click', () => onSelect(carpark));
      nativeMarkersRef.current.set(carpark.carpark_num, marker);
      newMarkers.push(marker);
    }

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: newMarkers, renderer: clusterRenderer });
    } else {
      clustererRef.current.addMarkers(newMarkers);
    }

    return () => {
      nativeMarkersRef.current.forEach(m => { m.map = null; });
      nativeMarkersRef.current.clear();
      clustererRef.current?.clearMarkers();
    };
  }, [map, carparks, selectedCarpark]);

  return (
    <>
      {/* User location marker */}
      {userLocation && (
        <AdvancedMarker
          position={{ lat: userLocation.lat, lng: userLocation.lng }}
          title="Your Location"
          zIndex={1000}
        >
          <Pin background="#4285F4" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.2} />
        </AdvancedMarker>
      )}

      {/* Selected carpark — rendered standalone outside clusterer, always visible */}
      {selectedCarpark && (
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
  ({ carparks, onMapClick, selectedCarpark, setSelectedCarpark, userLocation, duration, dayType }, ref) => {
    
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
        <GoogleMap
          style={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 1.3521, lng: 103.8198 }}
          defaultZoom={13}
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
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
        </GoogleMap>
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
