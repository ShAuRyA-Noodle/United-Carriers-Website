import { afterEach, describe, expect, it, vi } from 'vitest';
import { ASSETS } from '../src/data/assets.js';
import { CONTENT } from '../src/data/content.js';
import { initBenefits } from '../src/components/benefits.js';

function benefitsMarkup() {
  return `
    <section class="sec sec--why" id="why">
      <div class="wrap">
        <header class="sec__head">
          <p class="eyebrow">Why United Carriers</p>
          <h2 class="sec__title">Logistics that works as hard as you do.</h2>
        </header>
        <div class="why__grid">
          ${CONTENT.benefits.map((_, index) => `
            <article class="why__item">
              <span class="why__no">${String(index + 1).padStart(2, '0')}</span>
              <h3>Placeholder ${index + 1}</h3>
              <p>Placeholder copy.</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('initBenefits', () => {
  it('hydrates all five exact source benefits with alternating audited visual layers', () => {
    document.body.innerHTML = benefitsMarkup();

    const benefits = initBenefits({ root: document, reducedMotion: true });
    const section = document.querySelector('#why');
    const cards = [...section.querySelectorAll('.why__item')];
    const scene = section.querySelector('[data-benefits-atmosphere]');

    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.querySelector('h3').textContent)).toEqual(
      CONTENT.benefits.map((benefit) => benefit.title),
    );
    expect(cards.map((card) => card.querySelector('p').textContent)).toEqual(
      CONTENT.benefits.map((benefit) => benefit.body),
    );
    expect(cards.map((card) => card.dataset.benefitSide)).toEqual([
      'start', 'end', 'start', 'end', 'start',
    ]);
    expect(cards.map((card) => card.querySelector('.benefit-card__image').getAttribute('src'))).toEqual([
      ASSETS['wu-1'], ASSETS['wu-2'], ASSETS['wu-3'], ASSETS['wu-4'], ASSETS['wu-5'],
    ]);
    expect(section.querySelector('.eyebrow').textContent).toBe('Why us');
    expect(scene.querySelector('[data-benefits-aircraft]').getAttribute('src')).toBe(ASSETS.aircraft);
    expect(scene.querySelector('[data-benefits-blur]').getAttribute('src')).toBe(
      ASSETS['9a50c563060c5806d014a6c46ec4593c-plain-blur'],
    );
    expect(scene.querySelectorAll('[data-benefits-cloud]')).toHaveLength(3);
    expect([...scene.querySelectorAll('[data-benefits-cloud]')].every((cloud) => (
      cloud.getAttribute('src') === ASSETS['cloud-template']
    ))).toBe(true);
    expect(section.dataset.benefitsMotion).toBe('reduced');
    expect(section.style.getPropertyValue('--benefits-progress')).toBe('1');

    benefits.destroy();

    expect(section.querySelector('[data-benefits-atmosphere]')).toBeNull();
    expect(section.querySelector('.benefit-card__media')).toBeNull();
    expect(section.dataset.benefitsMotion).toBeUndefined();
  });

  it('links the atmospheric aircraft-and-cloud frame to scroll progress and removes its scheduler', () => {
    document.body.innerHTML = benefitsMarkup();
    let scheduled;
    const requestFrame = vi.fn((callback) => {
      scheduled = callback;
      return 17;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });

    const section = document.querySelector('#why');
    const benefits = initBenefits({ root: document });
    const scene = section.querySelector('[data-benefits-atmosphere]');
    scene.getBoundingClientRect = () => ({ top: 600, height: 700 });
    scheduled();
    const openingProgress = Number(section.style.getPropertyValue('--benefits-progress'));

    scene.getBoundingClientRect = () => ({ top: -750, height: 700 });
    window.dispatchEvent(new Event('scroll'));
    scheduled();
    const closingProgress = Number(section.style.getPropertyValue('--benefits-progress'));

    expect(closingProgress).toBeGreaterThan(openingProgress);
    expect(section.querySelector('[data-benefits-aircraft]').style.transform).toContain('translate3d');

    benefits.destroy();
    const scheduledBeforeDestroyScroll = requestFrame.mock.calls.length;
    window.dispatchEvent(new Event('scroll'));
    expect(requestFrame).toHaveBeenCalledTimes(scheduledBeforeDestroyScroll);
  });
});
