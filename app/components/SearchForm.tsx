"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, Users, ArrowRight, Loader2, Plane, Repeat, MapPin, Search, X } from "lucide-react";

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

// Popular airports database
const POPULAR_AIRPORTS = [
  // UK
  { code: "LHR", city: "London", country: "UK", name: "Heathrow" },
  { code: "LGW", city: "London", country: "UK", name: "Gatwick" },
  { code: "STN", city: "London", country: "UK", name: "Stansted" },
  { code: "MAN", city: "Manchester", country: "UK", name: "Manchester" },
  { code: "EDI", city: "Edinburgh", country: "UK", name: "Edinburgh" },
  { code: "BHX", city: "Birmingham", country: "UK", name: "Birmingham" },
  { code: "GLA", city: "Glasgow", country: "UK", name: "Glasgow" },
  { code: "BRS", city: "Bristol", country: "UK", name: "Bristol" },
  { code: "DUB", city: "Dublin", country: "Ireland", name: "Dublin" },
  
  // Europe
  { code: "CDG", city: "Paris", country: "France", name: "Charles de Gaulle" },
  { code: "ORY", city: "Paris", country: "France", name: "Orly" },
  { code: "AMS", city: "Amsterdam", country: "Netherlands", name: "Schiphol" },
  { code: "FRA", city: "Frankfurt", country: "Germany", name: "Frankfurt" },
  { code: "MUC", city: "Munich", country: "Germany", name: "Munich" },
  { code: "FCO", city: "Rome", country: "Italy", name: "Fiumicino" },
  { code: "MXP", city: "Milan", country: "Italy", name: "Malpensa" },
  { code: "MAD", city: "Madrid", country: "Spain", name: "Barajas" },
  { code: "BCN", city: "Barcelona", country: "Spain", name: "Barcelona" },
  { code: "ZUR", city: "Zurich", country: "Switzerland", name: "Zurich" },
  { code: "VIE", city: "Vienna", country: "Austria", name: "Vienna" },
  { code: "CPH", city: "Copenhagen", country: "Denmark", name: "Copenhagen" },
  { code: "ARN", city: "Stockholm", country: "Sweden", name: "Arlanda" },
  { code: "OSL", city: "Oslo", country: "Norway", name: "Oslo" },
  { code: "HEL", city: "Helsinki", country: "Finland", name: "Helsinki" },
  { code: "ATH", city: "Athens", country: "Greece", name: "Athens" },
  { code: "LIS", city: "Lisbon", country: "Portugal", name: "Lisbon" },
  { code: "PRG", city: "Prague", country: "Czech Republic", name: "Prague" },
  { code: "BUD", city: "Budapest", country: "Hungary", name: "Budapest" },
  { code: "WAW", city: "Warsaw", country: "Poland", name: "Warsaw" },
  
  // US
  { code: "JFK", city: "New York", country: "USA", name: "JFK" },
  { code: "EWR", city: "New York", country: "USA", name: "Newark" },
  { code: "LAX", city: "Los Angeles", country: "USA", name: "LAX" },
  { code: "SFO", city: "San Francisco", country: "USA", name: "SFO" },
  { code: "ORD", city: "Chicago", country: "USA", name: "O'Hare" },
  { code: "MIA", city: "Miami", country: "USA", name: "Miami" },
  { code: "BOS", city: "Boston", country: "USA", name: "Boston" },
  { code: "LAS", city: "Las Vegas", country: "USA", name: "Las Vegas" },
  
  // Asia
  { code: "DXB", city: "Dubai", country: "UAE", name: "Dubai" },
  { code: "SIN", city: "Singapore", country: "Singapore", name: "Changi" },
  { code: "HKG", city: "Hong Kong", country: "China", name: "Hong Kong" },
  { code: "BKK", city: "Bangkok", country: "Thailand", name: "Suvarnabhumi" },
  { code: "NRT", city: "Tokyo", country: "Japan", name: "Narita" },
  { code: "HND", city: "Tokyo", country: "Japan", name: "Haneda" },
  { code: "ICN", city: "Seoul", country: "South Korea", name: "Incheon" },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaysia", name: "Kuala Lumpur" },
  { code: "DEL", city: "Delhi", country: "India", name: "Delhi" },
  { code: "BOM", city: "Mumbai", country: "India", name: "Mumbai" },
  
  // Australia
  { code: "SYD", city: "Sydney", country: "Australia", name: "Kingsford Smith" },
  { code: "MEL", city: "Melbourne", country: "Australia", name: "Tullamarine" },
  { code: "AKL", city: "Auckland", country: "New Zealand", name: "Auckland" },
];

