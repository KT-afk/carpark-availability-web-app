import { addFavorite, addRecentSearch, clearRecentSearches, getRecentSearches, isFavorite, removeFavorite, RecentSearch } from "@/services/localStorage";
import { availableCarparkResponse } from "@/types/types";
import { logger } from "@/utils/logger";
import { Clock, Loader2, MapPin, Search, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { RadiusSelector } from "./RadiusSelector";
import { SmartRecommendations } from "./SmartRecommendations";

interface SearchBarProps {
  value: string;
  searchResults: availableCarparkResponse[];
  isLoading: boolean;
  searchCentre: { lat: number, lng: number} | null;
  searchTerm: string;
  radius: number;
  setRadius: (value: number) => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  onCarparkSelect: (carpark: availableCarparkResponse) => void;
  isDropdownVisible: boolean;
  onDismissDropdown: () => void;
  onFavoritesClick: () => void;
  onNearMeClick?: () => void;
  hasUserLocation?: boolean;
  userLocation: { lat: number; lng: number } | null;
  duration: number;
  onDurationChange: (hours: number) => void;
  dayType: 'weekday' | 'saturday' | 'sunday';
  onDayTypeChange: (type: 'weekday' | 'saturday' | 'sunday') => void;
}

const commonDurations = [0.5, 1, 2, 3, 4, 6];

const formatDuration = (hours: number) => {
  if (hours < 1) return `${hours * 60}min`;
  return `${hours}hr${hours > 1 ? 's' : ''}`;
};

const SearchBar = ({
  value,
  searchResults,
  isLoading,
  searchCentre,
  radius,
  searchTerm,
  setRadius,
  onChange,
  onFocus,
  onCarparkSelect,
  isDropdownVisible,
  onDismissDropdown,
  onFavoritesClick,
  onNearMeClick,
  hasUserLocation = false,
  userLocation,
  duration,
  onDurationChange,
  dayType,
  onDayTypeChange,
}: SearchBarProps) => {
  const [forceUpdate, setForceUpdate] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const showDropdown =
    value.trim() !== "" && isDropdownVisible && (isLoading || searchResults.length > 0);
  const showRecentSearches =
    value.trim() === "" && isDropdownVisible && recentSearches.length > 0;
  const showDurationStrip = value.trim() !== "";

  useEffect(() => {
    if (isDropdownVisible && value.trim() === "") {
      setRecentSearches(getRecentSearches());
    }
  }, [isDropdownVisible, value]);

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRecentClick = (term: string) => {
    onChange(term);
    onDismissDropdown();
  };

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
      addFavorite(carpark);
    }
    setForceUpdate(prev => prev + 1); // Force re-render to update star icons
  };


  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center p-4 z-30 pointer-events-none">
      <div className="w-full max-w-2xl pointer-events-auto">
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              className="w-full appearance-none rounded-full border border-gray-200 bg-white px-5 py-3 pr-32 text-base shadow-md transition-shadow duration-200 hover:shadow-lg focus:border-gray-300 focus:outline-none"
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
              <Search size={20} className="text-blue-500" />
              <button
                type="button"
                onClick={onFavoritesClick}
                title="My Favourites"
                className="cursor-pointer"
              >
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
              </button>
            </div>
          </div>

          {/* Duration strip: always visible when search term exists */}
          {showDurationStrip && (
            <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
              {/* Desktop: single row */}
              <div className="hidden md:flex flex-wrap items-center gap-1.5">
                {commonDurations.map(hours => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => onDurationChange(hours)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      duration === hours
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDuration(hours)}
                  </button>
                ))}
                <span className="text-gray-300">|</span>
                {([['weekday', 'Wkday'], ['saturday', 'Sat'], ['sunday', 'Sun']] as const).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onDayTypeChange(type)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      dayType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Mobile: stacked layout */}
              <div className="md:hidden">
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {commonDurations.map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => onDurationChange(hours)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        duration === hours
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatDuration(hours)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">Custom:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={duration}
                      onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.5)}
                      className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                    />
                    <span className="text-xs text-gray-500">hrs</span>
                  </div>
                  <div className="flex gap-1.5">
                    {([['weekday', 'Wkday'], ['saturday', 'Sat'], ['sunday', 'Sun']] as const).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onDayTypeChange(type)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          dayType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {searchCentre && (
                <div className="mt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Search Radius
                  </div>
                  <RadiusSelector
                    radius={radius}
                    onChange={setRadius}
                    resultCount={searchResults.length}
                    placeName={searchTerm}
                  />
                </div>
              )}
            </div>
          )}

          {showDropdown && (
            <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
              {/* Header with dismiss button */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {searchResults.length} results
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
              ) : searchResults.length > 0 ? (
                <div>
                  {/* Smart Recommendations */}
                  <div className="px-4 pt-4">
                    <SmartRecommendations
                      carparks={searchResults}
                      userLocation={userLocation}
                      duration={duration}
                      onCarparkClick={handleResultClick}
                    />
                  </div>

                  {/* Results list */}
                  <ul className="divide-y divide-gray-100">
                    {searchResults.map((result, index) => (
                    <li
                      key={index}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleFavoriteToggle(e, result)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                          title={isFavorite(result.carpark_num) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            className={`w-4 h-4 ${isFavorite(result.carpark_num) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                          />
                        </button>
                        <span className="font-medium text-gray-900 text-sm truncate flex-1">
                          {result.development}
                        </span>
                        <span className={`shrink-0 w-2 h-2 rounded-full ${result.car_lots > 10 ? 'bg-green-500' : result.car_lots > 0 ? 'bg-orange-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-gray-600 shrink-0 w-8 text-right">{result.car_lots}</span>
                        {result.calculated_cost !== null && result.calculated_cost !== undefined && (
                          <span className="text-xs font-semibold text-green-700 shrink-0">
                            ${result.calculated_cost.toFixed(2)}
                          </span>
                        )}
                        {(result as any).distance !== undefined && (
                          <span className="text-xs text-gray-500 shrink-0">
                            {((result as any).distance).toFixed(1)}km
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No carparks found
                </div>
              )}
            </div>
          )}
          {showRecentSearches && (
            <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search) => (
                <div
                  key={search.timestamp}
                  onClick={() => handleRecentClick(search.term)}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{search.term}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
