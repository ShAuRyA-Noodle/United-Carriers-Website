/* ============================================================================
   main — wiring. Boots the globe, runs the intro, hands scroll over to the
   descent, and keeps the mock telemetry ticking.
   ========================================================================= */

import gsap from 'gsap';
import { Globe } from './globe/Globe.js';
import { playIntro, bindDragHint, q } from './intro.js';
import { runLoader } from './loader.js';
import { initScroll } from './scroll.js';
import { initSections } from './sections.js';
import { HEADLINES, LANES } from './data/mock.js';

/* ─────────────────────────────  film grain  ───────────────────────────── */
/* generated once at runtime so there's no binary asset to ship */
function makeGrain() {
  const size = 180;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--grain-url', `url(${c.toDataURL()})`);
}

/* ─────────────────────────────  news ticker  ───────────────────────────── */
/* the source cycles one truncated headline at a time rather than marqueeing */
function startTicker() {
  const line = document.querySelector('#tickerLine');
  if (!line) return;

  let i = 0;
  const paint = (n) => {
    const h = HEADLINES[n];
    line.innerHTML = `<i>${h.tag}:</i> <b>${h.text}</b>`;
  };
  paint(0);

  let hovering = false;
  line.addEventListener('pointerenter', () => { hovering = true; });
  line.addEventListener('pointerleave', () => { hovering = false; });

  setInterval(() => {
    if (hovering || document.hidden) return;
    i = (i + 1) % HEADLINES.length;
    gsap.to(line, {
      y: '-110%',
      opacity: 0,
      duration: 0.42,
      ease: 'power3.in',
      onComplete: () => {
        paint(i);
        gsap.fromTo(line,
          { y: '110%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.6, ease: 'expo.out' });
      },
    });
  }, 5200);
}

/* ─────────────────────────────  lane telemetry  ───────────────────────────── */
function startTelemetry() {
  const lane = q('#readoutLane');
  const mode = q('#readoutMode');
  const eta = q('#readoutEta');
  const teu = q('#readoutTeu');
  if (!lane) return;

  let i = 0;

  /* Settles left to right over a short window. The charset is limited to the
     glyphs these fields actually use, so a caught mid-frame still reads as
     plausible telemetry rather than noise. */
  const scramble = (el, next) => {
    const pool = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const total = 9;
    let frame = 0;

    const step = () => {
      const settled = Math.floor((frame / total) * next.length);
      let out = '';
      for (let c = 0; c < next.length; c++) {
        const ch = next[c];
        if (c < settled || ch === ' ' || ch === ',' || ch === '\u2192' || ch === '\u2014') out += ch;
        else out += pool[(Math.random() * pool.length) | 0];
      }
      el.textContent = out;
      if (frame++ < total) requestAnimationFrame(step);
      else el.textContent = next;
    };
    step();
  };

  setInterval(() => {
    i = (i + 1) % LANES.length;
    const d = LANES[i];
    scramble(lane, d.lane);
    scramble(mode, d.mode);
    scramble(eta, d.eta);
    scramble(teu, d.teu);
  }, 4200);
}

/* ─────────────────────────────  mobile menu  ───────────────────────────── */
function bindBurger() {
  const burger = q('#navBurger');
  const menu = document.querySelector('.nav__menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));

    if (!open) {
      gsap.set(menu, {
        display: 'flex',
        position: 'fixed',
        inset: '0',
        zIndex: 40,
        margin: 0,
        padding: '18vh 8vw',
        gap: '2.4rem',
        background: 'rgba(2,3,6,0.94)',
        backdropFilter: 'blur(10px)',
      });
      gsap.fromTo(menu.children,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out' });
    } else {
      gsap.to(menu, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => gsap.set(menu, { clearProps: 'all' }),
      });
    }
  });
}

/* ─────────────────────────────  boot  ───────────────────────────── */
async function boot() {
  makeGrain();
  startTicker();
  bindBurger();
  initSections();

  const globe = new Globe(q('#globeCanvas'), q('#globeLabels'));
  globe.setIntro(0);
  bindDragHint(globe);

  // render loop starts immediately so the first painted frame is already live
  const loop = () => {
    globe.update();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // the hero is one screen of a very tall page — park the scene once it leaves
  const heroSticky = document.querySelector('#heroSticky');
  if (heroSticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => globe.setVisible(e.isIntersecting),
      { rootMargin: '120px 0px' }
    ).observe(heroSticky);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) globe.setVisible(false);
    else if (heroSticky) {
      const r = heroSticky.getBoundingClientRect();
      globe.setVisible(r.bottom > -120 && r.top < window.innerHeight + 120);
    }
  });

  // hold the page still while the intro plays, exactly as the source does —
  // it also keeps the descent timeline from capturing mid-intro start values
  document.body.classList.add('is-locked');

  await runLoader(globe.dotsReady);

  const intro = playIntro(globe);
  startTelemetry();

  intro.eventCallback('onComplete', () => {
    document.body.classList.remove('is-locked');
    initScroll(globe);
  });

  // fonts landing late can shift the pinned runway
  document.fonts?.ready.then(() => window.dispatchEvent(new Event('resize')));
}

boot();
