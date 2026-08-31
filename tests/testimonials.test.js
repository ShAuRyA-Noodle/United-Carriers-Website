import { afterEach, describe, expect, it } from 'vitest';
import { ASSETS } from '../src/data/assets.js';
import { CONTENT } from '../src/data/content.js';
import { createCarouselState, initTestimonials } from '../src/components/testimonials.js';

function testimonialMarkup() {
  return `
    <section class="sec sec--testi" id="testimonials">
      <div class="wrap">
        <div class="testi" id="testi">
          <div class="testi__track" id="testiTrack">
            ${CONTENT.testimonials.map(() => `
              <figure class="testi__card">
                <blockquote>Placeholder quote.</blockquote>
                <figcaption><b>Placeholder</b><span>Placeholder role</span></figcaption>
              </figure>
            `).join('')}
          </div>
          <div class="testi__nav">
            <button class="tnav" id="testiPrev" type="button">Previous</button>
            <button class="tnav" id="testiNext" type="button">Next</button>
          </div>
        </div>
      </div>
    </section>`;
}

function pointer(type, clientX) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'clientX', { configurable: true, value: clientX });
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('testimonial carousel state', () => {
  it('wraps in both directions', () => {
    const state = createCarouselState(3);

    expect(state.previous()).toBe(2);
    expect(state.next()).toBe(0);
    expect(state.next()).toBe(1);
  });
});

describe('initTestimonials', () => {
  it('renders the exact source records and supports buttons, keyboard, swipe, live index, and teardown', () => {
    document.body.innerHTML = testimonialMarkup();

    const testimonials = initTestimonials({ root: document, reducedMotion: false });
    const carousel = document.querySelector('#testi');
    const track = document.querySelector('#testiTrack');
    const cards = [...track.querySelectorAll('.testi__card')];
    const previous = document.querySelector('#testiPrev');
    const next = document.querySelector('#testiNext');
    const index = carousel.querySelector('[data-testimonials-index]');

    expect(cards.map((card) => card.querySelector('blockquote').textContent)).toEqual(
      CONTENT.testimonials.map((testimonial) => testimonial.quote),
    );
    expect(cards.map((card) => card.querySelector('.testi__portrait').getAttribute('src'))).toEqual([
      ASSETS['thomas-munro'], ASSETS['francis-fung'], ASSETS['alex-hughes'],
    ]);
    expect(cards.map((card) => card.querySelector('figcaption b').textContent)).toEqual(
      CONTENT.testimonials.map((testimonial) => testimonial.name),
    );
    expect(cards.map((card) => card.querySelector('figcaption span').textContent)).toEqual(
      CONTENT.testimonials.map(({ role, company }) => `${role}, ${company}`),
    );
    expect(index.textContent).toBe('01 / 03');
    expect(index.getAttribute('aria-live')).toBe('polite');

    next.click();
    expect(index.textContent).toBe('02 / 03');
    expect(cards[1].dataset.testimonialCurrent).toBe('true');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(index.textContent).toBe('03 / 03');

    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(index.textContent).toBe('01 / 03');

    previous.click();
    expect(index.textContent).toBe('03 / 03');

    carousel.dispatchEvent(pointer('pointerdown', 260));
    carousel.dispatchEvent(pointer('pointerup', 110));
    expect(index.textContent).toBe('01 / 03');

    testimonials.destroy();
    const transformAfterDestroy = track.style.transform;
    next.click();

    expect(track.style.transform).toBe(transformAfterDestroy);
    expect(carousel.querySelector('[data-testimonials-index]')).toBeNull();
  });

  it('uses a static, complete reduced-motion state', () => {
    document.body.innerHTML = testimonialMarkup();

    const testimonials = initTestimonials({ root: document, reducedMotion: true });
    const section = document.querySelector('#testimonials');
    const track = document.querySelector('#testiTrack');

    expect(section.dataset.testimonialsMotion).toBe('reduced');
    expect(track.dataset.testimonialsReduced).toBe('true');
    expect(track.style.transform).toBe('translate3d(0%, 0, 0)');

    testimonials.destroy();
  });
});
