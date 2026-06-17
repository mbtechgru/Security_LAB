import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { X, Download, FileBarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReportViewer({ report, onClose }) {
  if (!report) return null;

  const totalFindings = (report.critical_count || 0) + (report.high_count || 0) + (report.medium_count || 0) + (report.low_count || 0);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileBarChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{report.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{report.type?.replace(/_/g, ' ')}</Badge>
                {totalFindings > 0 && <span className="text-xs text-muted-foreground">{totalFindings} findings</span>}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Severity Summary */}
        {totalFindings > 0 && (
          <div className="flex gap-3 px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-xs font-medium text-destructive">{report.critical_count || 0} Critical</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-500">{report.high_count || 0} High</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">{report.medium_count || 0} Medium</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{report.low_count || 0} Low</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{report.content || 'No content available.'}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}