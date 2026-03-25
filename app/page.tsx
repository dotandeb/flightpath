'use client';

import { useState, useEffect, useRef } from 'react';
import { Plane, Search, Calendar, MapPin, Users, Sparkles, ArrowRight, Clock, X, ChevronDown } from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: { airport: string; time: string; date: string; };
  arrival: { airport: string; time: string; date: string; };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  source: string;
  bookingLink: string;
}

interface SplitTicketLeg {
  from: string;
  to: string;
  airline: string;
  flightNumber: string;
  price: number;
  layover: string | null;
}

interface SplitTicket {
  id: string;
  hub: string;
  hubName: string;
  tickets: SplitTicketLeg[];
  totalPrice: number;
  savings: number;
  totalDuration: string;
  bookingLink: string;
}

interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

// Comprehensive airport database
const AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'LTN', name: 'London Luton', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'LCY', name: 'London City', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'SEN', name: 'London Southend', city: 'London', country: 'UK', region: 'Europe' },
  { code: 'JFK', name: 'New York JFK', city: 'New York', country: 'USA', region: 'North America' },
  { code: 'LGA', name: 'New York LaGuardia', city: 'New York', country: 'USA', region: 'North America' },
  { code: 'EWR', name: 'Newark', city: 'New York', country: 'USA', region: 'North America' },
  { code: 'CDG', name: 'Paris CDG', city: 'Paris', country: 'France', region: 'Europe' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', region: 'Europe' },
  { code: 'AMS', name: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', region: 'Europe' },
  { code: 'DXB', name: 'Dubai', city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { code: 'DOH', name: 'Doha', city: 'Doha', country: 'Qatar', region: 'Middle East' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  { code: 'SIN', name: 'Singapore', city: 'Singapore', country: 'Singapore', region: 'Asia' },
  { code: 'HKG', name: 'Hong Kong', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'BKK', name: 'Bangkok', city: 'Bangkok', country: 'Thailand', region: 'Asia' },
  { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', region: 'Asia' },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', region: 'Asia' },
  { code: 'SYD', name: 'Sydney', city: 'Sydney', country: 'Australia', region: 'Oceania' },
  { code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia', region: 'Oceania' },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', country: 'USA', region: 'North America' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA', region: 'North America' },
  { code: 'ORD', name: 'Chicago', city: 'Chicago', country: 'USA', region: 'North America' },
  { code: 'MIA', name: 'Miami', city: 'Miami', country: 'USA', region: 'North America' },
  { code: 'BOS', name: 'Boston', city: 'Boston', country: 'USA', region: 'North America' },
  { code: 'DFW', name: 'Dallas', city: 'Dallas', country: 'USA', region: 'North America' },
  { code: 'SEA', name: 'Seattle', city: 'Seattle', country: 'USA', region: 'North America' },
  { code: 'DEN', name: 'Denver', city: 'Denver', country: 'USA', region: 'North America' },
  { code: 'LAS', name: 'Las Vegas', city: 'Las Vegas', country: 'USA', region: 'North America' },
  { code: 'ATL', name: 'Atlanta', city: 'Atlanta', country: 'USA', region: 'North America' },
  { code: 'PHX', name: 'Phoenix', city: 'Phoenix', country: 'USA', region: 'North America' },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'MAD', name: 'Madrid', city: 'Madrid', country: 'Spain', region: 'Europe' },
  { code: 'BCN', name: 'Barcelona', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', region: 'Europe' },
  { code: 'ZUR', name: 'Zurich', city: 'Zurich', country: 'Switzerland', region: 'Europe' },
  { code: 'VIE', name: 'Vienna', city: 'Vienna', country: 'Austria', region: 'Europe' },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark', region: 'Europe' },
  { code: 'OSL', name: 'Oslo', city: 'Oslo', country: 'Norway', region: 'Europe' },
  { code: 'ARN', name: 'Stockholm', city: 'Stockholm', country: 'Sweden', region: 'Europe' },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland', region: 'Europe' },
  { code: 'PRG', name: 'Prague', city: 'Prague', country: 'Czech Republic', region: 'Europe' },
  { code: 'WAW', name: 'Warsaw', city: 'Warsaw', country: 'Poland', region: 'Europe' },
  { code: 'ATH', name: 'Athens', city: 'Athens', country: 'Greece', region: 'Europe' },
  { code: 'LIS', name: 'Lisbon', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'HEL', name: 'Helsinki', city: 'Helsinki', country: 'Finland', region: 'Europe' },
  { code: 'ICN', name: 'Seoul Incheon', city: 'Seoul', country: 'South Korea', region: 'Asia' },
  { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China', region: 'Asia' },
  { code: 'PEK', name: 'Beijing', city: 'Beijing', country: 'China', region: 'Asia' },
  { code: 'DEL', name: 'Delhi', city: 'Delhi', country: 'India', region: 'Asia' },
  { code: 'BOM', name: 'Mumbai', city: 'Mumbai', country: 'India', region: 'Asia' },
  { code: 'KUL', name: 'Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia' },
  { code: 'MNL', name: 'Manila', city: 'Manila', country: 'Philippines', region: 'Asia' },
  { code: 'YYZ', name: 'Toronto', city: 'Toronto', country: 'Canada', region: 'North America' },
  { code: 'YVR', name: 'Vancouver', city: 'Vancouver', country: 'Canada', region: 'North America' },
  { code: 'MEX', name: 'Mexico City', city: 'Mexico City', country: 'Mexico', region: 'North America' },
  { code: 'GRU', name: 'Sao Paulo', city: 'Sao Paulo', country: 'Brazil', region: 'South America' },
  { code: 'EZE', name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina', region: 'South America' },
  { code: 'JNB', name: 'Johannesburg', city: 'Johannesburg', country: 'South Africa', region: 'Africa' },
  { code: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'South Africa', region: 'Africa' },
  { code: 'CAI', name: 'Cairo', city: 'Cairo', country: 'Egypt', region: 'Africa' },
  { code: 'TLV', name: 'Tel Aviv', city: 'Tel Aviv', country: 'Israel', region: 'Middle East' },
  { code: 'AUH', name: 'Abu Dhabi', city: 'Abu Dhabi', country: 'UAE', region: 'Middle East' },
];

const CITY_GROUPS: Record<string, string[]> = {
  'LON': ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'],
  'NYC': ['JFK', 'LGA', 'EWR'],
  'PAR': ['CDG', 'ORY'],
  'TYO': ['NRT', 'HND'],
};

// Helper functions
const getAirlineName = (code: string): string => {
  const airlines: Record<string, string> = {
    'BA': 'British Airways', 'VS': 'Virgin Atlantic', 'AA': 'American Airlines',
    'DL': 'Delta', 'UA': 'United', 'AF': 'Air France', 'KL': 'KLM',
    'LH': 'Lufthansa', 'EK': 'Emirates', 'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific', 'TG': 'Thai Airways', 'QF': 'Qantas',
    'QR': 'Qatar Airways', 'IB': 'Iberia', 'AZ': 'ITA Airways',
    'JL': 'JAL', 'NH': 'ANA', 'NZ': 'Air New Zealand', 'EV': 'Evelop',
    'U2': 'easyJet', 'AC': 'Air Canada', 'AY': 'Finnair', 'OS': 'Austrian',
    'SK': 'SAS', 'DY': 'Norwegian', 'EI': 'Aer Lingus', 'TP': 'TAP',
    'OK': 'Czech', 'LO': 'LOT', 'W6': 'Wizz Air', 'FR': 'Ryanair',
    'VY': 'Vueling', 'UX': 'Air Europa', 'LX': 'Swiss', 'A3': 'Aegean',
    'MS': 'EgyptAir', 'SA': 'South African', 'ET': 'Ethiopian', 'LY': 'El Al',
    'KU': 'Kuwait', 'EY': 'Etihad', 'KE': 'Korean Air', 'OZ': 'Asiana',
    'MU': 'China Eastern', 'CZ': 'China Southern', 'CA': 'Air China',
    'AI': 'Air India', 'MH': 'Malaysia', 'GA': 'Garuda', 'PR': 'Philippine',
    'UL': 'SriLankan', 'HX': 'Hong Kong Airlines', 'TR': 'Scoot',
    'LA': 'LATAM', 'AM': 'Aeromexico', 'AR': 'Aerolineas Argentinas',
    'B6': 'JetBlue', 'AS': 'Alaska', 'WS': 'WestJet', 'TS': 'Air Transat',
  };
  return airlines[code] || code;
};

const getAirportName = (code: string): string => {
  const airport = AIRPORTS.find(a => a.code === code);
  return airport?.name || code;
};

const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+)H(\d+)M/);
  if (match) {
    return `${match[1]}h ${match[2]}m`;
  }
  return duration;
};

// Airport Autocomplete Component
function AirportAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  label 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilteredAirports = (query: string) => {
    if (!query || query.length < 1) return [];
    const lowerQuery = query.toLowerCase();
    return AIRPORTS.filter(a => 
      a.code.toLowerCase().includes(lowerQuery) ||
      a.city.toLowerCase().includes(lowerQuery) ||
      a.name.toLowerCase().includes(lowerQuery) ||
      a.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    onChange(val);
  };

  const handleSelect = (airport: typeof AIRPORTS[0]) => {
    onChange(airport.code);
    setInputValue(`${airport.city} (${airport.code})`);
    setIsOpen(false);
  };

  const filtered = getFilteredAirports(inputValue);

  // Group by city for display
  const grouped = filtered.reduce((acc, airport) => {
    if (!acc[airport.city]) acc[airport.city] = [];
    acc[airport.city].push(airport);
    return acc;
  }, {} as Record<string, typeof AIRPORTS>);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
        <input 
          type="text" 
          value={inputValue || value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
        />
      </div>
      
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([city, airports]) => (
            <div key={city}>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {city}, {airports[0].country}
              </div>
              {airports.map(airport => (
                <button
                  key={airport.code}
                  onClick={() => handleSelect(airport)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-gray-900">{airport.name}</span>
                    <span className="text-gray-500 text-sm ml-2">{airport.code}</span>
                  </div>
                  <span className="text-xs text-gray-400">{airport.region}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Passenger Selector Component
function PassengerSelector({ 
  passengers, 
  onChange 
}: { 
  passengers: Passengers; 
  onChange: (p: Passengers) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const total = passengers.adults + passengers.children + passengers.infants;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateCount = (type: keyof Passengers, delta: number) => {
    const newValue = passengers[type] + delta;
    if (type === 'adults' && newValue < 1) return; // At least 1 adult
    if (newValue < 0) return;
    if (total + delta > 9) return; // Max 9 passengers
    onChange({ ...passengers, [type]: newValue });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-left bg-white flex items-center justify-between"
      >
        <Users className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
        <span>{total} passenger{total !== 1 ? 's' : ''}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          {[
            { key: 'adults' as const, label: 'Adults', sub: 'Age 16+' },
            { key: 'children' as const, label: 'Children', sub: 'Age 2-15' },
            { key: 'infants' as const, label: 'Infants', sub: 'Under 2' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-xs text-gray-500">{sub}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateCount(key, -1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  disabled={key === 'adults' ? passengers.adults <= 1 : passengers[key] <= 0}
                >
                  -
                </button>
                <span className="w-6 text-center font-medium">{passengers[key]}</span>
                <button
                  onClick={() => updateCount(key, 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                  disabled={total >= 9}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [splitTickets, setSplitTickets] = useState<SplitTicket[]>([]);
  const [error, setError] = useState('');
  const [searchMeta, setSearchMeta] = useState<any>(null);

  // Auto-set return date when departure date changes
  useEffect(() => {
    if (departureDate && !returnDate) {
      setReturnDate(format(addDays(new Date(departureDate), 7), 'yyyy-MM-dd'));
    } else if (departureDate && returnDate && new Date(returnDate) <= new Date(departureDate)) {
      setReturnDate(format(addDays(new Date(departureDate), 7), 'yyyy-MM-dd'));
    }
  }, [departureDate]);

  const getAirportCode = (input: string): string => {
    const upper = input.toUpperCase().trim();
    // If it's already a 3-letter code
    if (upper.length === 3 && AIRPORTS.some(a => a.code === upper)) {
      return upper;
    }
    // Try to find by code within the input
    const found = AIRPORTS.find(a => 
      upper.includes(a.code) || 
      a.city.toUpperCase() === upper
    );
    return found?.code || upper.slice(0, 3);
  };

  const searchFlights = async () => {
    if (!origin || !destination) {
      setError('Please enter origin and destination');
      return;
    }

    setLoading(true);
    setError('');
    setFlights([]);
    setSplitTickets([]);
    setLoadingMessage('Searching for flights...');

    try {
      const originCode = getAirportCode(origin);
      const destCode = getAirportCode(destination);
      const totalPassengers = passengers.adults + passengers.children;
      
      setLoadingMessage(`Searching ${originCode} → ${destCode}...`);

      const params = new URLSearchParams({
        origin: originCode,
        destination: destCode,
        departureDate,
        travelClass,
        adults: totalPassengers.toString(),
      });
      if (returnDate) params.append('returnDate', returnDate);

      const res = await fetch(`/api/search?${params}`, { 
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();
      
      // Parse flights
      const parsedFlights: Flight[] = (data.flights || []).map((f: any) => {
        const segment = f.itineraries?.[0]?.segments?.[0];
        if (!segment) return null;
        
        const depTime = new Date(segment.departure.at);
        const arrTime = new Date(segment.arrival.at);
        const isNextDay = arrTime.getDate() !== depTime.getDate();
        
        return {
          id: f.id,
          airline: getAirlineName(segment.carrierCode),
          flightNumber: `${segment.carrierCode}${segment.number}`,
          from: segment.departure.iataCode,
          to: segment.arrival.iataCode,
          departure: {
            airport: segment.departure.iataCode,
            time: format(depTime, 'HH:mm'),
            date: format(depTime, 'yyyy-MM-dd'),
          },
          arrival: {
            airport: segment.arrival.iataCode,
            time: format(arrTime, 'HH:mm'),
            date: isNextDay ? 'next day' : format(arrTime, 'yyyy-MM-dd'),
          },
          duration: formatDuration(f.itineraries[0].duration),
          stops: segment.numberOfStops || 0,
          price: parseInt(f.price?.total) || 0,
          currency: f.price?.currency || 'GBP',
          source: f.source,
          bookingLink: f._extended?.bookingLink || f.bookingLink || '#',
        };
      }).filter(Boolean);
      
      // Parse split tickets
      const parsedSplitTickets: SplitTicket[] = (data.optimizations?.splitTickets || []).map((st: any) => ({
        id: st.id,
        hub: st.hub,
        hubName: st.hubName || getAirportName(st.hub),
        tickets: st.tickets.map((t: any, i: number) => ({
          from: t.from,
          to: t.to,
          airline: t.airline,
          flightNumber: t.flightNumber,
          price: t.price,
          layover: t.layover,
        })),
        totalPrice: st.totalPrice,
        savings: st.savings,
        totalDuration: st.totalDuration,
        bookingLink: st.bookingLink,
      }));
      
      setSearchMeta(data.meta);
      setFlights(parsedFlights);
      setSplitTickets(parsedSplitTickets);
      
      if (parsedFlights.length === 0 && parsedSplitTickets.length === 0) {
        setError('No flights found. Try different dates or airports.');
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const getClassLabel = (c: string) => {
    const labels: Record<string, string> = {
      'ECONOMY': 'Economy',
      'PREMIUM_ECONOMY': 'Premium Economy',
      'BUSINESS': 'Business',
      'FIRST': 'First Class',
    };
    return labels[c] || c;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">FlightPath</h1>
              <p className="text-xs text-gray-500">Find the cheapest flights with smart split tickets</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-purple-100 p-6 mb-8 border border-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
            <div className="lg:col-span-2">
              <AirportAutocomplete
                label="From"
                value={origin}
                onChange={setOrigin}
                placeholder="London, LHR..."
              />
            </div>

            <div className="lg:col-span-2">
              <AirportAutocomplete
                label="To"
                value={destination}
                onChange={setDestination}
                placeholder="New York, JFK..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <input 
                  type="date" 
                  value={departureDate} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setDepartureDate(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Return</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <input 
                  type="date" 
                  value={returnDate} 
                  min={departureDate}
                  onChange={e => setReturnDate(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <PassengerSelector
                passengers={passengers}
                onChange={setPassengers}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <button 
              onClick={searchFlights} 
              disabled={loading}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-purple-200 transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <><Sparkles className="w-5 h-5" /> Search Flights</>
              )}
            </button>

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select 
                value={travelClass} 
                onChange={e => setTravelClass(e.target.value)} 
                className="px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Results Header */}
        {(flights.length > 0 || splitTickets.length > 0) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {flights.length} flight{flights.length !== 1 ? 's' : ''} 
              {splitTickets.length > 0 && <> & {splitTickets.length} split ticket option{splitTickets.length !== 1 ? 's' : ''}</>}
            </h2>
            <p className="text-gray-600">
              {searchMeta?.route} · {getClassLabel(travelClass)} · {passengers.adults + passengers.children + passengers.infants} passenger{passengers.adults + passengers.children + passengers.infants !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Regular Flights */}
        {flights.length > 0 && (
          <div className="mb-8">
            <div className="space-y-3">
              {flights.map((flight, idx) => (
                <div 
                  key={flight.id} 
                  className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${idx === 0 ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-200'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                        <Plane className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{flight.airline}</p>
                        <p className="text-sm text-gray-600">{flight.flightNumber} · {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{flight.departure.time}</p>
                        <p className="text-sm text-gray-600">{flight.from}</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-gray-400">
                        <p className="text-xs">{flight.duration}</p>
                        <div className="w-20 h-0.5 bg-gray-300 my-1 relative">
                          <div className="absolute -right-1 -top-1 w-2 h-2 bg-gray-300 rounded-full" />
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{flight.arrival.time}</p>
                        <p className="text-sm text-gray-600">{flight.to} {flight.arrival.date === 'next day' && <span className="text-xs text-orange-500">+1</span>}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-3xl font-bold text-purple-600">£{flight.price.toLocaleString()}</p>
                      <a 
                        href={flight.bookingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 mt-1"
                      >
                        Book on {flight.airline} <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Split Tickets */}
        {splitTickets.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold">Split Ticket Savings</h2>
            </div>
            
            <div className="space-y-4">
              {splitTickets.map(ticket => (
                <div key={ticket.id} className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 rounded-2xl border border-amber-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">Save £{ticket.savings.toLocaleString()}</span>
                        <span className="text-sm text-gray-600">Via {ticket.hub}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Book separately via {ticket.hubName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-amber-700">£{ticket.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {ticket.tickets.map((t, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border-l-4 border-amber-400">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-bold text-sm">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium">{t.from} → {t.to}</p>
                              <p className="text-sm text-gray-600">{t.airline} {t.flightNumber}</p>
                            </div>
                          </div>
                          {t.layover && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Clock className="w-4 h-4" />
                              Layover: {t.layover}
                            </div>
                          )}
                          <p className="font-bold text-lg">£{t.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <a 
                    href={ticket.bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900"
                  >
                    Check prices on Google Flights <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && flights.length === 0 && splitTickets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-12 h-12 text-purple-400" />
            </div>
            <p className="text-xl font-medium text-gray-700 mb-2">Ready to find your flight?</p>
            <p className="text-gray-500">Enter your trip details above and click Search Flights</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['LHR → JFK', 'LON → NYC', 'CDG → SIN', 'DXB → LHR'].map(route => (
                <button
                  key={route}
                  onClick={() => {
                    const [from, to] = route.split(' → ');
                    setOrigin(from);
                    setDestination(to);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full text-sm transition-colors"
                >
                  {route}
                </button>
              ))}
            </div>          
          </div>
        )}
      </main>
    </div>
  );
}
