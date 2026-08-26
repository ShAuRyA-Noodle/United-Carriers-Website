import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/data/content.js';

describe('homepage content contract', () => {
  it('contains the exact primary homepage sequence', () => {
    expect(CONTENT.hero.heading).toEqual(['Every', 'leg of the', 'journey']);
    expect(CONTENT.services).toHaveLength(6);
    expect(CONTENT.benefits).toHaveLength(5);
    expect(CONTENT.testimonials).toHaveLength(3);
    expect(CONTENT.insights).toHaveLength(6);
    expect(CONTENT.faq).toHaveLength(8);
  });

  it('preserves audited source copy that has source-specific spelling', () => {
    expect(CONTENT.introduction.kicker).toBe('From countless journeys, clarity emerges');
    expect(CONTENT.reliability[1]).toEqual({
      title: 'Global Network overage',
      body: 'From APAC lanes to international corridors, our partner network spans every major trade route your business relies on.',
    });
  });
});
