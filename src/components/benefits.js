import { ASSETS } from '../data/assets.js';
import { CONTENT } from '../data/content.js';
import '../styles/benefits-testimonials.css';

const BENEFIT_ART = Object.freeze(['wu-1', 'wu-2', 'wu-3', 'wu-4', 'wu-5']);
const CLOUD_ART = Object.freeze(['cloud-template', 'cloud-template', 'cloud-template']);
const TRANSITION_BLUR = '9a50c563060c5806d014a6c46ec4593c-plain-blur';

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

function findSection(root) {
  if (root?.matches?.('[data-benefits], #why-us, #why')) return root;
  return root?.querySelector?.('[data-benefits], #why-us, #why') ?? null;
}

function image(documentRef, className, source, attributes = {}) {
  const element = documentRef.createElement('img');
  element.className = className;
  element.src = source;
  element.alt = attributes.alt ?? '';
  element.loading = attributes.loading ?? 'lazy';
  element.decoding = 'async';
  if (attributes.hidden) element.setAttribute('aria-hidden', 'true');
  return element;
}

function makeBenefitCard(documentRef) {
  const card = documentRef.createElement('article');
  card.className = 'why__item';

  const number = documentRef.createElement('span');
  number.className = 'why__no';
  const heading = documentRef.createElement('h3');
  const body = documentRef.createElement('p');
  card.append(number, heading, body);
  return card;
}

function getCards(grid, documentRef) {
  const cards = [...grid.children].filter((child) => child.matches('.why__item, [data-benefit-item]'));
  const addedCards = [];

  while (cards.length < CONTENT.benefits.length) {
    const card = makeBenefitCard(documentRef);
    grid.append(card);
    cards.push(card);
    addedCards.push(card);
  }

  return { cards: cards.slice(0, CONTENT.benefits.length), addedCards };
}

function wrapCopy(card, documentRef) {
  const existing = card.querySelector(':scope > .benefit-card__copy');
  if (existing) return { copy: existing, created: false };

  const copy = documentRef.createElement('div');
  copy.className = 'benefit-card__copy';
  [...card.children]
    .filter((child) => !child.matches('.benefit-card__media'))
    .forEach((child) => copy.append(child));
  card.prepend(copy);
  return { copy, created: true };
}

function fillBenefitCard(card, benefit, index, documentRef) {
  const copyState = wrapCopy(card, documentRef);
  const { copy } = copyState;
  let number = copy.querySelector('.why__no');
  let heading = copy.querySelector('h3');
  let body = copy.querySelector('p');

  if (!number) {
    number = documentRef.createElement('span');
    number.className = 'why__no';
    copy.prepend(number);
  }
  if (!heading) {
    heading = documentRef.createElement('h3');
    copy.append(heading);
  }
  if (!body) {
    body = documentRef.createElement('p');
    copy.append(body);
  }

  number.textContent = String(index + 1).padStart(2, '0');
  heading.textContent = benefit.title;
  body.textContent = benefit.body;

  const existingMedia = card.querySelector(':scope > .benefit-card__media');
  const media = existingMedia ?? documentRef.createElement('figure');
  const createdMedia = !existingMedia;
  if (createdMedia) {
    media.className = 'benefit-card__media';
    media.setAttribute('aria-hidden', 'true');
    card.append(media);
  }

  let art = media.querySelector('.benefit-card__image');
  if (!art) {
    art = image(documentRef, 'benefit-card__image', ASSETS[BENEFIT_ART[index]], { hidden: true });
    media.append(art);
  } else {
    art.src = ASSETS[BENEFIT_ART[index]];
  }

  card.classList.add('benefit-card--enhanced');
  card.dataset.benefitItem = String(index + 1);
  card.dataset.benefitIndex = String(index);
  card.dataset.benefitSide = index % 2 === 0 ? 'start' : 'end';

  return { card, copy, createdCopy: copyState.created, media, createdMedia };
}

function createAtmosphere(section, documentRef) {
  const existing = section.querySelector(':scope > [data-benefits-atmosphere]');
  if (existing) return { scene: existing, created: false };

  const scene = documentRef.createElement('div');
  scene.className = 'benefits-atmosphere';
  scene.dataset.benefitsAtmosphere = 'true';
  scene.setAttribute('aria-hidden', 'true');

  const blur = image(documentRef, 'benefits-atmosphere__blur', ASSETS[TRANSITION_BLUR], { hidden: true });
  blur.dataset.benefitsBlur = 'true';
  blur.loading = 'eager';
  scene.append(blur);

  const aircraft = image(documentRef, 'benefits-atmosphere__aircraft', ASSETS.aircraft, { hidden: true });
  aircraft.dataset.benefitsAircraft = 'true';
  aircraft.loading = 'eager';
  scene.append(aircraft);

  CLOUD_ART.forEach((asset, index) => {
    const cloud = image(documentRef, `benefits-atmosphere__cloud benefits-atmosphere__cloud--${index + 1}`, ASSETS[asset], { hidden: true });
    cloud.dataset.benefitsCloud = String(index + 1);
    scene.append(cloud);
  });

  section.append(scene);
  return { scene, created: true };
}

