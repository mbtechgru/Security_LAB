import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const OTHER_MONTHLY = 5.10; // EIP + S3 + data transfer
const INSTANCE_COUNT = 4;
const HOURS_PER_MONTH = 730;

export default function DeployCostEstimate({ region, instanceType }) {
  const mult = REGION_MULTIPLIER[region] || 1.0;
  const hourly = (INSTANCE_BASE_PRICE[instanceType] || INSTANCE_BASE_PRICE['t2.micro']) * mult;
  const ec2Monthly = hourly * INSTANCE_COUNT * HOURS_PER_MONTH;
  const total = ec2Monthly + OTHER_MONTHLY;
  const hasRegionPremium = mult > 1.0;

  return (
    <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <DollarSign className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estimated Cost</p>
        <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
          <span className="text-xl font-bold font-mono text-primary">${total.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
          <span className="text-xs text-muted-foreground font-mono">
            4 × {instanceType} @ ${hourly.toFixed(4)}/hr · {region}
            {hasRegionPremium && <span className="text-amber-400 ml-1">(+{Math.round((mult - 1) * 100)}% regional)</span>}
          </span>
        </div>
      </div>
      <Link to="/cost-estimator" className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors shrink-0">
        <TrendingUp className="w-3.5 h-3.5" />
        Full breakdown
      </Link>
    </div>
  );
}