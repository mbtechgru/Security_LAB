import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Rocket, Play, Trash2, Plus, Clock, CheckCircle2,
  XCircle, Loader2, AlertTriangle, History, Settings2, BarChart2, ChevronDown, Upload
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import VariablesForm from '../components/deployments/VariablesForm';
import DeployLog from '../components/deployments/DeployLog';
import TemplatesPanel from '../components/deployments/TemplatesPanel';
import DeployCostEstimate from '../components/deployments/DeployCostEstimate';
import PlanSummary from '../components/deployments/PlanSummary';
import ResourceUsageGraphs from '../components/deployments/ResourceUsageGraphs';
import BulkImport from '../components/deployments/BulkImport';
import moment from 'moment';

const defaultForm = {
  name: '',
  region: 'us-east-1',
  vpc_cidr: '10.20.0.0/16',
  attacker_subnet_cidr: '10.20.10.0/24',
  victim_subnet_cidr: '10.20.20.0/24',
  services_subnet_cidr: '10.20.30.0/24',
  key_pair_name: '',
  allowed_admin_cidr: '0.0.0.0/0',
  domain_name: 'lab.local',
  dsrm_password: '',
  instance_type: 't2.micro',
  kali_ami_id: '',
  metasploitable_ami_id: '',
  windows_ami_id: '',
};

