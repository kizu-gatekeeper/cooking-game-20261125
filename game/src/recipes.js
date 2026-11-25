// Ingredients and recipes for Sizzle Station.
// Every dish is built from the same six ingredients, combined in different
// ways, so the player plans a route: bins -> grill / chopping board -> plate.

// prep: "none" = ready as picked up, "grill" = needs the grill,
// "chop" = needs the chopping board. cookedId is what the item becomes.
export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',     icon: '🍞', color: '#e8b45a', prep: 'none' },
  patty:   { id: 'patty',   name: 'Patty',   icon: '🥩', color: '#b0563a', prep: 'grill', cookedId: 'pattyCooked' },
  lettuce: { id: 'lettuce', name: 'Lettuce', icon: '🥬', color: '#7dc24a', prep: 'chop', cookedId: 'lettuceChopped' },
  tomato:  { id: 'tomato',  name: 'Tomato',  icon: '🍅', color: '#e14b32', prep: 'chop', cookedId: 'tomatoChopped' },
  cheese:  { id: 'cheese',  name: 'Cheese',  icon: '🧀', color: '#f5c542', prep: 'none' },
  onion:   { id: 'onion',   name: 'Onion',   icon: '🧅', color: '#d9a0d0', prep: 'chop', cookedId: 'onionChopped' },
  pattyCooked:    { id: 'pattyCooked',    name: 'Grilled Patty', icon: '🍖', color: '#8a4a28', prep: 'none' },
  lettuceChopped: { id: 'lettuceChopped', name: 'Shredded Lettuce', icon: '🥬', color: '#8fd45e', prep: 'none' },
  tomatoChopped:  { id: 'tomatoChopped',  name: 'Sliced Tomato', icon: '🍅', color: '#f2603f', prep: 'none' },
  onionChopped:   { id: 'onionChopped',   name: 'Diced Onion', icon: '🧅', color: '#e3b3e0', prep: 'none' },
};

export function ingredientName(id) {
  return INGREDIENTS[id] ? INGREDIENTS[id].name : id;
}

export function ingredientIcon(id) {
  return INGREDIENTS[id] ? INGREDIENTS[id].icon : '❓';
}

// A recipe lists the finished ingredient ids that must sit on the plate,
// in any order. price is the base coin payout; patience is seconds before
// the customer walks out.
export const RECIPES = [
  {
    id: 'sunny-stack',
    name: 'Sunny Stack',
    icon: '🍔',
    needs: ['bun', 'pattyCooked', 'lettuceChopped'],
    price: 18,
    patience: 75,
  },
  {
    id: 'melt-deluxe',
    name: 'Melt Deluxe',
    icon: '🧀',
    needs: ['bun', 'pattyCooked', 'cheese', 'tomatoChopped'],
    price: 24,
    patience: 90,
  },
  {
    id: 'garden-crunch',
    name: 'Garden Crunch',
    icon: '🥗',
    needs: ['bun', 'lettuceChopped', 'tomatoChopped', 'onionChopped'],
    price: 20,
    patience: 80,
  },
  {
    id: 'double-trouble',
    name: 'Double Trouble',
    icon: '🍔',
    needs: ['bun', 'pattyCooked', 'pattyCooked', 'cheese'],
    price: 30,
    patience: 100,
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// True when the plate holds exactly the recipe's ingredients (order free,
// duplicates counted).
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const rest = recipe.needs.slice();
  for (const item of plate) {
    const i = rest.indexOf(item);
    if (i === -1) return false;
    rest.splice(i, 1);
  }
  return rest.length === 0;
}

// The best recipe a plate could still become, or null when it matches none.
export function plateFitsAnyRecipe(plate) {
  return RECIPES.some((r) => {
    if (plate.length > r.needs.length) return false;
    const rest = r.needs.slice();
    for (const item of plate) {
      const i = rest.indexOf(item);
      if (i === -1) return false;
      rest.splice(i, 1);
    }
    return true;
  });
}
