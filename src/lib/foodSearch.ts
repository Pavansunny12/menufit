export interface FoodSearchResult {
  id: number;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  category?: string;
}

export interface SearchResponse {
  results: FoodSearchResult[];
  restaurantName?: string;
  isRestaurantSearch: boolean;
}

// Use env variable if available, otherwise DEMO_KEY (30 req/hr limit)
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';

const RESTAURANT_ALIASES: Record<string, string> = {
  "mcdonalds": "McDonald's",
  "mcdonald": "McDonald's",
  "mcd": "McDonald's",
  "burger king": "Burger King",
  "bk": "Burger King",
  "chick fil a": "Chick-fil-A",
  "chick-fil-a": "Chick-fil-A",
  "chickfila": "Chick-fil-A",
  "subway": "Subway",
  "taco bell": "Taco Bell",
  "tacobell": "Taco Bell",
  "chipotle": "Chipotle Mexican Grill",
  "wendys": "Wendy's",
  "wendy": "Wendy's",
  "kfc": "KFC",
  "dominos": "Domino's Pizza",
  "domino": "Domino's Pizza",
  "pizza hut": "Pizza Hut",
  "starbucks": "Starbucks",
  "dunkin": "Dunkin'",
  "dunkin donuts": "Dunkin'",
  "panda express": "Panda Express",
  "pandaexpress": "Panda Express",
  "popeyes": "Popeyes",
  "five guys": "Five Guys",
  "in n out": "In-N-Out Burger",
  "shake shack": "Shake Shack",
  "whataburger": "Whataburger",
  "sonic": "Sonic Drive-In",
  "arby": "Arby's",
  "arbys": "Arby's",
  "dairy queen": "Dairy Queen",
  "dq": "Dairy Queen",
  "little caesars": "Little Caesars",
  "panera": "Panera Bread",
  "panera bread": "Panera Bread",
  "olive garden": "Olive Garden",
  "applebees": "Applebee's",
  "ihop": "IHOP",
  "denny": "Denny's",
  "dennys": "Denny's",
  "chilis": "Chili's",
  "chili's": "Chili's",
  "boston market": "Boston Market",
  "jack in the box": "Jack In The Box",
  "carl's jr": "Carl's Jr.",
  "hardees": "Hardee's",
  "jersey mike": "Jersey Mike's Subs",
  "jimmy john": "Jimmy John's",
  "firehouse subs": "Firehouse Subs",
  "sweetgreen": "Sweetgreen",
  "wingstop": "Wingstop",
  "buffalo wild wings": "Buffalo Wild Wings",
  "bww": "Buffalo Wild Wings",
  "raising canes": "Raising Cane's",
  "raising cane": "Raising Cane's",
  "el pollo loco": "El Pollo Loco",
  "checkers": "Checkers",
  "bojangles": "Bojangles",
  "church chicken": "Church's Chicken",
  "churchs": "Church's Chicken",
};

function detectRestaurant(query: string): string | null {
  const q = query.trim().toLowerCase().replace(/['']/g, '').replace(/\s+/g, ' ');

  // 1. Exact alias match
  if (RESTAURANT_ALIASES[q]) return RESTAURANT_ALIASES[q];

  // 2. Prefix match — user typed beginning of alias (e.g. "mc d" matches "mcdonald")
  for (const [alias, brand] of Object.entries(RESTAURANT_ALIASES)) {
    // query is a prefix of the alias
    if (alias.startsWith(q) && q.length >= 3) return brand;
    // alias is a prefix of the query (e.g. "mcdonalds burger" still resolves McDonald's)
    if (q.startsWith(alias) && alias.length >= 3) return brand;
  }

  // 3. Fuzzy: every word in query appears somewhere in the alias
  const words = q.split(' ').filter(w => w.length >= 2);
  if (words.length > 0) {
    for (const [alias, brand] of Object.entries(RESTAURANT_ALIASES)) {
      if (words.every(w => alias.includes(w))) return brand;
    }
  }

  return null;
}

function getNutrient(nutrients: any[], id: number): number {
  const n = nutrients.find((n: any) => n.nutrientId === id);
  return Math.round(n?.value || 0);
}

