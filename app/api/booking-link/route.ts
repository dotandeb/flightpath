import { NextRequest, NextResponse } from "next/server";
import { TravelpayoutsAPI } from "@/app/lib/travelpayouts-api";

// ============================================
// BOOKING LINK API
// ============================================
// Generates affiliate booking links when user clicks "Book"
// REQUIRED: Only call this on user action (API terms)

const TP_API_TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { resultsUrl, searchId, proposalId } = await request.json();

    if (!resultsUrl || !searchId || !proposalId) {
      return NextResponse.json(
        { error: "Missing required fields: resultsUrl, searchId, proposalId" },
        { status: 400 }
      );
    }

    // If no API token, return sample booking URL
    if (!TP_API_TOKEN) {
      console.log("[Booking] Sample mode - returning demo URL");
      return NextResponse.json({
        url: `https://www.skyscanner.net/transport/flights/?utm_source=flightpath&utm_medium=affiliate&utm_campaign=705007`,
        gate_id: 0,
        agent_id: 0,
        click_id: 0,
        expire_at_unix_sec: Math.floor(Date.now() / 1000) + 900,
        _note: "SAMPLE MODE - Real links when API approved",
      });
    }

    // Generate real booking link
    const tpApi = new TravelpayoutsAPI(TP_API_TOKEN);
    const bookingData = await tpApi.getBookingLink(resultsUrl, searchId, proposalId);

    console.log(`[Booking] Generated link for gate ${bookingData.gate_id}`);

    return NextResponse.json(bookingData);

  } catch (error: any) {
    console.error("[Booking] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate booking link", message: error.message },
      { status: 500 }
    );
  }
}
