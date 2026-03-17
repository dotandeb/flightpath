'use client';

import { useState, useRef, useEffect } from 'react';
import { Plane, Search, Calendar, MapPin, TrendingDown, Zap, Globe, Sparkles, Info, Users, Minus, Plus, ExternalLink } from 'lucide-react';
import { format, addMonths } from 'date-fns';

interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: { airport: string; time: string; };
  arrival: { airport: string; time: string; };
  duration: string;
  price: number;
  currency: string;
  stops: number;
  cabinClass: string;
}

interface Deal {
  id: string;
  route: string;
  from: string;
  to: string;
  price: number;
  originalPrice?: number;
  currency: string;
  airline?: string;
  source: string;
  bookingLink: string;
  tags?: string[];
  discount?: number;
}

interface SplitTicket {
  id: string;
  tickets: Array<{
    from: string;
    to: string;
    price: number;
    airline: string;
    flightNumber: string;
    direction: 'outbound' | 'return';
    bookingLink: string;
    step: number;
  }>;
  totalPrice: number;
  savings: number;
  currency: string;
}

// Airport database for auto-suggest
const AIRPORTS = [
  { code: 'LON', name: 'London (All Airports)', country: 'UK', airports: ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'] },
  { code: 'LHR', name: 'London Heathrow', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', country: 'UK' },
  { code: 'NYC', name: 'New York (All Airports)', country: 'USA', airports: ['JFK', 'LGA', 'EWR'] },
  { code: 'JFK', name: 'New York JFK', country: 'USA' },
  { code: 'LGA', name: 'New York LaGuardia', country: 'USA' },
  { code: 'DXB', name: 'Dubai', country: 'UAE' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', country: 'France' },
  { code: 'PAR', name: 'Paris (All Airports)', country: 'France', airports: ['CDG', 'ORY'] },
  { code: 'AMS', name: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', country: 'Germany' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong' },
  { code: 'SYD', name: 'Sydney', country: 'Australia' },
  { code: 'LAX', name: 'Los Angeles', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', country: 'USA' },
  { code: 'IST', name: 'Istanbul', country: 'Turkey' },
  { code: 'DOH', name: 'Doha', country: 'Qatar' },
  { code: 'AUH', name: 'Abu Dhabi', country: 'UAE' },
  { code: 'MAD', name: 'Madrid', country: 'Spain' },
  { code: 'BCN', name: 'Barcelona', country: 'Spain' },
  { code: 'FCO', name: 'Rome Fiumicino', country: 'Italy' },
  { code: 'MXP', name: 'Milan Malpensa', country: 'Italy' },
  { code: 'DUB', name: 'Dublin', country: 'Ireland' },
  { code: 'EDI', name: 'Edinburgh', country: 'UK' },
  { code: 'MAN', name: 'Manchester', country: 'UK' },
  { code: 'BHX', name: 'Birmingham', country: 'UK' },
  { code: 'GLA', name: 'Glasgow', country: 'UK' },
  { code: 'BER', name: 'Berlin', country: 'Germany' },
  { code: 'MUC', name: 'Munich', country: 'Germany' },
  { code: 'VIE', name: 'Vienna', country: 'Austria' },
  { code: 'ZRH', name: 'Zurich', country: 'Switzerland' },
  { code: 'CPH', name: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', name: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', name: 'Oslo', country: 'Norway' },
  { code: 'HEL', name: 'Helsinki', country: 'Finland' },
  { code: 'WAW', name: 'Warsaw', country: 'Poland' },
  { code: 'PRG', name: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', name: 'Budapest', country: 'Hungary' },
  { code: 'ATH', name: 'Athens', country: 'Greece' },
  { code: 'LIS', name: 'Lisbon', country: 'Portugal' },
  { code: 'OPO', name: 'Porto', country: 'Portugal' },
  { code: 'BRU', name: 'Brussels', country: 'Belgium' },
  { code: 'TXL', name: 'Berlin Tegel', country: 'Germany' },
  { code: 'HND', name: 'Tokyo Haneda', country: 'Japan' },
  { code: 'NRT', name: 'Tokyo Narita', country: 'Japan' },
  { code: 'ICN', name: 'Seoul', country: 'South Korea' },
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'BNE', name: 'Brisbane', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne', country: 'Australia' },
  { code: 'PER', name: 'Perth', country: 'Australia' },
  { code: 'AKL', name: 'Auckland', country: 'New Zealand' },
  { code: 'CHC', name: 'Christchurch', country: 'New Zealand' },
  { code: 'JNB', name: 'Johannesburg', country: 'South Africa' },
  { code: 'CPT', name: 'Cape Town', country: 'South Africa' },
  { code: 'CAI', name: 'Cairo', country: 'Egypt' },
  { code: 'TLV', name: 'Tel Aviv', country: 'Israel' },
  { code: 'MIA', name: 'Miami', country: 'USA' },
  { code: 'BOS', name: 'Boston', country: 'USA' },
  { code: 'ORD', name: 'Chicago', country: 'USA' },
  { code: 'DFW', name: 'Dallas', country: 'USA' },
  { code: 'SEA', name: 'Seattle', country: 'USA' },
  { code: 'LAS', name: 'Las Vegas', country: 'USA' },
  { code: 'DEN', name: 'Denver', country: 'USA' },
  { code: 'ATL', name: 'Atlanta', country: 'USA' },
  { code: 'PHL', name: 'Philadelphia', country: 'USA' },
  { code: 'PHX', name: 'Phoenix', country: 'USA' },
  { code: 'IAH', name: 'Houston', country: 'USA' },
  { code: 'YVR', name: 'Vancouver', country: 'Canada' },
  { code: 'YYZ', name: 'Toronto', country: 'Canada' },
  { code: 'YUL', name: 'Montreal', country: 'Canada' },
  { code: 'YVR', name: 'Vancouver', country: 'Canada' },
  { code: 'GRU', name: 'São Paulo', country: 'Brazil' },
  { code: 'GIG', name: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'EZE', name: 'Buenos Aires', country: 'Argentina' },
  { code: 'SCL', name: 'Santiago', country: 'Chile' },
  { code: 'LIM', name: 'Lima', country: 'Peru' },
  { code: 'BOG', name: 'Bogotá', country: 'Colombia' },
  { code: 'MEX', name: 'Mexico City', country: 'Mexico' },
  { code: 'CUN', name: 'Cancún', country: 'Mexico' },
  { code: 'PUJ', name: 'Punta Cana', country: 'Dominican Republic' },
  { code: 'HAV', name: 'Havana', country: 'Cuba' },
  { code: 'SJU', name: 'San Juan', country: 'Puerto Rico' },
];

const STATIC_DEALS: Deal[] = [
  { id: 'd1', from: 'London', to: 'New York', route: 'London → New York', price: 299, originalPrice: 450, currency: 'GBP', airline: 'British Airways', source: 'Error Fare', bookingLink: '#', tags: ['error-fare'], discount: 34 },
  { id: 'd2', from: 'London', to: 'Bangkok', route: 'London → Bangkok', price: 399, originalPrice: 650, currency: 'GBP', airline: 'Emirates', source: 'Hot Deal', bookingLink: '#', tags: ['business-class'], discount: 39 },
  { id: 'd3', from: 'London', to: 'Dubai', route: 'London → Dubai', price: 249, originalPrice: 380, currency: 'GBP', airline: 'Qatar Airways', source: 'Flash Sale', bookingLink: '#', tags: ['error-fare'], discount: 34 },
  { id: 'd4', from: 'London', to: 'Singapore', route: 'London → Singapore', price: 449, originalPrice: 720, currency: 'GBP', airline: 'Singapore Airlines', source: 'Premium Deal', bookingLink: '#', tags: ['premium-economy'], discount: 38 },
  { id: 'd5', from: 'London', to: 'Sydney', route: 'London → Sydney', price: 699, originalPrice: 1100, currency: 'GBP', airline: 'Qantas', source: 'Round World', bookingLink: '#', tags: ['round-the-world'], discount: 36 },
];

// Specific airlines for split ticket legs
const AIRLINES = {
  'DXB': ['Emirates', 'Qatar Airways', 'Etihad'],
  'DOH': ['Qatar Airways', 'British Airways', 'American Airlines'],
  'IST': ['Turkish Airlines', 'Pegasus Airlines'],
  'AMS': ['KLM', 'British Airways', 'EasyJet'],
  'CDG': ['Air France', 'British Airways', 'EasyJet'],
  'FRA': ['Lufthansa', 'British Airways'],
  'SIN': ['Singapore Airlines', 'British Airways', 'Qantas'],
  'HKG': ['Cathay Pacific', 'British Airways'],
  'BKK': ['Thai Airways', 'British Airways', 'EVA Air'],
};

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Deep Research states
  const [researchOrigin, setResearchOrigin] = useState('europe');
  const [researchDest, setResearchDest] = useState('asia');
  const [researchDate, setResearchDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [deepResearchLoading, setDeepResearchLoading] = useState(false);
  const [deepResearchProgress, setDeepResearchProgress] = useState(0);
  const [deepResearchResults, setDeepResearchResults] = useState<any>(null);
  
  const [results, setResults] = useState<{
    flights: FlightResult[];
    deals: Deal[];
    splitTickets: SplitTicket[];
    airports: { origin: string[]; destination: string[] };
    meta?: { cheapestPrice: number; source?: string };
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'flights' | 'deals' | 'split'>('flights');
  const [showWhatWeDo, setShowWhatWeDo] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  
  // Auto-suggest states
  const [originSuggestions, setOriginSuggestions] = useState<typeof AIRPORTS>([]);
  const [destSuggestions, setDestSuggestions] = useState<typeof AIRPORTS>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const passengerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false);
      }
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterAirports = (query: string) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return AIRPORTS.filter(a => 
      a.code.toLowerCase().includes(q) || 
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    ).slice(0, 6);
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value.toUpperCase());
    setOriginSuggestions(filterAirports(value));
    setShowOriginSuggestions(value.length > 0);
  };

  const handleDestChange = (value: string) => {
    setDestination(value.toUpperCase());
    setDestSuggestions(filterAirports(value));
    setShowDestSuggestions(value.length > 0);
  };

  const selectOrigin = (airport: typeof AIRPORTS[0]) => {
    setOrigin(airport.code);
    setShowOriginSuggestions(false);
  };

  const handleDepartureDateChange = (value: string) => {
    setDepartureDate(value);
    // If return date is set and is before departure, update it
    if (returnDate && returnDate < value) {
      // Set return to 7 days after departure by default
      const depDate = new Date(value);
      const retDate = new Date(depDate);
      retDate.setDate(retDate.getDate() + 7);
      setReturnDate(format(retDate, 'yyyy-MM-dd'));
    }
  };

  const totalPassengers = adults + children + infants;

  const searchFlightsCombined = async (useDeepSearch = false) => {
    if (!origin || !destination) return;
    setLoading(true);
    setLoadingStep(1);
    setLoadingMessage('Searching across all sources...');
    
    try {
      const params = new URLSearchParams({
        origin, destination, departureDate,
        adults: adults.toString(),
        children: children.toString(),
        infants: infants.toString(),
        travelClass,
        includeSplit: 'true'
      });
      if (returnDate) params.append('returnDate', returnDate);
      if (useDeepSearch) params.append('deepSearch', 'true');
      
      setLoadingStep(2);
      setLoadingMessage('Querying Amadeus API + Scraping Google Flights + Skyscanner...');
      
      const res = await fetch(`/api/combined-search?${params}`, { 
        signal: AbortSignal.timeout(300000) // 5 minute timeout for deep search
      });
      
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      
      setLoadingStep(3);
      setLoadingMessage('Processing and combining results...');
      
      const data = await res.json();
      
      // Convert to FlightResult format
      const flights: FlightResult[] = data.flights?.map((f: any) => ({
        id: f.id,
        airline: f.airline,
        flightNumber: f.flightNumber,
        departure: {
          airport: f.departure.airport,
          time: f.departure.time ? format(new Date(f.departure.time), 'HH:mm') : '--:--'
        },
        arrival: {
          airport: f.arrival.airport,
          time: f.arrival.time ? format(new Date(f.arrival.time), 'HH:mm') : '--:--'
        },
        duration: f.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || 'N/A',
        price: f.price,
        currency: f.currency,
        stops: f.stops,
        cabinClass: travelClass
      })) || [];
      
      // Convert split tickets
      const splitTickets: SplitTicket[] = data.splitTickets?.map((st: any) => ({
        id: st.id,
        tickets: st.tickets.map((t: any, idx: number) => ({
          ...t,
          direction: 'outbound' as const,
          step: idx + 1
        })),
        totalPrice: st.totalPrice,
        savings: st.savings,
        currency: st.currency
      })) || [];
      
      setResults({ 
        flights, 
        deals: [], 
        splitTickets, 
        airports: { origin: [origin], destination: [destination] },
        meta: { 
          ...data.meta, 
          source: 'COMBINED',
          sources: data.meta?.sources 
        }
      });
      
      // Auto-switch to split tab if we found good split tickets
      if (splitTickets.length > 0) {
        setActiveTab('split');
      }
      
    } catch (e: any) {
      console.error('Search error:', e);
      alert('Search failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setLoadingStep(0);
      setLoadingMessage('');
    }
  };
  
  // Deep search using scraper v2 (takes 1-2 minutes)
  const deepSearchWithScraper = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setLoadingStep(1);
    setLoadingMessage('Starting deep search with real-time scraping...');
    
    try {
      const params = new URLSearchParams({
        origin, 
        destination, 
        departureDate,
        travelClass,
        includeSplit: 'true'
      });
      if (returnDate) params.append('returnDate', returnDate);
      
      setLoadingStep(2);
      setLoadingMessage('Scraping Google Flights for real prices (1-2 minutes)...');
      
      const res = await fetch(`/api/scrape-v2?${params}`, {
        signal: AbortSignal.timeout(180000) // 3 minute timeout
      });
      
      if (!res.ok) {
        throw new Error(`Scraping failed: ${res.status}`);
      }
      
      setLoadingStep(3);
      setLoadingMessage('Building split ticket combinations...');
      
      const data = await res.json();
      
      // Convert scraped flights to FlightResult format
      const flights: FlightResult[] = data.flights?.slice(0, 10).map((f: any, i: number) => ({
        id: `scraped-${i}`,
        airline: f.airline,
        flightNumber: f.flightNumber,
        departure: {
          airport: f.departure.airport,
          time: f.departure.time || '--:--'
        },
        arrival: {
          airport: f.arrival.airport,
          time: f.arrival.time || '--:--'
        },
        duration: f.duration || 'N/A',
        price: f.price,
        currency: f.currency || 'GBP',
        stops: f.stops,
        cabinClass: travelClass
      })) || [];
      
      // Convert split tickets
      const splitTickets: SplitTicket[] = data.splitTickets?.map((st: any) => ({
        id: st.id,
        tickets: st.tickets.map((t: any, idx: number) => ({
          ...t,
          direction: idx < st.tickets.length / 2 ? 'outbound' : 'return' as 'outbound' | 'return',
          step: (idx % (st.tickets.length / 2)) + 1
        })),
        totalPrice: st.totalPrice,
        savings: st.savings,
        currency: st.currency
      })) || [];
      
      setResults({ 
        flights, 
        deals: [], 
        splitTickets, 
        airports: { origin: [origin], destination: [destination] },
        meta: { ...data.meta, source: 'SCRAPER_V2' }
      });
      
      // Auto-switch to split tab if we found split tickets
      if (splitTickets.length > 0) {
        setActiveTab('split');
      }
      
    } catch (e: any) {
      console.error('Deep search error:', e);
      alert('Deep search failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setLoadingStep(0);
      setLoadingMessage('');
    }
  };
  
  // Deep Research function
  const runDeepResearch = async () => {
    setDeepResearchLoading(true);
    setDeepResearchProgress(0);
    
    try {
      const params = new URLSearchParams({
        mode: 'research',
        originRegion: researchOrigin,
        destinationRegion: researchDest,
        departureDate: researchDate,
        maxRoutes: '30'
      });
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDeepResearchProgress(prev => Math.min(prev + 2, 90));
      }, 5000);
      
      const res = await fetch(`/api/deep-research?${params}`, {
        signal: AbortSignal.timeout(600000) // 10 minute timeout
      });
      
      clearInterval(progressInterval);
      setDeepResearchProgress(100);
      
      if (!res.ok) throw new Error(`Research failed: ${res.status}`);
      
      const data = await res.json();
      setDeepResearchResults(data.results);
      
    } catch (e: any) {
      console.error('Deep research error:', e);
      alert('Deep research failed: ' + e.message);
    } finally {
      setDeepResearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FlightPath</h1>
              <p className="text-xs text-gray-500">flightpath.solutions</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowWhatWeDo(!showWhatWeDo)} className="text-sm font-medium text-gray-600 hover:text-blue-600">What We Do</button>
            <button onClick={() => setShowHowItWorks(!showHowItWorks)} className="text-sm font-medium text-gray-600 hover:text-blue-600">How It Works</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {showWhatWeDo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">What We Do</h2>
              <button onClick={() => setShowWhatWeDo(false)}><Info className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center"><div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><TrendingDown className="w-7 h-7 text-blue-600" /></div><h3 className="font-semibold mb-2">Find Best Prices</h3><p className="text-sm text-gray-600">Search millions of flights for the cheapest options.</p></div>
              <div className="text-center"><div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Zap className="w-7 h-7 text-purple-600" /></div><h3 className="font-semibold mb-2">Split Tickets</h3><p className="text-sm text-gray-600">Save up to 40% by booking separate tickets.</p></div>
              <div className="text-center"><div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Globe className="w-7 h-7 text-green-600" /></div><h3 className="font-semibold mb-2">Metro Search</h3><p className="text-sm text-gray-600">Type "LON" - we check all 6 London airports.</p></div>
              <div className="text-center"><div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Sparkles className="w-7 h-7 text-orange-600" /></div><h3 className="font-semibold mb-2">Error Fares</h3><p className="text-sm text-gray-600">Catch mistake fares before they disappear.</p></div>
            </div>
          </div>
        )}

        {showHowItWorks && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">How It Works</h2>
              <button onClick={() => setShowHowItWorks(false)}><Info className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4"><div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">1</div><div><h4 className="font-semibold">Enter Your Route</h4><p className="text-sm text-gray-600">Type city codes and dates.</p></div></div>
              <div className="flex gap-4"><div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">2</div><div><h4 className="font-semibold">We Search Everywhere</h4><p className="text-sm text-gray-600">Real-time API + deal feeds.</p></div></div>
              <div className="flex gap-4"><div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">3</div><div><h4 className="font-semibold">Compare & Save</h4><p className="text-sm text-gray-600">Book directly with airlines.</p></div></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div ref={originRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={origin} 
                  onChange={e => handleOriginChange(e.target.value)} 
                  onFocus={() => origin.length >= 1 && setShowOriginSuggestions(true)}
                  placeholder="Type city or airport..." 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {originSuggestions.map(airport => (
                    <button
                      key={airport.code}
                      onClick={() => selectOrigin(airport)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{airport.code} - {airport.name}</p>
                          <p className="text-sm text-gray-500">{airport.country}</p>
                        </div>
                        {airport.airports && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{airport.airports.length} airports</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={destRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={destination} 
                  onChange={e => handleDestChange(e.target.value)} 
                  onFocus={() => destination.length >= 1 && setShowDestSuggestions(true)}
                  placeholder="Type city or airport..." 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              {showDestSuggestions && destSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {destSuggestions.map(airport => (
                    <button
                      key={airport.code}
                      onClick={() => selectDest(airport)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{airport.code} - {airport.name}</p>
                          <p className="text-sm text-gray-500">{airport.country}</p>
                        </div>
                        {airport.airports && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{airport.airports.length} airports</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Departure</label><div className="relative"><Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="date" value={departureDate} onChange={e => handleDepartureDateChange(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg" /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Return (optional)</label><div className="relative"><Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg" /></div></div>

            <div ref={passengerRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
              <button onClick={() => setShowPassengerDropdown(!showPassengerDropdown)} className="w-full px-4 py-2.5 border rounded-lg bg-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" /><span>{totalPassengers} passenger{totalPassengers > 1 ? 's' : ''}</span>
              </button>
              
              {showPassengerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="font-medium">Adults</p><p className="text-xs text-gray-500">Age 12+</p></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1} className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center">{adults}</span>
                      <button onClick={() => setAdults(Math.min(9, adults + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="font-medium">Children</p><p className="text-xs text-gray-500">Age 2-11</p></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0} className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center">{children}</span>
                      <button onClick={() => setChildren(Math.min(8, children + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div><p className="font-medium">Infants</p><p className="text-xs text-gray-500">Under 2</p></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setInfants(Math.max(0, infants - 1))} disabled={infants <= 0} className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center">{infants}</span>
                      <button onClick={() => setInfants(Math.min(adults, infants + 1))} disabled={infants >= adults} className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <button onClick={() => setShowPassengerDropdown(false)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium">Done</button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select value={travelClass} onChange={e => setTravelClass(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg"><option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium Economy</option><option value="BUSINESS">Business</option><option value="FIRST">First</option></select></div>
            <div className="flex items-end"><label className="flex items-center gap-2 py-2.5"><input type="checkbox" checked={nonStop} onChange={e => setNonStop(e.target.checked)} className="w-5 h-5" /><span className="text-sm">Non-stop only</span></label></div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => searchFlightsCombined(false)} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg transition-shadow">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <><Search className="w-5 h-5" /> Quick Search</>
              )}
            </button>
            
            <button onClick={() => searchFlightsCombined(true)} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg transition-shadow">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deep Search
                </>
              ) : (
                <><Sparkles className="w-5 h-5" /> Deep Search</>
              )}
            </button>
          </div>
          
          <div className="mt-2 flex gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-600 rounded-full"></span> Quick: Amadeus API + Split tickets (fast)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-600 rounded-full"></span> Deep: + Google Flights scrape (1-2 min)</span>
          </div>
          
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {loadingStep}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{loadingMessage}</p>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${(loadingStep / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">⏱️ This takes 1-2 minutes to scrape real prices from Google Flights</p>
            </div>
          )}
        </div>

        {results && (
          <div>
            <div className="flex gap-4 mb-6 border-b">
              {['flights', 'deals', 'split'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                  {tab === 'split' ? 'Split Tickets' : tab} ({tab === 'flights' ? results.flights.length : tab === 'deals' ? results.deals.length : results.splitTickets.length})
                </button>
              ))}
            </div>

            {activeTab === 'flights' && (
              <div className="space-y-3">
                {travelClass !== 'ECONOMY' && results.flights.length === 0 && (
                  <p className="text-sm text-amber-600 mb-2">⚠️ No {travelClass.toLowerCase().replace('_', ' ')} flights found. Try Economy.</p>
                )}
                {results.flights.map(flight => (
                  <div key={flight.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Plane className="w-6 h-6 text-blue-600" /></div>
                      <div>
                        <p className="font-semibold">{flight.airline} {flight.flightNumber}</p>
                        <p className="text-sm text-gray-600">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stops`} · {flight.duration}</p>
                        <p className="text-xs text-blue-600">{flight.cabinClass?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-center"><p className="text-lg font-bold">{flight.departure.time}</p><p className="text-sm text-gray-600">{flight.departure.airport}</p></div>
                    <div className="text-center"><p className="text-lg font-bold">{flight.arrival.time}</p><p className="text-sm text-gray-600">{flight.arrival.airport}</p></div>
                    <div className="text-right"><p className="text-2xl font-bold text-blue-600">{flight.currency} {flight.price}</p><p className="text-sm text-gray-500">per person</p></div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.deals.length > 0 ? results.deals.map(deal => (
                  <a key={deal.id} href={deal.bookingLink} target="_blank" rel="noopener noreferrer" className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md">
                    <div className="flex justify-between items-start mb-2"><p className="font-semibold">{deal.route}</p><p className="text-xl font-bold text-green-600">{deal.currency} {deal.price}</p></div>
                    {deal.airline && <p className="text-sm text-gray-600 mb-2">{deal.airline}</p>}
                    <div className="flex items-center justify-between"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{deal.source}</span>{deal.discount && <span className="text-xs text-green-600 font-semibold">Save {deal.discount}%</span>}</div>
                  </a>
                )) : <div className="col-span-3 text-center py-8 text-gray-500">No deals found for this route.</div>}
              </div>
            )}

            {activeTab === 'split' && (
              <div className="space-y-4">
                {results.splitTickets.length > 0 ? results.splitTickets.map(ticket => (
                  <div key={ticket.id} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                    <div className="flex justify-between items-start mb-3">
                      <div><p className="font-semibold">Split Ticket Option {returnDate && '(Return Journey)'}</p><p className="text-sm text-gray-600">Book {ticket.tickets.length} separate tickets and save!</p></div>
                      <div className="text-right"><p className="text-2xl font-bold text-green-600">{ticket.currency} {ticket.totalPrice}</p><p className="text-sm text-green-700">Save {ticket.currency} {ticket.savings}</p></div>
                    </div>
                    
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800"><strong>⚠️ Important:</strong> Book each ticket separately. If one flight is delayed, the airline won't rebook you on the next.</p>
                    </div>
                    
                    <div className="mb-2"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Step-by-Step Booking</p><div className="space-y-3">{ticket.tickets.slice(0, returnDate ? ticket.tickets.length / 2 : ticket.tickets.length).map((t, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{i + 1}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{t.from} → {t.to}</p>
                                <p className="text-sm text-gray-600">{t.airline} {t.flightNumber}</p>
                              </div>
                              <p className="font-bold text-lg">{ticket.currency} {t.price}</p>
                            </div>
                            <a 
                              href={t.bookingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                            >
                              Book this leg <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}</div></div>
                    
                    {returnDate && ticket.tickets.length > 2 && (
                      <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Return Flights</p><div className="space-y-3">{ticket.tickets.slice(ticket.tickets.length / 2).map((t, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{i + 1}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{t.from} → {t.to}</p>
                                  <p className="text-sm text-gray-600">{t.airline} {t.flightNumber}</p>
                                </div>
                                <p className="font-bold text-lg">{ticket.currency} {t.price}</p>
                              </div>
                              <a 
                                href={t.bookingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:underline"
                              >
                                Book this leg <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}</div></div>
                    )}
                    
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm font-semibold">Total Cost: {ticket.currency} {ticket.totalPrice}</p>
                      <p className="text-sm text-green-700">You save: {ticket.currency} {ticket.savings} vs booking a single ticket</p>
                    </div>
                  </div>
                )) : <div className="text-center py-8 text-gray-500">No split ticket options available.</div>}
              </div>
            )}
          </div>
        )}
        
      {/* Multi-Route Research Section - Different from single route search above */}
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-800 rounded-2xl text-white border-2 border-purple-400/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-6 h-6 text-yellow-300" />
                Multi-Route Research
              </h3>
              <p className="text-indigo-200 mt-1">Not sure where to fly? We search ALL airports in entire regions (e.g., all Europe → all Asia) to find the cheapest routes.</p>
            </div>
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">BETA</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-indigo-200 mb-1">Origin Region</label>
              <select 
                value={researchOrigin} 
                onChange={e => setResearchOrigin(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="europe" className="text-gray-900">Europe (25 airports)</option>
                <option value="northAmerica" className="text-gray-900">North America (23 airports)</option>
                <option value="asia" className="text-gray-900">Asia (21 airports)</option>
                <option value="middleEast" className="text-gray-900">Middle East (11 airports)</option>
                <option value="uk" className="text-gray-900">UK Only (12 airports)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-indigo-200 mb-1">Destination Region</label>
              <select 
                value={researchDest} 
                onChange={e => setResearchDest(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="asia" className="text-gray-900">Asia (21 airports)</option>
                <option value="northAmerica" className="text-gray-900">North America (23 airports)</option>
                <option value="europe" className="text-gray-900">Europe (25 airports)</option>
                <option value="oceania" className="text-gray-900">Oceania (7 airports)</option>
                <option value="africa" className="text-gray-900">Africa (9 airports)</option>
                <option value="southAmerica" className="text-gray-900">South America (10 airports)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-indigo-200 mb-1">Departure Date</label>
              <input 
                type="date" 
                value={researchDate}
                onChange={e => setResearchDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={runDeepResearch}
              disabled={deepResearchLoading}
              className="px-8 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2"
            >
              {deepResearchLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin" />
                  Researching... ({deepResearchProgress}%)
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Start Deep Research
                </>
              )}
            </button>
            
            <div className="text-sm text-indigo-200">
              <p>⏱️ Takes 5-10 minutes</p>
              <p>🔍 Searches up to 50 route combinations</p>
            </div>
          </div>          
          {deepResearchResults && (
            <div className="mt-6 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-indigo-200">Routes Searched</p>
                  <p className="text-2xl font-bold">{deepResearchResults.searchStats.routesSearched}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-indigo-200">Cheapest Flight</p>
                  <p className="text-2xl font-bold text-green-400">£{deepResearchResults.cheapestFlights[0]?.price || 'N/A'}</p>
                  <p className="text-xs">{deepResearchResults.cheapestFlights[0]?.route}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-indigo-200">Error Fares Found</p>
                  <p className="text-2xl font-bold text-yellow-400">{deepResearchResults.errorFares.length}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-indigo-200">Split Ticket Ops</p>
                  <p className="text-2xl font-bold text-pink-400">{deepResearchResults.splitTicketOpportunities.length}</p>
                </div>
              </div>
              
              {/* Error Fares Section */}
              {deepResearchResults.errorFares.length > 0 && (
                <div className="bg-red-500/20 border border-red-400/30 p-4 rounded-lg">
                  <h4 className="font-bold text-red-300 flex items-center gap-2 mb-3">
                    🚨 Error Fares Detected
                  </h4>
                  <div className="space-y-2">
                    {deepResearchResults.errorFares.slice(0, 3).map((fare: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-red-900/30 p-3 rounded">
                        <div>
                          <p className="font-semibold">{fare.route}</p>
                          <p className="text-sm text-red-200">{fare.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">£{fare.price}</p>
                          <p className="text-sm text-green-400">Save {fare.discount}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Split Ticket Opportunities */}
              {deepResearchResults.splitTicketOpportunities.length > 0 && (
                <div className="bg-purple-500/20 border border-purple-400/30 p-4 rounded-lg">
                  <h4 className="font-bold text-purple-300 mb-3">💰 Best Split Ticket Opportunities</h4>
                  <div className="space-y-2">
                    {deepResearchResults.splitTicketOpportunities.slice(0, 3).map((split: any, i: number) => (
                      <div key={i} className="bg-purple-900/30 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{split.route}</p>
                          <p className="text-green-400 font-bold">Save £{split.savings}</p>
                        </div>
                        <div className="text-sm text-purple-200 mt-1">
                          Direct: £{split.vsDirectPrice} → Split: £{split.price}
                        </div>
                        <div className="mt-2 space-y-1">
                          {split.legs?.map((leg: any, j: number) => (
                            <div key={j} className="text-xs flex items-center gap-2">
                              <span>{leg.from} → {leg.to}: £{leg.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Top Cheap Flights */}
              <div className="bg-white/10 p-4 rounded-lg">
                <h4 className="font-bold mb-3">🌍 Top 10 Cheapest Flights Found</h4>
                <div className="space-y-2">
                  {deepResearchResults.cheapestFlights.slice(0, 10).map((flight: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-indigo-300 w-6">#{i + 1}</span>
                        <span>{flight.route}</span>
                      </div>
                      <span className="font-bold">£{flight.price}</span>
                    </div>
                  ))}
                </div>              </div>
            </div>
          )}
        </div>
        
        {/* Deep Search Button */}
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-900">🔍 Deep Search with Real Scraping</p>
              <p className="text-sm text-purple-700">Get real prices from Google Flights + split ticket analysis (takes 1-2 minutes)</p>
            </div>
            <button 
              onClick={deepSearchWithScraper}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Deep Search'}
            </button>
          </div>
          {results?.meta?.source === 'SCRAPER_V2' && (
            <p className="text-xs text-green-600 mt-2">✅ Results from real-time scraping</p>
          )}
        </div>
        
        {/* Domain Configuration Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800"><strong>🌐 Domain Notice:</strong> To use flightpath.solutions instead of vercel.app, go to Vercel Dashboard → Project Settings → Domains → Add flightpath.solutions. Ensure your DNS points to Vercel.</p>
        </div>
      </main>
    </div>
  );
}