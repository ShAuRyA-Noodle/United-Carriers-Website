/* ============================================================================
   sections.js — everything below the hero.

   Imagery is drawn procedurally as blueprint-style technical plates rather
   than dropped in as stock photography: it keeps the page self-contained and
   keeps the visual language consistent with the hero's dotted-map vocabulary.
   ========================================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INK = '#0b0d12';
const LINE = 'rgba(255,255,255,0.16)';
const LINE_SOFT = 'rgba(255,255,255,0.07)';
const HOT = '#ff5500';

/* ─────────────────────────────  plate drawing  ───────────────────────────── */

function baseGrid(ctx, w, h) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = LINE_SOFT;
  ctx.lineWidth = 1;
  const step = 28;
  ctx.beginPath();
  for (let x = step; x < w; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
  for (let y = step; y < h; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
  ctx.stroke();
}

function corner(ctx, w, h, label) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  const m = 16;
  const t = 14;
  ctx.beginPath();
  ctx.moveTo(m, m + t); ctx.lineTo(m, m); ctx.lineTo(m + t, m);
  ctx.moveTo(w - m - t, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + t);
  ctx.moveTo(m, h - m - t); ctx.lineTo(m, h - m); ctx.lineTo(m + t, h - m);
  ctx.moveTo(w - m - t, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - t);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  ctx.font = '500 11px "Martian Mono", monospace';
  ctx.fillText(label.toUpperCase(), m + 8, h - m - 10);
}

/** Smooth multi-lane ribbon — reads as an interchange / corridor. */
function drawInterchange(ctx, w, h) {
  baseGrid(ctx, w, h);
  for (let lane = 0; lane < 4; lane++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const t = x / w;
      const y = h * (0.30 + lane * 0.13)
        + Math.sin(t * Math.PI * 1.7 + lane * 0.7) * h * 0.14
        + Math.sin(t * Math.PI * 3.4 + lane) * h * 0.035;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lane === 1 ? 'rgba(255,85,0,0.85)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = lane === 1 ? 2 : 1;
    ctx.stroke();

    // vehicles riding the lane
    for (let k = 0; k < 7; k++) {
      const t = (k / 7 + lane * 0.13) % 1;
      const x = t * w;
      const y = h * (0.30 + lane * 0.13)
        + Math.sin(t * Math.PI * 1.7 + lane * 0.7) * h * 0.14
        + Math.sin(t * Math.PI * 3.4 + lane) * h * 0.035;
      ctx.fillStyle = lane === 1 ? HOT : 'rgba(255,255,255,0.55)';
      ctx.fillRect(x - 3, y - 1.5, 6, 3);
    }
  }
  corner(ctx, w, h, 'corridor / interchange');
}

