import SearchBar from "@/components/SearchBar";
import { availableCarparkResponse } from "@/types/types";
import { useEffect, useState, useRef } from "react";
import CarparkMap from "./components/CarparkMap";
import { CarparkMapRef } from "./components/CarparkMap";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    availableCarparkResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(true);
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
  const handleCarparkSelect = (carpark: availableCarparkResponse) => {
    mapRef.current?.panToCarpark(carpark.latitude, carpark.longitude);
    setIsDropdownVisible(false); // Hide dropdown
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsDropdownVisible(true); // Show dropdown when typing
  };
  return (
    <>
    <div className="relative h-screen w-full">
      <CarparkMap ref={mapRef} carparks={searchResults || []} />
      <SearchBar
        value={searchTerm}
        searchResults={searchResults}
        isLoading={isLoading}
        onChange={handleSearchChange}
        onCarparkSelect={handleCarparkSelect}
        isDropdownVisible={isDropdownVisible}
      />
      </div>
    </>
  );
}

export default App;
