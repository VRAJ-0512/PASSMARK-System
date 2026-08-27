import React from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  Car, 
  History, 
  Settings, 
  Scan,
  X
} from 'lucide-react';
import { AdminTab, UserProfile } from '../../types';
import { LogoIcon, LogoText } from '../common/Brand';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  useSupabase: boolean;
  userProfile: UserProfile | null;
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarLink({ icon, label, active, onClick }: SidebarLinkProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-left ${
        active 
          ? 'bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] font-bold shadow-sm' 
          : 'text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-raised)]/40 font-medium'
      }`}
    >
      <div className={`${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-ghost)]'} transition-colors`}>
        {icon}
      </div>
      <span className="text-[13px] tracking-wide">{label}</span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] ml-auto" />
      )}
    </button>
  );
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  useSupabase,
  userProfile
}: SidebarProps) {
  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[var(--color-text-primary)] text-[var(--color-bg-page)] rounded-xl flex items-center justify-center shadow-md">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div>
            <LogoText className="text-xl" />
            <p className="text-[9px] uppercase tracking-widest font-mono text-[var(--color-text-ghost)]">Access Control</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          <SidebarLink 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleSelectTab('dashboard')} 
          />
          <SidebarLink 
            icon={<QrCode size={18} />} 
            label="Visitor Permits" 
            active={activeTab === 'permits'} 
            onClick={() => handleSelectTab('permits')} 
          />
          <SidebarLink 
            icon={<Scan size={18} />} 
            label="Gate Terminal" 
            active={activeTab === 'gate'} 
            onClick={() => handleSelectTab('gate')} 
          />
          <SidebarLink 
            icon={<Car size={18} />} 
            label="Parking Slots" 
            active={activeTab === 'slots'} 
            onClick={() => handleSelectTab('slots')} 
          />
          <SidebarLink 
            icon={<History size={18} />} 
            label="Audit Logs" 
            active={activeTab === 'logs'} 
            onClick={() => handleSelectTab('logs')} 
          />
          {(!useSupabase || userProfile?.role === 'admin') && (
            <SidebarLink 
              icon={<Settings size={18} />} 
              label="System Config" 
              active={activeTab === 'config'} 
              onClick={() => handleSelectTab('config')} 
            />
          )}
        </nav>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-bg-raised)]/60 border border-[var(--color-border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono text-[var(--color-text-ghost)] tracking-wider">System Status</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${useSupabase ? 'bg-[var(--color-status-success)] animate-pulse' : 'bg-[var(--color-status-warning)]'}`} />
            <span className="text-[10px] font-bold font-mono uppercase">
              {useSupabase ? 'Cloud' : 'Local'}\n            </span>\n          </div>\n        </div>\n        <p className=\"text-[11px] text-[var(--color-text-ghost)]\">\n          {useSupabase ? 'Connected to Supabase DB' : 'Using Local Browser Storage'}\n        </p>\n      </div>\n    </div>\n  );\n\n  return (\n    <>\n      <aside className=\"hidden lg:flex w-72 h-screen border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] sticky top-0 flex-col shrink-0 z-20 transition-colors\">\n        {navContent}\n      </aside>\n\n      {isMobileMenuOpen && (\n        <div className=\"fixed inset-0 z-50 lg:hidden flex\">\n          <div \n            className=\"fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity\"\n            onClick={() => setIsMobileMenuOpen(false)}\n          />\n          <div className=\"relative w-72 max-w-[80vw] h-full bg-[var(--color-bg-card)] shadow-2xl z-10 flex flex-col\">\n            <button \n              onClick={() => setIsMobileMenuOpen(false)}\n              className=\"absolute top-4 right-4 p-2 rounded-lg bg-[var(--color-bg-raised)] text-[var(--color-text-ghost)] hover:text-[var(--color-text-primary)]\"\n              aria-label=\"Close menu\"\n            >\n              <X size={18} />\n            </button>\n            {navContent}\n          </div>\n        </div>\n      )}\n    </>\n  );\n}\n