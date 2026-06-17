import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ALL_STATUSES = new Set(['pending', 'initializing', 'planning', 'applying', 'deployed', 'destroying', 'destroyed', 'failed']);

const STATUS_CONFIG = {
  pending:      { label: 'Deployment Pending',    style: 'info',    emoji: '⏳' },
  initializing: { label: 'Deployment Initializing', style: 'info',  emoji: '🔄' },
  planning:     { label: 'Deployment Planning',   style: 'info',    emoji: '📋' },
  applying:     { label: 'Deployment Applying',   style: 'info',    emoji: '⚙️' },
  deployed:     { label: 'Deployment Active',     style: 'success', emoji: '✅' },
  destroying:   { label: 'Deployment Destroying', style: 'warning', emoji: '⚠️' },
  destroyed:    { label: 'Deployment Destroyed',  style: 'warning', emoji: '🗑️' },
  failed:       { label: 'Deployment Failed',     style: 'error',   emoji: '🚨' },
};

async function sendEmailAlert(deployment, prevStatus, newStatus, userEmail) {
  const config = STATUS_CONFIG[newStatus];
  if (!config || !userEmail) return;

  const name = deployment.name || 'Unknown';
  const region = deployment.region || 'N/A';
  const subject = `${config.emoji} ${config.label}: ${name}`;
  const body = `
Security LAB — Deployment Status Alert
=======================================

Deployment : ${name}
Region     : ${region}
Previous   : ${prevStatus || 'N/A'}
New Status : ${newStatus.toUpperCase()}
Time       : ${new Date().toUTCString()}

${newStatus === 'failed' ? '⚠️  Action required: Check the deployment log for error details.' : ''}
${newStatus === 'deployed' ? '✅  Lab is live and ready for use.' : ''}
${newStatus === 'destroyed' ? '🗑️  All resources have been torn down.' : ''}

--
This alert was sent automatically by Security LAB.
  `.trim();

  await base44.integrations.Core.SendEmail({ to: userEmail, subject, body });
}

export function useDeploymentAlerts() {
  const prevStatuses = useRef({});

  useEffect(() => {
    let userEmail = null;
    base44.auth.me().then(u => { userEmail = u?.email; }).catch(() => {});

    const unsubscribe = base44.entities.Deployment.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        const deployment = event.data;
        const prevStatus = prevStatuses.current[event.id];
        const newStatus = deployment?.status;

        if (newStatus && newStatus !== prevStatus && ALL_STATUSES.has(newStatus)) {
          const config = STATUS_CONFIG[newStatus];

          // Show in-app toast
          if (config) {
            const msg = { description: `"${deployment.name || 'Unknown'}" → ${newStatus}`, duration: 7000 };
            if (config.style === 'error') toast.error(config.label, msg);
            else if (config.style === 'warning') toast.warning(config.label, msg);
            else if (config.style === 'success') toast.success(config.label, msg);
            else toast.info(config.label, msg);
          }

          // Send email alert
          sendEmailAlert(deployment, prevStatus, newStatus, userEmail);
        }

        prevStatuses.current[event.id] = newStatus;
      }

      if (event.type === 'delete') {
        delete prevStatuses.current[event.id];
      }
    });

    return () => unsubscribe();
  }, []);
}