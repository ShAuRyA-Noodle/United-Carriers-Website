import { ASSETS } from '../data/assets.js';

const SERVICE_ART = Object.freeze({
  air: 'air-freight',
  ocean: 'sea-freight',
  customs: 'custom-brokerage',
  warehouse: 'warehousing-and-3pl',
  project: 'project-cargo',
  transport: 'domestic-interstate-transport',
});

function isMobileView() {
  return window.matchMedia?.('(max-width: 760px)').matches ?? false;
}

function decorateCard(card, index, mobile) {
  const media = card.querySelector('.svc__media');
  const artName = SERVICE_ART[card.dataset.svc];
  const meta = card.querySelector('.svc__meta');
  const description = meta?.querySelector('p');
  const heading = meta?.querySelector('h3');

  card.dataset.serviceIndex = String(index);
  card.querySelector('canvas')?.setAttribute('hidden', '');

  if (media && artName && !media.querySelector('.service-card__art')) {
    const art = document.createElement('img');
    art.className = 'service-card__art';
    art.src = ASSETS[artName];
    art.alt = '';
    art.loading = 'lazy';
    art.decoding = 'async';
    art.setAttribute('aria-hidden', 'true');
    media.append(art);
  }

  if (!meta || !description || !heading) return null;
  const descriptionId = description.id || `service-description-${index + 1}`;
  description.id = descriptionId;
  let toggle = meta.querySelector('.service-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.className = 'service-toggle';
    toggle.type = 'button';
    toggle.textContent = `View ${heading.textContent.trim()}`;
    toggle.setAttribute('aria-controls', descriptionId);
    meta.append(toggle);
  }

  const setOpen = (open) => {
    card.dataset.serviceActive = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    if (mobile) description.hidden = !open;
  };

  setOpen(!mobile || index === 0);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  return { toggle, setOpen };
}

/**
 * Turns the source service cards into a progressive desktop route and a mobile
 * accordion while retaining the source HTML as its content foundation.
 */
export function initServices({ root = document, reducedMotion = false } = {}) {
  const section = root.querySelector('#services');
  const rail = root.querySelector('#svcRail');
  const serviceStage = section?.querySelector('.svc');
  const cards = [...root.querySelectorAll('#svcRail .svc__card')];
  if (!section || !rail || cards.length === 0) return { destroy() {} };

  const mobile = isMobileView();
  section.classList.add('services-module--enhanced');
  section.dataset.servicesMotion = reducedMotion ? 'reduced' : 'full';
  let routeDecor = serviceStage?.querySelector('.service-route-decor');
  if (serviceStage && !routeDecor) {
    routeDecor = document.createElement('div');
    routeDecor.className = 'service-route-decor';
    routeDecor.setAttribute('aria-hidden', 'true');
    routeDecor.innerHTML = `
      <img class="service-route-vehicle" src="${ASSETS['26b6ae8acf0aa553efea60b4e1e392fd-truck-top-view']}" alt="">
      <img class="service-route-container" src="${ASSETS['b1a1022bfd557e7d8d1325faf1c21241-container-top-view']}" alt="">
    `;
    serviceStage.append(routeDecor);
  }
  const controls = cards.map((card, index) => decorateCard(card, index, mobile));
  let frame = 0;

  const setActive = (index) => {
    const active = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, cardIndex) => {
      card.dataset.serviceCurrent = String(cardIndex === active);
    });
    section.style.setProperty('--service-active', String(active));
    section.style.setProperty('--service-progress', String(cards.length === 1 ? 1 : active / (cards.length - 1)));
  };

  const updateFromScroll = () => {
    frame = 0;
    if (mobile || reducedMotion) return;
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = Math.min(1, Math.max(0, (viewport * 0.62 - rect.top) / Math.max(rect.height - viewport * 0.36, 1)));
    setActive(Math.round(progress * (cards.length - 1)));
  };

  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateFromScroll);
  };

  setActive(0);
  if (!mobile && !reducedMotion) {
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
  }

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      section.classList.remove('services-module--enhanced');
      section.style.removeProperty('--service-active');
      section.style.removeProperty('--service-progress');
      controls.forEach((control) => control?.toggle.remove());
      cards.forEach((card) => {
        delete card.dataset.serviceIndex;
        delete card.dataset.serviceActive;
        delete card.dataset.serviceCurrent;
        card.querySelector('.service-card__art')?.remove();
        card.querySelector('canvas')?.removeAttribute('hidden');
        card.querySelector('.svc__meta p')?.removeAttribute('hidden');
      });
      routeDecor?.remove();
    },
  };
}
