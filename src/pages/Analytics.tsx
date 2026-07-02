import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, CheckCircle, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { supabase } from '@/lib/supabase';

export const Analytics = () => {
  const [userData, setUserData] = useState<any>(null);
  const [activeTimeFilter, setActiveTimeFilter] = useState('90 Days');
  const [meals, setMeals] = useState<any[]>([]);
  const [activeNutritionTab, setActiveNutritionTab] = useState('This Week');

  useEffect(() => {
    // Load user data from localStorage — using the CORRECT keys from onboarding
    const storedData = {
      goal: localStorage.getItem('fitnessGoal'),
      gender: localStorage.getItem('gender'),
      height: localStorage.getItem('userHeight'),    // fixed key
      weight: localStorage.getItem('userWeight'),    // fixed key
      birthday: localStorage.getItem('birthday'),
      targetCalories: localStorage.getItem('targetCalories'),
      targetProtein: localStorage.getItem('targetProtein'),
      targetCarbs: localStorage.getItem('targetCarbs'),
      targetFats: localStorage.getItem('targetFats'),
    };
    setUserData(storedData);
    fetchMeals();
  }, []);

  const loadLocalMeals = () => {
    try {
      const saved = localStorage.getItem('nutrivision_meals_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
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
      if (data) setMeals(data);
    } catch (e) {
      console.error('Supabase fetch failed, using local storage', e);
      setMeals(loadLocalMeals());
    }
  };

  // Calculate BMI using correct keys
  const calculateBMI = () => {
    if (!userData?.height || !userData?.weight) return { bmi: 0, status: 'Unknown', color: 'gray', progress: 0 };

    const heightInMeters = parseInt(userData.height) / 100;
    const weight = parseInt(userData.weight);
    const bmi = weight / (heightInMeters * heightInMeters);

    let status = 'Unknown';
    let color = 'gray';
    let progress = 50;

    if (bmi < 18.5) {
      status = 'Underweight'; color = 'blue'; progress = 20;
    } else if (bmi >= 18.5 && bmi < 25) {
      status = 'Healthy'; color = 'green'; progress = 60;
    } else if (bmi >= 25 && bmi < 30) {
      status = 'Overweight'; color = 'yellow'; progress = 80;
    } else {
      status = 'Obese'; color = 'red'; progress = 95;
    }

    return { bmi: bmi.toFixed(1), status, color, progress };
  };

  const { bmi, status, color, progress } = calculateBMI();
  const timeFilters = ['90 Days', '6 Months', '1 Year', 'All time'];
  const nutritionTabs = ['This Week', 'Last Week', '2 wks. ago', '3 wks. ago'];

  // Calculate nutrition stats from real meals
  const now = new Date();
  const filterDays: Record<string, number> = {
    '90 Days': 90, '6 Months': 180, '1 Year': 365, 'All time': 99999
  };
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (filterDays[activeTimeFilter] || 90));

  const filteredMeals = meals.filter(m => {
    if (!m.created_at) return true; // local entries without timestamps
    return new Date(m.created_at) >= cutoff;
  });

  const totalCalories = filteredMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = filteredMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCarbs = filteredMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const totalFats = filteredMeals.reduce((sum, m) => sum + (m.fat || 0), 0);

  const days = filterDays[activeTimeFilter] || 90;
  const dailyAvg = filteredMeals.length > 0 ? Math.round(totalCalories / Math.max(1, days)) : 0;

  const currentWeight = userData?.weight ? parseInt(userData.weight) : null;
  const goalWeight = 76;

  const bmiStatusColor: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  if (!userData) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Weight Goal Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Weight Goal</span>
            <Button variant="outline" className="rounded-full px-4 py-1 text-sm h-8">
              Update
            </Button>
          </div>
          <div className="text-3xl font-bold text-foreground">{goalWeight} kg</div>
        </div>

        {/* Current Weight Card */}
        <Card className="bg-card rounded-2xl shadow-sm border-0">
          <CardContent className="p-5">
            <div className="space-y-3">
              <span className="text-base text-muted-foreground">Current Weight</span>
              <div className="text-3xl font-bold text-foreground">
                {currentWeight ? `${currentWeight} kg` : 'Not set'}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Try to update once a week so we can adjust your plan to ensure you hit your goal.
              </p>
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 text-base font-semibold">
                Log weight
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BMI Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Your BMI</h2>
          <Card className="bg-card rounded-2xl shadow-sm border-0">
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Your weight is</span>
                    <div className={`${bmiStatusColor[color]} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                      <CheckCircle className="w-3 h-3" />
                      {status}
                    </div>
                  </div>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="text-3xl font-bold text-foreground">{bmi}</div>

                <div className="space-y-2">
                  {/* BMI bar */}
                  <div className="h-2 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 rounded-full relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-foreground rounded-full shadow"
                      style={{ left: `${Math.min(progress, 95)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-muted-foreground">Underweight (&lt;18.5)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-muted-foreground">Healthy (18.5–25)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-muted-foreground">Overweight (25–30)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-muted-foreground">Obese (&gt;30)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nutrition Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Nutrition</h2>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timeFilters.map((filter) => (
              <Button
                key={filter}
                variant={activeTimeFilter === filter ? "default" : "outline"}
                onClick={() => setActiveTimeFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs whitespace-nowrap h-8 ${
                  activeTimeFilter === filter
                    ? 'bg-foreground text-background'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Nutrition Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card rounded-2xl shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{totalCalories.toLocaleString()}</div>
                <div className="text-muted-foreground text-sm">Total calories</div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{dailyAvg}</div>
                <div className="text-muted-foreground text-sm">Daily avg.</div>
              </CardContent>
            </Card>
          </div>

          {/* Macros Breakdown */}
          <Card className="bg-card rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Macros ({activeTimeFilter})</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beef className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Protein</span>
                </div>
                <span className="font-bold text-foreground text-sm">{totalProtein}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Carbs</span>
                </div>
                <span className="font-bold text-foreground text-sm">{totalCarbs}g</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Fats</span>
                </div>
                <span className="font-bold text-foreground text-sm">{totalFats}g</span>
              </div>

              {filteredMeals.length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-2">
                  No meals logged yet. Start logging to see your stats!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};