import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Loader2, Apple, Eye, EyeOff } from "lucide-react";

interface AuthPageProps {
  onAuthenticated: () => void;
  onContinueAsGuest: () => void;
}

export const AuthPage = ({ onAuthenticated, onContinueAsGuest }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (!supabase) {
        // No Supabase — save locally and continue
        localStorage.setItem("userEmail", email);
        localStorage.setItem("isLoggedIn", "true");
        onAuthenticated();
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userId", data.user.id);
          toast({ title: "Account created! 🎉", description: "Welcome to Cal AI!" });
          onAuthenticated();
        } else {
          toast({ title: "Check your email", description: "We sent you a confirmation link." });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userId", data.user.id);
        toast({ title: "Welcome back! 👋" });
        onAuthenticated();
      }
    } catch (err: any) {
      toast({
        title: mode === "signup" ? "Sign up failed" : "Login failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top decorative section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Apple className="w-9 h-9 text-background" />
        </div>

        <h1 className="text-3xl font-bold text-foreground text-center mb-2">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          {mode === "signup"
            ? "Track calories, scan food, hit your goals."
            : "Sign in to continue your journey."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-input bg-muted text-base px-4"
              disabled={isLoading}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-input bg-muted text-base px-4 pr-11"
                disabled={isLoading}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait...</>
            ) : mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Toggle mode */}
        <div className="mt-5 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-foreground font-semibold underline-offset-2 hover:underline"
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Guest option */}
        <button
          onClick={onContinueAsGuest}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors font-medium"
        >
          Continue without account →
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
