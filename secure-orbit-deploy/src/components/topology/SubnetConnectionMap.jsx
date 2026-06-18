import React, { useState } from 'react';

// Node positions are defined as % of the SVG viewBox (600 x 420)
const NODES = [
  { id: 'internet',      label: 'Internet',          x: 300, y: 30,  color: '#1d7cf2', shape: 'hex' },
  { id: 'igw',           label: 'IGW',               x: 300, y: 110, color: '#1d7cf2', shape: 'rect' },
  { id: 'kali',          label: 'Kali Linux',        x: 300, y: 210, color: '#1d7cf2', shape: 'circle' },
  { id: 'metasploitable',label: 'Metasploitable',    x: 130, y: 330, color: '#ef4444', shape: 'circle' },
  { id: 'windows_dc',    label: 'Windows DC',        x: 300, y: 330, color: '#f59e0b', shape: 'circle' },
  { id: 'juice_shop',    label: 'Juice Shop',        x: 470, y: 330, color: '#8b5cf6', shape: 'circle' },
];

const EDGES = [
  { from: 'internet',       to: 'igw',            label: '0.0.0.0/0',   color: '#1d7cf2', dashed: false },
  { from: 'igw',            to: 'kali',           label: 'Public route', color: '#1d7cf2', dashed: false },
  { from: 'kali',           to: 'metasploitable', label: 'All ports',    color: '#ef4444', dashed: false },
  { from: 'kali',           to: 'windows_dc',     label: 'All ports',    color: '#f59e0b', dashed: false },
  { from: 'kali',           to: 'juice_shop',     label: ':3000',        color: '#8b5cf6', dashed: false },
  { from: 'metasploitable', to: 'windows_dc',     label: 'Lateral',      color: '#ef4444', dashed: true },
];

const SUBNET_BANDS = [
  { id: 'public',   label: 'Attacker (Public)',  y: 175, h: 75,  color: '#1d7cf240' },
  { id: 'victim',   label: 'Victim (Private)',   y: 295, h: 75,  color: '#ef444420' },
  { id: 'services', label: 'Services (Private)', y: 295, h: 75,  color: '#8b5cf620' },
];

function nodePos(id) {
  return NODES.find(n => n.id === id);
}

function midpoint(x1, y1, x2, y2, offset = 0) {
  const mx = (x1 + x2) / 2 + offset;
  const my = (y1 + y2) / 2;
  return { mx, my };
}

const RADIUS = 22;

