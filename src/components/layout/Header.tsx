import React from 'react';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Plus, 
  LogOut, 
  Home, 
  ShieldCheck, 
  User 
} from 'lucide-react';
import { UserProfile, ViewMode, ThemeMode } from '../../types';
import { LogoIcon, LogoText } from '../common/Brand';
import { isSupabaseConfigured } from '../../lib/supabase';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  userProfile: UserProfile | null;
  theme: ThemeMode;
  toggleTheme: () => void;
  onOpenNewPermit: () => void;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onSwitchToResident: () => void;
  onSwitchToAdmin: () => void;
}

export function Header({
  viewMode,
  userProfile,
  theme,
  toggleTheme,
  onOpenNewPermit,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onSwitchToResident,
  onSwitchToAdmin
}: HeaderProps) {
  return (
    <header className="h-16 lg:h-20 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 lg:px-10 bg-[var(--color-bg-page)]/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        {viewMode === 'admin' ? (
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="lg:hidden p-2 rounded-xl bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-subtle)]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-text-primary)] text-[var(--color-bg-page)] rounded-xl flex items-center justify-center shadow-md">
              <LogoIcon className="w-6 h-6" />
            </div>
            <div>
              <LogoText className="text-xl" />
              <p className="text-[9px] uppercase tracking-widest font-mono text-[var(--color-text-ghost)]">Access Control</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {(userProfile?.role === 'admin' || (!userProfile && viewMode === 'admin')) && (
          <div className="flex bg-[var(--color-bg-raised)] p-1 rounded-xl border border-[var(--color-border-subtle)]">
            <button
              onClick={onSwitchToAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                viewMode === 'admin' 
                  ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' 
                  : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Admin</span>
            </button>
            <button
              onClick={onSwitchToResident}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                viewMode === 'user' 
                  ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' 
                  : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Home size={14} />
              <span className="hidden sm:inline">Resident</span>
            </button>
          </div>
        )}

        {viewMode === 'admin' && (
          <button 
            onClick={onOpenNewPermit}
            className="bg-[var(--color-text-primary)] text-[var(--color-bg-page)] px-4 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em] rounded-full flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">NEW PERMIT</span>
            <span className="sm:hidden">ISSUE</span>
          </button>
        )}

        <button 
          onClick={toggleTheme}
          className="p-2.5 sm:p-3 rounded-full bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] transition-all border border-[var(--color-border-subtle)]"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {(userProfile || isSupabaseConfigured) && (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border-subtle)]">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-[140px]">
                {(userProfile?.email || 'User').split('@')[0]}
              </span>
              <span className="text-[10px] uppercase font-mono text-[var(--color-text-ghost)]">
                {userProfile?.role || (viewMode === 'admin' ? 'admin' : 'resident')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-ghost)]">
              <User size={14} />
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-status-error)] transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
