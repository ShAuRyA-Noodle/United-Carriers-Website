import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const markup = readFileSync('index.html', 'utf8');
const hero = markup.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] ?? '';

describe('United Carriers hero markup', () => {
  it('uses the audited source copy and wordmark', () => {
    expect(hero).toContain('<span>UNITED</span><em>CARRIERS</em>');
    expect(hero).toContain('>Every</span>');
    expect(hero).toContain('>leg of the</span>');
    expect(hero).toContain('>journey</span>');
    expect(hero).toContain('Freight forwarding, land transport, and');
    expect(hero).toContain('customs brokerage, unified across APAC');
    expect(hero).toContain('under one accountable team.');
  });

  it('leaves out fabricated hero telemetry and the drag instruction', () => {
    expect(hero).not.toContain('readout');
    expect(hero).not.toContain('DRAG TO ORBIT');
  });
});
