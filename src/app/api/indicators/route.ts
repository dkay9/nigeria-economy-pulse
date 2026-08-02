// =============================================================================
// GET /api/indicators?id=inflation_cpi&period=5Y
// =============================================================================
// Returns a normalized IndicatorSeries for any registered indicator.
// Query params:
//   id     — indicator ID (required), e.g. "inflation_cpi", "gdp_growth"
//   period — optional time filter: "1Y" | "3Y" | "5Y" | "10Y"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSeries } from "@/lib/data-fetcher";
import { INDICATORS } from "@/lib/world-bank";
import type { ApiResponse, IndicatorSeries, TimePeriod } from "@/types/indicators";

export const revalidate = 86400; // ISR: revalidate every 24 hours

const VALID_PERIODS = new Set(["1Y", "3Y", "5Y", "10Y"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const period = searchParams.get("period");

  // Validate indicator ID
  if (!id || !INDICATORS[id]) {
    const available = Object.keys(INDICATORS).join(", ");
    return NextResponse.json<ApiResponse<null>>(
      {
        ok: false,
        data: null,
        error: `Invalid or missing indicator ID. Available: ${available}`,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // Validate period if provided
  if (period && !VALID_PERIODS.has(period)) {
    return NextResponse.json<ApiResponse<null>>(
      {
        ok: false,
        data: null,
        error: `Invalid period. Must be one of: 1Y, 3Y, 5Y, 10Y`,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  try {
    const series = await fetchIndicatorSeries(
      id,
      period as TimePeriod | undefined
    );

    return NextResponse.json<ApiResponse<IndicatorSeries>>({
      ok: true,
      data: series,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[/api/indicators] Error fetching ${id}:`, err);
    return NextResponse.json<ApiResponse<null>>(
      {
        ok: false,
        data: null,
        error: `Failed to fetch indicator data. The upstream source may be unavailable.`,
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
