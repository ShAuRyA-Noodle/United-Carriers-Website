import { describe, expect, it, vi } from 'vitest';
import { Globe } from '../src/globe/Globe.js';

describe('Globe lifecycle', () => {
  it('removes every pointer and resize listener when disposed', () => {
    const canvas = document.createElement('canvas');
    const removeCanvasListener = vi.spyOn(canvas, 'removeEventListener');
    const removeWindowListener = vi.spyOn(window, 'removeEventListener');
    const globe = Object.create(Globe.prototype);

    Object.assign(globe, {
      arcs: { dispose: vi.fn() },
      canvas,
      labels: { dispose: vi.fn() },
      renderer: { dispose: vi.fn() },
      size: { h: 100, w: 100 },
      resize: vi.fn(),
    });

    globe._bind();
    globe.dispose();

    expect(removeCanvasListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
