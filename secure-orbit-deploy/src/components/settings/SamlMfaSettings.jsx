import React, { useState } from 'react';
import { ShieldCheck, Save, Upload, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MFA_METHODS = [
  { id: 'totp',  label: 'TOTP (Authenticator App)', desc: 'Google Authenticator, Authy, etc.' },
  { id: 'email', label: 'Email OTP',                desc: 'One-time code sent to user email' },
  { id: 'sms',   label: 'SMS OTP',                  desc: 'One-time code via SMS (requires gateway)' },
  { id: 'push',  label: 'Push Notification',        desc: 'Approve via mobile push (requires IdP support)' },
];

const SP_ENTITY_ID = 'https://your-lab.example.com/saml/sp';
const SP_ACS_URL   = 'https://your-lab.example.com/saml/acs';

export default function SamlMfaSettings() {
  const [samlEnabled, setSamlEnabled] = useState(false);
  const [mfaEnabled, setMfaEnabled]   = useState(false);
  const [enabledMfa, setEnabledMfa]   = useState(['totp']);
  const [saml, setSaml] = useState({ idpEntityId: '', idpSsoUrl: '', idpCert: '', nameIdFormat: 'emailAddress', signRequests: true });

  const updateSaml = (k, v) => setSaml(prev => ({ ...prev, [k]: v }));

  const toggleMfa = (id) => {
    setEnabledMfa(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const save = () => toast.success('SAML & MFA settings saved');

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">SAML & Multi-Factor Authentication</h2>
      </div>

      {/* SAML Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">SAML 2.0 Single Sign-On</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Delegate authentication to your Identity Provider</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">{samlEnabled ? 'Enabled' : 'Disabled'}</span>
            <div
              onClick={() => setSamlEnabled(!samlEnabled)}
              className={cn('relative w-10 h-6 rounded-full transition-colors cursor-pointer', samlEnabled ? 'bg-primary' : 'bg-muted')}
            >
              <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', samlEnabled ? 'translate-x-5' : 'translate-x-1')} />
            </div>
          </label>
        </div>

        {samlEnabled && (
          <div className="space-y-5 pl-0">
            {/* SP Metadata (read-only) */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Your Service Provider (SP) Metadata</p>
              <div className="grid grid-cols-1 gap-2">
                {[['SP Entity ID', SP_ENTITY_ID], ['ACS URL', SP_ACS_URL]].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                    <code className="flex-1 text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded truncate">{val}</code>
                    <button onClick={() => copyToClipboard(val)} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* IdP Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">IdP Entity ID</span>
                <Input value={saml.idpEntityId} onChange={e => updateSaml('idpEntityId', e.target.value)} placeholder="https://idp.example.com/entity" className="text-foreground font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">IdP SSO URL</span>
                <Input value={saml.idpSsoUrl} onChange={e => updateSaml('idpSsoUrl', e.target.value)} placeholder="https://idp.example.com/sso" className="text-foreground font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name ID Format</span>
                <select
                  value={saml.nameIdFormat}
                  onChange={e => updateSaml('nameIdFormat', e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
                >
                  <option value="emailAddress">Email Address</option>
                  <option value="persistent">Persistent</option>
                  <option value="transient">Transient</option>
                  <option value="unspecified">Unspecified</option>
                </select>
              </div>
              <div className="space-y-1 flex items-end pb-0.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={saml.signRequests} onChange={e => updateSaml('signRequests', e.target.checked)} className="rounded" />
                  <span className="text-muted-foreground">Sign AuthN Requests</span>
                </label>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">IdP X.509 Certificate (PEM)</span>
                <textarea
                  value={saml.idpCert}
                  onChange={e => updateSaml('idpCert', e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={5}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* MFA Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Multi-Factor Authentication (MFA)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Require a second factor on every login</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">{mfaEnabled ? 'Enforced' : 'Optional'}</span>
            <div
              onClick={() => setMfaEnabled(!mfaEnabled)}
              className={cn('relative w-10 h-6 rounded-full transition-colors cursor-pointer', mfaEnabled ? 'bg-primary' : 'bg-muted')}
            >
              <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', mfaEnabled ? 'translate-x-5' : 'translate-x-1')} />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MFA_METHODS.map(m => (
            <label key={m.id} className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              enabledMfa.includes(m.id) ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40'
            )}>
              <input
                type="checkbox"
                checked={enabledMfa.includes(m.id)}
                onChange={() => toggleMfa(m.id)}
                className="mt-0.5 rounded"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={save} className="gap-1.5">
          <Save className="w-4 h-4" /> Save Auth Settings
        </Button>
      </div>
    </div>
  );
}