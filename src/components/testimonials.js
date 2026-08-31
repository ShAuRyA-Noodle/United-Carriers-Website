import { ASSETS } from '../data/assets.js';
import { CONTENT } from '../data/content.js';
import '../styles/benefits-testimonials.css';

const PORTRAITS = Object.freeze(['thomas-munro', 'francis-fung', 'alex-hughes']);

function normaliseIndex(value, length) {
  if (!length) return 0;
  const number = Number.isFinite(value) ? Math.trunc(value) : 0;
  return ((number % length) + length) % length;
}

/** A small state primitive kept separate from DOM work for reliable wrap logic. */
export function createCarouselState(length, initialIndex = 0) {
  const size = Math.max(0, Math.trunc(Number(length) || 0));
  let current = normaliseIndex(initialIndex, size);

  return {
    get current() { return current; },
    get length() { return size; },
    next() {
      current = normaliseIndex(current + 1, size);
      return current;
    },
    previous() {
      current = normaliseIndex(current - 1, size);
      return current;
    },
    goTo(index) {
      current = normaliseIndex(index, size);
      return current;
    },
  };
}

function findSection(root) {
  if (root?.matches?.('[data-testimonials], #testimonials')) return root;
  return root?.querySelector?.('[data-testimonials], #testimonials') ?? null;
}

function restoreAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function createCard(documentRef) {
  const card = documentRef.createElement('figure');
  card.className = 'testi__card';
  return card;
}

function cardsFor(track, documentRef) {
  const cards = [...track.children].filter((child) => child.matches('.testi__card, [data-testimonial-card]'));
  const addedCards = [];

  while (cards.length < CONTENT.testimonials.length) {
    const card = createCard(documentRef);
    track.append(card);
    cards.push(card);
    addedCards.push(card);
  }

  return { cards: cards.slice(0, CONTENT.testimonials.length), addedCards };
}

function renderCard(card, testimonial, portraitAsset, documentRef) {
  const quote = documentRef.createElement('blockquote');
  quote.textContent = testimonial.quote;

  const caption = documentRef.createElement('figcaption');
  const portrait = documentRef.createElement('img');
  portrait.className = 'testi__portrait';
  portrait.src = ASSETS[portraitAsset];
  portrait.alt = `Portrait of ${testimonial.name}`;
  portrait.loading = 'lazy';
  portrait.decoding = 'async';

  const identity = documentRef.createElement('div');
  identity.className = 'testi__identity';
  const name = documentRef.createElement('b');
  name.textContent = testimonial.name;
  const role = documentRef.createElement('span');
  role.textContent = `${testimonial.role}, ${testimonial.company}`;
  identity.append(name, role);
  caption.append(portrait, identity);

  card.replaceChildren(quote, caption);
}

function indexLabel(index, length) {
  return `${String(index + 1).padStart(2, '0')} / ${String(length).padStart(2, '0')}`;
}

/**
 * Progressively enhances the source testimonial markup into an accessible,
 * input-agnostic carousel. No duplicated source copy is maintained in code:
 * all displayed records come from the auditable content registry.
 */