function setAtmosphereProgress(section, scene, value) {
  const progress = clamp(Number.isFinite(value) ? value : 0);
  const rounded = Number(progress.toFixed(4));
  const aircraft = scene?.querySelector('[data-benefits-aircraft]');
  const clouds = [...(scene?.querySelectorAll('[data-benefits-cloud]') ?? [])];

  section.style.setProperty('--benefits-progress', String(rounded));
  section.dataset.benefitsPhase = progress < 0.34 ? 'approach' : progress < 0.74 ? 'crossing' : 'clearing';

  if (aircraft) {
    const x = -72 + progress * 154;
    const y = 22 - progress * 42;
    const scale = 0.72 + progress * 0.52;
    const rotate = -8 + progress * 14;
    aircraft.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}%, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    aircraft.style.opacity = String((0.18 + Math.sin(progress * Math.PI) * 0.82).toFixed(3));
  }

  clouds.forEach((cloud, index) => {
    const direction = index === 1 ? -1 : 1;
    const x = direction * (-24 + progress * 58 + index * 8);
    const y = 8 + index * 19 - progress * (26 + index * 8);
    const scale = 0.9 + index * 0.09 + progress * 0.26;
    cloud.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}%, 0) scale(${scale.toFixed(3)})`;
    cloud.style.opacity = String((0.1 + progress * (0.46 - index * 0.08)).toFixed(3));
  });
}

/**
 * Enhances the existing Why section with the audited five-image sequence and a
 * scroll-linked aircraft handoff. It deliberately leaves the source copy in
 * the document so the section remains meaningful before JavaScript runs.
 */
export function initBenefits({ root = document, reducedMotion = false } = {}) {
  const section = findSection(root);
  const grid = section?.querySelector('.why__grid, [data-benefits-grid]');
  if (!section || !grid) return { destroy() {} };

  const documentRef = section.ownerDocument ?? document;
  const { cards, addedCards } = getCards(grid, documentRef);
  const cardStates = cards.map((card, index) => fillBenefitCard(card, CONTENT.benefits[index], index, documentRef));
  const atmosphere = createAtmosphere(section, documentRef);
  const eyebrow = section.querySelector('.eyebrow');
  const eyebrowText = eyebrow?.textContent ?? null;
  let frame = 0;
  let destroyed = false;

  section.classList.add('benefits-module--enhanced');
  section.dataset.benefitsMotion = reducedMotion ? 'reduced' : 'full';
  if (eyebrow) eyebrow.textContent = 'Why us';

  const update = () => {
    frame = 0;
    const rect = atmosphere.scene.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = (viewport * 0.75 - rect.top) / Math.max(rect.height + viewport * 0.25, 1);
    setAtmosphereProgress(section, atmosphere.scene, progress);
  };

  const schedule = () => {
    if (frame || destroyed) return;
    frame = requestAnimationFrame(update);
  };

  if (reducedMotion) {
    setAtmosphereProgress(section, atmosphere.scene, 1);
  } else {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (atmosphere.created) atmosphere.scene.remove();
      section.classList.remove('benefits-module--enhanced');
      section.style.removeProperty('--benefits-progress');
      delete section.dataset.benefitsMotion;
      delete section.dataset.benefitsPhase;
      if (eyebrow && eyebrowText !== null) eyebrow.textContent = eyebrowText;

      cardStates.forEach(({ card, copy, createdCopy, media, createdMedia }) => {
        if (createdMedia) media.remove();
        if (createdCopy) {
          [...copy.childNodes].forEach((node) => card.insertBefore(node, copy));
          copy.remove();
        }
        card.classList.remove('benefit-card--enhanced');
        delete card.dataset.benefitItem;
        delete card.dataset.benefitIndex;
        delete card.dataset.benefitSide;
      });
      addedCards.forEach((card) => card.remove());
    },
  };
}

export function setBenefitsFinalState(root = document) {
  const section = findSection(root);
  const scene = section?.querySelector('[data-benefits-atmosphere]');
  if (section && scene) setAtmosphereProgress(section, scene, 1);
}
