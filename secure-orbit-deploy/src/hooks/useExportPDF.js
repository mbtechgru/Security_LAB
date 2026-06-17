import jsPDFModule from 'jspdf';
const jsPDF = jsPDFModule.jsPDF || jsPDFModule;

const SEVERITY_COLORS = {
  critical: [220, 38, 38],
  high:     [234, 88, 12],
  medium:   [59, 130, 246],
  low:      [100, 116, 139],
};

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function useExportPDF() {
  const exportPDF = ({ reports = [], deployments = [] }) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentW = pageW - margin * 2;
      let y = margin;

      const checkPage = (needed = 40) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // ── Header ──────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 80, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Security LAB — Findings & Deployment Report', margin, 36);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 56);
      doc.text(`Reports: ${reports.length}  |  Deployments: ${deployments.length}`, margin, 68);
      y = 104;

      // ── Summary Stats ────────────────────────────────────────
      const totalCritical = reports.reduce((s, r) => s + (r.critical_count || 0), 0);
      const totalHigh     = reports.reduce((s, r) => s + (r.high_count     || 0), 0);
      const totalMedium   = reports.reduce((s, r) => s + (r.medium_count   || 0), 0);
      const totalLow      = reports.reduce((s, r) => s + (r.low_count      || 0), 0);
      const totalFindings = totalCritical + totalHigh + totalMedium + totalLow;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Executive Summary', margin, y);
      y += 18;

      const statBoxW = (contentW - 12) / 4;
      const stats = [
        { label: 'Critical', value: totalCritical, color: SEVERITY_COLORS.critical },
        { label: 'High',     value: totalHigh,     color: SEVERITY_COLORS.high     },
        { label: 'Medium',   value: totalMedium,   color: SEVERITY_COLORS.medium   },
        { label: 'Low',      value: totalLow,      color: SEVERITY_COLORS.low      },
      ];

      stats.forEach((stat, i) => {
        const bx = margin + i * (statBoxW + 4);
        doc.setFillColor(...stat.color);
        doc.roundedRect(bx, y, statBoxW, 52, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(String(stat.value), bx + statBoxW / 2, y + 28, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, bx + statBoxW / 2, y + 43, { align: 'center' });
      });
      y += 68;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total findings across all reports: ${totalFindings}`, margin, y);
      y += 24;

      // ── Deployments ──────────────────────────────────────────
      if (deployments.length > 0) {
        checkPage(60);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 16;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('Active Deployments', margin, y);
        y += 16;

        deployments.forEach((dep) => {
          checkPage(60);
          const statusColors = {
            deployed: [16, 185, 129], failed: [220, 38, 38],
            pending: [148, 163, 184], destroying: [234, 88, 12],
          };
          const sc = statusColors[dep.status] || [148, 163, 184];

          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, y, contentW, 48, 4, 4, 'F');

          doc.setFillColor(...sc);
          doc.circle(margin + 16, y + 14, 4, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(dep.name || 'Unnamed', margin + 28, y + 17);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          const meta = [
            dep.region && `Region: ${dep.region}`,
            dep.status && `Status: ${dep.status.toUpperCase()}`,
            dep.vpc_cidr && `VPC: ${dep.vpc_cidr}`,
            dep.instance_type && `Type: ${dep.instance_type}`,
          ].filter(Boolean).join('   |   ');
          doc.text(meta, margin + 28, y + 32);

          y += 56;
        });
        y += 8;
      }

      // ── Reports ──────────────────────────────────────────────
      if (reports.length > 0) {
        checkPage(60);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 16;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('Report Details', margin, y);
        y += 18;

        reports.forEach((report) => {
          checkPage(80);

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(report.title || 'Untitled Report', margin + 10, y + 17);

          if (report.status === 'completed') {
            doc.setFillColor(16, 185, 129);
          } else if (report.status === 'failed') {
            doc.setFillColor(220, 38, 38);
          } else {
            doc.setFillColor(234, 88, 12);
          }
          const statusLabel = (report.status || 'unknown').toUpperCase();
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          const statusW = doc.getTextWidth(statusLabel) + 10;
          doc.roundedRect(pageW - margin - statusW - 4, y + 6, statusW + 4, 14, 2, 2, 'F');
          doc.text(statusLabel, pageW - margin - statusW / 2 - 2, y + 16, { align: 'center' });
          y += 36;

          if (report.findings_count > 0) {
            const sevItems = [
              { label: 'C', val: report.critical_count, color: SEVERITY_COLORS.critical },
              { label: 'H', val: report.high_count,     color: SEVERITY_COLORS.high     },
              { label: 'M', val: report.medium_count,   color: SEVERITY_COLORS.medium   },
              { label: 'L', val: report.low_count,      color: SEVERITY_COLORS.low      },
            ];
            sevItems.forEach((s, idx) => {
              const bx = margin + idx * 60;
              doc.setFillColor(...s.color);
              doc.roundedRect(bx, y, 50, 18, 2, 2, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.text(`${s.label}: ${s.val || 0}`, bx + 25, y + 12, { align: 'center' });
            });
            y += 26;
          }

          if (report.content) {
            checkPage(30);
            const plain = report.content
              .replace(/^#{1,6}\s+/gm, '')
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
              .replace(/\|.+/g, '')
              .replace(/^\s*[-*]\s+/gm, '• ')
              .split('\n').filter(l => l.trim()).slice(0, 30).join('\n');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            y = addWrappedText(doc, plain, margin, y, contentW, 12);
            y += 4;
          }
          y += 16;
        });
      }

      // ── Footer on every page ─────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(241, 245, 249);
        doc.rect(0, pageH - 28, pageW, 28, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Security LAB — Confidential — For authorised use only', margin, pageH - 10);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' });
      }

      doc.save(`security-lab-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed: ' + (err.message || String(err)));
    }
  };

  return { exportPDF };
}