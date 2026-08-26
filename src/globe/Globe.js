/* ============================================================================
   Globe — dotted-land planet, terminator rim, atmospheric limb, trade lanes,
   starfield, drag-to-orbit and a scroll-driven descent into the atmosphere.
   ========================================================================= */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { getLandMask } from './landMask.js';
import { createArcs, latLonToVec3 } from './arcs.js';
import { createLabels } from './labels.js';
import { NODES, NODE_BY_ID, ROUTES } from '../data/mock.js';

const R = 1;
const FOV = 35;
const ATMO_R = 1.24;   // wide cool shell
const RIM_R = 1.034;   // tight warm terminator shell

/* sun sits behind and above-left of the viewer, which is what carves the thin
   sunrise crescent along the upper-left limb */
const SUN_DIR = new THREE.Vector3(-0.62, 0.55, -0.56).normalize();

/* ───────────────────────────── shader chunks ───────────────────────────── */

const NOISE = /* glsl */ `
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.07; a *= 0.5; }
    return s;
  }
`;

/* Shared helpers.

   `dither` breaks up 8-bit quantisation in the big smooth gradients — without
   it the atmosphere falls into visible bands.

   Point sprites are the other half of the smoothness problem: once a sprite
   drops below one pixel the rasteriser starts dropping it in and out between
   frames, which reads as flicker. So sizes are clamped at 1px and everything
   below that is expressed as alpha instead. For the same reason nothing here
   animates gl_PointSize — sub-pixel size wobble is exactly what shimmers. */
const GLSL_UTIL = /* glsl */ `
  float dither(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
`;

/* deep-space backdrop: almost pure black with one faint warm drift, so the
   left half of the frame stays clean enough for type */
const SKY_FRAG = /* glsl */ `
  precision highp float;
  ${NOISE}
  uniform float uOpacity;
  uniform vec3  uSun;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);

    // one soft haze lobe, anchored toward the sun so it reads as glare
    float toward = max(dot(d, -normalize(uSun)), 0.0);
    float haze = pow(toward, 3.2);
    float n = fbm(d * 3.1);

    vec3 col = vec3(0.0045, 0.0048, 0.0062);
    col += vec3(0.22, 0.10, 0.035) * haze * (0.45 + 0.55 * n) * 0.34;

    gl_FragColor = vec4(col * uOpacity, 1.0);
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* planet body — night side with a sunrise crescent riding the limb */
const BODY_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const BODY_FRAG = /* glsl */ `
  precision highp float;
  ${GLSL_UTIL}
  uniform vec3  uSun;
  uniform vec3  uNight;
  uniform vec3  uOcean;
  uniform vec3  uWarm;
  uniform vec3  uCool;
  uniform float uDive;
  varying vec3  vNormal;
  varying vec3  vView;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);

    float lambert = max(dot(n, normalize(uSun)), 0.0);
    float limb     = 1.0 - max(dot(n, v), 0.0);
    float fres     = pow(limb, 4.2);
    float fresWide = pow(limb, 2.6);

    // sunrise crescent: only where the surface is both lit and near the limb
    float crescent = pow(lambert, 2.6) * fres;

    // ocean scattering picks up on the shadowed limb, strongest low-right
    float scatter = fresWide * pow(1.0 - pow(lambert, 1.8), 2.0) * 0.38;
    scatter *= smoothstep(-0.85, 0.7, -n.y * 0.7 + n.x * 0.42);

    // A flat night colour makes the sphere read as a cut-out disc. This adds a
    // smooth body gradient — a wide terminator wash plus a gentle vertical
    // falloff — so the globe has volume before the rim and scatter go on top.
    float wash = pow(lambert, 0.42);                       // broad day-to-night ramp
    float vertical = smoothstep(-1.0, 1.0, -n.y) * 0.5 + 0.5;

    vec3 col = uNight;
    col += uOcean * wash * 0.085;
    col += uOcean * vertical * 0.030;
    col += uCool * scatter * (0.38 + uDive * 2.4);
    col += uWarm * crescent * (3.2 + uDive * 1.1);

    col += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Shell glows.
   A back-side shell only renders the annulus between the planet's silhouette
   and its own, and across that annulus `1 - |dot(n,v)|` runs from uInner at the
   planet edge up to 1.0 at the shell edge. Driving brightness straight off that
   term therefore lights the OUTER edge and reads as a detached ring. Remapping
   it to `t = (1 - limb) / uInner` flips it: t = 1 hard against the planet, 0 at
   the shell edge, so the glow hugs the limb the way atmosphere actually does. */

