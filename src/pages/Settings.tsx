import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Bell, Shield, HelpCircle, LogOut, Scale, Target, Activity } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const Settings = () => {
  const [profile, setProfile] = useState<any>({});

  useEffect(() => {
    setProfile({
      height: localStorage.getItem('userHeight') || 'Not set',
      weight: localStorage.getItem('userWeight') || 'Not set',
      goal: localStorage.getItem('userGoal') || 'Not set',
      gender: localStorage.getItem('userGender') || 'Not set',
      targetCalories: localStorage.getItem('targetCalories') || '—',
      targetProtein: localStorage.getItem('targetProtein') || '—',
      targetCarbs: localStorage.getItem('targetCarbs') || '—',
      targetFats: localStorage.getItem('targetFats') || '—',
    });
  }, []);

  const goalLabels: Record<string, string> = {
    'lose-weight': 'Lose Weight',
    'maintain': 'Maintain Weight',
    'gain-weight': 'Gain Muscle',
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    // Clear all app state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    toast({ title: "Logged out", description: "See you soon!" });
    setTimeout(() => window.location.reload(), 800);
  };

  const handleNotImplemented = (label: string) => {
    toast({ title: label, description: "This feature is coming soon!" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card px-6 py-8 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Profile Summary Card */}
        <Card className="bg-card rounded-2xl shadow-sm border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-foreground rounded-full flex items-center justify-center">
                <span className="text-background text-2xl font-bold">
                  {(localStorage.getItem('userGender') === 'male') ? '👨' : '👩'}
                </span>
              </div>
              <div>
                <div className="font-bold text-foreground text-lg">My Profile</div>
                <div className="text-muted-foreground text-sm capitalize">
                  {goalLabels[profile.goal] || profile.goal}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-xl p-3 text-center">
                <Scale className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold text-foreground text-sm">{profile.weight} kg</div>
                <div className="text-xs text-muted-foreground">Weight</div>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold text-foreground text-sm">{profile.height} cm</div>
                <div className="text-xs text-muted-foreground">Height</div>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-bold text-foreground text-sm">{profile.targetCalories}</div>
                <div className="text-xs text-muted-foreground">Target Cal</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Targets Card */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground px-1 mb-2 uppercase tracking-wide">Daily Targets</h2>
          <Card className="bg-card rounded-2xl shadow-sm border-0">
            <CardContent className="p-0 divide-y divide-border">
              {[
                { label: 'Calories', value: `${profile.targetCalories} kcal` },
                { label: 'Protein', value: `${profile.targetProtein}g` },
                { label: 'Carbs', value: `${profile.targetCarbs}g` },
                { label: 'Fats', value: `${profile.targetFats}g` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-4">
                  <span className="text-foreground font-medium">{item.label}</span>
                  <span className="text-muted-foreground font-semibold">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground px-1 mb-2 uppercase tracking-wide">Account</h2>
          <Card className="bg-card rounded-2xl shadow-sm border-0">
            <CardContent className="p-0">
              {[
                { icon: User, label: "Profile Settings", description: "Update your personal information" },
                { icon: Bell, label: "Notifications", description: "Manage your notification preferences" },
                { icon: Shield, label: "Privacy & Security", description: "Control your privacy settings" },
                { icon: HelpCircle, label: "Help & Support", description: "Get help or contact support" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleNotImplemented(item.label)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Card className="bg-card rounded-2xl shadow-sm border-0">
          <CardContent className="p-0">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors rounded-2xl"
            >
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-red-600 text-sm">Log Out</div>
                <div className="text-xs text-muted-foreground">Sign out of your account</div>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Version */}
        <div className="text-center py-4 pb-8">
          <p className="text-muted-foreground text-xs">Cal AI · v1.0.0 · Built with ❤️</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};