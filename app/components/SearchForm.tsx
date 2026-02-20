"use client";

import { useState, useRef, useEffect } from "react";
import { searchLocations, Location } from "../lib/flight-engine";
import { Calendar, Users, ArrowRight, Loader2, Plane, Repeat, MapPin, X } from "lucide-react";

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
}

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

const TRAVEL_CLASSES = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First Class" },
];

// Location Autocomplete Component
function LocationInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && !selectedLocation) {
      const loc = searchLocations(value)[0];
      if (loc) {
        setSelectedLocation(loc);
        setQuery(`${loc.city} (${loc.code})`);
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedLocation(null);
    onChange("");

    if (newQuery.length >= 2) {
      const results = searchLocations(newQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (location: Location) => {
    setSelectedLocation(location);
    setQuery(`${location.city} (${location.code})`);
    onChange(location.city); // Pass city name for resolution
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedLocation(null);
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder || "City or airport"}
          className="w-full pl-10 pr-10 py-3 bg-transparent text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
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

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((location) => (
            <button
              key={location.code}
              type="button"
              onClick={() => handleSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {location.city} <span className="text-sky-600">({location.code})</span>
                  </p>
                  <p className="text-sm text-slate-500">{location.name}, {location.country}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState<SearchParams["travelClass"]>("ECONOMY");
  const [tripType, setTripType] = useState<"return" | "oneWay">("return");
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  const totalPassengers = adults + children + infants;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) return;

    onSearch({
      origin,
      destination,
      departureDate,
      returnDate: tripType === "return" ? returnDate : departureDate,
      adults,
      children,
      infants,
      travelClass,
    });
  };

  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Trip Type */}
      <div className="flex gap-2">
        {["return", "oneWay"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type as "return" | "oneWay")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tripType === type
                ? "bg-sky-100 text-sky-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {type === "return" ? "Return" : "One way"}
          </button>
        ))}
      </div>

      {/* Locations */}
      <div className="grid md:grid-cols-2 gap-3 relative">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <LocationInput
            label="From"
            value={origin}
            onChange={setOrigin}
            placeholder="London"
          />
        </div>

        <button
          type="button"
          onClick={swapLocations}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center hover:bg-slate-50"
        >
          <Repeat className="w-4 h-4 text-slate-600" />
        </button>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <LocationInput
            label="To"
            value={destination}
            onChange={setDestination}
            placeholder="New York"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Depart</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={nextWeek.toISOString().split("T")[0]}
              className="bg-transparent text-lg font-semibold text-slate-900 w-full focus:outline-none"
              required
            />
          </div>
        </div>

        {tripType === "return" && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Return</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || twoWeeks.toISOString().split("T")[0]}
                className="bg-transparent text-lg font-semibold text-slate-900 w-full focus:outline-none"
                required={tripType === "return"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Passengers & Class */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left hover:border-sky-300 transition-colors"
          >
            <label className="block text-xs font-medium text-slate-500 uppercase">Travellers</label>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-lg font-semibold text-slate-900">
                {totalPassengers} traveller{totalPassengers > 1 ? "s" : ""}
              </span>
            </div>
          </button>

          {showPassengerDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
              <PassengerRow
                label="Adults"
                sublabel="12+ years"
                value={adults}
                onChange={setAdults}
                min={1}
                max={9}
              />
              <PassengerRow
                label="Children"
                sublabel="2-11 years"
                value={children}
                onChange={setChildren}
                min={0}
                max={8}
              />
              <PassengerRow
                label="Infants"
                sublabel="Under 2 years"
                value={infants}
                onChange={setInfants}
                min={0}
                max={adults}
              />
              <button
                type="button"
                onClick={() => setShowPassengerDropdown(false)}
                className="w-full mt-4 bg-sky-500 text-white py-2 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-medium text-slate-500 uppercase">Class</label>
          <select
            value={travelClass}
            onChange={(e) => setTravelClass(e.target.value as SearchParams["travelClass"])}
            className="w-full bg-transparent text-lg font-semibold text-slate-900 focus:outline-none mt-1 cursor-pointer"
          >
            {TRAVEL_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <button
        type="submit"
        disabled={loading || !origin || !destination || !departureDate || (tripType === "return" && !returnDate)}
        className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/30"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Finding best deals...
          </>
        ) : (
          <>
            Search flights
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

function PassengerRow({
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          -
        </button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