const RIM_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uSun;
  uniform vec3  uWarm;
  uniform float uStrength;
  uniform float uInner;
  uniform float uDive;
  varying vec3  vNormal;
  varying vec3  vView;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);

    float limb = 1.0 - abs(dot(n, v));
    float t = clamp((1.0 - limb) / max(uInner, 0.001), 0.0, 1.0);

    float line = pow(t, 0.55);          // tight bright thread on the horizon
    float bleed = pow(t, 0.12) * 0.16;  // just enough spill to catch the bloom

    float sun = max(dot(n, normalize(uSun)), 0.0);
    float mask = pow(sun, 1.55);

    vec3 col = uWarm * (line * 2.5 + bleed) * mask * uStrength * (1.0 + uDive * 0.4);
    float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    if (a <= 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;

const ATMO_FRAG = /* glsl */ `
  precision highp float;
  ${GLSL_UTIL}
  uniform vec3  uSun;
  uniform vec3  uCool;
  uniform float uStrength;
  uniform float uInner;
  uniform float uDive;
  varying vec3  vNormal;
  varying vec3  vView;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);

    float limb = 1.0 - abs(dot(n, v));
    float t = clamp((1.0 - limb) / max(uInner, 0.001), 0.0, 1.0);

    // dense against the surface, trailing off into space
    float band = pow(t, 1.9) * 0.92 + pow(t, 0.7) * 0.30;

    float sun = max(dot(n, normalize(uSun)), 0.0);
    float away = pow(1.0 - pow(sun, 1.7), 1.7);

    // scattering piles up low and to the anti-sun side, as it does at dawn
    float lower = smoothstep(-0.95, 0.8, -n.y * 0.7 + n.x * 0.4);

    vec3 col = uCool * band * away * (0.26 + 0.74 * lower) * uStrength;
    col *= 1.0 + uDive * 4.4;

    float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    if (a <= 0.002) discard;
    col += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, a);
  }
`;

/* land dots — laid out in latitude rows so the field reads as a designed
   lattice rather than scatter */
const DOT_VERT = /* glsl */ `
  precision highp float;
  attribute float aRand;
  attribute float aCoast;

  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uReveal;

  varying float vRand;
  varying float vCoast;
  varying float vFacing;
  varying float vLambert;
  varying float vRim;
  varying float vFade;
  varying float vGate;

  uniform vec3 uSun;

  void main() {
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 v = normalize(cameraPosition - wp.xyz);

    // exact visibility test for a sphere — lets the field render with the depth
    // test off entirely, so it can never z-fight against the body
    vFacing = dot(n, v);

    vLambert = max(dot(n, normalize(uSun)), 0.0);
    vRim = pow(1.0 - max(vFacing, 0.0), 2.4);

    vRand = aRand;
    vCoast = aCoast;

    float band = normal.y * 0.5 + 0.5;
    vGate = smoothstep(band - 0.26, band + 0.03, uReveal * 1.32);

    vec4 mv = viewMatrix * wp;
    float px = uSize * uPixelRatio * (0.88 + 0.26 * aCoast) * (1.0 / -mv.z);

    // below a pixel, fade rather than shrink
    vFade = clamp(px / uPixelRatio, 0.0, 1.0);
    gl_PointSize = max(px, uPixelRatio);

    gl_Position = projectionMatrix * mv;
  }
`;

const DOT_FRAG = /* glsl */ `
  precision highp float;
  ${GLSL_UTIL}
  uniform vec3  uWarm;
  uniform vec3  uBase;
  uniform float uOpacity;

  varying float vRand;
  varying float vCoast;
  varying float vFacing;
  varying float vLambert;
  varying float vRim;
  varying float vFade;
  varying float vGate;

  void main() {
    if (vFacing <= 0.0) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;

    float sprite = smoothstep(0.25, 0.06, d);

    // soft wrap at the silhouette so dots dissolve instead of popping
    float edge = smoothstep(0.0, 0.10, vFacing);

    float lum = 0.72 + vLambert * 0.55 + vRim * 0.10;
    lum *= 0.84 + 0.32 * vCoast;

    // toward the silhouette the rows compress into far more dots per pixel;
    // without this they stack into a hard bright ring around the globe
    lum *= mix(1.0, 0.46, vRim);
    lum *= mix(1.0, 0.55, smoothstep(0.55, 0.06, vFacing));

    float warmMix = clamp(pow(vLambert, 1.15) * 1.35, 0.0, 1.0);
    vec3 col = mix(uBase, uWarm, warmMix) * (0.92 + vLambert * 0.5);

    float a = sprite * lum * uOpacity * vGate * edge
            * vFade * vFade * (0.82 + 0.18 * vRand);
    if (a <= 0.004) discard;

    col += (dither(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, a);
  }
`;

/* port beacons — warm pinpricks that stay visible across the night side */
const CITY_VERT = /* glsl */ `
  precision highp float;
  attribute float aRand;
  uniform float uPixelRatio;
  uniform vec3  uSun;

  varying float vFacing;
  varying float vNight;
  varying float vRand;
  varying float vFade;

  void main() {
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 v = normalize(cameraPosition - wp.xyz);

    vFacing = dot(n, v);
    vNight = 1.0 - pow(max(dot(n, normalize(uSun)), 0.0), 0.7);
    vRand = aRand;

    vec4 mv = viewMatrix * wp;
    float px = 7.5 * uPixelRatio * (0.75 + 0.5 * aRand) * (1.0 / -mv.z);
    vFade = clamp(px / uPixelRatio, 0.0, 1.0);
    gl_PointSize = max(px, uPixelRatio);

    gl_Position = projectionMatrix * mv;
  }
`;

const CITY_FRAG = /* glsl */ `
  precision highp float;
  uniform float uOpacity;

  varying float vFacing;
  varying float vNight;
  varying float vRand;
  varying float vFade;

  void main() {
    if (vFacing <= 0.0) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.18, 0.0, d);
    float halo = pow(smoothstep(0.5, 0.0, d), 2.4);
    float edge = smoothstep(0.0, 0.12, vFacing);

    float a = (core * 0.85 + halo * 0.32) * vNight * uOpacity * edge
            * vFade * vFade * (0.55 + 0.45 * vRand);
    if (a <= 0.004) discard;
    gl_FragColor = vec4(vec3(1.0, 0.62, 0.28) * a, a);
  }
`;

/* ───────────────────────────── main class ───────────────────────────── */

export class Globe {
  constructor(canvas, labelHost) {
    this.canvas = canvas;
    this.labelHost = labelHost;

    this.size = { w: window.innerWidth, h: window.innerHeight, dpr: 1 };
    this.t0 = performance.now() / 1000;
    this.tPrev = this.t0;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // orbit state
    this.rotY = -1.97;
    this.rotX = -0.26;
    this.restTiltX = -0.26;
    this.velY = 0;
    this.velX = 0;
    this.dragVel = new THREE.Vector2();
    this.visible = true;
    this.autoSpeed = this.reducedMotion ? 0 : 0.028;
    this.dragging = false;
    this.pointer = { x: 0, y: 0 };
    this.pointerLerp = { x: 0, y: 0 };

    // scroll-driven descent, 0..1
    this.dive = 0;
    this.introP = 0;

    this._initRenderer();
    this._initScene();
    this._bind();

    if (typeof window !== 'undefined') window.__globe = this;
  }

  /* ── renderer + composer ── */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // near/far were 0.01/220 — a 22000:1 ratio that left almost no depth
    // precision at globe distance. The near plane still has to clear the
    // atmosphere shell during the descent, so 0.05 is the floor.
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 200);
    this.baseDist = R / Math.sin(THREE.MathUtils.degToRad(FOV) / 2);
    this.camera.position.set(0, 0, this.baseDist);

    this.scene = new THREE.Scene();

    // multisampled half-float target: MSAA cleans up the lane tubes, and the
    // extra headroom stops the atmosphere gradient banding before bloom
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 2,
      colorSpace: THREE.LinearSRGBColorSpace,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.58, 0.68);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resize();
  }

  /* ── scene graph ── */
  _initScene() {
    const warm = new THREE.Color('#ff6a1a');
    const cool = new THREE.Color('#2f6bff');

    // deep-space backdrop
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 32, 24),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uOpacity: { value: 1 }, uSun: { value: SUN_DIR.clone() } },
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    this.scene.add(this.sky);

    this.stars = this._makeStars();
    this.scene.add(this.stars);

    // everything that orbits lives under one group
    this.globe = new THREE.Group();
    this.scene.add(this.globe);

    this.bodyMat = new THREE.ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: BODY_FRAG,
      uniforms: {
        uSun:   { value: SUN_DIR.clone() },
        uNight: { value: new THREE.Color('#04060d') },
        uOcean: { value: new THREE.Color('#2c4f9e') },
        uWarm:  { value: warm.clone() },
        uCool:  { value: cool.clone() },
        uDive:  { value: 0 },
      },
    });
    this.body = new THREE.Mesh(new THREE.SphereGeometry(R, 256, 160), this.bodyMat);
    this.globe.add(this.body);

    // wide cool shell — the blue atmospheric band
    this.atmoMat = new THREE.ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        uSun:      { value: SUN_DIR.clone() },
        uCool:     { value: new THREE.Color('#3b74ff') },
        uStrength: { value: 0 },
        uInner:    { value: Math.sqrt(1 - 1 / (ATMO_R * ATMO_R)) },
        uDive:     { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.atmo = new THREE.Mesh(new THREE.SphereGeometry(R * ATMO_R, 192, 128), this.atmoMat);
    this.globe.add(this.atmo);

    // tight warm rim riding the terminator, kept on its own shell so warm and
    // cool never composite into magenta
    this.rimMat = new THREE.ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: RIM_FRAG,
      uniforms: {
        uSun:      { value: SUN_DIR.clone() },
        uWarm:     { value: new THREE.Color('#ff6a12') },
        uStrength: { value: 0 },
        uInner:    { value: Math.sqrt(1 - 1 / (RIM_R * RIM_R)) },
        uDive:     { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.rim = new THREE.Mesh(new THREE.SphereGeometry(R * RIM_R, 256, 160), this.rimMat);
    this.globe.add(this.rim);

    // trade lanes
    this.arcs = createArcs(ROUTES, NODE_BY_ID, { radius: R * 1.004 });
    this.globe.add(this.arcs.group);

    // projected labels
    this.labels = createLabels(NODES, this.labelHost, { radius: R * 1.012 });

    // surface markers (WebGL side — the DOM chip carries the visible dot)
    this.markers = this._makeMarkers();
    this.globe.add(this.markers);

    this.dotsReady = this._makeDots();
  }

  _makeStars() {
    const COUNT = 2600;
    const pos = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT);
    const scale = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      if (v.lengthSq() < 0.0001) v.set(0, 0, 1);
      v.normalize().multiplyScalar(28 + Math.random() * 42);
      pos.set([v.x, v.y, v.z], i * 3);
      rand[i] = Math.random();
      scale[i] = Math.pow(Math.random(), 3.2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aRand;
        attribute float aScale;
        uniform float uPixelRatio;
        uniform float uTime;
        varying float vTw;
        varying float vScale;
        void main() {
          vScale = aScale;
          vTw = 0.55 + 0.45 * sin(uTime * (0.5 + aRand * 1.6) + aRand * 30.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (0.9 + aScale * 2.1) * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uOpacity;
        varying float vTw;
        varying float vScale;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = dot(uv, uv);
          if (d > 0.25) discard;
          float s = smoothstep(0.25, 0.0, d);
          float a = s * vTw * (0.14 + vScale * 0.55) * uOpacity;
          if (a <= 0.003) discard;
          vec3 col = mix(vec3(0.78, 0.83, 1.0), vec3(1.0, 0.93, 0.84), vScale);
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geo, mat);
  }

  _makeMarkers() {
    const pos = new Float32Array(NODES.length * 3);
    NODES.forEach((n, i) => {
      const v = latLonToVec3(n.lat, n.lon, R * 1.002);
      pos.set([v.x, v.y, v.z], i * 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uPixelRatio;
        varying float vFacing;
        varying float vFade;
        void main() {
          // on a sphere the surface normal is the normalised position
          vec3 n = normalize(mat3(modelMatrix) * normalize(position));
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vFacing = dot(n, normalize(cameraPosition - wp.xyz));

          vec4 mv = viewMatrix * wp;
          float px = 24.0 * uPixelRatio * (1.0 / -mv.z);
          vFade = clamp(px / uPixelRatio, 0.0, 1.0);
          gl_PointSize = max(px, uPixelRatio);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uOpacity;
        varying float vFacing;
        varying float vFade;
        void main() {
          if (vFacing <= 0.0) discard;
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          float edge = smoothstep(0.0, 0.12, vFacing);
          float a = pow(glow, 2.6) * 0.85 * uOpacity * edge * vFade;
          if (a <= 0.003) discard;
          gl_FragColor = vec4(vec3(1.0, 0.38, 0.05) * a, a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    this.markerMat = mat;
    const pts = new THREE.Points(geo, mat);
    pts.renderOrder = 4;
    pts.frustumCulled = false;
    return pts;
  }

  /**
   * Builds the dotted continents. Dots are placed on latitude rows with a
   * per-row longitude count proportional to cos(lat), which keeps spacing even
   * on the sphere while preserving visible rows — the lattice look the
   * reference uses. Coastal dots are tagged so they can render slightly hotter.
   */
  async _makeDots() {
    const mask = await getLandMask();
    this.mask = mask;

    const ROWS = 200;                 // ~0.9° per row
    const DEG = Math.PI / 180;

    const positions = [];
    const rands = [];
    const coasts = [];
    const coastal = [];               // candidates for port beacons

    for (let r = 0; r < ROWS; r++) {
      const lat = 90 - (r + 0.5) * (180 / ROWS);
      const ring = Math.cos(lat * DEG);
      if (ring < 0.004) continue;

      const count = Math.max(3, Math.round(ROWS * 2 * ring));
      for (let c = 0; c < count; c++) {
        const lon = -180 + (c + 0.5) * (360 / count);
        if (!mask.isLand(lon, lat)) continue;

        const neighbours = mask.landNeighbours(lon, lat, 360 / count);
        const isCoast = neighbours < 4 ? 1 : 0;

        const phi = (90 - lat) * DEG;
        const theta = (lon + 180) * DEG;
        const rad = R * 1.0022;
        const x = -rad * Math.sin(phi) * Math.cos(theta);
        const y = rad * Math.cos(phi);
        const z = rad * Math.sin(phi) * Math.sin(theta);

        positions.push(x, y, z);
        rands.push(Math.random());
        coasts.push(isCoast);

        if (isCoast && Math.random() < 0.055) coastal.push([x, y, z]);
      }
    }

    const posArr = new Float32Array(positions);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    // on a sphere the normal is just the normalised position
    const norm = new Float32Array(posArr.length);
    for (let i = 0; i < posArr.length; i += 3) {
      const l = Math.hypot(posArr[i], posArr[i + 1], posArr[i + 2]) || 1;
      norm[i] = posArr[i] / l;
      norm[i + 1] = posArr[i + 1] / l;
      norm[i + 2] = posArr[i + 2] / l;
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(new Float32Array(rands), 1));
    geo.setAttribute('aCoast', new THREE.BufferAttribute(new Float32Array(coasts), 1));

    this.dotMat = new THREE.ShaderMaterial({
      vertexShader: DOT_VERT,
      fragmentShader: DOT_FRAG,
      uniforms: {
        uSun:        { value: SUN_DIR.clone() },
        uWarm:       { value: new THREE.Color('#ffc79a') },
        uBase:       { value: new THREE.Color('#e6ecff') },
        uSize:       { value: 2.0 },
        uPixelRatio: { value: this.size.dpr },
        uReveal:     { value: 0 },
        uOpacity:    { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.dots = new THREE.Points(geo, this.dotMat);
    this.dots.renderOrder = 2;
    this.dots.frustumCulled = false;
    this.globe.add(this.dots);

    this._makeCityLights(coastal);

    return { count: rands.length, lights: coastal.length };
  }

  /** Warm pinpricks scattered along inhabited coastline. */
  _makeCityLights(points) {
    if (!points.length) return;

    const pos = new Float32Array(points.length * 3);
    const rand = new Float32Array(points.length);
    points.forEach((p, i) => {
      pos.set(p, i * 3);
      rand[i] = Math.random();
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const norm = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      const l = Math.hypot(pos[i], pos[i + 1], pos[i + 2]) || 1;
      norm[i] = pos[i] / l;
      norm[i + 1] = pos[i + 1] / l;
      norm[i + 2] = pos[i + 2] / l;
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

    this.cityMat = new THREE.ShaderMaterial({
      vertexShader: CITY_VERT,
      fragmentShader: CITY_FRAG,
      uniforms: {
        uSun:        { value: SUN_DIR.clone() },
        uPixelRatio: { value: this.size.dpr },
        uOpacity:    { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    this.cities = new THREE.Points(geo, this.cityMat);
    this.cities.renderOrder = 3;
    this.cities.frustumCulled = false;
    this.globe.add(this.cities);
  }

  /* ── interaction ── */
  /**
   * Direct-drive orbit: while dragging, pointer delta moves the globe 1:1 and
   * the last delta becomes release velocity. Inertia is capped and decays into
   * the idle spin, so a hard flick can never leave the globe spinning away.
   */
  _bind() {
    const c = this.canvas;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;

    const MAX_V = 0.055;

    const down = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      // touch gestures stay ambiguous until they show a direction, so the globe
      // waits rather than stealing what might turn out to be a scroll
      this.pending = e.pointerType === 'touch';
      this.dragging = !this.pending;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      this.dragVel.set(0, 0);
      this.velY = 0;
      this.velX = 0;
      if (this.dragging) c.classList.add('is-dragging');
      try { c.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    };

    const move = (e) => {
      // scene-wide parallax is tracked whether or not we're dragging
      this.pointer.x = (e.clientX / this.size.w) * 2 - 1;
      this.pointer.y = (e.clientY / this.size.h) * 2 - 1;

      if (this.pending) {
        const adx = Math.abs(e.clientX - lastX);
        const ady = Math.abs(e.clientY - lastY);
        if (adx < 8 && ady < 8) return;          // not enough to judge yet
        if (ady > adx) { this.pending = false; return; }   // vertical: let it scroll
        this.pending = false;
        this.dragging = true;
        c.classList.add('is-dragging');
      }
      if (!this.dragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);

      const ry = THREE.MathUtils.clamp(dx * 0.0048, -MAX_V, MAX_V);
      const rx = THREE.MathUtils.clamp(dy * 0.0036, -MAX_V, MAX_V);

      this.rotY += ry;
      this.rotX = THREE.MathUtils.clamp(this.rotX + rx, -0.58, 0.58);

      // smooth the release velocity so a single jittery frame can't fling it
      this.dragVel.y = this.dragVel.y * 0.6 + ry * 0.4;
      this.dragVel.x = this.dragVel.x * 0.6 + rx * 0.4;
    };

    const up = (e) => {
      this.pending = false;
      if (!this.dragging) return;
      this.dragging = false;
      c.classList.remove('is-dragging');
      try { c.releasePointerCapture(e.pointerId); } catch { /* already released */ }

      this.velY = THREE.MathUtils.clamp(this.dragVel.y, -MAX_V, MAX_V);
      this.velX = THREE.MathUtils.clamp(this.dragVel.x, -MAX_V, MAX_V);

      // a tap is not a throw
      if (moved < 6) { this.velY = 0; this.velX = 0; }
      if (moved > 14) this.onDragged?.();
    };

    this._onPointerDown = down;
    this._onPointerMove = move;
    this._onPointerUp = up;

    c.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    window.addEventListener('blur', this._onPointerUp);

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  /* ── layout ── */
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    /* At DPR 2 the hero ran a 3200x1800 buffer through bloom every frame and
       sat at ~40fps. The globe is a soft, bloomed image — the extra pixels buy
       almost nothing, so the backing store is capped well below device DPR and
       capped harder on phones. */
    const cap = w < 760 ? 1.4 : 1.6;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);

    this.size = { w, h, dpr };

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bloom?.setSize(w, h);

    this.camera.aspect = w / h;
    this._applyViewOffset();

    if (this.dotMat) this.dotMat.uniforms.uPixelRatio.value = dpr;
    if (this.cityMat) this.cityMat.uniforms.uPixelRatio.value = dpr;
    if (this.markerMat) this.markerMat.uniforms.uPixelRatio.value = dpr;
    if (this.stars) this.stars.material.uniforms.uPixelRatio.value = dpr;
  }

  /**
   * Off-axis frustum shift so the planet sits where the layout wants it —
   * right-of-centre on desktop, high-centre on narrow screens — and recentres
   * as the descent takes over the frame.
   */
  _applyViewOffset() {
    const { w, h } = this.size;
    const narrow = w < 760;

    const restX = narrow ? 0.5 : 0.895;
    const restY = narrow ? 0.265 : 0.5;

    const e = this.dive * this.dive * (3 - 2 * this.dive); // smoothstep
    const cx = THREE.MathUtils.lerp(restX, 0.5, e);
    const cy = THREE.MathUtils.lerp(restY, 0.5, e);

    const offX = -(cx - 0.5) * w;
    const offY = -(cy - 0.5) * h;

    // globe diameter tracks viewport height on desktop, 96% of width on mobile
    const fit = narrow ? h / (0.70 * w) : 1.035;
    this.camera.fov = FOV;
    this.camera.setViewOffset(w, h, offX, offY, w, h);
    this.camera.aspect = w / h;
    this._fit = fit;
    this.camera.updateProjectionMatrix();
  }

  /* ── external drivers ── */

  /** 0 → pre-intro, 1 → fully revealed. */
  setIntro(p) {
    this.introP = THREE.MathUtils.clamp(p, 0, 1);
    const e = this.introP;
    if (this.dotMat) this.dotMat.uniforms.uReveal.value = e;
    this.stars.material.uniforms.uOpacity.value = Math.min(1, e * 1.4);
    this.atmoMat.uniforms.uStrength.value = e;
    this.rimMat.uniforms.uStrength.value = e;
    this.markerMat.uniforms.uOpacity.value = THREE.MathUtils.clamp((e - 0.35) / 0.5, 0, 1);
    if (this.cityMat) this.cityMat.uniforms.uOpacity.value = THREE.MathUtils.clamp((e - 0.3) / 0.6, 0, 1);
    this.arcs.setReveal(THREE.MathUtils.clamp((e - 0.25) / 0.75, 0, 1));
    this.labels.setReveal(THREE.MathUtils.clamp((e - 0.45) / 0.55, 0, 1));
  }

  /** 0 → resting hero, 1 → fully inside the atmosphere. */
  setDive(p) {
    this.dive = THREE.MathUtils.clamp(p, 0, 1);
  }

  /**
   * The page is ~13,000px tall; without this the full WebGL scene, bloom and
   * all, keeps rendering while the reader is down in the footer.
   */
  setVisible(v) {
    this.visible = v;
  }

  /* ── frame ── */
  update() {
    if (this.visible === false) return;

    const now = performance.now() / 1000;
    const dt = Math.min(now - this.tPrev, 0.05);
    this.tPrev = now;
    const t = now - this.t0;

    // orbit integration — dragging drives rotation directly (see _bind), so
    // this only runs the release inertia and the idle spin
    if (!this.dragging) {
      this.rotY += this.velY;
      this.rotX = THREE.MathUtils.clamp(this.rotX + this.velX, -0.58, 0.58);

      this.velY *= 0.925;
      this.velX *= 0.885;
      if (Math.abs(this.velY) < 0.00002) this.velY = 0;
      if (Math.abs(this.velX) < 0.00002) this.velX = 0;

      // idle spin fades back in as the throw dies out
      const settled = 1 - Math.min(1, Math.abs(this.velY) / 0.006);
      this.rotY += this.autoSpeed * dt * settled;

      // and the tilt eases home so the globe never rests at a broken angle
      this.rotX += (this.restTiltX - this.rotX) * 0.006 * settled;
    }

    // pointer parallax, eased. `_freeze` is an instrumentation hook: the
    // easing is asymptotic, so without it the scene drifts by sub-pixel amounts
    // forever and a stability test can never compare two identical frames.
    if (!this._freeze) {
      this.pointerLerp.x += (this.pointer.x - this.pointerLerp.x) * 0.045;
      this.pointerLerp.y += (this.pointer.y - this.pointerLerp.y) * 0.045;
    }

    const dive = this.dive;
    const diveEase = dive * dive * (3 - 2 * dive);

    this.globe.rotation.set(
      this.rotX + this.pointerLerp.y * 0.03,
      this.rotY + this.pointerLerp.x * 0.05,
      0
    );

    // descent: pull the camera toward the limb and let the atmosphere swell
    const near = this.baseDist * (this._fit || 1);
    const dist = THREE.MathUtils.lerp(near, R * 1.52, Math.pow(diveEase, 1.28));
    this.camera.position.set(0, 0, dist);
    this.camera.lookAt(0, 0, 0);

    this._applyViewOffset();

    this.bodyMat.uniforms.uDive.value = diveEase;
    this.atmoMat.uniforms.uDive.value = diveEase;
    this.rimMat.uniforms.uDive.value = diveEase;
    this.atmoMat.uniforms.uStrength.value = this.introP * (1 + diveEase * 1.6);
    this.rimMat.uniforms.uStrength.value = this.introP * (1 - diveEase * 0.35);

    // detail elements fall away as the frame fills with sky
    const detail = 1 - THREE.MathUtils.smoothstep(diveEase, 0.30, 0.72);
    this.arcs.setOpacity(detail);
    this.markerMat.uniforms.uOpacity.value =
      THREE.MathUtils.clamp((this.introP - 0.35) / 0.5, 0, 1) * detail;
    if (this.dotMat) this.dotMat.uniforms.uOpacity.value = 0.35 + 0.65 * detail;
    this.labels.setMaster(detail);

    this.bloom.strength = 0.62 + diveEase * 0.42;

    // slow star drift keeps the background alive
    this.stars.rotation.y = this.rotY * 0.18 + t * 0.0035;
    this.stars.rotation.x = this.rotX * 0.12;
    this.stars.material.uniforms.uTime.value = t;
    this.sky.material.uniforms.uOpacity.value = 1 - diveEase * 0.85;

    if (this.cityMat) {
      this.cityMat.uniforms.uOpacity.value =
        THREE.MathUtils.clamp((this.introP - 0.3) / 0.6, 0, 1) * detail;
    }
    this.arcs.update(t);

    this.camera.updateMatrixWorld();
    this.globe.updateMatrixWorld();
    this.labels.update(this.camera, this.globe.matrixWorld, this.size);

    this.composer.render();
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    window.removeEventListener('blur', this._onPointerUp);
    window.removeEventListener('resize', this._onResize);
    this.arcs?.dispose?.();
    this.labels?.dispose?.();
    this.composer?.dispose?.();
    this.renderer?.dispose?.();
    if (typeof window !== 'undefined' && window.__globe === this) delete window.__globe;
  }
}
