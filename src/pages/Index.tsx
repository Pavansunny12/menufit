import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AuthPage } from "@/components/AuthPage";
import { ValuePropositionPage } from "@/components/ValuePropositionPage";
import { HeightWeightPage } from "@/components/HeightWeightPage";
import { WorkoutFrequencyPage } from "@/components/WorkoutFrequencyPage";
import { GoalSelectionPage } from "@/components/GoalSelectionPage";
import { GenderSelectionPage } from "@/components/GenderSelectionPage";
import { BirthdatePage } from "@/components/BirthdatePage";
import { CustomPlanPage } from "@/components/CustomPlanPage";
import { Dashboard } from "@/components/Dashboard";
import { supabase } from "@/lib/supabase";

type Step =
  | 'welcome'
  | 'auth'
  | 'value-proposition'
  | 'height-weight'
  | 'workout-frequency'
  | 'goal-selection'
  | 'gender-selection'
  | 'birthdate'
  | 'custom-plan'
  | 'dashboard';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');

  useEffect(() => {
    // If user is already fully logged in + onboarded, go straight to dashboard
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      setCurrentStep('dashboard');
      return;
    }

    // If there's an active Supabase session, skip to auth confirmation
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userId', data.session.user.id);
          localStorage.setItem('userEmail', data.session.user.email || '');
          setCurrentStep('dashboard');
        }
      });
    }
  }, []);

  const go = (step: Step) => setCurrentStep(step);

  // ── Steps ──────────────────────────────────────────────────────────────────

  if (currentStep === 'welcome') {
    return <WelcomeScreen onGetStarted={() => go('auth')} />;
  }

  if (currentStep === 'auth') {
    return (
      <AuthPage
        onAuthenticated={() => {
          // Check if user has already onboarded before (has height saved)
          const hasOnboarded = !!localStorage.getItem('userHeight');
          if (hasOnboarded) {
            localStorage.setItem('isLoggedIn', 'true');
            go('dashboard');
          } else {
            go('value-proposition');
          }
        }}
        onContinueAsGuest={() => go('value-proposition')}
      />
    );
  }

  if (currentStep === 'value-proposition') {
    return (
      <ValuePropositionPage
        onContinue={() => go('height-weight')}
        onBack={() => go('auth')}
      />
    );
  }

  if (currentStep === 'height-weight') {
    return (
      <HeightWeightPage
        onContinue={() => go('workout-frequency')}
        onBack={() => go('value-proposition')}
      />
    );
  }

  if (currentStep === 'workout-frequency') {
    return (
      <WorkoutFrequencyPage
        onContinue={() => go('goal-selection')}
        onBack={() => go('height-weight')}
      />
    );
  }

  if (currentStep === 'goal-selection') {
    return (
      <GoalSelectionPage
        onContinue={() => go('gender-selection')}
        onBack={() => go('workout-frequency')}
      />
    );
  }

  if (currentStep === 'gender-selection') {
    return (
      <GenderSelectionPage
        onContinue={() => go('birthdate')}
        onBack={() => go('goal-selection')}
      />
    );
  }

  if (currentStep === 'birthdate') {
    return (
      <BirthdatePage
        onContinue={() => go('custom-plan')}
        onBack={() => go('gender-selection')}
      />
    );
  }

  if (currentStep === 'custom-plan') {
    return (
      <CustomPlanPage
        onContinue={() => go('dashboard')}
        onBack={() => go('birthdate')}
      />
    );
  }

  // dashboard
  return <Dashboard />;
};

export default Index;
