'use client';

import { useState } from 'react';
import { Plane, Search, Calendar, MapPin, TrendingDown, Zap, Globe, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
  }>;
  totalPrice: number;
  savings: number;
  currency: string;
}

const STATIC_DEALS: Deal[] = [
  { id: 'd1', from: 'London', to: 'New York', route: 'London → New York', price: 299, originalPrice: 450, currency: 'GBP', airline: 'British Airways', source: 'Error Fare', bookingLink: '#', tags: ['error-fare'], discount: 34 },
  { id: 'd2', from: 'London', to: 'Bangkok', route: 'London → Bangkok', price: 399, originalPrice: 650, currency: 'GBP', airline: 'Emirates', source: 'Hot Deal', bookingLink: '#', tags: ['business-class'], discount: 39 },
  { id: 'd3', from: 'London', to: 'Dubai', route: 'London → Dubai', price: 249, originalPrice: 380, currency: 'GBP', airline: 'Qatar Airways', source: 'Flash Sale', bookingLink: '#', tags: ['error-fare'], discount: 34 },
  { id: 'd4', from: 'London', to: 'Singapore', route: 'London → Singapore', price: 449, originalPrice: 720, currency: 'GBP', airline: 'Singapore Airlines', source: 'Premium Deal', bookingLink: '#', tags: ['premium-economy'], discount: 38 },
  { id: 'd5', from: 'London', to: 'Sydney', route: 'London → Sydney', price: 699, originalPrice: 1100, currency: 'GBP', airline: 'Qantas', source: 'Round World', bookingLink: '#', tags: ['round-the-world'], discount: 36 },
];

