import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ShieldAlert } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';

const typeLabels = {
  security_audit: 'Security Audit',
  resource_inventory: 'Resource Inventory',
  deployment_summary: 'Deployment Summary',
  vulnerability_scan: 'Vulnerability Scan',
  compliance: 'Compliance',
};

export default function ReportSummaryTable({ reports, deployments, onView }) {
  const completed = reports.filter(r => r.status === 'completed');
  if (completed.length === 0) return null;

  // Build a lookup: deploymentId → deployment name
  const deploymentMap = Object.fromEntries(
    (deployments || []).map(d => [d.id, d.name])
  );

  // Group reports by deployment_id (null = unlinked)
  const groups = completed.reduce((acc, r) => {
    const key = r.deployment_id || '__unlinked__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <ShieldAlert className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-semibold">Risk Summary by Deployment</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-5 py-3">Deployment</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">Report</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">Type</th>
              <th className="text-center text-[10px] uppercase tracking-wider text-destructive font-medium px-4 py-3">Critical</th>
              <th className="text-center text-[10px] uppercase tracking-wider text-amber-500 font-medium px-4 py-3">High</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(groups).map(([depId, depReports]) => {
              const depName = depId === '__unlinked__'
                ? 'Unlinked'
                : (deploymentMap[depId] || `Deployment ${depId.slice(0, 6)}…`);

              // Totals row data
              const totalCritical = depReports.reduce((s, r) => s + (r.critical_count || 0), 0);
              const totalHigh = depReports.reduce((s, r) => s + (r.high_count || 0), 0);

              return depReports.map((report, idx) => (
                <tr
                  key={report.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  {/* Deployment cell — only on first row of group */}
                  {idx === 0 ? (
                    <td
                      rowSpan={depReports.length}
                      className="px-5 py-3 align-top"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-xs">{depName}</span>
                        {(totalCritical > 0 || totalHigh > 0) && (
                          <div className="flex gap-1.5">
                            {totalCritical > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                                {totalCritical}C
                              </span>
                            )}
                            {totalHigh > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {totalHigh}H
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  ) : null}

                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground/90">{report.title}</span>
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                      {typeLabels[report.type] || report.type}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {report.critical_count > 0 ? (
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono",
                        "bg-destructive/15 text-destructive"
                      )}>
                        {report.critical_count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {report.high_count > 0 ? (
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono",
                        "bg-amber-500/15 text-amber-500"
                      )}>
                        {report.high_count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{moment(report.created_date).fromNow()}</span>
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs h-7 px-2"
                      onClick={() => onView(report)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}