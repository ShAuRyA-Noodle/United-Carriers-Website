/* ============================================================================
   main — bootstrap. The hero controller owns the WebGL scene and frame loop;
   this module only coordinates page-level readiness and section startup.
   ========================================================================= */

import gsap from 'gsap';
import { initBenefits } from './components/benefits.js';
import { initFreightScene } from './components/freightScene.js';
import { bindHeroVisibility, initHero } from './components/hero.js';
import { runLoader } from './components/loader.js';
import { initNavigation } from './components/navigation.js';
import { initReliability } from './components/reliability.js';
import { initServices } from './components/services.js';
import { initTestimonials } from './components/testimonials.js';
import { installStudyLinkInterception } from './core/inertLinks.js';
import { lifecycle, motionPreferences } from './core/motion.js';
import { initScroll } from './scroll.js';
import { initSections } from './sections.js';
import { HEADLINES } from './data/mock.js';
import './styles/services-reliability.css';

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

/* ─────────────────────────────  boot  ───────────────────────────── */
async function boot() {
  makeGrain();
  startTicker();
  initSections();
  const navigation = initNavigation();
  const removeStudyLinkInterception = installStudyLinkInterception(document);

  const { reduced } = motionPreferences();
  const freightScene = initFreightScene(q('#freightScene'), { reducedMotion: reduced });
  const services = initServices({ reducedMotion: reduced });
  const reliability = initReliability({ reducedMotion: reduced });
  const benefits = initBenefits({ reducedMotion: reduced });
  const testimonials = initTestimonials({ reducedMotion: reduced });
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
    freightScene,
    services,
    reliability,
    benefits,
    testimonials,
    { destroy: navigation.destroy },
    { destroy: removeStudyLinkInterception },
    { destroy: () => scroll?.destroy() },
  );
  window.addEventListener('pagehide', () => {
    pageIsClosing = true;
    destroy();
  }, { once: true });

  const finishIntro = () => {
    if (pageIsClosing) return;
    document.body.classList.remove('is-locked');
    scroll ??= initScroll(hero);
    document.fonts?.ready.then(() => {
      if (!pageIsClosing) window.dispatchEvent(new Event('resize'));
    });
  };

  try {
    await runLoader({ criticalReady: [hero.ready], reducedMotion: reduced });
    // The loader releases its own lock. Re-lock for the globe's opening
    // timeline, then hand scrolling to Lenis when that timeline completes.
    document.body.classList.add('is-locked');
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
