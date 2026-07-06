export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g. "10-12" or "30 sec"
  rest: string; // e.g. "60 sec"
  description: string;
  muscleGroup: string;
}

export interface WorkoutPlan {
  name: string;
  intensity: 'easy' | 'moderate' | 'hard';
  intensityLabel: string;
  durationMinutes: number;
  estimatedCalories: number;
  exercises: Exercise[];
  tip: string;
}

export interface RecoveryData {
  recoveryScore: number;   // 0–100 (Whoop-style)
  sleepHours: number;      // 0–12
  soreness: number;        // 1–5 (1=none, 5=very sore)
  hrv?: number;            // optional
  notes?: string;          // optional free text
}

function getIntensity(recovery: number, soreness: number): 'easy' | 'moderate' | 'hard' {
  if (recovery >= 67 && soreness <= 2) return 'hard';
  if (recovery >= 34 || soreness <= 3) return 'moderate';
  return 'easy';
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export async function generateWorkout(
  recovery: RecoveryData,
  goal: string,
  workoutFrequency: string
): Promise<WorkoutPlan> {
  const intensity = getIntensity(recovery.recoveryScore, recovery.soreness);

  const goalLabel = goal === 'lose-weight' ? 'lose weight / burn fat'
    : goal === 'gain-weight' ? 'build muscle / gain strength'
    : 'maintain fitness / general health';

  const prompt = `You are an expert personal trainer and recovery coach. Generate a personalized workout plan.

User Data:
- Whoop Recovery Score: ${recovery.recoveryScore}% (${intensity === 'hard' ? 'green/high' : intensity === 'moderate' ? 'yellow/medium' : 'red/low'})
- Sleep Last Night: ${recovery.sleepHours} hours
- Muscle Soreness: ${recovery.soreness}/5 (1=none, 5=very sore)
${recovery.hrv ? `- HRV: ${recovery.hrv}ms` : ''}
${recovery.notes ? `- User Notes: "${recovery.notes}"` : ''}
- Fitness Goal: ${goalLabel}
- Workout Frequency: ${workoutFrequency || '3-4x per week'}
- Today's Workout Intensity: ${intensity.toUpperCase()}

Based on the recovery score, design an appropriate ${intensity} intensity workout.
- RED (0-33%): Active recovery, light stretching, mobility, or full rest
- YELLOW (34-66%): Moderate training, avoid max effort
- GREEN (67-100%): Full training session, push intensity

Respond ONLY with valid JSON in this exact format:
{
  "name": "workout name",
  "intensity": "${intensity}",
  "intensityLabel": "Green Day - Full Send" or "Yellow Day - Moderate" or "Red Day - Recovery",
  "durationMinutes": 45,
  "estimatedCalories": 350,
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": "10-12",
      "rest": "60 sec",
      "description": "Brief form cue",
      "muscleGroup": "Chest"
    }
  ],
  "tip": "One personalized coaching tip based on their recovery data"
}

Include 5-8 exercises. Make it realistic and specific to their recovery score.`;

  if (!OPENAI_API_KEY) {
    // Return a fallback workout if no API key
    return getFallbackWorkout(intensity, goal);
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  try {
    return JSON.parse(text) as WorkoutPlan;
  } catch {
    throw new Error('Failed to parse workout plan from AI response');
  }
}

function getFallbackWorkout(intensity: 'easy' | 'moderate' | 'hard', goal: string): WorkoutPlan {
  if (intensity === 'easy') {
    return {
      name: 'Active Recovery Session',
      intensity: 'easy',
      intensityLabel: 'Red Day — Rest & Recover',
      durationMinutes: 30,
      estimatedCalories: 120,
      exercises: [
        { name: 'Foam Rolling', sets: 1, reps: '5 min', rest: 'None', description: 'Roll each major muscle group slowly', muscleGroup: 'Full Body' },
        { name: 'Cat-Cow Stretch', sets: 2, reps: '10 reps', rest: '30 sec', description: 'On all fours, arch and round your back slowly', muscleGroup: 'Spine' },
        { name: 'Hip Flexor Stretch', sets: 2, reps: '30 sec each', rest: '20 sec', description: 'Kneeling lunge position, push hips forward', muscleGroup: 'Hip Flexors' },
        { name: 'Walking', sets: 1, reps: '20 min', rest: 'None', description: 'Easy-paced walk outdoors or on treadmill', muscleGroup: 'Cardio' },
      ],
      tip: 'Your body is in recovery mode today. Focus on blood flow, not burning calories. Tomorrow you\'ll perform better for it.',
    };
  }

  if (intensity === 'moderate') {
    return {
      name: 'Moderate Full Body',
      intensity: 'moderate',
      intensityLabel: 'Yellow Day — Steady Effort',
      durationMinutes: 45,
      estimatedCalories: 300,
      exercises: [
        { name: 'Goblet Squat', sets: 3, reps: '12-15', rest: '60 sec', description: 'Hold dumbbell at chest, squat to parallel', muscleGroup: 'Legs' },
        { name: 'Dumbbell Row', sets: 3, reps: '12 each', rest: '60 sec', description: 'One-arm row, elbow drives back to hip', muscleGroup: 'Back' },
        { name: 'Push-Up', sets: 3, reps: '10-15', rest: '60 sec', description: 'Hands shoulder-width, chest to floor', muscleGroup: 'Chest' },
        { name: 'Plank', sets: 3, reps: '30-45 sec', rest: '45 sec', description: 'Straight line from head to heels', muscleGroup: 'Core' },
        { name: 'Stationary Bike', sets: 1, reps: '15 min', rest: 'None', description: 'Moderate pace, conversational effort', muscleGroup: 'Cardio' },
      ],
      tip: 'Keep intensity at 70-75% today. Your recovery is moderate — don\'t skip the workout, but don\'t max out either.',
    };
  }

  return {
    name: goal === 'gain-weight' ? 'Hypertrophy Push Day' : 'High-Intensity Full Body',
    intensity: 'hard',
    intensityLabel: 'Green Day — Full Send 💪',
    durationMinutes: 60,
    estimatedCalories: 500,
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: '6-8', rest: '90 sec', description: 'Bar on traps, squat below parallel, drive through heels', muscleGroup: 'Legs' },
      { name: 'Bench Press', sets: 4, reps: '6-8', rest: '90 sec', description: 'Grip just outside shoulders, bar to lower chest', muscleGroup: 'Chest' },
      { name: 'Pull-Up / Lat Pulldown', sets: 4, reps: '8-10', rest: '75 sec', description: 'Full range of motion, slow on the way down', muscleGroup: 'Back' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '75 sec', description: 'Bar at collarbone, press straight overhead', muscleGroup: 'Shoulders' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '75 sec', description: 'Hinge at hips, bar close to legs', muscleGroup: 'Hamstrings' },
      { name: 'Battle Ropes / Sprints', sets: 5, reps: '30 sec on / 30 sec off', rest: '30 sec', description: 'Max effort, alternate arms', muscleGroup: 'Cardio' },
    ],
    tip: 'You\'re fully recovered — today is a great day to set a new PR. Push hard and track your numbers!',
  };
}
