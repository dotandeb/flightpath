'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchForm, SearchParams } from './components/SearchForm';
import { Plane, Check, ArrowRight, AlertTriangle, Sparkles, Shield, Zap, Globe, Lock, X, ChevronDown, Mail, Search, Bell, Wallet, Info, Route, Ticket, MapPin } from 'lucide-react';
import { getCurrentUser, canUserSearch, incrementSearchCount } from './lib/auth';

export default function Home() {
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchesRemaining, setSearchesRemaining] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [teaserUsed, setTeaserUsed] = useState(false);

  // Check for user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('flightpath_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      checkSearchLimit(parsed.id);
    }
    // Check teaser in browser only
    if (typeof window !== 'undefined') {
      setTeaserUsed(!!sessionStorage.getItem('flightpath_teaser'));
    }
  }, []);

  const checkSearchLimit = async (userId: string) => {
    const { remaining } = await canUserSearch(userId);
    setSearchesRemaining(remaining);
  };

  const handleSearch = async (params: SearchParams) => {
    // Check if user can search
    if (user) {
      const { canSearch, remaining } = await canUserSearch(user.id);
      if (!canSearch) {
        setShowAuthModal(true);
        return;
      }
      setSearchesRemaining(remaining - 1);
      await incrementSearchCount(user.id);
    } else {
      // Allow 1 search without signup (teaser) - only in browser
      if (typeof window !== 'undefined') {
        const teaserUsed = sessionStorage.getItem('flightpath_teaser');
        if (teaserUsed) {
          setShowAuthModal(true);
          return;
        }
        sessionStorage.setItem('flightpath_teaser', 'used');
      }
    }

    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search flights');
      }

      setResults(data);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      // User is logged in, show booking options
      // This would normally show the actual booking links
      alert('Booking links would show here for logged in users!');
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.removeItem('flightpath_user');
    setUser(null);
    setSearchesRemaining(null);
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
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-slate-500">{user.is_admin ? 'Unlimited' : `${searchesRemaining} searches left`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 hidden sm:inline">{user.email}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <a href="/signin" className="text-sm text-slate-600 hover:text-slate-900">Sign in</a>
                <a 
                  href="/signup" 
                  className="text-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-colors font-medium"
                >
                  Get 1 Free Search
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-sky-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock More Searches</h2>
              <p className="text-slate-600 mb-6">
                {user 
                  ? "You've used your free searches. Upgrade for unlimited access."
                  : "Sign up to get 1 free flight search and unlock booking links."
                }
              </p>
              
              <div className="space-y-3">
                {!user && (
                  <a
                    href="/signup"
                    className="block w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-4 rounded-xl text-center hover:from-sky-600 hover:to-blue-700 transition-colors"
                  >
                    Sign Up Free - 1 Search
                  </a>
                )}
                <button className="w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                  Unlock Unlimited - £4.99
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Search */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Amadeus Real-Time Data</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find hidden flight deals
            </h1>
            <p className="text-lg text-sky-100 max-w-2xl mx-auto">
              Our AI searches multiple strategies to save you up to 40%
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-6">
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
          </div>

          {/* Search Status */}
          {!user && !teaserUsed && (
            <div className="text-center">
              <p className="text-sky-100 text-sm">
                🎁 Try 1 search free, no signup required
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS - Right under search box */}
      <div id="search-results" className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {results && (
          <div className="max-w-4xl mx-auto">
            <ResultsDisplay 
              result={results} 
              onBookClick={handleBookClick}
              user={user}
            />
          </div>
        )}
      </div>

      {/* Rest of page (only show if no results) */}
      {!results && (
        <>
          {/* How It Works */}
          <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-16">
                <span className="text-sm font-semibold text-sky-600 uppercase tracking-wide">How It Works</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">We find savings you can't see</h2>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8">
                <StepCard number="1" icon={<Search className="w-6 h-6" />} title="Search" description="Enter your route and dates" />
                <StepCard number="2" icon={<Zap className="w-6 h-6" />} title="Analyze" description="We check 5+ booking strategies" />
                <StepCard number="3" icon={<Ticket className="w-6 h-6" />} title="Compare" description="See side-by-side savings" />
                <StepCard number="4" icon={<Wallet className="w-6 h-6" />} title="Book" description="Book directly with airlines" />
              </div>
            </div>
          </section>

          {/* Strategies Explained */}
          <section className="py-20 bg-slate-50">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-16">
                <span className="text-sm font-semibold text-sky-600 uppercase tracking-wide">Our Strategies</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">How we find cheaper flights</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <StrategyCard 
                  icon="🎫"
                  title="Split Ticketing"
                  description="Booking two one-way tickets with different airlines is often cheaper than a return ticket. We check all combinations."
                  savings="Up to 40%"
                />
                <StrategyCard 
                  icon="🗺️"
                  title="Nearby Airports"
                  description="Flying from Gatwick instead of Heathrow, or into Oakland instead of SFO can save hundreds. We check airports within 150km."
                  savings="Up to 25%"
                />
                <StrategyCard 
                  icon="📅"
                  title="Flexible Dates"
                  description="Flying Tuesday instead of Friday, or adding a Saturday night stay can dramatically reduce prices."
                  savings="Up to 30%"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
                <Plane className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-900">FlightPath</span>
            </div>
            
            <p className="text-sm text-slate-500">© 2026 FlightPath. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components
function StepCard({ number, icon, title, description }: { number: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-600">
        {icon}
      </div>
      <div className="w-8 h-8 bg-sky-500 text-white rounded-full flex items-center justify-center mx-auto -mt-12 mb-4 text-sm font-bold border-4 border-white">
        {number}
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}

function StrategyCard({ icon, title, description, savings }: { icon: string; title: string; description: string; savings: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-3">
        Save {savings}
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ResultsDisplay({ result, onBookClick, user }: { result: any; onBookClick: () => void; user: any }) {
  if (!result || result.error) {
    return <div className="p-4 bg-red-50 rounded-lg text-red-700">{result?.error || "Error"}</div>;
  }

  const bestOption = result.bestOption;
  const allOptions = [bestOption, ...(result.optimizedOptions || []), result.standardOption].filter(Boolean);
  
  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDuration = (minutes: number) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Results Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Route</p>
            <p className="font-bold text-slate-900 text-lg">{result.searchParams?.origin} → {result.searchParams?.destination}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500 uppercase">Best Price</p>
            <p className="font-bold text-green-600 text-2xl">{result.priceRange?.currency} {result.priceRange?.min}</p>
          </div>
        </div>
      </div>

      {/* Strategy Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">How we found these savings</p>
            <p className="text-blue-700 text-sm mt-1">
              We analyzed {allOptions.length} different booking strategies including split tickets, 
              nearby airports, and flexible dates. The best option saves you {result.priceRange?.currency} {bestOption.savingsVsStandard || 0} 
              compared to standard booking.
            </p>
          </div>
        </div>
      </div>

      {/* Flight Options */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Route className="w-5 h-5 text-sky-500" />
          All Options ({allOptions.length} found)
        </h3>
        
        {allOptions.map((option: any, idx: number) => (
          <div key={idx} className={`bg-white rounded-xl shadow-md overflow-hidden ${idx === 0 ? 'ring-2 ring-green-500' : 'border border-slate-200'}`}>
            {idx === 0 && (
              <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center justify-between">
                <span className="font-semibold text-green-800 text-sm">⭐ Best Deal - Save {option.currency} {option.savingsVsStandard || 0}</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">{option.strategy}</span>
              </div>
            )}
            
            <div className="p-4">
              {/* Price Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold text-slate-900">{option.strategyDescription}</p>
                  <p className="text-sm text-slate-500">{option.segments?.length} segment{option.segments?.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{option.currency} {option.totalPrice}</p>
                  <p className="text-sm text-slate-500">per person</p>
                </div>
              </div>

              {/* Flight Details */}
              <div className="space-y-3 mb-4">
                {option.segments?.map((segment: any, segIdx: number) => (
                  <div key={segIdx} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded">
                        {segIdx === 0 ? 'OUTBOUND' : 'RETURN'}
                      </span>
                      <span className="text-sm text-slate-600">{segment.airlineName} {segment.flightNumber}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatTime(segment.departureTime)}</p>
                        <p className="text-sm text-slate-600">{segment.origin?.code}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full flex items-center gap-1">
                          <div className="flex-1 h-0.5 bg-slate-300"></div>
                          <Plane className="w-4 h-4 text-slate-400" />
                          <div className="flex-1 h-0.5 bg-slate-300"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{formatDuration(segment.durationMinutes)}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xl font-bold">{formatTime(segment.arrivalTime)}</p>
                        <p className="text-sm text-slate-600">{segment.destination?.code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Book Button */}
              <button
                onClick={onBookClick}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-sky-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {user ? (
                  <>View Booking Options <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <><Lock className="w-4 h-4" /> Sign Up to Book</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