/** Great-circle style arc field with a departure node. */
function drawAir(ctx, w, h) {
  baseGrid(ctx, w, h);
  const ox = w * 0.18;
  const oy = h * 0.74;
  for (let i = 0; i < 7; i++) {
    const tx = w * (0.42 + i * 0.09);
    const ty = h * (0.5 - i * 0.055);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo((ox + tx) / 2, oy - h * (0.34 + i * 0.05), tx, ty);
    ctx.strokeStyle = i === 2 ? 'rgba(255,85,0,0.9)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = i === 2 ? 2 : 1;
    ctx.stroke();
    ctx.fillStyle = i === 2 ? HOT : 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(tx, ty, i === 2 ? 3.6 : 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
  corner(ctx, w, h, 'air / uplift');
}

/** Stacked container bays in elevation. */
function drawStacks(ctx, w, h, label = 'ocean / fcl') {
  baseGrid(ctx, w, h);
  const cols = 13;
  const cw = (w - 80) / cols;
  const ch = cw * 0.52;
  for (let c = 0; c < cols; c++) {
    const tall = 3 + Math.round(Math.abs(Math.sin(c * 1.7)) * 5);
    for (let r = 0; r < tall; r++) {
      const x = 40 + c * cw;
      const y = h - 60 - (r + 1) * ch;
      const hot = (c * 7 + r * 3) % 17 === 0;
      ctx.fillStyle = hot ? 'rgba(255,85,0,0.85)' : `rgba(255,255,255,${0.08 + (r / tall) * 0.14})`;
      ctx.fillRect(x + 1, y + 1, cw - 3, ch - 3);
      ctx.strokeStyle = LINE;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 2, ch - 2);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.moveTo(30, h - 58.5); ctx.lineTo(w - 30, h - 58.5); ctx.stroke();
  corner(ctx, w, h, label);
}

/** Declaration form grid with a cleared stamp. */
function drawCustoms(ctx, w, h) {
  baseGrid(ctx, w, h);
  const x0 = w * 0.16, y0 = h * 0.16, ww = w * 0.68, hh = h * 0.68;
  ctx.strokeStyle = LINE;
  ctx.strokeRect(x0, y0, ww, hh);
  ctx.beginPath();
  for (let r = 1; r < 9; r++) { ctx.moveTo(x0, y0 + (hh / 9) * r); ctx.lineTo(x0 + ww, y0 + (hh / 9) * r); }
  ctx.moveTo(x0 + ww * 0.42, y0); ctx.lineTo(x0 + ww * 0.42, y0 + hh);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let r = 0; r < 9; r++) {
    const bw = ww * (0.12 + Math.abs(Math.sin(r * 2.1)) * 0.22);
    ctx.fillRect(x0 + 12, y0 + (hh / 9) * r + 8, bw, 4);
    ctx.fillRect(x0 + ww * 0.42 + 12, y0 + (hh / 9) * r + 8, bw * 0.7, 4);
  }
  ctx.save();
  ctx.translate(w * 0.72, h * 0.72);
  ctx.rotate(-0.22);
  ctx.strokeStyle = 'rgba(255,85,0,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-58, -20, 116, 40);
  ctx.fillStyle = HOT;
  ctx.font = '600 13px "Martian Mono", monospace';
  ctx.fillText('CLEARED', -42, 5);
  ctx.restore();
  corner(ctx, w, h, 'customs / entry');
}

/** Racking plan with pick path. */
function drawWarehouse(ctx, w, h) {
  baseGrid(ctx, w, h);
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y = h * 0.16 + r * (h * 0.68 / rows);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(w * 0.12, y, w * 0.34, h * 0.06);
    ctx.fillRect(w * 0.54, y, w * 0.34, h * 0.06);
    ctx.strokeStyle = LINE;
    ctx.strokeRect(w * 0.12, y, w * 0.34, h * 0.06);
    ctx.strokeRect(w * 0.54, y, w * 0.34, h * 0.06);
  }
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.9);
  ctx.lineTo(w * 0.5, h * 0.30);
  ctx.lineTo(w * 0.78, h * 0.30);
  ctx.lineTo(w * 0.78, h * 0.5);
  ctx.strokeStyle = HOT;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = HOT;
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.5, 4.5, 0, Math.PI * 2); ctx.fill();
  corner(ctx, w, h, 'warehouse / 3pl');
}

/** Heavy-lift rigging elevation. */
function drawProject(ctx, w, h) {
  baseGrid(ctx, w, h);
  const bx = w * 0.5, by = h * 0.7;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(bx - 110, by, 220, 70);
  ctx.strokeStyle = LINE; ctx.strokeRect(bx - 110, by, 220, 70);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, h * 0.12); ctx.lineTo(bx - 110, by);
  ctx.moveTo(bx, h * 0.12); ctx.lineTo(bx + 110, by);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx, h * 0.12); ctx.lineTo(bx, h * 0.04);
  ctx.strokeStyle = HOT; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = HOT;
  ctx.beginPath(); ctx.arc(bx, h * 0.12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx - 150, by + 70.5); ctx.lineTo(bx + 150, by + 70.5); ctx.stroke();
  corner(ctx, w, h, 'project / heavy lift');
}

/** Linehaul route with sequenced stops. */
function drawLand(ctx, w, h) {
  baseGrid(ctx, w, h);
  ctx.beginPath();
  for (let x = 0; x <= w; x += 5) {
    const t = x / w;
    const y = h * 0.55 + Math.sin(t * Math.PI * 2.1) * h * 0.2;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = HOT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([12, 10]);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let k = 0; k < 4; k++) {
    const t = 0.14 + k * 0.24;
    const x = t * w;
    const y = h * 0.55 + Math.sin(t * Math.PI * 2.1) * h * 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }
  corner(ctx, w, h, 'linehaul / final mile');
}

