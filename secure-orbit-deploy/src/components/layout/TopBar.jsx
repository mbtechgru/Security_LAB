import React, { useState, useRef, useEffect } from 'react';
import { Search, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import AlertsDropdown from '@/components/layout/AlertsDropdown';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Operator';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search deployments, reports..." 
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex items-center gap-3">
        <AlertsDropdown />

        {/* User account menu */}
        <div className="relative pl-3 border-l border-border" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="flex items-center gap-2 hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
              {user?.email && (
                <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {user?.email && <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>}
                {user?.role && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Shield className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-mono text-primary uppercase">{user.role}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}