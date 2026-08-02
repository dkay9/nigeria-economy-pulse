// =============================================================================
// Static / Curated Datasets
// =============================================================================
// These cover data the World Bank API does NOT provide at the granularity we
// need: GDP by sector, and state-level metrics.
//
// ⚠️  DATA ACCURACY NOTICE:
// These figures are sourced from NBS reports and CBN publications. They are
// approximate and may not reflect the very latest releases. Each dataset
// includes a snapshotDate indicating when the data was last manually verified.
// The dashboard UI must display this provenance clearly.
//
// When NBS or CBN publish updated figures, these snapshots should be refreshed
// by a maintainer. The long-term plan is to automate this via a data pipeline
// that parses NBS Excel releases, but for MVP we curate manually.
// =============================================================================

import type {
  SectorBreakdown,
  StateDataset,
  DataSource,
} from "@/types/indicators";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

const nbsSource = (snapshotDate: string): DataSource => ({
  name: "nbs",
  attribution: "National Bureau of Statistics, Nigeria",
  url: "https://nigerianstat.gov.ng",
  snapshotDate,
});

const cbnSource = (snapshotDate: string): DataSource => ({
  name: "cbn",
  attribution: "Central Bank of Nigeria Statistical Bulletin",
  url: "https://www.cbn.gov.ng/documents/Statbulletin.html",
  snapshotDate,
});

// ---------------------------------------------------------------------------
// GDP by Sector
// ---------------------------------------------------------------------------
// Source: NBS GDP reports (quarterly, by activity sector).
// These are percentage contributions to real GDP.
//
// ⚠️  The figures below are approximate and based on publicly available NBS
// reports. You should verify these against the latest NBS quarterly GDP
// report before treating them as authoritative.
// ---------------------------------------------------------------------------

export const GDP_BY_SECTOR: Record<string, SectorBreakdown> = {
  "2023": {
    period: "2023 (Full Year)",
    source: nbsSource("2024-06-01"),
    data: [
      { sector: "Agriculture", percentage: 22.35 },
      { sector: "Oil & Gas", percentage: 5.93 },
      { sector: "Manufacturing", percentage: 8.74 },
      { sector: "Trade", percentage: 15.23 },
      { sector: "Telecoms & ICT", percentage: 18.44 },
      { sector: "Financial Services", percentage: 5.31 },
      { sector: "Real Estate", percentage: 5.72 },
      { sector: "Construction", percentage: 3.56 },
      { sector: "Other Services", percentage: 14.72 },
    ],
  },
  "2022": {
    period: "2022 (Full Year)",
    source: nbsSource("2023-08-01"),
    data: [
      { sector: "Agriculture", percentage: 23.18 },
      { sector: "Oil & Gas", percentage: 5.67 },
      { sector: "Manufacturing", percentage: 8.62 },
      { sector: "Trade", percentage: 15.41 },
      { sector: "Telecoms & ICT", percentage: 17.92 },
      { sector: "Financial Services", percentage: 5.18 },
      { sector: "Real Estate", percentage: 5.68 },
      { sector: "Construction", percentage: 3.62 },
      { sector: "Other Services", percentage: 14.72 },
    ],
  },
  "2021": {
    period: "2021 (Full Year)",
    source: nbsSource("2022-08-01"),
    data: [
      { sector: "Agriculture", percentage: 23.36 },
      { sector: "Oil & Gas", percentage: 7.24 },
      { sector: "Manufacturing", percentage: 8.84 },
      { sector: "Trade", percentage: 15.57 },
      { sector: "Telecoms & ICT", percentage: 17.34 },
      { sector: "Financial Services", percentage: 4.89 },
      { sector: "Real Estate", percentage: 5.71 },
      { sector: "Construction", percentage: 3.41 },
      { sector: "Other Services", percentage: 13.64 },
    ],
  },
  "2020": {
    period: "2020 (Full Year)",
    source: nbsSource("2021-08-01"),
    data: [
      { sector: "Agriculture", percentage: 24.45 },
      { sector: "Oil & Gas", percentage: 8.16 },
      { sector: "Manufacturing", percentage: 8.99 },
      { sector: "Trade", percentage: 14.90 },
      { sector: "Telecoms & ICT", percentage: 17.02 },
      { sector: "Financial Services", percentage: 4.63 },
      { sector: "Real Estate", percentage: 5.58 },
      { sector: "Construction", percentage: 3.34 },
      { sector: "Other Services", percentage: 12.93 },
    ],
  },
};

// ---------------------------------------------------------------------------
// State-level GDP Contribution
// ---------------------------------------------------------------------------
// Source: NBS / CBN. State-level GDP data in Nigeria is notoriously difficult
// to get — NBS publishes it infrequently. The figures below are approximate
// percentage contributions to national GDP.
//
// ⚠️  These are ESTIMATES compiled from various NBS and CBN publications.
// Nigeria does not publish official state GDP figures annually. Treat these
// as indicative, not definitive. The most authoritative recent source is the
// NBS "Nigerian Gross Domestic Product Report" which sometimes includes
// state-level breakdowns.
// ---------------------------------------------------------------------------

