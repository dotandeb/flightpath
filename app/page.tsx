"use client";

import { useState } from "react";
import { SearchForm, SearchParams } from "./components/SearchForm";
import { Plane, Check, ArrowRight, Clock, AlertTriangle, ExternalLink, Sparkles, Shield, Zap, Globe } from "lucide-react";

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
      setError(err.message || "Failed to search flights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">FlightPath</span>
            <span className="hidden sm:inline-flex ml-2 text-xs bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 px-2 py-1 rounded-full font-medium">
              Smart Search
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <button className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              Sign in
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Amadeus Real-Time Data</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find hidden flight deals
            </h1>
            <p className="text-lg md:text-xl text-sky-100 max-w-2xl mx-auto mb-8">
              Our AI searches multiple strategies: split tickets, nearby airports, and flexible dates to save you up to 40%
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-sky-100">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span>Real-time prices</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>500+ airlines</span>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-6 md:p-8">
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {results && (
          <div className="max-w-4xl mx-auto">
            <ResultsDisplay result={results} />
          </div>
        )}

        {!results && !loading && (
          <div id="features" className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Why use FlightPath?</h2>
              <p className="text-slate-600">Smart strategies to find cheaper flights</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                title="Split Ticketing"
                description="Book separate one-way tickets instead of returns. Often 20-40% cheaper."
                icon="🎫"
              />
              <FeatureCard
                title="Nearby Airports"
                description="Check alternative airports within 150km. Hidden gems for less."
                icon="🗺️"
              />
              <FeatureCard
                title="Flexible Dates"
                description="Flying a day earlier or later can save hundreds."
                icon="📅"
              />
            </div>
            
            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-slate-400">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">40%</p>
                <p className="text-sm">Max savings</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">500+</p>
                <p className="text-sm">Airlines</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">Real</p>
                <p className="text-sm">Time data</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
                <Plane className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-900">FlightPath</span>
            </div>
            
            <p className="text-sm text-slate-500">
              © 2026 FlightPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ResultsDisplay({ result }: { result: any }) {
  if (!result || result.error) {
    return <div className="p-4 bg-red-50 rounded-lg text-red-700">{result?.error || "Error"}</div>;
  }

  const bestOption = result.bestOption;
  const optimizedOptions = result.optimizedOptions || [];
  const standardOption = result.standardOption;
  
  const totalPassengers = (result.searchParams?.adults || 1) + (result.searchParams?.children || 0) + (result.searchParams?.infants || 0);
  
  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {result._dataSource === "sample-data" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Demo data - Add Amadeus API for real prices</p>
            <p className="text-xs text-amber-700 mt-1">
              Showing sample prices for demonstration
            </p>
          </div>
        </div>
      ) : result._realTimeData ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800 font-medium">✓ Real-time prices from Amadeus</p>
            <p className="text-xs text-green-700 mt-1">
              Live flight data from airlines • Prices may change
            </p>
          </div>
        </div>
      ) : null}

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Route</p>
            <p className="font-semibold text-slate-900 text-lg">
              {result.searchParams?.origin} → {result.searchParams?.destination}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passengers</p>
            <p className="font-semibold text-slate-900 text-lg">{totalPassengers} traveller{totalPassengers > 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Class</p>
            <p className="font-semibold text-slate-900 text-lg capitalize">{result.searchParams?.travelClass?.replace('_', ' ').toLowerCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price Range</p>
            <p className="font-semibold text-slate-900 text-lg">
              {result.priceRange?.currency} {result.priceRange?.min} - {result.priceRange?.max}
            </p>
          </div>
        </div>
      </div>

      {/* Best Deal Banner */}
      {bestOption?.savingsVsStandard > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-xl">Best deal: Save {result.priceRange?.currency} {bestOption.savingsVsStandard}</p>
                <p className="text-green-100">{bestOption.strategy} • {bestOption.strategyDescription}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{result.priceRange?.currency} {bestOption.totalPrice}</p>
              <p className="text-green-100 text-sm">{bestOption.perPersonPrice} per person</p>
            </div>
          </div>
        </div>
      )}

      {/* Best Option Card */}
      <FlightOptionCard option={bestOption} isBest={true} totalPassengers={totalPassengers} />

      {/* Other Options */}
      {optimizedOptions.length > 0 && (
        <>
          <h3 className="font-semibold text-slate-900 mt-8 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Other ways to save
          </h3>
          {optimizedOptions.map((opt: any, i: number) => (
            <FlightOptionCard key={i} option={opt} isBest={false} totalPassengers={totalPassengers} />
          ))}
        </>
      )}

      {/* Standard Option */}
      {standardOption && bestOption?.id !== standardOption?.id && (
        <>
          <h3 className="font-semibold text-slate-900 mt-8 mb-4">Standard option</h3>
          <FlightOptionCard option={standardOption} isBest={false} totalPassengers={totalPassengers} />
        </>
      )}
    </div>
  );
}

function FlightOptionCard({ option, isBest, totalPassengers }: { option: any; isBest: boolean; totalPassengers: number }) {
  if (!option) return null;

  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  const handleBookClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden mb-4 ${isBest ? 'ring-2 ring-green-500' : 'border border-slate-200'}`}>
      {isBest && (
        <div className="bg-green-50 px-5 py-3 border-b border-green-100 flex items-center justify-between">
          <span className="font-semibold text-green-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {option.strategy}
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Recommended</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            {!isBest && <p className="font-semibold text-slate-900 text-lg">{option.strategy}</p>}
            <p className="text-slate-500">{option.strategyDescription}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{option.currency} {option.totalPrice}</p>
            <p className="text-sm text-slate-500">{option.perPersonPrice} per person</p>
            {option.savingsVsStandard > 0 && (
              <p className="text-sm text-green-600 font-semibold flex items-center gap-1 justify-end">
                <ArrowRight className="w-4 h-4" />
                Save {option.currency} {option.savingsVsStandard}
              </p>
            )}
          </div>
        </div>

        {/* Segments */}
        {option.segments?.map((segment: any, idx: number) => (
          <div key={idx} className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{idx === 0 ? 'Outbound' : 'Return'}</span>
              <span className="text-sm text-slate-400 font-medium">{segment.airline} {segment.flightNumber}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{formatTime(segment.departureTime)}</p>
                <p className="text-sm font-medium text-slate-600">{segment.origin?.code}</p>
                <p className="text-xs text-slate-400">{formatDate(segment.departureTime)}</p>
              </div>
              <div className="flex-1 px-6 flex flex-col items-center">
                <div className="w-full h-0.5 bg-slate-300 relative">
                  <Plane className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50" />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{segment.stops === 0 ? 'Direct' : `${segment.stops} stop${segment.stops > 1 ? 's' : ''}`}</p>
                {segment.duration && <p className="text-xs text-slate-400">{segment.duration}</p>}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{formatTime(segment.arrivalTime)}</p>
                <p className="text-sm font-medium text-slate-600">{segment.destination?.code}</p>
                <p className="text-xs text-slate-400">{formatDate(segment.arrivalTime)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Risks */}
        {option.risks?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Important to know</p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  {option.risks.map((risk: string, i: number) => <li key={i}>• {risk}</li>)}
                </ul>
              </div>
            </div>          </div>
        )}

        {/* Booking Links */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Book with</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {option.bookingLinks?.slice(0, 3).map((link: any, i: number) => (
              <button
                key={i}
                onClick={() => handleBookClick(link.url)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  i === 0 && isBest
                    ? 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:shadow-md'
                }`}
              >
                <span className="font-semibold truncate">{link.airline}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{option.currency} {link.price}</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>        </div>
      </div>
    </div>
  );
}
