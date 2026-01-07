import { availableCarparkResponse } from "@/types/types";
import { Loader2, Mic, Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  searchResults: availableCarparkResponse[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onCarparkSelect: (carpark: availableCarparkResponse) => void;
}

const SearchBar = ({
  value,
  searchResults,
  isLoading,
  onChange,
  onCarparkSelect,
}: SearchBarProps) => {
  const showDropdown =
    value.trim() !== "" && (isLoading || searchResults.length > 0);

  return (
    <div className="flex fixed top-0 left-0 right-0 justify-center pt-4 px-4 z-30 p-4 pointer-events-none">
      <div className="w-full max-w-2xl pointer-events-auto">
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 pr-20 text-base shadow-md transition-shadow duration-200 hover:shadow-lg focus:border-gray-300 focus:outline-none"
              placeholder="Search for carpark number"
            />
            <div className="absolute right-0 top-0 mr-4 mt-3 flex items-center">
              <button
                type="button"
                className="mr-3 text-gray-400 hover:text-gray-600"
                onClick={() =>
                  alert("Voice search is unsupported in this demo.")
                }
              >
                <Mic size={20} />
              </button>
              <Search size={20} className="text-blue-500" />
            </div>
          </div>

          {showDropdown && (
            <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2
                    className="animate-spin text-blue-500 mr-2"
                    size={24}
                  />
                  <span className="text-gray-600">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {searchResults.map((result, index) => (
                    <li
                      key={index}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onCarparkSelect(result)}
                    >
                      <p className="font-semibold text-gray-900">
                        Carpark Number: {result.carpark_num}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Area: {result.area}
                      </p>
                      <p className="text-sm text-gray-600">
                        Development: {result.development}
                      </p>

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
                    </li>
                  ))}
                </ul>
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
