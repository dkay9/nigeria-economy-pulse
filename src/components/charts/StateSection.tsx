"use client";

import { useState, useEffect } from "react";
import type { FeatureCollection } from "geojson";
import type { StateDataset } from "@/types/indicators";
import ChoroplethMap from "./ChoroplethMap";
import MapLegend from "./MapLegend";
import StateDetailPanel from "./StateDetailPanel";

interface StateMetricOption {
  id: string;
  label: string;
}

export default function StateSection() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [datasets, setDatasets] = useState<Record<string, StateDataset>>({});
  const [metricOptions, setMetricOptions] = useState<StateMetricOption[]>([]);
  const [activeMetric, setActiveMetric] = useState<string>("gdp_contribution");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // Fetch GeoJSON from our API route
        const geoRes = await fetch("/api/geo?level=adm1");
        if (!geoRes.ok) {
          throw new Error("GeoJSON not available. Run: npm run setup:geo");
        }
        const geoJson = (await geoRes.json()) as FeatureCollection;

        // Load static state datasets
        const mod = await import("@/data/static-datasets");
        const allDatasets = mod.STATE_DATASETS;
        const options = Object.entries(allDatasets).map(([id, ds]) => ({
          id,
          label: ds.label,
        }));

        setGeo(geoJson);
        setDatasets(allDatasets);
        setMetricOptions(options);
      } catch (err) {
        console.error("State section load error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load map data."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const activeDataset = datasets[activeMetric] ?? null;
  const allDatasetsArray = Object.values(datasets);

  if (loading) {
    return (
      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-sm text-slate-400">Loading map...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !geo || !activeDataset) {
    return (
      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="h-48 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-sm text-slate-600 font-medium">
              Map unavailable
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {error ?? "State data could not be loaded."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5">
      {/* Header + indicator switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            State-Level Data
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeDataset.period} · Click a state for details
          </p>
        </div>

        {/* Indicator switcher */}
        <div className="inline-flex rounded-md bg-slate-100 p-0.5">
          {metricOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveMetric(opt.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeMetric === opt.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + detail panel side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map takes 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <ChoroplethMap
            geo={geo}
            dataset={activeDataset}
            selectedState={selectedState}
            onSelectState={setSelectedState}
          />
          <MapLegend dataset={activeDataset} />
        </div>

        {/* Detail panel takes 1/3 */}
        <div className="lg:col-span-1">
          <StateDetailPanel
            selectedState={selectedState}
            datasets={allDatasetsArray}
            onClose={() => setSelectedState(null)}
          />
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-4 text-[10px] text-slate-300 flex flex-wrap items-center gap-2">
        <span>Source: {activeDataset.source.attribution}</span>
        {activeDataset.source.snapshotDate && (
          <span>· Data as of {activeDataset.source.snapshotDate}</span>
        )}
        <span>· Boundaries: geoBoundaries (CC-BY 4.0)</span>
      </div>
    </section>
  );
}