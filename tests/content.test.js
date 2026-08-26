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

  it('stores hero action labels as the prescribed label array', () => {
    expect(CONTENT.hero.actions).toEqual(['Talk with us', 'Our services']);
  });

  it('preserves the live-source casing of the closing CTA action', () => {
    expect(CONTENT.closingCta.action).toBe('work with us');
  });

  it('keeps the footer legal links limited to the live-source list', () => {
    expect(CONTENT.footer.legal.links).toEqual([
      'QHSE',
      'Privacy Policy',
      'TERMS & CONDITIONS',
      'Payment Policy',
      'Delivery Policy',
      'Refund & Returns Policy',
    ]);
  });

  it('preserves audited source copy that has source-specific spelling', () => {
    expect(CONTENT.introduction.kicker).toBe('From countless journeys, clarity emerges');
    expect(CONTENT.reliability[1]).toEqual({
      title: 'Global Network overage',
      body: 'From APAC lanes to international corridors, our partner network spans every major trade route your business relies on.',
    });
  });
});
