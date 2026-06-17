import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Globe, Server, Shield, Database, MonitorSmartphone,
  Network, Lock, Unlock, ArrowDown, ArrowRight, Wifi,
  Cloud, HardDrive, Layers
} from 'lucide-react';
import SubnetConnectionMap from '@/components/topology/SubnetConnectionMap';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Connector = ({ vertical = false, label }) => (
  <div className={cn("flex items-center justify-center", vertical ? "flex-col py-1" : "flex-row px-1")}>
    <div className={cn("bg-border", vertical ? "w-px h-8" : "h-px w-8")} />
    {label && (
      <span className="text-[9px] text-muted-foreground/60 font-mono px-1 whitespace-nowrap">{label}</span>
    )}
    <div className={cn("bg-border", vertical ? "w-px h-8" : "h-px w-8")} />
  </div>
);

const SubnetBox = ({ title, cidr, badge, isPublic, children }) => (
  <div className={cn(
    "rounded-xl border-2 border-dashed p-4 flex-1",
    isPublic ? "border-primary/40 bg-primary/5" : "border-muted-foreground/20 bg-muted/20"
  )}>
    <div className="flex items-center gap-2 mb-3">
      <div className={cn("w-2 h-2 rounded-full shrink-0", isPublic ? "bg-primary" : "bg-muted-foreground/50")} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      {badge && <Badge variant="outline" className="text-[9px] ml-auto">{badge}</Badge>}
      <span className="text-[10px] font-mono text-muted-foreground/50 ml-auto">{cidr}</span>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const InstanceNode = ({ name, role, icon: Icon, status = 'running', ip, ports, color = 'primary' }) => {
  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
    red: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', dot: 'bg-violet-500' },
    cyan: { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border p-3 hover:border-primary/30 transition-colors group">
      <div className={cn("p-2 rounded-lg shrink-0", c.bg)}>
        <Icon className={cn("w-4 h-4", c.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{role}</p>
        {ports && <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{ports}</p>}
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center justify-end gap-1 mb-0.5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === 'running' ? "bg-emerald-500 animate-pulse-dot" : "bg-muted-foreground/40"
          )} />
          <span className="text-[10px] text-muted-foreground capitalize">{status}</span>
        </div>
        {ip && <p className="text-[10px] font-mono text-muted-foreground/50">{ip}</p>}
      </div>
    </div>
  );
};

const AWSServiceBadge = ({ icon: Icon, label, detail }) => (
  <div className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-2">
    <Icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    <span className="text-xs font-medium">{label}</span>
    {detail && <span className="text-[10px] font-mono text-muted-foreground ml-auto">{detail}</span>}
  </div>
);

const FlowArrow = ({ label, direction = 'down', danger }) => (
  <div className="flex flex-col items-center gap-0.5 py-1">
    <div className="w-px h-5 bg-border" />
    {direction === 'down' ? (
      <ArrowDown className={cn("w-3 h-3", danger ? "text-destructive" : "text-muted-foreground/60")} />
    ) : (
      <ArrowRight className={cn("w-3 h-3", danger ? "text-destructive" : "text-muted-foreground/60")} />
    )}
    {label && (
      <span className={cn("text-[9px] font-mono", danger ? "text-destructive" : "text-muted-foreground/60")}>
        {label}
      </span>
    )}
    <div className="w-px h-5 bg-border" />
  </div>
);

// ─── Legend ──────────────────────────────────────────────────────────────────

const Legend = () => (
  <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
    {[
      { color: 'bg-emerald-500', label: 'Running' },
      { color: 'bg-muted-foreground/40', label: 'Stopped' },
      { color: 'bg-primary/40 border border-dashed border-primary/60', label: 'Public Subnet' },
      { color: 'bg-muted/40 border border-dashed border-border', label: 'Private Subnet' },
    ].map(({ color, label }) => (
      <div key={label} className="flex items-center gap-1.5">
        <div className={cn("w-3 h-3 rounded-sm", color)} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

// ─── Main topology diagram ────────────────────────────────────────────────────

const TopologyDiagram = ({ deployment }) => {
  const dep = deployment || {};
  const kaliStatus = dep.kali_public_ip ? 'running' : 'pending';
  const instanceStatus = dep.status === 'deployed' ? 'running' : 'pending';

  return (
    <div className="space-y-0">
      {/* Internet */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-muted/30 border border-border">
          <Globe className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold text-primary">Internet</span>
        </div>
      </div>

      <FlowArrow label="0.0.0.0/0" />

      {/* Internet Gateway */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Wifi className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Internet Gateway</span>
        </div>
      </div>

      <FlowArrow label="Public route" />

      {/* VPC wrapper */}
      <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            VPC — {dep.vpc_cidr || '10.20.0.0/16'}
          </span>
          {dep.vpc_id && <span className="text-[10px] font-mono text-muted-foreground/50 ml-auto">{dep.vpc_id}</span>}
        </div>

        {/* Attacker subnet */}
        <SubnetBox title="Attacker Subnet" cidr={dep.attacker_subnet_cidr || '10.20.10.0/24'} badge="Public" isPublic>
          <InstanceNode
            name="Kali Linux"
            role="Attacker workstation"
            icon={MonitorSmartphone}
            color="primary"
            status={kaliStatus}
            ip={dep.kali_public_ip || '—'}
            ports="SSH :22"
          />
        </SubnetBox>

        {/* Firewall rule indicator */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[10px] text-muted-foreground font-mono">
            <Shield className="w-3 h-3" />
            Security Groups
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Private subnets row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SubnetBox title="Victim Subnet" cidr={dep.victim_subnet_cidr || '10.20.20.0/24'}>
            <InstanceNode
              name="Metasploitable 2"
              role="Intentionally vulnerable"
              icon={Server}
              color="red"
              status={instanceStatus}
              ip="10.20.20.10"
              ports="21/22/23/80/445..."
            />
            <InstanceNode
              name="Windows DC"
              role="Active Directory (AD DS)"
              icon={HardDrive}
              color="amber"
              status={instanceStatus}
              ip="10.20.20.20"
              ports="53/88/135/389/445"
            />
          </SubnetBox>

          <SubnetBox title="Services Subnet" cidr={dep.services_subnet_cidr || '10.20.30.0/24'}>
            <InstanceNode
              name="OWASP Juice Shop"
              role="Vulnerable web app"
              icon={Database}
              color="violet"
              status={instanceStatus}
              ip="10.20.30.10"
              ports="HTTP :3000"
            />
          </SubnetBox>
        </div>
      </div>

      <FlowArrow />

      {/* AWS Services */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500/80">AWS Managed Services</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AWSServiceBadge icon={Lock} label="IAM Role" detail="OverPermissive-Role" />
          <AWSServiceBadge icon={HardDrive} label="S3 Bucket" detail={dep.vuln_bucket_name || 'pentest-lab-vuln-*'} />
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkTopologyPage() {
  const [selectedId, setSelectedId] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date'),
  });

  const deployed = deployments.filter(d => d.status === 'deployed');
  const activeDeployment = deployments.find(d => d.id === selectedId) || deployed[0] || deployments[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Network Topology</h1>
          <p className="text-sm text-muted-foreground mt-1">Visual map of your pentesting lab VPC architecture</p>
        </div>
        {deployments.length > 0 && (
          <Select
            value={activeDeployment?.id || ''}
            onValueChange={setSelectedId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select deployment" />
            </SelectTrigger>
            <SelectContent>
              {deployments.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      d.status === 'deployed' ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )} />
                    {d.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {deployments.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border">
          <Network className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No deployments found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Deploy a lab environment to see its network topology</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Topology diagram */}
          <div className="xl:col-span-2 space-y-4">
            {/* SVG Connection Map */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Connection Map</h2>
                {activeDeployment?.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      activeDeployment.status === 'deployed'
                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                        : 'border-border text-muted-foreground'
                    )}
                  >
                    {activeDeployment.status}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">Hover edges to inspect traffic paths</span>
              </div>
              <SubnetConnectionMap
                deployment={activeDeployment}
                activeNodeId={hoveredNode}
                onNodeHover={setHoveredNode}
              />
            </div>

            {/* Detailed layout diagram */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">Infrastructure Layout</h2>
                </div>
                <Legend />
              </div>
              <TopologyDiagram deployment={activeDeployment} />
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            {/* Network info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Network Details</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'VPC CIDR', value: activeDeployment?.vpc_cidr || '10.20.0.0/16' },
                  { label: 'Attacker Subnet', value: activeDeployment?.attacker_subnet_cidr || '10.20.10.0/24' },
                  { label: 'Victim Subnet', value: activeDeployment?.victim_subnet_cidr || '10.20.20.0/24' },
                  { label: 'Services Subnet', value: activeDeployment?.services_subnet_cidr || '10.20.30.0/24' },
                  { label: 'Admin CIDR', value: activeDeployment?.allowed_admin_cidr || '0.0.0.0/0' },
                  { label: 'Domain', value: activeDeployment?.domain_name || 'lab.local' },
                  { label: 'Region', value: activeDeployment?.region || 'us-east-1' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                    <span className="text-xs font-mono text-foreground/80 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security findings */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Security Exposure</h3>
              <div className="space-y-2">
                {[
                  { label: 'Public SSH (Kali)', severity: 'high', note: 'Port 22 open to admin CIDR' },
                  { label: 'Over-permissive IAM', severity: 'critical', note: 'Action:* on Resource:*' },
                  { label: 'Public S3 Bucket', severity: 'critical', note: 'Read/write to 0.0.0.0/0' },
                  { label: 'Metasploitable 2', severity: 'critical', note: 'Multiple known CVEs' },
                  { label: 'HTTP Juice Shop', severity: 'medium', note: 'No TLS on port 3000' },
                  { label: 'AD DSRM via user_data', severity: 'high', note: 'Cleartext in launch config' },
                ].map(({ label, severity, note }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                      severity === 'critical' ? "bg-destructive/15 text-destructive" :
                      severity === 'high' ? "bg-amber-500/15 text-amber-500" :
                      "bg-primary/10 text-primary"
                    )}>
                      {severity.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kali public IP */}
            {activeDeployment?.kali_public_ip && (
              <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
                <p className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold mb-1">Kali Entry Point</p>
                <p className="text-sm font-mono font-bold text-primary">{activeDeployment.kali_public_ip}</p>
                <p className="text-[10px] text-muted-foreground mt-1">ssh kali@{activeDeployment.kali_public_ip} -i &lt;key&gt;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}