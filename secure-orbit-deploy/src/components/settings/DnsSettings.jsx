import React, { useState } from 'react';
import { Globe, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DnsSettings() {
  const [primaryDns, setPrimaryDns] = useState('8.8.8.8');
  const [secondaryDns, setSecondaryDns] = useState('8.8.4.4');
  const [searchDomains, setSearchDomains] = useState(['lab.local']);
  const [newDomain, setNewDomain] = useState('');

  const addDomain = () => {
    const d = newDomain.trim();
    if (!d || searchDomains.includes(d)) return;
    setSearchDomains(prev => [...prev, d]);
    setNewDomain('');
  };

  const save = () => toast.success('DNS settings saved');

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">DNS Configuration</h2>
      </div>

      {/* Resolvers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary DNS</span>
          <Input value={primaryDns} onChange={e => setPrimaryDns(e.target.value)} className="text-foreground font-mono" placeholder="8.8.8.8" />
        </div>
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secondary DNS</span>
          <Input value={secondaryDns} onChange={e => setSecondaryDns(e.target.value)} className="text-foreground font-mono" placeholder="8.8.4.4" />
        </div>
      </div>

      {/* Search Domains */}
      <div className="space-y-3">
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Domains</span>
        <div className="space-y-2">
          {searchDomains.map(d => (
            <div key={d} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
              <span className="flex-1 text-sm font-mono text-foreground">{d}</span>
              <button onClick={() => setSearchDomains(prev => prev.filter(x => x !== d))} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="corp.example.com"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addDomain()}
            className="text-foreground font-mono"
          />
          <Button variant="outline" onClick={addDomain} className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={save} className="gap-1.5">
          <Save className="w-4 h-4" /> Save DNS Settings
        </Button>
      </div>
    </div>
  );
}