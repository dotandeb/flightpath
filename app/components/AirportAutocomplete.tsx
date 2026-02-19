"use client";

import { useState, useRef, useEffect } from "react";
import { searchAirports, AIRPORTS } from "../lib/flight-api";
import { Plane, X } from "lucide-react";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function AirportAutocomplete({ value, onChange, placeholder, label }: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update query when value changes externally
  useEffect(() => {
    if (value && !query) {
      const airport = AIRPORTS.find(a => a.code === value.toUpperCase());
      if (airport) {
        setSelectedAirport(airport);
        setQuery(`${airport.city} (${airport.code})`);
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedAirport(null);
    onChange(""); // Clear the code until selected
    
    if (newQuery.length >= 2) {
      const results = searchAirports(newQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setQuery(`${airport.city} (${airport.code})`);
    onChange(airport.code);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedAirport(null);
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder || "Search city or airport..."}
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">
                    {airport.city} <span className="text-sky-600">({airport.code})</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {airport.name}, {airport.country}
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {airport.country}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-slate-500">
          No airports found. Try a city name or 3-letter code (e.g., LHR, JFK)
        </div>
      )}
    </div>
  );
}
