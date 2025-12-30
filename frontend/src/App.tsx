import SearchBar from '@/components/SearchBar';
import { availableCarparkResponse } from '@/types/types';
import { useEffect, useState } from 'react';


function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<availableCarparkResponse[]>([]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const url = new URL("http://localhost:5001/carparks");
      url.searchParams.append("carpark_number", searchTerm);

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.carparks || []);
          console.log("Fetched carparks with number " + searchTerm + " from API");
        })
        .catch(error => {
          console.error("Error fetching carparks:", error);
          setSearchResults([]);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <>
      <SearchBar
        value={searchTerm}
        searchResults={searchResults}
        onChange={setSearchTerm}
      />
    </>
  )
}

export default App
