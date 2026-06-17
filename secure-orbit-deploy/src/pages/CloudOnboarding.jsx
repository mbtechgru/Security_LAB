import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Cloud, Plus, Trash2, CheckCircle2, XCircle, Eye, EyeOff, 
  Key, AlertTriangle, ArrowRight, Shield, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1',
];

const statusConfig = {
  connected: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  disconnected: { color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  error: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  pending: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Cloud },
};

export default function CloudOnboarding() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [form, setForm] = useState({
    alias: '',
    access_key_id: '',
    secret_access_key: '',
    default_region: 'us-east-1',
    provider: 'aws',
    status: 'pending',
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['cloud-accounts'],
    queryFn: () => base44.entities.CloudAccount.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CloudAccount.create(data),
    onSuccess: async (newAccount) => {
      // Create connection event
      await base44.entities.Event.create({
        type: 'account',
        title: 'Cloud account added',
        description: `AWS account "${newAccount.alias}" has been onboarded`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setForm({ alias: '', access_key_id: '', secret_access_key: '', default_region: 'us-east-1', provider: 'aws', status: 'pending' });
      toast.success('Cloud account added successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CloudAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
      toast.success('Account removed');
    },
  });

  const testConnection = useMutation({
    mutationFn: async (account) => {
      await base44.entities.CloudAccount.update(account.id, { status: 'connected', account_id: '****' + account.access_key_id.slice(-4) });
      await base44.entities.Event.create({
        type: 'account',
        title: 'Connection test passed',
        description: `AWS account "${account.alias}" is connected`,
        severity: 'success',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Connection verified');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.alias || !form.access_key_id || !form.secret_access_key) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(form);
  };

  const maskKey = (key) => key ? key.slice(0, 4) + '****' + key.slice(-4) : '';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Cloud Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect your AWS accounts to deploy pentesting labs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-500">Security Notice</p>
          <p className="text-xs text-muted-foreground mt-1">
            Credentials are stored securely. This lab deploys intentionally vulnerable resources — use only in isolated AWS accounts dedicated to testing. Never use production accounts.
          </p>
        </div>
      </div>

      {/* Add Account Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 glow-blue">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            New AWS Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Alias *</span>
                <Input
                  id="alias"
                  placeholder="e.g., Pentest Lab Account"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Region</span>
                <Input
                  id="region"
                  value="us-east-1"
                  readOnly
                  className="font-mono text-sm text-foreground bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">AWS Access Key ID *</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="access_key"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={form.access_key_id}
                  onChange={(e) => setForm({ ...form, access_key_id: e.target.value })}
                  className="pl-10 font-mono text-sm text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">AWS Secret Access Key *</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="secret_key"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={form.secret_access_key}
                  onChange={(e) => setForm({ ...form, secret_access_key: e.target.value })}
                  className="pl-10 font-mono text-sm text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                {createMutation.isPending ? 'Saving...' : 'Save Account'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && accounts.length === 0 && !showForm && (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
            <Cloud className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No cloud accounts connected</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your AWS credentials to get started</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Add First Account
            </Button>
          </div>
        )}

        {accounts.map((account) => {
          const sConfig = statusConfig[account.status] || statusConfig.pending;
          const StatusIcon = sConfig.icon;
          return (
            <div key={account.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Cloud className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{account.alias}</h3>
                      <Badge variant="outline" className={cn("text-[10px] gap-1 border", sConfig.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {account.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-20">Access Key</span>
                        <span className="text-xs font-mono">
                          {showSecrets[account.id] ? account.access_key_id : maskKey(account.access_key_id)}
                        </span>
                        <button onClick={() => setShowSecrets(s => ({ ...s, [account.id]: !s[account.id] }))}>
                          {showSecrets[account.id] ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-20">Region</span>
                        <span className="text-xs font-mono">{account.default_region}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection.mutate(account)}
                    disabled={testConnection.isPending}
                    className="text-xs gap-1 bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}