"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  MetricSummary,
  IndicatorSeries,
  SectorBreakdown,
  TimePeriod,
} from "@/types/indicators";
import MetricCard from "./ui/MetricCard";
import TimePeriodToggle from "./ui/TimePeriodToggle";
import LineChart from "./charts/LineChart";
import BarChart from "./charts/BarChart";
import StateSection from "./charts/StateSection";
import { COLORS } from "@/lib/d3-theme";
import { filterByPeriod } from "@/lib/data-fetcher";

interface DashboardData {
  metrics: MetricSummary[];
  inflation: IndicatorSeries | null;
  exchangeRate: IndicatorSeries | null;
  sectorBreakdown: SectorBreakdown | null;
  sectorPeriods: string[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>("5Y");
  const [selectedSectorYear, setSelectedSectorYear] = useState<string>("");

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Fetch in parallel
        const [metricsRes, inflationRes, fxRes, sectorRes, periodsRes] =
          await Promise.all([
            fetch("/api/indicators?id=gdp_growth").then(async () => {
              // Fetch all four headline metrics
              const ids = [
                "gdp_growth",
                "inflation_cpi",
                "exchange_rate",
                "unemployment",
              ];
              const results = await Promise.allSettled(
                ids.map((id) =>
                  fetch(`/api/indicators?id=${id}`).then((r) => r.json())
                )
              );

              return results.map((r, i) => {
                if (r.status === "fulfilled" && r.value.ok) {
                  const series = r.value.data as IndicatorSeries;
                  const nonNull = series.data.filter(
                    (d: { value: number | null }) => d.value !== null
                  );
                  const latest = nonNull.at(-1);
                  const previous = nonNull.at(-2);

                  const configs: Record<
                    string,
                    { positiveDirection: "up" | "down" }
                  > = {
                    gdp_growth: { positiveDirection: "up" },
                    inflation_cpi: { positiveDirection: "down" },
                    exchange_rate: { positiveDirection: "down" },
                    unemployment: { positiveDirection: "down" },
                  };

                  return {
                    id: series.id,
                    label: series.label,
                    value: latest?.value ?? null,
                    previousValue: previous?.value ?? null,
                    unit: series.unit,
                    positiveDirection: configs[ids[i]]?.positiveDirection ?? "up",
                    period: latest?.date ?? "N/A",
                    source: series.source,
                  } as MetricSummary;
                }
                return {
                  id: ids[i],
                  label: ids[i],
                  value: null,
                  previousValue: null,
                  unit: "",
                  positiveDirection: "up" as const,
                  period: "N/A",
                  source: {
                    name: "world_bank" as const,
                    attribution: "Failed to load",
                  },
                };
              });
            }),
            fetch("/api/indicators?id=inflation_cpi").then((r) => r.json()),
            fetch("/api/indicators?id=exchange_rate").then((r) => r.json()),
            // Sector data comes from static import, not API
            import("@/data/static-datasets").then((m) =>
              m.getSectorBreakdown("2023")
            ),
            import("@/data/static-datasets").then((m) =>
              m.getAvailableSectorPeriods()
            ),
          ]);

        setData({
          metrics: metricsRes as MetricSummary[],
          inflation: inflationRes.ok ? inflationRes.data : null,
          exchangeRate: fxRes.ok ? fxRes.data : null,
          sectorBreakdown: sectorRes ?? null,
          sectorPeriods: periodsRes,
        });

        if (periodsRes.length > 0 && !selectedSectorYear) {
          setSelectedSectorYear(periodsRes[0]);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Handle sector year change
  const handleSectorYearChange = useCallback(
    async (year: string) => {
      setSelectedSectorYear(year);
      const mod = await import("@/data/static-datasets");
      const breakdown = mod.getSectorBreakdown(year);
      if (breakdown && data) {
        setData({ ...data, sectorBreakdown: breakdown });
      }
    },
    [data]
  );

  // Period-filtered series (computed, not fetched again)
  const filteredInflation =
    data?.inflation ? filterByPeriod(data.inflation, period) : null;
  const filteredFx =
    data?.exchangeRate ? filterByPeriod(data.exchangeRate, period) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">
            Loading economic data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-800 font-medium">Data Load Error</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
          Nigeria Economic Pulse
        </h1>
        <p className="text-sm text-slate-500">
          Key macroeconomic indicators · Source: World Bank, NBS, CBN
        </p>
      </header>

      {/* Metric Cards */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </div>
      </section>

      {/* Period toggle — shared across line charts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display text-slate-800">
          Trends
        </h2>
        <TimePeriodToggle selected={period} onChange={setPeriod} />
      </div>

      {/* Line Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflation */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                Inflation (CPI, Annual %)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consumer price index, year-over-year
              </p>
            </div>
          </div>
          {filteredInflation &&
          filteredInflation.data.some((d) => d.value !== null) ? (
            <LineChart
              series={filteredInflation}
              color={COLORS.amber[700]}
              fillColor={COLORS.amber[100]}
            />
          ) : (
            <EmptyState message="No inflation data available for this period" />
          )}
          {filteredInflation && (
            <SourceAttribution source={filteredInflation.source} />
          )}
        </div>

        {/* Exchange Rate */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                Exchange Rate (NGN/USD)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official rate · Parallel market rate may differ
              </p>
            </div>
          </div>
          {filteredFx && filteredFx.data.some((d) => d.value !== null) ? (
            <LineChart
              series={filteredFx}
              color={COLORS.blue[700]}
              fillColor={COLORS.blue[100]}
            />
          ) : (
            <EmptyState message="No exchange rate data available for this period" />
          )}
          {filteredFx && <SourceAttribution source={filteredFx.source} />}
        </div>
      </section>

      {/* GDP by Sector */}
      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              GDP Contribution by Sector
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Share of real GDP by activity sector
            </p>
          </div>
          {data.sectorPeriods.length > 1 && (
            <select
              value={selectedSectorYear}
              onChange={(e) => handleSectorYearChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white"
            >
              {data.sectorPeriods.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
        {data.sectorBreakdown ? (
          <BarChart
            data={data.sectorBreakdown.data}
            period={data.sectorBreakdown.period}
          />
        ) : (
          <EmptyState message="No sector data available" />
        )}
        {data.sectorBreakdown && (
          <SourceAttribution source={data.sectorBreakdown.source} />
        )}
      </section>

      {/* State-Level Choropleth */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display text-slate-800">
          States
        </h2>
      </div>
      <StateSection />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
        <p>
          Data sources: World Bank Open Data, National Bureau of Statistics
          (Nigeria), Central Bank of Nigeria
        </p>
        <p className="mt-1">
          Static data snapshots may not reflect the latest releases. Check
          source dates on each chart.
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 bg-slate-50 rounded-md">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

function SourceAttribution({
  source,
}: {
  source: { attribution: string; snapshotDate?: string };
}) {
  return (
    <div className="mt-3 text-[10px] text-slate-300 flex items-center gap-2">
      <span>Source: {source.attribution}</span>
      {source.snapshotDate && (
        <span>· Data as of {source.snapshotDate}</span>
      )}
    </div>
  );
}