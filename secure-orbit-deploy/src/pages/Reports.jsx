import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileBarChart, Plus, Loader2, Download, FileDown } from 'lucide-react';
import { useExportPDF } from '@/hooks/useExportPDF';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ReportCard from '../components/reports/ReportCard';
import ReportViewer from '../components/reports/ReportViewer';
import ReportSummaryTable from '../components/reports/ReportSummaryTable';

const CHART_COLORS = [
  'hsl(0, 84%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(210, 100%, 52%)',
  'hsl(215, 16%, 47%)',
];

function generateReportContent(type) {
  const contents = {
    security_audit: `# Security Audit Report — Pentest Lab

## Executive Summary
This audit identifies intentional security weaknesses deployed in the pentesting lab environment for educational and training purposes.

## Critical Findings

### 1. Over-Permissive IAM Role (CRITICAL)
- **Resource:** PentestLab-OverPermissive-Role
- **Issue:** IAM role with \`Action: "*"\` on \`Resource: "*"\` (full admin access)
- **Impact:** Any EC2 instance with this profile can perform any AWS action
- **Recommendation:** Scope down permissions to least privilege

### 2. Publicly Accessible S3 Bucket (CRITICAL)
- **Resource:** pentest-lab-vuln-bucket
- **Issue:** Bucket policy allows \`s3:GetObject\` and \`s3:PutObject\` from \`Principal: "*"\`
- **Impact:** Anyone on the internet can read and write to this bucket
- **Recommendation:** Restrict access; enable encryption at rest

### 3. Unrestricted SSH Access (HIGH)
- **Resource:** PentestLab-SG-Attacker
- **Issue:** Security group allows SSH (port 22) from 0.0.0.0/0
- **Impact:** Kali instance SSH is open to the entire internet
- **Recommendation:** Restrict to specific admin IP ranges

## Medium Findings

### 4. Metasploitable Instance Running Known Vulnerable Services
- **Resource:** PentestLab-Metasploitable
- **Issue:** Running intentionally vulnerable services (vsftpd, Samba, Postgres)
- **Impact:** Multiple exploitation vectors available
- **Note:** Expected for lab purposes

### 5. Windows DC with Weak DSRM Password Policy
- **Resource:** PentestLab-Windows-DC
- **Issue:** DSRM password set via user_data in cleartext

## Low Findings

### 6. VPC DNS Hostnames Enabled
- Standard configuration, no immediate risk

---
*Generated for educational/pentesting lab purposes only.*`,

    resource_inventory: `# Resource Inventory Report

## VPC & Networking
| Resource | ID | Details |
|----------|-----|---------|
| VPC | vpc-0abc123 | 10.20.0.0/16, DNS enabled |
| Internet Gateway | igw-xyz | Attached to VPC |
| Public Subnet | subnet-atk | 10.20.10.0/24 |
| Private Subnet (Victim) | subnet-vic | 10.20.20.0/24 |
| Private Subnet (Services) | subnet-svc | 10.20.30.0/24 |
| Route Table (Public) | rtb-pub | 0.0.0.0/0 → IGW |
| Route Table (Victim) | rtb-vic | Local only |
| Route Table (Services) | rtb-svc | Local only |

## Security Groups
| Name | Inbound Rules | Outbound |
|------|--------------|----------|
| SG-Attacker | SSH:22 from admin CIDR | All |
| SG-Victim | All from Attacker + Services CIDRs | All |
| SG-Services | TCP:3000 from Attacker CIDR | All |

## EC2 Instances
| Name | AMI | Type | Subnet | IP |
|------|-----|------|--------|-----|
| Kali Linux | Custom | t2.micro | Public | Elastic |
| Metasploitable 2 | Custom | t2.micro | Victim | Private |
| Windows DC | Custom | t2.micro | Victim | Private |
| Juice Shop | AL2023 | t2.micro | Services | Private |

## IAM
- Role: PentestLab-OverPermissive-Role (ec2 assume)
- Policy: PentestLab-AdminLike-Policy (Allow */*)

## S3
- Bucket: pentest-lab-vuln-* (Public read/write)

**Total Resources: 18**`,

    vulnerability_scan: `# Vulnerability Scan Report

## Scan Summary
- **Target:** Pentest Lab VPC (10.20.0.0/16)
- **Scan Type:** Network + Service Discovery
- **Duration:** ~15 minutes

## Critical Vulnerabilities

### CVE-2023-XXXX: vsftpd Backdoor (Metasploitable)
- **CVSS:** 10.0
- **Port:** 6200/tcp
- **Description:** vsftpd 2.3.4 backdoor command execution

### Public S3 Bucket — Data Exfiltration Risk
- **CVSS:** 9.8
- **Description:** Unrestricted read/write from any IP

## High Vulnerabilities

### Weak SSH Configuration (Kali)
- **CVSS:** 7.5
- **Port:** 22/tcp
- **Description:** Password authentication enabled

### Samba Vulnerability (Metasploitable)
- **CVSS:** 7.2
- **Port:** 445/tcp
- **Description:** Samba smbd 3.X — username map script command execution

### OWASP Juice Shop — Multiple Web Vulnerabilities
- **CVSS:** 7.0
- **Port:** 3000/tcp
- **Description:** XSS, SQL Injection, Broken Authentication

## Medium Vulnerabilities

### Unencrypted HTTP (Juice Shop)
- Port 3000 serving HTTP without TLS

### Weak Active Directory Password Policy
- Default GPO with no complexity requirements

## Low Vulnerabilities
### Information Disclosure via Server Headers
### DNS Zone Transfer Possible`,

    deployment_summary: `# Deployment Summary

## Overview
Successfully deployed pentesting lab with 18 AWS resources.

## Resources Created
- 1 VPC with DNS support
- 3 Subnets (1 public, 2 private)
- 3 Route Tables with associations
- 1 Internet Gateway
- 3 Security Groups
- 4 EC2 Instances
- 1 IAM Role + Policy + Instance Profile
- 1 S3 Bucket with public policy

## Architecture
\`\`\`
Internet → IGW → [Public: Kali] → [Private: Metasploitable, Windows DC]
                                → [Private: Juice Shop:3000]
\`\`\`

## Next Steps
1. SSH to Kali using the public IP
2. Begin reconnaissance from Kali against private subnets
3. Test OWASP Juice Shop on port 3000
4. Practice privilege escalation via over-permissive IAM
5. Destroy with \`terraform destroy\` when done`,

    compliance: `# Compliance Report

## CIS AWS Foundations Benchmark

| Control | Status | Details |
|---------|--------|---------|
| 1.1 Root account MFA | N/A | Not assessed |
| 2.1 CloudTrail enabled | ⚠️ WARN | Not configured in lab |
| 2.2 Log file validation | ⚠️ WARN | Not configured |
| 3.1 VPC Flow Logs | ❌ FAIL | Not enabled |
| 4.1 SSH restricted | ❌ FAIL | Open to 0.0.0.0/0 |
| 4.2 Security groups | ❌ FAIL | Over-permissive rules |
| 5.1 IAM policies | ❌ FAIL | Admin-like policy attached |
| 6.1 S3 public access | ❌ FAIL | Bucket is public |
| 6.2 S3 encryption | ❌ FAIL | No encryption |

**Score: 0/9 (0%) — Expected for intentionally vulnerable lab**

> Note: This lab is designed to fail these controls for educational purposes.`,
  };
  return contents[type] || contents.deployment_summary;
}

