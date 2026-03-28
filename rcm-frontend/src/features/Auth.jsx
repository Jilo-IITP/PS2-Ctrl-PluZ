import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/themetoggle';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Proceed to dashboard on success
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background font-bold shadow-lg shadow-foreground/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          {isSignUp ? 'Create Officer Account' : 'TPA Officer Login'}
        </h2>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-700 delay-100">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Register' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Enter your institutional email to register.' : 'Enter your credentials.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4 text-xs"><AlertDescription>{error}</AlertDescription></Alert>}
            {message && <Alert className="mb-4 text-xs bg-muted text-foreground border-border"><AlertDescription>{message}</AlertDescription></Alert>}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="officer@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSignUp ? 'Register Account' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6 bg-muted/10">
            <div className="text-sm text-center text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an officer account?"}
              <Button variant="link" onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="px-2 font-bold text-primary">
                {isSignUp ? 'Sign in' : 'Create one'}
              </Button>
            </div>

            {/* Demo Hack: Let the user bypass if backend isn't linked */}
            {!isSignUp && (
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="w-full text-xs" title="Bypass for Hackathon demo if Supabase keys are not set up">
                Bypass Login (Dev Demo)
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