/** Fuel-curve plate for the market card. */
function drawBunker(ctx, w, h) {
  baseGrid(ctx, w, h);
  ctx.beginPath();
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const y = h * (0.72 - t * 0.34 + Math.sin(t * 9) * 0.06 + Math.sin(t * 21) * 0.025);
    pts.push([t * w, y]);
  }
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = HOT; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,85,0,0.28)');
  g.addColorStop(1, 'rgba(255,85,0,0)');
  ctx.fillStyle = g; ctx.fill();
  corner(ctx, w, h, 'bunker index');
}

/** Battery bank plan for the renewables card. */
function drawBattery(ctx, w, h) {
  baseGrid(ctx, w, h);
  const cols = 6, rows = 3;
  const cw = w * 0.7 / cols, chh = h * 0.5 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = w * 0.15 + c * cw, y = h * 0.25 + r * chh;
      const charge = (Math.sin(c * 1.3 + r * 2.1) + 1) / 2;
      ctx.strokeStyle = LINE;
      ctx.strokeRect(x + 3, y + 3, cw - 8, chh - 8);
      ctx.fillStyle = `rgba(255,85,0,${0.15 + charge * 0.6})`;
      ctx.fillRect(x + 5, y + chh - 7 - (chh - 14) * charge, cw - 12, (chh - 14) * charge);
    }
  }
  corner(ctx, w, h, 'grid-scale storage');
}

const PLATES = {
  interchange: drawInterchange,
  air: drawAir,
  ocean: (c, w, h) => drawStacks(c, w, h, 'ocean / fcl'),
  customs: drawCustoms,
  warehouse: drawWarehouse,
  project: drawProject,
  land: drawLand,
  containers: (c, w, h) => drawStacks(c, w, h, 'terminal yard'),
  bunker: drawBunker,
  truck: drawLand,
  battery: drawBattery,
};

function paintPlate(cv) {
  const fn = PLATES[cv.dataset.plate];
  if (!fn) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cv.clientWidth);
  const h = Math.round(cv.clientHeight);
  if (!w || !h) return;

  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fn(ctx, w, h);
  cv.dataset.painted = `${w}x${h}`;
}

function paintPlates() {
  document.querySelectorAll('[data-plate]').forEach(paintPlate);
}

/**
 * Plates are sized by aspect-ratio, so their box is not final at boot — a plate
 * painted then can end up drawn against the wrong height and come out blank.
 * Each one is repainted when it first scrolls in, and again if its box changed.
 */
function initPlateObserver() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const cv = e.target;
      const key = `${Math.round(cv.clientWidth)}x${Math.round(cv.clientHeight)}`;
      if (cv.dataset.painted !== key) paintPlate(cv);
    });
  }, { rootMargin: '200px 0px', threshold: 0 });

  document.querySelectorAll('[data-plate]').forEach((cv) => io.observe(cv));
}

/* ─────────────────────────────  reveals + counters  ───────────────────────────── */

function initReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      e.target.querySelectorAll('[data-count]').forEach(runCounter);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
}

function runCounter(el) {
  const to = parseFloat(el.dataset.count);
  const dp = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const obj = { v: 0 };
  gsap.to(obj, {
    v: to,
    duration: 2.1,
    ease: 'expo.out',
    onUpdate: () => {
      const n = dp ? obj.v.toFixed(dp) : Math.round(obj.v).toLocaleString('en-US');
      el.textContent = n + suffix;
    },
  });
}

/* ─────────────────────────────  services rail  ───────────────────────────── */

function initServiceRail() {
  const rail = document.querySelector('#svcRail');
  const bar = document.querySelector('#svcProgress');
  const svc = document.querySelector('.svc');
  if (!rail || !svc) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth + 64);

    const tween = gsap.to(rail, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: svc,
        start: 'center center',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (bar) bar.style.right = `${(1 - self.progress) * 100}%`;
        },
      },
    });
    return () => tween.scrollTrigger?.kill();
  });

  // on phones the rail is a plain horizontal swipe
  mm.add('(max-width: 760px)', () => {
    rail.style.overflowX = 'auto';
    rail.style.scrollSnapType = 'x mandatory';
    [...rail.children].forEach((c) => { c.style.scrollSnapAlign = 'center'; });
  });
}

/* ─────────────────────────────  testimonials  ───────────────────────────── */

