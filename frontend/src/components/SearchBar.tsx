import { availableCarparkResponse } from '@/types/types';
import { Mic, Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  searchResults: availableCarparkResponse[];
  onChange: (value: string) => void;
}

const SearchBar = ({ value, searchResults, onChange }: SearchBarProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white p-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-8 w-full max-w-2xl"
      >
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
                alert(
                  "Voice search is unsupported in this demo."
                )
              }
            >
              <Mic size={20} />
            </button>
            <button type="submit" className="text-blue-500 hover:text-blue-600">
              <Search size={20} />
            </button>
          </div>
        </div>
      </form>
      {searchResults && searchResults.length > 0 && (
        <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Search Results:</h2>
          <ul>
            {searchResults.map((result, index) => (
              <li key={index} className="mb-4 border-b pb-2">
                <p className="font-semibold">Carpark: {result.carpark_num}</p>
                <p>Available: {result.lots_available} / {result.total_lots} lots</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
