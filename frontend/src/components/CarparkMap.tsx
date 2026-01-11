import { availableCarparkResponse } from "@/types/types";
import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface CarparkMapRef {
  panToCarpark: (lat: number, lng: number, carpark?: availableCarparkResponse) => void;
}

interface CarparkMapProps {
  carparks: availableCarparkResponse[];
}

// Inner component that uses useMap() - must be rendered INSIDE <Map>
const MapController = forwardRef<
  CarparkMapRef,
  { carparks: availableCarparkResponse[] }
>(({ carparks }, ref) => {
  const map = useMap();
  const [selectedCarpark, setSelectedCarpark] =
    useState<availableCarparkResponse | null>(null);

  useImperativeHandle(ref, () => ({
    panToCarpark: (lat: number, lng: number, carpark?: availableCarparkResponse) => {
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(17);
      }
      if (carpark){
        setSelectedCarpark(carpark);
        console.log("Selected carpark:", carpark);
      }
    },
  }));

  return (
    <>
      {carparks.map((carpark) => (
        <Marker
          key={carpark.carpark_num}
          position={{ lat: carpark.latitude, lng: carpark.longitude }}
          onClick={() => setSelectedCarpark(carpark)}
        />
      ))}
      {selectedCarpark && (
        <InfoWindow
          position={{
            lat: selectedCarpark.latitude,
            lng: selectedCarpark.longitude,
          }}
          onCloseClick={() => setSelectedCarpark(null)}
        >
          <div className="pb-2">
            <p className="font-semibold text-gray-900">
              Carpark Number: {selectedCarpark.carpark_num}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Area: {selectedCarpark.area}
            </p>
            <p className="text-sm text-gray-600">
              Development: {selectedCarpark.development}
            </p>

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1 font-semibold">
                Available Lots:{" "}
                {selectedCarpark.car_lots +
                  selectedCarpark.motorcycle_lots +
                  selectedCarpark.heavy_vehicle_lots}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCarpark.car_lots > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    🚗 {selectedCarpark.car_lots} cars
                  </span>
                )}
                {selectedCarpark.motorcycle_lots > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    🏍️ {selectedCarpark.motorcycle_lots} bikes
                  </span>
                )}
                {selectedCarpark.heavy_vehicle_lots > 0 && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    🚛 {selectedCarpark.heavy_vehicle_lots} heavy
                  </span>
                )}
              </div>
            </div>
            {selectedCarpark.has_rate_info && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1 font-semibold">
                  Parking Rates:
                </p>
                <div className="flex flex-col gap-1">
                  {selectedCarpark.weekdays_rate && (
                    <span className="text-xs text-gray-600">
                      Weekdays: {selectedCarpark.weekdays_rate}
                    </span>
                  )}
                  {selectedCarpark.saturday_rate && (
                    <span className="text-xs text-gray-600">
                      Saturday: {selectedCarpark.saturday_rate}
                    </span>
                  )}
                  {selectedCarpark.sunday_rate && (
                    <span className="text-xs text-gray-600">
                      Sunday/PH: {selectedCarpark.sunday_rate}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
});

// Outer component
const CarparkMap = forwardRef<CarparkMapRef, CarparkMapProps>(
  ({ carparks }, ref) => {
    return (
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          style={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 1.3521, lng: 103.8198 }} // Singapore
          defaultZoom={13}
        >
          <MapController ref={ref} carparks={carparks} />
        </Map>
      </APIProvider>
    );
  }
);

export default CarparkMap;
