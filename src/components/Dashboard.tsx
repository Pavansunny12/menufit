import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { Camera, Flame, Beef, Wheat, Droplet, Plus, ChevronLeft, ChevronRight, Scan, PencilLine } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { BottomNavigation } from './BottomNavigation';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Dashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  // Data state
  const [meals, setMeals] = useState<any[]>([]);
  
  // Manual entry form state
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFats, setManualFats] = useState("");
  
  useEffect(() => {
    // Load user data from localStorage
    const storedData = {
      goal: localStorage.getItem('fitnessGoal'),
      gender: localStorage.getItem('gender'),
      height: localStorage.getItem('height'),
      weight: localStorage.getItem('weight'),
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
  
  const currentCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const targetCalories = userData?.calories ? parseInt(userData.calories) : 2200;
  const caloriesLeft = targetCalories - currentCalories;
  
  const proteinConsumed = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const targetProtein = userData?.protein ? parseInt(userData.protein) : 150;
  
  const carbsConsumed = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const targetCarbs = userData?.carbs ? parseInt(userData.carbs) : 275;
  
  const fatsConsumed = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
  const targetFats = userData?.fats ? parseInt(userData.fats) : 73;

  const streakCount = 1;

  const handlePhotoCapture = async (imageBlob: Blob) => {
    setIsCameraOpen(false);
    toast({
      title: "Analyzing Image",
      description: "Asking OpenAI what food this is..."
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64data })
        });
        const data = await res.json();
        
        if (!res.ok) {
          toast({ title: "OpenAI Error", description: data.error?.message || data.error, variant: "destructive" });
          return;
        }

        const newMeal = {
          id: Date.now(),
          name: data.name || "Scanned Food",
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          category: 'Snacks',
          type: 'scanned',
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };

        const updatedMeals = [newMeal, ...meals];
        setMeals(updatedMeals);
        saveLocalMeals(updatedMeals);
        toast({ title: `Added ${newMeal.name}`, description: `Logged ${newMeal.calories} calories!` });

        if (supabase) {
          try {
            await supabase.from('meals').insert([{
              name: newMeal.name,
              calories: newMeal.calories,
              protein: newMeal.protein,
              carbs: newMeal.carbs,
              fat: newMeal.fat,
              category: newMeal.category
            }]);
          } catch(e) { console.error("Supabase insert failed, but saved locally"); }
        }
      };
    } catch (e) {
      toast({ title: "Error", description: "Failed to process image.", variant: "destructive" });
    }
  };

  const handleManualLog = async () => {
    if (!manualFoodName || !manualCalories) {
      toast({ title: "Validation Error", description: "Name and Calories are required.", variant: "destructive" });
      return;
    }

    const newMeal = {
      id: Date.now(),
      name: manualFoodName,
      calories: parseInt(manualCalories) || 0,
      protein: parseInt(manualProtein) || 0,
      carbs: parseInt(manualCarbs) || 0,
      fat: parseInt(manualFats) || 0,
      category: 'Snacks',
      type: 'manual',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    const updatedMeals = [newMeal, ...meals];
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals);
    
    // Reset form
    setManualFoodName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFats("");
    setIsManualEntryOpen(false);

    toast({ title: `Added ${newMeal.name}`, description: `Logged manually!` });

    if (supabase) {
      try {
        await supabase.from('meals').insert([{
          name: newMeal.name,
          calories: newMeal.calories,
          protein: newMeal.protein,
          carbs: newMeal.carbs,
          fat: newMeal.fat,
          category: newMeal.category
        }]);
      } catch(e) { console.error("Supabase insert failed, but saved locally"); }
    }
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
        {meals.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No meals logged today. Tap + to add food!</p>
        ) : (
          <div className="space-y-3">
            {meals.map((meal, index) => (
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

      {/* Manual Entry Dialog */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl">Log Food Manually</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Food Name</Label>
              <Input id="name" placeholder="e.g. Apple" value={manualFoodName} onChange={(e) => setManualFoodName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input id="calories" type="number" placeholder="0" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input id="protein" type="number" placeholder="0" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input id="carbs" type="number" placeholder="0" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fats">Fats (g)</Label>
                <Input id="fats" type="number" placeholder="0" value={manualFats} onChange={(e) => setManualFats(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleManualLog} className="w-full rounded-xl py-6 font-bold">
              Save Food
            </Button>
          </DialogFooter>
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