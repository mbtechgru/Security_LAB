import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers } from 'lucide-react';

const STATUS_COLORS = {
  deployed: '#10b981',
  applying: '#3b82f6',
  planning: '#8b5cf6',
  initializing: '#6366f1',
  pending: '#f59e0b',
  destroying: '#f97316',
  destroyed: '#6b7280',
  failed: '#ef4444'
};

const STATUS_LABELS = {
  deployed: 'Running',
  applying: 'Applying',
  planning: 'Planning',
  initializing: 'Initializing',
  pending: 'Pending',
  destroying: 'Destroying',
  destroyed: 'Destroyed',
  failed: 'Failed'
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <span className="text-muted-foreground">{name}: </span>
      <span className="font-mono font-semibold">{value}</span>
    </div>);

};

export default function DeploymentStatusChart({ deployments = [] }) {
  const counts = deployments.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#6b7280'
  }));

  const runningCount = counts['deployed'] || 0;
  const stoppedCount = (counts['destroyed'] || 0) + (counts['failed'] || 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deployment Status</h3>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-2xl font-bold font-mono text-emerald-500">{runningCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Running</p>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border p-3 text-center">
          <p className="text-2xl font-bold font-mono text-muted-foreground">{stoppedCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Stopped</p>
        </div>
      </div>

      {data.length === 0 ?
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
          <Layers className="w-8 h-8 mb-2" />
          <p className="text-xs">No deployments yet</p>
        </div> :

      <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value">
            
              {data.map((entry, i) =>
            <Cell key={i} fill={entry.color} stroke="transparent" />
            )}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) =>
            <span className="text-[10px] text-muted-foreground">{value}</span>
            } />
          
          </PieChart>
        </ResponsiveContainer>
      }
    </div>);

}