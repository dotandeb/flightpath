"use client";

import { useState } from "react";
import { SearchForm } from "./components/SearchForm";
import { SearchParams } from "./lib/flight-api";
import { Plane } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search flights");
      }

      setResults(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search flights. Please try again.");
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
            Our smart search finds cheaper flights using split-tickets and nearby airports.
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
            <ResultsDisplay result={results} />
          </div>
        )}

        {/* How it works */}
        {!results && !loading && (
          <div className="max-w-3xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <span className="text-sky-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Search</h3>
              <p className="text-sm text-slate-600">Enter your route and dates</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">We optimize</h3>
              <p className="text-sm text-slate-600">Multiple strategies to find savings</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">You save</h3>
              <p className="text-sm text-slate-600">Book the cheapest option</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          FlightPath.solutions — Smart flight search
        </div>
      </footer>
    </main>
  );
}

// Results display component
function ResultsDisplay({ result }: { result: any }) {
  if (!result || result.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {result?.error || "Unable to search flights. Please try again."}
      </div>
    );
  }

  const standard = result.standard;
  const bestOption = result.bestOption || standard;
  const alternatives = result.alternatives || [];
  
  if (!standard) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        No flight data available.
      </div>
    );
  }

  const hasSavings = bestOption?.totalPrice < standard?.totalPrice;
  const savingsAmount = standard?.totalPrice - bestOption?.totalPrice || 0;

  return (
    <div className="space-y-6">
      {hasSavings && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold">Save £{savingsAmount} with {bestOption?.strategy}!</h2>
        </div>
      )}

      <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-green-700">{bestOption?.strategy || "Standard"}</span>
          <span className="text-3xl font-bold text-green-600">£{bestOption?.totalPrice || 0}</span>
        </div>
        
        {bestOption?.outbound && (
          <div className="space-y-2 text-sm">
            <div>Outbound: {bestOption.outbound.airline} {bestOption.outbound.flightNumber} — £{bestOption.outbound.price}</div>
            <div>Return: {bestOption.inbound?.airline} {bestOption.inbound?.flightNumber} — £{bestOption.inbound?.price}</div>
          </div>
        )}

        <a
          href={bestOption?.bookingLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
        >
          Book Now
        </a>
      </div>

      {alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Other Options</h3>
          {alternatives.slice(0, 3).map((alt: any, i: number) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between">
                <span>{alt.strategy}</span>
                <span className="font-bold">£{alt.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-75">
        <div className="flex justify-between">
          <span className="text-slate-500">Standard Return</span>
          <span className="font-bold text-slate-600">£{standard?.totalPrice || 0}</span>
        </div>
      </div>
    </div>
  );
}
