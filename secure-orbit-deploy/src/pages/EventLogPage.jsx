import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EventLog from '@/components/dashboard/EventLog';

export default function EventLogPage() {
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date', 200),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Event Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time audit trail of all state changes and user actions</p>
      </div>
      <EventLog events={events} />
    </div>
  );
}