export const STATE_GDP_CONTRIBUTION: StateDataset = {
  metricId: "gdp_contribution",
  label: "Share of National GDP",
  unit: "%",
  period: "2022 (Estimated)",
  source: nbsSource("2024-01-15"),
  states: [
    { stateName: "Lagos", value: 30.65 },
    { stateName: "Rivers", value: 7.82 },
    { stateName: "Delta", value: 4.59 },
    { stateName: "Oyo", value: 3.68 },
    { stateName: "Kano", value: 3.43 },
    { stateName: "Ogun", value: 2.98 },
    { stateName: "Akwa Ibom", value: 2.85 },
    { stateName: "Imo", value: 2.41 },
    { stateName: "Anambra", value: 2.33 },
    { stateName: "Kaduna", value: 2.17 },
    { stateName: "Abia", value: 1.89 },
    { stateName: "Edo", value: 1.87 },
    { stateName: "Enugu", value: 1.76 },
    { stateName: "Ondo", value: 1.72 },
    { stateName: "Bayelsa", value: 1.68 },
    { stateName: "Benue", value: 1.54 },
    { stateName: "Cross River", value: 1.48 },
    { stateName: "Niger", value: 1.41 },
    { stateName: "Osun", value: 1.38 },
    { stateName: "Kwara", value: 1.32 },
    { stateName: "Plateau", value: 1.28 },
    { stateName: "Kogi", value: 1.21 },
    { stateName: "Ekiti", value: 1.14 },
    { stateName: "Bauchi", value: 1.12 },
    { stateName: "Nasarawa", value: 1.09 },
    { stateName: "Sokoto", value: 1.05 },
    { stateName: "Adamawa", value: 1.02 },
    { stateName: "Borno", value: 0.98 },
    { stateName: "Katsina", value: 0.95 },
    { stateName: "Taraba", value: 0.88 },
    { stateName: "Gombe", value: 0.82 },
    { stateName: "Zamfara", value: 0.76 },
    { stateName: "Jigawa", value: 0.73 },
    { stateName: "Kebbi", value: 0.71 },
    { stateName: "Ebonyi", value: 0.68 },
    { stateName: "Yobe", value: 0.63 },
    { stateName: "Federal Capital Territory", value: 2.81 },
  ],
};

// ---------------------------------------------------------------------------
// State-level Poverty Rate
// ---------------------------------------------------------------------------
// Source: NBS Multidimensional Poverty Index Survey (2022).
//
// ⚠️  These figures are from the NBS/World Bank poverty survey. Poverty
// measurement methodology varies between surveys. These use the national
// poverty line (₦137,430 per year at 2018/19 prices). Verify against the
// latest NBS poverty report.
// ---------------------------------------------------------------------------

export const STATE_POVERTY_RATE: StateDataset = {
  metricId: "poverty_rate",
  label: "Poverty Rate (Headcount)",
  unit: "%",
  period: "2022",
  source: nbsSource("2023-11-01"),
  states: [
    { stateName: "Lagos", value: 4.5 },
    { stateName: "Rivers", value: 23.7 },
    { stateName: "Delta", value: 22.1 },
    { stateName: "Oyo", value: 28.4 },
    { stateName: "Kano", value: 55.1 },
    { stateName: "Ogun", value: 12.6 },
    { stateName: "Akwa Ibom", value: 25.8 },
    { stateName: "Imo", value: 28.9 },
    { stateName: "Anambra", value: 14.2 },
    { stateName: "Kaduna", value: 43.5 },
    { stateName: "Abia", value: 30.5 },
    { stateName: "Edo", value: 19.4 },
    { stateName: "Enugu", value: 32.1 },
    { stateName: "Ondo", value: 24.5 },
    { stateName: "Bayelsa", value: 20.1 },
    { stateName: "Benue", value: 33.2 },
    { stateName: "Cross River", value: 36.8 },
    { stateName: "Niger", value: 49.8 },
    { stateName: "Osun", value: 18.3 },
    { stateName: "Kwara", value: 27.4 },
    { stateName: "Plateau", value: 38.6 },
    { stateName: "Kogi", value: 35.4 },
    { stateName: "Ekiti", value: 21.8 },
    { stateName: "Bauchi", value: 61.5 },
    { stateName: "Nasarawa", value: 44.2 },
    { stateName: "Sokoto", value: 87.7 },
    { stateName: "Adamawa", value: 47.3 },
    { stateName: "Borno", value: 56.8 },
    { stateName: "Katsina", value: 56.4 },
    { stateName: "Taraba", value: 67.5 },
    { stateName: "Gombe", value: 62.3 },
    { stateName: "Zamfara", value: 73.9 },
    { stateName: "Jigawa", value: 63.2 },
    { stateName: "Kebbi", value: 50.2 },
    { stateName: "Ebonyi", value: 58.7 },
    { stateName: "Yobe", value: 65.1 },
    { stateName: "Federal Capital Territory", value: 38.5 },
  ],
};

// ---------------------------------------------------------------------------
// Available state datasets — registry for the indicator switcher
// ---------------------------------------------------------------------------

export const STATE_DATASETS: Record<string, StateDataset> = {
  gdp_contribution: STATE_GDP_CONTRIBUTION,
  poverty_rate: STATE_POVERTY_RATE,
};

// ---------------------------------------------------------------------------
// Available sector breakdown periods
// ---------------------------------------------------------------------------

export function getAvailableSectorPeriods(): string[] {
  return Object.keys(GDP_BY_SECTOR).sort((a, b) => b.localeCompare(a));
}

export function getSectorBreakdown(
  period: string
): SectorBreakdown | undefined {
  return GDP_BY_SECTOR[period];
}
