import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { Shield, Rocket, Cloud, AlertTriangle, CheckCircle2, Activity, Filter, RefreshCw } from 'lucide-react';
import moment from 'moment';

const typeConfig = {
  deployment: { icon: Rocket,       color: 'text-primary',      bg: 'bg-primary/10',     label: 'Deploy'   },
  security:   { icon: Shield,       color: 'text-destructive',  bg: 'bg-destructive/10', label: 'Security' },
  system:     { icon: Cloud,        color: 'text-accent',       bg: 'bg-accent/10',      label: 'System'   },
  account:    { icon: CheckCircle2, color: 'text-emerald-500',  bg: 'bg-emerald-500/10', label: 'Account'  },
  error:      { icon: AlertTriangle,color: 'text-amber-500',    bg: 'bg-amber-500/10',   label: 'Error'    },
};

const severityStyles = {
  info:     { badge: 'bg-primary/10 text-primary border-primary/20',         row: ''                                                },
  warning:  { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',   row: 'border-l-2 border-amber-500/50'                  },
  critical: { badge: 'bg-destructive/15 text-destructive border-destructive/30', row: 'border-l-2 border-destructive bg-destructive/5' },
  success:  { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', row: ''                                            },
};

const ALL = 'all';

export default function EventLog({ events: initialEvents = [] }) {
  const [events, setEvents] = useState(initialEvents);
  const [filterType, setFilterType] = useState(ALL);
  const [filterSeverity, setFilterSeverity] = useState(ALL);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  // Sync prop changes
  useEffect(() => { setEvents(initialEvents); }, [initialEvents]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.Event.subscribe((evt) => {
      if (evt.type === 'create') {
        setEvents(prev => [evt.data, ...prev].slice(0, 200));
      }
    });
    return unsub;
  }, []);

  const filtered = events.filter(e => {
    const typeMatch = filterType === ALL || e.type === filterType;
    const sevMatch  = filterSeverity === ALL || e.severity === filterSeverity;
    return typeMatch && sevMatch;
  });

  const criticalCount = events.filter(e => e.severity === 'critical').length;

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Event Log</h3>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 animate-pulse">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/50" />
          {/* Type filter */}
          <div className="flex gap-1">
            {[ALL, 'deployment', 'security', 'error', 'system', 'account'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors border',
                  filterType === t
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                {t === ALL ? 'All' : typeConfig[t]?.label ?? t}
              </button>
            ))}
          </div>

          <span className="text-border">|</span>

          {/* Severity filter */}
          <div className="flex gap-1">
            {[ALL, 'critical', 'warning', 'info', 'success'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors border',
                  filterSeverity === s
                    ? s === 'critical'
                      ? 'bg-destructive/15 text-destructive border-destructive/30'
                      : 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                {s === ALL ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div className="overflow-y-auto max-h-[400px] divide-y divide-border/40 font-mono text-xs">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Activity className="w-5 h-5 opacity-30" />
            <span className="text-xs">No events match current filters</span>
          </div>
        )}

        {filtered.map((event) => {
          const cfg  = typeConfig[event.type]  || typeConfig.system;
          const sev  = severityStyles[event.severity] || severityStyles.info;
          const Icon = cfg.icon;
          const isCritical = event.severity === 'critical';

          return (
            <div
              key={event.id}
              className={cn(
                'flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors',
                sev.row,
                isCritical && 'hover:bg-destructive/10'
              )}
            >
              {/* Timestamp */}
              <span className="text-muted-foreground/50 shrink-0 w-28 pt-0.5 tabular-nums">
                {moment(event.created_date).format('HH:mm:ss')}
              </span>

              {/* Type icon */}
              <div className={cn('p-1 rounded shrink-0 mt-0.5', cfg.bg)}>
                <Icon className={cn('w-3 h-3', cfg.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold', isCritical ? 'text-destructive' : 'text-foreground')}>
                    {event.title}
                  </span>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', sev.badge)}>
                    {event.severity}
                  </span>
                  {event.type && (
                    <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
                      [{event.type}]
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className={cn('mt-0.5 leading-relaxed', isCritical ? 'text-destructive/80' : 'text-muted-foreground')}>
                    {event.description}
                  </p>
                )}
              </div>

              {/* Relative time */}
              <span className="text-muted-foreground/40 shrink-0 text-[10px] pt-0.5">
                {moment(event.created_date).fromNow()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border text-[10px] text-muted-foreground/50 font-mono">
        <span>{filtered.length} event{filtered.length !== 1 ? 's' : ''} shown</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Live
        </span>
      </div>
    </div>
  );
}