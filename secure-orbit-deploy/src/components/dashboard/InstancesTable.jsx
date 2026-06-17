import React from 'react';
import { cn } from '@/lib/utils';
import { Server, MonitorSmartphone, Database } from 'lucide-react';

const defaultInstances = [
  { name: 'Kali Linux', role: 'Attacker', subnet: 'Public', type: 't2.micro', status: 'running', icon: MonitorSmartphone },
  { name: 'Metasploitable 2', role: 'Victim', subnet: 'Private', type: 't2.micro', status: 'running', icon: Server },
  { name: 'Windows DC', role: 'Victim (AD DS)', subnet: 'Private', type: 't2.micro', status: 'running', icon: MonitorSmartphone },
  { name: 'Juice Shop', role: 'Services', subnet: 'Private', type: 't2.micro', status: 'running', icon: Database },
];

const statusStyles = {
  running: 'bg-emerald-500/10 text-emerald-500',
  stopped: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-500',
  terminated: 'bg-destructive/10 text-destructive',
};

export default function InstancesTable() {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lab Instances</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Instance</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Role</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Subnet</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Type</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {defaultInstances.map((inst) => {
              const Icon = inst.icon;
              return (
                <tr key={inst.name} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{inst.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">{inst.role}</td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                      inst.subnet === 'Public' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                    )}>
                      {inst.subnet}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">{inst.type}</td>
                  <td className="py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", statusStyles[inst.status])}>
                      {inst.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}