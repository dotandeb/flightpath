import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/app/lib/flight-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, passengers } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate airport codes (3 letters)
    if (!/^[A-Za-z]{3}$/.test(origin) || !/^[A-Za-z]{3}$/.test(destination)) {
      return NextResponse.json(
        { error: "Invalid airport code format. Use 3-letter codes like LHR, JFK." },
        { status: 400 }
      );
    }

    console.log("Searching flights:", { origin, destination, departureDate, returnDate });

    const results = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      passengers: passengers || 1,
    });

    // Ensure we have valid data
    if (!results || !results.standard) {
      throw new Error("Invalid search results");
    }

    console.log("Search completed:", {
      standardPrice: results.standard?.totalPrice,
      alternativesCount: results.alternatives?.length,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    
    // Return a valid fallback response
    return NextResponse.json({
      error: error.message || "Failed to search flights",
      standard: {
        outbound: {
          origin: "???",
          destination: "???",
          departureTime: new Date().toISOString(),
          arrivalTime: new Date().toISOString(),
          airline: "Error",
          flightNumber: "",
          price: 0,
        },
        inbound: {
          origin: "???",
          destination: "???",
          departureTime: new Date().toISOString(),
          arrivalTime: new Date().toISOString(),
          airline: "Error",
          flightNumber: "",
          price: 0,
        },
        totalPrice: 0,
        bookingLink: "#",
        strategy: "Error",
        savingsVsStandard: 0,
      },
      alternatives: [],
      bestOption: null,
      allStrategies: ["Error"],
    }, { status: 200 }); // Return 200 so client can show error message
  }
}
