/**
 * Booking Engine Usage Examples
 * 
 * This file demonstrates how to use the BookingEngine
 * for various booking scenarios.
 */

import { 
  getBookingEngine,
  expandCityToAirports,
  getAirportTimezone,
  convertToLocalTime,
  formatDuration,
  BookingEngineError,
} from "./booking-engine";

// ============================================
// EXAMPLE 1: Basic Booking Flow
// ============================================

async function exampleBasicBooking() {
  console.log("=== Example 1: Basic Booking Flow ===\n");
  
  const engine = getBookingEngine();
  
  // Step 1: Create a booking session
  const booking = engine.createBooking("Europe/London");
  console.log(`Created booking: ${booking.id}`);
  console.log(`Status: ${booking.status}`);
  console.log(`Expires at: ${booking.expiresAt}\n`);
  
  // Step 2: Search for flights
  console.log("Searching flights...");
  const searchResult = await engine.searchFlights(booking.id, {
    origin: "London",
    destination: "Paris",
    departureDate: "2024-06-15",
    returnDate: "2024-06-20",
    adults: 2,
    children: 0,
    infants: 0,
    travelClass: "ECONOMY",
    currency: "GBP",
  });
  
  if (!searchResult.success) {
    console.error("Search failed:", searchResult.errors);
    return;
  }
  
  console.log(`Found ${searchResult.totalResults} flights`);
  console.log(`Price range: ${searchResult.priceRange.currency} ${searchResult.priceRange.min} - ${searchResult.priceRange.max}`);
  
  if (searchResult.alternativeAirports.warnings.length > 0) {
    console.log("Warnings:", searchResult.alternativeAirports.warnings);
  }
  
  // Display first few flights
  searchResult.flights.slice(0, 3).forEach((flight, idx) => {
    console.log(`\nFlight ${idx + 1}:`);
    console.log(`  Price: ${flight.currency} ${flight.totalPrice}`);
    console.log(`  Route: ${flight.segments.map(s => `${s.origin.code} → ${s.destination.code}`).join(", ")}`);
    console.log(`  Airline: ${flight.airlineName || flight.provider}`);
  });
  
  // Step 3: Select a flight
  const selectedFlight = searchResult.flights[0];
  console.log(`\nSelecting flight: ${selectedFlight.id}`);
  
  const selectResult = await engine.selectFlight(booking.id, selectedFlight.id);
  console.log(`Selection result: ${selectResult.success ? "Success" : "Failed"}`);
  
  if (selectResult.warnings) {
    console.log("Warnings:", selectResult.warnings);
  }
  
  // Step 4: Validate the flight
  console.log("\nValidating flight...");
  const validation = await engine.validateFlight(booking.id);
  
  if (!validation.isValid) {
    console.error("Validation failed:", validation.errors);
    if (validation.priceChanged) {
      console.log(`Price changed from ${validation.oldPrice} to ${validation.newPrice}`);
    }
    return;
  }
  
  console.log("Validation passed!");
  
  // Step 5: Submit passenger details
  console.log("\nSubmitting passenger details...");
  const passengerResult = await engine.submitPassengerDetails(booking.id, [
    {
      id: "p1",
      type: "adult",
      title: "Mr",
      firstName: "John",
      lastName: "Smith",
      dateOfBirth: "1985-03-15",
      nationality: "GBR",
      passportNumber: "123456789",
      passportExpiry: "2027-03-15",
      passportCountry: "GBR",
      email: "john.smith@example.com",
      phone: "+44 20 7123 4567",
    },
    {
      id: "p2",
      type: "adult",
      title: "Mrs",
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "1988-07-22",
      nationality: "GBR",
      passportNumber: "987654321",
      passportExpiry: "2028-07-22",
      passportCountry: "GBR",
      email: "jane.smith@example.com",
      phone: "+44 20 7123 4567",
    },
  ]);
  
  if (!passengerResult.success) {
    console.error("Passenger validation failed:", passengerResult.errors);
    return;
  }
  
  console.log("Passenger details accepted!");
  
  // Step 6: Process payment
  console.log("\nProcessing payment...");
  const paymentResult = await engine.processPayment(booking.id, {
    method: "credit_card",
    cardNumber: "4111111111111111",
    cardHolder: "John Smith",
    expiryMonth: "12",
    expiryYear: "2027",
    cvv: "123",
    billingAddress: {
      line1: "123 Main Street",
      city: "London",
      postalCode: "SW1A 1AA",
      country: "GB",
    },
    currency: "GBP",
    amount: selectedFlight.totalPrice,
    status: "pending",
  });
  
  if (!paymentResult.success) {
    console.error("Payment failed:", paymentResult.error);
    return;
  }
  
  console.log("Payment successful!");
  
  // Step 7: Confirm booking
  console.log("\nConfirming booking...");
  const confirmResult = await engine.confirmBooking(booking.id);
  
  if (!confirmResult.success) {
    console.error("Confirmation failed:", confirmResult.error);
    return;
  }
  
  console.log("\n✅ Booking Confirmed!");
  console.log(`Booking Reference: ${confirmResult.confirmation?.bookingReference}`);
  console.log(`Tickets: ${confirmResult.confirmation?.ticketNumbers.join(", ")}`);
  console.log(`Email sent: ${confirmResult.confirmation?.emailSent}`);
  
  if (confirmResult.confirmation?.groundTransportOptions?.length) {
    console.log("\nGround transport options:");
    confirmResult.confirmation.groundTransportOptions.forEach(opt => {
      console.log(`  ${opt.type}: ${opt.from} → ${opt.to} (${formatDuration(opt.durationMinutes)}) - ${opt.currency} ${opt.price}`);
    });
  }
}

