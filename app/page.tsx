"use client";

import { useState } from "react";
import { SearchForm, SearchParams } from "./components/SearchForm";
import { Plane, Check, ArrowRight, Clock, AlertTriangle, ExternalLink } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">FlightPath</span>
          <span className="ml-2 text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">Smart Search</span>
        </div>
      </header>

      <div className="bg-gradient-to-br from-sky-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Find hidden flight deals</h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto">
              Our AI searches multiple strategies: split tickets, nearby airports, and flexible dates to save you up to 40%
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {results && (
          <div className="max-w-4xl mx-auto">
            <ResultsDisplay result={results} />
          </div>
        )}

        {!results && !loading && (
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
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
        )}
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
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
      {/* Cache Warning */}
      {result._cacheWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-amber-800 font-medium">{result._cacheWarning}</p>
            {result._dataSource === "sample-data" && (
              <p className="text-xs text-amber-700 mt-1">
                Demo mode: Add TRAVELPAYOUTS_TOKEN to .env.local for real data
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Route</p>
            <p className="font-semibold text-slate-900">
              {result.searchParams?.origin} → {result.searchParams?.destination}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Passengers</p>
            <p className="font-semibold text-slate-900">{totalPassengers} travellers</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Class</p>
            <p className="font-semibold text-slate-900">{result.searchParams?.travelClass?.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Price Range</p>
            <p className="font-semibold text-slate-900">£{result.priceRange?.min} - £{result.priceRange?.max}</p>
          </div>
        </div>
      </div>

      {/* Best Deal */}
      {bestOption?.savingsVsStandard > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-lg">Best deal: Save £{bestOption.savingsVsStandard}</p>
                <p className="text-green-100">{bestOption.strategy} • {bestOption.strategyDescription}</p>
              </div>
            </div>            <div className="text-right">
              <p className="text-3xl font-bold">£{bestOption.totalPrice}</p>
              <p className="text-green-100 text-sm">£{bestOption.perPersonPrice} per person</p>
            </div>
          </div>        </div>
      )}

      {/* Best Option Card */}
      <FlightOptionCard option={bestOption} isBest={true} totalPassengers={totalPassengers} rawData={result._raw} />

      {/* Other Options */}
      {optimizedOptions.length > 0 && (
        <>
          <h3 className="font-semibold text-slate-900 mt-8 mb-4">Other ways to save</h3>
          {optimizedOptions.map((opt: any, i: number) => (
            <FlightOptionCard key={i} option={opt} isBest={false} totalPassengers={totalPassengers} rawData={result._raw} />
          ))}
        </>
      )}

      {/* Standard Option */}
      {standardOption && bestOption?.id !== standardOption?.id && (
        <>
          <h3 className="font-semibold text-slate-900 mt-8 mb-4">Standard option</h3>
          <FlightOptionCard option={standardOption} isBest={false} totalPassengers={totalPassengers} rawData={result._raw} />
        </>
      )}
    </div>
  );
}

function FlightOptionCard({ option, isBest, totalPassengers, rawData }: { option: any; isBest: boolean; totalPassengers: number; rawData?: any }) {
  if (!option) return null;

  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  const handleBookClick = async (link: any) => {
    // If it's a real API result with proposalId, generate booking link
    if (link.proposalId && rawData?.results_url && rawData?.search_id) {
      try {
        const response = await fetch('/api/booking-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resultsUrl: rawData.results_url,
            searchId: rawData.search_id,
            proposalId: link.proposalId,
          }),
        });
        
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      } catch (err) {
        console.error('Failed to get booking link:', err);
        // Fallback to direct URL
        if (link.url) window.open(link.url, '_blank');
      }
    } else if (link.url && link.url !== '#') {
      // Direct URL for sample data
      window.open(link.url, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden mb-4 ${isBest ? 'border-2 border-green-500' : 'border border-slate-200'}`}>
      {isBest && (
        <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center justify-between">
          <span className="font-medium text-green-800">{option.strategy}</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            {!isBest && <p className="font-medium text-slate-900">{option.strategy}</p>}
            <p className="text-sm text-slate-500">{option.strategyDescription}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">£{option.totalPrice}</p>
            <p className="text-sm text-slate-500">£{option.perPersonPrice} per person</p>
            {option.savingsVsStandard > 0 && (
              <p className="text-sm text-green-600 font-medium">Save £{option.savingsVsStandard}</p>
            )}
          </div>
        </div>

        {/* Segments */}
        {option.segments?.map((segment: any, idx: number) => (
          <div key={idx} className="bg-slate-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase">{idx === 0 ? 'Outbound' : 'Return'}</span>
              <span className="text-xs text-slate-400">{segment.airline} {segment.flightNumber}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{formatTime(segment.departureTime)}</p>
                <p className="text-sm text-slate-600">{segment.origin?.code}</p>
                <p className="text-xs text-slate-400">{formatDate(segment.departureTime)}</p>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center">
                <div className="w-full h-px bg-slate-300 my-1 relative">
                  <Plane className="w-4 h-4 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-slate-400">{segment.stops === 0 ? 'Direct' : `${segment.stops} stop${segment.stops > 1 ? 's' : ''}`}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{formatTime(segment.arrivalTime)}</p>
                <p className="text-sm text-slate-600">{segment.destination?.code}</p>
                <p className="text-xs text-slate-400">{formatDate(segment.arrivalTime)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Risks */}
        {option.risks?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">Important to know</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  {option.risks.map((risk: string, i: number) => <li key={i}>• {risk}</li>)}
                </ul>
              </div>
            </div>          </div>
        )}

        {/* Booking Links */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Book with</p>
          <div className="grid grid-cols-2 gap-2">
            {option.bookingLinks?.slice(0, 4).map((link: any, i: number) => (
              <button
                key={i}
                onClick={() => handleBookClick(link)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                  i === 0 && isBest
                    ? 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">{link.airline}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">£{link.price}</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>        </div>
      </div>
    </div>
  );
}
