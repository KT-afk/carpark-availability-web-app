import { availableCarparkResponse } from "@/types/types";
import { Loader2, Mic, Search, X, MapPin, Star } from "lucide-react";
import { SmartRecommendations } from "./SmartRecommendations";
import { TimeBasedAlert } from "./TimeBasedAlert";
import { FavoritesAndRecent } from "./FavoritesAndRecent";
import { isFavorite, addFavorite, removeFavorite, addRecentSearch } from "@/services/localStorage";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  searchResults: availableCarparkResponse[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onCarparkSelect: (carpark: availableCarparkResponse) => void;
  isDropdownVisible: boolean;
  onDismissDropdown: () => void;
  onNearMeClick?: () => void;
  hasUserLocation?: boolean;
  userLocation: { lat: number; lng: number } | null;
  duration: number;
  dayType: 'weekday' | 'saturday' | 'sunday';
}

const SearchBar = ({
  value,
  searchResults,
  isLoading,
  onChange,
  onCarparkSelect,
  isDropdownVisible,
  onDismissDropdown,
  onNearMeClick,
  hasUserLocation = false,
  userLocation,
  duration,
  dayType,
}: SearchBarProps) => {
  const [forceUpdate, setForceUpdate] = useState(0);
  const pendingFavoriteSelect = useRef<string | null>(null);

  const showDropdown =
    value.trim() !== "" && isDropdownVisible && (isLoading || searchResults.length > 0);
  
  const showFavoritesPanel = value.trim() === "" && isDropdownVisible;

  const handleResultClick = (carpark: availableCarparkResponse) => {
    // Save to recent searches if it's a manual search (not from favorites)
    if (value.trim() !== "" && value.toLowerCase() !== "near me") {
      addRecentSearch(value);
    }
    onCarparkSelect(carpark);
    onDismissDropdown(); // Hide dropdown when result clicked
  };

  const handleFavoriteToggle = (e: React.MouseEvent, carpark: availableCarparkResponse) => {
    e.stopPropagation();
    if (isFavorite(carpark.carpark_num)) {
      removeFavorite(carpark.carpark_num);
    } else {
      addFavorite({
        carpark_num: carpark.carpark_num,
        development: carpark.development,
        area: carpark.area,
      });
    }
    setForceUpdate(prev => prev + 1); // Force re-render to update star icons
  };

  // Auto-select carpark when favorite click triggers search results
  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      pendingSelect: pendingFavoriteSelect.current,
      isLoading,
      resultsCount: searchResults.length
    });
    
    if (pendingFavoriteSelect.current && !isLoading && searchResults.length > 0) {
      const carpark = searchResults.find(cp => cp.carpark_num === pendingFavoriteSelect.current);
      console.log('🔍 Looking for carpark:', pendingFavoriteSelect.current, 'Found:', carpark?.development);
      
      if (carpark) {
        console.log('✅ Auto-selecting favorite carpark:', carpark.development);
        handleResultClick(carpark);
        pendingFavoriteSelect.current = null;
      }
    }
  }, [searchResults, isLoading]);

  // Don't filter - show all results regardless of availability
  const filteredResults = searchResults;

  return (
    <div className="flex fixed top-0 left-0 right-0 justify-center pt-4 px-4 z-30 p-4 pointer-events-none">
      <div className="w-full max-w-2xl pointer-events-auto">
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 pr-32 text-base shadow-md transition-shadow duration-200 hover:shadow-lg focus:border-gray-300 focus:outline-none"
              placeholder="Search for carpark by name, area, or number"
            />
            <div className="absolute right-0 top-0 mr-4 mt-3 flex items-center gap-2">
              {onNearMeClick && (
                <button
                  type="button"
                  className={`transition-colors ${
                    hasUserLocation
                      ? 'text-blue-500 hover:text-blue-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={onNearMeClick}
                  title={hasUserLocation ? "Find carparks near me" : "Getting location..."}
                >
                  <MapPin size={20} />
                </button>
              )}
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  alert("Voice search is unsupported in this demo.")
                }
              >
                <Mic size={20} />
              </button>
              <Search size={20} className="text-blue-500" />
            </div>
          </div>

          {/* Favorites & Recent Searches Panel */}
          {showFavoritesPanel && (
            <div className="absolute z-10 mt-2 w-full">
              <FavoritesAndRecent
                isVisible={showFavoritesPanel}
                onFavoriteClick={(fav) => {
                  console.log('⭐ Favorite clicked:', fav.development, fav.carpark_num);
                  // Search by development name (more specific than carpark number)
                  pendingFavoriteSelect.current = fav.carpark_num;
                  onChange(fav.development);
                }}
                onRecentSearchClick={(term) => {
                  onChange(term);
                }}
              />
            </div>
          )}

          {showDropdown && (
            <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
              {/* Header with dismiss button */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {filteredResults.length} results
                  </span>
                  <button
                    onClick={onDismissDropdown}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss results"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2
                    className="animate-spin text-blue-500 mr-2"
                    size={24}
                  />
                  <span className="text-gray-600">Searching...</span>
                </div>
              ) : filteredResults.length > 0 ? (
                <div>
                  {/* Smart Recommendations */}
                  <div className="px-4 pt-4">
                    <SmartRecommendations 
                      carparks={filteredResults} 
                      userLocation={userLocation}
                      duration={duration}
                      onCarparkClick={handleResultClick}
                    />
                  </div>
                  
                  {/* Results list */}
                  <ul className="divide-y divide-gray-100">
                    {filteredResults.map((result, index) => (
                    <li
                      key={index}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {result.development}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {result.carpark_num} • {result.area}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleFavoriteToggle(e, result)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              title={isFavorite(result.carpark_num) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star 
                                className={`w-5 h-5 ${isFavorite(result.carpark_num) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`}
                              />
                            </button>
                          </div>
                        </div>
                        {(result as any).distance !== undefined && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                            📍 {((result as any).distance).toFixed(1)} km
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1 font-semibold">
                          Available Lots: {result.car_lots + result.motorcycle_lots + result.heavy_vehicle_lots}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.car_lots > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              🚗 {result.car_lots} cars
                            </span>
                          )}
                          {result.motorcycle_lots > 0 && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              🏍️ {result.motorcycle_lots} bikes
                            </span>
                          )}
                          {result.heavy_vehicle_lots > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              🚛 {result.heavy_vehicle_lots} heavy
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI-calculated cost display */}
                      {result.calculated_cost !== null && result.calculated_cost !== undefined ? (
                        <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-green-900 font-bold text-xl">
                              ${result.calculated_cost.toFixed(2)}
                            </span>
                            {result.ai_confidence === 'low' && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                ⚠️ Estimate
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-green-700">
                            {result.cost_breakdown}
                          </div>
                        </div>
                      ) : result.has_pricing ? (
                        <div className="mt-3 text-xs text-gray-500 italic">
                          Select duration above to calculate cost
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-gray-400 italic">
                          Pricing data unavailable
                        </div>
                      )}

                      {/* Time-based pricing alert */}
                      <TimeBasedAlert 
                        carpark={result} 
                        duration={duration} 
                        dayType={dayType} 
                      />
                    </li>
                  ))}
                </ul>
                </div>
              ) : showAvailableOnly && searchResults.length > 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="mb-2">No carparks with 50+ available lots</p>
                  <button
                    onClick={() => onAvailableOnlyChange(false)}
                    className="text-blue-500 hover:text-blue-700 text-sm underline"
                  >
                    Show all results
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No carparks found
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
