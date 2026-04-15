// ─── Retailer Card Format Rules ───

export interface CardFormatRule {
  storeId: string;
  digitsOnly: boolean;
  minLength: number;
  maxLength: number;
  pattern?: RegExp;
  luhn?: boolean;
  hint: string;
  example: string;
}

const CARD_RULES: Record<string, CardFormatRule> = {
  kroger: { storeId: 'kroger', digitsOnly: true, minLength: 10, maxLength: 13, hint: '10–13 digit number on your Plus Card', example: '012345678901' },
  safeway: { storeId: 'safeway', digitsOnly: true, minLength: 10, maxLength: 13, hint: '10–13 digit Club Card number', example: '0123456789' },
  walmart: { storeId: 'walmart', digitsOnly: false, minLength: 4, maxLength: 20, hint: 'Walmart+ account ID or phone number', example: '5551234567' },
  target: { storeId: 'target', digitsOnly: true, minLength: 9, maxLength: 13, hint: '9–13 digit Target Circle number', example: '012345678' },
  costco: { storeId: 'costco', digitsOnly: true, minLength: 12, maxLength: 12, hint: '12-digit membership number', example: '111234567890' },
  traderjoes: { storeId: 'traderjoes', digitsOnly: false, minLength: 4, maxLength: 20, hint: 'Phone number or account ID', example: '5551234567' },
  wholefds: { storeId: 'wholefds', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'Prime/Whole Foods member number', example: '0123456789' },
  aldi: { storeId: 'aldi', digitsOnly: false, minLength: 4, maxLength: 20, hint: 'ALDIconnect account number', example: '5551234567' },
  publix: { storeId: 'publix', digitsOnly: true, minLength: 10, maxLength: 13, hint: '10–13 digit Club Publix number', example: '0123456789' },
  heb: { storeId: 'heb', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'H-E-B loyalty number', example: '0123456789' },
  wegmans: { storeId: 'wegmans', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'Shoppers Club number', example: '0123456789' },
  harristeeter: { storeId: 'harristeeter', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'VIC card number', example: '0123456789' },
  foodlion: { storeId: 'foodlion', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'MVP card number', example: '0123456789' },
  giantfood: { storeId: 'giantfood', digitsOnly: true, minLength: 10, maxLength: 13, hint: 'Giant Card number', example: '0123456789' },
  lidl: { storeId: 'lidl', digitsOnly: false, minLength: 4, maxLength: 20, hint: 'Lidl Plus account ID', example: '5551234567' },
  other: { storeId: 'other', digitsOnly: false, minLength: 4, maxLength: 30, hint: 'Your loyalty card number', example: '1234567890' },
};

export function getCardRule(storeId: string): CardFormatRule {
  return CARD_RULES[storeId] || CARD_RULES['other'];
}

// ─── Validation ───

export interface ValidationResult {
  valid: boolean;
  error: string | null;
  sanitized: string;
}

export function validateCardNumber(storeId: string, raw: string): ValidationResult {
  const rule = getCardRule(storeId);
  let sanitized = raw.trim();

  // Strip common separators
  sanitized = sanitized.replace(/[\s\-\.]/g, '');

  if (!sanitized) {
    return { valid: false, error: 'Card number is required', sanitized };
  }

  // Digits-only check
  if (rule.digitsOnly) {
    if (!/^\d+$/.test(sanitized)) {
      return { valid: false, error: 'This card uses numbers only', sanitized: sanitized.replace(/\D/g, '') };
    }
  } else {
    // Alphanumeric only
    sanitized = sanitized.replace(/[^0-9a-zA-Z]/g, '');
  }

  // Length check
  if (sanitized.length < rule.minLength) {
    return { valid: false, error: `Too short — needs at least ${rule.minLength} characters`, sanitized };
  }
  if (sanitized.length > rule.maxLength) {
    return { valid: false, error: `Too long — maximum ${rule.maxLength} characters`, sanitized: sanitized.slice(0, rule.maxLength) };
  }

  // Pattern check
  if (rule.pattern && !rule.pattern.test(sanitized)) {
    return { valid: false, error: 'Invalid format for this store', sanitized };
  }

  // Luhn check
  if (rule.luhn && !luhnCheck(sanitized)) {
    return { valid: false, error: 'Card number appears invalid — check for typos', sanitized };
  }

  return { valid: true, error: null, sanitized };
}

// ─── Luhn Algorithm ───
export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 2) return false;

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

// ─── Formatting ───
export function formatCardDisplay(number: string, storeId: string): string {
  const rule = getCardRule(storeId);
  if (rule.digitsOnly && number.length >= 8) {
    // Group in 4s like credit card
    return number.replace(/(.{4})/g, '$1 ').trim();
  }
  return number;
}

export function maskCardNumber(number: string): string {
  if (number.length <= 4) return number;
  return '•'.repeat(number.length - 4) + number.slice(-4);
}
