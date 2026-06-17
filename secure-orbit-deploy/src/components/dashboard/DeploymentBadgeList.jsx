import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Loader2, Trash2, Rocket } from 'lucide-react';

const STATUS_CONFIG = {
  deployed:     { label: 'Active',       icon: CheckCircle2, classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed:       { label: 'Failed',       icon: XCircle,      classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending:      { label: 'Pending',      icon: Clock,        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  initializing: { label: 'Initializing', icon: Loader2,      classes: 'bg-primary/10 text-primary border-primary/20', spin: true },
  planning:     { label: 'Planning',     icon: Loader2,      classes: 'bg-violet-500/10 text-violet-400 border-violet-500/20', spin: true },
  applying:     { label: 'Applying',     icon: Loader2,      classes: 'bg-primary/10 text-primary border-primary/20', spin: true },
  destroying:   { label: 'Destroying',   icon: Loader2,      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', spin: true },
  destroyed:    { label: 'Destroyed',    icon: Trash2,       classes: 'bg-muted text-muted-foreground border-border' },
};

export default function DeploymentBadgeList({ deployments }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deployment Status</h3>
      </div>
      {!deployments?.length ? (
        <p className="text-sm text-muted-foreground">No deployments found.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {deployments.map(dep => {
            const cfg = STATUS_CONFIG[dep.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div
                key={dep.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium',
                  cfg.classes
                )}
                title={`${dep.name} — ${dep.region}`}
              >
                <Icon className={cn('w-3 h-3', cfg.spin && 'animate-spin')} />
                <span className="font-mono max-w-[120px] truncate text-foreground">{dep.name}</span>
                <span className="opacity-60">·</span>
                <span>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}