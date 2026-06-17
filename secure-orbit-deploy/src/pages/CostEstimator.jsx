import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Server, Database, Shield, HardDrive, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';

// On-demand hourly pricing (USD) per region multiplier × base instance price
// Source: approximate AWS public pricing as of 2024
const INSTANCE_BASE_PRICE = {
  't2.micro':  0.0116,
  't2.small':  0.0232,
  't2.medium': 0.0464,
  't3.micro':  0.0104,
  't3.small':  0.0208,
};

const REGION_MULTIPLIER = {
  'us-east-1':      1.00,
  'us-east-2':      1.00,
  'us-west-1':      1.14,
  'us-west-2':      1.00,
  'eu-west-1':      1.10,
  'eu-central-1':   1.12,
  'ap-southeast-1': 1.18,
  'ap-northeast-1': 1.20,
};

const REGION_LABELS = {
  'us-east-1':      'US East (N. Virginia)',
  'us-east-2':      'US East (Ohio)',
  'us-west-1':      'US West (N. California)',
  'us-west-2':      'US West (Oregon)',
  'eu-west-1':      'EU (Ireland)',
  'eu-central-1':   'EU (Frankfurt)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
};

// Fixed monthly estimates for other resources
const OTHER_COSTS = {
  eip:        3.60,   // 1 Elastic IP (attached to Kali)
  s3:         0.50,   // ~20 GB S3 storage + requests
  dataTransfer: 1.00, // minimal egress
  iam:        0.00,   // free
};

const INSTANCES = [
  { key: 'kali',           label: 'Kali Linux',      role: 'Attacker',  subnet: 'Public',   icon: Shield },
  { key: 'metasploitable', label: 'Metasploitable 2', role: 'Victim',    subnet: 'Private',  icon: Server },
  { key: 'windows_dc',     label: 'Windows DC',       role: 'Victim',    subnet: 'Private',  icon: Database },
  { key: 'juice_shop',     label: 'Juice Shop',       role: 'Services',  subnet: 'Private',  icon: HardDrive },
];

const HOURS_PER_MONTH = 730;

const CHART_COLORS = [
  'hsl(210, 100%, 52%)',
  'hsl(172, 66%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(215, 16%, 47%)',
];

function fmt(n) {
  return n.toFixed(2);
}

const TrendTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
            {p.name}: ${p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CostEstimator() {
  const [region, setRegion] = useState('us-east-1');
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [hoursPerDay, setHoursPerDay] = useState('24');

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date', 10),
  });

  const activeDeployments = deployments.filter(d => d.status === 'deployed');

  const estimate = useMemo(() => {
    const mult = REGION_MULTIPLIER[region] || 1.0;
    const baseHourly = INSTANCE_BASE_PRICE[instanceType] || 0.0116;
    const hoursMonth = Math.min(parseFloat(hoursPerDay) || 24, 24) * 30;
    const instanceCost = baseHourly * mult * hoursMonth;
    const instances = INSTANCES.map(inst => ({
      ...inst,
      hourly: baseHourly * mult,
      monthly: instanceCost,
    }));
    const instanceTotal = instanceCost * INSTANCES.length;
    const otherTotal = Object.values(OTHER_COSTS).reduce((s, v) => s + v, 0);
    const total = instanceTotal + otherTotal;

    const breakdown = [
      ...instances.map(i => ({ name: i.label, value: parseFloat(fmt(i.monthly)) })),
      { name: 'Elastic IP', value: OTHER_COSTS.eip },
      { name: 'S3 Storage', value: OTHER_COSTS.s3 },
      { name: 'Data Transfer', value: OTHER_COSTS.dataTransfer },
    ];

    // 6-month trend: slight data transfer & S3 growth each month
    const months = ['Now', 'Mo 2', 'Mo 3', 'Mo 4', 'Mo 5', 'Mo 6'];
    const trend = months.map((m, i) => ({
      month: m,
      ec2: parseFloat(fmt(instanceTotal)),
      other: parseFloat(fmt(otherTotal + i * 0.15)), // gradual egress/storage growth
      total: parseFloat(fmt(total + i * 0.15)),
    }));

    return { instances, instanceTotal, otherTotal, total, breakdown, trend };
  }, [region, instanceType, hoursPerDay]);

  const ChartTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs font-medium">{payload[0].payload.name}</p>
          <p className="text-sm font-bold font-mono text-primary">${payload[0].value}/mo</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Cost Estimator</h1>
        <p className="text-sm text-muted-foreground mt-1">Predict monthly AWS costs for your pentesting lab configuration</p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>AWS Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REGION_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {REGION_MULTIPLIER[region] > 1 && (
              <p className="text-[11px] text-amber-400 font-mono">+{Math.round((REGION_MULTIPLIER[region] - 1) * 100)}% regional premium</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Instance Type (all 4 instances)</Label>
            <Select value={instanceType} onValueChange={setInstanceType}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INSTANCE_BASE_PRICE).map(([t, p]) => (
                  <SelectItem key={t} value={t}>
                    {t} — ${fmt(p)}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hours Running Per Day</Label>
            <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
              <SelectTrigger className="text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 hrs/day (part-time)</SelectItem>
                <SelectItem value="8">8 hrs/day (work hours)</SelectItem>
                <SelectItem value="12">12 hrs/day (half-day)</SelectItem>
                <SelectItem value="24">24 hrs/day (always-on)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-primary/20 p-5 glow-blue">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Monthly</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold font-mono text-primary">${fmt(estimate.total)}</p>
          <p className="text-xs text-muted-foreground mt-1">≈ ${fmt(estimate.total / 30)}/day</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">EC2 Instances</span>
            <Server className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-bold font-mono text-foreground">${fmt(estimate.instanceTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">4 × {instanceType} × {hoursPerDay}h/day</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Other Resources</span>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold font-mono text-foreground">${fmt(estimate.otherTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">EIP, S3, data transfer</p>
        </div>
      </div>

      {/* 6-Month Spending Trend */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">6-Month Spending Trend</h3>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-primary" /><span>EC2</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-accent" /><span>Other</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-amber-400" /><span>Total</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={estimate.trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 40%, 16%)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={48} />
            <Tooltip content={<TrendTooltip />} />
            <Line type="monotone" dataKey="ec2" name="EC2" stroke="hsl(210, 100%, 52%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(210, 100%, 52%)' }} />
            <Line type="monotone" dataKey="other" name="Other" stroke="hsl(172, 66%, 50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(172, 66%, 50%)' }} />
            <Line type="monotone" dataKey="total" name="Total" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 3, fill: 'hsl(38, 92%, 50%)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={estimate.breakdown} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {estimate.breakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Instance table */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Per-Instance Estimate</h3>
          <div className="space-y-3">
            {estimate.instances.map((inst) => {
              const Icon = inst.icon;
              return (
                <div key={inst.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inst.label}</p>
                      <p className="text-[11px] text-muted-foreground">{inst.role} · {inst.subnet} subnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">${fmt(inst.monthly)}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">${fmt(inst.hourly)}/hr</p>
                  </div>
                </div>
              );
            })}
            {/* Other resources */}
            {[
              { label: 'Elastic IP', sub: '1 attached EIP', cost: OTHER_COSTS.eip },
              { label: 'S3 Bucket',  sub: '~20 GB storage', cost: OTHER_COSTS.s3 },
              { label: 'Data Transfer', sub: 'Egress estimate', cost: OTHER_COSTS.dataTransfer },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground">{row.sub}</p>
                </div>
                <p className="text-sm font-mono font-semibold">${fmt(row.cost)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active deployments cost */}
      {activeDeployments.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Active Deployment Estimates</h3>
          <div className="space-y-3">
            {activeDeployments.map(dep => {
              const mult = REGION_MULTIPLIER[dep.region] || 1.0;
              const base = INSTANCE_BASE_PRICE[dep.instance_type] || INSTANCE_BASE_PRICE['t2.micro'];
              const monthly = base * mult * HOURS_PER_MONTH * 4 + estimate.otherTotal;
              return (
                <div key={dep.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-semibold">{dep.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{dep.region} · {dep.instance_type} · always-on</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-primary border-primary/30">
                    ~${fmt(monthly)}/mo
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 border border-border">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Estimates are based on approximate AWS on-demand pricing and may differ from actual bills. Does not include Reserved Instance discounts, Savings Plans, or Free Tier credits. Prices updated Q4 2024.</p>
      </div>
    </div>
  );
}