import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Camera, User, Search, Droplets, ChevronLeft, ChevronRight, Zap, Settings, Bell, Target, Plus, Barcode, ChefHat } from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

const MOCK_GOAL = 2200;

// --- Helper for Local Storage Fallback ---
const loadLocalMeals = () => {
  try {
    const saved = localStorage.getItem('nutrivision_meals');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalMeals = (meals) => {
  localStorage.setItem('nutrivision_meals', JSON.stringify(meals));
};

// --- Authentication Screen ---
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ justifyContent: 'center' }}>
      <div className="surface" style={{ textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>NutriVision</h2>
        <h3>{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
        <p style={{ marginBottom: '2rem' }}>{isLogin ? 'Sign in to sync your meals' : 'Start your journey today'}</p>
        
        {error && <p style={{ color: 'var(--protein-color)', marginBottom: '1rem' }}>{error}</p>}
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '1rem' }} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '1rem' }} 
            required 
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '2rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
};

// --- Bottom Navigation ---
const BottomNav = () => {
  const location = useLocation();
  if (location.pathname === '/scan') return null;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link to="/recipes" className={`nav-item ${location.pathname === '/recipes' ? 'active' : ''}`}>
        <ChefHat size={24} />
        <span>Recipes</span>
      </Link>
      <Link to="/scan" className="nav-item">
        <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '12px', borderRadius: '50%', transform: 'translateY(-12px)', boxShadow: 'var(--shadow-md)' }}>
          <Camera size={28} />
        </div>
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

