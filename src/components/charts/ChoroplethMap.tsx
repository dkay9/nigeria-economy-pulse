"use client";

import { useEffect, useRef, useState } from "react";
import { select } from "d3-selection";
import { geoMercator, geoPath } from "d3-geo";
import { scaleSequential } from "d3-scale";
import {
  interpolateGreens,
  interpolateOrRd,
  interpolateBlues,
} from "d3-scale-chromatic";
import { extent } from "d3-array";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { StateDataset } from "@/types/indicators";
import { CHOROPLETH, COLORS } from "@/lib/d3-theme";
import { canonicalStateName, buildStateValueMap } from "@/lib/state-names";
import ChartContainer from "./ChartContainer";
import { useTooltip } from "./useTooltip";

interface ChoroplethMapProps {
  geo: FeatureCollection;
  dataset: StateDataset;
  /** Currently selected state (canonical name), or null */
  selectedState: string | null;
  /** Called when a state is clicked */
  onSelectState: (stateName: string | null) => void;
}

// Pick an interpolator based on the metric
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

export default function ChoroplethMap({
  geo,
  dataset,
  selectedState,
  onSelectState,
}: ChoroplethMapProps) {
  return (
    <ChartContainer aspectRatio={0.85} minHeight={360} maxHeight={620}>
      {(dims, svgRef) => (
        <ChoroplethInner
          geo={geo}
          dataset={dataset}
          selectedState={selectedState}
          onSelectState={onSelectState}
          width={dims.width}
          height={dims.height}
          svgRef={svgRef}
        />
      )}
    </ChartContainer>
  );
}

interface InnerProps extends ChoroplethMapProps {
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function ChoroplethInner({
  geo,
  dataset,
  selectedState,
  onSelectState,
  width,
  height,
  svgRef,
}: InnerProps) {
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip();
  // Keep the latest onSelectState in a ref so the D3 effect doesn't need it as a dep
  const onSelectRef = useRef(onSelectState);
  onSelectRef.current = onSelectState;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width === 0 || !geo.features?.length) return;

    // Build value lookup keyed by canonical state name
    const valueMap = buildStateValueMap(dataset.states);

    // Color scale
    const values = dataset.states
      .map((s) => s.value)
      .filter((v): v is number => v !== null);
    const [minV, maxV] = extent(values) as [number, number];
    const interpolator = getInterpolator(dataset.metricId);
    const colorScale = scaleSequential(interpolator).domain([
      minV * 0.9,
      maxV,
    ]);

    // Projection fitted to container
    const projection = geoMercator().fitSize([width, height], geo);
    const pathGen = geoPath(projection);

    // Build SVG
    const root = select(svg);
    root.selectAll("*").remove();
    root
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = root.append("g");

    // Draw states
    g.selectAll("path")
      .data(geo.features as Feature<Geometry>[])
      .enter()
      .append("path")
      .attr("d", pathGen)
      .attr("fill", (d) => {
        const name = canonicalStateName(
          (d.properties?.shapeName as string) ?? ""
        );
        const v = valueMap.get(name);
        return v === null || v === undefined
          ? CHOROPLETH.noDataFill
          : colorScale(v);
      })
      .attr("stroke", CHOROPLETH.strokeColor)
      .attr("stroke-width", CHOROPLETH.strokeWidth)
      .attr("cursor", "pointer")
      .attr("data-state", (d) =>
        canonicalStateName((d.properties?.shapeName as string) ?? "")
      )
      .on("mouseover", function (event: MouseEvent, d) {
        const name = canonicalStateName(
          (d.properties?.shapeName as string) ?? ""
        );
        const v = valueMap.get(name);

        select(this)
          .attr("stroke", CHOROPLETH.hoverStrokeColor)
          .attr("stroke-width", CHOROPLETH.hoverStrokeWidth)
          .raise();

        showTooltip({
          label: name,
          value:
            v === null || v === undefined
              ? "No data"
              : `${v.toFixed(1)}${dataset.unit === "%" ? "%" : ` ${dataset.unit}`}`,
          delta: dataset.label,
        });
        moveTooltip(event.clientX, event.clientY);
      })
      .on("mousemove", (event: MouseEvent) => {
        moveTooltip(event.clientX, event.clientY);
      })
      .on("mouseout", function (_event: MouseEvent, d) {
        const name = canonicalStateName(
          (d.properties?.shapeName as string) ?? ""
        );
        // Keep highlight if this is the selected state
        const isSelected = name === selectedState;
        select(this)
          .attr(
            "stroke",
            isSelected ? COLORS.slate[900] : CHOROPLETH.strokeColor
          )
          .attr(
            "stroke-width",
            isSelected
              ? CHOROPLETH.hoverStrokeWidth
              : CHOROPLETH.strokeWidth
          );
        hideTooltip();
      })
      .on("click", (_event: MouseEvent, d) => {
        const name = canonicalStateName(
          (d.properties?.shapeName as string) ?? ""
        );
        // Toggle: click selected state again to deselect
        onSelectRef.current(name === selectedState ? null : name);
      });

    // Apply persistent selection highlight
    if (selectedState) {
      g.selectAll<SVGPathElement, Feature<Geometry>>("path")
        .filter(
          (d) =>
            canonicalStateName((d.properties?.shapeName as string) ?? "") ===
            selectedState
        )
        .attr("stroke", COLORS.slate[900])
        .attr("stroke-width", CHOROPLETH.hoverStrokeWidth)
        .raise();
    }
  }, [
    geo,
    dataset,
    selectedState,
    width,
    height,
    svgRef,
    showTooltip,
    moveTooltip,
    hideTooltip,
  ]);

  return (
    <svg
      ref={svgRef}
      className="block w-full h-auto"
      style={{ maxHeight: `${height}px` }}
    />
  );
}