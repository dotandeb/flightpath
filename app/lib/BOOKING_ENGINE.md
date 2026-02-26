# Booking Flow Engine

Production-grade booking system with comprehensive state management for FlightPath.

## Overview

The Booking Engine handles the complete flight booking flow with:

- **State Machine**: Tracks booking status through all stages
- **Multi-Airport Support**: Automatically expands cities to all available airports
- **Timezone Handling**: All internal times in UTC, display in user's local timezone
- **Error Recovery**: Graceful handling of price changes, flight unavailability, payment failures
- **Price Locking**: 5-minute price holds during booking

## Booking Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SEARCHING  │────▶│  SELECTING  │────▶│  VALIDATING │────▶│   BOOKING   │────▶│  CONFIRMED  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
   User searches      User selects       Re-check price    Collect details    Issue tickets
   for flights        a flight           & availability     & payment          & send email
```

## Quick Start

```typescript
import { getBookingEngine } from "./booking-engine";

const engine = getBookingEngine();

// Step 1: Create booking session
const booking = engine.createBooking("Europe/London");

// Step 2: Search flights
const result = await engine.searchFlights(booking.id, {
  origin: "London",
  destination: "Paris",
  departureDate: "2024-06-15",
  adults: 2,
  children: 0,
  infants: 0,
  travelClass: "ECONOMY",
  currency: "GBP",
});

// Step 3: Select flight
await engine.selectFlight(booking.id, result.flights[0].id);

// Step 4: Validate
await engine.validateFlight(booking.id);

// Step 5: Submit passengers
await engine.submitPassengerDetails(booking.id, [{
  id: "p1",
  type: "adult",
  title: "Mr",
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1985-03-15",
  nationality: "GBR",
  passportNumber: "123456789",
  passportExpiry: "2027-03-15",
  passportCountry: "GBR",
  email: "john@example.com",
  phone: "+44 20 7123 4567",
}]);

// Step 6: Process payment
await engine.processPayment(booking.id, {
  method: "credit_card",
  cardNumber: "4111111111111111",
  cardHolder: "John Doe",
  expiryMonth: "12",
  expiryYear: "2027",
  cvv: "123",
  currency: "GBP",
  amount: result.flights[0].totalPrice,
  status: "pending",
});

// Step 7: Confirm
const confirmation = await engine.confirmBooking(booking.id);
console.log(`Booking confirmed: ${confirmation.confirmation?.bookingReference}`);
```

## API Reference

### BookingEngine Class

#### `createBooking(userTimezone?: string): BookingState`
Creates a new booking session with 30-minute expiration.

#### `searchFlights(bookingId: string, params: SearchParams): Promise<SearchResult>`
Searches for flights, expanding cities to airports automatically.

#### `selectFlight(bookingId: string, flightId: string): Promise<SelectResult>`
Selects a flight and locks the price for 5 minutes.

#### `validateFlight(bookingId: string): Promise<ValidationResult>`
Re-checks flight availability and price before booking.

#### `submitPassengerDetails(bookingId: string, passengers: PassengerDetails[]): Promise<PassengerResult>`
Validates and stores passenger information.

#### `processPayment(bookingId: string, payment: PaymentDetails): Promise<PaymentResult>`
Processes payment and stores transaction details.

#### `confirmBooking(bookingId: string): Promise<ConfirmationResult>`
Issues tickets and generates confirmation details.

### Error Recovery Methods

#### `handlePriceChange(bookingId: string): Promise<PriceChangeResult>`
Re-queries flights when price changes during validation.

#### `getAlternativeFlights(bookingId: string): SelectedFlight[]`
Returns alternative flights when selected flight is unavailable.

#### `retryPayment(bookingId: string, newPaymentDetails: PaymentDetails): Promise<PaymentResult>`
Retries payment with a different method.

#### `restartBooking(originalBookingId: string): RestartResult`
Creates a new booking session with saved search parameters.

## Multi-Airport Support

The engine automatically expands city names to all available airports:

| City | Airports |
|------|----------|
| London | LHR, LGW, STN, LTN, LCY, SEN |
| New York | JFK, LGA, EWR |
| Paris | CDG, ORY, BVA |
| Tokyo | NRT, HND |

```typescript
// These all work automatically
await engine.searchFlights(booking.id, {
  origin: "London",        // Searches all 6 London airports
  destination: "Paris",    // Searches CDG, ORY, BVA
  // ...
});
```

## Timezone Handling

All internal times are stored in UTC. Display times are converted to the user's timezone.

```typescript
import { convertToLocalTime, getAirportTimezone } from "./booking-engine";

