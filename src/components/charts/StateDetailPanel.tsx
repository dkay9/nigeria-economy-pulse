"use client";

import { useMemo } from "react";
import type { StateDataset } from "@/types/indicators";
import { canonicalStateName } from "@/lib/state-names";

interface StateDetailPanelProps {
  /** Canonical name of the selected state, or null */
  selectedState: string | null;
  /** All available state datasets, so we can show every metric for the state */
  datasets: StateDataset[];
  onClose: () => void;
}

export default function StateDetailPanel({
  selectedState,
  datasets,
  onClose,
}: StateDetailPanelProps) {
  const stateMetrics = useMemo(() => {
    if (!selectedState) return [];
    return datasets.map((ds) => {
      const match = ds.states.find(
        (s) => canonicalStateName(s.stateName) === selectedState
      );
      // Compute rank (1 = highest value)
      const ranked = [...ds.states]
        .filter((s) => s.value !== null)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      const rank =
        match && match.value !== null
          ? ranked.findIndex(
              (s) => canonicalStateName(s.stateName) === selectedState
            ) + 1
          : null;

      return {
        label: ds.label,
        unit: ds.unit,
        value: match?.value ?? null,
        rank,
        total: ranked.length,
        period: ds.period,
      };
    });
  }, [selectedState, datasets]);

  if (!selectedState) {
    return (
      <div className="bg-slate-50 rounded-lg border border-dashed border-slate-200 p-6 h-full flex items-center justify-center">
        <p className="text-sm text-slate-400 text-center">
          Click a state on the map to see its detailed breakdown
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold font-display text-slate-900">
            {selectedState}
          </h3>
          <p className="text-xs text-slate-400">State breakdown</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {stateMetrics.map((m) => (
          <div
            key={m.label}
            className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {m.label}
              </span>
              {m.rank && (
                <span className="text-[11px] text-slate-400">
                  Rank {m.rank}/{m.total}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums text-slate-900">
                {m.value === null
                  ? "N/A"
                  : `${m.value.toFixed(1)}${m.unit === "%" ? "%" : ` ${m.unit}`}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-300">{m.period}</span>
          </div>
        ))}
      </div>
    </div>
  );
}