function useAirportAutocomplete(value: string, excludeCode?: string) {
  const [suggestions, setSuggestions] = useState<typeof POPULAR_AIRPORTS>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value.length < 1) {
      setSuggestions([]);
      return;
    }

    const query = value.toLowerCase();
    const filtered = POPULAR_AIRPORTS.filter(
      (airport) =>
        (airport.code.toLowerCase().includes(query) ||
          airport.city.toLowerCase().includes(query) ||
          airport.name.toLowerCase().includes(query) ||
          airport.country.toLowerCase().includes(query)) &&
        airport.code !== excludeCode
    ).slice(0, 6);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [value, excludeCode]);

  return { suggestions, isOpen, setIsOpen };
}

function AirportInput({
  label,
  value,
  onChange,
  placeholder,
  excludeCode,
}: {
  label: string;
  value: string;
  onChange: (value: string, code?: string) => void;
  placeholder?: string;
  excludeCode?: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const { suggestions, isOpen, setIsOpen } = useAirportAutocomplete(inputValue, excludeCode);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleSelect = (airport: typeof POPULAR_AIRPORTS[0]) => {
    const displayValue = `${airport.city} (${airport.code})`;
    setInputValue(displayValue);
    onChange(displayValue, airport.code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => inputValue.length >= 1 && setIsOpen(true)}
          placeholder={placeholder || "London (LHR)"}
          className="w-full pl-10 pr-4 py-3 bg-transparent text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-auto">
          {suggestions.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
            >
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-sky-700">{airport.code}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{airport.city}</p>
                <p className="text-sm text-slate-500 truncate">
                  {airport.name} • {airport.country}
                </p>
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
  const [originCode, setOriginCode] = useState("");
  const [destination, setDestination] = useState("");
  const [destCode, setDestCode] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState<SearchParams["travelClass"]>("ECONOMY");
  const [tripType, setTripType] = useState<"return" | "oneWay">("return");
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const passengerDropdownRef = useRef<HTMLDivElement>(null);

  const totalPassengers = adults + children + infants;

  // Close passenger dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (passengerDropdownRef.current && !passengerDropdownRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const originToUse = originCode || origin;
    const destToUse = destCode || destination;
    
    if (!originToUse || !destToUse || !departureDate) return;

    onSearch({
      origin: originToUse,
      destination: destToUse,
      departureDate,
      returnDate: tripType === "return" ? returnDate : departureDate,
      adults,
      children,
      infants,
      travelClass,
    });
  };

  const swapLocations = () => {
    const temp = origin;
    const tempCode = originCode;
    setOrigin(destination);
    setOriginCode(destCode);
    setDestination(temp);
    setDestCode(tempCode);
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
                ? "bg-sky-500 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {type === "return" ? "Return" : "One way"}
          </button>
        ))}
      </div>

      {/* Locations */}
      <div className="grid md:grid-cols-2 gap-3 relative">
        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <AirportInput
            label="From"
            value={origin}
            onChange={(val, code) => {
              setOrigin(val);
              if (code) setOriginCode(code);
            }}
            placeholder="London (LHR)"
            excludeCode={destCode}
          />
        </div>

        <button
          type="button"
          onClick={swapLocations}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-sky-500 text-white border-2 border-white rounded-full shadow-lg flex items-center justify-center hover:bg-sky-600 transition-colors"
        >
          <Repeat className="w-4 h-4" />
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <AirportInput
            label="To"
            value={destination}
            onChange={(val, code) => {
              setDestination(val);
              if (code) setDestCode(code);
            }}
            placeholder="Paris (CDG)"
            excludeCode={originCode}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Depart</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={nextWeek.toISOString().split("T")[0]}
              className="bg-transparent text-lg font-semibold text-slate-900 w-full focus:outline-none cursor-pointer"
              required
            />
          </div>
        </div>

        {tripType === "return" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Return</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || twoWeeks.toISOString().split("T")[0]}
                className="bg-transparent text-lg font-semibold text-slate-900 w-full focus:outline-none cursor-pointer"
                required={tripType === "return"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Passengers & Class */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="relative" ref={passengerDropdownRef}>
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-sky-300 transition-colors"
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
                className="w-full mt-4 bg-sky-500 text-white py-2 rounded-lg font-medium hover:bg-sky-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
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
        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/30 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Finding best deals...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search flights
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
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
