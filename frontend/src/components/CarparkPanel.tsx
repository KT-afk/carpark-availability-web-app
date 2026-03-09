import { availableCarparkResponse } from "@/types/types";
import { useEffect, useState } from "react";
import { getAddressAndPostalCode } from "@/services/geocoding";
import { isFavorite, addFavorite, removeFavorite } from "@/services/localStorage";
import { X, Star, Car, Bike, Truck, MapPin, Loader2 } from "lucide-react";

interface CarparkPanelProps {
  carpark: availableCarparkResponse | null;
  show: boolean;
  onClose: () => void;
  duration: number;
  dayType: 'weekday' | 'saturday' | 'sunday';
}

export function CarparkPanel({ carpark, show, onClose, duration, dayType }: CarparkPanelProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);

  // Reset and reload address whenever the selected carpark changes
  useEffect(() => {
    if (!carpark) return;

    setAddress(null);
    setPostalCode(null);
    setFavorited(isFavorite(carpark.carpark_num));

    setAddressLoading(true);
    getAddressAndPostalCode(carpark.latitude, carpark.longitude).then((result) => {
      setAddress(result.address);
      setPostalCode(result.postalCode);
      setAddressLoading(false);
    });
  }, [carpark?.carpark_num]);

  const toggleFavorite = () => {
    if (!carpark) return;
    if (favorited) {
      removeFavorite(carpark.carpark_num);
    } else {
      addFavorite(carpark);
    }
    setFavorited(!favorited);
  };

  const rateForDay = () => {
    if (!carpark?.pricing) return null;
    if (dayType === 'weekday') return carpark.pricing.weekday_rate;
    if (dayType === 'saturday') return carpark.pricing.saturday_rate;
    return carpark.pricing.sunday_rate;
  };

  // Mobile: slides up from bottom; Desktop: slides in from left
  const transformClass = show
    ? "translate-y-0 md:translate-y-0 md:translate-x-0"
    : "translate-y-full md:translate-y-0 md:-translate-x-full";

  return (
    <div
      className={[
        // Base positioning
        "fixed bottom-0 left-0 right-0 z-40",
        // Desktop overrides
        "md:top-0 md:right-auto md:w-80 md:max-h-screen md:h-full",
        // Appearance
        "bg-white shadow-2xl",
        "rounded-t-3xl md:rounded-none",
        // Scroll
        "overflow-y-auto max-h-[75vh] md:max-h-screen",
        // Animation
        "transition-transform duration-200 ease-out motion-reduce:transition-none",
        transformClass,
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label="Carpark details"
    >
      {/* Drag handle — mobile only */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {carpark && (
        <div className="px-5 pb-8 pt-2 md:pt-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {/* Agency badge */}
              <span
                className={[
                  "inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
                  carpark.agency === "HDB"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800",
                ].join(" ")}
              >
                {carpark.agency}
              </span>

              {/* Carpark name */}
              <h2 className="text-base font-bold text-gray-900 truncate leading-snug">
                {carpark.development}
              </h2>

              {/* ID + area + distance */}
              <p className="text-xs text-gray-500 mt-0.5">
                {carpark.carpark_num}
                {carpark.area ? ` · ${carpark.area}` : ""}
                {carpark.distance != null
                  ? ` · ${carpark.distance.toFixed(2)} km`
                  : ""}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {/* Favourite button */}
              <button
                onClick={toggleFavorite}
                aria-label={favorited ? "Remove from favourites" : "Add to favourites"}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              >
                <Star
                  size={20}
                  className={favorited ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
                />
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
            {addressLoading ? (
              <span className="flex items-center gap-1.5 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Loading address…
              </span>
            ) : address ? (
              <span>
                {address}
                {postalCode ? ` · S(${postalCode})` : ""}
              </span>
            ) : (
              <span className="text-gray-400">Address unavailable</span>
            )}
          </div>

          {/* Availability */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Availability
            </h3>
            <div className="flex flex-wrap gap-2">
              <LotPill icon={<Car size={14} />} label="Car" count={carpark.car_lots} />
              <LotPill icon={<Bike size={14} />} label="Motorcycle" count={carpark.motorcycle_lots} />
              <LotPill icon={<Truck size={14} />} label="Heavy" count={carpark.heavy_vehicle_lots} />
            </div>
          </div>

          {/* Pricing */}
          {carpark.pricing && (
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pricing
              </h3>
              <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5 text-sm">
                <RateRow label="Weekday" value={carpark.pricing.weekday_rate} active={dayType === 'weekday'} />
                {carpark.pricing.weekday_rate_after_hours && (
                  <RateRow label="Weekday (after hrs)" value={carpark.pricing.weekday_rate_after_hours} active={false} />
                )}
                <RateRow label="Saturday" value={carpark.pricing.saturday_rate} active={dayType === 'saturday'} />
                <RateRow label="Sun / PH" value={carpark.pricing.sunday_rate} active={dayType === 'sunday'} />
              </div>

              {/* AI-calculated cost */}
              {carpark.calculated_cost != null && (
                <div className="mt-3 rounded-2xl bg-cyan-50 border border-cyan-200 px-3 py-2.5">
                  <p className="text-xs text-cyan-700 font-medium mb-0.5">
                    Estimated cost for {duration}h ({dayType})
                  </p>
                  <p className="text-xl font-bold text-cyan-900">
                    ${carpark.calculated_cost.toFixed(2)}
                  </p>
                  {carpark.cost_breakdown && (
                    <p className="text-xs text-cyan-600 mt-0.5">{carpark.cost_breakdown}</p>
                  )}
                </div>
              )}

              {/* No calculated cost but pricing exists — show today's rate */}
              {carpark.calculated_cost == null && rateForDay() && (
                <p className="text-xs text-gray-500 mt-2">
                  Today's rate: {rateForDay()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LotPill({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  const available = count > 0;
  return (
    <div
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        available
          ? "bg-green-50 text-green-800"
          : "bg-gray-100 text-gray-400",
      ].join(" ")}
    >
      {icon}
      <span>{count}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function RateRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className={["flex justify-between gap-2", active ? "font-semibold text-gray-900" : "text-gray-600"].join(" ")}>
      <span>{label}{active ? " (today)" : ""}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