export function initTestimonials({ root = document, reducedMotion = false } = {}) {
  const section = findSection(root);
  const carousel = section?.querySelector('[data-testimonials-carousel], #testi, .testi');
  const track = carousel?.querySelector('[data-testimonials-track], #testiTrack, .testi__track');
  if (!section || !carousel || !track || CONTENT.testimonials.length === 0) return { destroy() {} };

  const documentRef = section.ownerDocument ?? document;
  const { cards, addedCards } = cardsFor(track, documentRef);
  const cardSnapshots = cards.map((card) => ({
    card,
    html: card.innerHTML,
    className: card.className,
    ariaHidden: card.getAttribute('aria-hidden'),
    roleDescription: card.getAttribute('aria-roledescription'),
    index: card.getAttribute('data-testimonial-index'),
    current: card.getAttribute('data-testimonial-current'),
  }));
  const trackStyle = track.getAttribute('style');
  const trackReduced = track.getAttribute('data-testimonials-reduced');
  const sectionMotion = section.getAttribute('data-testimonials-motion');
  const carouselAttributes = new Map([
    ['tabindex', carousel.getAttribute('tabindex')],
    ['role', carousel.getAttribute('role')],
    ['aria-label', carousel.getAttribute('aria-label')],
    ['aria-roledescription', carousel.getAttribute('aria-roledescription')],
    ['style', carousel.getAttribute('style')],
  ]);
  const state = createCarouselState(cards.length);
  const controls = {
    previous: carousel.querySelector('[data-testimonial-prev], #testiPrev'),
    next: carousel.querySelector('[data-testimonial-next], #testiNext'),
  };
  const navigation = carousel.querySelector('.testi__nav, [data-testimonials-nav]');
  const index = documentRef.createElement('p');
  index.className = 'testimonials__index';
  index.dataset.testimonialsIndex = 'true';
  index.setAttribute('aria-live', 'polite');
  index.setAttribute('aria-atomic', 'true');
  (navigation ?? carousel).prepend(index);

  cards.forEach((card, cardIndex) => {
    renderCard(card, CONTENT.testimonials[cardIndex], PORTRAITS[cardIndex], documentRef);
    card.classList.add('testimonial-card--enhanced');
    card.dataset.testimonialIndex = String(cardIndex);
    card.setAttribute('aria-roledescription', 'slide');
  });
  section.classList.add('testimonials-module--enhanced');
  section.dataset.testimonialsMotion = reducedMotion ? 'reduced' : 'full';
  track.dataset.testimonialsReduced = String(Boolean(reducedMotion));
  carousel.tabIndex = 0;
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Client testimonials');
  carousel.setAttribute('aria-roledescription', 'carousel');
  carousel.style.touchAction = 'pan-y';

  const render = (activeIndex) => {
    const indexValue = state.goTo(activeIndex);
    const offset = indexValue === 0 ? '0%' : `-${indexValue * 100}%`;
    track.style.transform = `translate3d(${offset}, 0, 0)`;
    track.style.transition = reducedMotion ? 'none' : '';
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === indexValue;
      card.dataset.testimonialCurrent = String(active);
      card.setAttribute('aria-hidden', String(!active));
    });
    index.textContent = indexLabel(indexValue, cards.length);
    index.setAttribute('aria-label', `Testimonial ${indexValue + 1} of ${cards.length}`);
  };

  const showNext = () => render(state.next());
  const showPrevious = () => render(state.previous());
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    }
  };
  let pointerStart = null;
  const onPointerDown = (event) => {
    if (event.isPrimary === false) return;
    pointerStart = event.clientX;
  };
  const onPointerEnd = (event) => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) showNext();
    else showPrevious();
  };
  const onPointerCancel = () => { pointerStart = null; };

  controls.previous?.addEventListener('click', showPrevious);
  controls.next?.addEventListener('click', showNext);
  carousel.addEventListener('keydown', onKeyDown);
  carousel.addEventListener('pointerdown', onPointerDown);
  carousel.addEventListener('pointerup', onPointerEnd);
  carousel.addEventListener('pointercancel', onPointerCancel);
  render(0);

  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      controls.previous?.removeEventListener('click', showPrevious);
      controls.next?.removeEventListener('click', showNext);
      carousel.removeEventListener('keydown', onKeyDown);
      carousel.removeEventListener('pointerdown', onPointerDown);
      carousel.removeEventListener('pointerup', onPointerEnd);
      carousel.removeEventListener('pointercancel', onPointerCancel);
      index.remove();

      cardSnapshots.forEach((snapshot) => {
        snapshot.card.innerHTML = snapshot.html;
        snapshot.card.className = snapshot.className;
        restoreAttribute(snapshot.card, 'aria-hidden', snapshot.ariaHidden);
        restoreAttribute(snapshot.card, 'aria-roledescription', snapshot.roleDescription);
        restoreAttribute(snapshot.card, 'data-testimonial-index', snapshot.index);
        restoreAttribute(snapshot.card, 'data-testimonial-current', snapshot.current);
      });
      addedCards.forEach((card) => card.remove());
      restoreAttribute(track, 'style', trackStyle);
      restoreAttribute(track, 'data-testimonials-reduced', trackReduced);
      restoreAttribute(section, 'data-testimonials-motion', sectionMotion);
      section.classList.remove('testimonials-module--enhanced');
      carouselAttributes.forEach((value, name) => restoreAttribute(carousel, name, value));
    },
  };
}