// Get airport timezone
const tz = getAirportTimezone("NRT"); // "Asia/Tokyo"

// Convert UTC to local time
const localTime = convertToLocalTime("2024-06-15T08:00:00Z", "LHR");
// "Sat, Jun 15, 09:00 AM GMT+1"
```

## Error Handling

The engine provides detailed error information for recovery:

```typescript
try {
  await engine.selectFlight(bookingId, flightId);
} catch (error) {
  if (error instanceof BookingEngineError) {
    console.log(error.code);           // "FLIGHT_NOT_FOUND"
    console.log(error.message);        // "Selected flight not found"
    console.log(error.recoverable);    // true
    console.log(error.suggestedAction); // "Select a different flight"
  }
}
```

### Common Error Codes

| Code | Description | Recoverable |
|------|-------------|-------------|
| `BOOKING_NOT_FOUND` | Session doesn't exist | No |
| `BOOKING_EXPIRED` | Session timed out | Yes - restart |
| `FLIGHT_NOT_FOUND` | Selected flight invalid | Yes - select another |
| `PRICE_CHANGED` | Price increased during booking | Yes - re-validate |
| `PAYMENT_FAILED` | Card declined | Yes - retry |
| `PAYMENT_AMOUNT_MISMATCH` | Wrong payment amount | Yes - correct amount |
| `INVALID_PASSPORT` | Passport validation failed | Yes - fix details |

## State Management

Track booking progress:

```typescript
import { getBookingProgress, canModifyBooking } from "./booking-engine";

const state = engine.getBooking(bookingId);

// Get progress percentage (0-100)
const progress = getBookingProgress(state); // 10, 30, 50, 70, 100

// Check if booking can be modified
const { canModify, reason } = canModifyBooking(state);
```

## Session Management

```typescript
// Extend session (default +15 minutes)
engine.extendSession(bookingId, 30);

// Cancel booking
engine.cancelBooking(bookingId, "User requested cancellation");

// Get statistics
const stats = engine.getStats();
// { totalBookings: 10, byStatus: {...}, expiredCount: 2 }

// Cleanup expired sessions
const cleaned = engine.cleanupExpiredSessions();
```

## Types

### BookingState
```typescript
interface BookingState {
  id: string;
  status: 'searching' | 'selecting' | 'validating' | 'booking' | 'confirmed' | 'failed' | 'expired';
  flights: SelectedFlight[];
  passengerDetails?: PassengerDetails[];
  paymentDetails?: PaymentDetails;
  searchParams?: SearchParams;
  validationResult?: ValidationResult;
  confirmationDetails?: ConfirmationDetails;
  error?: BookingError;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userTimezone: string;
  metadata: Record<string, any>;
}
```

### PassengerDetails
```typescript
interface PassengerDetails {
  id: string;
  type: "adult" | "child" | "infant";
  title: "Mr" | "Mrs" | "Ms" | "Miss" | "Dr" | "Prof";
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
}
```

### PaymentDetails
```typescript
interface PaymentDetails {
  method: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  billingAddress?: Address;
  currency: string;
  amount: number;
  transactionId?: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
}
```

## Testing

Run the test suite:

```bash
npx jest app/lib/booking-engine.test.ts
```

Run examples:

```bash
npx ts-node app/lib/booking-engine.examples.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      BookingEngine                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   States    │  │ Price Locks │  │  Session Manager    │  │
│  │   (Map)     │  │   (Map)     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Flow Steps:                                                │
│    1. searchFlights()    → City expansion, multi-airport    │
│    2. selectFlight()     → Price lock (5 min)               │
│    3. validateFlight()   → Re-check price & availability    │
│    4. submitPassengers() → Passport validation              │
│    5. processPayment()   → Payment gateway integration      │
│    6. confirmBooking()   → Issue tickets, send email        │
├─────────────────────────────────────────────────────────────┤
│  Utilities:                                                 │
│    - Timezone handling (UTC internal, local display)        │
│    - Duration calculations                                  │
│    - Overnight flight detection                             │
│    - Ground transport options                               │
└─────────────────────────────────────────────────────────────┘
```

## Integration with Amadeus API

The booking engine integrates with the existing Amadeus API:

```typescript
import { searchAmadeusFlights } from "./amadeus-api";

// The engine calls this internally for flight searches
const offers = await searchAmadeusFlights({
  origin: "LHR",
  destination: "CDG",
  departureDate: "2024-06-15",
  adults: 1,
  currency: "GBP",
});
```

## License

MIT
