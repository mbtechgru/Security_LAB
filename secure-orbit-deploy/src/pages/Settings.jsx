import React, { useState } from 'react';
import { Settings as SettingsIcon, Clock, Globe, Users, Building2, ShieldCheck, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import NtpSettings from '@/components/settings/NtpSettings';
import DnsSettings from '@/components/settings/DnsSettings';
import LocalUsersSettings from '@/components/settings/LocalUsersSettings';
import DirectoryIntegration from '@/components/settings/DirectoryIntegration';
import SamlMfaSettings from '@/components/settings/SamlMfaSettings';
import SmtpSettings from '@/components/settings/SmtpSettings';

const SECTIONS = [
  { id: 'ntp',       label: 'NTP',              icon: Clock,        component: NtpSettings,        desc: 'Time synchronization servers' },
  { id: 'dns',       label: 'DNS',              icon: Globe,        component: DnsSettings,        desc: 'Name resolution configuration' },
  { id: 'users',     label: 'Local Users',      icon: Users,        component: LocalUsersSettings, desc: 'Manage local system accounts' },
  { id: 'directory', label: 'AD / Entra ID',    icon: Building2,    component: DirectoryIntegration, desc: 'Active Directory & Azure AD integration' },
  { id: 'saml',      label: 'SAML & MFA',       icon: ShieldCheck,  component: SamlMfaSettings,    desc: 'Single Sign-On and multi-factor authentication' },
  { id: 'smtp',      label: 'Alert Email',      icon: Mail,         component: SmtpSettings,       desc: 'SMTP server & alert recipients' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('ntp');
  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          System Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure network, authentication, and user management</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border last:border-0 transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50 text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className={cn('text-sm font-medium', active ? 'text-primary' : '')}>{section.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{section.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}