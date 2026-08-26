import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/data/content.js';
import reviewedContent from './fixtures/content.snapshot.json';

function expectDeepFreeze(value) {
  expect(Object.isFrozen(value)).toBe(true);

  if (value && typeof value === 'object') {
    Object.values(value).forEach(expectDeepFreeze);
  }
}

function expectCollectionSchema(records, fields) {
  expect(Array.isArray(records)).toBe(true);

  records.forEach((record) => {
    fields.forEach((field) => {
      expect(record).toHaveProperty(field);
      expect(record[field]).toEqual(expect.any(String));
      expect(record[field].trim()).not.toBe('');
    });
  });
}

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

  it('deeply freezes nested records and arrays against mutation', () => {
    expectDeepFreeze(CONTENT);
    expect(() => CONTENT.hero.heading.push('mutation')).toThrow(TypeError);
    expect(() => {
      CONTENT.services[0].title = 'mutation';
    }).toThrow(TypeError);
    expect(() => {
      CONTENT.footer.company.links[0] = 'mutation';
    }).toThrow(TypeError);
  });

  it('keeps collection schemas usable and service ids unique', () => {
    expectCollectionSchema(CONTENT.services, ['id', 'title', 'body']);
    expectCollectionSchema(CONTENT.benefits, ['title', 'body']);
    expectCollectionSchema(CONTENT.testimonials, ['quote', 'name', 'role', 'company']);
    expectCollectionSchema(CONTENT.insights, ['category', 'date', 'title']);
    expectCollectionSchema(CONTENT.faq, ['question', 'answer']);
    expect(new Set(CONTENT.services.map(({ id }) => id)).size).toBe(CONTENT.services.length);
  });

  it('matches the reviewed source content snapshot', () => {
    expect(CONTENT).toEqual(reviewedContent);
  });
});
