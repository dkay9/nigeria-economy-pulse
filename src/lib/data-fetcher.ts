import {
  getIndicatorSeries,
  getHeadlineMetrics,
  INDICATORS,
} from "./world-bank";
import {
  getSectorBreakdown,
  getAvailableSectorPeriods,
  STATE_DATASETS,
} from "@/data/static-datasets";
import type {
  IndicatorSeries,
  MetricSummary,
  SectorBreakdown,
  StateDataset,
  TimePeriod,
} from "@/types/indicators";
import { TIME_PERIOD_YEARS } from "@/types/indicators";

// ---------------------------------------------------------------------------
// Time-period filtering helper
// ---------------------------------------------------------------------------

/**
 * Slice an IndicatorSeries to only include data within the given period.
 * Returns a new object (does not mutate the original).
 */
export function filterByPeriod(
  series: IndicatorSeries,
  period: TimePeriod
): IndicatorSeries {
  const years = TIME_PERIOD_YEARS[period];
  const cutoffYear = new Date().getFullYear() - years;

  return {
    ...series,
    data: series.data.filter((d) => {
      const year = parseInt(d.date.slice(0, 4), 10);
      return year >= cutoffYear;
    }),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch headline metrics (GDP growth, inflation, exchange rate, unemployment).
 * Used by the metric summary cards.
 */
export async function fetchHeadlineMetrics(): Promise<MetricSummary[]> {
  try {
    return await getHeadlineMetrics();
  } catch (err) {
    console.error("Failed to fetch headline metrics:", err);
    // Return empty placeholders so the UI can show "data unavailable"
    return Object.values(INDICATORS)
      .filter((i) =>
        ["gdp_growth", "inflation_cpi", "exchange_rate", "unemployment"].includes(
          i.id
        )
      )
      .map((config) => ({
        id: config.id,
        label: config.label,
        value: null,
        previousValue: null,
        unit: config.unit,
        positiveDirection: config.positiveDirection,
        period: "N/A",
        source: {
          name: "world_bank" as const,
          attribution: "Data unavailable",
        },
      }));
  }
}

/**
 * Fetch a single indicator time series, optionally filtered by period.
 */
export async function fetchIndicatorSeries(
  indicatorId: string,
  period?: TimePeriod
): Promise<IndicatorSeries> {
  // Always fetch a wide range, then slice client-side for instant period switching
  const maxYears = 20;
  const series = await getIndicatorSeries(indicatorId, maxYears);

  if (period) {
    return filterByPeriod(series, period);
  }
  return series;
}

/**
 * Get GDP by sector breakdown for a given year.
 * This comes from static data (NBS reports).
 */
export function fetchSectorBreakdown(
  year?: string
): SectorBreakdown | undefined {
  const periods = getAvailableSectorPeriods();
  const targetYear = year ?? periods[0]; // default to most recent
  return getSectorBreakdown(targetYear);
}

/**
 * Get available years for sector breakdown data.
 */
export function fetchSectorPeriods(): string[] {
  return getAvailableSectorPeriods();
}

/**
 * Get state-level data for a given metric.
 */
export function fetchStateData(
  metricId: string = "gdp_contribution"
): StateDataset | undefined {
  return STATE_DATASETS[metricId];
}

/**
 * List available state-level metrics (for the indicator switcher).
 */
export function getAvailableStateMetrics(): Array<{
  id: string;
  label: string;
}> {
  return Object.entries(STATE_DATASETS).map(([id, dataset]) => ({
    id,
    label: dataset.label,
  }));
}

/**
 * Fetch multiple indicator series in parallel (for comparison views).
 */
export async function fetchMultipleIndicators(
  indicatorIds: string[],
  period?: TimePeriod
): Promise<IndicatorSeries[]> {
  const results = await Promise.allSettled(
    indicatorIds.map((id) => fetchIndicatorSeries(id, period))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<IndicatorSeries> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);
}
