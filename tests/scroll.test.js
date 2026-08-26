import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const timeline = {
    scrollTrigger: { kill: vi.fn() },
    kill: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
  };
  timeline.to.mockReturnValue(timeline);
  timeline.fromTo.mockReturnValue(timeline);

  const gsap = {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => timeline),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      lagSmoothing: vi.fn(),
    },
  };
  const ScrollTrigger = { refresh: vi.fn(), update: vi.fn() };
  const Lenis = vi.fn(function MockLenis() {
    this.destroy = vi.fn();
    this.on = vi.fn();
    this.raf = vi.fn();
  });

  return { gsap, Lenis, ScrollTrigger, timeline };
});

vi.mock('gsap', () => ({ default: harness.gsap }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: harness.ScrollTrigger }));
vi.mock('lenis', () => ({ default: harness.Lenis }));

import { initScroll } from '../src/scroll.js';

describe('hero scroll cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="hero"></section>
      <div id="heroCopy"></div>
      <div id="descentSky"></div>
      <div id="descentHorizon"></div>
      <div id="bloomWarm"></div>
      <div id="bloomCool"></div>
      <div class="scrollcue"></div>
      <div class="rail"></div>
      <div class="nav"></div>
    `;
    window.matchMedia = vi.fn(() => ({ matches: false }));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the exact Lenis ticker callback and resets the hero dive on destroy', () => {
    const hero = { setDive: vi.fn() };
    const scroll = initScroll(hero);
    const tickerCallback = harness.gsap.ticker.add.mock.calls[0][0];

    scroll.destroy();

    expect(harness.gsap.ticker.remove).toHaveBeenCalledWith(tickerCallback);
    expect(harness.Lenis.mock.instances[0].destroy).toHaveBeenCalledTimes(1);
    expect(hero.setDive).toHaveBeenLastCalledWith(0);
  });
});
