// ─── Shopping List ───
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  brand?: string;
  note?: string;
  checked: boolean;
  dietaryTags: string[];
  matchedCouponIds: string[];
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Recipes & Meal Planning ───
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  dietaryTags: string[];
  sourceUrl?: string;
  createdAt: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  meals: { slot: MealSlot; recipeId: string }[];
}

export interface MealPlan {
  id: string;
  name: string;
  days: MealPlanDay[];
  createdAt: string;
}

// ─── Pantry ───
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiresAt?: string;
  addedAt: string;
}

// ─── Category constants ───
export const GROCERY_CATEGORIES = [
  'produce', 'dairy', 'meat', 'bakery', 'snacks', 'beverages',
  'frozen', 'canned', 'condiments', 'grains', 'household', 'personal', 'other',
] as const;

export const UNITS = ['', 'oz', 'lb', 'g', 'kg', 'cup', 'tbsp', 'tsp', 'ml', 'l', 'gal', 'ct', 'pkg', 'can', 'bottle', 'bunch', 'bag'] as const;

// ─── Auto-categorization ───
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'pepper', 'garlic', 'lemon', 'lime', 'avocado', 'spinach', 'kale', 'broccoli', 'celery', 'cucumber', 'mushroom', 'berry', 'grape', 'orange', 'strawberr', 'blueberr', 'mango', 'peach', 'pear', 'cilantro', 'basil', 'parsley', 'ginger', 'jalapeño', 'zucchini', 'squash', 'corn', 'pea'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'egg', 'eggs', 'cottage', 'mozzarella', 'cheddar', 'parmesan', 'ricotta', 'whipping'],
  meat: ['chicken', 'beef', 'pork', 'steak', 'ground', 'turkey', 'bacon', 'sausage', 'salmon', 'shrimp', 'fish', 'lamb', 'ham', 'hot dog', 'tuna', 'cod', 'tilapia'],
  bakery: ['bread', 'roll', 'bagel', 'muffin', 'tortilla', 'pita', 'croissant', 'bun', 'cake', 'pie', 'donut', 'baguette', 'naan'],
  snacks: ['chip', 'cracker', 'cookie', 'pretzel', 'popcorn', 'nut', 'granola bar', 'trail mix', 'candy', 'chocolate'],
  beverages: ['water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine', 'seltzer', 'kombucha', 'lemonade', 'smoothie'],
  frozen: ['frozen', 'ice cream', 'pizza', 'fries', 'popsicle', 'waffle', 'burrito'],
  canned: ['canned', 'soup', 'beans', 'diced tomato', 'broth', 'stock', 'tuna can', 'coconut milk'],
  condiments: ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing', 'vinegar', 'oil', 'soy sauce', 'hot sauce', 'salsa', 'honey', 'jam', 'syrup', 'peanut butter'],
  grains: ['rice', 'pasta', 'noodle', 'flour', 'oat', 'cereal', 'quinoa', 'couscous', 'bread crumb', 'sugar', 'cornstarch'],
  household: ['soap', 'detergent', 'paper towel', 'toilet paper', 'trash bag', 'foil', 'wrap', 'sponge', 'cleaner', 'bleach', 'tissue'],
  personal: ['shampoo', 'conditioner', 'toothpaste', 'deodorant', 'lotion', 'razor', 'sunscreen', 'floss'],
};

export function autoCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'other';
}

// ─── Ingredient Parser ───
const UNIT_PATTERNS = /^(\d+\.?\d*)\s*(oz|lb|g|kg|cups?|tbsp|tsp|ml|l|gal|ct|pkg|cans?|bottles?|bunch|bags?|cloves?|stalks?|slices?|pieces?)?\s*(.+)/i;

export function parseIngredient(raw: string): RecipeIngredient {
  const match = raw.trim().match(UNIT_PATTERNS);
  if (match) {
    const quantity = parseFloat(match[1]);
    const unit = (match[2] || '').replace(/s$/, '').toLowerCase();
    const name = match[3].trim();
    return { name, quantity, unit, category: autoCategory(name) };
  }
  return { name: raw.trim(), quantity: 1, unit: '', category: autoCategory(raw) };
}

// ─── Ingredient Aggregation ───
export function aggregateIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
  const map = new Map<string, RecipeIngredient>();
  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase()}|${ing.unit}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += ing.quantity;
    } else {
      map.set(key, { ...ing });
    }
  }
  return Array.from(map.values());
}

// ─── Coupon Matching ───
export function matchItemToCoupons(
  itemName: string,
  coupons: { id: string; productName: string; brand: string; categories: string[] }[]
): string[] {
  const lower = itemName.toLowerCase();
  return coupons
    .filter((c) => {
      const pn = c.productName.toLowerCase();
      const br = c.brand.toLowerCase();
      return pn.includes(lower) || lower.includes(pn.split(' ')[0]) || (br && lower.includes(br));
    })
    .map((c) => c.id);
}
