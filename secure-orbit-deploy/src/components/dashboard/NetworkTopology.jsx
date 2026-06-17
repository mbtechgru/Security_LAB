import React from 'react';
import { cn } from '@/lib/utils';
import { Globe, Server, Shield, Database, MonitorSmartphone } from 'lucide-react';

const SubnetBox = ({ title, cidr, isPublic, children }) => (
  <div className={cn(
    "rounded-xl border-2 border-dashed p-4",
    isPublic ? "border-primary/30 bg-primary/5" : "border-muted-foreground/20 bg-muted/30"
  )}>
    <div className="flex items-center gap-2 mb-3">
      <div className={cn("w-1.5 h-1.5 rounded-full", isPublic ? "bg-primary" : "bg-muted-foreground")} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">{cidr}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const InstanceNode = ({ name, type, icon: Icon, status = "running", ip }) => (
  <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-3 hover:border-primary/40 transition-colors">
    <div className="p-1.5 rounded-md bg-primary/10">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate">{name}</p>
      <p className="text-[10px] text-muted-foreground font-mono">{type}</p>
    </div>
    <div className="text-right">
      <div className="flex items-center gap-1">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === 'running' ? "bg-emerald-500 animate-pulse-dot" : "bg-muted-foreground"
        )} />
        <span className="text-[10px] text-muted-foreground capitalize">{status}</span>
      </div>
      {ip && <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{ip}</p>}
    </div>
  </div>
);

export default function NetworkTopology({ deployment }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Network Topology</h3>
        <span className="text-[10px] font-mono text-muted-foreground/60">VPC: {deployment?.vpc_cidr || '10.20.0.0/16'}</span>
      </div>

      {/* Internet Gateway */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Internet Gateway</span>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-px h-6 bg-border" />
      </div>

      <div className="space-y-4">
        {/* Attacker Subnet (Public) */}
        <SubnetBox title="Attacker Subnet (Public)" cidr={deployment?.attacker_subnet_cidr || "10.20.10.0/24"} isPublic>
          <InstanceNode 
            name="Kali Linux" 
            type="t2.micro" 
            icon={MonitorSmartphone} 
            ip={deployment?.kali_public_ip || "—"} 
          />
        </SubnetBox>

        {/* Connection lines */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="h-px w-12 bg-border" />
            <Shield className="w-3.5 h-3.5 text-muted-foreground/40" />
            <div className="h-px w-12 bg-border" />
          </div>
        </div>

        {/* Victim Subnet */}
        <SubnetBox title="Victim Subnet (Private)" cidr={deployment?.victim_subnet_cidr || "10.20.20.0/24"}>
          <InstanceNode name="Metasploitable 2" type="t2.micro" icon={Server} />
          <InstanceNode name="Windows DC (AD DS)" type="t2.micro" icon={MonitorSmartphone} ip={deployment?.domain_name || "lab.local"} />
        </SubnetBox>

        {/* Services Subnet */}
        <SubnetBox title="Services Subnet (Private)" cidr={deployment?.services_subnet_cidr || "10.20.30.0/24"}>
          <InstanceNode name="OWASP Juice Shop" type="t2.micro (Docker)" icon={Database} ip="port 3000" />
        </SubnetBox>
      </div>
    </div>
  );
}