// =============================================================================
// World Bank Indicators API Client
// =============================================================================
// Fetches macroeconomic data for Nigeria from the World Bank v2 API.
//
// API docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581
// No API key required. Returns JSON. Rate limits are generous.
//
// Response format (JSON):
// [
//   { page: 1, pages: 1, per_page: 500, total: 30, ... },  // metadata
//   [ { indicator: {...}, country: {...}, date: "2023", value: 25.8 }, ... ]
// ]
// =============================================================================

import type {
  IndicatorSeries,
  TimeSeriesPoint,
  DataSource,
  MetricSummary,
} from "@/types/indicators";
import { fetchWithTimeout } from "./fetch-utils";

// ---------------------------------------------------------------------------
// Indicator registry — maps our internal IDs to World Bank indicator codes
// ---------------------------------------------------------------------------

export interface IndicatorConfig {
  /** Our internal ID */
  id: string;
  /** World Bank indicator code */
  wbCode: string;
  /** Display label */
  label: string;
  /** Unit string */
  unit: string;
  /** For metric cards: is an increase "good" or "bad"? */
  positiveDirection: "up" | "down";
}

export const INDICATORS: Record<string, IndicatorConfig> = {
  gdp_growth: {
    id: "gdp_growth",
    wbCode: "NY.GDP.MKTP.KD.ZG",
    label: "GDP Growth",
    unit: "%",
    positiveDirection: "up",
  },
  inflation_cpi: {
    id: "inflation_cpi",
    wbCode: "FP.CPI.TOTL.ZG",
    label: "Inflation (CPI)",
    unit: "%",
    positiveDirection: "down",
  },
  unemployment: {
    id: "unemployment",
    wbCode: "SL.UEM.TOTL.ZS",
    label: "Unemployment",
    unit: "%",
    positiveDirection: "down",
  },
  exchange_rate: {
    id: "exchange_rate",
    wbCode: "PA.NUS.FCRF",
    label: "Exchange Rate",
    unit: "NGN/USD",
    positiveDirection: "down",
  },
  gdp_current_usd: {
    id: "gdp_current_usd",
    wbCode: "NY.GDP.MKTP.CD",
    label: "GDP (Current USD)",
    unit: "USD",
    positiveDirection: "up",
  },
  population: {
    id: "population",
    wbCode: "SP.POP.TOTL",
    label: "Population",
    unit: "people",
    positiveDirection: "up",
  },
  trade_balance: {
    id: "trade_balance",
    // External balance on goods and services (% of GDP)
    wbCode: "NE.RSB.GNFS.ZS",
    label: "Trade Balance",
    unit: "% of GDP",
    positiveDirection: "up",
  },
  oil_rents: {
    id: "oil_rents",
    wbCode: "NY.GDP.PETR.RT.ZS",
    label: "Oil Rents",
    unit: "% of GDP",
    positiveDirection: "up",
  },
} as const;

// ---------------------------------------------------------------------------
// Raw World Bank API response types
// ---------------------------------------------------------------------------

interface WBMetaPage {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid: string;
  lastupdated: string;
}

interface WBDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

type WBApiResponse = [WBMetaPage, WBDataPoint[] | null];

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const WB_BASE = "https://api.worldbank.org/v2";

const worldBankSource = (lastUpdated: string): DataSource => ({
  name: "world_bank",
  attribution: "World Bank Open Data (World Development Indicators)",
  url: "https://data.worldbank.org/country/nigeria",
  snapshotDate: lastUpdated,
});

/**
 * Fetch a single indicator's time series for Nigeria.
 *
 * @param wbCode  World Bank indicator code (e.g. "FP.CPI.TOTL.ZG")
 * @param years   How many years of data to request (default 20)
 */
export async function fetchWorldBankIndicator(
  wbCode: string,
  years: number = 20
): Promise<{ meta: WBMetaPage; points: WBDataPoint[] }> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years;

  const url =
    `${WB_BASE}/country/NGA/indicator/${wbCode}` +
    `?format=json&per_page=500&date=${startYear}:${currentYear}`;

  const res = await fetchWithTimeout(url, {
    timeoutMs: 15000,
    retries: 1,
    init: { next: { revalidate: 86400 } }, // ISR: 24h
  });
  if (!res.ok) {
    throw new Error(
      `World Bank API error: ${res.status} ${res.statusText} for ${wbCode}`
    );
  }

  const json: WBApiResponse = await res.json();
  const [meta, data] = json;

  if (!data || data.length === 0) {
    return { meta, points: [] };
  }

  return { meta, points: data };
}

/**
 * Fetch and normalize a single indicator into our IndicatorSeries format.
 */
export async function getIndicatorSeries(
  indicatorId: string,
  years: number = 20
): Promise<IndicatorSeries> {
  const config = INDICATORS[indicatorId];
  if (!config) {
    throw new Error(`Unknown indicator: ${indicatorId}`);
  }

  const { meta, points } = await fetchWorldBankIndicator(config.wbCode, years);

  // Normalize and sort chronologically (oldest first)
  const data: TimeSeriesPoint[] = points
    .map((p) => ({
      date: p.date,
      value: p.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    id: config.id,
    label: config.label,
    unit: config.unit,
    source: worldBankSource(meta.lastupdated),
    lastUpdated: meta.lastupdated,
    data,
  };
}

/**
 * Build a MetricSummary from a fetched IndicatorSeries.
 * Picks the most recent non-null value as "current" and the one before as
 * "previous" for delta calculation.
 */
export function toMetricSummary(
  series: IndicatorSeries,
  config: IndicatorConfig
): MetricSummary {
  // Filter to only non-null values
  const nonNull = series.data.filter(
    (d): d is TimeSeriesPoint & { value: number } => d.value !== null
  );

  const latest = nonNull.at(-1) ?? null;
  const previous = nonNull.at(-2) ?? null;

  return {
    id: config.id,
    label: config.label,
    value: latest?.value ?? null,
    previousValue: previous?.value ?? null,
    unit: config.unit,
    positiveDirection: config.positiveDirection,
    period: latest?.date ?? "N/A",
    source: series.source,
  };
}

/**
 * Fetch all four headline metrics in parallel.
 */
export async function getHeadlineMetrics(): Promise<MetricSummary[]> {
  const headlineIds = [
    "gdp_growth",
    "inflation_cpi",
    "exchange_rate",
    "unemployment",
  ];

  const results = await Promise.allSettled(
    headlineIds.map(async (id) => {
      const series = await getIndicatorSeries(id, 5);
      return toMetricSummary(series, INDICATORS[id]);
    })
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    // Return a graceful fallback for failed fetches
    const config = INDICATORS[headlineIds[i]];
    console.error(`Failed to fetch ${config.id}:`, r.reason);
    return {
      id: config.id,
      label: config.label,
      value: null,
      previousValue: null,
      unit: config.unit,
      positiveDirection: config.positiveDirection,
      period: "N/A",
      source: {
        name: "world_bank" as const,
        attribution: "World Bank (fetch failed)",
      },
    };
  });
}