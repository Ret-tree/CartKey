import { describe, it, expect } from 'vitest';
import {
  validateCardNumber, getCardRule, luhnCheck, formatCardDisplay, maskCardNumber,
} from '../lib/cardValidation';

describe('getCardRule', () => {
  it('returns rules for known stores', () => {
    const rule = getCardRule('kroger');
    expect(rule.storeId).toBe('kroger');
    expect(rule.digitsOnly).toBe(true);
    expect(rule.minLength).toBeGreaterThanOrEqual(10);
  });

  it('returns fallback for unknown stores', () => {
    const rule = getCardRule('nonexistent');
    expect(rule.storeId).toBe('other');
    expect(rule.minLength).toBe(4);
  });

  it('has rules for all 16 stores', () => {
    const storeIds = ['kroger', 'safeway', 'walmart', 'target', 'costco', 'traderjoes', 'wholefds', 'aldi', 'publix', 'heb', 'wegmans', 'harristeeter', 'foodlion', 'giantfood', 'lidl', 'other'];
    storeIds.forEach((id) => {
      const rule = getCardRule(id);
      expect(rule.storeId).toBe(id);
      expect(rule.hint).toBeTruthy();
      expect(rule.example).toBeTruthy();
    });
  });
});

describe('validateCardNumber', () => {
  it('accepts valid Kroger card (12 digits)', () => {
    const r = validateCardNumber('kroger', '012345678901');
    expect(r.valid).toBe(true);
    expect(r.error).toBeNull();
    expect(r.sanitized).toBe('012345678901');
  });

  it('rejects non-numeric Kroger card', () => {
    const r = validateCardNumber('kroger', '0123ABCD8901');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('numbers only');
  });

  it('rejects too-short card', () => {
    const r = validateCardNumber('kroger', '123');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('short');
  });

  it('rejects too-long card', () => {
    const r = validateCardNumber('costco', '1234567890123'); // 13 digits, max is 12
    expect(r.valid).toBe(false);
    expect(r.error).toContain('long');
  });

  it('accepts exact-length Costco card (12 digits)', () => {
    const r = validateCardNumber('costco', '111234567890');
    expect(r.valid).toBe(true);
  });

  it('strips spaces and dashes during sanitization', () => {
    const r = validateCardNumber('kroger', '0123 4567 8901');
    expect(r.valid).toBe(true);
    expect(r.sanitized).toBe('012345678901');
  });

  it('strips dashes', () => {
    const r = validateCardNumber('kroger', '0123-4567-8901');
    expect(r.valid).toBe(true);
    expect(r.sanitized).toBe('012345678901');
  });

  it('accepts alphanumeric for stores that allow it', () => {
    const r = validateCardNumber('walmart', 'ABC123DEF');
    expect(r.valid).toBe(true);
  });

  it('rejects empty card number', () => {
    const r = validateCardNumber('kroger', '');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('required');
  });

  it('rejects whitespace-only input', () => {
    const r = validateCardNumber('kroger', '   ');
    expect(r.valid).toBe(false);
  });

  it('validates other/custom store with relaxed rules', () => {
    const r = validateCardNumber('other', 'MYCARD123');
    expect(r.valid).toBe(true);
  });
});

describe('luhnCheck', () => {
  it('validates known Luhn numbers', () => {
    expect(luhnCheck('79927398713')).toBe(true);
    expect(luhnCheck('4539578763621486')).toBe(true);
  });

  it('rejects invalid Luhn numbers', () => {
    expect(luhnCheck('79927398710')).toBe(false);
    expect(luhnCheck('1234567890')).toBe(false);
  });

  it('rejects single digit', () => {
    expect(luhnCheck('5')).toBe(false);
  });
});

describe('formatCardDisplay', () => {
  it('groups digits in 4s for digit-only stores', () => {
    expect(formatCardDisplay('012345678901', 'kroger')).toBe('0123 4567 8901');
  });

  it('does not group short numbers', () => {
    expect(formatCardDisplay('1234', 'kroger')).toBe('1234');
  });

  it('returns alphanumeric as-is', () => {
    expect(formatCardDisplay('ABC123', 'walmart')).toBe('ABC123');
  });
});

describe('maskCardNumber', () => {
  it('masks all but last 4 digits', () => {
    expect(maskCardNumber('012345678901')).toBe('••••••••8901');
  });

  it('returns short numbers as-is', () => {
    expect(maskCardNumber('1234')).toBe('1234');
  });

  it('handles 5-character number', () => {
    expect(maskCardNumber('12345')).toBe('•2345');
  });
});
