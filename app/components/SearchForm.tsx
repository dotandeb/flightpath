"use client";

import { useState } from "react";
import { Calendar, Users, ArrowRight, Loader2, Plane, Repeat } from "lucide-react";

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

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"return" | "oneWay">("return");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) {
      return;
    }
    onSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: tripType === "return" ? returnDate : departureDate,
      passengers,
    });
  };

  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // Set default dates
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Trip Type Toggle */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setTripType("return")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tripType === "return"
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Return
        </button>
        <button
          type="button"
          onClick={() => setTripType("oneWay")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tripType === "oneWay"
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          One way
        </button>
      </div>

      {/* Location Inputs */}
      <div className="grid md:grid-cols-2 gap-3 relative">
        {/* From */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">From</label>
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="London (LHR)"
              className="bg-transparent text-lg font-semibold text-slate-900 placeholder:text-slate-400 w-full focus:outline-none uppercase"
              maxLength={3}
            />
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={swapLocations}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <Repeat className="w-4 h-4 text-slate-600" />
        </button>

        {/* To */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">To</label>
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5 text-slate-400 rotate-90" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="New York (JFK)"
              className="bg-transparent text-lg font-semibold text-slate-900 placeholder:text-slate-400 w-full focus:outline-none uppercase"
              maxLength={3}
            />
          </div>
        </div>
      </div>

      {/* Date Inputs */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Depart</label>
          <div className="flex items-center gap-3">
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Return</label>
            <div className="flex items-center gap-3">
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

      {/* Passengers & Search */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-400" />
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} traveller{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !origin || !destination || !departureDate || (tripType === "return" && !returnDate)}
          className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/30"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              Search flights
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