// ============================================
// EXAMPLE 2: Multi-Airport City Search
// ============================================

async function exampleMultiAirportSearch() {
  console.log("\n=== Example 2: Multi-Airport City Search ===\n");
  
  // Expand city to airports
  const londonAirports = expandCityToAirports("London");
  console.log("London airports:");
  londonAirports.forEach(a => {
    console.log(`  ${a.code} - ${a.name} (${a.timezone})`);
  });
  
  const nycAirports = expandCityToAirports("New York");
  console.log("\nNew York airports:");
  nycAirports.forEach(a => {
    console.log(`  ${a.code} - ${a.name}`);
  });
  
  // Search will automatically use primary airports
  // but include alternatives in results
  const engine = getBookingEngine();
  const booking = engine.createBooking("America/New_York");
  
  const result = await engine.searchFlights(booking.id, {
    origin: "London",      // Will expand to LHR, LGW, STN, LTN, LCY, SEN
    destination: "Paris",  // Will expand to CDG, ORY, BVA
    departureDate: "2024-07-01",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: "BUSINESS",
    currency: "EUR",
  });
  
  if (result.alternativeAirports.warnings.length > 0) {
    console.log("\nMulti-airport warnings:");
    result.alternativeAirports.warnings.forEach(w => console.log(`  ⚠️ ${w}`));
  }
  
  if (result.alternativeAirports.originAlternatives.length > 0) {
    console.log("\nAlternative origin airports:");
    result.alternativeAirports.originAlternatives.forEach(a => {
      console.log(`  ${a.code} - ${a.name}`);
    });
  }
}

// ============================================
// EXAMPLE 3: Error Handling & Recovery
// ============================================

