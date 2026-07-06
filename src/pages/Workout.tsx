import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/BottomNavigation';
import { toast } from '@/hooks/use-toast';
import { generateWorkout, RecoveryData, WorkoutPlan } from '@/lib/workoutAI';
import {
  Dumbbell, Zap, Moon, Heart, AlertCircle, CheckCircle2,
  Flame, Clock, ChevronDown, ChevronUp, RefreshCw, Loader2, Sparkles
} from 'lucide-react';

const STORAGE_KEY = 'workout_daily_data';

function getTodayKey() {
  return new Date().toDateString();
}

function loadTodayData(): { recovery: RecoveryData | null; plan: WorkoutPlan | null; completed: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { recovery: null, plan: null, completed: [] };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return { recovery: null, plan: null, completed: [] };
    return { recovery: parsed.recovery || null, plan: parsed.plan || null, completed: parsed.completed || [] };
  } catch {
    return { recovery: null, plan: null, completed: [] };
  }
}

function saveTodayData(recovery: RecoveryData, plan: WorkoutPlan | null, completed: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: getTodayKey(), recovery, plan, completed
  }));
}

const intensityColors = {
  easy: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700' },
  moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  hard: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
};

export const Workout = () => {
  const today = loadTodayData();
  const [step, setStep] = useState<'checkin' | 'plan'>(today.plan ? 'plan' : 'checkin');

  // Recovery inputs
  const [recoveryScore, setRecoveryScore] = useState(today.recovery?.recoveryScore ?? 70);
  const [sleepHours, setSleepHours] = useState(today.recovery?.sleepHours ?? 7);
  const [soreness, setSoreness] = useState(today.recovery?.soreness ?? 1);
  const [hrv, setHrv] = useState<string>(today.recovery?.hrv?.toString() ?? '');
  const [notes, setNotes] = useState(today.recovery?.notes ?? '');

  // Workout state
  const [plan, setPlan] = useState<WorkoutPlan | null>(today.plan);
  const [completedExercises, setCompletedExercises] = useState<string[]>(today.completed);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const goal = localStorage.getItem('fitnessGoal') || 'maintain';
  const frequency = localStorage.getItem('workoutFrequency') || '3-4x per week';

  const recoveryColor = recoveryScore >= 67 ? 'text-green-500' : recoveryScore >= 34 ? 'text-yellow-500' : 'text-red-500';
  const recoveryLabel = recoveryScore >= 67 ? 'Recovered' : recoveryScore >= 34 ? 'Moderate' : 'Low';

  const handleGenerateWorkout = async () => {
    const recovery: RecoveryData = {
      recoveryScore,
      sleepHours,
      soreness,
      hrv: hrv ? parseInt(hrv) : undefined,
      notes: notes || undefined,
    };

    setIsGenerating(true);
    try {
      const generatedPlan = await generateWorkout(recovery, goal, frequency);
      setPlan(generatedPlan);
      setCompletedExercises([]);
      saveTodayData(recovery, generatedPlan, []);
      setStep('plan');
      toast({ title: '💪 Workout Ready!', description: `${generatedPlan.name} — ${generatedPlan.durationMinutes} min` });
    } catch (e: any) {
      toast({ title: 'Error generating workout', description: e.message || 'Try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExercise = (name: string) => {
    const updated = completedExercises.includes(name)
      ? completedExercises.filter(e => e !== name)
      : [...completedExercises, name];
    setCompletedExercises(updated);
    const recovery: RecoveryData = { recoveryScore, sleepHours, soreness, hrv: hrv ? parseInt(hrv) : undefined, notes };
    saveTodayData(recovery, plan, updated);
  };

  const progressPct = plan ? Math.round((completedExercises.length / plan.exercises.length) * 100) : 0;

  // ─── Check-in Screen ────────────────────────────────────────────────────────
  if (step === 'checkin') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card px-6 pt-12 pb-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Today's Workout</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">Tell us how you're feeling and we'll build your plan</p>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Recovery Score */}
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-foreground text-sm">Whoop Recovery Score</span>
                </div>
                <span className={`text-2xl font-bold ${recoveryColor}`}>{recoveryScore}%</span>
              </div>
              <div className="relative mb-2">
                <div className="h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-foreground rounded-full shadow-md cursor-pointer"
                    style={{ left: `calc(${recoveryScore}% - 10px)` }}
                  />
                </div>
                <input
                  type="range" min={0} max={100} value={recoveryScore}
                  onChange={e => setRecoveryScore(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 — Low</span>
                <span className={`font-semibold ${recoveryColor}`}>{recoveryLabel}</span>
                <span>100 — Peak</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                If you don't use Whoop, estimate: how recovered do you feel today?
              </p>
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-foreground text-sm">Sleep Last Night</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{sleepHours}h</span>
              </div>
              <div className="relative mb-1">
                <div className="h-3 rounded-full bg-muted" />
                <input
                  type="range" min={0} max={12} step={0.5} value={sleepHours}
                  onChange={e => setSleepHours(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
                />
                <div
                  className="absolute top-0 left-0 h-3 rounded-full bg-indigo-400 pointer-events-none"
                  style={{ width: `${(sleepHours / 12) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0h</span><span>6h</span><span>12h</span>
              </div>
            </CardContent>
          </Card>

          {/* Soreness */}
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-foreground text-sm">Muscle Soreness</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSoreness(level)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      soreness === level
                        ? level <= 2 ? 'border-green-500 bg-green-50 text-green-700' : level === 3 ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>None</span><span>Very Sore</span>
              </div>
            </CardContent>
          </Card>

          {/* Optional fields */}
          <Card className="border-0 bg-card rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-3">
              <span className="font-semibold text-foreground text-sm">Optional</span>
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">HRV (ms)</div>
                  <input
                    type="number" placeholder="e.g. 65"
                    value={hrv}
                    onChange={e => setHrv(e.target.value)}
                    className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground border-0 outline-none"
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Anything else? (sore spots, energy level, etc.)</div>
                <textarea
                  placeholder="e.g. My lower back is a bit tight today..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground border-0 outline-none resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate button */}
          <Button
            onClick={handleGenerateWorkout}
            disabled={isGenerating}
            className="w-full h-14 rounded-2xl text-base font-bold text-background bg-foreground hover:bg-foreground/90 shadow-lg"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building your workout...</>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" />Generate My Workout</>
            )}
          </Button>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  // ─── Workout Plan Screen ────────────────────────────────────────────────────
  if (!plan) return null;

  const colors = intensityColors[plan.intensity];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className={`px-6 pt-12 pb-5 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{plan.intensityLabel}</span>
          </div>
          <button
            onClick={() => setStep('checkin')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3" /> Re-check in
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{plan.durationMinutes} min</span>
          <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" />~{plan.estimatedCalories} cal</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Progress bar */}
        {completedExercises.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completedExercises.length} of {plan.exercises.length} done</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* AI Tip */}
        {plan.tip && (
          <div className="flex items-start gap-3 bg-card rounded-2xl p-4 border border-border">
            <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{plan.tip}</p>
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-3">
          {plan.exercises.map((exercise, idx) => {
            const done = completedExercises.includes(exercise.name);
            const expanded = expandedExercise === exercise.name;
            return (
              <Card key={exercise.name} className={`border-0 rounded-2xl shadow-sm transition-all ${done ? 'opacity-60' : ''}`}>
                <CardContent className="p-0">
                  <button
                    className="w-full px-4 py-4 flex items-center gap-3 text-left"
                    onClick={() => setExpandedExercise(expanded ? null : exercise.name)}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); toggleExercise(exercise.name); }}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        done ? 'bg-foreground border-foreground' : 'border-muted-foreground'
                      }`}
                    >
                      {done && <CheckCircle2 className="w-4 h-4 text-background" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-foreground text-sm ${done ? 'line-through text-muted-foreground' : ''}`}>
                        {idx + 1}. {exercise.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {exercise.sets} sets × {exercise.reps} · Rest {exercise.rest}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{exercise.muscleGroup}</span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-muted rounded-xl p-3">
                        <p className="text-sm text-foreground">{exercise.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* All done state */}
        {completedExercises.length === plan.exercises.length && plan.exercises.length > 0 && (
          <Card className="border-0 bg-green-50 rounded-2xl shadow-sm">
            <CardContent className="p-5 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="font-bold text-green-700 text-lg">Workout Complete!</div>
              <div className="text-green-600 text-sm mt-1">You burned ~{plan.estimatedCalories} calories</div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};
