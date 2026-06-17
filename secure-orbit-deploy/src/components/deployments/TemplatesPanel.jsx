import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BookTemplate, Plus, Trash2, Download, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TemplatesPanel({ currentForm, onLoad }) {
  const queryClient = useQueryClient();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['deployment-templates'],
    queryFn: () => base44.entities.DeploymentTemplate.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.DeploymentTemplate.create({
      name: templateName,
      description: templateDesc,
      region: currentForm.region,
      vpc_cidr: currentForm.vpc_cidr,
      attacker_subnet_cidr: currentForm.attacker_subnet_cidr,
      victim_subnet_cidr: currentForm.victim_subnet_cidr,
      services_subnet_cidr: currentForm.services_subnet_cidr,
      allowed_admin_cidr: currentForm.allowed_admin_cidr,
      domain_name: currentForm.domain_name,
      instance_type: currentForm.instance_type,
      key_pair_name: currentForm.key_pair_name,
      kali_ami_id: currentForm.kali_ami_id,
      metasploitable_ami_id: currentForm.metasploitable_ami_id,
      windows_ami_id: currentForm.windows_ami_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-templates'] });
      setShowSaveForm(false);
      setTemplateName('');
      setTemplateDesc('');
      toast.success('Template saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeploymentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-templates'] });
      toast.success('Template deleted');
    },
  });

  const handleLoad = (tpl) => {
    onLoad({
      region: tpl.region,
      vpc_cidr: tpl.vpc_cidr,
      attacker_subnet_cidr: tpl.attacker_subnet_cidr,
      victim_subnet_cidr: tpl.victim_subnet_cidr,
      services_subnet_cidr: tpl.services_subnet_cidr,
      allowed_admin_cidr: tpl.allowed_admin_cidr,
      domain_name: tpl.domain_name,
      instance_type: tpl.instance_type,
      key_pair_name: tpl.key_pair_name || '',
      kali_ami_id: tpl.kali_ami_id || '',
      metasploitable_ami_id: tpl.metasploitable_ami_id || '',
      windows_ami_id: tpl.windows_ami_id || '',
    });
    toast.success(`Template "${tpl.name}" loaded`);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookTemplate className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">Templates</h2>
          {templates.length > 0 && (
            <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">{templates.length}</span>
          )}
        </div>
        <Button variant="default" size="sm" className="gap-1.5 text-xs" onClick={() => setShowSaveForm(!showSaveForm)}>
          <Save className="w-3.5 h-3.5" />
          Save as Template
        </Button>
      </div>

      {/* Save Form */}
      {showSaveForm && (
        <div className="mb-4 p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Template Name *</Label>
            <Input
              placeholder="e.g., US East — Standard Lab"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="h-9 text-sm text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              placeholder="Optional notes"
              value={templateDesc}
              onChange={e => setTemplateDesc(e.target.value)}
              className="h-9 text-sm text-foreground"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSaveForm(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!templateName || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 && !showSaveForm && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No templates yet. Configure your variables and save as a template for quick reuse.
        </p>
      )}

      <div className="space-y-2">
        {templates.map(tpl => (
          <div key={tpl.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                {tpl.description && <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{tpl.region}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{tpl.vpc_cidr}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{tpl.instance_type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7 bg-primary text-primary-foreground border-primary hover:bg-primary/90" onClick={() => handleLoad(tpl)}>
                  <Download className="w-3 h-3" />
                  Load
                </Button>
                <button
                  onClick={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {expandedId === tpl.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(tpl.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === tpl.id && (
              <div className="border-t border-border px-4 py-3 bg-muted/20 grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  ['VPC CIDR', tpl.vpc_cidr],
                  ['Attacker Subnet', tpl.attacker_subnet_cidr],
                  ['Victim Subnet', tpl.victim_subnet_cidr],
                  ['Services Subnet', tpl.services_subnet_cidr],
                  ['Admin CIDR', tpl.allowed_admin_cidr],
                  ['Domain', tpl.domain_name],
                  ['Instance Type', tpl.instance_type],
                  ['Key Pair', tpl.key_pair_name || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-28 flex-shrink-0">{label}</span>
                    <span className="text-[10px] font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}