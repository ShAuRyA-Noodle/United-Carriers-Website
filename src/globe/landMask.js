/* ============================================================================
   landMask — rasterises Natural Earth land polygons (world-atlas 110m TopoJSON,
   public domain) into an equirectangular alpha bitmap so a sphere point can be
   land-tested in O(1) instead of running point-in-polygon per dot.
   ========================================================================= */

import { feature } from 'topojson-client';

const TEX_W = 2048;
const TEX_H = 1024;

/** Projects lon/lat to equirectangular pixel space. */
function project(lon, lat) {
  return [((lon + 180) / 360) * TEX_W, ((90 - lat) / 180) * TEX_H];
}

/**
 * Traces one polygon's rings.
 *
 * Rings that cross the antimeridian arrive with longitudes jumping from +179 to
 * -179. Projected naively that jump draws a line straight back across the whole
 * canvas, which is what put horizontal streaks through the ocean. So each ring
 * is first unwrapped into a continuous longitude run, then drawn three times at
 * -360 / 0 / +360 so whichever copy overlaps the canvas fills correctly.
 */
function tracePolygon(ctx, rings) {
  for (const ring of rings) {
    if (ring.length < 2) continue;

    // unwrap longitudes so the ring never jumps a seam
    const lons = new Array(ring.length);
    lons[0] = ring[0][0];
    for (let i = 1; i < ring.length; i++) {
      let d = ring[i][0] - ring[i - 1][0];
      if (d > 180) d -= 360;
      else if (d < -180) d += 360;
      lons[i] = lons[i - 1] + d;
    }

    for (const shift of [-360, 0, 360]) {
      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const [x, y] = project(lons[i] + shift, ring[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      // stroked too, so hairline islands survive rasterisation at this scale
      ctx.stroke();
    }
  }
}

let _maskPromise = null;

/** Shared instance — the loader map and the globe dots use the same raster. */
export function getLandMask(url = '/land-110m.json') {
  if (!_maskPromise) _maskPromise = createLandMask(url);
  return _maskPromise;
}

export async function createLandMask(url = '/land-110m.json') {
  const topo = await fetch(url).then((r) => r.json());
  const land = feature(topo, topo.objects.land);

  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';

  const geoms = land.type === 'FeatureCollection' ? land.features : [land];
  for (const g of geoms) {
    const geom = g.geometry || g;
    if (geom.type === 'Polygon') tracePolygon(ctx, geom.coordinates);
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach((p) => tracePolygon(ctx, p));
  }

  const { data } = ctx.getImageData(0, 0, TEX_W, TEX_H);

  // Pack to a 1-bit-per-pixel lookup for cheap sampling.
  const bits = new Uint8Array(TEX_W * TEX_H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    bits[p] = data[i] > 110 ? 1 : 0;
  }

  return {
    width: TEX_W,
    height: TEX_H,
    /** @returns {boolean} true when lon/lat falls on land */
    isLand(lon, lat) {
      let x = Math.floor(((lon + 180) / 360) * TEX_W);
      let y = Math.floor(((90 - lat) / 180) * TEX_H);
      if (x < 0) x += TEX_W;
      if (x >= TEX_W) x -= TEX_W;
      if (y < 0) y = 0;
      if (y >= TEX_H) y = TEX_H - 1;
      return bits[y * TEX_W + x] === 1;
    },
    /** Distance-to-coast proxy: how many of the 4 neighbours are also land. */
    landNeighbours(lon, lat, step = 0.7) {
      let n = 0;
      if (this.isLand(lon + step, lat)) n++;
      if (this.isLand(lon - step, lat)) n++;
      if (this.isLand(lon, lat + step)) n++;
      if (this.isLand(lon, lat - step)) n++;
      return n;
    },
  };
}
