import React, { useState } from 'react';
import { Bell, AlertTriangle, DollarSign, Cpu, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useResourceAlerts } from '@/hooks/useResourceAlerts';

const severityConfig = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', dot: 'bg-destructive' },
  warning:  { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400' },
};

const typeIcon = {
  budget: DollarSign,
  cpu:    Cpu,
};

export default function AlertsDropdown() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date'),
    refetchInterval: 30_000,
  });

  const allAlerts = useResourceAlerts(deployments);
  const alerts = allAlerts.filter(a => !dismissed.has(a.id));
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const hasAlerts = alerts.length > 0;

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));
  const dismissAll = () => setDismissed(new Set(allAlerts.map(a => a.id)));

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className={cn("w-4 h-4", hasAlerts ? "text-foreground" : "text-muted-foreground")} />
        {hasAlerts && (
          <span className={cn(
            "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
            criticalCount > 0 ? "bg-destructive" : "bg-amber-400"
          )} />
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">Resource Alerts</span>
                {alerts.length > 0 && (
                  <span className="text-[10px] font-mono bg-destructive/15 text-destructive px-1.5 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </div>
              {alerts.length > 0 && (
                <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-muted-foreground" onClick={dismissAll}>
                  <CheckCheck className="w-3 h-3 mr-1" /> Dismiss all
                </Button>
              )}
            </div>

            {/* Alert list */}
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCheck className="w-8 h-8 text-emerald-500/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">All environments within thresholds</p>
                </div>
              ) : (
                alerts.map(alert => {
                  const cfg = severityConfig[alert.severity] || severityConfig.warning;
                  const Icon = typeIcon[alert.type] || AlertTriangle;
                  return (
                    <div key={alert.id} className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0",
                      "hover:bg-secondary/30 transition-colors"
                    )}>
                      <div className={cn("p-1.5 rounded-md border mt-0.5 shrink-0", cfg.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                          <p className={cn("text-xs font-semibold", cfg.color)}>{alert.title}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{alert.detail}</p>
                      </div>
                      <button
                        onClick={() => dismiss(alert.id)}
                        className="text-muted-foreground/40 hover:text-muted-foreground mt-0.5 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/20">
              <p className="text-[10px] text-muted-foreground">
                Budget limit: $50/mo · CPU risk: T-series burstable instances · Refreshes every 30s
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}