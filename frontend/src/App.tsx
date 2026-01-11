import SearchBar from "@/components/SearchBar";
import { availableCarparkResponse } from "@/types/types";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import CarparkMap from "./components/CarparkMap";
import { CarparkMapRef } from "./components/CarparkMap";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    availableCarparkResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<CarparkMapRef>(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setIsLoading(false);
      return;
    }


    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const url = new URL("http://localhost:5001/carparks");
      url.searchParams.append("carpark_number", searchTerm);

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.carparks || []);
          setIsLoading(false);
          console.log(
            "Fetched carparks with number " + searchTerm + " from API"
          );
        })
        .catch((error) => {
          console.error("Error fetching carparks:", error);
          setSearchResults([]);
          setIsLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [searchTerm]);
  const handleCarparkSelect = useCallback((carpark: availableCarparkResponse) => {
    mapRef.current?.panToCarpark(carpark.latitude, carpark.longitude, carpark);
  }, []);

  // Memoize searchResults to prevent new array references on every render
  const memoizedSearchResults = useMemo(() => searchResults, [searchResults]);

  // Memoize the empty array to prevent new references
  const emptyArray = useMemo(() => [], []);

  return (
    <>
    <div className="relative h-screen w-full">
      <CarparkMap ref={mapRef} carparks={memoizedSearchResults.length > 0 ? memoizedSearchResults : emptyArray} />
      <SearchBar
        value={searchTerm}
        searchResults={memoizedSearchResults}
        isLoading={isLoading}
        onChange={setSearchTerm}
        onCarparkSelect={handleCarparkSelect}
      />
      </div>
    </>
  );
}

export default App;
