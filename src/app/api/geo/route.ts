// =============================================================================
// GET /api/geo?level=adm1
// =============================================================================
// Serves Nigeria GeoJSON boundary data.
//
// Currently serves from a local file in public/geo/ that should be downloaded
// from geoBoundaries during setup (see setup instructions in README).
//
// The GeoJSON source is:
//   geoBoundaries-NGA-ADM1_simplified.geojson
//   License: CC-BY 4.0 (Creative Commons Attribution 4.0)
//   Source: https://www.geoboundaries.org
//   Attribution: geoBoundaries (Runfola et al., 2020)
//
// We serve this through an API route rather than as a static file so we can:
//   1. Add cache headers
//   2. Potentially slim down properties we don't need
//   3. Swap the source without changing frontend code
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { ApiResponse } from "@/types/indicators";

export const revalidate = false; // Static — never revalidates (geo boundaries don't change)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level") ?? "adm1";

  if (level !== "adm1") {
    return NextResponse.json<ApiResponse<null>>(
      {
        ok: false,
        data: null,
        error: "Only level=adm1 (states) is currently supported.",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  try {
    const geoPath = path.join(
      process.cwd(),
      "public",
      "geo",
      "nigeria-states.geojson"
    );
    const raw = await readFile(geoPath, "utf-8");
    const geojson = JSON.parse(raw);

    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, max-age=604800, s-maxage=2592000",
        "Content-Type": "application/geo+json",
      },
    });
  } catch (err) {
    console.error("[/api/geo] Failed to load GeoJSON:", err);
    return NextResponse.json<ApiResponse<null>>(
      {
        ok: false,
        data: null,
        error:
          "GeoJSON file not found. Run the setup script to download Nigeria state boundaries.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}