/* ============================================================================
   loader — three-phase boot sequence.

   1. network manifest : wordmark, country/service roulettes, dotted world map,
                         progress counter gated on real readiness
   2. centring         : the wordmark flies to dead centre inside four
                         concentric hairline rings
   3. wipe             : a circular hole opens from the centre onto the hero
   ========================================================================= */

import gsap from 'gsap';
import { getLandMask } from './globe/landMask.js';
import { LOADER_COUNTRIES, LOADER_SERVICES, NODES } from './data/mock.js';

const q = (s) => document.querySelector(s);

/* map framing — Antarctica trimmed, the way dotted world maps are usually cut */
const LAT_TOP = 84;
const LAT_BOT = -58;
const DOT_PITCH = 3.55;   // css px between dot centres

/* ─────────────────────────────  roulettes  ───────────────────────────── */

function buildTrack(host, items, rowRem) {
  // three passes so the wrap point is never on screen
  const html = [...items, ...items, ...items]
    .map((t) => `<div class="loader__item">${t}</div>`)
    .join('');
  host.innerHTML = html;
  return {
    el: host,
    rows: items.length,
    rowPx: rowRem * parseFloat(getComputedStyle(document.documentElement).fontSize),
  };
}

function runTrack(track, { direction = -1, secondsPerRow = 0.42 } = {}) {
  const span = track.rows * track.rowPx;
  const from = direction < 0 ? 0 : -span;
  const to = direction < 0 ? -span : 0;

  gsap.set(track.el, { y: from });
  return gsap.to(track.el, {
    y: to,
    duration: track.rows * secondsPerRow,
    ease: 'none',
    repeat: -1,
    onRepeat: () => gsap.set(track.el, { y: from }),
  });
}

/** Lights one row at a time so the lists feel like they're resolving. */
function pulseRows(host, period = 620) {
  const rows = [...host.children];
  let i = 0;
  return setInterval(() => {
    rows.forEach((r) => r.classList.remove('is-hot'));
    const a = rows[i % rows.length];
    if (a) a.classList.add('is-hot');
    i += 1 + ((Math.random() * 2) | 0);
  }, period);
}

/* ─────────────────────────────  dotted world map  ───────────────────────────── */

/**
 * The land field never changes, so it is rasterised once to an offscreen
 * canvas and blitted thereafter. Rebuilding it per frame meant ~11,500
 * point-in-land tests plus fillRects every tick, which — stacked on top of the
 * globe's render loop — dragged the whole loader down to a few frames a second.
 */
function buildStaticMap(mask, w, h, dpr) {
  const off = document.createElement('canvas');
  off.width = Math.round(w * dpr);
  off.height = Math.round(h * dpr);
  const ctx = off.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cols = Math.max(40, Math.round(w / DOT_PITCH));
  const rows = Math.max(20, Math.round(h / DOT_PITCH));
  const size = Math.max(1, DOT_PITCH * 0.42);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.17)';
  for (let r = 0; r < rows; r++) {
    const lat = LAT_TOP - ((r + 0.5) / rows) * (LAT_TOP - LAT_BOT);
    const y = ((r + 0.5) / rows) * h;
    for (let c = 0; c < cols; c++) {
      const lon = -180 + ((c + 0.5) / cols) * 360;
      if (!mask.isLand(lon, lat)) continue;
      ctx.fillRect(((c + 0.5) / cols) * w - size / 2, y - size / 2, size, size);
    }
  }
  return off;
}