async function exampleErrorHandling() {
  console.log("\n=== Example 3: Error Handling & Recovery ===\n");
  
  const engine = getBookingEngine();
  const booking = engine.createBooking();
  
  // Simulate a search
  await engine.searchFlights(booking.id, {
    origin: "London",
    destination: "Tokyo",
    departureDate: "2024-08-01",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: "ECONOMY",
    currency: "GBP",
  });
  
  // Try to select a non-existent flight
  try {
    await engine.selectFlight(booking.id, "non-existent-flight");
  } catch (error) {
    if (error instanceof BookingEngineError) {
      console.log(`Error caught: ${error.code}`);
      console.log(`Message: ${error.message}`);
      console.log(`Recoverable: ${error.recoverable}`);
    }
  }
  
  // Simulate price change scenario
  console.log("\nSimulating price change handling...");
  const handleResult = await engine.handlePriceChange(booking.id);
  console.log(`Price change handled: ${handleResult.success}`);
  console.log(`Message: ${handleResult.message}`);
  
  // Get alternative flights
  const alternatives = engine.getAlternativeFlights(booking.id);
  console.log(`\nAlternative flights available: ${alternatives.length}`);
  
  // Simulate session expiration and restart
  console.log("\nSimulating session restart...");
  const restart = engine.restartBooking(booking.id);
  console.log(`New booking ID: ${restart.newBookingId}`);
  console.log(`Saved params: ${restart.savedParams ? "Yes" : "No"}`);
  console.log(`Message: ${restart.message}`);
}

// ============================================
// EXAMPLE 4: Timezone Handling
// ============================================

function exampleTimezoneHandling() {
  console.log("\n=== Example 4: Timezone Handling ===\n");
  
  const departureTime = "2024-06-15T08:00:00Z"; // UTC
  const arrivalTime = "2024-06-15T10:30:00Z";   // UTC
  
  // London to Paris
  console.log("Flight: London (LHR) → Paris (CDG)");
  console.log(`Departure (UTC): ${departureTime}`);
  console.log(`Departure (Local): ${convertToLocalTime(departureTime, "LHR")}`);
  console.log(`Arrival (Local): ${convertToLocalTime(arrivalTime, "CDG")}`);
  
  // Overnight flight example
  const overnightDeparture = "2024-06-15T22:00:00Z";
  const overnightArrival = "2024-06-16T14:00:00Z";
  
  console.log("\nOvernight flight: London → Tokyo");
  console.log(`Departure: ${convertToLocalTime(overnightDeparture, "LHR")}`);
  console.log(`Arrival: ${convertToLocalTime(overnightArrival, "NRT")}`);
  console.log(`Is overnight: ${overnightArrival.split("T")[0] !== overnightDeparture.split("T")[0]}`);
  
  // Show timezone for various airports
  console.log("\nAirport timezones:");
  const airports = ["LHR", "JFK", "NRT", "SYD", "DXB", "SIN"];
  airports.forEach(code => {
    console.log(`  ${code}: ${getAirportTimezone(code)}`);
  });
}

// ============================================
// EXAMPLE 5: Booking Statistics
// ============================================

function exampleStatistics() {
  console.log("\n=== Example 5: Booking Statistics ===\n");
  
  const engine = getBookingEngine();
  
  // Create multiple bookings
  for (let i = 0; i < 5; i++) {
    engine.createBooking();
  }
  
  const stats = engine.getStats();
  console.log("Booking Statistics:");
  console.log(`  Total bookings: ${stats.totalBookings}`);
  console.log(`  By status:`, stats.byStatus);
  console.log(`  Expired: ${stats.expiredCount}`);
  
  // Cleanup
  const cleaned = engine.cleanupExpiredSessions();
  console.log(`\nCleaned up ${cleaned} expired sessions`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  try {
    // Run examples
    await exampleBasicBooking();
    await exampleMultiAirportSearch();
    await exampleErrorHandling();
    exampleTimezoneHandling();
    exampleStatistics();
    
    console.log("\n✅ All examples completed!");
  } catch (error) {
    console.error("Example failed:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  exampleBasicBooking,
  exampleMultiAirportSearch,
  exampleErrorHandling,
  exampleTimezoneHandling,
  exampleStatistics,
};
