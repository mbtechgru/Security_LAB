import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export default function DeployLog({ logs = '' }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Terminal className="w-4 h-4 text-accent" />
        <span className="text-xs font-mono font-medium text-muted-foreground">Deployment Output</span>
        <div className="flex gap-1.5 ml-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
      </div>
      <div
        ref={scrollRef}
        className="p-4 font-mono text-xs leading-6 max-h-[400px] overflow-y-auto bg-[hsl(222,47%,6%)] text-emerald-400"
      >
        {logs ? (
          logs.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="text-muted-foreground/30 mr-3 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
              <span className={
                line.includes('Error') || line.includes('FAIL') ? 'text-destructive' :
                line.includes('Success') || line.includes('Apply complete') ? 'text-emerald-400' :
                line.includes('Warning') ? 'text-amber-400' :
                line.includes('Plan:') || line.includes('>>>') ? 'text-primary' :
                'text-muted-foreground'
              }>
                {line}
              </span>
            </div>
          ))
        ) : (
          <span className="text-muted-foreground/40">Waiting for deployment output...</span>
        )}
      </div>
    </div>
  );
}