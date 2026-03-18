import Amadeus from 'amadeus';
import { FlightOffer, SearchParams } from '@/types';

let amadeusClient: Amadeus | null = null;

export function getAmadeusClient(): Amadeus | null {
  if (typeof window !== 'undefined') return null;
  
  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    console.log('[Amadeus] API keys not configured');
    return null;
  }
  
  if (!amadeusClient) {
    try {
      amadeusClient = new Amadeus({
        clientId: apiKey,
        clientSecret: apiSecret,
        hostname: 'api.amadeus.com'  // Production API
      });
      console.log('[Amadeus] Client initialized successfully');
    } catch (error) {
      console.error('[Amadeus] Failed to initialize client:', error);
      return null;
    }
  }
  
  return amadeusClient;
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const client = getAmadeusClient();
  
  if (!client) {
    console.log('[Amadeus] Client not available');
    return [];
  }
  
  try {
    console.log('[Amadeus] Searching:', params);
    
    const searchParams: any = {
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults || 1,
      children: params.children || 0,
      infants: params.infants || 0,
      travelClass: params.travelClass || 'ECONOMY',
      nonStop: params.nonStop || false,
      max: 250,
      currencyCode: 'GBP'
    };
    
    if (params.returnDate) {
      searchParams.returnDate = params.returnDate;
    }
    
    const response = await client.shopping.flightOffersSearch.get(searchParams);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`[Amadeus] Found ${response.data.length} flights`);
      return response.data as FlightOffer[];
    }
    
    return [];
  } catch (error: any) {
    console.error('[Amadeus] Search error:', error?.response?.data || error.message);
    // Log full error for debugging
    console.error('[Amadeus] Full error:', JSON.stringify(error, null, 2));
    return [];
  }
}

// Generate sample flights for testing when API fails
export function generateSampleFlights(params: SearchParams): FlightOffer[] {
  const airlines = [
    { code: 'BA', name: 'British Airways' },
    { code: 'AF', name: 'Air France' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'KL', name: 'KLM' },
    { code: 'VS', name: 'Virgin Atlantic' },
    { code: 'EK', name: 'Emirates' },
    { code: 'QR', name: 'Qatar Airways' },
    { code: 'AA', name: 'American Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'UA', name: 'United Airlines' }
  ];
  
  const flights: FlightOffer[] = [];
  const basePrice = 200 + Math.random() * 600;
  
  for (let i = 0; i < 8; i++) {
    const airline = airlines[i % airlines.length];
    const price = (basePrice + Math.random() * 300).toFixed(2);
    const duration = 180 + Math.floor(Math.random() * 600);
    
    const departureTime = new Date(params.departureDate);
    departureTime.setHours(6 + i * 2, Math.floor(Math.random() * 60));
    
    const arrivalTime = new Date(departureTime.getTime() + duration * 60000);
    const hasStops = Math.random() > 0.6;
    const stops = hasStops ? 1 + Math.floor(Math.random() * 2) : 0;
    
    const flight: FlightOffer = {
      id: `sample-${i}`,
      source: 'GDS',
      instantTicketingRequired: false,
      nonHomogeneous: false,
      oneWay: !params.returnDate,
      lastTicketingDate: params.departureDate,
      numberOfBookableSeats: 9,
      itineraries: [{
        duration: `PT${Math.floor(duration / 60)}H${duration % 60}M`,
        segments: [{
          id: `seg-${i}`,
          departure: {
            iataCode: params.origin,
            at: departureTime.toISOString()
          },
          arrival: {
            iataCode: params.destination,
            at: arrivalTime.toISOString()
          },
          carrierCode: airline.code,
          number: `${100 + Math.floor(Math.random() * 900)}`,
          aircraft: { code: '77W' },
          duration: `PT${Math.floor(duration / 60)}H${duration % 60}M`,
          numberOfStops: stops
        }]
      }],
      price: {
        currency: 'GBP',
        total: price,
        base: (parseFloat(price) * 0.85).toFixed(2),
        fees: [
          { amount: (parseFloat(price) * 0.1).toFixed(2), type: 'TAXES' },
          { amount: (parseFloat(price) * 0.05).toFixed(2), type: 'SUPPLIER' }
        ],
        grandTotal: price
      },
      pricingOptions: {
        fareType: ['PUBLISHED'],
        includedCheckedBagsOnly: false
      },
      validatingAirlineCodes: [airline.code],
      travelerPricings: [{
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          currency: 'GBP',
          total: price,
          base: (parseFloat(price) * 0.85).toFixed(2)
        },
        fareDetailsBySegment: [{
          segmentId: `seg-${i}`,
          cabin: params.travelClass || 'ECONOMY',
          fareBasis: 'Y',
          class: 'Y',
          includedCheckedBags: { quantity: 1 }
        }]
      }]
    };
    
    flights.push(flight);
  }
  
  return flights.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
}