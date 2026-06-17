import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Rocket, Cloud, AlertTriangle, CheckCircle2 } from 'lucide-react';
import moment from 'moment';

const typeConfig = {
  deployment: { icon: Rocket, color: 'text-primary', bg: 'bg-primary/10' },
  security: { icon: Shield, color: 'text-destructive', bg: 'bg-destructive/10' },
  system: { icon: Cloud, color: 'text-accent', bg: 'bg-accent/10' },
  account: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  error: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const severityBadge = {
  info: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-500',
  critical: 'bg-destructive/10 text-destructive',
  success: 'bg-emerald-500/10 text-emerald-500',
};

export default function EventTimeline({ events = [] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Events</h3>
      
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No events yet</p>
        )}
        {events.map((event) => {
          const config = typeConfig[event.type] || typeConfig.system;
          const Icon = config.icon;
          return (
            <div key={event.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className={cn("p-1.5 rounded-md flex-shrink-0 mt-0.5", config.bg)}>
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0", severityBadge[event.severity])}>
                    {event.severity}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                  {moment(event.created_date).fromNow()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}