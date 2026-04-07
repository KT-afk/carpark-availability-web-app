import {
  FavoriteCarpark,
  getFavorites,
  removeFavorite,
} from "@/services/localStorage";
import { MapPin, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FavoritesPanelProps {
  show: boolean;
  onFavoriteClick: (fav: FavoriteCarpark) => void;
  onClose: () => void;
}

export function FavoritesPanel({
  show,
  onFavoriteClick,
  onClose,
}: FavoritesPanelProps) {
  const [favoriteCarparks, setFavoriteCarparks] = useState<FavoriteCarpark[]>([]);

  const handleRemoveFavorite = (e: React.MouseEvent, carpark_num: string) => {
    e.stopPropagation();
    removeFavorite(carpark_num);
    setFavoriteCarparks((prev) =>
      prev.filter((f) => f.carpark_num !== carpark_num),
    );
  };

  const transformClass = show
    ? "translate-y-0 md:translate-y-0 md:translate-x-0"
    : "translate-y-full md:translate-y-0 md:-translate-x-full";

  useEffect(() => {
    if (show) setFavoriteCarparks(getFavorites());
  }, [show]);

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-40",
        "md:top-0 md:right-auto md:w-80 md:max-h-screen md:h-full",
        "bg-white shadow-2xl",
        "rounded-t-3xl md:rounded-none",
        "overflow-y-auto max-h-[75vh] md:max-h-screen",
        "transition-transform duration-200 ease-out motion-reduce:transition-none",
        transformClass,
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label="My Favourites"
    >
      {/* Drag handle — mobile only */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Star size={18} className="fill-yellow-400 text-yellow-400" />
          <h2 className="text-lg font-bold text-gray-900">My Favourites</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Favourites list */}
      <div className="flex flex-col">
        {favoriteCarparks.length === 0 && (
          <div className="px-5 py-12 text-center">
            <Star size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No favourites yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Tap the star on any carpark to save it here
            </p>
          </div>
        )}
        {favoriteCarparks.map((fav) => (
          <div
            key={fav.carpark_num}
            onClick={() => onFavoriteClick(fav)}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{fav.development}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fav.carpark_num} · {fav.area}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => handleRemoveFavorite(e, fav.carpark_num)}
              aria-label={`Remove ${fav.development} from favourites`}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
