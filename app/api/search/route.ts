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

    console.log("Search completed, results:", {
      standardPrice: results.standard?.totalPrice,
      alternativesCount: results.alternatives?.length,
      bestPrice: results.bestOption?.totalPrice,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    
    // Return a valid response structure even on error
    return NextResponse.json(
      { 
        error: error.message || "Failed to search flights",
        standard: null,
        alternatives: [],
        bestOption: null,
      },
      { status: 500 }
    );
  }
}
