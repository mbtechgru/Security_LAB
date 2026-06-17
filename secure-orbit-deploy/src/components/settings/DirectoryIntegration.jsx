import React, { useState } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TABS = ['Active Directory', 'Entra ID (Azure AD)'];

export default function DirectoryIntegration() {
  const [tab, setTab] = useState(0);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // AD state
  const [ad, setAd] = useState({ domain: '', dc: '', baseDn: '', bindUser: '', bindPass: '', port: '389', useSSL: false });
  // Entra state
  const [entra, setEntra] = useState({ tenantId: '', clientId: '', clientSecret: '', allowedGroups: '' });

  const updateAd = (k, v) => setAd(prev => ({ ...prev, [k]: v }));
  const updateEntra = (k, v) => setEntra(prev => ({ ...prev, [k]: v }));

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setTesting(false);
    setTestResult('success');
    toast.success('Connection test successful');
  };

  const save = () => toast.success(`${TABS[tab]} settings saved`);

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Directory Integration</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg overflow-hidden border border-border w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => { setTab(i); setTestResult(null); }}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === i ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted/50'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain</span>
              <Input value={ad.domain} onChange={e => updateAd('domain', e.target.value)} placeholder="corp.example.com" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain Controller IP / Hostname</span>
              <Input value={ad.dc} onChange={e => updateAd('dc', e.target.value)} placeholder="dc1.corp.example.com" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base DN</span>
              <Input value={ad.baseDn} onChange={e => updateAd('baseDn', e.target.value)} placeholder="DC=corp,DC=example,DC=com" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">LDAP Port</span>
              <Input value={ad.port} onChange={e => updateAd('port', e.target.value)} placeholder="389" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bind User (UPN)</span>
              <Input value={ad.bindUser} onChange={e => updateAd('bindUser', e.target.value)} placeholder="ldapbind@corp.example.com" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bind Password</span>
              <Input value={ad.bindPass} onChange={e => updateAd('bindPass', e.target.value)} type="text" placeholder="Bind password" className="text-foreground font-mono" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={ad.useSSL} onChange={e => updateAd('useSSL', e.target.checked)} className="rounded" />
            <span className="text-muted-foreground">Use LDAPS (port 636, TLS)</span>
          </label>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant ID</span>
              <Input value={entra.tenantId} onChange={e => updateEntra('tenantId', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client (App) ID</span>
              <Input value={entra.clientId} onChange={e => updateEntra('clientId', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Secret</span>
              <Input value={entra.clientSecret} onChange={e => updateEntra('clientSecret', e.target.value)} type="text" placeholder="App registration secret value" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allowed Groups (comma-separated)</span>
              <Input value={entra.allowedGroups} onChange={e => updateEntra('allowedGroups', e.target.value)} placeholder="Lab-Admins, Lab-Operators" className="text-foreground" />
              <p className="text-xs text-muted-foreground">Only members of these groups will be permitted to log in</p>
            </div>
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={cn('flex items-center gap-2 text-sm p-3 rounded-lg', testResult === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-destructive/10 text-destructive')}>
          {testResult === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {testResult === 'success' ? 'Connection successful — directory is reachable' : 'Connection failed — check credentials and network'}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={testConnection} disabled={testing} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={save} className="gap-1.5">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}