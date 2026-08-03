"use client";

import type { MetricSummary } from "@/types/indicators";

interface MetricCardProps {
  metric: MetricSummary;
}

export default function MetricCard({ metric }: MetricCardProps) {
  const { label, value, previousValue, unit, positiveDirection, period, source } =
    metric;

  // Calculate delta
  const hasDelta =
    value !== null && previousValue !== null && previousValue !== 0;
  const delta = hasDelta ? value! - previousValue! : null;
  const deltaPercent =
    hasDelta && previousValue
      ? ((value! - previousValue) / Math.abs(previousValue)) * 100
      : null;

  // Determine if delta is "good" or "bad" based on positiveDirection
  const isPositiveDelta = delta !== null && delta >= 0;
  const isGood =
    positiveDirection === "up" ? isPositiveDelta : !isPositiveDelta;

  // Format the main value
  const formattedValue =
    value === null
      ? "N/A"
      : unit === "%"
        ? `${value.toFixed(1)}%`
        : unit === "NGN/USD"
          ? `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
          : value.toLocaleString("en-NG", { maximumFractionDigits: 1 });

  // Format delta
  const formattedDelta =
    delta !== null
      ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}${unit === "%" ? "pp" : ""}`
      : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
        {label}
      </span>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-semibold font-display tabular-nums tracking-tight">
          {formattedValue}
        </span>

        {formattedDelta && (
          <span
            className={`text-sm font-medium tabular-nums ${
              isGood ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formattedDelta}
            <span className="ml-0.5 text-[10px]">
              {isPositiveDelta ? "↑" : "↓"}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-400">{period}</span>
        <span className="text-[10px] text-slate-300 truncate ml-2">
          {source.name === "world_bank"
            ? "World Bank"
            : source.name === "nbs"
              ? "NBS"
              : source.attribution}
        </span>
      </div>
    </div>
  );
}