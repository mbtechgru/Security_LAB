import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileBarChart, Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import moment from 'moment';

const typeLabels = {
  security_audit: 'Security Audit',
  resource_inventory: 'Resource Inventory',
  deployment_summary: 'Deployment Summary',
  vulnerability_scan: 'Vulnerability Scan',
  compliance: 'Compliance',
};

const statusIcons = {
  generating: { icon: Loader2, color: 'text-primary', spin: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  failed: { icon: XCircle, color: 'text-destructive' },
};

export default function ReportCard({ report, onView }) {
  const sConfig = statusIcons[report.status] || statusIcons.generating;
  const StatusIcon = sConfig.icon;
  const totalFindings = (report.critical_count || 0) + (report.high_count || 0) + (report.medium_count || 0) + (report.low_count || 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <FileBarChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{report.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px]">{typeLabels[report.type] || report.type}</Badge>
              <StatusIcon className={cn("w-3.5 h-3.5", sConfig.color, sConfig.spin && "animate-spin")} />
              <span className="text-xs text-muted-foreground">{moment(report.created_date).fromNow()}</span>
            </div>
            {report.status === 'completed' && totalFindings > 0 && (
              <div className="flex items-center gap-2 mt-2">
                {report.critical_count > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    {report.critical_count} Critical
                  </span>
                )}
                {report.high_count > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {report.high_count} High
                  </span>
                )}
                {report.medium_count > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {report.medium_count} Medium
                  </span>
                )}
                {report.low_count > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {report.low_count} Low
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {report.status === 'completed' && (
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onView(report)}>
            <Eye className="w-3.5 h-3.5" />
            View
          </Button>
        )}
      </div>
    </div>
  );
}