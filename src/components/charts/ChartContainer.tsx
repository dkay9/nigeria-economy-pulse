"use client";

import { useRef } from "react";
import { useResizeObserver, type Dimensions } from "./useResizeObserver";

interface ChartContainerProps {
  /** Aspect ratio as height/width. E.g. 0.5 means height = 50% of width */
  aspectRatio?: number;
  /** Minimum height in px */
  minHeight?: number;
  /** Maximum height in px */
  maxHeight?: number;
  /** Additional CSS class for the outer wrapper */
  className?: string;
  /** Render prop — receives dimensions and the SVG ref */
  children: (
    dimensions: Dimensions,
    svgRef: React.RefObject<SVGSVGElement | null>
  ) => React.ReactNode;
}

/**
 * Responsive chart wrapper. Measures its own width, calculates height from
 * the aspect ratio, and passes both to the child render function.
 *
 * The child is responsible for creating the SVG and bindind D3 to it.
 * This component only handles sizing.
 *
 * Usage:
 *   <ChartContainer aspectRatio={0.5}>
 *     {(dims, svgRef) => (
 *       <svg ref={svgRef} width={dims.width} height={dims.height}>
 *         {/* D3 binds here via useEffect *\/}
 *       </svg>
 *     )}
 *   </ChartContainer>
 */
export default function ChartContainer({
  aspectRatio = 0.5,
  minHeight = 200,
  maxHeight = 500,
  className = "",
  children,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = useResizeObserver(containerRef);

  // Calculate constrained height
  const width = dimensions?.width ?? 0;
  const rawHeight = width * aspectRatio;
  const height = Math.max(minHeight, Math.min(maxHeight, rawHeight));

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      {dimensions && dimensions.width > 0
        ? children({ width, height }, svgRef)
        : null}
    </div>
  );
}