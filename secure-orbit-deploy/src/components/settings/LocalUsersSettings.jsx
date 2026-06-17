import React, { useState } from 'react';
import { Users, Plus, Trash2, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INITIAL_USERS = [
  { id: 1, username: 'admin', role: 'admin', email: 'admin@lab.local' },
  { id: 2, username: 'operator', role: 'user', email: 'operator@lab.local' },
];

export default function LocalUsersSettings() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [showForm, setShowForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });

  const togglePw = (id) => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const addUser = () => {
    if (!form.username || !form.email || !form.password) {
      toast.error('Username, email and password are required');
      return;
    }
    setUsers(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ username: '', email: '', password: '', role: 'user' });
    setShowForm(false);
    toast.success(`User "${form.username}" created`);
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success('User removed');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Local User Accounts</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
          <h3 className="text-sm font-semibold">New Local User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username *</span>
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="jdoe" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email *</span>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jdoe@lab.local" className="text-foreground" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password *</span>
              <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} type="text" placeholder="Strong password" className="text-foreground font-mono" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="readonly">Read Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="border-border text-foreground hover:bg-muted">Cancel</Button>
            <Button size="sm" onClick={addUser}>Create User</Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-foreground">{u.username}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    u.role === 'admin' ? 'bg-primary/10 text-primary' :
                    u.role === 'readonly' ? 'bg-muted text-muted-foreground' :
                    'bg-emerald-500/10 text-emerald-400'
                  )}>
                    {u.role === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteUser(u.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}