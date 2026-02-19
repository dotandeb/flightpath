"use client";

import { useState } from "react";
import { SearchForm } from "./components/SearchForm";
import { ResultsList } from "./components/ResultsList";
import { searchFlights, type SearchParams, type FlightResult } from "./lib/flight-api";
import { Plane, Sparkles } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<FlightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchFlights(params);
      setResults(data);
    } catch (err) {
      setError("Failed to search flights. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <Plane className="w-6 h-6 text-sky-600" />
          <span className="font-bold text-xl text-slate-900">FlightPath</span>
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full ml-2">Beta</span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Find flights airlines don&apos;t want you to find
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Our split-ticket search finds cheaper flights by combining separate one-way tickets. 
            Average savings: <span className="font-semibold text-green-600">£127</span>
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-3xl mx-auto">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="max-w-4xl mx-auto mt-10">
            <ResultsList result={results} />
          </div>
        )}

        {/* How it works */}
        {!results && !loading && (
          <div className="max-w-3xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">1. Search</h3>
              <p className="text-sm text-slate-600">Enter your route and dates like any flight search</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">2. We optimize</h3>
              <p className="text-sm text-slate-600">Our engine finds split-ticket combinations</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Save className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">3. You save</h3>
              <p className="text-sm text-slate-600">Book the cheaper option with our links</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          FlightPath.io — Not a travel agency. We find flights, you book directly with airlines.
        </div>
      </footer>
    </main>
  );
}

// Icons for how it works
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function Save({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
