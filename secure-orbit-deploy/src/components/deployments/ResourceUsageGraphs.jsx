import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, MemoryStick, Activity } from 'lucide-react';

// Simulate realistic per-instance resource data
function generateDataPoint(prev) {
  const bump = (val, min, max, drift = 8) => {
    const next = val + (Math.random() - 0.5) * drift;
    return Math.min(max, Math.max(min, next));
  };
  return prev.map(inst => ({
    ...inst,
    cpu: bump(inst.cpu, 5, 95),
    mem: bump(inst.mem, 20, 90, 4),
  }));
}

const INSTANCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

const INSTANCES_META = [
  { name: 'Kali Linux',      cpuBase: 35, memBase: 45 },
  { name: 'Metasploitable',  cpuBase: 20, memBase: 55 },
  { name: 'Windows DC',      cpuBase: 40, memBase: 70 },
  { name: 'Juice Shop',      cpuBase: 25, memBase: 40 },
];

const MAX_POINTS = 20;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold text-foreground">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function ResourceUsageGraphs({ deployment }) {
  const [history, setHistory] = useState(() => {
    // Seed with 10 points of initial history
    let current = INSTANCES_META.map(inst => ({
      name: inst.name,
      cpu: inst.cpuBase + (Math.random() - 0.5) * 10,
      mem: inst.memBase + (Math.random() - 0.5) * 10,
    }));
    const points = [];
    for (let i = 0; i < 10; i++) {
      current = generateDataPoint(current);
      points.push({ t: i, ...Object.fromEntries(current.map(d => [`cpu_${d.name}`, d.cpu])), ...Object.fromEntries(current.map(d => [`mem_${d.name}`, d.mem])) });
    }
    return points;
  });

  const tickRef = useRef(10);

  useEffect(() => {
    if (deployment.status !== 'deployed') return;
    const id = setInterval(() => {
      tickRef.current += 1;
      setHistory(prev => {
        const lastPoint = prev[prev.length - 1];
        const lastValues = INSTANCES_META.map(inst => ({
          name: inst.name,
          cpu: lastPoint[`cpu_${inst.name}`] ?? inst.cpuBase,
          mem: lastPoint[`mem_${inst.name}`] ?? inst.memBase,
        }));
        const next = generateDataPoint(lastValues);
        const newPoint = {
          t: tickRef.current,
          label: `${tickRef.current}s`,
          ...Object.fromEntries(next.map(d => [`cpu_${d.name}`, d.cpu])),
          ...Object.fromEntries(next.map(d => [`mem_${d.name}`, d.mem])),
        };
        const updated = [...prev, newPoint];
        return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [deployment.status]);

  if (deployment.status !== 'deployed') return null;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CPU Chart */}
      <div className="bg-muted/20 rounded-lg border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPU Usage</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
            <Activity className="w-3 h-3" /> Live
          </span>
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {INSTANCES_META.map((inst, i) => (
                <linearGradient key={inst.name} id={`cpuGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INSTANCE_COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={INSTANCE_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            {INSTANCES_META.map((inst, i) => (
              <Area
                key={inst.name}
                type="monotone"
                dataKey={`cpu_${inst.name}`}
                name={inst.name}
                stroke={INSTANCE_COLORS[i]}
                strokeWidth={1.5}
                fill={`url(#cpuGrad${i})`}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {INSTANCES_META.map((inst, i) => (
            <span key={inst.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: INSTANCE_COLORS[i] }} />
              {inst.name}
            </span>
          ))}
        </div>
      </div>

      {/* Memory Chart */}
      <div className="bg-muted/20 rounded-lg border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MemoryStick className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Memory Usage</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
            <Activity className="w-3 h-3" /> Live
          </span>
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {INSTANCES_META.map((inst, i) => (
                <linearGradient key={inst.name} id={`memGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INSTANCE_COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={INSTANCE_COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            {INSTANCES_META.map((inst, i) => (
              <Area
                key={inst.name}
                type="monotone"
                dataKey={`mem_${inst.name}`}
                name={inst.name}
                stroke={INSTANCE_COLORS[i]}
                strokeWidth={1.5}
                fill={`url(#memGrad${i})`}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {INSTANCES_META.map((inst, i) => (
            <span key={inst.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: INSTANCE_COLORS[i] }} />
              {inst.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}