import { ASSETS } from '../data/assets.js';

function createScene() {
  const scene = document.createElement('div');
  scene.className = 'reliability-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `
    <img class="reliability-ocean" src="${ASSETS['a44825c5ffe02b6cfe7c994f6b-ocean-1']}" alt="">
    <video class="reliability-wave" muted loop playsinline preload="metadata" poster="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-poster-0000000']}">
      <source src="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-webm']}" type="video/webm">
      <source src="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-mp4']}" type="video/mp4">
    </video>
    <img class="reliability-ship reliability-ship--desktop" src="${ASSETS['home-ship']}" alt="">
    <img class="reliability-ship reliability-ship--mobile" src="${ASSETS['5fe1ad5b1eb8976490145b07d37337c5-home-ship-mb']}" alt="">
    <img class="reliability-ship-tail reliability-ship-tail--desktop" src="${ASSETS['home-ship-bot']}" alt="">
    <img class="reliability-ship-tail reliability-ship-tail--mobile" src="${ASSETS['99edc7aee5651267960c63b2edc940d5-home-ship-bot-mb']}" alt="">
    <img class="reliability-cloud reliability-cloud--left" src="${ASSETS['cloud-left']}" alt="">
    <img class="reliability-cloud reliability-cloud--right" src="${ASSETS['cloud-right']}" alt="">
    <img class="reliability-cloud reliability-cloud--bottom" src="${ASSETS['cloud-bottom']}" alt="">
  `;
  return scene;
}

/**
 * Adds the source ocean scene behind the three reliability milestones. The
 * desktop stage follows scroll progress; reduced motion renders the complete,
 * unpinned final composition.
 */
export function initReliability({ root = document, reducedMotion = false } = {}) {
  const grid = root.querySelector('.reliability-grid');
  const cards = grid ? [...grid.querySelectorAll('.reliability-card')] : [];
  if (!grid || cards.length === 0) return { destroy() {} };

  const scene = grid.querySelector('.reliability-scene') || createScene();
  if (!scene.isConnected) grid.insertBefore(scene, cards[0]);
  grid.classList.add('reliability-module--enhanced');
  grid.classList.toggle('reliability-module--reduced', reducedMotion);
  cards.forEach((card, index) => { card.dataset.reliabilityMilestone = String(index + 1); });

  let frame = 0;
  let observer;
  const video = scene.querySelector('video');
  const setStage = (stage) => {
    const final = stage === 'final';
    const index = final ? cards.length - 1 : stage;
    grid.dataset.reliabilityStage = final ? 'final' : String(index + 1);
    cards.forEach((card, cardIndex) => {
      card.dataset.reliabilityCurrent = String(final || cardIndex === index);
    });
  };

  const update = () => {
    frame = 0;
    const rect = grid.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = Math.max(0, Math.min(1, (viewport * 0.68 - rect.top) / Math.max(rect.height - viewport * 0.35, 1)));
    grid.style.setProperty('--reliability-progress', String(progress));
    setStage(Math.min(cards.length - 1, Math.floor(progress * cards.length)));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  if (reducedMotion) setStage('final');
  else {
    setStage(0);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    if (video && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else if (!video.paused) video.pause();
      }, { threshold: 0.05 });
      observer.observe(grid);
    }
  }

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      if (video && !video.paused) video.pause();
      scene.remove();
      grid.classList.remove('reliability-module--enhanced', 'reliability-module--reduced');
      delete grid.dataset.reliabilityStage;
      grid.style.removeProperty('--reliability-progress');
      cards.forEach((card) => {
        delete card.dataset.reliabilityMilestone;
        delete card.dataset.reliabilityCurrent;
      });
    },
  };
}
