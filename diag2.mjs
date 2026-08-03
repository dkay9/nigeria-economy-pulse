import fs from 'fs';
const g = JSON.parse(fs.readFileSync('./public/geo/nigeria-states.geojson', 'utf8'));
console.log('total features:', g.features.length);
let gMinLng = Infinity, gMaxLng = -Infinity, gMinLat = Infinity, gMaxLat = -Infinity;
g.features.forEach((f, i) => {
  const c = f.geometry.coordinates.flat(Infinity);
  const lng = c.filter((_, j) => j % 2 === 0);
  const lat = c.filter((_, j) => j % 2 === 1);
  const minLng = Math.min(...lng), maxLng = Math.max(...lng);
  const minLat = Math.min(...lat), maxLat = Math.max(...lat);
  gMinLng = Math.min(gMinLng, minLng); gMaxLng = Math.max(gMaxLng, maxLng);
  gMinLat = Math.min(gMinLat, minLat); gMaxLat = Math.max(gMaxLat, maxLat);
  const w = maxLng - minLng, h = maxLat - minLat;
  if (w > 8 || h > 8) console.log(`SUSPICIOUS ${i} (${f.properties.shapeName}): w=${w.toFixed(1)} h=${h.toFixed(1)}`);
});
console.log('GLOBAL lng:', gMinLng.toFixed(2), 'to', gMaxLng.toFixed(2));
console.log('GLOBAL lat:', gMinLat.toFixed(2), 'to', gMaxLat.toFixed(2));
console.log('(Nigeria should be lng 2.7-14.7, lat 4.3-13.9)');
