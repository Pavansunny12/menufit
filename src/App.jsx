import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Camera, User, Search, Droplets, ChevronLeft, ChevronRight, Zap, Settings, Bell, Target, Plus, Barcode, ScanLine } from 'lucide-react';
import { supabase } from './lib/supabase';
import { BrowserMultiFormatReader } from '@zxing/browser';
import './index.css';

const MOCK_GOAL = 2200;

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
      setError("Supabase is not configured. Please check .env file.");
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
  const [mode, setMode] = useState('AI'); // 'AI' or 'BARCODE'
  const navigate = useNavigate();

  // MOCK: In a real environment, we'd use a camera stream & canvas to capture the image
  // and send base64 to `/api/analyze`. Or use @zxing/browser to read barcodes from video feed.
  // For this prototype, we simulate the requests to show the exact flow from the video.

  const handleAIScan = async () => {
    setAnalyzing(true);
    
    // Check if real keys are supplied, if not fallback to mock
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setAnalyzing(false);
        setResult({ name: 'Cheeseburger (Mock AI)', calories: 550, protein: 30, carbs: 40, fat: 35 });
      }, 2000);
      return;
    }

    try {
      // In a real app we'd capture camera frame -> base64
      const mockBase64Image = "data:image/jpeg;base64,..."; 
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: mockBase64Image })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({ name: 'Error scanning. (Check API Keys)', calories: 0, protein: 0, carbs: 0, fat: 0 });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodeScan = async () => {
    setAnalyzing(true);
    // Simulate ZXing decoding a barcode: e.g. "3017620422003" (Nutella)
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
      // Fallback mock
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
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMeals(session.user.id);
      else setLoading(false);
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
      
      if (error && error.code !== '42P01') throw error; // ignore if table doesn't exist yet
      if (data) setMeals(data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (category, mealData) => {
    const newMeal = {
      category,
      name: mealData.name,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      user_id: session?.user?.id
    };

    if (supabase && session) {
      const { data, error } = await supabase.from('meals').insert([newMeal]).select();
      if (!error && data) {
        setMeals([data[0], ...meals]);
      }
    } else {
      // Mock local fallback
      setMeals([{ id: Date.now(), ...newMeal }, ...meals]);
    }
  };

  if (loading) return <div className="page-content flex-center">Loading...</div>;

  // Enforce auth if supabase is configured
  if (import.meta.env.VITE_SUPABASE_URL && !session) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard meals={meals} />} />
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
