'use client';

import { useState } from 'react';
import { Plane, Search, Calendar, MapPin, Users, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { format, addMonths } from 'date-fns';

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

// Full airport database
const AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'UK' },
  { code: 'LTN', name: 'London Luton', city: 'London', country: 'UK' },
  { code: 'LCY', name: 'London City', city: 'London', country: 'UK' },
  { code: 'SEN', name: 'London Southend', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'New York JFK', city: 'New York', country: 'USA' },
  { code: 'LGA', name: 'New York LaGuardia', city: 'New York', country: 'USA' },
  { code: 'EWR', name: 'Newark', city: 'New York', country: 'USA' },
  { code: 'CDG', name: 'Paris CDG', city: 'Paris', country: 'France' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  { code: 'AMS', name: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'DXB', name: 'Dubai', city: 'Dubai', country: 'UAE' },
  { code: 'DOH', name: 'Doha', city: 'Doha', country: 'Qatar' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'SIN', name: 'Singapore', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'BKK', name: 'Bangkok', city: 'Bangkok', country: 'Thailand' },
  { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan' },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney', city: 'Sydney', country: 'Australia' },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { code: 'ORD', name: 'Chicago', city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami', city: 'Miami', country: 'USA' },
  { code: 'BOS', name: 'Boston', city: 'Boston', country: 'USA' },
  { code: 'FCO', name: 'Rome', city: 'Rome', country: 'Italy' },
  { code: 'MAD', name: 'Madrid', city: 'Madrid', country: 'Spain' },
  { code: 'BCN', name: 'Barcelona', city: 'Barcelona', country: 'Spain' },
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
  // Parse PT11H47M format
  const match = duration.match(/PT(\d+)H(\d+)M/);
  if (match) {
    return `${match[1]}h ${match[2]}m`;
  }
  return duration;
};

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [splitTickets, setSplitTickets] = useState<SplitTicket[]>([]);
  const [error, setError] = useState('');
  const [searchMeta, setSearchMeta] = useState<any>(null);

  const getAirportCode = (input: string): string => {
    const upper = input.toUpperCase().trim();
    const direct = AIRPORTS.find(a => a.code === upper);
    if (direct) return direct.code;
    const byCity = AIRPORTS.find(a => a.city.toUpperCase() === upper);
    if (byCity) return byCity.code;
    const byName = AIRPORTS.find(a => a.name.toUpperCase().includes(upper));
    if (byName) return byName.code;
    return upper;
  };

  const getAirportsForSearch = (code: string): string[] => {
    return CITY_GROUPS[code] || [code];
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
      
      setLoadingMessage(`Searching ${originCode} → ${destCode}...`);

      const params = new URLSearchParams({
        origin: originCode,
        destination: destCode,
        departureDate,
        travelClass,
        adults: adults.toString(),
      });
      if (returnDate) params.append('returnDate', returnDate);

      const res = await fetch(`/api/search?${params}`, { 
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();
      
      // Parse Amadeus-format flights into simplified format
      const parsedFlights: Flight[] = (data.flights || []).map((f: any) => {
        const segment = f.itineraries?.[0]?.segments?.[0];
        if (!segment) return null;
        
        const depTime = new Date(segment.departure.at);
        const arrTime = new Date(segment.arrival.at);
        const isNextDay = arrTime.getDate() !== depTime.getDate();
        
        return {
          id: f.id,
          airline: f.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class === 'Y' ? 
            getAirlineName(segment.carrierCode) : segment.carrierCode,
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
          bookingLink: f._extended?.bookingLink || `https://www.google.com/travel/flights?q=${segment.departure.iataCode}+to+${segment.arrival.iataCode}`,
        };
      }).filter(Boolean);
      
      // Parse split tickets
      const parsedSplitTickets: SplitTicket[] = (data.optimizations?.splitTickets || []).map((st: any) => ({
        id: st.id,
        hub: st.hub,
        hubName: getAirportName(st.hub),
        tickets: st.tickets.map((t: any, i: number) => {
          const seg = t.itineraries?.[0]?.segments?.[0];
          return {
            from: seg?.departure?.iataCode || '',
            to: seg?.arrival?.iataCode || '',
            airline: getAirlineName(seg?.carrierCode || ''),
            flightNumber: `${seg?.carrierCode || ''}${seg?.number || ''}`,
            price: parseInt(t.price?.total) || 0,
            layover: i === 0 ? st.layoverTime : null,
          };
        }),
        totalPrice: st.totalPrice,
        savings: st.savings,
        totalDuration: st.layoverTime || '',
        bookingLink: st.bookingLink,
      }));
      
      setSearchMeta(data.meta);
      setFlights(parsedFlights);
      setSplitTickets(parsedSplitTickets);
      
      if ((data.flights || []).length === 0 && (data.splitTickets || []).length === 0) {
        setError(data.meta?.error || 'No flights found. Try different dates or airports.');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <input 
                  type="text" 
                  value={origin} 
                  onChange={e => setOrigin(e.target.value)} 
                  placeholder="LHR, London..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <input 
                  type="text" 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)} 
                  placeholder="JFK, New York..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <input 
                  type="date" 
                  value={departureDate} 
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
                  onChange={e => setReturnDate(e.target.value)} 
                  placeholder="Optional"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                <select 
                  value={adults} 
                  onChange={e => setAdults(Number(e.target.value))} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                >
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <select 
                value={travelClass} 
                onChange={e => setTravelClass(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>
          </div>

          <button 
            onClick={searchFlights} 
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-purple-200 transition-all transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <><Sparkles className="w-5 h-5" /> Deep Search</>
            )}
          </button>
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
              {searchMeta?.route} · {getClassLabel(searchMeta?.class || 'ECONOMY')} · {searchMeta?.adults || 1} passenger{(searchMeta?.adults || 1) > 1 ? 's' : ''}
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
                        View on Google Flights <ArrowRight className="w-4 h-4" />
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
                        <span className="text-sm text-gray-600">Via {ticket.hub} · {ticket.totalDuration} total</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Book separately with {ticket.hubName}</p>
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
                          <div className="flex items-center gap-4">
                            {t.layover && (
                              <div className="flex items-center gap-1 text-sm text-amber-600">
                                <Clock className="w-4 h-4" />
                                Layover: {t.layover}
                              </div>
                            )}
                            <p className="font-bold text-lg">£{t.price.toLocaleString()}</p>
                          </div>
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
            <p className="text-gray-500">Enter your trip details above and click Deep Search</p>
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