// --- Dashboard ---
const Dashboard = ({ meals }) => {
  const navigate = useNavigate();

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const remaining = Math.max(MOCK_GOAL - totalCalories, 0);
  
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  const percentage = Math.min((totalCalories / MOCK_GOAL) * 100, 100);

  // Group meals
  const groupedMeals = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  meals.forEach(m => {
    if (groupedMeals[m.category]) {
      groupedMeals[m.category].push(m);
    } else {
      groupedMeals.Snacks.push(m);
    }
  });

  return (
    <div className="page-content">
      <header className="date-header">
        <button><ChevronLeft size={24} /></button>
        <h2>Today</h2>
        <button><ChevronRight size={24} /></button>
      </header>

      <section className="ring-container">
        <div className="main-ring" style={{ background: `conic-gradient(var(--accent-primary) ${percentage}%, transparent 0)` }}>
          <div className="ring-inner">
            <div className="remaining-val">{remaining}</div>
            <div className="remaining-lbl">Remaining</div>
          </div>
        </div>
        
        <div className="macro-footer-stats">
          <div className="macro-stat-block">
            <span className="lbl">Protein</span>
            <span className="val">{totalProtein} / 150g</span>
            <div className="bar"><div style={{ width: `${Math.min(totalProtein/150*100, 100)}%`, height: '100%', background: 'var(--protein-color)', borderRadius: '2px' }} /></div>
          </div>
          <div className="macro-stat-block">
            <span className="lbl">Carbs</span>
            <span className="val">{totalCarbs} / 250g</span>
            <div className="bar"><div style={{ width: `${Math.min(totalCarbs/250*100, 100)}%`, height: '100%', background: 'var(--carbs-color)', borderRadius: '2px' }} /></div>
          </div>
          <div className="macro-stat-block">
            <span className="lbl">Fat</span>
            <span className="val">{totalFat} / 65g</span>
            <div className="bar"><div style={{ width: `${Math.min(totalFat/65*100, 100)}%`, height: '100%', background: 'var(--fat-color)', borderRadius: '2px' }} /></div>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <button className="quick-action-btn">
          <Barcode size={24} />
          <span>Barcode</span>
        </button>
        <button className="quick-action-btn primary" onClick={() => navigate('/scan')}>
          <Camera size={24} />
          <span>AI Scan</span>
        </button>
      </section>

      <section>
        {Object.entries(groupedMeals).map(([category, items]) => (
          <div key={category} className="meal-category">
            <div className="meal-category-header">
              <h3>{category}</h3>
              <span>{items.reduce((s, i) => s + i.calories, 0)} kcal</span>
            </div>
            
            {items.map(meal => (
              <div key={meal.id} className="meal-item">
                <div className="meal-item-icon">🍽️</div>
                <div className="meal-item-details">
                  <h4>{meal.name}</h4>
                  <p>{meal.protein}g P • {meal.carbs}g C • {meal.fat}g F</p>
                </div>
                <div className="meal-item-cals">{meal.calories}</div>
              </div>
            ))}

            <button className="add-food-btn" onClick={() => navigate('/scan')}>
              <Plus size={20} /> Add Food
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};

// --- Scanner (AI & Barcode) ---
const Scanner = ({ onAddMeal }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('AI');
  const navigate = useNavigate();

  const handleAIScan = async () => {
    setAnalyzing(true);
    
    try {
      const mockBase64Image = "data:image/jpeg;base64,..."; 
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: mockBase64Image })
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        // Show the actual OpenAI error (like Quota Exceeded)
        setResult({ name: data.error?.message || 'OpenAI API Error', calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    } catch (e) {
      console.error(e);
      setResult({ name: 'Error hitting /api/analyze', calories: 0, protein: 0, carbs: 0, fat: 0 });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodeScan = async () => {
    setAnalyzing(true);
    const mockBarcode = "3017620422003";

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${mockBarcode}.json`);
      const data = await res.json();
      
      if (data.status === 1) {
        const product = data.product;
        const nut = product.nutriments;
        setResult({
          name: product.product_name || 'Unknown Product',
          calories: nut['energy-kcal_100g'] || 0,
          protein: nut['proteins_100g'] || 0,
          carbs: nut['carbohydrates_100g'] || 0,
          fat: nut['fat_100g'] || 0,
        });
      } else {
        throw new Error('Product not found');
      }
    } catch (e) {
      console.error(e);
      setResult({ name: 'Hot Garlic Chips (Mock)', calories: 150, protein: 2, carbs: 15, fat: 9 });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLog = async () => {
    await onAddMeal('Lunch', result);
    navigate('/');
  };

  return (
    <div className="page-fullscreen">
      <div className="camera-viewfinder">
        <header className="camera-header">
          <button onClick={() => navigate('/')}><ChevronLeft size={28} /></button>
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem', borderRadius: '100px' }}>
             <button onClick={() => setMode('AI')} style={{ padding: '0.5rem 1rem', borderRadius: '100px', background: mode === 'AI' ? 'white' : 'transparent', color: mode === 'AI' ? 'black' : 'white', fontWeight: 600 }}>AI</button>
             <button onClick={() => setMode('BARCODE')} style={{ padding: '0.5rem 1rem', borderRadius: '100px', background: mode === 'BARCODE' ? 'white' : 'transparent', color: mode === 'BARCODE' ? 'black' : 'white', fontWeight: 600 }}>Barcode</button>
          </div>
          <button><Zap size={24} /></button>
        </header>
        
        <div className="camera-target">
          <div className={`target-box ${analyzing ? 'scan-anim' : ''}`}>
            <div className="corner-1"></div>
            <div className="corner-2"></div>
            {mode === 'BARCODE' && <div style={{position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px', background: 'red', boxShadow: '0 0 10px red'}} />}
            {analyzing && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)', fontWeight: 600 }}>Analyzing...</div>}
          </div>
        </div>

        <div className="camera-controls">
          <button className="camera-action"><Search size={24} /><span>Search</span></button>
          <button className="shutter-btn" onClick={mode === 'AI' ? handleAIScan : handleBarcodeScan} disabled={analyzing}></button>
          <button className="camera-action"><Droplets size={24} /><span>Gallery</span></button>
        </div>
      </div>

      {result && (
        <div className="bottom-sheet">
          <div className="sheet-header">
            <h3>{result.name}</h3>
            <p className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{result.calories} kcal</p>
          </div>
          
          <div className="macro-chips">
            <div className="macro-chip p"><div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Protein</div><div>{result.protein}g</div></div>
            <div className="macro-chip c"><div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Carbs</div><div>{result.carbs}g</div></div>
            <div className="macro-chip f"><div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Fat</div><div>{result.fat}g</div></div>
          </div>
          
          <button className="btn-primary" onClick={handleLog}>Log for Lunch</button>
          <button className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none', marginTop: '1rem' }} onClick={() => setResult(null)}>Retake</button>
        </div>
      )}
    </div>
  );
};

// --- Recipes View (from Cal-AI reference) ---
const Recipes = ({ meals }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecipe = async () => {
    setLoading(true);
    // Extract ingredients from today's meals
    const ingredients = meals.map(m => m.name.split(' ')[0]); // Simple mock extraction
    
    if (ingredients.length === 0) {
      ingredients.push('Chicken', 'Rice', 'Broccoli'); // fallback
    }

    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients })
      });
      const data = await res.json();
      if (res.ok) {
        setRecipe(data);
      } else {
        setRecipe({ title: 'OpenAI Error (Quota Exceeded)', instructions: ['Please check your OpenAI billing.'], calories: 0, protein: 0 });
      }
    } catch (e) {
      setRecipe({ title: 'API Error', instructions: ['Could not connect to /api/recipe.'], calories: 0, protein: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <header className="date-header">
        <h2>AI Recipes</h2>
      </header>
      
      <p style={{ color: 'var(--text-secondary)' }}>We analyze what you've logged today and generate a healthy recipe based on your ingredients!</p>

      {!recipe && (
        <button className="btn-primary" onClick={generateRecipe} disabled={loading} style={{ marginTop: '2rem' }}>
          {loading ? 'Generating...' : 'Generate Recipe with AI'}
        </button>
      )}

      {recipe && (
        <div className="surface" style={{ marginTop: '2rem' }}>
          <h3 className="gradient-text">{recipe.title}</h3>
          <p style={{ fontWeight: 600, margin: '1rem 0' }}>{recipe.calories} kcal • {recipe.protein}g Protein</p>
          <h4>Instructions:</h4>
          <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            {recipe.instructions.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
            ))}
          </ol>
          <button className="btn-primary" style={{ marginTop: '2rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={() => setRecipe(null)}>
            Generate Another
          </button>
        </div>
      )}
    </div>
  );
};

// --- Profile ---
const Profile = ({ session }) => {
  const handleLogout = () => supabase?.auth.signOut();

  return (
    <div className="page-content">
      <header className="date-header" style={{ marginBottom: '2rem' }}>
        <h2>Profile</h2>
      </header>

      <div className="surface" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <User size={32} />
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{session?.user?.email || 'Guest User'}</h3>
          <p style={{ margin: 0 }}>Active Plan</p>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-list">
          <button onClick={handleLogout} className="setting-item" style={{ width: '100%', color: 'var(--protein-color)', fontWeight: 600, justifyContent: 'center' }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
function App() {
  const [session, setSession] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setMeals(loadLocalMeals());
      setLoading(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMeals(session.user.id);
      else {
        setMeals(loadLocalMeals());
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMeals(session.user.id);
    });
  }, []);

  const fetchMeals = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      if (data) {
        setMeals(data);
        saveLocalMeals(data);
      }
    } catch (error) {
      console.error('Error fetching meals, falling back to local storage:', error);
      // Fallback if table doesn't exist
      setMeals(loadLocalMeals());
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (category, mealData) => {
    const newMeal = {
      id: Date.now(),
      category,
      name: mealData.name,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      user_id: session?.user?.id
    };

    let updatedMeals = [newMeal, ...meals];
    setMeals(updatedMeals);
    saveLocalMeals(updatedMeals); // Always save locally as fallback

    if (supabase && session) {
      try {
        const { data, error } = await supabase.from('meals').insert([{
          category: newMeal.category,
          name: newMeal.name,
          calories: newMeal.calories,
          protein: newMeal.protein,
          carbs: newMeal.carbs,
          fat: newMeal.fat,
          user_id: newMeal.user_id
        }]).select();
        
        if (error) throw error;
      } catch (e) {
        console.error("Failed to save to Supabase. Saved to local storage instead.", e);
      }
    }
  };

  if (loading) return <div className="page-content flex-center">Loading...</div>;

  // Enforce auth if supabase is configured, but allow bypass if they haven't set up the table
  // For the sake of "making it work", if they log in, it works.
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && !session) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard meals={meals} />} />
          <Route path="/recipes" element={<Recipes meals={meals} />} />
          <Route path="/scan" element={<Scanner onAddMeal={handleAddMeal} />} />
          <Route path="/profile" element={<Profile session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