function makeMapRenderer(canvas, mask) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let statik = null;
  let ctx = null;

  return function render(t, activeIds) {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;

    if (cw !== w || ch !== h || !statik) {
      w = cw; h = ch;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext('2d');
      statik = buildStaticMap(mask, w, h, dpr);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(statik, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const project = (lat, lon) => [
      ((lon + 180) / 360) * w,
      ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * h,
    ];

    for (const n of NODES) {
      const [x, y] = project(n.lat, n.lon);

      if (activeIds.has(n.id)) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 4.4 + n.lat);
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 22, 203, ${0.18 + 0.22 * pulse})`;
        ctx.arc(x, y, 4.5 + pulse * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#1a33ff';
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
}

/* ─────────────────────────────  sequence  ───────────────────────────── */

/**
 * @param {Promise<any>} ready resolves once the globe geometry is built
 * @returns {Promise<void>} resolves when the wipe has opened
 */
export async function runLoader(ready) {
  const root = q('#loader');
  const mark = q('#loaderMark');
  const pctEl = q('#loaderPct');
  const stage = q('#loaderStage');
  const mapEl = q('#loaderMap');
  const rings = [...document.querySelectorAll('#loaderRings i')];
  const wipes = [...document.querySelectorAll('#loaderWipe i')];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const countries = buildTrack(q('#loaderCountries'), LOADER_COUNTRIES, 1.4);
  const services = buildTrack(q('#loaderServices'), LOADER_SERVICES, 1.4);

  const spins = [
    runTrack(countries, { direction: -1, secondsPerRow: 0.46 }),
    runTrack(services, { direction: 1, secondsPerRow: 0.58 }),
  ];
  const pulses = [pulseRows(countries.el, 640), pulseRows(services.el, 820)];

  /* map render loop */
  let mapRaf = 0;
  let mask = null;
  const activeIds = new Set();
  const rotateActive = setInterval(() => {
    activeIds.clear();
    for (let i = 0; i < 4; i++) {
      activeIds.add(NODES[(Math.random() * NODES.length) | 0].id);
    }
  }, 1150);

  getLandMask().then((m) => {
    mask = m;
    const render = makeMapRenderer(mapEl, mask);
    const t0 = performance.now();
    let last = 0;
    const tick = () => {
      const now = performance.now();
      if (now - last > 33) {          // the markers only pulse; 30fps is plenty
        last = now;
        render((now - t0) / 1000, activeIds);
      }
      mapRaf = requestAnimationFrame(tick);
    };
    tick();
  });

  /* Progress is gated on real readiness, but on a warm cache everything
     resolves almost instantly and the whole sequence would flash past. A floor
     keeps the manifest on screen long enough to read. */
  const MIN_PHASE_1 = 5200;
  const startedAt = performance.now();

  let assetsDone = false;
  Promise.all([ready, document.fonts ? document.fonts.ready : Promise.resolve()])
    .then(() => { assetsDone = true; });

  await new Promise((resolve) => {
    let shown = 0;
    let target = 0;
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      const elapsed = now - startedAt;
      // paced target rises past 100 so it can actually reach the cap; the cap
      // is what holds it at 94 until the real work is done
      const paced = (elapsed / MIN_PHASE_1) * 100;
      const cap = assetsDone ? 100 : 94;
      target = Math.min(cap, Math.max(target, paced));
      // time-based easing: frame-count easing stalls the counter whenever the
      // frame rate dips, which is exactly when it must not stall
      const k = 1 - Math.pow(0.0001, Math.min(0.05, (now - lastTick) / 1000));
      lastTick = now;
      shown += (target - shown) * k;
      pctEl.textContent = String(Math.min(100, Math.round(shown))).padStart(2, '0');
      if (assetsDone && elapsed >= MIN_PHASE_1 && shown > 99.2) {
        pctEl.textContent = '100';
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  const stop = () => {
    spins.forEach((s) => s.kill());
    pulses.forEach((p) => clearInterval(p));
    clearInterval(rotateActive);
    cancelAnimationFrame(mapRaf);
  };

  if (reduced) {
    stop();
    root.classList.add('is-gone');
    return;
  }

  /* ── phase 2: centre the wordmark inside the rings ── */
  const markRect = mark.getBoundingClientRect();
  const dx = window.innerWidth / 2 - (markRect.left + markRect.width / 2);
  const dy = window.innerHeight / 2 - (markRect.top + markRect.height / 2);

  const tl = gsap.timeline();

  tl.to([q('.loader__body'), mapEl, q('.loader__pct')], {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: stop,
  }, 0.5);

  tl.to(mark, {
    x: dx,
    y: dy,
    duration: 1.0,
    ease: 'expo.inOut',
  }, 0.66);

  tl.to(rings, {
    opacity: 1,
    scale: 1,
    duration: 1.15,
    ease: 'expo.out',
    stagger: 0.09,
  }, 1.0);

  /* ── phase 3: circular wipe onto the hero ── */
  const hole = { v: 0 };
  tl.to(hole, {
    v: 78,
    duration: 1.35,
    ease: 'power2.inOut',
    onUpdate: () => root.style.setProperty('--hole', `${hole.v}%`),
  }, 2.35);

  tl.to(mark, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.45);
  tl.to(rings, { opacity: 0, duration: 0.5, ease: 'power2.in', stagger: 0.04 }, 2.5);

  // two hairlines running just ahead of the hole
  const span = Math.hypot(window.innerWidth, window.innerHeight) * 1.25;
  wipes.forEach((el, i) => {
    tl.fromTo(el,
      { opacity: 0.7, width: 2, height: 2 },
      {
        opacity: 0,
        width: span,
        height: span,
        duration: 1.15,
        ease: 'power2.out',
      }, 2.34 + i * 0.11);
  });

  await tl.then();
  root.classList.add('is-gone');
  stage.style.display = 'none';
}
