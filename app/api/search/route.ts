import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/app/lib/flight-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      adults = 1, 
      children = 0, 
      infants = 0,
      travelClass = "ECONOMY"
    } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate airport codes
    if (!/^[A-Za-z]{3}$/.test(origin) || !/^[A-Za-z]{3}$/.test(destination)) {
      return NextResponse.json(
        { error: "Invalid airport code. Use 3-letter codes like LHR, JFK." },
        { status: 400 }
      );
    }

    console.log("Searching flights:", { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      adults,
      children,
      infants,
      travelClass
    });

    const results = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to search flights" },
      { status: 500 }
    );
  }
}