const statusConfig = {
  deployed: { icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  applying: { icon: Loader2, color: 'bg-primary/10 text-primary border-primary/20', spin: true },
  pending: { icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  failed: { icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  destroyed: { icon: Trash2, color: 'bg-muted text-muted-foreground border-border' },
  destroying: { icon: Loader2, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', spin: true },
  initializing: { icon: Loader2, color: 'bg-primary/10 text-primary border-primary/20', spin: true },
  planning: { icon: Rocket, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
};

function generateDeployLog(form) {
  return `>>> terraform init
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching ">= 5.0"...
- Installing hashicorp/aws v5.76.0...
- Installed hashicorp/aws v5.76.0

Terraform has been successfully initialized!

>>> terraform plan
data.aws_caller_identity.current: Reading...
data.aws_ssm_parameter.al2023_ami: Reading...

Plan: 18 to add, 0 to change, 0 to destroy.

>>> terraform apply -auto-approve
aws_vpc.lab: Creating...
aws_vpc.lab: Creation complete [id=vpc-0abc123def456]
aws_internet_gateway.igw: Creating...
aws_internet_gateway.igw: Creation complete
aws_subnet.attacker: Creating... [${form.attacker_subnet_cidr}]
aws_subnet.victim: Creating... [${form.victim_subnet_cidr}]
aws_subnet.services: Creating... [${form.services_subnet_cidr}]
aws_subnet.attacker: Creation complete
aws_subnet.victim: Creation complete
aws_subnet.services: Creation complete
aws_security_group.attacker: Creating...
aws_security_group.victim: Creating...
aws_security_group.services: Creating...
aws_security_group.attacker: Creation complete
aws_security_group.victim: Creation complete
aws_security_group.services: Creation complete
aws_iam_role.lab_role: Creating...
aws_iam_role.lab_role: Creation complete
aws_s3_bucket.vuln: Creating...
aws_s3_bucket.vuln: Creation complete
aws_instance.kali: Creating... [${form.instance_type}]
aws_instance.metasploitable: Creating... [${form.instance_type}]
aws_instance.windows_dc: Creating... [${form.instance_type}]
aws_instance.juice_shop: Creating... [${form.instance_type}]
aws_instance.kali: Still creating... [10s elapsed]
aws_instance.kali: Creation complete [id=i-0abc123]
aws_instance.metasploitable: Creation complete [id=i-0def456]
aws_instance.windows_dc: Creation complete [id=i-0ghi789]
aws_instance.juice_shop: Creation complete [id=i-0jkl012]

Apply complete! Resources: 18 added, 0 changed, 0 destroyed.

Outputs:
kali_public_ip = "54.210.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}"
vuln_bucket_name = "pentest-lab-vuln-${form.region}"
vpc_id = "vpc-0abc123def456"`;
}

export default function Deployments() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...defaultForm });
  const [activeTab, setActiveTab] = useState('new');
  const [deployLog, setDeployLog] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [planOutput, setPlanOutput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [expandedResources, setExpandedResources] = useState(new Set());

  const toggleResourceGraph = (id) => {
    setExpandedResources(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date'),
  });

  const createDeployment = useMutation({
    mutationFn: async (data) => {
      const deployment = await base44.entities.Deployment.create({
        ...data,
        status: 'initializing',
        instances: [
          { name: 'Kali Linux', type: data.instance_type, status: 'pending', subnet: 'attacker' },
          { name: 'Metasploitable 2', type: data.instance_type, status: 'pending', subnet: 'victim' },
          { name: 'Windows DC', type: data.instance_type, status: 'pending', subnet: 'victim' },
          { name: 'Juice Shop', type: data.instance_type, status: 'pending', subnet: 'services' },
        ],
      });
      await base44.entities.Event.create({
        type: 'deployment',
        title: `Deployment "${data.name}" started`,
        description: `Region: ${data.region}, VPC: ${data.vpc_cidr}`,
        severity: 'info',
        deployment_id: deployment.id,
      });
      return deployment;
    },
    onSuccess: async (deployment) => {
      setIsDeploying(true);
      const log = generateDeployLog(form);
      const lines = log.split('\n');
      let current = '';
      
      for (let i = 0; i < lines.length; i++) {
        current += lines[i] + '\n';
        setDeployLog(current);
        await new Promise(r => setTimeout(r, 80));
      }

      const kaliIp = `54.210.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
      await base44.entities.Deployment.update(deployment.id, {
        status: 'deployed',
        kali_public_ip: kaliIp,
        vpc_id: 'vpc-0abc123def456',
        vuln_bucket_name: `pentest-lab-vuln-${form.region}`,
        deploy_log: log,
        instances: [
          { name: 'Kali Linux', type: form.instance_type, status: 'running', subnet: 'attacker', public_ip: kaliIp },
          { name: 'Metasploitable 2', type: form.instance_type, status: 'running', subnet: 'victim', private_ip: '10.20.20.10' },
          { name: 'Windows DC', type: form.instance_type, status: 'running', subnet: 'victim', private_ip: '10.20.20.20' },
          { name: 'Juice Shop', type: form.instance_type, status: 'running', subnet: 'services', private_ip: '10.20.30.10' },
        ],
      });

      await base44.entities.Event.create({
        type: 'deployment',
        title: `Deployment "${form.name}" completed`,
        description: `18 resources created. Kali IP: ${kaliIp}`,
        severity: 'success',
        deployment_id: deployment.id,
      });

      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsDeploying(false);
      toast.success('Lab deployed successfully!');
    },
  });

  const destroyDeployment = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Deployment.update(id, { status: 'destroyed' });
      await base44.entities.Event.create({
        type: 'deployment',
        title: 'Deployment destroyed',
        severity: 'warning',
        deployment_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Lab destroyed');
    },
  });

  const destroyBulk = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id =>
        base44.entities.Deployment.update(id, { status: 'destroyed' }).then(() =>
          base44.entities.Event.create({ type: 'deployment', title: 'Deployment destroyed', severity: 'warning', deployment_id: id })
        )
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelected(new Set());
      toast.success('Selected labs destroyed');
    },
  });

  const deployedDeployments = deployments.filter(d => d.status === 'deployed');
  const selectableIds = deployedDeployments.map(d => d.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableIds));
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeploy = () => {
    const missing = [];
    if (!form.name) missing.push('Deployment Name');
    if (!form.key_pair_name) missing.push('Key Pair Name');
    if (!form.kali_ami_id) missing.push('Kali AMI ID');
    if (!form.metasploitable_ami_id) missing.push('Metasploitable AMI ID');
    if (!form.windows_ami_id) missing.push('Windows AMI ID');
    if (!form.dsrm_password) missing.push('DSRM Password');
    
    if (missing.length > 0) {
      toast.error('Missing required fields: ' + missing.join(', '));
      return;
    }
    setActiveTab('new');
    createDeployment.mutate(form);
  };

  const handlePlan = async () => {
    const missing = [];
    if (!form.name) missing.push('Deployment Name');
    if (!form.key_pair_name) missing.push('Key Pair Name');
    if (!form.kali_ami_id) missing.push('Kali AMI ID');
    if (!form.metasploitable_ami_id) missing.push('Metasploitable AMI ID');
    if (!form.windows_ami_id) missing.push('Windows AMI ID');
    if (!form.dsrm_password) missing.push('DSRM Password');
    
    if (missing.length > 0) {
      toast.error('Missing required fields: ' + missing.join(', '));
      return;
    }
    setIsPlanning(true);
    setPlanOutput('');
    
    const planLines = [
      '>>> terraform init',
      'Initializing the backend...',
      'Initializing provider plugins...',
      '- Finding hashicorp/aws versions matching ">= 5.0"...',
      '- Installing hashicorp/aws v5.76.0...',
      '- Installed hashicorp/aws v5.76.0',
      '',
      'Terraform has been successfully initialized!',
      '',
      '>>> terraform plan',
      'data.aws_caller_identity.current: Reading...',
      'data.aws_ssm_parameter.al2023_ami: Reading...',
      '',
      'Terraform will perform the following actions:',
      '',
      '  # aws_vpc.lab will be created',
      '  + resource "aws_vpc" "lab" {',
      '    + cidr_block           = "' + form.vpc_cidr + '"',
      '    + enable_dns_hostnames = true',
      '    + enable_dns_support   = true',
      '    + id                   = (known after apply)',
      '    + tags                 = {',
      '        + "Name" = "' + form.name + '-vpc"',
      '    }',
      '  }',
      '',
      '  # aws_internet_gateway.igw will be created',
      '  + resource "aws_internet_gateway" "igw" {',
      '    + id       = (known after apply)',
      '    + vpc_id   = (known after apply)',
      '  }',
      '',
      '  # aws_subnet.attacker will be created',
      '  + resource "aws_subnet" "attacker" {',
      '    + cidr_block = "' + form.attacker_subnet_cidr + '"',
      '    + vpc_id     = (known after apply)',
      '  }',
      '',
      '  # aws_subnet.victim will be created',
      '  + resource "aws_subnet" "victim" {',
      '    + cidr_block = "' + form.victim_subnet_cidr + '"',
      '    + vpc_id     = (known after apply)',
      '  }',
      '',
      '  # aws_subnet.services will be created',
      '  + resource "aws_subnet" "services" {',
      '    + cidr_block = "' + form.services_subnet_cidr + '"',
      '    + vpc_id     = (known after apply)',
      '  }',
      '',
      '  # aws_security_group.attacker will be created',
      '  + resource "aws_security_group" "attacker" { ... }',
      '',
      '  # aws_security_group.victim will be created',
      '  + resource "aws_security_group" "victim" { ... }',
      '',
      '  # aws_security_group.services will be created',
      '  + resource "aws_security_group" "services" { ... }',
      '',
      '  # aws_instance.kali will be created',
      '  + resource "aws_instance" "kali" {',
      '    + instance_type = "' + form.instance_type + '"',
      '    + ami           = "' + form.kali_ami_id + '"',
      '  }',
      '',
      '  # aws_instance.metasploitable will be created',
      '  + resource "aws_instance" "metasploitable" {',
      '    + instance_type = "' + form.instance_type + '"',
      '    + ami           = "' + form.metasploitable_ami_id + '"',
      '  }',
      '',
      '  # aws_instance.windows_dc will be created',
      '  + resource "aws_instance" "windows_dc" {',
      '    + instance_type = "' + form.instance_type + '"',
      '    + ami           = "' + form.windows_ami_id + '"',
      '  }',
      '',
      '  # aws_instance.juice_shop will be created',
      '  + resource "aws_instance" "juice_shop" {',
      '    + instance_type = "' + form.instance_type + '"',
      '  }',
      '',
      '  # aws_iam_role.lab_role will be created',
      '  + resource "aws_iam_role" "lab_role" { ... }',
      '',
      '  # aws_s3_bucket.vuln will be created',
      '  + resource "aws_s3_bucket" "vuln" {',
      '    + bucket = "pentest-lab-vuln-' + form.region + '"',
      '  }',
      '',
      'Plan: 18 to add, 0 to change, 0 to destroy.',
      '',
      '────────────────────────────────────────────────────────────',
      'Saved the plan to: tfplan',
      '',
      'To perform exactly these actions, run the following command:',
      '    terraform apply "tfplan"',
    ];

    for (let i = 0; i < planLines.length; i++) {
      setPlanOutput(prev => prev + planLines[i] + '\n');
      await new Promise(r => setTimeout(r, 30));
    }
    
    setIsPlanning(false);
    toast.success('Terraform plan completed - 18 resources to add');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Deployments</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure and deploy pentesting lab environments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new" className="gap-2"><Plus className="w-3.5 h-3.5" /> New Deployment</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-3.5 h-3.5" /> History</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Settings2 className="w-3.5 h-3.5" /> Templates</TabsTrigger>
          <TabsTrigger value="import" className="gap-2"><Upload className="w-3.5 h-3.5" /> Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4 mt-4">
          {/* Templates Panel */}
          <TemplatesPanel
            currentForm={form}
            onLoad={(tplValues) => setForm(prev => ({ ...prev, ...tplValues }))}
          />

          {/* Variables Form */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">terraform.tfvars</h2>
              <span className="text-xs font-mono text-muted-foreground ml-2">Configuration Parameters</span>
            </div>
            <VariablesForm form={form} setForm={setForm} />
          </div>

          {/* Cost Estimate */}
          <DeployCostEstimate region={form.region} instanceType={form.instance_type} />

          {/* Deploy Button */}
          <div className="flex items-center justify-between bg-card rounded-xl border border-border p-5">
            <div>
              <p className="text-sm font-medium">Ready to deploy?</p>
              <p className="text-xs text-muted-foreground mt-0.5">This will create 18 AWS resources in your selected region</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setForm({ ...defaultForm })}
                disabled={isDeploying}
                className="text-emerald-500 border-emerald-500 hover:bg-emerald-500 hover:text-white"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={handlePlan}
                disabled={isDeploying || isPlanning}
                className="gap-2 min-w-[140px] text-violet-500 border-violet-500 hover:bg-violet-500 hover:text-white"
              >
                {isPlanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Planning...</>
                ) : (
                  <><Settings2 className="w-4 h-4" /> Test Plan</>
                )}
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || createDeployment.isPending || isPlanning}
                className="gap-2 min-w-[140px]"
              >
                {isDeploying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</>
                ) : (
                  <><Play className="w-4 h-4" /> Deploy Lab</>
                )}
              </Button>
            </div>
          </div>

          {/* Plan Summary */}
          {(planOutput || isPlanning) && (
            <PlanSummary planOutput={planOutput} />
          )}

          {/* Deploy Log */}
          {(deployLog || isDeploying) && <DeployLog logs={deployLog} />}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesPanel
            currentForm={form}
            onLoad={(tplValues) => { setForm(prev => ({ ...prev, ...tplValues })); setActiveTab('new'); }}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <BulkImport />
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-3">
              <span className="text-sm font-medium text-destructive">{selected.size} environment{selected.size > 1 ? 's' : ''} selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Deselect All</Button>
                <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Destroy Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Destroy {selected.size} lab{selected.size > 1 ? 's' : ''}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will simulate <span className="font-mono font-semibold">terraform destroy</span> on all {selected.size} selected environments. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => destroyBulk.mutate([...selected])}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Yes, Destroy All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {deployments.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
              <Rocket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No deployments yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first deployment to get started</p>
            </div>
          )}

          {/* Select all row */}
          {selectableIds.length > 1 && (
            <div className="flex items-center gap-3 px-5 py-2 text-xs text-muted-foreground">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="cursor-pointer select-none">
                Select all active deployments ({selectableIds.length})
              </label>
            </div>
          )}

          {deployments.map((dep) => {
            const config = statusConfig[dep.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isDeployed = dep.status === 'deployed';
            const isChecked = selected.has(dep.id);
            return (
              <div key={dep.id} className={cn("bg-card rounded-xl border p-5 hover:border-primary/20 transition-all", isChecked ? "border-destructive/40" : "border-border")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {isDeployed ? (
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleOne(dep.id)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="w-4 mt-1" />
                    )}
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <Rocket className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{dep.name}</h3>
                        <Badge variant="outline" className={cn("text-[10px] gap-1 border", config.color)}>
                          <StatusIcon className={cn("w-3 h-3", config.spin && "animate-spin")} />
                          {dep.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{dep.region}</span>
                        <span>•</span>
                        <span className="font-mono">{dep.vpc_cidr}</span>
                        <span>•</span>
                        <span>{dep.instance_type}</span>
                        <span>•</span>
                        <span>{moment(dep.created_date).fromNow()}</span>
                      </div>
                      {dep.kali_public_ip && (
                        <div className="mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Kali IP: </span>
                          <span className="text-xs font-mono text-primary">{dep.kali_public_ip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  {dep.status === 'deployed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleResourceGraph(dep.id)}
                      className={cn("gap-1 text-xs", expandedResources.has(dep.id) ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Resources
                      <ChevronDown className={cn("w-3 h-3 transition-transform", expandedResources.has(dep.id) && "rotate-180")} />
                    </Button>
                  )}
                  {dep.status === 'deployed' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={destroyDeployment.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Destroy
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Destroy "{dep.name}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will simulate <span className="font-mono font-semibold">terraform destroy</span> and mark all 18 AWS resources as destroyed. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => destroyDeployment.mutate(dep.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Yes, Destroy Lab
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              {expandedResources.has(dep.id) && (
                <ResourceUsageGraphs deployment={dep} />
              )}
            </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}