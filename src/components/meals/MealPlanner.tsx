import { useState, useMemo } from 'react';
import { SAMPLE_RECIPES } from '../../data/recipes';
import type { Recipe, ShoppingList, ShoppingItem, PantryItem } from '../../data/shopping';
import { aggregateIngredients, autoCategory, matchItemToCoupons } from '../../data/shopping';
import { generateId } from '../../lib/geo';
import { MOCK_COUPONS } from '../../data/coupons';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
interface PlannedMeal { day: number; slot: MealSlot; recipeId: string; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS: { id: MealSlot; icon: string }[] = [
  { id: 'breakfast', icon: '🌅' }, { id: 'lunch', icon: '☀️' },
  { id: 'dinner', icon: '🌙' }, { id: 'snack', icon: '🍎' },
];

interface Props {
  pantryItems: PantryItem[];
  onGenerateList: (list: ShoppingList) => void;
}

export function MealPlanner({ pantryItems, onGenerateList }: Props) {
  const [view, setView] = useState<'planner' | 'recipes'>('planner');
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [addingTo, setAddingTo] = useState<{ day: number; slot: MealSlot } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const recipes = SAMPLE_RECIPES;
  const activeCoupons = useMemo(() => MOCK_COUPONS.filter((c) => new Date(c.validUntil) >= new Date()), []);

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return recipes;
    const q = recipeSearch.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  const getMeal = (day: number, slot: MealSlot) => {
    const m = meals.find((x) => x.day === day && x.slot === slot);
    return m ? recipes.find((r) => r.id === m.recipeId) : null;
  };

  const assignRecipe = (recipeId: string) => {
    if (!addingTo) return;
    setMeals((p) => [...p.filter((m) => !(m.day === addingTo.day && m.slot === addingTo.slot)), { ...addingTo, recipeId }]);
    setAddingTo(null);
  };

  const removeMeal = (day: number, slot: MealSlot) => {
    setMeals((p) => p.filter((m) => !(m.day === day && m.slot === slot)));
  };

  const generateShoppingList = () => {
    const allIngredients = meals.flatMap((m) => {
      const r = recipes.find((x) => x.id === m.recipeId);
      return r ? r.ingredients : [];
    });
    const aggregated = aggregateIngredients(allIngredients);

    // Subtract pantry items
    const pantryMap = new Map(pantryItems.map((p) => [p.name.toLowerCase(), p]));
    const needed = aggregated.filter((ing) => {
      const pantry = pantryMap.get(ing.name.toLowerCase());
      if (!pantry) return true;
      return pantry.quantity < ing.quantity;
    });

    const items: ShoppingItem[] = needed.map((ing) => ({
      id: generateId(), name: ing.name, quantity: ing.quantity, unit: ing.unit,
      category: ing.category || autoCategory(ing.name), checked: false,
      dietaryTags: [], matchedCouponIds: matchItemToCoupons(ing.name, activeCoupons),
    }));

    const list: ShoppingList = {
      id: generateId(), name: `Meal Plan — Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      items, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onGenerateList(list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-forest-600 font-display">Meal Planner</h2>
          {meals.length > 0 && (
            <button onClick={generateShoppingList}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-forest-600 active:scale-95 transition-transform">
              🛒 Generate List
            </button>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-3">
          <button onClick={() => setView('planner')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: view === 'planner' ? 'white' : 'transparent', color: view === 'planner' ? '#1B4332' : '#6B7280', boxShadow: view === 'planner' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            📅 Week Plan
          </button>
          <button onClick={() => setView('recipes')} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: view === 'recipes' ? 'white' : 'transparent', color: view === 'recipes' ? '#1B4332' : '#6B7280', boxShadow: view === 'recipes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            📖 Recipes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {view === 'planner' ? (
          <div className="space-y-3">
            {meals.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                Tap any meal slot below to add a recipe, then generate a shopping list.
              </div>
            )}
            {DAYS.map((day, di) => (
              <div key={day} className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50">
                  <p className="text-xs font-bold text-gray-700">{day}</p>
                </div>
                <div className="p-2 grid grid-cols-4 gap-1.5">
                  {SLOTS.map((slot) => {
                    const recipe = getMeal(di, slot.id);
                    return (
                      <button key={slot.id}
                        onClick={() => recipe ? removeMeal(di, slot.id) : setAddingTo({ day: di, slot: slot.id })}
                        className="flex flex-col items-center p-1.5 rounded-lg text-center transition-all min-h-[52px]"
                        style={{ background: recipe ? '#ECFDF5' : '#F9FAFB', border: `1px solid ${recipe ? '#A7F3D0' : '#E5E7EB'}` }}>
                        <span className="text-sm">{slot.icon}</span>
                        {recipe ? (
                          <span className="text-[9px] font-medium text-forest-600 leading-tight mt-0.5 line-clamp-2">{recipe.name}</span>
                        ) : (
                          <span className="text-[9px] text-gray-300 mt-0.5">+ Add</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {meals.length > 0 && (
              <div className="p-3 rounded-xl bg-forest-50 border border-forest-500/20">
                <p className="text-xs font-semibold text-forest-600">{meals.length} meals planned</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {aggregateIngredients(meals.flatMap((m) => recipes.find((r) => r.id === m.recipeId)?.ingredients ?? [])).length} unique ingredients needed
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" placeholder="Search recipes..." value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-forest-500/20" />
            {filteredRecipes.map((recipe) => (
              <button key={recipe.id} onClick={() => setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe)}
                className="w-full text-left p-3 rounded-2xl border border-gray-100 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">{recipe.name}</p>
                  <div className="flex gap-1">
                    {recipe.dietaryTags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-green-50 text-green-700">{t === 'gluten-free' ? 'GF' : t === 'vegan' ? 'V' : t.slice(0, 4)}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{recipe.description}</p>
                <p className="text-[10px] text-gray-300 mt-1">
                  {recipe.servings} servings · {recipe.prepTime + recipe.cookTime} min · {recipe.ingredients.length} ingredients
                </p>
                {selectedRecipe?.id === recipe.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Ingredients</p>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {recipe.ingredients.map((ing, i) => (
                        <span key={i} className="text-[11px] text-gray-600">{ing.quantity} {ing.unit} {ing.name}</span>
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Steps</p>
                    {recipe.instructions.map((step, i) => (
                      <p key={i} className="text-[11px] text-gray-500 mb-1">{i + 1}. {step}</p>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipe picker modal */}
      {addingTo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in" onClick={() => setAddingTo(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white animate-slide-up p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold text-forest-600 font-display mb-3">
              {DAYS[addingTo.day]} — {addingTo.slot.charAt(0).toUpperCase() + addingTo.slot.slice(1)}
            </p>
            <div className="space-y-2">
              {recipes.map((r) => (
                <button key={r.id} onClick={() => assignRecipe(r.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-left active:scale-[0.98] transition-transform">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.prepTime + r.cookTime} min · {r.ingredients.length} ingredients</p>
                  </div>
                  <span className="text-xs text-forest-500 font-semibold">Add</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
