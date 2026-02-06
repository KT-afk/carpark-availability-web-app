import { Star, X, Clock } from "lucide-react";
import { getFavorites, getRecentSearches, clearRecentSearches, FavoriteCarpark, RecentSearch } from "@/services/localStorage";
import { useState, useEffect } from "react";

interface FavoritesAndRecentProps {
  onFavoriteClick: (favorite: FavoriteCarpark) => void;
  onRecentSearchClick: (term: string) => void;
  isVisible: boolean;
}

export const FavoritesAndRecent = ({ onFavoriteClick, onRecentSearchClick, isVisible }: FavoritesAndRecentProps) => {
  const [favorites, setFavorites] = useState<FavoriteCarpark[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    if (isVisible) {
      setFavorites(getFavorites());
      setRecentSearches(getRecentSearches());
    }
  }, [isVisible]);

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isVisible || (favorites.length === 0 && recentSearches.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-700">Favorites</h3>
          </div>
          <div className="space-y-1">
            {favorites.map((fav) => (
              <button
                key={fav.carpark_num}
                onClick={() => onFavoriteClick(fav)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="font-medium text-sm text-gray-900">{fav.development}</div>
                <div className="text-xs text-gray-600">{fav.carpark_num} • {fav.area}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches Section */}
      {recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
            </div>
            <button
              onClick={handleClearRecent}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => onRecentSearchClick(search.term)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors flex items-center justify-between group"
              >
                <span className="text-sm text-gray-700">{search.term}</span>
                <Clock className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
