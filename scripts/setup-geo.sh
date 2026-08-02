#!/usr/bin/env bash
# =============================================================================
# Download Nigeria State Boundaries GeoJSON
# =============================================================================
# Source: geoBoundaries (William & Mary geoLab)
# License: CC-BY 4.0 (Attribution required)
# Attribution: Runfola et al., 2020
#
# This downloads the simplified ADM1 (state-level) boundaries and places
# them in public/geo/ for the API route to serve.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GEO_DIR="$PROJECT_ROOT/public/geo"
OUTPUT_FILE="$GEO_DIR/nigeria-states.geojson"

# geoBoundaries GitHub raw URL for Nigeria ADM1 (simplified)
GEOJSON_URL="https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson"

# Fallback: HDX (Humanitarian Data Exchange) mirror
FALLBACK_URL="https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-nigeria/resource/3a198c00-bb58-45e2-b6ce-ca625eb0246a/download/geoBoundaries-NGA-ADM1_simplified.geojson"

mkdir -p "$GEO_DIR"

echo "==> Downloading Nigeria state boundaries (ADM1)..."
echo "    Source: geoBoundaries (CC-BY 4.0)"
echo ""

if curl -fsSL -o "$OUTPUT_FILE" "$GEOJSON_URL" 2>/dev/null; then
  echo "✓  Downloaded from geoBoundaries GitHub"
elif curl -fsSL -o "$OUTPUT_FILE" "$FALLBACK_URL" 2>/dev/null; then
  echo "✓  Downloaded from HDX fallback"
else
  echo "✗  Failed to download GeoJSON from both sources."
  echo "   You can manually download from:"
  echo "   $GEOJSON_URL"
  echo "   and place it at: $OUTPUT_FILE"
  exit 1
fi

# Quick validation: check it's valid JSON with features
if command -v python3 &>/dev/null; then
  FEATURE_COUNT=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    data = json.load(f)
print(len(data.get('features', [])))
" 2>/dev/null || echo "0")
  echo "   Features found: $FEATURE_COUNT (expect 37: 36 states + FCT)"
  if [ "$FEATURE_COUNT" -lt 37 ]; then
    echo "   ⚠  Fewer features than expected. Verify the file manually."
  fi
fi

# Write attribution file
cat > "$GEO_DIR/ATTRIBUTION.md" << 'EOF'
# GeoJSON Attribution

**Source:** geoBoundaries Global Database of Political Administrative Boundaries
**Version:** Open (gbOpen)
**Level:** ADM1 (States)
**Country:** Nigeria (NGA)
**License:** Creative Commons Attribution 4.0 International (CC-BY 4.0)

**Citation:**
Runfola, D. et al. (2020) geoBoundaries: A global database of political
administrative boundaries. PLoS ONE 15(4): e0231866.
https://doi.org/10.1371/journal.pone.0231866

**Data URL:** https://www.geoboundaries.org
EOF

echo ""
echo "✓  Setup complete. GeoJSON saved to: $OUTPUT_FILE"
echo "   Attribution written to: $GEO_DIR/ATTRIBUTION.md"