const findingCounts = {
  security_audit: { critical: 2, high: 1, medium: 2, low: 1 },
  vulnerability_scan: { critical: 2, high: 3, medium: 2, low: 2 },
  compliance: { critical: 0, high: 6, medium: 2, low: 0 },
  resource_inventory: { critical: 0, high: 0, medium: 0, low: 0 },
  deployment_summary: { critical: 0, high: 0, medium: 0, low: 0 },
};

const ChartTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    return (
      <div style={{ background: 'hsl(222,47%,9%)', border: '1px solid hsl(222,40%,16%)' }} className="rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-medium" style={{ color: 'hsl(210,20%,95%)' }}>{payload[0].payload.name}</p>
        <p className="text-sm font-bold font-mono" style={{ color: payload[0].fill || payload[0].color || '#fff' }}>{payload[0].value} findings</p>
      </div>
    );
  }
  return null;
};

function downloadSummary(reports, deployments) {
  const now = new Date().toLocaleString();
  const deployedLabs = deployments.filter(d => d.status === 'deployed');

  const totalCritical = reports.reduce((s, r) => s + (r.critical_count || 0), 0);
  const totalHigh = reports.reduce((s, r) => s + (r.high_count || 0), 0);
  const totalMedium = reports.reduce((s, r) => s + (r.medium_count || 0), 0);
  const totalLow = reports.reduce((s, r) => s + (r.low_count || 0), 0);

  let md = `# Pentest LAB — Deployment Findings Summary\n`;
  md += `Generated: ${now}\n\n`;
  md += `---\n\n`;

  md += `## Active Deployments (${deployedLabs.length})\n\n`;
  if (deployedLabs.length === 0) {
    md += `No active deployments.\n\n`;
  } else {
    deployedLabs.forEach(d => {
      md += `### ${d.name}\n`;
      md += `- Region: ${d.region}\n`;
      md += `- VPC CIDR: ${d.vpc_cidr}\n`;
      md += `- Instance Type: ${d.instance_type}\n`;
      if (d.kali_public_ip) md += `- Kali Public IP: ${d.kali_public_ip}\n`;
      if (d.vpc_id) md += `- VPC ID: ${d.vpc_id}\n`;
      if (d.vuln_bucket_name) md += `- Vuln Bucket: ${d.vuln_bucket_name}\n`;
      md += `\n`;
    });
  }

  md += `## Findings Summary (All Reports)\n\n`;
  md += `| Severity | Count |\n|----------|-------|\n`;
  md += `| Critical | ${totalCritical} |\n`;
  md += `| High     | ${totalHigh} |\n`;
  md += `| Medium   | ${totalMedium} |\n`;
  md += `| Low      | ${totalLow} |\n`;
  md += `| **Total**| **${totalCritical + totalHigh + totalMedium + totalLow}** |\n\n`;

  md += `## Reports (${reports.length})\n\n`;
  reports.forEach(r => {
    md += `### ${r.title}\n`;
    md += `- Type: ${r.type}\n`;
    md += `- Status: ${r.status}\n`;
    md += `- Findings: ${r.findings_count || 0} (C:${r.critical_count || 0} H:${r.high_count || 0} M:${r.medium_count || 0} L:${r.low_count || 0})\n`;
    if (r.content) {
      md += `\n#### Full Content\n\n${r.content}\n`;
    }
    md += `\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pentest-lab-findings-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportType, setReportType] = useState('security_audit');
  const { exportPDF } = useExportPDF();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date'),
  });

  const { data: deployments = [] } = useQuery({
    queryKey: ['deployments'],
    queryFn: () => base44.entities.Deployment.list('-created_date', 50),
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      const counts = findingCounts[reportType] || { critical: 0, high: 0, medium: 0, low: 0 };
      const typeLabels = {
        security_audit: 'Security Audit',
        resource_inventory: 'Resource Inventory',
        deployment_summary: 'Deployment Summary',
        vulnerability_scan: 'Vulnerability Scan',
        compliance: 'Compliance Check',
      };
      const report = await base44.entities.Report.create({
        title: `${typeLabels[reportType]} — ${new Date().toLocaleDateString()}`,
        type: reportType,
        status: 'generating',
        findings_count: counts.critical + counts.high + counts.medium + counts.low,
        critical_count: counts.critical,
        high_count: counts.high,
        medium_count: counts.medium,
        low_count: counts.low,
      });

      // Simulate generation
      await new Promise(r => setTimeout(r, 2000));

      const content = generateReportContent(reportType);
      await base44.entities.Report.update(report.id, { status: 'completed', content });

      await base44.entities.Event.create({
        type: 'system',
        title: `Report generated: ${typeLabels[reportType]}`,
        severity: 'success',
      });

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Report generated');
    },
  });

  // Chart data
  const severityData = [
    { name: 'Critical', value: reports.reduce((s, r) => s + (r.critical_count || 0), 0) },
    { name: 'High', value: reports.reduce((s, r) => s + (r.high_count || 0), 0) },
    { name: 'Medium', value: reports.reduce((s, r) => s + (r.medium_count || 0), 0) },
    { name: 'Low', value: reports.reduce((s, r) => s + (r.low_count || 0), 0) },
  ];


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Security assessments and deployment reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="security_audit">Security Audit</SelectItem>
              <SelectItem value="vulnerability_scan">Vulnerability Scan</SelectItem>
              <SelectItem value="resource_inventory">Resource Inventory</SelectItem>
              <SelectItem value="deployment_summary">Deployment Summary</SelectItem>
              <SelectItem value="compliance">Compliance Check</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => downloadSummary(reports, deployments)}
            disabled={reports.length === 0}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Download Summary
          </Button>
          <Button
            variant="outline"
            onClick={() => exportPDF({ reports, deployments })}
            disabled={reports.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={() => generateReport.mutate()} disabled={generateReport.isPending} className="gap-2">
            {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate
          </Button>
        </div>
      </div>

      {/* Findings Chart */}
      {reports.length > 0 && severityData.some(d => d.value > 0) && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Findings Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={severityData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {severityData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk Summary Table */}
      <ReportSummaryTable reports={reports} deployments={deployments} onView={setSelectedReport} />

      {/* Reports List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
            <FileBarChart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reports generated yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Generate a security audit or deployment report</p>
          </div>
        )}

        {reports.map((report) => (
          <ReportCard key={report.id} report={report} onView={setSelectedReport} />
        ))}
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewer report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}