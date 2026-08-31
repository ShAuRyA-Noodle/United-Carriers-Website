import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForCriticalMedia } from '../src/core/mediaReady.js';
import { runLoader } from '../src/components/loader.js';

function loaderMarkup() {
  return `
    <div id="loader" class="loader">
      <div id="loaderStage"><span id="loaderPct">00</span></div>
      <div id="loaderRings"><i></i></div>
      <div id="loaderWipe"><i></i></div>
      <div id="loaderCountries"></div>
      <div id="loaderServices"></div>
      <canvas id="loaderMap"></canvas>
    </div>
  `;
}

describe('critical media readiness', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after every critical promise settles, including a rejection', async () => {
    await expect(waitForCriticalMedia([
      Promise.resolve(),
      Promise.reject(new Error('optional media failed')),
    ])).resolves.toEqual({ timedOut: false });
  });

  it('resolves at the timeout when media never loads', async () => {
    vi.useFakeTimers();
    const pending = new Promise(() => {});
    const result = waitForCriticalMedia([pending], 1200);

    await vi.advanceTimersByTimeAsync(1200);

    await expect(result).resolves.toEqual({ timedOut: true });
  });
});

describe('loader controller', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for real readiness, then reveals the hero and releases the scroll lock', async () => {
    document.body.innerHTML = loaderMarkup();
    let resolveCritical;
    const criticalReady = new Promise((resolve) => { resolveCritical = resolve; });

    const completion = runLoader({
      criticalReady,
      reducedMotion: true,
      timeoutMs: 500,
    });

    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.querySelector('#loaderPct').textContent).toBe('00');

    resolveCritical();
    await expect(completion).resolves.toEqual({ timedOut: false });

    expect(document.querySelector('#loader').classList.contains('is-gone')).toBe(true);
    expect(document.querySelector('#loaderStage').hidden).toBe(true);
    expect(document.querySelector('#loaderPct').textContent).toBe('100');
    expect(document.body.classList.contains('is-locked')).toBe(false);
  });

  it('unlocks the page after the bounded readiness timeout', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = loaderMarkup();

    const completion = runLoader({
      criticalReady: new Promise(() => {}),
      reducedMotion: true,
      timeoutMs: 120,
    });

    expect(document.body.classList.contains('is-locked')).toBe(true);
    await vi.advanceTimersByTimeAsync(120);

    await expect(completion).resolves.toEqual({ timedOut: true });
    expect(document.querySelector('#loader').classList.contains('is-gone')).toBe(true);
    expect(document.body.classList.contains('is-locked')).toBe(false);
  });
});
