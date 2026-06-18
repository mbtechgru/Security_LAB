import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'hsl(210, 100%, 52%)',
  'hsl(172, 66%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
];

const data = [
  { name: 'EC2 Instances', value: 4 },
  { name: 'Security Groups', value: 3 },
  { name: 'Subnets', value: 3 },
  { name: 'S3 Buckets', value: 1 },
  { name: 'IAM Roles', value: 1 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    return (
      <div style={{ background: 'hsl(222,47%,9%)', border: '1px solid hsl(222,40%,16%)' }} className="rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium" style={{ color: 'hsl(210,20%,95%)' }}>{payload[0].name}</p>
        <p className="text-sm font-bold font-mono" style={{ color: payload[0].payload?.fill || '#fff' }}>{payload[0].value} resources</p>
      </div>
    );
  }
  return null;
};

export default function ResourceChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Resource Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
            <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
            <span className="text-[11px] font-mono font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}