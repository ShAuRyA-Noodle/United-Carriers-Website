/* ============================================================================
   intro — the staged reveal of the globe and the hero furniture, played once
   the loader has wiped away.
   ========================================================================= */

import gsap from 'gsap';

const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => [...r.querySelectorAll(s)];

/**
 * Staged hero reveal. Returns the timeline so callers can await it.
 * @param {import('./globe/Globe.js').Globe} globe
 */
export function playIntro(globe) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { p: 0 };

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (reduced) {
    globe.setIntro(1);
    gsap.set('.mask__i', { y: '0%' });
    gsap.set('[data-intro], .nav__logo, .nav__link, .nav__cta, .hero__actions', { opacity: 1 });
    q('#dragHint').style.opacity = '1';
    return tl;
  }

  // globe materialises first — dots sweep in by latitude, then lanes draw on
  tl.to(state, {
    p: 1,
    duration: 3.1,
    ease: 'power2.inOut',
    onUpdate: () => globe.setIntro(state.p),
  }, 0);

  tl.to('.rail', { opacity: 1, duration: 1.1 }, 0.1);
  tl.to('.nav__logo', { opacity: 1, y: 0, duration: 1.2 }, 0.2);

  tl.fromTo('.nav__link',
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 1.0, stagger: 0.055 }, 0.34);

  tl.to('.nav__cta', { opacity: 1, duration: 1.0 }, 0.62);

  tl.to('.hero__eyebrow .mask__i', { y: '0%', duration: 1.15 }, 0.5);

  tl.to('.hero__title .mask__i',
    { y: '0%', duration: 1.35, stagger: 0.085 }, 0.6);

  tl.to('.hero__lede .mask__i',
    { y: '0%', duration: 1.05, stagger: 0.055 }, 0.95);

  tl.fromTo('.hero__actions',
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 1.1 }, 1.12);

  tl.fromTo('#readout',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 1.2 }, 1.35);

  tl.to('.scrollcue', { opacity: 1, duration: 1.0 }, 1.6);
  tl.to('#dragHint', { opacity: 1, duration: 1.0 }, 1.9);

  return tl;
}

/** Hides the drag hint once the user actually orbits the globe. */
export function bindDragHint(globe) {
  const hint = q('#dragHint');
  if (!hint) return;
  globe.onDragged = () => {
    gsap.to(hint, { opacity: 0, duration: 0.5, overwrite: true });
    globe.onDragged = null;
  };
}

export { q, qa };
