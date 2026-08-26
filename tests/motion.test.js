import { afterEach, describe, expect, it, vi } from 'vitest';
import { lifecycle, motionPreferences } from '../src/core/motion.js';

describe('motion preferences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports reduced motion from matchMedia', () => {
    window.matchMedia = vi.fn(() => ({ matches: true }));

    expect(motionPreferences().reduced).toBe(true);
  });

  it('reports full motion when matchMedia does not match', () => {
    window.matchMedia = vi.fn(() => ({ matches: false }));

    expect(motionPreferences().reduced).toBe(false);
  });
});

describe('lifecycle', () => {
  it('destroys supplied resources in reverse order and skips empty values', () => {
    const calls = [];
    const cleanup = lifecycle(
      { destroy: () => calls.push('first') },
      null,
      { destroy: () => calls.push('last') },
    );

    cleanup();

    expect(calls).toEqual(['last', 'first']);
  });

  it('runs cleanup only once when callers dispose more than once', () => {
    const calls = [];
    const cleanup = lifecycle(
      { destroy: () => calls.push('first') },
      { destroy: () => calls.push('last') },
    );

    cleanup();
    cleanup();

    expect(calls).toEqual(['last', 'first']);
  });
});
