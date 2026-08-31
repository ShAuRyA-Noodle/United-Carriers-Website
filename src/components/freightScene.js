import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ASSETS } from '../data/assets.js';
import '../styles/freight-scene.css';

// ScrollTrigger accesses matchMedia during registration; defer it in DOM test
// environments that intentionally omit that browser API.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const select = (root, name) => root?.querySelector(`[data-freight="${name}"]`) ?? null;

const sceneParts = (root) => ({
  craneBase: select(root, 'crane-base'),
  craneLift: select(root, 'crane-lift'),
  craneTop: select(root, 'crane-top'),
  craneBottom: select(root, 'crane-bottom'),
  containerWhite: select(root, 'container-white'),
  containerBlue: select(root, 'container-blue'),
  containerOrange: select(root, 'container-orange'),
  truckFull: select(root, 'truck-full'),
  truckCab: select(root, 'truck-cab'),
  truckContainer: select(root, 'truck-container'),
  wheels: ['wheel-front', 'wheel-rear', 'wheel-rear-2', 'wheel-rear-3', 'wheel-rear-4']
    .map((name) => select(root, name)).filter(Boolean),
});

function hydrateSourceImages(root) {
  root?.querySelectorAll('[data-freight-asset]').forEach((media) => {
    const source = ASSETS[media.dataset.freightAsset];
    if (!source) return;

    if (media instanceof HTMLImageElement || media instanceof HTMLVideoElement) media.src = source;
    else media.style.setProperty('--freight-asset', `url("${source}")`);
  });
}

function setOpacity(element, value) {
  if (element) element.style.opacity = String(value);
}

/**
 * Places the isolated source layers in the source-equivalent resolved frame.
 * It is intentionally callable without a timeline for reduced motion, mobile,
 * and lifecycle teardown.
 */
export function setFreightSceneFinalState(root) {
  if (!root) return;
  hydrateSourceImages(root);
  const parts = sceneParts(root);
  root.classList.add('freight-scene--final');

  setOpacity(parts.craneBase, 0);
  setOpacity(parts.craneLift, 0);
  setOpacity(parts.containerWhite, 0);
  setOpacity(parts.containerBlue, 0);
  setOpacity(parts.containerOrange, 0);
  setOpacity(parts.craneTop, 0);
  setOpacity(parts.craneBottom, 0);
  setOpacity(parts.truckFull, 0);
  setOpacity(parts.truckCab, 1);
  setOpacity(parts.truckContainer, 1);
  parts.wheels.forEach((wheel) => {
    wheel.style.opacity = '1';
    wheel.style.transform = 'rotate(360deg)';
  });
}

function prepareDesktopFrame(root) {
  const parts = sceneParts(root);
  root.classList.remove('freight-scene--final');

  gsap.set(parts.craneBase, { autoAlpha: 1, xPercent: -34, yPercent: 24, scale: 0.78 });
  gsap.set(parts.craneLift, { autoAlpha: 0, xPercent: 22, yPercent: -14, scale: 0.9 });
  gsap.set(parts.craneTop, { autoAlpha: 0, yPercent: -85 });
  gsap.set(parts.craneBottom, { autoAlpha: 0, yPercent: 85 });
  gsap.set(parts.containerWhite, { autoAlpha: 0, xPercent: 92, yPercent: -18, rotate: -4 });
  gsap.set(parts.containerBlue, { autoAlpha: 0, xPercent: -82, yPercent: 28, rotate: 5 });
  gsap.set(parts.containerOrange, { autoAlpha: 0, xPercent: 68, yPercent: 44, rotate: -6 });
  gsap.set(parts.truckFull, { autoAlpha: 0, xPercent: -18, scale: 0.95 });
  gsap.set([parts.truckCab, parts.truckContainer, ...parts.wheels], { autoAlpha: 0 });
  gsap.set(parts.truckCab, { xPercent: -38 });
  gsap.set(parts.truckContainer, { xPercent: 44 });
  gsap.set(parts.wheels, { rotate: -180, scale: 0.7 });

  return parts;
}

/**
 * Owns the high-contrast pinned industrial handoff. The markup is deliberately
 * simple: every art layer is a `data-freight` node, while data-freight-asset
 * maps it to the audited local source registry.
 */
export function initFreightScene(root, { reducedMotion = false } = {}) {
  if (!root) return { destroy() {} };
  hydrateSourceImages(root);

  const mobile = window.matchMedia?.('(max-width: 767px)').matches ?? false;
  if (reducedMotion || mobile) {
    setFreightSceneFinalState(root);
    return { destroy() {} };
  }

  const parts = prepareDesktopFrame(root);
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.65,
      pin: root.querySelector('[data-freight-stage]') ?? root,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  timeline
    .to(parts.craneBase, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.24 }, 0)
    .to(parts.craneLift, { autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1, duration: 0.2 }, 0.14)
    .to(parts.containerWhite, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: 0, duration: 0.2 }, 0.2)
    .to(parts.containerBlue, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: 0, duration: 0.2 }, 0.28)
    .to(parts.containerOrange, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: 0, duration: 0.2 }, 0.36)
    .to([parts.craneBase, parts.craneLift, parts.containerWhite, parts.containerBlue, parts.containerOrange], {
      xPercent: -18,
      autoAlpha: 0,
      duration: 0.15,
    }, 0.53)
    .to(parts.craneTop, { autoAlpha: 1, yPercent: 0, duration: 0.14 }, 0.48)
    .to(parts.craneBottom, { autoAlpha: 1, yPercent: 0, duration: 0.14 }, 0.51)
    .to([parts.craneTop, parts.craneBottom], { autoAlpha: 0, duration: 0.12 }, 0.66)
    .to(parts.truckFull, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.2 }, 0.64)
    .to(parts.truckFull, { autoAlpha: 0, duration: 0.1 }, 0.81)
    .to(parts.truckCab, { autoAlpha: 1, xPercent: 0, duration: 0.15 }, 0.81)
    .to(parts.truckContainer, { autoAlpha: 1, xPercent: 0, duration: 0.15 }, 0.83)
    .to(parts.wheels, { autoAlpha: 1, rotate: 0, scale: 1, stagger: 0.025, duration: 0.15 }, 0.85);

  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.killTweensOf(Object.values(parts).flat());
      setFreightSceneFinalState(root);
    },
  };
}
