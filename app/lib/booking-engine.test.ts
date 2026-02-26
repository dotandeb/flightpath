/**
 * Booking Engine Test Suite
 * Run with: npx ts-node app/lib/booking-engine.test.ts
 */

import { 
  BookingEngine, 
  getBookingEngine, 
  expandCityToAirports,
  getAirportTimezone,
  convertToLocalTime,
  isOvernightFlight,
  formatDuration,
  calculateLayoverDuration,
  formatFlightDetails,
  getBookingProgress,
  canModifyBooking,
  BookingStatus,
  PassengerDetails,
  PaymentDetails,
} from "./booking-engine";

// Mock the Amadeus API for testing
jest.mock("./amadeus-api", () => ({
  searchAmadeusFlights: jest.fn().mockResolvedValue([
    {
      id: "offer1",
      price: { total: "299.00", base: "250.00", currency: "GBP" },
      itineraries: [{
        segments: [{
          departure: { iataCode: "LHR", at: "2024-06-15T08:00:00Z" },
          arrival: { iataCode: "CDG", at: "2024-06-15T10:30:00Z" },
          carrierCode: "BA",
          number: "304",
          aircraft: { code: "320" },
          duration: "PT2H30M",
        }],
        duration: "PT2H30M",
      }],
      validatingAirlineCodes: ["BA"],
    },
    {
      id: "offer2",
      price: { total: "349.00", base: "300.00", currency: "GBP" },
      itineraries: [{
        segments: [{
          departure: { iataCode: "LGW", at: "2024-06-15T09:00:00Z" },
          arrival: { iataCode: "ORY", at: "2024-06-15T11:15:00Z" },
          carrierCode: "AF",
          number: "1681",
          aircraft: { code: "321" },
          duration: "PT2H15M",
        }],
        duration: "PT2H15M",
      }],
      validatingAirlineCodes: ["AF"],
    },
  ]),
  transformAmadeusResults: jest.fn().mockImplementation((offers, params) => ({
    options: offers.map((o: any) => ({
      id: o.id,
      totalPrice: parseFloat(o.price.total),
      perPersonPrice: parseFloat(o.price.total),
      currency: o.price.currency,
      segments: o.itineraries[0].segments.map((s: any) => ({
        id: `${o.id}-seg`,
        flightNumber: `${s.carrierCode}${s.number}`,
        airline: s.carrierCode,
        airlineName: s.carrierCode === "BA" ? "British Airways" : "Air France",
        origin: { code: s.departure.iataCode, name: "", city: "", country: "" },
        destination: { code: s.arrival.iataCode, name: "", city: "", country: "" },
        departureTime: s.departure.at,
        arrivalTime: s.arrival.at,
        durationMinutes: 150,
        cabinClass: "ECONOMY",
        stops: 0,
      })),
      provider: o.validatingAirlineCodes[0] === "BA" ? "British Airways" : "Air France",
      providerType: "airline",
    })),
    priceRange: { min: 299, max: 349, currency: "GBP" },
  })),
  AmadeusSearchParams: {},
  AmadeusFlightOffer: {},
}));

