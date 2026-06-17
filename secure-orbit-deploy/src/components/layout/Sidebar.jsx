import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cloud, 
  Rocket, 
  FileBarChart, 
  Shield, 
  Terminal,
  Network,
  ScrollText,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './AppLayout';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/onboarding', label: 'Cloud Onboarding', icon: Cloud },
  { path: '/deployments', label: 'Deployments', icon: Rocket },
  { path: '/topology', label: 'Network Topology', icon: Network },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/event-log', label: 'Event Log', icon: ScrollText },
  { path: '/cost-estimator', label: 'Cost Estimator', icon: Calculator },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-all duration-300",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">Security LAB</h1>
            <p className="text-[10px] text-sidebar-foreground/50 font-mono">TERRAFORM • PENTEST</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-mono text-sidebar-foreground/40">v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}