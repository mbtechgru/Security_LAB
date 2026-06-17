import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileJson, CheckCircle2, XCircle, Loader2, Download, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const REQUIRED_FIELDS = ['name'];
const ALLOWED_FIELDS = [
  'name', 'region', 'vpc_cidr', 'attacker_subnet_cidr', 'victim_subnet_cidr',
  'services_subnet_cidr', 'key_pair_name', 'allowed_admin_cidr', 'domain_name',
  'dsrm_password', 'instance_type', 'kali_ami_id', 'metasploitable_ami_id', 'windows_ami_id',
];

const DEFAULTS = {
  region: 'us-east-1',
  vpc_cidr: '10.20.0.0/16',
  attacker_subnet_cidr: '10.20.10.0/24',
  victim_subnet_cidr: '10.20.20.0/24',
  services_subnet_cidr: '10.20.30.0/24',
  allowed_admin_cidr: '0.0.0.0/0',
  domain_name: 'lab.local',
  instance_type: 't2.micro',
};

const EXAMPLE = [
  {
    name: 'Lab Alpha',
    region: 'us-east-1',
    instance_type: 't2.micro',
    vpc_cidr: '10.20.0.0/16',
    key_pair_name: 'my-key',
    kali_ami_id: 'ami-0123456789abcdef0',
    metasploitable_ami_id: 'ami-0123456789abcdef1',
    windows_ami_id: 'ami-0123456789abcdef2',
    dsrm_password: 'P@ssw0rd123',
  },
  {
    name: 'Lab Beta',
    region: 'eu-west-1',
    instance_type: 't3.small',
    vpc_cidr: '10.30.0.0/16',
    key_pair_name: 'my-key-eu',
    kali_ami_id: 'ami-abcdef0123456789a',
    metasploitable_ami_id: 'ami-abcdef0123456789b',
    windows_ami_id: 'ami-abcdef0123456789c',
    dsrm_password: 'S3cur3Pass!',
  },
];

function validateRow(row, index) {
  const errors = [];
  REQUIRED_FIELDS.forEach(f => {
    if (!row[f]) errors.push(`Row ${index + 1}: missing required field "${f}"`);
  });
  return errors;
}

export default function BulkImport() {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [parsed, setParsed] = useState(null); // array of rows
  const [errors, setErrors] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState(null); // { success, failed }

  const parseFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data;
        if (ext === 'json') {
          data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) data = [data];
        } else if (ext === 'csv') {
          const lines = e.target.result.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
          }).filter(row => Object.values(row).some(v => v));
        } else {
          toast.error('Only .json and .csv files are supported');
          return;
        }

        // Validate
        const allErrors = data.flatMap((row, i) => validateRow(row, i));
        setErrors(allErrors);
        setParsed(data);
        setResults(null);
      } catch (err) {
        toast.error('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: async (rows) => {
      const success = [], failed = [];
      for (const row of rows) {
        const data = { ...DEFAULTS };
        ALLOWED_FIELDS.forEach(f => { if (row[f]) data[f] = row[f]; });
        data.status = 'pending';
        data.instances = [
          { name: 'Kali Linux', type: data.instance_type, status: 'pending', subnet: 'attacker' },
          { name: 'Metasploitable 2', type: data.instance_type, status: 'pending', subnet: 'victim' },
          { name: 'Windows DC', type: data.instance_type, status: 'pending', subnet: 'victim' },
          { name: 'Juice Shop', type: data.instance_type, status: 'pending', subnet: 'services' },
        ];
        try {
          const dep = await base44.entities.Deployment.create(data);
          await base44.entities.Event.create({
            type: 'deployment',
            title: `Deployment "${data.name}" imported`,
            description: `Bulk import · Region: ${data.region}`,
            severity: 'info',
            deployment_id: dep.id,
          });
          success.push(data.name);
        } catch (e) {
          failed.push(data.name);
        }
      }
      return { success, failed };
    },
    onSuccess: ({ success, failed }) => {
      setResults({ success, failed });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      if (success.length) toast.success(`${success.length} deployment${success.length > 1 ? 's' : ''} imported`);
      if (failed.length) toast.error(`${failed.length} failed to import`);
    },
  });

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(EXAMPLE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deployments_example.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    parseFile(e.dataTransfer.files[0]);
  };

  const canImport = parsed && parsed.length > 0 && errors.length === 0 && !importMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bulk Import Configurations</h2>
          <p className="text-xs text-muted-foreground mt-1">Upload a JSON or CSV file to create multiple deployment configurations at once</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-foreground" onClick={downloadExample}>
          <Download className="w-3.5 h-3.5" />
          Download Example
        </Button>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20"
        )}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={e => parseFile(e.target.files[0])} />
        <FileJson className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Drop your file here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Supports <span className="font-mono">.json</span> and <span className="font-mono">.csv</span> formats</p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Validation errors</span>
          </div>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive/80 font-mono">{err}</p>
          ))}
        </div>
      )}

      {/* Preview table */}
      {parsed && parsed.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-semibold">{parsed.length} configuration{parsed.length > 1 ? 's' : ''} ready to import</span>
            <Badge variant="outline" className={cn(errors.length ? "text-destructive border-destructive/30" : "text-emerald-500 border-emerald-500/30")}>
              {errors.length ? `${errors.length} errors` : 'Valid'}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['name', 'region', 'instance_type', 'vpc_cidr', 'key_pair_name'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-mono uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-medium text-foreground">{row.name || <span className="text-destructive">—</span>}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.region || DEFAULTS.region}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.instance_type || DEFAULTS.instance_type}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.vpc_cidr || DEFAULTS.vpc_cidr}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.key_pair_name || <span className="text-muted-foreground/40">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import results */}
      {results && (
        <div className="space-y-2">
          {results.success.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>{results.success.length} imported: {results.success.join(', ')}</span>
            </div>
          )}
          {results.failed.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="w-4 h-4" />
              <span>{results.failed.length} failed: {results.failed.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Import button */}
      {parsed && parsed.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="text-foreground" onClick={() => { setParsed(null); setErrors([]); setResults(null); }}>
            Clear
          </Button>
          <Button onClick={() => importMutation.mutate(parsed)} disabled={!canImport} className="gap-2 min-w-[140px]">
            {importMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="w-4 h-4" /> Import {parsed.length} Config{parsed.length > 1 ? 's' : ''}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}