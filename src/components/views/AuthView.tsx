import React, { useState } from 'react';
import { Lock, User, ArrowRight, AlertTriangle, ShieldCheck, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LogoIcon, LogoText } from '../common/Brand';

export function AuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'operator' | 'resident'>('resident');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'user'
            }
          }
        });

        if (error) throw error;
        setError('Registration successful! You can now sign in.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials' && loginMode === 'operator') {
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  role: 'admin'
                }
              }
            });
            if (signUpError) throw signUpError;
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Network error: Could not connect to the database. Please check your internet connection.');
      } else if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please check your credentials or register a new account.');
      } else if (err.message.includes('rate limit')) {
        setError('Security limit reached: Too many attempts. Please wait a few minutes before trying again.');
      } else if (err.message.includes('invalid') || err.message.includes('Invalid')) {
        setError(err.message + ' Please ensure you are using a correctly formatted email address.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[1px] border-[var(--color-border-subtle)] rounded-full absolute"></div>
        <div className="w-[600px] h-[600px] border-[1px] border-[var(--color-border-subtle)] rounded-full absolute"></div>
        <div className="w-[400px] h-[400px] border-[1px] border-[var(--color-border-subtle)] rounded-full absolute"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-text-primary)] text-[var(--color-bg-page)] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <LogoIcon className="w-10 h-10" />
          </div>
          <LogoText className="text-4xl mb-2" />
          <p className="text-[var(--color-text-ghost)] tracking-[0.2em] text-xs font-bold uppercase">Access Control System</p>
        </div>

        <div className="flex gap-2 mb-6 bg-[var(--color-bg-raised)] p-1.5 rounded-xl border border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => { setLoginMode('resident'); setIsRegistering(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              loginMode === 'resident' 
                ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' 
                : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Home size={14} /> Resident
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('operator'); setIsRegistering(false); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              loginMode === 'operator' 
                ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' 
                : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <ShieldCheck size={14} /> Operator
          </button>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-accent)]"></div>
          
          <h2 className="text-xl font-bold tracking-tight mb-6">
            {loginMode === 'operator' ? 'Operator Login' : (isRegistering ? 'Create Resident Account' : 'Resident Login')}
          </h2>

          {error && (
            <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 ${
              error.includes('successful') 
                ? 'bg-[var(--color-status-success-dim)] border-[var(--color-status-success)] text-[var(--color-status-success)]'
                : 'bg-[var(--color-status-error-dim)] border-[var(--color-status-error)] text-[var(--color-status-error)]'
            }`}>
              {error.includes('successful') ? null : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-ghost)]">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-ghost)]">
                  <User size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  placeholder={loginMode === 'operator' ? 'operator@passmark.sys' : 'resident@example.com'}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-ghost)]">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-text-ghost)]">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {isRegistering && (
                <p className="text-[10px] text-[var(--color-text-ghost)] mt-1.5 ml-1">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-text-primary)] text-[var(--color-bg-page)] py-3.5 rounded-xl font-bold uppercase tracking-[0.08em] text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Authenticating...' : (isRegistering ? 'Register' : 'Authorize Access')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {loginMode === 'resident' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {isRegistering ? "Already have an account? Sign In" : "Need an account? Register Here"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-mono text-[var(--color-text-ghost)] uppercase tracking-widest">
            {loginMode === 'operator' ? 'Restricted System • Authorized Personnel Only' : 'Resident & Guest Portal'}
          </p>
        </div>
      </div>
    </div>
  );
}
