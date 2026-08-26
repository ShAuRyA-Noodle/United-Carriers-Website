/* ============================================================================
   main — bootstrap. The hero controller owns the WebGL scene and frame loop;
   this module only coordinates page-level readiness and section startup.
   ========================================================================= */

import gsap from 'gsap';
import { bindHeroVisibility, initHero } from './components/hero.js';
import { lifecycle, motionPreferences } from './core/motion.js';
import { runLoader } from './loader.js';
import { initScroll } from './scroll.js';
import { initSections } from './sections.js';
import { HEADLINES } from './data/mock.js';

const q = (selector, root = document) => root.querySelector(selector);

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

  const { reduced } = motionPreferences();
  const hero = await initHero({
    canvas: q('#globeCanvas'),
    labels: q('#globeLabels'),
    reducedMotion: reduced,
  });
  const visibility = bindHeroVisibility(hero, q('#heroSticky'));
  let scroll;
  let pageIsClosing = false;
  const destroy = lifecycle(
    hero,
    visibility,
    { destroy: () => scroll?.destroy() },
  );
  window.addEventListener('pagehide', () => {
    pageIsClosing = true;
    destroy();
  }, { once: true });

  // hold the page still while the intro plays, exactly as the source does —
  // it also keeps the descent timeline from capturing mid-intro start values
  document.body.classList.add('is-locked');

  const finishIntro = () => {
    if (pageIsClosing) return;
    document.body.classList.remove('is-locked');
    scroll ??= initScroll(hero);
    document.fonts?.ready.then(() => {
      if (!pageIsClosing) window.dispatchEvent(new Event('resize'));
    });
  };

  try {
    await runLoader(hero.ready);
    const intro = hero.playIntro();
    if (!intro || intro.totalDuration() === 0) finishIntro();
    else intro.eventCallback('onComplete', finishIntro);
  } catch {
    q('#loader')?.classList.add('is-gone');
    q('#loaderStage')?.style.setProperty('display', 'none');
    finishIntro();
  }
}

boot();
