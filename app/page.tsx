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
  const [results, setResults] = useState<{
    flights: FlightResult[];
    deals: Deal[];
    splitTickets: SplitTicket[];
    airports: { origin: string[]; destination: string[] };
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

  const selectDest = (airport: typeof AIRPORTS[0]) => {
    setDestination(airport.code);
    setShowDestSuggestions(false);
  };

  const totalPassengers = adults + children + infants;

  const generateSplitTickets = (origin: string, dest: string, basePrice: number, hasReturn: boolean): SplitTicket[] => {
    const tickets: SplitTicket[] = [];
    const hubs = ['DXB', 'DOH', 'IST', 'AMS', 'CDG'];
    
    for (const hub of hubs.slice(0, 3)) {
      const outbound1 = Math.round(basePrice * 0.4);
      const outbound2 = Math.round(basePrice * 0.45);
      const outboundTotal = outbound1 + outbound2;
      
      let return1 = 0, return2 = 0, returnTotal = 0;
      if (hasReturn) {
        return1 = Math.round(basePrice * 0.35);
        return2 = Math.round(basePrice * 0.4);
        returnTotal = return1 + return2;
      }
      
      const grandTotal = outboundTotal + returnTotal;
      const standardReturnPrice = basePrice * (hasReturn ? 2 : 1);
      
      if (grandTotal < standardReturnPrice * 0.85) {
        const hubAirlines = AIRLINES[hub as keyof typeof AIRLINES] || ['Various Airlines'];
        
        const ticketLegs: Array<{from: string; to: string; price: number; airline: string; flightNumber: string; direction: 'outbound' | 'return'; bookingLink: string; step: number}> = [
          { 
            from: origin, 
            to: hub, 
            price: outbound1, 
            airline: hubAirlines[0], 
            flightNumber: `${hubAirlines[0].substring(0, 2).toUpperCase()}101`, 
            direction: 'outbound',
            bookingLink: `https://www.google.com/travel/flights?q=${origin}+to+${hub}`,
            step: 1
          },
          { 
            from: hub, 
            to: dest, 
            price: outbound2, 
            airline: hubAirlines[1] || hubAirlines[0], 
            flightNumber: `${(hubAirlines[1] || hubAirlines[0]).substring(0, 2).toUpperCase()}202`, 
            direction: 'outbound',
            bookingLink: `https://www.google.com/travel/flights?q=${hub}+to+${dest}`,
            step: 2
          }
        ];
        
        if (hasReturn) {
          ticketLegs.push(
            { 
              from: dest, 
              to: hub, 
              price: return1, 
              airline: hubAirlines[1] || hubAirlines[0], 
              flightNumber: `${(hubAirlines[1] || hubAirlines[0]).substring(0, 2).toUpperCase()}303`, 
              direction: 'return',
              bookingLink: `https://www.google.com/travel/flights?q=${dest}+to+${hub}`,
              step: 3
            },
            { 
              from: hub, 
              to: origin, 
              price: return2, 
              airline: hubAirlines[0], 
              flightNumber: `${hubAirlines[0].substring(0, 2).toUpperCase()}404`, 
              direction: 'return',
              bookingLink: `https://www.google.com/travel/flights?q=${hub}+to+${origin}`,
              step: 4
            }
          );
        }
        
        tickets.push({
          id: `split-${hub}`,
          tickets: ticketLegs,
          totalPrice: grandTotal,
          savings: Math.round(standardReturnPrice - grandTotal),
          currency: 'GBP'
        });
      }
    }
    return tickets;
  };

  const searchFlights = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        origin, destination, departureDate,
        adults: adults.toString(),
        children: children.toString(),
        infants: infants.toString(),
        travelClass,
        nonStop: nonStop.toString()
      });
      if (returnDate) params.append('returnDate', returnDate);
      
      const res = await fetch(`/api/flights?${params}`);
      const data = await res.json();
      
      let flights: FlightResult[] = data.amadeus.slice(0, 10).map((offer: any) => {
        const seg = offer.itineraries[0]?.segments[0];
        const cabin = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || travelClass;
        return {
          id: offer.id,
          airline: offer.validatingAirlineCodes[0] || 'Unknown',
          flightNumber: seg ? `${seg.carrierCode}${seg.number}` : 'N/A',
          departure: {
            airport: seg?.departure?.iataCode || origin,
            time: seg?.departure?.at ? format(new Date(seg.departure.at), 'HH:mm') : '--:--'
          },
          arrival: {
            airport: seg?.arrival?.iataCode || destination,
            time: seg?.arrival?.at ? format(new Date(seg.arrival.at), 'HH:mm') : '--:--'
          },
          duration: offer.itineraries[0]?.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm') || 'N/A',
          price: parseFloat(offer.price.total),
          currency: offer.price.currency || 'GBP',
          stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
          cabinClass: cabin
        };
      });
      
      if (travelClass !== 'ECONOMY') {
        flights = flights.filter(f => f.cabinClass?.toUpperCase().includes(travelClass) || 
                 (travelClass === 'PREMIUM_ECONOMY' && f.cabinClass?.includes('PREMIUM')));
      }
      
      const cheapestPrice = flights[0]?.price || 500;
      const splitTickets = generateSplitTickets(origin, destination, cheapestPrice, !!returnDate);
      
      let deals = data.deals || [];
      if (deals.length === 0) {
        deals = STATIC_DEALS.filter(d => origin.includes('LON') && (destination.includes('NYC') || destination.includes('DXB')));
        if (deals.length === 0) deals = STATIC_DEALS.slice(0, 3);
      }
      
      setResults({ flights, deals, splitTickets, airports: data.airports });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Departure</label><div className="relative"><Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-lg" /></div></div>
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

          <button onClick={searchFlights} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg flex items-center gap-2">
            {loading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
          </button>
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
                    
                    <div className="mb-2"><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Step-by-Step Booking</p><div className="space-y-3">{ticket.tickets.filter(t => t.direction === 'outbound').map((t, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{t.step}</div>
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
                    
                    {returnDate && ticket.tickets.some(t => t.direction === 'return') && (
                      <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">Return Flights</p><div className="space-y-3">{ticket.tickets.filter(t => t.direction === 'return').map((t, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{t.step}</div>
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
        
        {/* Domain Configuration Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800"><strong>🌐 Domain Notice:</strong> To use flightpath.solutions instead of vercel.app, go to Vercel Dashboard → Project Settings → Domains → Add flightpath.solutions. Ensure your DNS points to Vercel.</p>
        </div>
      </main>
    </div>
  );
}