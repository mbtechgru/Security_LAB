import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, Loader2, Rocket } from 'lucide-react';

const statusConfig = {
  deployed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Deployed' },
  applying: { icon: Loader2, color: 'text-primary', bg: 'bg-primary', label: 'Applying', spin: true },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive', label: 'Failed' },
  destroying: { icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-500', label: 'Destroying', spin: true },
  destroyed: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted-foreground', label: 'Destroyed' },
  initializing: { icon: Loader2, color: 'text-primary', bg: 'bg-primary', label: 'Initializing', spin: true },
  planning: { icon: Rocket, color: 'text-violet-500', bg: 'bg-violet-500', label: 'Planning' },
};

export default function DeploymentStatus({ deployment }) {
  const status = deployment?.status || 'pending';
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deployment Status</h3>
        <div className={cn("w-2 h-2 rounded-full animate-pulse-dot", config.bg)} />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-lg bg-card border border-border", config.color)}>
          <Icon className={cn("w-5 h-5", config.spin && "animate-spin")} />
        </div>
        <div>
          <p className="font-bold text-lg">{config.label}</p>
          <p className="text-xs text-foreground font-mono">
            {deployment?.name || 'No active deployment'}
          </p>
        </div>
      </div>

      {deployment && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Region</p>
            <p className="text-xs font-mono font-medium mt-0.5 text-foreground">{deployment.region || 'us-east-1'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VPC</p>
            <p className="text-xs font-mono font-medium mt-0.5 text-foreground">{deployment.vpc_cidr || '10.20.0.0/16'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Instance Type</p>
            <p className="text-xs font-mono font-medium mt-0.5 text-foreground">{deployment.instance_type || 't2.micro'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Instances</p>
            <p className="text-xs font-mono font-medium mt-0.5 text-foreground">{deployment.instances?.length || 4}</p>
          </div>
        </div>
      )}
    </div>
  );
}