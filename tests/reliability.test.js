import { describe, expect, it } from 'vitest';
import { ASSETS } from '../src/data/assets.js';
import { initReliability } from '../src/components/reliability.js';

describe('initReliability', () => {
  it('keeps milestones on the road and creates a separate source ocean voyage', () => {
    document.body.innerHTML = `
      <div class="wrap"><div class="reliability-grid">
        <article class="reliability-card"><h3>Tracking</h3><p>Live updates.</p></article>
        <article class="reliability-card"><h3>Network</h3><p>Global reach.</p></article>
        <article class="reliability-card"><h3>Support</h3><p>Always available.</p></article>
      </div></div>`;

    const reliability = initReliability({ root: document, reducedMotion: true });
    const grid = document.querySelector('.reliability-grid');
    const road = grid.querySelector('.reliability-road');
    const scene = grid.parentElement.nextElementSibling;

    expect(road.querySelector('.reliability-road__truck').getAttribute('src')).toBe(ASSETS['26b6ae8acf0aa553efea60b4e1e392fd-truck-top-view']);
    expect(scene.classList.contains('ocean-voyage')).toBe(true);
    expect(scene.querySelector('.reliability-ship').getAttribute('src')).toBe(ASSETS['home-ship']);
    expect(scene.querySelector('video').poster).toContain(ASSETS['6a44eec1ed1af2c4c403df6b-6a460d6f92801e715322d1d6-sea-wave-2-1-poster-0000000']);
    expect(grid.dataset.reliabilityStage).toBe('final');
    expect([...grid.querySelectorAll('.reliability-card')].every((card) => card.dataset.reliabilityMilestone)).toBe(true);
    reliability.destroy();
    expect(document.querySelector('.ocean-voyage')).toBeNull();
  });
});
