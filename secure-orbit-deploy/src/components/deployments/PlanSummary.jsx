import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Network, HardDrive, Shield, Globe, Key, Box, CheckCircle2 } from 'lucide-react';

const resourceIcons = {
  'aws_vpc': Network,
  'aws_subnet': Network,
  'aws_internet_gateway': Globe,
  'aws_security_group': Shield,
  'aws_instance': Server,
  'aws_iam_role': Key,
  'aws_s3_bucket': HardDrive,
  'aws_route_table': Network,
  'aws_nat_gateway': Network,
  'aws_eip': Globe,
  'default': Box,
};

const resourceCategories = {
  'aws_vpc': 'Network',
  'aws_subnet': 'Network',
  'aws_internet_gateway': 'Network',
  'aws_route_table': 'Network',
  'aws_nat_gateway': 'Network',
  'aws_eip': 'Network',
  'aws_security_group': 'Security',
  'aws_instance': 'Compute',
  'aws_iam_role': 'IAM',
  'aws_s3_bucket': 'Storage',
};

export default function PlanSummary({ planOutput }) {
  if (!planOutput) return null;

  // Parse resource counts from plan output
  const resourceTypes = {};

  // Count resources by type from the plan output
  const lines = planOutput.split('\n');
  lines.forEach(line => {
    if (line.includes('# aws_')) {
      const match = line.match(/# (aws_\w+)\./);
      if (match) {
        const resourceType = match[1];
        resourceTypes[resourceType] = (resourceTypes[resourceType] || 0) + 1;
      }
    }
  });

  // Group by category
  const grouped = {};
  Object.entries(resourceTypes).forEach(([type, count]) => {
    const category = resourceCategories[type] || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ type, count, icon: resourceIcons[type] || resourceIcons.default });
  });

  const totalToAdd = Object.values(resourceTypes).reduce((sum, count) => sum + count, 0);
  const changeMatch = planOutput.match(/Plan:\s*\d+\s*to add,\s*(\d+)\s*to change,\s*(\d+)\s*to destroy/);
  const totalToChange = changeMatch ? Number(changeMatch[1]) : 0;
  const totalToDestroy = changeMatch ? Number(changeMatch[2]) : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Terraform Plan Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Count Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-500">Plan Ready</p>
              <p className="text-xs text-muted-foreground">{totalToAdd} resources to add, {totalToChange} to change, {totalToDestroy} to destroy</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
            Safe to Apply
          </Badge>
        </div>

        {/* Resource Breakdown by Category */}
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, resources]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {resources.map(({ type, count, icon: Icon }) => (
                  <div
                    key={type}
                    className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 border border-border/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-mono text-foreground">{type}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalToAdd}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Add</p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-lg font-bold text-foreground">{totalToChange}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Change</p>
          </div>
          <div className="text-center border-l border-border">
            <p className="text-lg font-bold text-foreground">{totalToDestroy}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Destroy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}