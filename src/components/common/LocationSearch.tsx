import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import rwandaApiService from '@/services/rwandaApi';

interface LocationSearchProps {
  onLocationSelect?: (location: any) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationSearch({ 
  onLocationSelect, 
  placeholder = "Search for provinces, districts, sectors...",
  className = ""
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await rwandaApiService.searchLocations(query);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Location search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: any) => {
    setQuery(location.name);
    setShowResults(false);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !query.trim()}
          size="sm"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((location, index) => (
            <div
              key={`${location.type}-${location.id}-${index}`}
              onClick={() => handleLocationSelect(location)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {location.type}
                  </p>
                </div>
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-center">
            No locations found
          </div>
        </div>
      )}
    </div>
  );
}
