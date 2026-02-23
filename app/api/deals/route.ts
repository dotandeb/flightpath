import { NextRequest, NextResponse } from "next/server";
import { getDealsWithArbitrage, getSampleDeals } from "@/app/lib/deal-scraper";

/**
 * GET /api/deals
 * Get flight deals from deal sites + run arbitrage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin") || undefined;
    const destination = searchParams.get("destination") || undefined;
    const useSample = searchParams.get("sample") === "true";

    if (useSample) {
      // Return sample deals for testing
      const sampleDeals = getSampleDeals();
      return NextResponse.json({
        deals: sampleDeals,
        arbitrageResults: [],
        metadata: {
          sourcesChecked: ["sample"],
          dealsFound: sampleDeals.length,
          arbitrageRuns: 0,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get real deals + arbitrage
    const result = await getDealsWithArbitrage(origin, destination);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Deals API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
