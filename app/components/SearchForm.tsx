"use client";

import { useState } from "react";
import { Calendar, Users, ArrowRight, Loader2, Plane, Repeat, Briefcase, Baby } from "lucide-react";

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
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
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

      {/* Route */}
      <div className="grid md:grid-cols-2 gap-3 relative">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">From</label>
          <div className="flex items-center gap-2 mt-1">
            <Plane className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="LHR"
              className="bg-transparent text-xl font-bold text-slate-900 w-full focus:outline-none uppercase"
              maxLength={3}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">3-letter airport code</p>
        </div>

        <button
          type="button"
          onClick={swapLocations}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center hover:bg-slate-50"
        >
          <Repeat className="w-4 h-4 text-slate-600" />
        </button>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">To</label>
          <div className="flex items-center gap-2 mt-1">
            <Plane className="w-5 h-5 text-slate-400 rotate-90" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="JFK"
              className="bg-transparent text-xl font-bold text-slate-900 w-full focus:outline-none uppercase"
              maxLength={3}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">3-letter airport code</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">Depart</label>
          <div className="flex items-center gap-2 mt-1">
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
            <label className="text-xs font-medium text-slate-500 uppercase">Return</label>
            <div className="flex items-center gap-2 mt-1">
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
        {/* Passenger Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left hover:border-sky-300 transition-colors"
          >
            <label className="text-xs font-medium text-slate-500 uppercase">Travellers</label>
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
                icon={<Users className="w-5 h-5" />}
                label="Adults"
                sublabel="12+ years"
                value={adults}
                onChange={setAdults}
                min={1}
                max={9}
              />
              <PassengerRow
                icon={<Briefcase className="w-5 h-5" />}
                label="Children"
                sublabel="2-11 years"
                value={children}
                onChange={setChildren}
                min={0}
                max={8}
              />
              <PassengerRow
                icon={<Baby className="w-5 h-5" />}
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

        {/* Travel Class */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">Class</label>
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
            Searching {totalPassengers} passenger{totalPassengers > 1 ? "s" : ""}...
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
  icon,
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{sublabel}</p>
        </div>
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
