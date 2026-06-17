import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useDeploymentAlerts } from '@/hooks/useDeploymentAlerts';
import { Server, Cloud, Shield, Activity, Layers, Database, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusWidget from '../components/dashboard/StatusWidget';
import DeploymentStatus from '../components/dashboard/DeploymentStatus';
import EventTimeline from '../components/dashboard/EventTimeline';
import ResourceChart from '../components/dashboard/ResourceChart';
import NetworkTopology from '../components/dashboard/NetworkTopology';
import RegionMap from '../components/dashboard/RegionMap';
import InstancesTable from '../components/dashboard/InstancesTable';
import DeploymentStatusChart from '../components/dashboard/DeploymentStatusChart';
import DeploymentBadgeList from '../components/dashboard/DeploymentBadgeList';


export default function Dashboard() {
  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date', 50),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date', 20),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['cloud-accounts'],
    queryFn: () => base44.entities.CloudAccount.list(),
  });

  useDeploymentAlerts();

  const [dismissedIds, setDismissedIds] = useState(new Set());
  const failedDeployments = deployments.filter(
    d => d.status === 'failed' && !dismissedIds.has(d.id)
  );

  const latestDeployment = deployments[0];
  const deployedCount = deployments.filter(d => d.status === 'deployed').length;
  const connectedAccounts = accounts.filter(a => a.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your pentesting lab infrastructure</p>
      </div>

      {/* Failed deployment alerts */}
      {failedDeployments.length > 0 && (
        <div className="space-y-2">
          {failedDeployments.map(dep => (
            <div
              key={dep.id}
              className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
            >
              <div className="p-1.5 rounded-md bg-destructive/20 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-destructive">Deployment Failed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono font-medium text-foreground">{dep.name}</span>
                  {' '}in <span className="font-mono">{dep.region}</span> has entered a{' '}
                  <span className="font-semibold text-destructive">FAILED</span> state.
                  Check the deployment log for details.
                </p>
              </div>
              <button
                onClick={() => setDismissedIds(prev => new Set([...prev, dep.id]))}
                className="text-muted-foreground/50 hover:text-muted-foreground shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusWidget title="Total Deployments" value={deployments.length} icon={Layers} color="primary" subtitle="All time" />
        <StatusWidget title="Active Labs" value={deployedCount} icon={Server} color="success" trend={deployedCount > 0 ? 100 : 0} />
        <StatusWidget title="Cloud Accounts" value={connectedAccounts} icon={Cloud} color="accent" subtitle="Connected" />
        <StatusWidget title="Security Events" value={events.filter(e => e.type === 'security').length} icon={Shield} color="destructive" />
      </div>

      {/* Deployment Badge Overview */}
      <DeploymentBadgeList deployments={deployments} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DeploymentStatus deployment={latestDeployment} />
            <ResourceChart />
            <DeploymentStatusChart deployments={deployments} />
          </div>
          <NetworkTopology deployment={latestDeployment} />
          <InstancesTable />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <RegionMap region={latestDeployment?.region || 'us-east-1'} />
          <EventTimeline events={events} />
        </div>
      </div>
    </div>
  );
}