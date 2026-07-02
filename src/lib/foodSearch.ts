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

const USDA_API_KEY = 'DEMO_KEY'; // free, 30 req/hr per IP. Get free key at api.nal.usda.gov

function getNutrient(nutrients: any[], id: number): number {
  const n = nutrients.find((n: any) => n.nutrientId === id);
  return Math.round(n?.value || 0);
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=25&dataType=Branded,Survey%20(FNDDS),SR%20Legacy&api_key=${USDA_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search foods');

  const data = await res.json();
  const foods: FoodSearchResult[] = [];

  for (const food of data.foods || []) {
    const nutrients = food.foodNutrients || [];
    const calories = getNutrient(nutrients, 1008); // Energy (kcal)
    if (calories === 0) continue; // skip entries with no calorie data

    const servingLabel = food.householdServingFullText
      ? food.householdServingFullText
      : food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit || 'g'}`
      : '1 serving';

    foods.push({
      id: food.fdcId,
      name: food.description,
      brand: food.brandName || food.brandOwner,
      calories,
      protein: getNutrient(nutrients, 1003),   // Protein
      carbs: getNutrient(nutrients, 1005),     // Carbohydrate
      fat: getNutrient(nutrients, 1004),       // Total fat
      servingSize: servingLabel,
      category: food.foodCategory,
    });
  }

  return foods;
}
