// =============================================================================
// Nigeria Economic Pulse — Core Data Types
// =============================================================================
// Every chart component consumes these types. The data layer (API routes +
// fetchers) is responsible for normalizing all sources into these shapes.
// Charts never see raw World Bank / CBN / NBS response formats.
// =============================================================================

/** A single time-series data point, used by line charts and trend displays. */
export interface TimeSeriesPoint {
  /** ISO date string — year-only ("2023") or full ("2023-06-30") */
  date: string;
  /** The numeric value. null means the source reported no data for this period. */
  value: number | null;
}

/** A complete time series for one indicator. */
export interface IndicatorSeries {
  /** Machine-readable indicator ID, e.g. "inflation_cpi" or "gdp_growth" */
  id: string;
  /** Human-readable label, e.g. "Inflation (CPI, annual %)" */
  label: string;
  /** Unit description, e.g. "%", "NGN/USD", "₦ Billion" */
  unit: string;
  /** Original data source for attribution */
  source: DataSource;
  /** ISO timestamp when this data was last fetched or updated */
  lastUpdated: string;
  /** The actual data points, sorted chronologically (oldest first) */
  data: TimeSeriesPoint[];
}

/** Identifies where a piece of data came from. */
export interface DataSource {
  name: "world_bank" | "cbn" | "nbs" | "static";
  /** Human-readable attribution string */
  attribution: string;
  /** URL to the original source, if linkable */
  url?: string;
  /** If static/manual data, the reference date of the snapshot */
  snapshotDate?: string;
}

// ---------------------------------------------------------------------------
// Summary / metric card types
// ---------------------------------------------------------------------------

/** A single headline metric for the summary cards row. */
export interface MetricSummary {
  id: string;
  label: string;
  /** The current (most recent) value */
  value: number | null;
  /** The previous period's value, for delta calculation */
  previousValue: number | null;
  /** Unit string, e.g. "%", "₦/USD" */
  unit: string;
  /** Direction of "good" — is UP good (like GDP growth) or bad (like inflation)? */
  positiveDirection: "up" | "down";
  /** Period label for the current value, e.g. "2023" or "Q3 2024" */
  period: string;
  source: DataSource;
}

// ---------------------------------------------------------------------------
// Sector breakdown (GDP by sector bar chart)
// ---------------------------------------------------------------------------

/** A single sector's contribution. */
export interface SectorContribution {
  /** Sector name, e.g. "Agriculture", "Oil & Gas", "Services" */
  sector: string;
  /** Percentage contribution to GDP */
  percentage: number;
  /** Absolute value in local currency (₦ Billion), if available */
  absoluteValue?: number;
}

/** GDP breakdown by sector for a given period. */
export interface SectorBreakdown {
  period: string;
  data: SectorContribution[];
  source: DataSource;
}

// ---------------------------------------------------------------------------
// State-level data (choropleth + ranking bars)
// ---------------------------------------------------------------------------

/** Per-state data for a single metric. */
export interface StateMetric {
  /** State name — must match GeoJSON property for join */
  stateName: string;
  /** The value for this metric */
  value: number | null;
}

/** A complete state-level dataset for one indicator. */
export interface StateDataset {
  /** Which metric this represents, e.g. "gdp_contribution", "poverty_rate" */
  metricId: string;
  label: string;
  unit: string;
  period: string;
  states: StateMetric[];
  source: DataSource;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

/** Standard envelope for all API route responses. */
export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error?: string;
  /** ISO timestamp of when the response was generated */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Time period filter (shared across all charts)
// ---------------------------------------------------------------------------

export type TimePeriod = "1Y" | "3Y" | "5Y" | "10Y";

/** Maps a TimePeriod to the number of years to look back from the present. */
export const TIME_PERIOD_YEARS: Record<TimePeriod, number> = {
  "1Y": 1,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
};
