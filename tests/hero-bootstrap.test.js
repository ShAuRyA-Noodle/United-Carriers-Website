import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const main = readFileSync('src/main.js', 'utf8');
const scroll = readFileSync('src/scroll.js', 'utf8');

describe('hero bootstrap ownership', () => {
  it('delegates the globe, render loop, and readiness gate to the hero controller', () => {
    expect(main).toContain("import { bindHeroVisibility, initHero } from './components/hero.js';");
    expect(main).toContain('const hero = await initHero(');
    expect(main).toContain('await runLoader({ criticalReady: [hero.ready], reducedMotion: reduced });');
    expect(main).not.toContain('new Globe(');
    expect(main).not.toContain('requestAnimationFrame(');
    expect(main).not.toContain('bindDragHint');
    expect(main).not.toContain('startTelemetry');
  });

  it('drives the controller dive state as the hero scroll exit progresses', () => {
    expect(scroll).toContain('hero.setDive(state.p)');
  });
});
