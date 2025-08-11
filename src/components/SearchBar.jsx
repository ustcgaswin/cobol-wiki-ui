import React, { memo } from "react";
import { Search } from "lucide-react";

const SearchBar = memo(({ searchQuery, setSearchQuery, resultsCount, inputRef, placeholder }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.target.blur();
    }
  };

  return (
    <div className="mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search projects by name, description, or language..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              w-full
              pl-12 pr-4 py-4
              text-lg
              border 
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-[#244b72]
              focus:border-none
              focus:border-transparent
              transition-all
              duration-200
              hover:shadow-sm
            "
          />
        </div>
        {searchQuery && (
          <div className="mt-3 text-sm text-gray-600">
            {resultsCount} project{resultsCount !== 1 ? "s" : ""} found
            {searchQuery && (
              <>
                {" "}
                for "<span className="font-medium">{searchQuery}</span>"
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;