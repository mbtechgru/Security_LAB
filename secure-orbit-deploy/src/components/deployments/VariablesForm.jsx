import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, LayoutTemplate } from 'lucide-react';

const VAR_DEFAULTS = {
  region: 'us-east-1',
  vpc_cidr: '10.20.0.0/16',
  attacker_subnet_cidr: '10.20.10.0/24',
  victim_subnet_cidr: '10.20.20.0/24',
  services_subnet_cidr: '10.20.30.0/24',
};

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1',
];

const instanceTypes = ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small'];

export default function VariablesForm({ form, setForm }) {
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const { data: templates = [] } = useQuery({
    queryKey: ['deployment-templates'],
    queryFn: () => base44.entities.DeploymentTemplate.list(),
  });

  const autoPopulateNetwork = () => {
    setForm(prev => ({ ...prev, ...VAR_DEFAULTS }));
  };

  const applyTemplate = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      ...(tpl.region && { region: tpl.region }),
      ...(tpl.vpc_cidr && { vpc_cidr: tpl.vpc_cidr }),
      ...(tpl.attacker_subnet_cidr && { attacker_subnet_cidr: tpl.attacker_subnet_cidr }),
      ...(tpl.victim_subnet_cidr && { victim_subnet_cidr: tpl.victim_subnet_cidr }),
      ...(tpl.services_subnet_cidr && { services_subnet_cidr: tpl.services_subnet_cidr }),
      ...(tpl.allowed_admin_cidr && { allowed_admin_cidr: tpl.allowed_admin_cidr }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* General */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deployment Name *</span>
            <Input placeholder="my-pentest-lab" value={form.name} onChange={e => update('name', e.target.value)} className="text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">AWS Region</span>
            <Select value={form.region} onValueChange={v => update('region', v)}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <LayoutTemplate className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Load from template:</span>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className="flex-1 h-8 text-xs font-mono">
              <SelectValue placeholder="Select a saved template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Network Configuration */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Network Configuration</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-mono"
            onClick={autoPopulateNetwork}
          >
            <RotateCcw className="w-3 h-3" />
            Auto-fill from variables.tf
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">VPC CIDR Block</span>
            <Input placeholder="10.20.0.0/16" value={form.vpc_cidr} onChange={e => update('vpc_cidr', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allowed Admin CIDR</span>
            <Input placeholder="0.0.0.0/0" value={form.allowed_admin_cidr} onChange={e => update('allowed_admin_cidr', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attacker Subnet CIDR</span>
            <Input placeholder="10.20.10.0/24" value={form.attacker_subnet_cidr} onChange={e => update('attacker_subnet_cidr', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Victim Subnet CIDR</span>
            <Input placeholder="10.20.20.0/24" value={form.victim_subnet_cidr} onChange={e => update('victim_subnet_cidr', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services Subnet CIDR</span>
            <Input placeholder="10.20.30.0/24" value={form.services_subnet_cidr} onChange={e => update('services_subnet_cidr', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
        </div>
      </div>

      {/* Instance Configuration */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Instance Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instance Type</span>
            <Select value={form.instance_type} onValueChange={v => update('instance_type', v)}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>{instanceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Pair Name *</span>
            <Input placeholder="my-keypair" value={form.key_pair_name} onChange={e => update('key_pair_name', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
        </div>
      </div>

      {/* AMI IDs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">AMI Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kali Linux AMI *</span>
            <Input placeholder="ami-xxxxxxxxxxxxxxxxx" value={form.kali_ami_id} onChange={e => update('kali_ami_id', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metasploitable AMI *</span>
            <Input placeholder="ami-yyyyyyyyyyyyyyyyy" value={form.metasploitable_ami_id} onChange={e => update('metasploitable_ami_id', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Windows Server AMI *</span>
            <Input placeholder="ami-zzzzzzzzzzzzzzzzz" value={form.windows_ami_id} onChange={e => update('windows_ami_id', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
        </div>
      </div>

      {/* Active Directory */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain Name</span>
            <Input placeholder="lab.local" value={form.domain_name} onChange={e => update('domain_name', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">DSRM Password *</span>
            <Input placeholder="Strong password" value={form.dsrm_password} onChange={e => update('dsrm_password', e.target.value)} className="font-mono text-sm text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}