/* ============================================================================
   scroll — smooth scrolling plus the scrubbed descent: the camera falls toward
   the limb, the hero furniture clears out, and the atmosphere floods the frame
   before handing off to the white section below.
   ========================================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function initScroll(globe) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── smooth scroll, wired into ScrollTrigger's ticker ── */
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ── descent scrub ── */
  const heroCopy = document.querySelector('#heroCopy');
  const sky = document.querySelector('#descentSky');
  const white = document.querySelector('#descentWhite');
  const warm = document.querySelector('#bloomWarm');
  const cool = document.querySelector('#bloomCool');
  const cue = document.querySelector('.scrollcue');
  const readout = document.querySelector('#readout');
  const drag = document.querySelector('#dragHint');
  const rail = document.querySelector('.rail');
  const nav = document.querySelector('.nav');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: reduced ? true : 0.6,
    },
  });

  // hero furniture clears out early
  tl.to(heroCopy, { y: -110, opacity: 0, ease: 'none', duration: 0.32 }, 0)
    .to([cue, drag], { opacity: 0, ease: 'none', duration: 0.14 }, 0)
    .to(readout, { opacity: 0, y: 16, ease: 'none', duration: 0.18 }, 0.02)
    .to([rail, nav], { opacity: 0, y: -18, ease: 'none', duration: 0.24 }, 0.04);

  // camera descent
  tl.to(globe, {
    dive: 1,
    ease: 'none',
    duration: 0.92,
    onUpdate: () => globe.setDive(globe.dive),
  }, 0.05);

  // DOM bloom swells then blows out as we pass through the limb
  tl.to(warm, { opacity: 1.35, scale: 1.5, ease: 'none', duration: 0.5 }, 0.05)
    .to(warm, { opacity: 0, ease: 'none', duration: 0.26 }, 0.64)
    .to(cool, { opacity: 1.5, scale: 1.9, ease: 'none', duration: 0.62 }, 0.05)
    .to(cool, { opacity: 0, ease: 'none', duration: 0.18 }, 0.8);

  // atmosphere floods the frame
  tl.fromTo(sky,
    { opacity: 0, scale: 1.3 },
    { opacity: 1, scale: 1, ease: 'none', duration: 0.34 }, 0.62);

  // and finally blows out to the white section below
  tl.to(white, { opacity: 1, ease: 'none', duration: 0.1 }, 0.92);

  ScrollTrigger.refresh();

  return {
    lenis,
    refresh: () => ScrollTrigger.refresh(),
    destroy: () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      lenis?.destroy();
    },
  };
}
