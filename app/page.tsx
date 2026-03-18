'use client';

import { useState } from 'react';
import { Plane, Search, Calendar, MapPin, Users } from 'lucide-react';
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

interface SplitTicket {
  id: string;
  hub: string;
  tickets: Array<{
    from: string;
    to: string;
    airline: string;
    flightNumber: string;
    price: number;
  }>;
  totalPrice: number;
  savings: number;
}

// Full airport database
const AIRPORTS = [
  // London
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'UK' },
  { code: 'LTN', name: 'London Luton', city: 'London', country: 'UK' },
  { code: 'LCY', name: 'London City', city: 'London', country: 'UK' },
  { code: 'SEN', name: 'London Southend', city: 'London', country: 'UK' },
  // New York
  { code: 'JFK', name: 'New York JFK', city: 'New York', country: 'USA' },
  { code: 'LGA', name: 'New York LaGuardia', city: 'New York', country: 'USA' },
  { code: 'EWR', name: 'Newark', city: 'New York', country: 'USA' },
  // Major hubs
  { code: 'CDG', name: 'Paris CDG', city: 'Paris', country: 'France' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  { code: 'AMS', name: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { code: 'DXB', name: 'Dubai', city: 'Dubai', country: 'UAE' },
  { code: 'DOH', name: 'Doha', city: 'Doha', country: 'Qatar' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'SIN', name: 'Singapore', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'BKK', name: 'Bangkok', city: 'Bangkok', country: 'Thailand' },
  { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan' },
  { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia' },
  // US
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { code: 'ORD', name: 'Chicago O\'Hare', city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami', city: 'Miami', country: 'USA' },
  { code: 'BOS', name: 'Boston', city: 'Boston', country: 'USA' },
  { code: 'SEA', name: 'Seattle', city: 'Seattle', country: 'USA' },
  { code: 'LAS', name: 'Las Vegas', city: 'Las Vegas', country: 'USA' },
  { code: 'DFW', name: 'Dallas', city: 'Dallas', country: 'USA' },
  { code: 'DEN', name: 'Denver', city: 'Denver', country: 'USA' },
  { code: 'ATL', name: 'Atlanta', city: 'Atlanta', country: 'USA' },
  // UK
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK' },
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK' },
  { code: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'UK' },
  { code: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'UK' },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland' },
  // Europe
  { code: 'MAD', name: 'Madrid', city: 'Madrid', country: 'Spain' },
  { code: 'BCN', name: 'Barcelona', city: 'Barcelona', country: 'Spain' },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy' },
  { code: 'VIE', name: 'Vienna', city: 'Vienna', country: 'Austria' },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', name: 'Stockholm', city: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', name: 'Oslo', city: 'Oslo', country: 'Norway' },
  { code: 'HEL', name: 'Helsinki', city: 'Helsinki', country: 'Finland' },
  { code: 'WAW', name: 'Warsaw', city: 'Warsaw', country: 'Poland' },
  { code: 'PRG', name: 'Prague', city: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', name: 'Budapest', city: 'Budapest', country: 'Hungary' },
  { code: 'ATH', name: 'Athens', city: 'Athens', country: 'Greece' },
  { code: 'LIS', name: 'Lisbon', city: 'Lisbon', country: 'Portugal' },
  { code: 'BRU', name: 'Brussels', city: 'Brussels', country: 'Belgium' },
  // Asia
  { code: 'ICN', name: 'Seoul', city: 'Seoul', country: 'South Korea' },
  { code: 'KUL', name: 'Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'CGK', name: 'Jakarta', city: 'Jakarta', country: 'Indonesia' },
  { code: 'MNL', name: 'Manila', city: 'Manila', country: 'Philippines' },
  { code: 'BOM', name: 'Mumbai', city: 'Mumbai', country: 'India' },
  { code: 'DEL', name: 'Delhi', city: 'Delhi', country: 'India' },
  { code: 'BLR', name: 'Bangalore', city: 'Bangalore', country: 'India' },
  { code: 'MAA', name: 'Chennai', city: 'Chennai', country: 'India' },
  { code: 'HYD', name: 'Hyderabad', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', name: 'Kolkata', city: 'Kolkata', country: 'India' },
  { code: 'PNQ', name: 'Pune', city: 'Pune', country: 'India' },
  { code: 'GOI', name: 'Goa', city: 'Goa', country: 'India' },
  { code: 'COK', name: 'Kochi', city: 'Kochi', country: 'India' },
  // Middle East
  { code: 'TLV', name: 'Tel Aviv', city: 'Tel Aviv', country: 'Israel' },
  { code: 'CAI', name: 'Cairo', city: 'Cairo', country: 'Egypt' },
  { code: 'RUH', name: 'Riyadh', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', name: 'Jeddah', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'KWI', name: 'Kuwait City', city: 'Kuwait City', country: 'Kuwait' },
  { code: 'BAH', name: 'Bahrain', city: 'Bahrain', country: 'Bahrain' },
  { code: 'MCT', name: 'Muscat', city: 'Muscat', country: 'Oman' },
  { code: 'AMM', name: 'Amman', city: 'Amman', country: 'Jordan' },
  { code: 'BEY', name: 'Beirut', city: 'Beirut', country: 'Lebanon' },
  // Africa
  { code: 'JNB', name: 'Johannesburg', city: 'Johannesburg', country: 'South Africa' },
  { code: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'South Africa' },
  { code: 'LOS', name: 'Lagos', city: 'Lagos', country: 'Nigeria' },
  { code: 'ADD', name: 'Addis Ababa', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'NBO', name: 'Nairobi', city: 'Nairobi', country: 'Kenya' },
  { code: 'CMN', name: 'Casablanca', city: 'Casablanca', country: 'Morocco' },
  { code: 'TUN', name: 'Tunis', city: 'Tunis', country: 'Tunisia' },
  { code: 'ALG', name: 'Algiers', city: 'Algiers', country: 'Algeria' },
  // Americas
  { code: 'YYZ', name: 'Toronto', city: 'Toronto', country: 'Canada' },
  { code: 'YVR', name: 'Vancouver', city: 'Vancouver', country: 'Canada' },
  { code: 'YUL', name: 'Montreal', city: 'Montreal', country: 'Canada' },
  { code: 'YYC', name: 'Calgary', city: 'Calgary', country: 'Canada' },
  { code: 'GRU', name: 'São Paulo', city: 'São Paulo', country: 'Brazil' },
  { code: 'GIG', name: 'Rio de Janeiro', city: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'EZE', name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'SCL', name: 'Santiago', city: 'Santiago', country: 'Chile' },
  { code: 'LIM', name: 'Lima', city: 'Lima', country: 'Peru' },
  { code: 'BOG', name: 'Bogotá', city: 'Bogotá', country: 'Colombia' },
  { code: 'MEX', name: 'Mexico City', city: 'Mexico City', country: 'Mexico' },
  { code: 'CUN', name: 'Cancún', city: 'Cancún', country: 'Mexico' },
];

// City groupings for metro search
const CITY_GROUPS: Record<string, string[]> = {
  'LON': ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'],
  'NYC': ['JFK', 'LGA', 'EWR'],
  'PAR': ['CDG', 'ORY'],
  'TYO': ['NRT', 'HND'],
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
    // Direct match
    const direct = AIRPORTS.find(a => a.code === upper);
    if (direct) return direct.code;
    // City match
    const byCity = AIRPORTS.find(a => a.city.toUpperCase() === upper);
    if (byCity) return byCity.code;
    // Name match
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
      
      const originAirports = getAirportsForSearch(originCode);
      const destAirports = getAirportsForSearch(destCode);

      setLoadingMessage(`Searching ${originAirports.join('/')} → ${destAirports.join('/')}...`);

      const params = new URLSearchParams({
        origin: originAirports[0],
        destination: destAirports[0],
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
      
      setSearchMeta(data.meta);
      setFlights(data.flights || []);
      setSplitTickets(data.splitTickets || []);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FlightPath</h1>
              <p className="text-xs text-gray-500">Find the cheapest flights</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={origin} 
                  onChange={e => setOrigin(e.target.value)} 
                  placeholder="LHR, London, Heathrow..." 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={destination} 
                  onChange={e => setDestination(e.target.value)} 
                  placeholder="JFK, New York..." 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="date" 
                  value={departureDate} 
                  onChange={e => setDepartureDate(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return (optional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="date" 
                  value={returnDate} 
                  onChange={e => setReturnDate(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select 
                  value={adults} 
                  onChange={e => setAdults(Number(e.target.value))} 
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                >
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select 
                value={travelClass} 
                onChange={e => setTravelClass(e.target.value)} 
                className="w-full px-4 py-2.5 border rounded-lg"
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>
          </div>

          <button 
            onClick={searchFlights} 
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loadingMessage}
              </>
            ) : (
              <><Search className="w-5 h-5" /> Search Flights</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {flights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              Flights ({flights.length} found)
              {searchMeta?.sources?.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  from {searchMeta.sources.join(', ')}
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {flights.map(flight => (
                <div key={flight.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{flight.airline} {flight.flightNumber}</p>
                      <p className="text-sm text-gray-600">
                        {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} 
                        {flight.duration && ` · ${flight.duration}`}
                      </p>
                      <p className="text-xs text-gray-400">Source: {flight.source}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{flight.departure.time || '--:--'}</p>
                    <p className="text-sm text-gray-600">{flight.from}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{flight.arrival.time || '--:--'}</p>
                    <p className="text-sm text-gray-600">{flight.to}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">£{flight.price}</p>
                    <a 
                      href={flight.bookingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Book →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Split Tickets */}
        {splitTickets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Split Ticket Options ({splitTickets.length})</h2>
            <div className="space-y-4">
              {splitTickets.map(ticket => (
                <div key={ticket.id} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">Via {ticket.hub}</p>
                      <p className="text-sm text-gray-600">Book separate tickets and save!</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">£{ticket.totalPrice}</p>
                      <p className="text-sm text-green-700">Save £{ticket.savings}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ticket.tickets.map((t, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{t.from} → {t.to}</p>
                            <p className="text-sm text-gray-600">{t.airline} {t.flightNumber}</p>
                          </div>
                          <p className="font-bold">£{t.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && !error && flights.length === 0 && splitTickets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Enter your trip details and click Search</p>
            <p className="text-sm mt-2">Try: London (LHR) → New York (JFK)</p>
          </div>
        )}
      </main>
    </div>
  );
}
