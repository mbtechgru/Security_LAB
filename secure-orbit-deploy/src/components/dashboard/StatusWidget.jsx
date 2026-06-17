import React from 'react';
import { cn } from '@/lib/utils';

export default function StatusWidget({ title, value, subtitle, icon: Icon, trend, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-amber-500/10 text-amber-500",
    success: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-lg", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-mono font-medium px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-heading tracking-tight">{value}</p>
      <p className="text-xs text-foreground font-medium mt-1">{title}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{subtitle}</p>}
    </div>
  );
}