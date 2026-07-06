import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { Camera, Flame, Beef, Wheat, Droplet, Plus, ChevronLeft, ChevronRight, Scan, PencilLine, Search, X, Loader2 } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { BottomNavigation } from './BottomNavigation';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { analyzeImageNutrition } from '@/lib/openai';
import { searchFoods, FoodSearchResult } from '@/lib/foodSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const Dashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  // Data state
  const [meals, setMeals] = useState<any[]>([]);
  
  // Manual / food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | undefined>(undefined);
  // Custom manual override fields
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  const searchTimerRef = useRef<any>(null);
  
  useEffect(() => {
    // Load user data from localStorage — use correct keys from onboarding
    const storedData = {
      goal: localStorage.getItem('fitnessGoal'),
      gender: localStorage.getItem('userGender') || localStorage.getItem('gender'),
      height: localStorage.getItem('userHeight') || localStorage.getItem('height'),
      weight: localStorage.getItem('userWeight') || localStorage.getItem('weight'),
      frequency: localStorage.getItem('workoutFrequency'),
      birthday: localStorage.getItem('birthday'),
      calories: localStorage.getItem('targetCalories'),
      protein: localStorage.getItem('targetProtein'),
      carbs: localStorage.getItem('targetCarbs'),
      fats: localStorage.getItem('targetFats')
    };
    setUserData(storedData);
    fetchMeals();
  }, [selectedDate]);

  const loadLocalMeals = () => {
    try {
      const saved = localStorage.getItem('nutrivision_meals_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalMeals = (updatedMeals: any[]) => {
    localStorage.setItem('nutrivision_meals_v2', JSON.stringify(updatedMeals));
  };

  const fetchMeals = async () => {
    if (!supabase) {
      setMeals(loadLocalMeals());
      return;
    }
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setMeals(data);
        saveLocalMeals(data);
      }
    } catch (e) {
      console.error('Supabase fetch failed, using local storage', e);
      setMeals(loadLocalMeals());
    }
  };

  const getWeekDates = (centerDate: Date) => {
    const dates = [];
    const startOfWeek = new Date(centerDate);
    startOfWeek.setDate(centerDate.getDate() - 3);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Filter meals to only show those logged on selectedDate
  const selectedDateStr = selectedDate.toDateString();
  const todayMeals = meals.filter(meal => {
    if (!meal.created_at && !meal.time) return true; // local entries without date
    const mealDate = meal.created_at ? new Date(meal.created_at) : new Date();
    return mealDate.toDateString() === selectedDateStr;
  });

  const currentCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const targetCalories = userData?.calories ? parseInt(userData.calories) : 2200;
  const caloriesLeft = targetCalories - currentCalories;
  
  const proteinConsumed = todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const targetProtein = userData?.protein ? parseInt(userData.protein) : 150;
  
  const carbsConsumed = todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const targetCarbs = userData?.carbs ? parseInt(userData.carbs) : 275;
  
  const fatsConsumed = todayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
  const targetFats = userData?.fats ? parseInt(userData.fats) : 73;

  // Real streak: count consecutive days with at least 1 meal
  const streakCount = (() => {
    let streak = 0;
    const check = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = check.toDateString();
      const hasMeal = meals.some(m => {
        const d = m.created_at ? new Date(m.created_at) : null;
        return d && d.toDateString() === ds;
      });
      if (!hasMeal && i > 0) break;
      if (hasMeal) streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  })();

  const saveMeal = async (newMeal: any) => {
    const updatedMeals = [newMeal, ...meals];
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals);
    toast({ title: `✅ Added ${newMeal.name}`, description: `${newMeal.calories} cal · ${newMeal.protein}g protein` });
    if (supabase) {
      try {
        await supabase.from('meals').insert([{
          name: newMeal.name, calories: newMeal.calories,
          protein: newMeal.protein, carbs: newMeal.carbs,
          fat: newMeal.fat, category: newMeal.category
        }]);
      } catch (e) { console.error('Supabase insert failed, saved locally'); }
    }
  };

  const handlePhotoCapture = async (imageBlob: Blob) => {
    setIsCameraOpen(false);
    toast({ title: '🔍 Analyzing Image', description: 'Asking AI to identify the food...' });
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = async () => {
        try {
          const data = await analyzeImageNutrition(reader.result as string);
          await saveMeal({
            id: Date.now(), name: data.name || 'Scanned Food',
            calories: data.calories || 0, protein: data.protein || 0,
            carbs: data.carbs || 0, fat: data.fat || 0,
            category: 'Meals', type: 'scanned',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        } catch (e: any) {
          toast({ title: 'AI Error', description: e.message || 'Failed to analyze image.', variant: 'destructive' });
        }
      };
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to read image file.', variant: 'destructive' });
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setSelectedFood(null);
    setRestaurantName(undefined);
    setManualCalories(''); setManualProtein(''); setManualCarbs(''); setManualFats('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchFoods(q);
        setSearchResults(response.results);
        setRestaurantName(response.restaurantName);
      } catch (e) {
        toast({ title: 'No results', description: `Nothing found for "${q}". Try a different spelling.`, variant: 'destructive' });
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectFood = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
    setRestaurantName(undefined);
    setManualCalories(food.calories.toString());
    setManualProtein(food.protein.toString());
    setManualCarbs(food.carbs.toString());
    setManualFats(food.fat.toString());
  };

  const handleManualLog = async () => {
    const name = selectedFood?.name || searchQuery.trim();
    if (!name || !manualCalories) {
      toast({ title: 'Required fields missing', description: 'Please select a food and confirm its calories.', variant: 'destructive' });
      return;
    }
    const newMeal = {
      id: Date.now(), name,
      calories: parseInt(manualCalories) || 0,
      protein: parseInt(manualProtein) || 0,
      carbs: parseInt(manualCarbs) || 0,
      fat: parseInt(manualFats) || 0,
      category: 'Meals', type: 'manual',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // reset
    setSearchQuery(''); setSelectedFood(null); setSearchResults([]);
    setRestaurantName(undefined);
    setManualCalories(''); setManualProtein(''); setManualCarbs(''); setManualFats('');
    setIsManualEntryOpen(false);
    await saveMeal(newMeal);
  };

  if (!userData) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const caloriesData = [
    { name: 'consumed', value: currentCalories },
    { name: 'remaining', value: Math.max(0, targetCalories - currentCalories) }
  ];

  return (
    <div className="min-h-screen bg-background p-3 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background text-xs">🍎</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Cal AI</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-xs">🔥</span>
          </div>
          <div className="text-lg font-bold text-foreground">{streakCount}</div>
        </div>
      </div>

      {/* Interactive Week Calendar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <Button variant="ghost" size="sm" onClick={() => handleDateNavigation('prev')} className="p-1 h-8 w-8 rounded-full">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex gap-2">
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button key={index} onClick={() => handleDateSelect(date)} className="text-center focus:outline-none">
                <div className="text-xs text-muted-foreground mb-1 font-medium">{days[date.getDay()]}</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isSelected ? 'bg-foreground text-background' : isToday ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
        
        <Button variant="ghost" size="sm" onClick={() => handleDateNavigation('next')} className="p-1 h-8 w-8 rounded-full">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <Card className="border-0 bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{currentCalories}</div>
              <div className="text-sm text-muted-foreground mb-4">
                {caloriesLeft > 0 ? `${caloriesLeft} calories left` : `${Math.abs(caloriesLeft)} calories over`}
              </div>
              <div className="relative w-16 h-16 mx-auto">
                <ChartContainer config={{ consumed: { color: "hsl(var(--foreground))" }, remaining: { color: "hsl(var(--muted))" } }} className="w-full h-full">
                  <PieChart width={64} height={64}>
                    <Pie data={caloriesData} cx="50%" cy="50%" innerRadius={20} outerRadius={28} dataKey="value" strokeWidth={0}>
                      <Cell fill="hsl(var(--foreground))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center"><Flame className="w-4 h-4 text-foreground" /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrients Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">{proteinConsumed}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="relative w-8 h-8">
                  <Progress value={Math.min((proteinConsumed / targetProtein) * 100, 100)} className="w-8 h-8 rounded-full [&>div]:bg-red-500" />
                  <div className="absolute inset-0 flex items-center justify-center"><Beef className="w-3 h-3 text-red-500" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">{carbsConsumed}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="relative w-8 h-8">
                  <Progress value={Math.min((carbsConsumed / targetCarbs) * 100, 100)} className="w-8 h-8 rounded-full [&>div]:bg-orange-500" />
                  <div className="absolute inset-0 flex items-center justify-center"><Wheat className="w-3 h-3 text-orange-500" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-foreground">{fatsConsumed}g</div>
                  <div className="text-xs text-muted-foreground">Fats</div>
                </div>
                <div className="relative w-8 h-8">
                  <Progress value={Math.min((fatsConsumed / targetFats) * 100, 100)} className="w-8 h-8 rounded-full [&>div]:bg-blue-500" />
                  <div className="absolute inset-0 flex items-center justify-center"><Droplet className="w-3 h-3 text-blue-500" /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recently Logged */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4 px-1">Recently logged</h2>
        {todayMeals.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No meals logged yet. Tap + to add food!</p>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal, index) => (
              <Card key={meal.id || index} className="border-0 bg-card rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">{meal.name}</span>
                        {meal.type === 'scanned' && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <Scan className="w-3 h-3" />
                            <span className="text-xs font-medium">Scanned</span>
                          </div>
                        )}
                        {meal.type === 'manual' && (
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            <PencilLine className="w-3 h-3" />
                            <span className="text-xs font-medium">Manual</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{meal.time || 'Logged recently'}</div>
                    </div>
                    <div className="text-sm font-bold text-foreground">{meal.calories} cal</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button with Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background shadow-lg z-10 outline-none ring-0"
            size="icon"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-0 shadow-xl bg-card">
          <DropdownMenuItem className="cursor-pointer py-3" onClick={() => setIsCameraOpen(true)}>
            <Camera className="w-4 h-4 mr-2 text-foreground" />
            <span className="font-medium text-foreground">Scan with AI</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer py-3" onClick={() => setIsManualEntryOpen(true)}>
            <PencilLine className="w-4 h-4 mr-2 text-foreground" />
            <span className="font-medium text-foreground">Log Manually</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Food Search Dialog */}
      <Dialog open={isManualEntryOpen} onOpenChange={(open) => {
        setIsManualEntryOpen(open);
        if (!open) {
          setSearchQuery(''); setSelectedFood(null);
          setSearchResults([]); setRestaurantName(undefined);
          setManualCalories(''); setManualProtein(''); setManualCarbs(''); setManualFats('');
        }
      }}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="text-xl">Search Food</DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-5 pt-4 pb-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-9 h-12 rounded-xl bg-muted border-0 text-base"
                placeholder="Search foods, brands..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => handleSearchChange('')}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto px-3 pb-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && !selectedFood && (
              <p className="text-center text-muted-foreground text-sm py-8">No results found. Try a different name.</p>
            )}

            {/* Restaurant header */}
            {!selectedFood && restaurantName && searchResults.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold shrink-0">
                  {restaurantName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">{restaurantName}</div>
                  <div className="text-xs text-muted-foreground">{searchResults.length} menu items</div>
                </div>
              </div>
            )}

            {!selectedFood && searchResults.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelectFood(food)}
                className="w-full text-left px-3 py-3.5 rounded-xl hover:bg-muted transition-colors flex items-center justify-between gap-3 mb-1"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm truncate">{food.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {!restaurantName && food.brand ? `${food.brand} · ` : ''}{food.servingSize || '1 serving'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-foreground text-sm">{food.calories} cal</div>
                  <div className="text-xs text-muted-foreground">
                    P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                  </div>
                </div>
              </button>
            ))}

            {!searchQuery && (
              <p className="text-center text-muted-foreground text-sm py-8 px-4">
                Type at least 2 characters to search from 700,000+ foods
              </p>
            )}
          </div>

          {/* Selected Food - Confirm & Edit Panel */}
          {selectedFood && (
            <div className="border-t border-border px-5 pt-4 pb-5 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedFood.name}</div>
                  {selectedFood.brand && (
                    <div className="text-xs text-muted-foreground">{selectedFood.brand} · {selectedFood.servingSize}</div>
                  )}
                </div>
                <button onClick={() => { setSelectedFood(null); setSearchQuery(''); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[{label:'Cal', value: manualCalories, set: setManualCalories},
                  {label:'Protein', value: manualProtein, set: setManualProtein},
                  {label:'Carbs', value: manualCarbs, set: setManualCarbs},
                  {label:'Fats', value: manualFats, set: setManualFats}].map(f => (
                  <div key={f.label} className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                    <Input
                      type="number"
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      className="text-center h-9 rounded-lg text-sm border-input bg-background font-semibold p-1"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleManualLog} className="w-full rounded-xl h-11 font-bold">
                + Log this food
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />

      <BottomNavigation />
    </div>
  );
};