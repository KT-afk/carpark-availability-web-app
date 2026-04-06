import { availableCarparkResponse } from "@/types/types";

interface SmartRecommendationsProps {
  carparks: availableCarparkResponse[];
  userLocation: { lat: number; lng: number } | null;
  duration: number;
  onCarparkClick?: (carpark: availableCarparkResponse) => void;
}

// Estimate parking cost from pricing info if AI calculation not available
const estimateCost = (carpark: availableCarparkResponse, duration: number): number => {
  if (carpark.calculated_cost !== null && carpark.calculated_cost !== undefined) {
    return carpark.calculated_cost;
  }
  
  // Fallback: Estimate from pricing info
  if (carpark.pricing?.weekday_rate) {
    const rateStr = carpark.pricing.weekday_rate;
    
    // Extract first number from rate string (e.g., "$0.60 per hour" -> 0.60)
    const match = rateStr.match(/\$?(\d+\.?\d*)/);
    if (match) {
      const hourlyRate = parseFloat(match[1]);
      return hourlyRate * duration;
    }
  }
  
  // Default estimate: $1.50/hour (conservative)
  return 1.5 * duration;
};

export const SmartRecommendations = ({ carparks, userLocation, duration, onCarparkClick }: SmartRecommendationsProps) => {
  if (carparks.length === 0) return null;

  // Include ALL carparks, estimate costs if needed
  const validCarparks = carparks.map(cp => ({
    ...cp,
    estimatedCost: estimateCost(cp, duration)
  }));

  if (validCarparks.length === 0) return null;
  const findBest = (carparks: typeof validCarparks, scoreFn: (cp: typeof validCarparks[0]) => number) => {
    return carparks.reduce((prev, curr) => 
      scoreFn(curr) < scoreFn(prev) ? curr : prev
  )} 
  // Find cheapest
  const cheapest = findBest(validCarparks, cp=> cp.estimatedCost + (cp.distance as number || 0)*0.0001);
  

  // Find closest (if user location available)
  let closest: typeof validCarparks[0] | null = null;
  let carparksWithDistance: typeof validCarparks = [];
  let bestValue: typeof validCarparks[0] | null = null;

  if (userLocation) {
    carparksWithDistance = validCarparks.filter((cp) => (cp as any).distance !== undefined);
    if (carparksWithDistance.length > 0) {
      closest = findBest(carparksWithDistance, cp => cp.distance as number);
    }
  }
  if (userLocation && carparksWithDistance.length > 0) {
    const distancePenalty = 0.5 * duration;
    bestValue = findBest(carparksWithDistance, cp =>
      cp.estimatedCost + (cp.distance as number) * distancePenalty
    );
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
                ${bestValue.estimatedCost.toFixed(2)} · {((bestValue as any).distance)?.toFixed(1)} km away
              </div>
              {/* Show value explanation */}
              {bestValue.carpark_num !== cheapest.carpark_num && bestValue.carpark_num !== closest?.carpark_num && (
                <div className="text-xs text-blue-600 font-medium mt-1">
                  Balance of cost & distance
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                ${bestValue.estimatedCost.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Cheapest */}
        {cheapest && (
          <div 
            className="flex items-start justify-between bg-white rounded-md p-3 border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => onCarparkClick?.(cheapest)}
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-green-600 mb-1">💰 Cheapest</div>
              <div className="text-sm font-semibold text-gray-900">{cheapest.development}</div>
              {(cheapest as any).distance !== undefined && (
                <div className="text-xs text-gray-600 mt-1">
                  {((cheapest as any).distance)?.toFixed(1)} km away
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                ${cheapest.estimatedCost.toFixed(2)}
              </div>
              {bestValue && cheapest.estimatedCost < bestValue.estimatedCost && (
                <div className="text-xs text-green-600 font-medium">
                  Save ${(bestValue.estimatedCost - cheapest.estimatedCost).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Closest */}
        {closest && (
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
                ${closest.estimatedCost.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