export default function Home() {
  const [origin, setOrigin] = useState('LON');
  const [destination, setDestination] = useState('NYC');
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

  const generateSplitTickets = (origin: string, dest: string, basePrice: number): SplitTicket[] => {
    const tickets: SplitTicket[] = [];
    const hubs = ['DXB', 'DOH', 'IST', 'AMS', 'CDG'];
    
    for (const hub of hubs.slice(0, 3)) {
      const leg1 = Math.round(basePrice * 0.4);
      const leg2 = Math.round(basePrice * 0.45);
      const total = leg1 + leg2;
      
      if (total < basePrice * 0.9) {
        tickets.push({
          id: `split-${hub}`,
          tickets: [
            { from: origin, to: hub, price: leg1, airline: 'Various Airlines', flightNumber: 'XX101' },
            { from: hub, to: dest, price: leg2, airline: 'Various Airlines', flightNumber: 'XX202' }
          ],
          totalPrice: total,
          savings: basePrice - total,
          currency: 'GBP'
        });
      }
    }
    return tickets;
  };

  const searchFlights = async () => {
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
      
      const flights: FlightResult[] = data.amadeus.slice(0, 10).map((offer: any) => {
        const seg = offer.itineraries[0]?.segments[0];
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
          stops: (offer.itineraries[0]?.segments?.length || 1) - 1
        };
      });
      
      const cheapestPrice = flights[0]?.price || 500;
      const splitTickets = generateSplitTickets(origin, destination, cheapestPrice);
      
      // Use API deals if available, otherwise use static deals
      let deals = data.deals || [];
      if (deals.length === 0) {
        // Filter static deals by route
        deals = STATIC_DEALS.filter(d => 
          (origin.includes('LON') || origin.includes('LHR') || origin.includes('LGW')) &&
          (destination.includes('NYC') || destination.includes('JFK') || destination.includes('LGA') ||
           destination.includes('DXB') || destination.includes('BKK') || destination.includes('SIN') ||
           destination.includes('SYD'))
        );
        if (deals.length === 0) deals = STATIC_DEALS.slice(0, 3);
      }
      
      setResults({
        flights,
        deals,
        splitTickets: data.splitTickets?.length > 0 ? data.splitTickets : splitTickets,
        airports: data.airports
      });
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
              <p className="text-xs text-gray-500">Find flights for less</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowWhatWeDo(!showWhatWeDo)}
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              What We Do
            </button>
            <button 
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              How It Works
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* What We Do Section */}
        {showWhatWeDo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">What We Do</h2>
              <button onClick={() => setShowWhatWeDo(false)} className="text-gray-400 hover:text-gray-600"><Info className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Find Best Prices</h3>
                <p className="text-sm text-gray-600">We search millions of flights across airlines and booking sites to find you the cheapest options.</p>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Split Tickets</h3>
                <p className="text-sm text-gray-600">Save up to 40% by booking separate tickets for each leg of your journey instead of one expensive ticket.</p>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Metro Search</h3>
                <p className="text-sm text-gray-600">Search all airports in a city at once. Type "LON" and we check Heathrow, Gatwick, Stansted, Luton, City & Southend.</p>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Error Fares</h3>
                <p className="text-sm text-gray-600">We monitor RSS feeds from deal sites to catch mistake fares and flash sales before they disappear.</p>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        {showHowItWorks && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
              <button onClick={() => setShowHowItWorks(false)} className="text-gray-400 hover:text-gray-600"><Info className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold">Enter Your Route</h4>
                  <p className="text-sm text-gray-600">Type city codes like LON, NYC, or specific airports like LHR, JFK. Add your travel dates and passenger count.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold">We Search Everywhere</h4>
                  <p className="text-sm text-gray-600">Our system queries the Amadeus API for real flight prices, checks RSS deal feeds, and calculates split-ticket savings.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold">Compare & Save</h4>
                  <p className="text-sm text-gray-600">See regular flights, special deals, and split-ticket options side by side. Click through to book directly with airlines.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value.toUpperCase())}
                  placeholder="LON, NYC, DXB..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value.toUpperCase())}
                  placeholder="NYC, PAR, BKK..."
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
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
              <input type="number" min={1} max={9} value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
              <input type="number" min={0} max={8} value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Infants</label>
              <input type="number" min={0} max={adults} value={infants} onChange={e => setInfants(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select value={travelClass} onChange={e => setTravelClass(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg">
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={nonStop} onChange={e => setNonStop(e.target.checked)} className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Non-stop only</span>
            </label>
          </div>

          <button
            onClick={searchFlights}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Searching...' : <><Search className="w-5 h-5" /> Search Flights</>}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div>
            <div className="flex gap-4 mb-6 border-b">
              {['flights', 'deals', 'split'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                >
                  {tab === 'split' ? 'Split Tickets' : tab}
                  {tab === 'flights' && ` (${results.flights.length})`}
                  {tab === 'deals' && ` (${results.deals.length})`}
                  {tab === 'split' && ` (${results.splitTickets.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'flights' && (
              <div className="space-y-3">
                {results.airports.origin.length > 1 && (
                  <p className="text-sm text-blue-600 mb-2">✓ Searching {results.airports.origin.length} origin airports: {results.airports.origin.join(', ')}</p>
                )}
                {results.flights.map(flight => (
                  <div key={flight.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Plane className="w-6 h-6 text-blue-600" /></div>
                      <div>
                        <p className="font-semibold">{flight.airline} {flight.flightNumber}</p>
                        <p className="text-sm text-gray-600">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} · {flight.duration}</p>
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
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold">{deal.route}</p>
                      <p className="text-xl font-bold text-green-600">{deal.currency} {deal.price}</p>
                    </div>
                    {deal.airline && <p className="text-sm text-gray-600 mb-2">{deal.airline}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{deal.source}</span>
                      {deal.discount && <span className="text-xs text-green-600 font-semibold">Save {deal.discount}%</span>}
                    </div>
                  </a>
                )) : (
                  <div className="col-span-3 text-center py-8 text-gray-500">No deals found for this route. Try searching London to popular destinations.</div>
                )}
              </div>
            )}

            {activeTab === 'split' && (
              <div className="space-y-4">
                {results.splitTickets.length > 0 ? results.splitTickets.map(ticket => (
                  <div key={ticket.id} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">Split Ticket Option</p>
                        <p className="text-sm text-gray-600">{ticket.tickets.map(t => `${t.from} → ${t.to}`).join(' + ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{ticket.currency} {ticket.totalPrice}</p>
                        <p className="text-sm text-green-700">Save {ticket.currency} {ticket.savings}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ticket.tickets.map((t, i) => (
                        <div key={i} className="bg-white p-3 rounded flex justify-between items-center">
                          <div><p className="font-medium">{t.from} → {t.to}</p><p className="text-sm text-gray-600">{t.airline} {t.flightNumber}</p></div>
                          <p className="font-semibold">{ticket.currency} {t.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">No split ticket options available for this route.</div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}