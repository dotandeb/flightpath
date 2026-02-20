import { NextRequest, NextResponse } from "next/server";
import { optimizeFlights, SearchParams } from "@/app/lib/flight-engine";

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
      travelClass = "ECONOMY",
      flexibleDates = false,
    } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, departureDate" },
        { status: 400 }
      );
    }

    console.log("Flight optimization request:", { 
      origin, 
      destination, 
      departureDate, 
      returnDate,
      adults,
      children,
      infants,
      travelClass,
    });

    const params: SearchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      flexibleDates,
    };

    const results = await optimizeFlights(params);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Optimization error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to optimize flights" },
      { status: 500 }
    );
  }
}
