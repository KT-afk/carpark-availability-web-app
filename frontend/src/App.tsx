import SearchBar from '@/components/SearchBar';
import { availableCarparkResponse } from '@/types/types';
import { useEffect, useState } from 'react';


function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<availableCarparkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      const url = new URL("http://localhost:5001/carparks");
      url.searchParams.append("carpark_number", searchTerm);

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.carparks || []);
          setIsLoading(false);
          console.log("Fetched carparks with number " + searchTerm + " from API");
        })
        .catch(error => {
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

  return (
    <>
      <SearchBar
        value={searchTerm}
        searchResults={searchResults}
        isLoading={isLoading}
        onChange={setSearchTerm}
      />
    </>
  )
}

export default App
