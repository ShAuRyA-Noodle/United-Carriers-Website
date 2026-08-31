import { ASSETS } from '../data/assets.js';

function makeRoad() {
  const road = document.createElement('div');
  road.className = 'reliability-road';
  road.setAttribute('aria-hidden', 'true');
  road.innerHTML = `
    <span class="reliability-road__line"></span>
    <img class="reliability-road__truck" src="${ASSETS['26b6ae8acf0aa553efea60b4e1e392fd-truck-top-view']}" alt="">
  `;
  return road;
}

function makeVoyage() {
  const scene = document.createElement('section');
  scene.className = 'ocean-voyage';
  scene.setAttribute('aria-label', 'Ocean freight voyage');
  scene.innerHTML = `
    <div class="ocean-voyage__sticky" aria-hidden="true">
      <img class="reliability-ocean" src="${ASSETS['a44825c5ffe02b6cfe7c994f6b46794b-ocean-1']}" alt="">
      <video class="reliability-wave" muted loop playsinline preload="metadata" poster="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-poster-0000000']}">
        <source src="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-webm']}" type="video/webm">
        <source src="${ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-mp4']}" type="video/mp4">
      </video>
      <div class="ocean-voyage__ship">
        <img class="reliability-ship" src="${ASSETS['home-ship']}" alt="">
        <img class="reliability-ship-tail" src="${ASSETS['home-ship-bot']}" alt="">
      </div>
      <div class="ocean-voyage__why">
        <span>Why us</span>
        <strong>Logistics<br>that works<br>as hard as<br>you do.</strong>
      </div>
      <img class="reliability-cloud reliability-cloud--left" src="${ASSETS['cloud-left']}" alt="">
      <img class="reliability-cloud reliability-cloud--right" src="${ASSETS['cloud-right']}" alt="">
    </div>`;
  return scene;
}

export function initReliability({ root = document, reducedMotion = false } = {}) {
  const grid = root.querySelector('.reliability-grid');
  const cards = [...(grid?.querySelectorAll('.reliability-card') ?? [])];
  if (!grid || !cards.length) return { destroy() {} };

  const road = makeRoad();
  grid.insertBefore(road, cards[0]);
  const voyage = makeVoyage();
  const reliabilityWrap = grid.parentElement;
  reliabilityWrap.after(voyage);
  grid.classList.add('reliability-module--enhanced');
  cards.forEach((card, index) => { card.dataset.reliabilityMilestone = String(index + 1); });

  let frame = 0;
  const video = voyage.querySelector('video');
  const update = () => {
    frame = 0;
    const roadRect = grid.getBoundingClientRect();
    const voyageRect = voyage.getBoundingClientRect();
    const view = window.innerHeight || 1;
    const roadProgress = Math.max(0, Math.min(1, (view * 0.55 - roadRect.top) / Math.max(roadRect.height - view * 0.45, 1)));
    const voyageProgress = Math.max(0, Math.min(1, -voyageRect.top / Math.max(voyageRect.height - view, 1)));
    grid.style.setProperty('--reliability-progress', String(roadProgress.toFixed(4)));
    voyage.style.setProperty('--voyage-progress', String(voyageProgress.toFixed(4)));
    grid.dataset.reliabilityStage = roadProgress >= 0.98 ? 'final' : String(Math.min(3, Math.floor(roadProgress * 3) + 1));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  let observer;
  if (reducedMotion) {
    grid.dataset.reliabilityStage = 'final';
    grid.style.setProperty('--reliability-progress', '1');
    voyage.style.setProperty('--voyage-progress', '0.5');
  } else {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? video.play().catch(() => {}) : video.pause(), { threshold: 0.05 });
      observer.observe(voyage);
    }
  }

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      video.pause();
      road.remove();
      voyage.remove();
      grid.classList.remove('reliability-module--enhanced');
      grid.style.removeProperty('--reliability-progress');
      delete grid.dataset.reliabilityStage;
      cards.forEach((card) => delete card.dataset.reliabilityMilestone);
    },
  };
}
