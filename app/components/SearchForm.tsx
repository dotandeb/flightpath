"use client";

import { useState } from "react";
import { Calendar, Users, ArrowRight, Loader2, Plane } from "lucide-react";

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
}

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

// Simple airport input without autocomplete for now
function AirportInput({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={placeholder || "LHR"}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase"
          maxLength={3}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">3-letter airport code</p>
    </div>
  );
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate || !returnDate) {
      return;
    }
    onSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      passengers,
    });
  };

  // Set default dates
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <AirportInput
          label="From"
          value={origin}
          onChange={setOrigin}
          placeholder="LHR"
        />

        <AirportInput
          label="To"
          value={destination}
          onChange={setDestination}
          placeholder="JFK"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={nextWeek.toISOString().split("T")[0]}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Return</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || twoWeeks.toISOString().split("T")[0]}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-400" />
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} passenger{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !origin || !destination || !departureDate || !returnDate}
          className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              Search Flights
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
