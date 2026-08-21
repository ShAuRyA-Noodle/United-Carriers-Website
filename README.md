# Meridian Carriers — hero study

A fan-made rebuild of a dotted-globe logistics hero: WebGL planet, scroll-driven
atmospheric descent, and the surrounding page chrome. Written from scratch —
no source bundle, fonts, images or video were taken from the site it studies.
Brand, copy, routes, headlines and telemetry are all invented.

## Run

```bash
npm run dev      # http://localhost:5180
npm run build    # dist/
npm run preview
```

## What's in the hero

**Globe (`src/globe/`)**

| Piece | How it works |
|---|---|
| Dotted continents | `land-110m.json` (Natural Earth, public domain) rasterised to a 2048×1024 equirect alpha bitmap, then sampled on 200 latitude rows with a per-row longitude count proportional to cos(lat). Even spacing on the sphere, visible rows, O(1) land test per dot |
| Coastline accent | Dots with fewer than 4 land neighbours render slightly larger and brighter |
| Port beacons | Warm pinpricks scattered along coastline, brightest on the unlit side |
| Planet body | Custom shader: near-black night side, sunrise crescent from `pow(lambert, 2.6) * pow(fresnel, 4.2)`, blue scattering weighted to the anti-sun limb |
| Terminator rim | Its own additive back-side shell at 1.034R, sun-masked, so warm and cool never composite into magenta |
| Atmosphere | Wide additive shell at 1.24R, suppressed wherever the rim burns warm |
| Shell falloff | A back-side shell only draws the annulus between the planet's silhouette and its own, where `1 - abs(dot(n,v))` runs *upward* toward the outer edge — driving brightness off it directly lights the wrong edge and reads as a detached ring. Both shells remap it to `t = (1 - limb) / uInner`, so the glow is densest hard against the limb |
| Trade lanes | Lifted great-circle tubes with a travelling pulse head, comet tail, and staggered draw-on |
| Labels | DOM chips re-projected each frame — crisp mono type, hidden on the far hemisphere, faded by screen-edge guards so they never hit the rail or CTA |
| Starfield + dust | 2.6k additive points plus an fbm-noise backdrop sphere |
| Post | `UnrealBloomPass`, strength ramps during the descent |
| Input | Direct-drive orbit: pointer delta rotates the globe 1:1 while held, the smoothed last delta becomes release velocity, and inertia is clamped and decays into the idle spin so a hard flick can never leave it spinning away. Taps under 6px are not treated as throws |

**Placement.** The planet is framed with an off-axis frustum
(`camera.setViewOffset`) rather than a positioned canvas, so it sits
right-of-centre on desktop and high-centre on phones while staying a true 3D
scene the descent can fly through. Silhouette size uses `R / sin(fov/2)`, which
is the correct fit for a sphere's outline.

**Descent.** The hero is a 250vh runway with a sticky viewport. ScrollTrigger
scrubs one timeline: copy and chrome clear out, the camera falls from ~3.4R to
1.52R, DOM bloom layers swell and blow out, the atmosphere floods the frame,
then a white wipe hands off to the section below.

**Loader (`src/loader.js`).** Three phases:

1. *Network manifest* — wordmark, a dotted equirectangular world map with
   pulsing blue nodes, country and service roulettes counter-scrolling on either
   side, and a progress counter gated on real readiness (land mask +
   `document.fonts.ready`) rather than a fake timer.
2. *Centring* — the lists and map clear, the wordmark flies to dead centre and
   four concentric 1px hairline rings expand around it.
3. *Wipe* — an animated `mask-image` hole opens from the centre with two
   hairlines running just ahead of it, revealing the hero underneath.

**Intro.** Once the wipe finishes: dots sweep in by latitude, lanes draw on,
labels pop, line masks lift. Scroll is locked until it completes, which also
stops the descent timeline from capturing mid-intro start values.

## Notable fixes found while building

- **Antimeridian seam.** Land rings crossing ±180° arrive with longitude jumping
  +179 → −179. Projected naively that draws a line straight back across the
  canvas, which put horizontal streaks through the ocean on the loader map *and*
  false land dots on the globe. Each ring is now unwrapped into a continuous
  longitude run and drawn at −360 / 0 / +360.
- **Label roll.** The hover swap used a pseudo-element inside the element being
  translated, so it moved along with its parent and the label landed off-centre.
  Replaced with two stacked lines in a one-line clipping track.

## Substitutions

The original uses licensed faces (BT Steinhart / BT Steinhart Mono). This build
uses variable **Archivo** (`wdth` 106–118) and **Martian Mono** from Google
Fonts, with system Helvetica Neue for body copy.

## Notes

- `prefers-reduced-motion` disables auto-rotation, the marquee, ping rings, grain
  and smooth scrolling, and snaps the intro to its end state.
- Film grain is generated to a data URI at runtime, so there are no binary assets.
- DPR is clamped to 2.

## Stack

Vite · three 0.185 · GSAP 3.15 + ScrollTrigger · Lenis · topojson-client
