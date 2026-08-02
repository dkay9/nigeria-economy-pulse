// =============================================================================
// D3 Theme Configuration
// =============================================================================
// Shared visual constants for all D3 chart components. Every chart imports
// from here to maintain visual consistency.
//
// This is NOT a CSS theme — it's a D3-specific config that defines:
//   - Color scales for the choropleth and categorical charts
//   - Axis styling constants
//   - Tooltip styling
//   - Transition timings
//   - Number formatting functions
// =============================================================================

import { format as d3Format } from "d3-format";
import { timeFormat } from "d3-time-format";

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
// Inspired by the Nigerian flag (green/white) but extended into a full
// analytical palette. The greens anchor the identity; blues and ambers
// provide contrast for secondary data.

export const COLORS = {
  // Primary — Nigerian green spectrum (for positive indicators, primary fills)
  green: {
    900: "#064E3B",
    700: "#047857",
    500: "#10B981",
    300: "#6EE7B7",
    100: "#D1FAE5",
  },

  // Secondary — warm amber (for alerts, negative deltas, oil-related data)
  amber: {
    900: "#78350F",
    700: "#B45309",
    500: "#F59E0B",
    300: "#FCD34D",
    100: "#FEF3C7",
  },

  // Tertiary — slate blue (for neutral data, axes, grid lines)
  slate: {
    900: "#0F172A",
    800: "#1E293B",
    700: "#334155",
    500: "#64748B",
    300: "#CBD5E1",
    200: "#E2E8F0",
    100: "#F1F5F9",
    50: "#F8FAFC",
  },

  // Accent — deep blue (for exchange rate, financial data)
  blue: {
    700: "#1D4ED8",
    500: "#3B82F6",
    300: "#93C5FD",
    100: "#DBEAFE",
  },

  // Semantic
  positive: "#059669", // green-600
  negative: "#DC2626", // red-600
  neutral: "#64748B", // slate-500

  // Chart background
  bgPrimary: "#FFFFFF",
  bgSecondary: "#F8FAFC",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
} as const;

// ---------------------------------------------------------------------------
// Categorical color scale (for sector bars, multi-line charts)
// ---------------------------------------------------------------------------

export const SECTOR_COLORS = [
  "#047857", // Agriculture — green
  "#1E293B", // Oil & Gas — dark slate
  "#3B82F6", // Manufacturing — blue
  "#F59E0B", // Trade — amber
  "#8B5CF6", // Telecoms & ICT — purple
  "#EC4899", // Financial Services — pink
  "#14B8A6", // Real Estate — teal
  "#F97316", // Construction — orange
  "#64748B", // Other Services — slate
] as const;

// ---------------------------------------------------------------------------
// Choropleth color scheme
// ---------------------------------------------------------------------------

/**
 * Domain endpoints for the choropleth. Adjust based on the metric.
 * The actual d3.scaleSequential will be created in the map component.
 */
export const CHOROPLETH = {
  /** For GDP contribution: light green → dark green */
  gdpInterpolator: "interpolateGreens",
  /** For poverty rate: light red → dark red */
  povertyInterpolator: "interpolateOrRd",
  /** Fallback for unknown metrics */
  defaultInterpolator: "interpolateBlues",
  /** Color for states with no data */
  noDataFill: "#E2E8F0",
  /** Stroke color for state boundaries */
  strokeColor: "#FFFFFF",
  strokeWidth: 0.5,
  hoverStrokeColor: "#0F172A",
  hoverStrokeWidth: 2,
} as const;

// ---------------------------------------------------------------------------
// Axis styling
// ---------------------------------------------------------------------------

export const AXIS = {
  tickColor: "#94A3B8",
  tickSize: 5,
  gridColor: "#E2E8F0",
  gridDasharray: "2,4",
  labelColor: "#475569",
  labelFontSize: "12px",
  labelFontFamily: "'Inter', system-ui, sans-serif",
} as const;

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const TRANSITIONS = {
  /** Standard chart transition (enter/update) */
  duration: 600,
  /** Faster transitions for hover effects */
  hoverDuration: 150,
  /** Staggered enter delay per element */
  staggerDelay: 30,
  /** Easing function name (for d3.ease*) */
  easing: "easeCubicOut",
} as const;

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

export const TOOLTIP = {
  bgColor: "#0F172A",
  textColor: "#F8FAFC",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  fontFamily: "'Inter', system-ui, sans-serif",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  offset: { x: 12, y: -12 },
} as const;

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/** Format a percentage value (e.g. 25.8 → "25.8%") */
export const formatPercent = (v: number | null): string =>
  v === null ? "N/A" : `${d3Format(",.1f")(v)}%`;

/** Format a large number with SI prefix (e.g. 1.5T, 230B) */
export const formatCompact = (v: number | null): string =>
  v === null ? "N/A" : d3Format(".3s")(v);

/** Format currency (NGN) */
export const formatNaira = (v: number | null): string =>
  v === null ? "N/A" : `₦${d3Format(",.0f")(v)}`;

/** Format USD */
export const formatUSD = (v: number | null): string =>
  v === null ? "N/A" : `$${d3Format(",.2f")(v)}`;

/** Format exchange rate */
export const formatRate = (v: number | null): string =>
  v === null ? "N/A" : d3Format(",.1f")(v);

/** Format year label */
export const formatYear = timeFormat("%Y");

/** Format delta as +/- percentage */
export const formatDelta = (current: number, previous: number): string => {
  const delta = current - previous;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${d3Format(",.1f")(delta)}`;
};

// ---------------------------------------------------------------------------
// Responsive breakpoints (for viewBox calculations)
// ---------------------------------------------------------------------------

export const CHART_BREAKPOINTS = {
  mobile: 380,
  tablet: 768,
  desktop: 1024,
} as const;

/** Default SVG margins */
export const DEFAULT_MARGIN = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 60,
} as const;
