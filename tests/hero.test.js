import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const instances = [];
  const playIntro = vi.fn(() => ({ eventCallback: vi.fn() }));
  const Globe = vi.fn(function MockGlobe(canvas, labels) {
    const globe = {
      canvas,
      labels,
      dotsReady: Promise.resolve({ count: 1 }),
      dispose: vi.fn(),
      setIntro: vi.fn(),
      setVisible: vi.fn(),
      update: vi.fn(),
    };
    instances.push(globe);
    return globe;
  });

  return { Globe, instances, playIntro };
});

vi.mock('../src/globe/Globe.js', () => ({ Globe: harness.Globe }));
vi.mock('../src/intro.js', () => ({ playIntro: harness.playIntro }));

import { bindHeroVisibility, initHero } from '../src/components/hero.js';

describe('hero controller', () => {
  let frames;

  beforeEach(() => {
    document.body.innerHTML = `
      <section class="hero">
        <canvas id="globeCanvas"></canvas>
        <div id="globeLabels"></div>
        <div class="hero__copy"><span class="mask__i">Copy</span></div>
        <div class="hero__actions"></div>
        <a href="/contact">Talk with us</a>
      </section>
    `;
    frames = [];
    harness.instances.length = 0;
    harness.Globe.mockClear();
    harness.playIntro.mockClear();
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      const id = frames.length + 1;
      frames.push({ callback, id });
      return id;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('owns one render loop and pauses globe work while hidden', async () => {
    const canvas = document.querySelector('#globeCanvas');
    const labels = document.querySelector('#globeLabels');
    const hero = await initHero({ canvas, labels, reducedMotion: false });
    const globe = harness.instances[0];

    expect(harness.Globe).toHaveBeenCalledWith(canvas, labels);
    expect(globe.setIntro).toHaveBeenCalledWith(0);
    expect(frames).toHaveLength(1);

    frames[0].callback();
    expect(globe.update).toHaveBeenCalledTimes(1);

    hero.setVisible(false);
    frames[1].callback();
    expect(globe.setVisible).toHaveBeenLastCalledWith(false);
    expect(globe.update).toHaveBeenCalledTimes(1);

    hero.destroy();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(3);
    expect(globe.dispose).toHaveBeenCalledTimes(1);
  });

  it('starts fully revealed for reduced-motion visitors', async () => {
    const hero = await initHero({
      canvas: document.querySelector('#globeCanvas'),
      labels: document.querySelector('#globeLabels'),
      reducedMotion: true,
    });

    expect(harness.instances[0].setIntro).toHaveBeenCalledWith(1);
    hero.playIntro();
    expect(harness.playIntro).toHaveBeenCalledWith(harness.instances[0]);
  });

  it('keeps the hero usable when WebGL construction fails', async () => {
    harness.Globe.mockImplementationOnce(function unavailable() {
      throw new Error('WebGL is unavailable');
    });
    const root = document.querySelector('.hero');
    const link = root.querySelector('a');
    const hero = await initHero({
      canvas: document.querySelector('#globeCanvas'),
      labels: document.querySelector('#globeLabels'),
      reducedMotion: false,
    });

    await expect(hero.ready).resolves.toBeUndefined();
    expect(root.classList.contains('hero--fallback')).toBe(true);
    expect(root.querySelector('.mask__i').style.transform).toBe('translate3d(0, 0, 0)');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(() => hero.playIntro()).not.toThrow();
    expect(() => hero.destroy()).not.toThrow();
  });

  it('disposes a failed-ready globe only once before revealing the fallback', async () => {
    let rejectedGlobe;
    harness.Globe.mockImplementationOnce(function unavailableAfterConstruction() {
      rejectedGlobe = {
        dotsReady: Promise.reject(new Error('Terrain data is unavailable')),
        dispose: vi.fn(),
        setIntro: vi.fn(),
        setVisible: vi.fn(),
        update: vi.fn(),
      };
      return rejectedGlobe;
    });

    const hero = await initHero({
      canvas: document.querySelector('#globeCanvas'),
      labels: document.querySelector('#globeLabels'),
      reducedMotion: false,
    });

    await expect(hero.ready).resolves.toBeUndefined();
    expect(rejectedGlobe.dispose).toHaveBeenCalledTimes(1);

    hero.destroy();
    expect(rejectedGlobe.dispose).toHaveBeenCalledTimes(1);
  });

  it('falls back when dots cannot become ready within the bounded wait', async () => {
    vi.useFakeTimers();
    harness.Globe.mockImplementationOnce(function stalledDots() {
      const globe = {
        dotsReady: new Promise(() => {}),
        dispose: vi.fn(),
        setIntro: vi.fn(),
        setVisible: vi.fn(),
        update: vi.fn(),
      };
      harness.instances.push(globe);
      return globe;
    });

    const hero = await initHero({
      canvas: document.querySelector('#globeCanvas'),
      labels: document.querySelector('#globeLabels'),
      reducedMotion: false,
      readyTimeoutMs: 25,
    });
    let settled = false;
    hero.ready.then(() => { settled = true; });

    await vi.advanceTimersByTimeAsync(25);
    expect(settled).toBe(true);
    expect(harness.instances[0].dispose).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('hero visibility binding', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('pauses while hidden or out of view and disconnects cleanly', () => {
    const observed = [];
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observed.push(this);
      }

      observe = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);

    const root = document.createElement('div');
    root.getBoundingClientRect = () => ({ top: 0, bottom: 900 });
    const hero = { setVisible: vi.fn() };
    const binding = bindHeroVisibility(hero, root);

    expect(hero.setVisible).toHaveBeenLastCalledWith(true);
    observed[0].callback([{ isIntersecting: false }]);
    expect(hero.setVisible).toHaveBeenLastCalledWith(false);

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(hero.setVisible).toHaveBeenLastCalledWith(false);

    binding.destroy();
    expect(observed[0].disconnect).toHaveBeenCalledTimes(1);
  });
});
