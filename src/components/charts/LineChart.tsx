"use client";

import { useEffect, useRef } from "react";
import { select } from "d3-selection";
import { scaleLinear, scaleTime } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { extent, bisector } from "d3-array";
import { transition } from "d3-transition";
import type { IndicatorSeries, TimeSeriesPoint } from "@/types/indicators";
import { COLORS, DEFAULT_MARGIN, TRANSITIONS, AXIS } from "@/lib/d3-theme";
import ChartContainer from "./ChartContainer";
import { useTooltip } from "./useTooltip";

// Force d3-transition side-effect registration
void transition;

interface LineChartProps {
  series: IndicatorSeries;
  /** Line color (defaults to green-700) */
  color?: string;
  /** Area fill color (defaults to green-100 with opacity) */
  fillColor?: string;
  /** Chart height aspect ratio */
  aspectRatio?: number;
}

export default function LineChart({
  series,
  color = COLORS.green[700],
  fillColor = COLORS.green[100],
  aspectRatio = 0.45,
}: LineChartProps) {
  return (
    <ChartContainer aspectRatio={aspectRatio} minHeight={240} maxHeight={400}>
      {(dims, svgRef) => (
        <LineChartInner
          series={series}
          width={dims.width}
          height={dims.height}
          svgRef={svgRef}
          color={color}
          fillColor={fillColor}
        />
      )}
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Inner component — the actual D3 rendering
// ---------------------------------------------------------------------------

interface InnerProps {
  series: IndicatorSeries;
  width: number;
  height: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  color: string;
  fillColor: string;
}

function LineChartInner({
  series,
  width,
  height,
  svgRef,
  color,
  fillColor,
}: InnerProps) {
  const { showTooltip, moveTooltip, hideTooltip } = useTooltip();
  const hoverLineRef = useRef<SVGLineElement | null>(null);
  const hoverDotRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || width === 0) return;

    // Filter out null values for drawing
    const validData = series.data.filter(
      (d): d is TimeSeriesPoint & { value: number } => d.value !== null
    );

    if (validData.length === 0) return;

    const margin = { ...DEFAULT_MARGIN };
    // More left margin if values are large
    const maxVal = Math.max(...validData.map((d) => Math.abs(d.value)));
    if (maxVal >= 1000) margin.left = 70;

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Parse dates — World Bank returns year strings like "2023"
    const parseDate = (d: string) => new Date(parseInt(d, 10), 0, 1);
    const dated = validData.map((d) => ({
      date: parseDate(d.date),
      value: d.value,
      rawDate: d.date,
    }));

    // Scales
    const xExtent = extent(dated, (d) => d.date) as [Date, Date];
    const xScale = scaleTime().domain(xExtent).range([0, innerW]);

    const [yMin, yMax] = extent(dated, (d) => d.value) as [number, number];
    const yPadding = (yMax - yMin) * 0.1 || 1;
    const yScale = scaleLinear()
      .domain([Math.min(yMin - yPadding, 0), yMax + yPadding])
      .range([innerH, 0])
      .nice();

    // Clear and build
    const root = select(svg);
    root.selectAll("*").remove();

    root
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = root
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid lines (horizontal)
    g.append("g")
      .attr("class", "chart-grid")
      .call(
        axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat(() => "")
      );

    // Area fill
    const areaGen = area<(typeof dated)[0]>()
      .x((d) => xScale(d.date))
      .y0(innerH)
      .y1((d) => yScale(d.value))
      .curve(curveMonotoneX);

    g.append("path")
      .datum(dated)
      .attr("fill", fillColor)
      .attr("opacity", 0.5)
      .attr("d", areaGen);

    // Line
    const lineGen = line<(typeof dated)[0]>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(curveMonotoneX);

    const linePath = g
      .append("path")
      .datum(dated)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", lineGen);

    // Animate line drawing
    const totalLength = (linePath.node() as SVGPathElement)?.getTotalLength?.();
    if (totalLength) {
      linePath
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(TRANSITIONS.duration * 1.5)
        .attr("stroke-dashoffset", 0);
    }

    // X axis
    g.append("g")
      .attr("class", "chart-axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        axisBottom(xScale)
          .ticks(Math.min(dated.length, 8))
          .tickFormat((d) => (d as Date).getFullYear().toString())
      );

    // Y axis
    g.append("g")
      .attr("class", "chart-axis")
      .call(axisLeft(yScale).ticks(6));

    // Unit label on Y axis
    g.append("text")
      .attr("x", -margin.left + 8)
      .attr("y", -8)
      .attr("fill", AXIS.labelColor)
      .attr("font-size", "11px")
      .attr("font-family", AXIS.labelFontFamily)
      .text(series.unit);

    // Hover interaction — invisible rect to capture mouse
    const hoverLine = g
      .append("line")
      .attr("stroke", COLORS.slate[300])
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,3")
      .attr("y1", 0)
      .attr("y2", innerH)
      .style("opacity", 0);

    const hoverDot = g
      .append("circle")
      .attr("r", 4)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("opacity", 0);

    const dateBisector = bisector<(typeof dated)[0], Date>(
      (d) => d.date
    ).left;

    g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = [event.offsetX - margin.left];
        const x0 = xScale.invert(mx);
        const i = dateBisector(dated, x0, 1);
        const d0 = dated[i - 1];
        const d1 = dated[i];
        if (!d0) return;
        const d =
          d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
            ? d1
            : d0;

        const cx = xScale(d.date);
        const cy = yScale(d.value);

        hoverLine.attr("x1", cx).attr("x2", cx).style("opacity", 1);
        hoverDot.attr("cx", cx).attr("cy", cy).style("opacity", 1);

        showTooltip({
          label: d.rawDate,
          value: `${d.value.toFixed(1)}${series.unit === "%" ? "%" : ` ${series.unit}`}`,
        });
        moveTooltip(event.clientX, event.clientY);
      })
      .on("mouseout", () => {
        hoverLine.style("opacity", 0);
        hoverDot.style("opacity", 0);
        hideTooltip();
      });
  }, [series, width, height, color, fillColor, svgRef, showTooltip, moveTooltip, hideTooltip]);

  return (
    <svg
      ref={svgRef}
      className="block"
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}