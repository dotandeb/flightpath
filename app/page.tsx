"use client";

import { useState } from "react";
import { SearchForm, SearchParams } from "./components/SearchForm";
import { Plane, Check } from "lucide-react";

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
        </div>
      </header>

      <div className="bg-gradient-to-br from-sky-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Find your next flight</h1>
            <p className="text-sky-100 text-lg">Smart search that finds savings other sites miss</p>
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
      </div>
    </div>
  );
}

function ResultsDisplay({ result }: { result: any }) {
  if (!result || result.error) {
    return <div className="p-4 bg-red-50 rounded-lg text-red-700">{result?.error || "Error"}</div>;
  }

  const standard = result.standard;
  const bestOption = result.bestOption || standard;
  const alternatives = result.alternatives || [];
  const totalPassengers = (result.searchParams?.adults || 1) + (result.searchParams?.children || 0) + (result.searchParams?.infants || 0);
  
  if (!standard) return <div className="p-4 bg-red-50 rounded-lg text-red-700">No flights found</div>;

  const hasSavings = bestOption?.totalPrice < standard?.totalPrice;
  const savingsAmount = (standard?.totalPrice || 0) - (bestOption?.totalPrice || 0);

  return (
    <div className="space-y-4">
      {hasSavings && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-lg">Save £{savingsAmount}!</p>
                <p className="text-green-100">{bestOption?.strategy}</p>
              </div>
            </div>
            <p className="text-3xl font-bold">£{bestOption?.totalPrice}</p>
          </div>
        </div>
      )}

      <FlightCard option={bestOption} isBest={true} totalPassengers={totalPassengers} />

      {alternatives.length > 0 && (
        <>
          <h3 className="font-semibold text-slate-900 mt-6 mb-3">Other options</h3>
          {alternatives.map((alt: any, i: number) => (
            <FlightCard key={i} option={alt} isBest={false} totalPassengers={totalPassengers} />
          ))}
        </>
      )}
    </div>
  );
}

function FlightCard({ option, isBest, totalPassengers }: { option: any; isBest: boolean; totalPassengers: number }) {
  if (!option) return null;
  
  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden mb-4 ${isBest ? 'border-2 border-green-500' : 'border border-slate-200'}`}>
      {isBest && (
        <div className="bg-green-50 px-4 py-2 border-b border-green-100">
          <span className="font-medium text-green-800">{option.strategy}</span>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>{!isBest && <p className="text-sm text-slate-500">{option.strategy}</p>}</div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">£{option.totalPrice}</p>
            <p className="text-sm text-slate-500">£{Math.round(option.totalPrice / totalPassengers)} per person</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Outbound</p>
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-xl font-bold">{formatTime(option.outbound?.departureTime)}</p>
              <p className="text-sm text-slate-600">{option.outbound?.origin}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-400">{option.outbound?.airline}</p>
              <p className="text-xs text-slate-400">{option.outbound?.stops === 0 ? 'Direct' : `${option.outbound?.stops} stop${option.outbound?.stops > 1 ? 's' : ''}`}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatTime(option.outbound?.arrivalTime)}</p>
              <p className="text-sm text-slate-600">{option.outbound?.destination}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase mb-2">Return</p>
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-xl font-bold">{formatTime(option.inbound?.departureTime)}</p>
              <p className="text-sm text-slate-600">{option.inbound?.origin}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-400">{option.inbound?.airline}</p>
              <p className="text-xs text-slate-400">{option.inbound?.stops === 0 ? 'Direct' : `${option.inbound?.stops} stop${option.inbound?.stops > 1 ? 's' : ''}`}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatTime(option.inbound?.arrivalTime)}</p>
              <p className="text-sm text-slate-600">{option.inbound?.destination}</p>
            </div>
          </div>
        </div>

        {option.risks?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-amber-800">⚠️ Important</p>
            <ul className="text-xs text-amber-700 mt-1">
              {option.risks.map((risk: string, i: number) => <li key={i}>• {risk}</li>)}
            </ul>
          </div>
        )}

        <a
          href={option.bookingLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full text-center font-semibold py-3 rounded-lg ${
            isBest ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {isBest ? 'Select this deal' : 'Select'}
        </a>
      </div>
    </div>
  );
}
