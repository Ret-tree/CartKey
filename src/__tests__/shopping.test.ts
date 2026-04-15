import { describe, it, expect } from 'vitest';
import {
  autoCategory, parseIngredient, aggregateIngredients, matchItemToCoupons,
} from '../data/shopping';
import { MOCK_COUPONS } from '../data/coupons';

describe('autoCategory', () => {
  it('categorizes produce items', () => {
    expect(autoCategory('banana')).toBe('produce');
    expect(autoCategory('Organic Spinach')).toBe('produce');
    expect(autoCategory('fresh strawberries')).toBe('produce');
  });

  it('categorizes dairy items', () => {
    expect(autoCategory('whole milk')).toBe('dairy');
    expect(autoCategory('cheddar cheese')).toBe('dairy');
    expect(autoCategory('Greek yogurt')).toBe('dairy');
  });

  it('categorizes meat items', () => {
    expect(autoCategory('chicken breast')).toBe('meat');
    expect(autoCategory('ground beef')).toBe('meat');
    expect(autoCategory('salmon fillet')).toBe('meat');
  });

  it('categorizes household items', () => {
    expect(autoCategory('paper towels')).toBe('household');
    expect(autoCategory('dish soap')).toBe('household');
  });

  it('returns other for unknown items', () => {
    expect(autoCategory('xylophone')).toBe('other');
  });
});

describe('parseIngredient', () => {
  it('parses quantity + unit + name', () => {
    const r = parseIngredient('2 cups flour');
    expect(r.quantity).toBe(2);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('flour');
  });

  it('parses quantity + name without unit', () => {
    const r = parseIngredient('3 bananas');
    expect(r.quantity).toBe(3);
    expect(r.name).toContain('banana');
  });

  it('parses decimal quantities', () => {
    const r = parseIngredient('1.5 lb chicken');
    expect(r.quantity).toBe(1.5);
    expect(r.unit).toBe('lb');
  });

  it('handles plain text with no quantity', () => {
    const r = parseIngredient('salt and pepper');
    expect(r.name).toBe('salt and pepper');
    expect(r.quantity).toBe(1);
  });

  it('assigns category automatically', () => {
    const r = parseIngredient('2 cups milk');
    expect(r.category).toBe('dairy');
  });
});

describe('aggregateIngredients', () => {
  it('combines identical ingredients', () => {
    const result = aggregateIngredients([
      { name: 'flour', quantity: 2, unit: 'cup', category: 'grains' },
      { name: 'flour', quantity: 1, unit: 'cup', category: 'grains' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('keeps different units separate', () => {
    const result = aggregateIngredients([
      { name: 'butter', quantity: 2, unit: 'tbsp', category: 'dairy' },
      { name: 'butter', quantity: 1, unit: 'cup', category: 'dairy' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('handles case-insensitive matching', () => {
    const result = aggregateIngredients([
      { name: 'Garlic', quantity: 3, unit: '', category: 'produce' },
      { name: 'garlic', quantity: 2, unit: '', category: 'produce' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it('handles empty array', () => {
    expect(aggregateIngredients([])).toHaveLength(0);
  });
});

describe('matchItemToCoupons', () => {
  it('finds matching coupons for a product', () => {
    const matches = matchItemToCoupons('spinach', MOCK_COUPONS);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches).toContain('c001'); // Organic Baby Spinach coupon
  });

  it('matches by brand name', () => {
    const matches = matchItemToCoupons('Chobani', MOCK_COUPONS);
    expect(matches).toContain('c010');
  });

  it('returns empty for unmatched items', () => {
    const matches = matchItemToCoupons('uranium rods', MOCK_COUPONS);
    expect(matches).toHaveLength(0);
  });

  it('handles case insensitivity', () => {
    const matches = matchItemToCoupons('OATLY', MOCK_COUPONS);
    expect(matches).toContain('c011');
  });
});
