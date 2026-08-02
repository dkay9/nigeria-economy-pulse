"use client";

import type { TimePeriod } from "@/types/indicators";

interface TimePeriodToggleProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const PERIODS: TimePeriod[] = ["1Y", "3Y", "5Y", "10Y"];

export default function TimePeriodToggle({
  selected,
  onChange,
}: TimePeriodToggleProps) {
  return (
    <div className="inline-flex rounded-md bg-slate-100 p-0.5" role="radiogroup">
      {PERIODS.map((p) => (
        <button
          key={p}
          role="radio"
          aria-checked={selected === p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            selected === p
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}