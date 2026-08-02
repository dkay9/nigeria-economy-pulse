# Nigeria Economic Pulse

Interactive economic data dashboard for Nigeria, built with D3.js and Next.js.

## Data Sources

| Source | Access Method | Coverage | Update Frequency |
|--------|--------------|----------|-----------------|
| **World Bank API** | REST API (no key) | GDP, inflation, exchange rate, unemployment, trade balance, oil rents | ~Annual (lags 1-2 years) |
| **NBS (static)** | Curated JSON snapshots | GDP by sector, state-level GDP contribution, poverty rates | Manual (from NBS reports) |
| **CBN (static)** | Curated JSON snapshots | Supplementary data if needed | Manual (from CBN bulletins) |
| **geoBoundaries** | Downloaded GeoJSON | Nigeria state polygons (36 + FCT) | Static (boundaries stable) |

### Important Data Caveats

- **World Bank data typically lags 1-2 years.** The most recent data point may be from 2023 or 2024, not the current year. The dashboard displays the actual period for each metric.
- **State-level GDP figures are estimates.** Nigeria does not publish official state GDP annually. The figures in `static-datasets.ts` are compiled from various NBS publications and should be treated as indicative.
- **Poverty data is from the 2022 NBS survey.** Methodology and coverage vary between surveys.
- **Static data must be manually updated** when NBS/CBN publish new reports. Check `snapshotDate` in each dataset.

## Setup

```bash
# Install dependencies
npm install

# Download GeoJSON (runs automatically via postinstall, or manually):
npm run setup:geo

# Start dev server
npm run dev
```

## Architecture

```
src/
├── app/
│   └── api/
│       ├── indicators/route.ts   # World Bank proxy + normalization
│       └── geo/route.ts          # GeoJSON server
├── lib/
│   ├── world-bank.ts             # World Bank API client
│   ├── data-fetcher.ts           # Unified data layer (source priority)
│   └── d3-theme.ts               # Shared D3 visual constants
├── data/
│   └── static-datasets.ts        # NBS/CBN curated snapshots
├── types/
│   └── indicators.ts             # TypeScript interfaces
└── components/                   # D3 chart components (Phase 2+)

public/
└── geo/
    ├── nigeria-states.geojson    # geoBoundaries ADM1 (downloaded)
    └── ATTRIBUTION.md            # License info
```

### Data Flow

```
World Bank API ──→ world-bank.ts ──→ data-fetcher.ts ──→ /api/indicators ──→ Chart Components
NBS/CBN reports ──→ static-datasets.ts ─────────────────→ data-fetcher.ts ──→ Chart Components
geoBoundaries ──→ public/geo/ ──→ /api/geo ──→ Choropleth Map Component
```

### Design Decisions

1. **World Bank as primary source**: It's the only source with a reliable, no-auth REST API. CBN and NBS both require manual data extraction.

2. **Static data for state-level and sector data**: The World Bank doesn't break Nigeria's GDP by sector or by state. These come from NBS reports that are published as PDFs/Excel files.

3. **D3 renders into React refs**: React owns state and data; D3 owns the SVG DOM. This avoids the common pitfall of D3 and React fighting over the DOM.

4. **ISR (24h revalidation) on API routes**: World Bank data updates at most monthly, so daily revalidation is more than sufficient and keeps the dashboard fast.

5. **GeoJSON downloaded at build time**: Rather than fetching at runtime, we download once during setup. State boundaries don't change.

## License & Attribution

- Dashboard code: MIT
- GeoJSON data: CC-BY 4.0 (geoBoundaries, Runfola et al., 2020)
- Economic data: World Bank Open Data (CC-BY 4.0), NBS Nigeria (public domain)