function initTestimonials() {
  const track = document.querySelector('#testiTrack');
  const prev = document.querySelector('#testiPrev');
  const next = document.querySelector('#testiNext');
  if (!track) return;

  const cards = [...track.children];
  let i = 0;

  const perView = () => (window.innerWidth <= 760 ? 1 : window.innerWidth <= 1180 ? 2 : 3);
  const maxIndex = () => Math.max(0, cards.length - perView());

  const apply = () => {
    i = Math.min(i, maxIndex());
    const card = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.style.transform = `translate3d(${-i * (card + gap)}px,0,0)`;
    prev.disabled = i === 0;
    next.disabled = i >= maxIndex();
    [prev, next].forEach((b) => { b.style.opacity = b.disabled ? 0.3 : 1; });
  };

  prev.addEventListener('click', () => { i = Math.max(0, i - 1); apply(); });
  next.addEventListener('click', () => { i = Math.min(maxIndex(), i + 1); apply(); });
  window.addEventListener('resize', apply);
  apply();
}

/* ─────────────────────────────  partner marquees  ───────────────────────────── */

/* Invented carriers, terminals and agents — this is a study, not a real network. */
const PARTNERS_A = ['Kestrel Line', 'Ardent Terminals', 'Sable Maritime', 'Northwind Air Cargo',
  'Verity Customs', 'Portmark Group', 'Halden Shipping', 'Cinder Bay Terminal'];
const PARTNERS_B = ['Ridgeway Linehaul', 'Sundial Freight', 'Ostrom Bulk', 'Delta Nine Logistics',
  'Ironvale Rail', 'Quay & Meridian', 'Blackstone Wharf', 'Peregrine Charter'];

function fillMarquee(sel, names) {
  const track = document.querySelector(`${sel} .marquee__track`);
  if (!track) return;
  const html = [...names, ...names]
    .map((n) => `<span class="marquee__item">${n}</span>`).join('');
  track.innerHTML = html;
}

/* ─────────────────────────────  ambient canvases  ───────────────────────────── */

function initCtaCanvas() {
  const cv = document.querySelector('#ctaCanvas');
  if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let raf = 0;

  const size = () => {
    cv.width = Math.round(cv.clientWidth * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
  };
  size();
  window.addEventListener('resize', size);

  const nodes = Array.from({ length: 34 }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00012,
    vy: (Math.random() - 0.5) * 0.00012,
  }));

  const draw = () => {
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);

    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > 1) n.vx *= -1;
      if (n.y < 0 || n.y > 1) n.vy *= -1;
    });

    // link nearby nodes — a quiet network field behind the closing line
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = (nodes[a].x - nodes[b].x) * w;
        const dy = (nodes[a].y - nodes[b].y) * h;
        const d = Math.hypot(dx, dy);
        if (d > w * 0.13) continue;
        ctx.strokeStyle = `rgba(255,120,40,${(1 - d / (w * 0.13)) * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodes[a].x * w, nodes[a].y * h);
        ctx.lineTo(nodes[b].x * w, nodes[b].y * h);
        ctx.stroke();
      }
    }
    nodes.forEach((n) => {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(n.x * w, n.y * h, 1.6 * dpr, 0, Math.PI * 2); ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  };
  draw();

  // stop the loop whenever the band is off screen
  new IntersectionObserver((e) => {
    if (e[0].isIntersecting) { if (!raf) draw(); }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0 }).observe(cv);
}

function initFooterCanvas() {
  const cv = document.querySelector('#footCanvas');
  if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 900;
  const h = 180;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // a lane profile: origin, transit nodes, destination
  const stops = [0.04, 0.23, 0.41, 0.6, 0.79, 0.96];
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();

  stops.forEach((t, i) => {
    const x = t * w;
    const y = h * 0.5 - Math.sin(t * Math.PI) * h * 0.22;
    if (i) {
      const px = stops[i - 1] * w;
      const py = h * 0.5 - Math.sin(stops[i - 1] * Math.PI) * h * 0.22;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo((px + x) / 2, Math.min(py, y) - 26, x, y);
      ctx.strokeStyle = 'rgba(255,85,0,0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.fillStyle = i === 0 || i === stops.length - 1 ? HOT : 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(x, y, i === 0 || i === stops.length - 1 ? 4 : 2.6, 0, Math.PI * 2); ctx.fill();
  });
}

/* ─────────────────────────────  boot  ───────────────────────────── */

export function initSections() {
  fillMarquee('#marqueeA', PARTNERS_A);
  fillMarquee('#marqueeB', PARTNERS_B);

  paintPlates();
  initPlateObserver();
  initReveals();
  initCtaCanvas();
  initFooterCanvas();

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { paintPlates(); ScrollTrigger.refresh(); }, 180);
  });
}
