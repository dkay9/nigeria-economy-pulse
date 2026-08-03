"use client";

import { useMemo } from "react";
import { scaleSequential } from "d3-scale";
import {
  interpolateGreens,
  interpolateOrRd,
  interpolateBlues,
} from "d3-scale-chromatic";
import type { StateDataset } from "@/types/indicators";

interface MapLegendProps {
  dataset: StateDataset;
}

function getInterpolator(metricId: string): (t: number) => string {
  switch (metricId) {
    case "gdp_contribution":
      return interpolateGreens;
    case "poverty_rate":
      return interpolateOrRd;
    default:
      return interpolateBlues;
  }
}

export default function MapLegend({ dataset }: MapLegendProps) {
  const { gradient, minLabel, maxLabel } = useMemo(() => {
    const values = dataset.states
      .map((s) => s.value)
      .filter((v): v is number => v !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const interpolator = getInterpolator(dataset.metricId);
    const scale = scaleSequential(interpolator).domain([min * 0.9, max]);

    // Build a CSS gradient from sampled stops
    const stops = Array.from({ length: 10 }, (_, i) => {
      const t = i / 9;
      return scale(min + t * (max - min));
    });

    const unit = dataset.unit === "%" ? "%" : ` ${dataset.unit}`;
    return {
      gradient: `linear-gradient(to right, ${stops.join(", ")})`,
      minLabel: `${min.toFixed(1)}${unit}`,
      maxLabel: `${max.toFixed(1)}${unit}`,
    };
  }, [dataset]);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
        {dataset.label}
      </span>
      <div
        className="h-3 rounded-full w-full border border-slate-200"
        style={{ background: gradient }}
      />
      <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}