import gsap from 'gsap';
import { waitForCriticalMedia } from '../core/mediaReady.js';
import { LOADER_COUNTRIES, LOADER_SERVICES, NODES } from '../data/mock.js';
import { getLandMask } from '../globe/landMask.js';

const LAT_TOP = 84;
const LAT_BOTTOM = -58;

const q = (root, selector) => root.querySelector(selector);

function reducedMotionPreference() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function asMediaList(criticalReady) {
  const media = Array.isArray(criticalReady) ? criticalReady : [criticalReady];
  const fonts = document.fonts?.ready;
  return [...media.filter(Boolean), ...(fonts ? [fonts] : [])];
}

function setProgress(element, value) {
  if (!element) return;
  element.textContent = String(Math.round(value)).padStart(2, '0');
  element.setAttribute('aria-valuenow', String(Math.round(value)));
}

function startProgress(element, timeoutMs) {
  const startedAt = Date.now();
  let complete = false;
  const tick = () => {
    const elapsed = Date.now() - startedAt;
    const cap = complete ? 100 : 94;
    const target = complete ? 100 : Math.min(cap, (elapsed / Math.max(timeoutMs, 1)) * cap);
    setProgress(element, target);
  };

  tick();
  const timer = setInterval(tick, 50);

  return {
    complete() {
      complete = true;
      tick();
    },
    destroy() {
      clearInterval(timer);
    },
  };
}

function populateTrack(host, items) {
  if (!host) return [];
  const rows = [...items, ...items, ...items].map((item) => {
    const row = document.createElement('div');
    row.className = 'loader__item';
    row.textContent = item;
    host.appendChild(row);
    return row;
  });
  return rows;
}

function startRoulette(host, items, { direction, secondsPerRow }) {
  const rows = populateTrack(host, items);
  if (!host || !rows.length) return () => {};

  const tween = gsap.to(host, {
    yPercent: direction < 0 ? -33.333 : 33.333,
    duration: Math.max(1, items.length * secondsPerRow),
    ease: 'none',
    repeat: -1,
  });
  let current = 0;
  const pulse = setInterval(() => {
    rows.forEach((row) => row.classList.remove('is-hot'));
    rows[current % rows.length]?.classList.add('is-hot');
    current += 1;
  }, 650);

  return () => {
    tween.kill();
    clearInterval(pulse);
  };
}

function makeMapRenderer(canvas, mask) {
  if (!canvas?.getContext) return null;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;

  return (activeIds) => {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;

    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    context.clearRect(0, 0, width, height);
    const columns = Math.max(40, Math.round(width / 4));
    const rows = Math.max(20, Math.round(height / 4));
    context.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let row = 0; row < rows; row += 1) {
      const latitude = LAT_TOP - ((row + 0.5) / rows) * (LAT_TOP - LAT_BOTTOM);
      for (let column = 0; column < columns; column += 1) {
        const longitude = -180 + ((column + 0.5) / columns) * 360;
        if (!mask.isLand(longitude, latitude)) continue;
        context.fillRect((column / columns) * width, (row / rows) * height, 1, 1);
      }
    }

    for (const node of NODES) {
      const x = ((node.lon + 180) / 360) * width;
      const y = ((LAT_TOP - node.lat) / (LAT_TOP - LAT_BOTTOM)) * height;
      context.beginPath();
      context.fillStyle = activeIds.has(node.id) ? '#1a33ff' : 'rgba(255, 255, 255, 0.48)';
      context.arc(x, y, activeIds.has(node.id) ? 3 : 1.5, 0, Math.PI * 2);
      context.fill();
    }
  };
}

function startLocalMap(canvas) {
  if (!canvas || typeof requestAnimationFrame !== 'function') return () => {};
  let cancelled = false;
  let frame = 0;
  const activeIds = new Set();
  const rotate = setInterval(() => {
    activeIds.clear();
    NODES.slice(0, 4).forEach((_, index) => {
      activeIds.add(NODES[(index + Math.floor(Date.now() / 1150)) % NODES.length].id);
    });
  }, 1150);

  getLandMask()
    .then((mask) => {
      const render = makeMapRenderer(canvas, mask);
      if (!render || cancelled) return;
      const tick = () => {
        if (cancelled) return;
        render(activeIds);
        frame = requestAnimationFrame(tick);
      };
      tick();
    })
    .catch(() => {
      // The loader is an enhancement; a failed map must never block the hero.
    });

  return () => {
    cancelled = true;
    clearInterval(rotate);
    cancelAnimationFrame(frame);
  };
}

function waitForMinimumDuration(startedAt, minimumVisibleMs) {
  const remaining = Math.max(0, minimumVisibleMs - (Date.now() - startedAt));
  return remaining ? new Promise((resolve) => setTimeout(resolve, remaining)) : Promise.resolve();
}

function playExit(root, stage, reducedMotion) {
  if (reducedMotion) return Promise.resolve();

  return new Promise((resolve) => {
    const hole = { value: 0 };
    const timeline = gsap.timeline({ onComplete: resolve });
    timeline.to(stage, { opacity: 0, duration: 0.28, ease: 'power2.inOut' }, 0);
    timeline.to(hole, {
      value: 78,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: () => root.style.setProperty('--hole', `${hole.value}%`),
    }, 0.12);
    timeline.to(root, { opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.62);
  });
}

/**
 * Runs the loader against the existing #loader markup. It reports readiness
 * honestly (never 100 before all critical work settles or its bound expires)
 * and always releases the scroll lock in its cleanup path.
 */
export async function runLoader({
  root = document,
  criticalReady = [],
  timeoutMs = 5000,
  reducedMotion = reducedMotionPreference(),
  minimumVisibleMs = 900,
} = {}) {
  const loader = q(root, '#loader');
  const stage = q(root, '#loaderStage');
  const progressElement = q(root, '#loaderPct');

  if (!loader) return waitForCriticalMedia(asMediaList(criticalReady), timeoutMs);

  const startedAt = Date.now();
  const cleanups = [];
  const progress = startProgress(progressElement, timeoutMs);
  cleanups.push(() => progress.destroy());
  document.body.classList.add('is-locked');
  loader.setAttribute('aria-busy', 'true');

  try {
    if (!reducedMotion) {
      cleanups.push(startRoulette(q(root, '#loaderCountries'), LOADER_COUNTRIES, {
        direction: -1,
        secondsPerRow: 0.46,
      }));
      cleanups.push(startRoulette(q(root, '#loaderServices'), LOADER_SERVICES, {
        direction: 1,
        secondsPerRow: 0.58,
      }));
      cleanups.push(startLocalMap(q(root, '#loaderMap')));
    }

    const result = await waitForCriticalMedia(asMediaList(criticalReady), timeoutMs);
    progress.complete();
    if (!reducedMotion) {
      await waitForMinimumDuration(startedAt, minimumVisibleMs);
      await playExit(loader, stage, reducedMotion);
    }
    return result;
  } finally {
    cleanups.reverse().forEach((cleanup) => cleanup());
    stage && (stage.hidden = true);
    loader.classList.add('is-gone');
    loader.removeAttribute('aria-busy');
    document.body.classList.remove('is-locked');
  }
}