describe("BookingEngine", () => {
  let engine: BookingEngine;

  beforeEach(() => {
    engine = new BookingEngine();
  });

  describe("Session Management", () => {
    test("should create a new booking session", () => {
      const booking = engine.createBooking("Europe/London");
      
      expect(booking.id).toBeDefined();
      expect(booking.status).toBe("searching");
      expect(booking.userTimezone).toBe("Europe/London");
      expect(booking.flights).toEqual([]);
      expect(booking.expiresAt).toBeInstanceOf(Date);
      expect(booking.createdAt).toBeInstanceOf(Date);
    });

    test("should retrieve booking by ID", () => {
      const booking = engine.createBooking();
      const retrieved = engine.getBooking(booking.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(booking.id);
    });

    test("should return undefined for non-existent booking", () => {
      const retrieved = engine.getBooking("non-existent-id");
      expect(retrieved).toBeUndefined();
    });

    test("should extend session expiration", () => {
      const booking = engine.createBooking();
      const originalExpiry = booking.expiresAt;
      
      const extended = engine.extendSession(booking.id, 30);
      
      expect(extended.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
    });

    test("should cancel booking", () => {
      const booking = engine.createBooking();
      const result = engine.cancelBooking(booking.id);
      
      expect(result).toBe(true);
      expect(engine.getBooking(booking.id)).toBeUndefined();
    });
  });

  describe("City to Airport Expansion", () => {
    test("should expand London to all London airports", () => {
      const airports = expandCityToAirports("London");
      
      expect(airports.length).toBeGreaterThan(0);
      expect(airports.some(a => a.code === "LHR")).toBe(true);
      expect(airports.some(a => a.code === "LGW")).toBe(true);
    });

    test("should expand NYC to all New York airports", () => {
      const airports = expandCityToAirports("New York");
      
      expect(airports.length).toBeGreaterThanOrEqual(3);
      expect(airports.some(a => a.code === "JFK")).toBe(true);
      expect(airports.some(a => a.code === "LGA")).toBe(true);
      expect(airports.some(a => a.code === "EWR")).toBe(true);
    });

    test("should return single airport for airport code", () => {
      const airports = expandCityToAirports("LHR");
      
      expect(airports.length).toBe(1);
      expect(airports[0].code).toBe("LHR");
    });

    test("should handle unknown city gracefully", () => {
      const airports = expandCityToAirports("UnknownCityXYZ");
      expect(airports).toEqual([]);
    });
  });

  describe("Timezone Handling", () => {
    test("should return correct timezone for major airports", () => {
      expect(getAirportTimezone("LHR")).toBe("Europe/London");
      expect(getAirportTimezone("JFK")).toBe("America/New_York");
      expect(getAirportTimezone("NRT")).toBe("Asia/Tokyo");
      expect(getAirportTimezone("SYD")).toBe("Australia/Sydney");
    });

    test("should return UTC for unknown airport", () => {
      expect(getAirportTimezone("XXX")).toBe("UTC");
    });

    test("should convert UTC to local time", () => {
      const utcTime = "2024-06-15T08:00:00Z";
      const localTime = convertToLocalTime(utcTime, "LHR");
      
      expect(localTime).toContain("Jun");
      expect(localTime).toContain("15");
      expect(localTime).toContain("GMT");
    });

    test("should detect overnight flights", () => {
      const sameDay = isOvernightFlight(
        "2024-06-15T08:00:00Z",
        "2024-06-15T10:00:00Z"
      );
      expect(sameDay).toBe(false);

      const overnight = isOvernightFlight(
        "2024-06-15T22:00:00Z",
        "2024-06-16T06:00:00Z"
      );
      expect(overnight).toBe(true);
    });
  });

  describe("Duration Formatting", () => {
    test("should format duration correctly", () => {
      expect(formatDuration(90)).toBe("1h 30m");
      expect(formatDuration(60)).toBe("1h");
      expect(formatDuration(30)).toBe("30m");
      expect(formatDuration(150)).toBe("2h 30m");
    });

    test("should calculate layover duration", () => {
      const duration = calculateLayoverDuration(
        "2024-06-15T10:00:00Z",
        "2024-06-15T12:30:00Z"
      );
      expect(duration).toBe(150);
    });
  });

  describe("Flight Search Flow", () => {
    test("should complete full booking flow", async () => {
      // Step 1: Create booking
      const booking = engine.createBooking("Europe/London");
      expect(booking.status).toBe("searching");

      // Step 2: Search flights
      const searchResult = await engine.searchFlights(booking.id, {
        origin: "London",
        destination: "Paris",
        departureDate: "2024-06-15",
        adults: 1,
        children: 0,
        infants: 0,
        travelClass: "ECONOMY",
        currency: "GBP",
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.flights.length).toBeGreaterThan(0);

      const updatedBooking = engine.getBooking(booking.id);
      expect(updatedBooking?.status).toBe("selecting");

      // Step 3: Select flight
      const flightId = searchResult.flights[0].id;
      const selectResult = await engine.selectFlight(booking.id, flightId);
      
      expect(selectResult.success).toBe(true);
      expect(selectResult.state.status).toBe("validating");

      // Step 4: Validate
      const validationResult = await engine.validateFlight(booking.id);
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.seatsAvailable).toBe(true);

      // Step 5: Submit passenger details
      const passengers: PassengerDetails[] = [{
        id: "p1",
        type: "adult",
        title: "Mr",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-15",
        nationality: "GBR",
        passportNumber: "123456789",
        passportExpiry: "2027-01-15",
        passportCountry: "GBR",
        email: "john@example.com",
        phone: "+44123456789",
      }];

      const passengerResult = await engine.submitPassengerDetails(booking.id, passengers);
      expect(passengerResult.success).toBe(true);

      // Step 6: Process payment
      const payment: PaymentDetails = {
        method: "credit_card",
        cardNumber: "4111111111111111",
        cardHolder: "John Doe",
        expiryMonth: "12",
        expiryYear: "2027",
        cvv: "123",
        currency: "GBP",
        amount: 299,
        status: "pending",
      };

      const paymentResult = await engine.processPayment(booking.id, payment);
      expect(paymentResult.success).toBe(true);

      // Step 7: Confirm booking
      const confirmResult = await engine.confirmBooking(booking.id);
      
      expect(confirmResult.success).toBe(true);
      expect(confirmResult.confirmation).toBeDefined();
      expect(confirmResult.confirmation?.bookingReference).toBeDefined();
      expect(confirmResult.state.status).toBe("confirmed");
    });

    test("should handle price change during validation", async () => {
      const booking = engine.createBooking();
      
      // Mock price change scenario would go here
      // This would require more sophisticated mocking
    });

    test("should handle invalid passenger details", async () => {
      const booking = engine.createBooking();
      
      await engine.searchFlights(booking.id, {
        origin: "London",
        destination: "Paris",
        departureDate: "2024-06-15",
        adults: 1,
        children: 0,
        infants: 0,
        travelClass: "ECONOMY",
        currency: "GBP",
      });

      const invalidPassengers: PassengerDetails[] = [{
        id: "p1",
        type: "adult",
        title: "Mr",
        firstName: "", // Invalid - empty
        lastName: "Doe",
        dateOfBirth: "1990-01-15",
        nationality: "GBR",
      }];

      const result = await engine.submitPassengerDetails(booking.id, invalidPassengers);
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    test("should handle payment amount mismatch", async () => {
      const booking = engine.createBooking();
      
      await engine.searchFlights(booking.id, {
        origin: "London",
        destination: "Paris",
        departureDate: "2024-06-15",
        adults: 1,
        children: 0,
        infants: 0,
        travelClass: "ECONOMY",
        currency: "GBP",
      });

      const selectResult = await engine.selectFlight(booking.id, "offer1");
      
      const payment: PaymentDetails = {
        method: "credit_card",
        currency: "GBP",
        amount: 100, // Wrong amount
        status: "pending",
      };

      const result = await engine.processPayment(booking.id, payment);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PAYMENT_AMOUNT_MISMATCH");
    });
  });

  describe("Error Recovery", () => {
    test("should restart expired booking with saved params", async () => {
      const booking = engine.createBooking();
      
      await engine.searchFlights(booking.id, {
        origin: "London",
        destination: "Paris",
        departureDate: "2024-06-15",
        adults: 1,
        children: 0,
        infants: 0,
        travelClass: "ECONOMY",
        currency: "GBP",
      });

      const restart = engine.restartBooking(booking.id);
      
      expect(restart.newBookingId).toBeDefined();
      expect(restart.savedParams).toBeDefined();
      expect(restart.savedParams?.origin).toBe("London");
    });

    test("should get alternative flights when selected unavailable", async () => {
      const booking = engine.createBooking();
      
      await engine.searchFlights(booking.id, {
        origin: "London",
        destination: "Paris",
        departureDate: "2024-06-15",
        adults: 1,
        children: 0,
        infants: 0,
        travelClass: "ECONOMY",
        currency: "GBP",
      });

      const alternatives = engine.getAlternativeFlights(booking.id);
      expect(Array.isArray(alternatives)).toBe(true);
    });
  });

  describe("Booking Progress", () => {
    test("should calculate correct progress percentages", () => {
      const states: BookingStatus[] = [
        "searching", "selecting", "validating", "booking", "confirmed"
      ];
      const expectedProgress = [10, 30, 50, 70, 100];

      states.forEach((status, idx) => {
        const mockState = { status } as any;
        expect(getBookingProgress(mockState)).toBe(expectedProgress[idx]);
      });
    });

    test("should determine if booking can be modified", () => {
      const confirmedState = { status: "confirmed" } as any;
      expect(canModifyBooking(confirmedState).canModify).toBe(false);

      const selectingState = { 
        status: "selecting", 
        expiresAt: new Date(Date.now() + 10000) 
      } as any;
      expect(canModifyBooking(selectingState).canModify).toBe(true);

      const expiredState = { 
        status: "selecting", 
        expiresAt: new Date(Date.now() - 10000) 
      } as any;
      expect(canModifyBooking(expiredState).canModify).toBe(false);
    });
  });

  describe("Statistics", () => {
    test("should return booking statistics", () => {
      // Create some bookings
      engine.createBooking();
      engine.createBooking();
      engine.createBooking();

      const stats = engine.getStats();
      
      expect(stats.totalBookings).toBe(3);
      expect(stats.byStatus.searching).toBe(3);
    });

    test("should cleanup expired sessions", () => {
      const booking = engine.createBooking();
      
      // Manually expire the booking
      const state = engine.getBooking(booking.id);
      if (state) {
        (state as any).expiresAt = new Date(Date.now() - 1000);
      }

      const cleaned = engine.cleanupExpiredSessions();
      expect(cleaned).toBe(1);
      expect(engine.getBooking(booking.id)).toBeUndefined();
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log("Run tests with: npx jest app/lib/booking-engine.test.ts");
}
