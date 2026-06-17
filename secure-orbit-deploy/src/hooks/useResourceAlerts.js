import { useMemo } from 'react';

// Approximate hourly pricing (same as CostEstimator)
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

const FIXED_OTHER = 5.10; // EIP + S3 + data transfer
const HOURS_PER_MONTH = 730;
const BUDGET_THRESHOLD = 50;   // USD — alert if predicted monthly > this
const CPU_THRESHOLD_TYPES = ['t2.micro', 't2.small', 't3.micro']; // burstable — flag as high-risk

/**
 * Returns an array of alert objects for active deployments.
 * Each alert: { id, deploymentId, deploymentName, type, title, detail, severity }
 */
export function useResourceAlerts(deployments = []) {
  return useMemo(() => {
    const alerts = [];

    deployments.forEach((dep) => {
      if (dep.status !== 'deployed') return;

      const mult = REGION_MULTIPLIER[dep.region] || 1.0;
      const baseHourly = INSTANCE_BASE_PRICE[dep.instance_type] || INSTANCE_BASE_PRICE['t2.micro'];
      const monthlyCost = baseHourly * mult * HOURS_PER_MONTH * 4 + FIXED_OTHER;

      // Budget alert
      if (monthlyCost > BUDGET_THRESHOLD) {
        alerts.push({
          id: `budget-${dep.id}`,
          deploymentId: dep.id,
          deploymentName: dep.name,
          type: 'budget',
          title: `Budget threshold exceeded`,
          detail: `"${dep.name}" projected at $${monthlyCost.toFixed(2)}/mo (limit $${BUDGET_THRESHOLD})`,
          severity: 'critical',
        });
      }

      // CPU burst risk — burstable instance types running always-on are at risk of credit exhaustion
      if (CPU_THRESHOLD_TYPES.includes(dep.instance_type)) {
        alerts.push({
          id: `cpu-${dep.id}`,
          deploymentId: dep.id,
          deploymentName: dep.name,
          type: 'cpu',
          title: `High CPU burst risk`,
          detail: `"${dep.name}" uses ${dep.instance_type} — T-series instances may exhaust CPU credits under sustained load`,
          severity: 'warning',
        });
      }
    });

    return alerts;
  }, [deployments]);
}