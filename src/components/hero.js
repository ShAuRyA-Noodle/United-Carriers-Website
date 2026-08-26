import { Globe } from '../globe/Globe.js';
import { playIntro as createIntro } from '../intro.js';

function revealStaticHero(root, canvas, labels) {
  root?.classList.add('hero--fallback');
  canvas?.classList.add('hero__canvas--fallback');
  labels?.setAttribute('hidden', '');
  root?.querySelectorAll('.mask__i').forEach((line) => {
    line.style.transform = 'translate3d(0, 0, 0)';
  });
  root?.querySelectorAll('[data-intro], .nav__logo, .nav__link, .nav__cta, .hero__actions')
    .forEach((element) => {
      element.style.opacity = '1';
    });
}

function makeInert(root) {
  const preventNavigation = (event) => event.preventDefault();
  const links = [...(root?.querySelectorAll('a[href]') ?? [])];
  links.forEach((link) => link.addEventListener('click', preventNavigation));

  return () => links.forEach((link) => link.removeEventListener('click', preventNavigation));
}

/**
 * Keeps the renderer dormant unless its sticky stage is both on screen and the
 * document is visible. The observer is deliberately owned by the hero boundary
 * so its listeners leave with the renderer.
 */
export function bindHeroVisibility(hero, target) {
  let destroyed = false;
  let observer = null;

  const isNearViewport = () => {
    if (!target) return true;
    const rect = target.getBoundingClientRect();
    return rect.bottom > -120 && rect.top < window.innerHeight + 120;
  };

  let intersecting = isNearViewport();
  const apply = () => hero?.setVisible?.(!document.hidden && intersecting);
  const onDocumentVisibility = () => {
    if (!document.hidden) intersecting = isNearViewport();
    apply();
  };

  if (target && typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        intersecting = entry.isIntersecting;
        apply();
      },
      { rootMargin: '120px 0px' },
    );
    observer.observe(target);
  }

  document.addEventListener('visibilitychange', onDocumentVisibility);
  apply();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onDocumentVisibility);
    },
  };
}

/**
 * Owns the globe lifecycle for the hero. The renderer itself retains all scene,
 * drag, DPR and projection logic; this boundary only decides when it may work.
 */
export async function initHero({ canvas, labels, reducedMotion = false, readyTimeoutMs = 5000 }) {
  const root = canvas?.closest('.hero') ?? labels?.closest('.hero');
  const removeInertLinks = makeInert(root);
  let frame = 0;
  let globe;
  let visible = true;
  let destroyed = false;
  let fallback = false;
  let globeDisposed = false;

  const stop = () => {
    visible = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const disposeGlobe = () => {
    if (!globe || globeDisposed) return;
    globeDisposed = true;
    globe.dispose();
  };

  const useFallback = () => {
    if (fallback) return;
    fallback = true;
    stop();
    globe?.setVisible?.(false);
    disposeGlobe();
    revealStaticHero(root, canvas, labels);
  };

  try {
    globe = new Globe(canvas, labels);
    globe.setIntro(reducedMotion ? 1 : 0);
  } catch {
    useFallback();
    return {
      ready: Promise.resolve(),
      setVisible: () => {},
      setDive: () => {},
      playIntro: () => null,
      destroy: () => {
        destroyed = true;
        removeInertLinks();
      },
    };
  }

  const render = () => {
    if (destroyed) return;
    if (visible) globe.update();
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  const ready = new Promise((resolve) => {
    let settled = false;
    let timeout;
    const finish = (shouldFallback) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (shouldFallback) useFallback();
      resolve();
    };

    timeout = window.setTimeout(() => finish(true), readyTimeoutMs);
    Promise.resolve(globe.dotsReady).then(
      () => finish(false),
      () => finish(true),
    );
  });

  return {
    ready,
    setVisible(next) {
      visible = Boolean(next);
      if (!fallback) globe.setVisible(visible);
    },
    setDive(progress) {
      globe.setDive?.(progress);
    },
    playIntro() {
      return fallback ? null : createIntro(globe);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      removeInertLinks();
      disposeGlobe();
    },
  };
}