function parseUSDAFood(food: any): FoodSearchResult | null {
  const nutrients = food.foodNutrients || [];
  const calories = getNutrient(nutrients, 1008);
  if (calories === 0) return null;
  const servingLabel = food.householdServingFullText
    ? food.householdServingFullText
    : food.servingSize ? `${food.servingSize}${food.servingSizeUnit || 'g'}` : '1 serving';
  return {
    id: food.fdcId,
    name: food.description,
    brand: food.brandName || food.brandOwner,
    calories,
    protein: getNutrient(nutrients, 1003),
    carbs: getNutrient(nutrients, 1005),
    fat: getNutrient(nutrients, 1004),
    servingSize: servingLabel,
    category: food.foodCategory,
  };
}

// ─── Open Food Facts fallback (no API key required) ────────────────────────
function parseOFFFood(product: any, index: number): FoodSearchResult | null {
  const n = product.nutriments || {};
  const calories = Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0);
  if (calories === 0) return null;
  return {
    id: index + 1000000,
    name: product.product_name || product.generic_name || 'Unknown',
    brand: product.brands,
    calories,
    protein: Math.round(n['proteins_serving'] || n['proteins_100g'] || 0),
    carbs: Math.round(n['carbohydrates_serving'] || n['carbohydrates_100g'] || 0),
    fat: Math.round(n['fat_serving'] || n['fat_100g'] || 0),
    servingSize: product.serving_size || '1 serving',
    category: product.categories_tags?.[0]?.replace('en:', '') || '',
  };
}

async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=20&sort_by=unique_scans_n`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const foods: FoodSearchResult[] = [];
  for (let i = 0; i < (data.products || []).length; i++) {
    const parsed = parseOFFFood(data.products[i], i);
    if (parsed && parsed.name && parsed.name !== 'Unknown') foods.push(parsed);
  }
  return foods;
}

async function searchUSDA(query: string, requireAllWords = true): Promise<FoodSearchResult[]> {
  const rwParam = requireAllWords ? '&requireAllWords=true' : '';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=20${rwParam}&dataType=Branded,Foundation&api_key=${USDA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();
  const foods: FoodSearchResult[] = [];
  for (const food of data.foods || []) {
    const parsed = parseUSDAFood(food);
    if (parsed) foods.push(parsed);
  }
  return foods;
}

async function fetchRestaurantMenu(restaurantName: string): Promise<FoodSearchResult[]> {
  const brandWords = restaurantName.toLowerCase().split(/\s+/).filter(w => w.length >= 2);

  const matchesBrand = (food: any) => {
    const owner = (food.brandOwner || '').toLowerCase();
    const bname = (food.brandName || '').toLowerCase();
    return brandWords.some(w => owner.includes(w) || bname.includes(w));
  };

  // Try USDA first
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(restaurantName)}&pageSize=50&dataType=Branded&api_key=${USDA_API_KEY}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const foods: FoodSearchResult[] = [];
      for (const food of data.foods || []) {
        if (!matchesBrand(food)) continue;
        const parsed = parseUSDAFood(food);
        if (parsed) foods.push(parsed);
      }
      if (foods.length > 0) return foods;
    }
  } catch (_) { /* fall through */ }

  // Fallback: Open Food Facts
  try {
    const offResults = await searchOpenFoodFacts(restaurantName);
    const filtered = offResults.filter(f => {
      const brand = (f.brand || '').toLowerCase();
      return brandWords.some(w => brand.includes(w));
    });
    if (filtered.length > 0) return filtered;
    // If brand filter removed everything, return all OFF results
    return offResults;
  } catch (_) {
    return [];
  }
}

export async function searchFoods(query: string): Promise<SearchResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [], isRestaurantSearch: false };
  }

  const restaurant = detectRestaurant(query);

  if (restaurant) {
    const results = await fetchRestaurantMenu(restaurant);
    return { results, restaurantName: restaurant, isRestaurantSearch: true };
  }

  // Regular food search — try USDA, fall back to Open Food Facts
  try {
    const foods = await searchUSDA(query, true);
    if (foods.length > 0) return { results: foods, isRestaurantSearch: false };
    // USDA returned nothing — try without requireAllWords
    const foods2 = await searchUSDA(query, false);
    if (foods2.length > 0) return { results: foods2, isRestaurantSearch: false };
  } catch (_) {
    // USDA unavailable (rate limit etc.) — fall through to OFF
  }

  // Open Food Facts fallback
  const offFoods = await searchOpenFoodFacts(query);
  return { results: offFoods, isRestaurantSearch: false };
}
