import { availableCarparkResponse } from "@/types/types";

interface SmartRecommendationsProps {
  carparks: availableCarparkResponse[];
  userLocation: { lat: number; lng: number } | null;
  onCarparkClick?: (carpark: availableCarparkResponse) => void;
}

export const SmartRecommendations = ({ carparks, userLocation, onCarparkClick }: SmartRecommendationsProps) => {
  if (carparks.length === 0) return null;

  // Filter carparks with valid costs and distances
  const validCarparks = carparks.filter(
    (cp) => cp.calculated_cost !== null && cp.calculated_cost !== undefined
  );

  if (validCarparks.length === 0) return null;

  // Find cheapest
  const cheapest = validCarparks.reduce((prev, curr) =>
    (curr.calculated_cost || 0) < (prev.calculated_cost || 0) ? curr : prev
  );

  // Find closest (if user location available)
  let closest: availableCarparkResponse | null = null;
  if (userLocation) {
    const carparksWithDistance = validCarparks.filter((cp) => (cp as any).distance);
    if (carparksWithDistance.length > 0) {
      closest = carparksWithDistance.reduce((prev, curr) =>
        ((curr as any).distance || Infinity) < ((prev as any).distance || Infinity) ? curr : prev
      );
    }
  }

  // Find best value (balance of price and distance)
  let bestValue: availableCarparkResponse | null = null;
  if (userLocation && closest) {
    // Score = cost + (distance_km * $2 per km penalty)
    bestValue = validCarparks
      .filter((cp) => (cp as any).distance)
      .reduce((prev, curr) => {
        const prevScore = (prev.calculated_cost || 0) + ((prev as any).distance || 0) * 2;
        const currScore = (curr.calculated_cost || 0) + ((curr as any).distance || 0) * 2;
        return currScore < prevScore ? curr : prev;
      });
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
        <span className="mr-2">💡</span> Smart Recommendations
      </h3>
      
      <div className="space-y-2">
        {/* Best Value */}
        {bestValue && (
          <div 
            className="flex items-start justify-between bg-white rounded-md p-3 border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => onCarparkClick?.(bestValue)}
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-blue-600 mb-1">⭐ Best Value</div>
              <div className="text-sm font-semibold text-gray-900">{bestValue.development}</div>
              <div className="text-xs text-gray-600 mt-1">
                ${bestValue.calculated_cost?.toFixed(2)} · {((bestValue as any).distance)?.toFixed(1)} km away
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                ${bestValue.calculated_cost?.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Cheapest */}
        {cheapest && (!bestValue || cheapest.carpark_num !== bestValue.carpark_num) && (
          <div 
            className="flex items-start justify-between bg-white rounded-md p-3 border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => onCarparkClick?.(cheapest)}
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-green-600 mb-1">💰 Cheapest</div>
              <div className="text-sm font-semibold text-gray-900">{cheapest.development}</div>
              {(cheapest as any).distance && (
                <div className="text-xs text-gray-600 mt-1">
                  {((cheapest as any).distance)?.toFixed(1)} km away
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                ${cheapest.calculated_cost?.toFixed(2)}
              </div>
              {bestValue && cheapest.calculated_cost! < bestValue.calculated_cost! && (
                <div className="text-xs text-green-600 font-medium">
                  Save ${(bestValue.calculated_cost! - cheapest.calculated_cost!).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Closest */}
        {closest && (!bestValue || closest.carpark_num !== bestValue.carpark_num) && (!cheapest || closest.carpark_num !== cheapest.carpark_num) && (
          <div 
            className="flex items-start justify-between bg-white rounded-md p-3 border border-purple-100 cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={() => onCarparkClick?.(closest)}
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-purple-600 mb-1">🏃 Closest</div>
              <div className="text-sm font-semibold text-gray-900">{closest.development}</div>
              <div className="text-xs text-gray-600 mt-1">
                {((closest as any).distance)?.toFixed(1)} km away
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                ${closest.calculated_cost?.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
