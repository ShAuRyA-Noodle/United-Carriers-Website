import { ASSETS } from '../data/assets.js';

const SERVICE_ICONS = Object.freeze({
  air: 'air-freight',
  ocean: 'sea-freight',
  customs: 'custom-brokerage',
  warehouse: 'warehousing-and-3pl',
  project: 'project-cargo',
  transport: 'domestic-interstate-transport',
});

function addIcon(card) {
  const media = card.querySelector('.svc__media');
  const key = SERVICE_ICONS[card.dataset.svc];
  if (!media || !key) return null;
  media.querySelector('canvas')?.setAttribute('hidden', '');
  const icon = document.createElement('img');
  icon.className = 'service-icon';
  icon.src = ASSETS[key];
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  media.append(icon);
  return icon;
}

export function initServices({ root = document, reducedMotion = false } = {}) {
  const section = root.querySelector('#services');
  const stage = section?.querySelector('.svc');
  const cards = [...(section?.querySelectorAll('.svc__card') ?? [])];
  if (!section || !stage || !cards.length) return { destroy() {} };

  section.classList.add('services-module--enhanced');
  section.dataset.servicesMotion = reducedMotion ? 'reduced' : 'full';
  const icons = cards.map(addIcon);

  const route = document.createElement('div');
  route.className = 'service-route-decor';
  route.setAttribute('aria-hidden', 'true');
  route.innerHTML = `<img class="service-route-vehicle" src="${ASSETS['26b6ae8acf0aa553efea60b4e1e392fd-truck-top-view']}" alt="">`;
  stage.prepend(route);

  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const view = window.innerHeight || 1;
    const progress = Math.max(0, Math.min(1, (view - rect.top) / Math.max(rect.height + view, 1)));
    section.style.setProperty('--service-progress', String(progress.toFixed(4)));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  if (!reducedMotion) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  } else section.style.setProperty('--service-progress', '1');

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      route.remove();
      icons.forEach((icon) => icon?.remove());
      cards.forEach((card) => card.querySelector('canvas')?.removeAttribute('hidden'));
      section.classList.remove('services-module--enhanced');
      section.style.removeProperty('--service-progress');
      delete section.dataset.servicesMotion;
    },
  };
}
