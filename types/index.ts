export interface FlightSegment {
  id: string;
  departure: { iataCode: string; terminal?: string; at: string; };
  arrival: { iataCode: string; terminal?: string; at: string; };
  carrierCode: string;
  number: string;
  aircraft: { code: string; name?: string; };
  duration: string;
  numberOfStops: number;
  operating?: { carrierCode: string; };
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: FlightItinerary[];
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{ amount: string; type: string; }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: { currency: string; total: string; base: string; };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      class: string;
      includedCheckedBags: { quantity: number; weight?: number; weightUnit?: string; };
    }>;
  }>;
}

export interface Deal {
  id: string;
  title: string;
  route: string;
  from: string;
  to: string;
  price: number;
  originalPrice?: number;
  currency: string;
  departureDate?: string;
  returnDate?: string;
  airline?: string;
  bookingLink: string;
  source: string;
  publishedAt: string;
  expiresAt?: string;
  imageUrl?: string;
  tags?: string[];
  discount?: number;
}

export interface SplitTicket {
  id: string;
  tickets: Array<{
    from: string;
    to: string;
    price: number;
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    bookingLink: string;
  }>;
  totalPrice: number;
  savings: number;
  currency: string;
  totalDuration: string;
  stops: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop: boolean;
  maxPrice?: number;
  sortBy?: 'price' | 'duration' | 'best';
}

export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface City {
  code: string;
  name: string;
  country: string;
  airports: string[];
}

export interface SearchResults {
  amadeus: FlightOffer[];
  deals: Deal[];
  splitTickets: SplitTicket[];
  airports: {
    origin: string[];
    destination: string[];
  };
  meta: {
    searchTime: number;
    totalResults: number;
    cheapestPrice: number;
    bestDeal: Deal | null;
  };
}