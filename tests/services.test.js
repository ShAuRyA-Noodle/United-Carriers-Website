import { describe, expect, it, vi } from 'vitest';
import { ASSETS } from '../src/data/assets.js';
import { initServices } from '../src/components/services.js';

function serviceMarkup() {
  return `
    <section id="services">
      <div class="svc">
        <div class="svc__rail" id="svcRail">
          <article class="svc__card" data-svc="air">
            <div class="svc__media"><canvas></canvas></div>
            <div class="svc__meta"><h3>Air freight</h3><p>Express cargo.</p></div>
          </article>
          <article class="svc__card" data-svc="ocean">
            <div class="svc__media"><canvas></canvas></div>
            <div class="svc__meta"><h3>Ocean Freight</h3><p>FCL and LCL.</p></div>
          </article>
        </div>
        <div class="svc__progress"><i id="svcProgress"></i></div>
      </div>
    </section>`;
}

describe('initServices', () => {
  it('uses the audited service icons without inventing photographic cards', () => {
    document.body.innerHTML = serviceMarkup();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    const services = initServices({ root: document });
    const card = document.querySelector('[data-svc="air"]');
    expect(card.querySelector('.service-icon').getAttribute('src')).toBe(ASSETS['air-freight']);
    expect(document.querySelector('.service-route-vehicle').getAttribute('src')).toBe(ASSETS['26b6ae8acf0aa553efea60b4e1e392fd-truck-top-view']);
    expect(card.querySelector('canvas').hasAttribute('hidden')).toBe(true);
    expect(card.querySelector('.service-toggle')).toBeNull();
    services.destroy();
  });
});
