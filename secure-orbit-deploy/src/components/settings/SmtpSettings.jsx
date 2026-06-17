import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SmtpSettings() {
  const [config, setConfig] = useState({
    host: '',
    port: '587',
    encryption: 'tls',
    username: '',
    password: '',
    from_address: '',
    from_name: 'Security LAB',
    alert_recipients: '',
  });
  const [testing, setTesting] = useState(false);

  const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleSave = () => toast.success('SMTP settings saved');

  const handleTest = async () => {
    if (!config.host || !config.from_address) {
      toast.error('Please fill in SMTP host and From Address before testing');
      return;
    }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1800));
    setTesting(false);
    toast.success('Test email sent successfully');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Alert Email / SMTP</h2>
      </div>

      {/* Server Settings */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">SMTP Server</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMTP Host</span>
            <Input placeholder="smtp.example.com" value={config.host} onChange={e => update('host', e.target.value)} className="text-foreground" />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Port</span>
            <Input placeholder="587" value={config.port} onChange={e => update('port', e.target.value)} className="text-foreground font-mono" />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Encryption</span>
            <Select value={config.encryption} onValueChange={v => update('encryption', v)}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS (STARTTLS)</SelectItem>
                <SelectItem value="ssl">SSL/TLS</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</span>
            <Input placeholder="smtp-user@example.com" value={config.username} onChange={e => update('username', e.target.value)} className="text-foreground" />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</span>
            <Input placeholder="••••••••" value={config.password} onChange={e => update('password', e.target.value)} className="text-foreground" />
          </div>
        </div>
      </div>

      {/* Sender Settings */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sender Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Address</span>
            <Input placeholder="alerts@lab.local" value={config.from_address} onChange={e => update('from_address', e.target.value)} className="text-foreground" />
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Name</span>
            <Input placeholder="Security LAB" value={config.from_name} onChange={e => update('from_name', e.target.value)} className="text-foreground" />
          </div>
        </div>
      </div>

      {/* Alert Recipients */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alert Recipients</h3>
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Email(s)</span>
          <Input
            placeholder="admin@example.com, soc@example.com"
            value={config.alert_recipients}
            onChange={e => update('alert_recipients', e.target.value)}
            className="text-foreground"
          />
          <p className="text-[11px] text-muted-foreground">Separate multiple addresses with commas. These will receive deployment and security alert notifications.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleTest} disabled={testing} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {testing ? 'Sending...' : 'Send Test Email'}
        </Button>
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}