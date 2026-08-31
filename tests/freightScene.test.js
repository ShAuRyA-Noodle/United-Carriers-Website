import { describe, expect, it } from 'vitest';
import { initFreightScene, setFreightSceneFinalState } from '../src/components/freightScene.js';

function sceneFixture() {
  document.body.innerHTML = `
    <section class="freight-scene" data-freight-scene>
      <div data-freight-stage>
        <div data-freight="crane-base"><img data-freight-asset="frame-df"></div>
        <div data-freight="crane-lift"><img data-freight-asset="frame-000"></div>
        <div data-freight="container-white"><img data-freight-asset="container-white"></div>
        <div data-freight="container-blue"><img data-freight-asset="container-blue"></div>
        <div data-freight="container-orange"><img data-freight-asset="container-orange"></div>
        <div data-freight="truck-full"><img data-freight-asset="truck-static"></div>
        <div data-freight="truck-cab"><img data-freight-asset="0ce5a65ed3727488198a1e34ffd7fc23-only-car"></div>
        <div data-freight="truck-container"><img data-freight-asset="only-container"></div>
        <div data-freight="wheel-front"><img data-freight-asset="banh-truoc"></div>
        <div data-freight="wheel-rear"><img data-freight-asset="banh-sau"></div>
        <div data-freight="mobile-crane"><img data-freight-asset="frame-mb-df"></div>
      </div>
    </section>`;
    return document.querySelector('[data-freight-scene]');
}

describe('freight scene', () => {
  it('hydrates audited local assets and exposes its reduced-motion final frame', () => {
    const root = sceneFixture();
    const controller = initFreightScene(root, { reducedMotion: true });

    expect(root.classList.contains('freight-scene--final')).toBe(true);
    expect(root.querySelector('[data-freight="crane-base"] img').getAttribute('src'))
      .toBe('/assets/source/freight/frame-df.avif');
    expect(root.querySelector('[data-freight="truck-cab"]').style.opacity).toBe('1');
    expect(root.querySelector('[data-freight="truck-full"]').style.opacity).toBe('0');
    expect(() => controller.destroy()).not.toThrow();
  });

  it('can force a deterministic final frame without initializing a scroll timeline', () => {
    const root = sceneFixture();

    setFreightSceneFinalState(root);

    expect(root.classList.contains('freight-scene--final')).toBe(true);
    expect(root.querySelector('[data-freight="wheel-front"]').style.transform).toContain('rotate');
  });
});
