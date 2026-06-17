import React, { useState } from 'react';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DEFAULT_SERVERS = ['pool.ntp.org', 'time.windows.com'];

export default function NtpSettings() {
  const [servers, setServers] = useState(DEFAULT_SERVERS);
  const [newServer, setNewServer] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  const addServer = () => {
    const s = newServer.trim();
    if (!s || servers.includes(s)) return;
    setServers(prev => [...prev, s]);
    setNewServer('');
  };

  const remove = (srv) => setServers(prev => prev.filter(x => x !== srv));

  const save = () => toast.success('NTP settings saved');

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">NTP Configuration</h2>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Timezone</span>
        <Input
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          placeholder="UTC"
          className="text-foreground font-mono max-w-xs"
        />
        <p className="text-xs text-muted-foreground">IANA timezone identifier (e.g. America/New_York)</p>
      </div>

      {/* NTP Servers */}
      <div className="space-y-3">
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">NTP Servers</span>
        <div className="space-y-2">
          {servers.map(srv => (
            <div key={srv} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              <span className="flex-1 text-sm font-mono text-foreground">{srv}</span>
              <button onClick={() => remove(srv)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="ntp.example.com"
            value={newServer}
            onChange={e => setNewServer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addServer()}
            className="text-foreground font-mono"
          />
          <Button variant="outline" onClick={addServer} className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={save} className="gap-1.5">
          <Save className="w-4 h-4" /> Save NTP Settings
        </Button>
      </div>
    </div>
  );
}