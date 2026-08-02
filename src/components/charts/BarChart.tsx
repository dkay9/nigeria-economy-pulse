"use client";

import { useEffect } from "react";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { transition } from "d3-transition";
import type { SectorContribution } from "@/types/indicators";
import { SECTOR_COLORS, COLORS, DEFAULT_MARGIN, TRANSITIONS } from "@/lib/d3-theme";
import ChartContainer from "./ChartContainer";
import { useTooltip } from "./useTooltip";

void transition;

interface BarChartProps {
  data: SectorContribution[];
  /** Period label shown in tooltip */
  period?: string;
}

export default function BarChart({ data, period }: BarChartProps) {
  return (
    <ChartContainer aspectRatio={0.55} minHeight={280} maxHeight={460}>
      {(dims, svgRef) => (
        <BarChartInner
          data={data}
          period={period}
          width={dims.width}
          height={dims.height}
          svgRef={svgRef}
        />
      )}
    </ChartContainer>
  );
}

interface InnerProps {
  data: SectorContribution[];
  period?: string;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

function BarChartInner({ data, period, width, height, svgRef }: InnerProps) {
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width === 0 || data.length === 0) return;

    const margin = { top: 16, right: 20, bottom: 80, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Sort by percentage descending
    const sorted = [...data].sort((a, b) => b.percentage - a.percentage);

    // Scales
    const xScale = scaleBand()
      .domain(sorted.map((d) => d.sector))
      .range([0, innerW])
      .padding(0.25);

    const yScale = scaleLinear()
      .domain([0, Math.max(...sorted.map((d) => d.percentage)) * 1.1])
      .range([innerH, 0])
      .nice();

    const colorScale = scaleOrdinal<string>()
      .domain(sorted.map((d) => d.sector))
      .range(SECTOR_COLORS as unknown as string[]);

    // Build SVG
    const root = select(svg);
    root.selectAll("*").remove();
    root.attr("width", width).attr("height", height);

    const g = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid
    g.append("g")
      .attr("class", "chart-grid")
      .call(
        axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat(() => "")
      );

    // Bars — enter with height 0, transition to full height
    g.selectAll(".bar")
      .data(sorted)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.sector)!)
      .attr("width", xScale.bandwidth())
      .attr("y", innerH) // start at bottom
      .attr("height", 0) // start with no height
      .attr("fill", (d) => colorScale(d.sector))
      .attr("rx", 3)
      .on("mouseover", (event: MouseEvent, d: SectorContribution) => {
        select(event.currentTarget as Element)
          .transition()
          .duration(TRANSITIONS.hoverDuration)
          .attr("opacity", 0.8);

        showTooltip({
          label: d.sector,
          value: `${d.percentage.toFixed(1)}% of GDP`,
          delta: period,
        });
      })
      .on("mousemove", (event: MouseEvent) => {
        moveTooltip(event.clientX, event.clientY);
      })
      .on("mouseout", (event: MouseEvent) => {
        select(event.currentTarget as Element)
          .transition()
          .duration(TRANSITIONS.hoverDuration)
          .attr("opacity", 1);
        hideTooltip();
      })
      // Animate bars growing
      .transition()
      .duration(TRANSITIONS.duration)
      .delay((_, i) => i * TRANSITIONS.staggerDelay)
      .attr("y", (d) => yScale(d.percentage))
      .attr("height", (d) => innerH - yScale(d.percentage));

    // X axis with rotated labels
    g.append("g")
      .attr("class", "chart-axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(axisBottom(xScale).tickSize(0))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em")
      .style("font-size", "11px");

    // Y axis
    g.append("g")
      .attr("class", "chart-axis")
      .call(
        axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      );
  }, [data, period, width, height, svgRef, showTooltip, moveTooltip, hideTooltip]);

  return (
    <svg
      ref={svgRef}
      className="block"
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}