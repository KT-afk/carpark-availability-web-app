import { availableCarparkResponse } from "@/types/types";
import { APIProvider, InfoWindow, Map, Marker } from "@vis.gl/react-google-maps";
import { useState } from "react";

interface CarparkMapProps {
    carparks: availableCarparkResponse[];
}   

export default function CarparkMap( { carparks }: CarparkMapProps ) {
  const [selectedCarpark, setSelectedCarpark] =
    useState<availableCarparkResponse | null>(null);
    console.log('Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
      style={{ width: "100%", height: "400px" }}
        defaultCenter={{ lat: 1.3521, lng: 103.8198 }} // Singapore
        defaultZoom={13}
      >
        { carparks.map(carpark => (
            <Marker
              key={carpark.carpark_num}
              position={{ lat: carpark.latitude, lng: carpark.longitude }}
              onClick={() => setSelectedCarpark(carpark)}
              />
        ))}
        { selectedCarpark && (
            <InfoWindow
            position={{ lat: selectedCarpark.latitude, lng: selectedCarpark.longitude }}
            onCloseClick={() => setSelectedCarpark(null)}
            >
                <div>
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
                          Available Lots: {selectedCarpark.car_lots + selectedCarpark.motorcycle_lots + selectedCarpark.heavy_vehicle_lots}
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
                </div>
            </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
