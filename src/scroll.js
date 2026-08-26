/* ============================================================================
   scroll — smooth scrolling plus the scrubbed descent: the camera falls toward
   the limb, the hero furniture clears out, and the atmosphere floods the frame
   before handing off to the white section below.
   ========================================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(hero) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── smooth scroll, wired into ScrollTrigger's ticker ── */
  let lenis = null;
  let lenisTicker = null;
  if (!reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);
    lenisTicker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTicker);
    gsap.ticker.lagSmoothing(0);
  }

  /* ── descent scrub ── */
  const heroCopy = document.querySelector('#heroCopy');
  const sky = document.querySelector('#descentSky');
  const horizon = document.querySelector('#descentHorizon');
  const warm = document.querySelector('#bloomWarm');
  const cool = document.querySelector('#bloomCool');
  const cue = document.querySelector('.scrollcue');
  const rail = document.querySelector('.rail');
  const nav = document.querySelector('.nav');
  const state = { p: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduced ? true : 0.6,
    },
  });

  // hero furniture clears out first
  tl.to(state, {
    p: 1,
    ease: 'none',
    duration: 1,
    onUpdate: () => hero.setDive(state.p),
  }, 0)
    .to(heroCopy, { y: -140, opacity: 0, ease: 'none', duration: 0.30 }, 0)
    .to(cue, { opacity: 0, ease: 'none', duration: 0.12 }, 0)
    .to([rail, nav], { opacity: 0, y: -18, ease: 'none', duration: 0.22 }, 0.04);

  /* The atmospheric panel and globe descent advance together so the horizon
     crosses the frame as the blue/black atmosphere expands beneath it. */
  /* top:100% parks it below the fold; -100% of its own 220vh height lands the
     white bottom exactly across the viewport */
  tl.fromTo(sky,
    { yPercent: 0 },
    { yPercent: -100, ease: 'none', duration: 0.92 }, 0.08);

  // a horizon line runs just ahead of the panel's leading edge
  tl.fromTo(horizon,
    { y: 0, opacity: 0 },
    { opacity: 0.9, ease: 'none', duration: 0.08 }, 0.08)
    .to(horizon, { y: () => -window.innerHeight * 1.05, ease: 'none', duration: 0.5 }, 0.08)
    .to(horizon, { opacity: 0, ease: 'none', duration: 0.14 }, 0.5);

  // the globe's own glow swells slightly, then is simply covered over
  tl.to(warm, { opacity: 1.15, scale: 1.22, ease: 'none', duration: 0.42 }, 0.04)
    .to(cool, { opacity: 1.25, scale: 1.3, ease: 'none', duration: 0.5 }, 0.04);

  ScrollTrigger.refresh();

  return {
    lenis,
    refresh: () => ScrollTrigger.refresh(),
    destroy: () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenis?.destroy();
      hero.setDive(0);
    },
  };
}
