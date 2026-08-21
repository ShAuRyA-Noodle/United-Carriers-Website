/* ============================================================================
   arcs — great-circle trade lanes drawn as additive tubes with a travelling
   pulse riding along each lane.
   ========================================================================= */

import * as THREE from 'three';

const ARC_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vAlongFade;
  void main() {
    vUv = uv;
    // fade the tube where it meets the surface so lanes emerge, not stick out
    vAlongFade = smoothstep(0.0, 0.075, uv.x) * smoothstep(1.0, 0.925, uv.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* The lanes were built as ~1px tubes. Sub-pixel geometry falls between
   rasteriser samples and blinks as the globe turns, which is what made the
   lines look like they were popping in and out. They are now wide enough to
   land on real pixels, run at a higher segment count, and MSAA in the composer
   resolves the edges — the neon comes from additive blending plus bloom, not
   from thinness. */
const ARC_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uCore;
  uniform vec3  uHot;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uOffset;
  uniform float uWeight;
  uniform float uReveal;   // 0..1 draw-on progress
  uniform float uOpacity;  // global master fade

  varying vec2  vUv;
  varying float vAlongFade;

  void main() {
    float t = vUv.x;

    // draw-on: the lane wipes into existence from origin to destination
    float drawn = smoothstep(uReveal, uReveal - 0.22, t);
    if (drawn <= 0.001) discard;

    // constant filament
    float base = 0.10 * uWeight;

    // travelling pulse head with a trailing comet tail
    float head = fract(uTime * uSpeed + uOffset);
    float d    = t - head;
    d -= floor(d + 0.5);                       // wrap to [-0.5, 0.5]
    float tail = exp(-max(0.0, -d) * 13.0);    // energy behind the head only
    float core = exp(-abs(d) * 46.0);

    float energy = base + tail * 0.34 * uWeight + core * 1.30;

    vec3 col = mix(uCore, uHot, clamp(core * 1.15 + tail * 0.28, 0.0, 1.0));

    float a = energy * vAlongFade * drawn * uOpacity;
    if (a <= 0.002) discard;

    gl_FragColor = vec4(col * a, a);
  }
`;

/** Unit-sphere position from lon/lat degrees. */
export function latLonToVec3(lat, lon, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Samples a lifted great-circle between two surface points. */
function greatCircle(a, b, lift, segments = 160) {
  const start = a.clone().normalize();
  const end = b.clone().normalize();
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().copy(start).lerp(end, t).normalize();
    // sin bump gives the apex; short lanes stay hugging the surface
    const alt = 1 + lift * Math.sin(Math.PI * t);
    pts.push(p.multiplyScalar(alt));
  }
  return pts;
}

export function createArcs(routes, nodeById, { radius = 1 } = {}) {
  const group = new THREE.Group();
  const materials = [];

  routes.forEach((route, i) => {
    const from = nodeById[route.from];
    const to = nodeById[route.to];
    if (!from || !to) return;

    const a = latLonToVec3(from.lat, from.lon, radius);
    const b = latLonToVec3(to.lat, to.lon, radius);
    const curve = new THREE.CatmullRomCurve3(greatCircle(a, b, route.lift ?? 0.3));

    const geo = new THREE.TubeGeometry(curve, 300, 0.0030 + 0.0022 * (route.weight ?? 1), 8, false);

    const mat = new THREE.ShaderMaterial({
      vertexShader: ARC_VERT,
      fragmentShader: ARC_FRAG,
      uniforms: {
        uCore:    { value: new THREE.Color('#ff5500') },
        uHot:     { value: new THREE.Color('#fff0dc') },
        uTime:    { value: 0 },
        uSpeed:   { value: 0.055 + Math.random() * 0.05 },
        uOffset:  { value: Math.random() },
        uWeight:  { value: route.weight ?? 1 },
        uReveal:  { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    materials.push({ mat, order: i });
    group.add(new THREE.Mesh(geo, mat));
  });

  return {
    group,
    /** @param {number} t seconds */
    update(t) {
      for (const { mat } of materials) mat.uniforms.uTime.value = t;
    },
    /** Staggered draw-on used by the intro. 0 → hidden, 1 → all lanes drawn. */
    setReveal(p) {
      const n = materials.length || 1;
      materials.forEach(({ mat, order }) => {
        const start = (order / n) * 0.55;
        const local = THREE.MathUtils.clamp((p - start) / 0.45, 0, 1);
        mat.uniforms.uReveal.value = local * 1.16; // overshoot so the tail completes
      });
    },
    setOpacity(o) {
      for (const { mat } of materials) mat.uniforms.uOpacity.value = o;
    },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
