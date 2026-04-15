export const DIETARY_TYPES = [
  { id: 'omnivore', label: 'Omnivore', icon: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'keto', label: 'Keto', icon: '🥩' },
  { id: 'paleo', label: 'Paleo', icon: '🦴' },
  { id: 'whole30', label: 'Whole30', icon: '🍳' },
] as const;

export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'treenuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'fish', label: 'Fish', icon: '🐠' },
  { id: 'sesame', label: 'Sesame', icon: '🫓' },
] as const;

// Map diet types to allergens they implicitly exclude
export const DIET_EXCLUSIONS: Record<string, string[]> = {
  vegan: ['dairy', 'eggs', 'fish', 'shellfish'],
  vegetarian: ['fish', 'shellfish'],
  pescatarian: [],
  keto: [],
  paleo: ['dairy', 'gluten', 'soy'],
  whole30: ['dairy', 'gluten', 'soy'],
  omnivore: [],
};
