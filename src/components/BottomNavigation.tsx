import { Home, BarChart3, Settings, Dumbbell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/workout', icon: Dumbbell, label: 'Workout' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 safe-area-pb z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
              isActive(item.path)
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon
              className={`w-5 h-5 mb-1 ${
                isActive(item.path) ? 'text-foreground' : 'text-muted-foreground'
              }`}
            />
            <span className={`text-xs font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};