export default function SubnetConnectionMap({ deployment, activeNodeId, onNodeHover }) {
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const dep = deployment || {};
  const isDeployed = dep.status === 'deployed';

  // Build dynamic labels from deployment data
  const nodeLabels = {
    internet: 'Internet',
    igw: 'Internet\nGateway',
    kali: `Kali Linux\n${dep.kali_public_ip || dep.attacker_subnet_cidr || '10.20.10.x'}`,
    metasploitable: `Metasploitable\n${dep.victim_subnet_cidr ? dep.victim_subnet_cidr.replace('/24', '.10') : '10.20.20.10'}`,
    windows_dc: `Windows DC\n${dep.victim_subnet_cidr ? dep.victim_subnet_cidr.replace('/24', '.20') : '10.20.20.20'}`,
    juice_shop: `Juice Shop\n${dep.services_subnet_cidr ? dep.services_subnet_cidr.replace('/24', '.10') : '10.20.30.10'}`,
  };

  const subnetCidrs = {
    attacker: dep.attacker_subnet_cidr || '10.20.10.0/24',
    victim: dep.victim_subnet_cidr || '10.20.20.0/24',
    services: dep.services_subnet_cidr || '10.20.30.0/24',
  };

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 600 420"
        className="w-full h-auto"
        style={{ maxHeight: 420 }}
      >
        {/* Background subnet bands */}
        {/* Attacker band */}
        <rect x={160} y={175} width={280} height={70} rx={12}
          fill="#1d7cf215" stroke="#1d7cf240" strokeWidth={1.5} strokeDasharray="6 3" />
        <text x={170} y={192} fontSize={9} fill="#1d7cf280" fontFamily="monospace" fontWeight="600">
          ATTACKER — {subnetCidrs.attacker}
        </text>

        {/* Victim band */}
        <rect x={50} y={295} width={320} height={80} rx={12}
          fill="#ef444410" stroke="#ef444430" strokeWidth={1.5} strokeDasharray="6 3" />
        <text x={60} y={311} fontSize={9} fill="#ef444470" fontFamily="monospace" fontWeight="600">
          VICTIM — {subnetCidrs.victim}
        </text>

        {/* Services band */}
        <rect x={390} y={295} width={160} height={80} rx={12}
          fill="#8b5cf610" stroke="#8b5cf630" strokeWidth={1.5} strokeDasharray="6 3" />
        <text x={400} y={311} fontSize={9} fill="#8b5cf670" fontFamily="monospace" fontWeight="600">
          SERVICES — {subnetCidrs.services}
        </text>

        {/* VPC border */}
        <rect x={30} y={165} width={540} height={220} rx={16}
          fill="none" stroke="#ffffff15" strokeWidth={1.5} strokeDasharray="8 4" />
        <text x={42} y={180} fontSize={9} fill="#ffffff30" fontFamily="monospace" fontWeight="600">
          VPC — {dep.vpc_cidr || '10.20.0.0/16'}
        </text>

        {/* Edges */}
        {EDGES.map((edge, i) => {
          const from = nodePos(edge.from);
          const to = nodePos(edge.to);
          if (!from || !to) return null;
          const isHovered = hoveredEdge === i;
          const opacity = isDeployed ? (isHovered ? 1 : 0.6) : 0.25;

          // Control point for curved lines
          const cpx = (from.x + to.x) / 2 + (edge.from === 'kali' && edge.to !== 'igw' ? 0 : 0);
          const cpy = (from.y + to.y) / 2;
          const path = `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;

          const { mx, my } = midpoint(from.x, from.y, to.x, to.y);

          return (
            <g key={i}>
              {/* Glow */}
              {isHovered && (
                <path d={path} fill="none"
                  stroke={edge.color} strokeWidth={8} strokeOpacity={0.15}
                  strokeDasharray={edge.dashed ? '6 4' : undefined}
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={edge.color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeOpacity={opacity}
                strokeDasharray={edge.dashed ? '6 4' : undefined}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.15s, stroke-opacity 0.15s' }}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}
              />
              {/* Edge label */}
              {isHovered && (
                <g>
                  <rect x={mx - 28} y={my - 10} width={56} height={16} rx={4}
                    fill="#0f172a" stroke={edge.color} strokeWidth={0.8} strokeOpacity={0.5} />
                  <text x={mx} y={my + 2} textAnchor="middle" fontSize={8}
                    fill={edge.color} fontFamily="monospace">{edge.label}</text>
                </g>
              )}
              {/* Arrow head */}
              <defs>
                <marker id={`arrow-${i}`} markerWidth="6" markerHeight="6"
                  refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill={edge.color} fillOpacity={opacity} />
                </marker>
              </defs>
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map((node) => {
          const isActive = activeNodeId === node.id;
          const isDeployedNode = isDeployed;
          const opacity = isDeployedNode ? 1 : 0.4;

          const lines = (nodeLabels[node.id] || node.label).split('\n');

          return (
            <g
              key={node.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onNodeHover?.(node.id)}
              onMouseLeave={() => onNodeHover?.(null)}
            >
              {/* Glow ring for active */}
              {(isActive || isDeployedNode) && (
                <circle cx={node.x} cy={node.y} r={RADIUS + 6}
                  fill={node.color} fillOpacity={isActive ? 0.15 : 0.06} />
              )}

              {/* Node circle */}
              <circle
                cx={node.x} cy={node.y} r={RADIUS}
                fill={`${node.color}22`}
                stroke={node.color}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeOpacity={opacity}
                style={{ transition: 'stroke-width 0.15s' }}
              />

              {/* Running dot for deployed */}
              {isDeployedNode && node.id !== 'internet' && node.id !== 'igw' && (
                <circle cx={node.x + RADIUS - 5} cy={node.y - RADIUS + 5} r={4}
                  fill="#10b981" stroke="#0f172a" strokeWidth={1} />
              )}

              {/* Label lines */}
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={node.x}
                  y={node.y + RADIUS + 14 + li * 11}
                  textAnchor="middle"
                  fontSize={li === 0 ? 9 : 8}
                  fontWeight={li === 0 ? '600' : '400'}
                  fill={li === 0 ? '#e2e8f0' : '#94a3b8'}
                  fontFamily={li === 0 ? 'Inter, sans-serif' : 'monospace'}
                  fillOpacity={opacity}
                >
                  {line}
                </text>
              ))}

              {/* Icon text inside circle */}
              <text x={node.x} y={node.y + 4} textAnchor="middle"
                fontSize={11} fill={node.color} fillOpacity={opacity} fontWeight="700"
                fontFamily="monospace">
                {node.id === 'internet' ? '☁' :
                 node.id === 'igw' ? 'IGW' :
                 node.id === 'kali' ? 'K' :
                 node.id === 'metasploitable' ? 'M' :
                 node.id === 'windows_dc' ? 'W' : 'JS'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 px-1">
        {[
          { color: '#1d7cf2', label: 'Attacker path' },
          { color: '#ef4444', label: 'Victim target' },
          { color: '#f59e0b', label: 'Windows DC' },
          { color: '#8b5cf6', label: 'Services' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px border-t border-dashed border-red-400/60" style={{ borderColor: '#ef4444' }} />
          <span className="text-[10px] text-muted-foreground">Lateral movement</span>
        </div>
      </div>
    </div>
  );
}