declare module "amadeus" {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: string;
    logLevel?: string;
    ssl?: boolean;
    port?: number;
  }

  interface FlightOffer {
    type: string;
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: Array<{
      duration: string;
      segments: Array<{
        departure: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        arrival: {
          iataCode: string;
          terminal?: string;
          at: string;
        };
        carrierCode: string;
        number: string;
        aircraft: {
          code: string;
        };
        operating?: {
          carrierCode: string;
        };
        duration: string;
        id: string;
        numberOfStops: number;
        blacklistedInEU: boolean;
      }>;
    }>;
    price: {
      currency: string;
      total: string;
      base: string;
      fees: Array<{
        amount: string;
        type: string;
      }>;
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
      price: {
        currency: string;
        total: string;
        base: string;
      };
      fareDetailsBySegment: Array<{
        segmentId: string;
        cabin: string;
        fareBasis: string;
        class: string;
        includedCheckedBags: {
          quantity: number;
        };
      }>;
    }>;
  }

  interface FlightOffersResponse {
    data: FlightOffer[];
    dictionaries?: {
      locations: Record<string, any>;
      aircraft: Record<string, string>;
      currencies: Record<string, string>;
      carriers: Record<string, string>;
    };
    meta?: {
      count: number;
      links: {
        self: string;
      };
    };
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    shopping: {
      flightOffersSearch: {
        get(params: {
          originLocationCode: string;
          destinationLocationCode: string;
          departureDate: string;
          returnDate?: string;
          adults?: string;
          children?: string;
          infants?: string;
          travelClass?: string;
          includedAirlineCodes?: string;
          excludedAirlineCodes?: string;
          nonStop?: string;
          currencyCode?: string;
          maxPrice?: string;
          max?: string;
        }): Promise<FlightOffersResponse>;
      };
    };
  }

  export default Amadeus;
}
