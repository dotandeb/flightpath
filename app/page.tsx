"use client";

import { useState } from "react";
import { SearchForm } from "./components/SearchForm";
import { SearchParams } from "./lib/flight-api";
import { Plane, ArrowRight, Calendar, Users, Luggage, Shield, Clock, MapPin, Check } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">FlightPath</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#" className="text-slate-600 hover:text-slate-900">Flights</a>
            <a href="#" className="text-slate-600 hover:text-slate-900">Hotels</a>
            <a href="#" className="text-slate-600 hover:text-slate-900">Car Hire</a>
          </nav>
        </div>
      </header>

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Find your next flight
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto">
              Compare prices across airlines and discover hidden savings with our smart search
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
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

        {/* Features Grid */}
        {!results && !loading && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <FeatureCard 
                icon={<Luggage className="w-6 h-6 text-sky-600" />}
                title="Split Ticketing"
                description="Book separate one-way tickets and save up to 40%"
              />
              <FeatureCard 
                icon={<MapPin className="w-6 h-6 text-sky-600" />}
                title="Nearby Airports"
                description="Check alternative airports for cheaper fares"
              />
              <FeatureCard 
                icon={<Clock className="w-6 h-6 text-sky-600" />}
                title="Flexible Dates"
                description="Find the cheapest days to fly"
              />
            </div>

            {/* Trust Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Why use FlightPath?</h2>
                <p className="text-slate-600">Smart tools to find you the best deals</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TrustItem 
                  icon={<Check className="w-5 h-5" />}
                  text="No hidden fees"
                />
                <TrustItem 
                  icon={<Shield className="w-5 h-5" />}
                  text="Price comparison"
                />
                <TrustItem 
                  icon={<Calendar className="w-5 h-5" />}
                  text="Flexible search"
                />
                <TrustItem 
                  icon={<Users className="w-5 h-5" />}
                  text="Trusted by travelers"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">FlightPath</h4>
              <p className="text-sm">Smart flight search that finds savings other sites miss.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Discover</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Flights</a></li>
                <li><a href="#" className="hover:text-white">Hotels</a></li>
                <li><a href="#" className="hover:text-white">Car Hire</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Help</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Centre</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            © 2025 FlightPath. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
        {icon}
      </div>
      <span className="text-slate-700 font-medium">{text}</span>
    </div>
  );
}

// Results display component - Skyscanner style
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
  const savingsAmount = (standard?.totalPrice || 0) - (bestOption?.totalPrice || 0);

  return (
    <div className="space-y-4">
      {/* Best Deal Banner */}
      {hasSavings && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Best deal found!</p>
              <p className="text-green-100">Save £{savingsAmount} with {bestOption?.strategy}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">£{bestOption?.totalPrice}</p>
            <p className="text-green-100 text-sm">vs £{standard?.totalPrice}</p>
          </div>
        </div>
      )}

      {/* Best Option Card */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 overflow-hidden">
        <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center justify-between">
          <span className="font-medium text-green-800">{bestOption?.strategy}</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{bestOption?.outbound?.origin}</p>
                <p className="text-sm text-slate-500">{bestOption?.outbound?.airline}</p>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="w-5 h-5 text-slate-400" />
                <p className="text-xs text-slate-400">Direct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{bestOption?.outbound?.destination}</p>
                <p className="text-sm text-slate-500">{bestOption?.inbound?.airline}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">£{bestOption?.totalPrice}</p>
              <p className="text-sm text-slate-500">per person</p>
            </div>
          </div>

          <a
            href={bestOption?.bookingLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-sky-500 hover:bg-sky-600 text-white text-center font-semibold py-3 rounded-lg transition-colors"
          >
            Select
          </a>
        </div>
      </div>

      {/* Alternative Options */}
      {alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 px-1">Other options</h3>
          {alternatives.slice(0, 3).map((alt: any, i: number) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{alt.strategy}</p>
                    <p className="text-sm text-slate-500">{alt.outbound?.airline} / {alt.inbound?.airline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">£{alt.totalPrice}</p>
                    {alt.savingsVsStandard > 0 && (
                      <p className="text-sm text-green-600">Save £{alt.savingsVsStandard}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Standard comparison */}
      <div className="bg-slate-100 rounded-xl p-4 opacity-75">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Standard return flight</span>
          <span className="font-bold text-slate-700">£{standard?.totalPrice}</span>
        </div>
      </div>
    </div>
  );
}
