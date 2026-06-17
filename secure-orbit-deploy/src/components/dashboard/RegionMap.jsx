import React from 'react';
import { MapPin, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const awsRegions = {
  'us-east-1': { name: 'US East (N. Virginia)', lat: 39.0, lng: -77.5, azs: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f'] },
  'us-east-2': { name: 'US East (Ohio)', lat: 40.0, lng: -83.0, azs: ['us-east-2a', 'us-east-2b', 'us-east-2c'] },
  'us-west-1': { name: 'US West (N. California)', lat: 37.5, lng: -122.0, azs: ['us-west-1a', 'us-west-1b'] },
  'us-west-2': { name: 'US West (Oregon)', lat: 46.0, lng: -123.0, azs: ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d'] },
  'eu-west-1': { name: 'EU (Ireland)', lat: 53.0, lng: -8.0, azs: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'] },
  'eu-central-1': { name: 'EU (Frankfurt)', lat: 50.0, lng: 8.7, azs: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c'] },
  'ap-southeast-1': { name: 'Asia Pacific (Singapore)', lat: 1.3, lng: 103.8, azs: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'] },
  'ap-northeast-1': { name: 'Asia Pacific (Tokyo)', lat: 35.7, lng: 139.7, azs: ['ap-northeast-1a', 'ap-northeast-1b', 'ap-northeast-1c', 'ap-northeast-1d'] },
};

export default function RegionMap({ region = 'us-east-1' }) {
  const regionData = awsRegions[region] || awsRegions['us-east-1'];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Region & Availability Zones</h3>
        <Globe2 className="w-4 h-4 text-muted-foreground/40" />
      </div>

      {/* World map visualization */}
      <div className="relative bg-muted/30 rounded-xl mb-4 overflow-hidden border border-border">
        <svg viewBox="0 0 1000 500" className="w-full" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="50%" stopColor="#0d2040" />
              <stop offset="100%" stopColor="#0a1628" />
            </linearGradient>
            <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a2a" />
              <stop offset="100%" stopColor="#122a1e" />
            </linearGradient>
            <radialGradient id="activeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <filter id="landShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00ffcc" floodOpacity="0.08" />
            </filter>
          </defs>
          {/* Ocean background */}
          <rect width="1000" height="500" fill="url(#oceanGrad)" />

          {/* Graticule grid */}
          <g stroke="#1e3a5f" strokeWidth="0.4" opacity="0.6">
            {[-60, -30, 0, 30, 60].map(lat => {
              const y = ((90 - lat) / 180) * 500;
              return <line key={lat} x1="0" y1={y} x2="1000" y2={y} />;
            })}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lng => {
              const x = ((lng + 180) / 360) * 1000;
              return <line key={lng} x1={x} y1="0" x2={x} y2="500" />;
            })}
          </g>

          {/* Realistic continent outlines */}
          <g fill="url(#landGrad)" stroke="#2dd4bf" strokeWidth="0.6" strokeOpacity="0.4" filter="url(#landShadow)">
            {/* North America */}
            <path d="M 55,62 L 68,54 L 82,48 L 100,44 L 118,42 L 136,44 L 150,50 L 162,48 L 178,44 L 192,42 L 204,46 L 212,52 L 216,60 L 222,68 L 228,78 L 232,90 L 234,102 L 232,114 L 228,124 L 222,132 L 218,142 L 214,152 L 210,162 L 206,172 L 200,180 L 194,188 L 186,194 L 178,198 L 170,202 L 162,204 L 154,204 L 146,202 L 138,198 L 130,194 L 122,188 L 116,182 L 108,174 L 100,166 L 92,158 L 84,150 L 76,142 L 68,132 L 62,122 L 56,112 L 52,100 L 50,88 L 52,76 Z" />
            {/* Alaska */}
            <path d="M 30,60 L 42,54 L 55,52 L 62,56 L 64,66 L 58,74 L 48,76 L 36,72 L 28,66 Z" />
            {/* Greenland */}
            <path d="M 188,8 L 200,6 L 214,8 L 226,12 L 234,20 L 238,30 L 234,40 L 226,46 L 214,48 L 202,46 L 192,40 L 186,30 L 184,20 Z" />
            {/* Central America */}
            <path d="M 178,202 L 188,208 L 194,218 L 192,226 L 184,232 L 174,234 L 166,230 L 162,220 L 164,210 Z" />
            {/* Cuba */}
            <path d="M 180,216 L 194,214 L 200,218 L 196,224 L 182,224 Z" />
            {/* South America */}
            <path d="M 194,240 L 208,234 L 224,232 L 240,234 L 254,240 L 266,250 L 276,262 L 282,276 L 286,292 L 288,308 L 286,326 L 280,342 L 270,358 L 258,372 L 244,384 L 230,392 L 216,394 L 204,388 L 194,378 L 186,364 L 180,348 L 178,330 L 178,312 L 180,294 L 184,276 L 188,260 Z" />
            {/* Iceland */}
            <path d="M 400,46 L 410,42 L 420,44 L 424,52 L 418,58 L 406,58 L 398,52 Z" />
            {/* UK & Ireland */}
            <path d="M 448,64 L 456,60 L 464,62 L 468,70 L 464,78 L 456,80 L 448,76 L 444,68 Z" />
            <path d="M 438,66 L 444,62 L 448,66 L 446,74 L 438,74 Z" />
            {/* Europe */}
            <path d="M 462,56 L 478,48 L 496,44 L 514,46 L 528,52 L 538,60 L 542,70 L 538,80 L 530,88 L 520,94 L 510,98 L 500,102 L 490,106 L 480,108 L 470,106 L 460,100 L 454,92 L 450,82 L 450,72 L 454,62 Z" />
            {/* Scandinavia */}
            <path d="M 478,28 L 488,20 L 500,18 L 512,22 L 520,32 L 518,44 L 510,50 L 498,52 L 486,48 L 478,40 Z" />
            {/* Finland */}
            <path d="M 510,24 L 522,20 L 534,22 L 540,32 L 534,42 L 522,46 L 510,44 L 504,34 Z" />
            {/* Russia west */}
            <path d="M 530,20 L 570,14 L 620,12 L 670,14 L 720,18 L 760,24 L 790,32 L 810,42 L 808,54 L 790,62 L 760,66 L 720,66 L 680,68 L 640,70 L 600,68 L 560,64 L 530,58 L 516,46 L 518,32 Z" />
            {/* Russia east / Siberia */}
            <path d="M 790,32 L 840,28 L 880,26 L 920,28 L 950,34 L 970,44 L 968,56 L 950,64 L 920,68 L 880,68 L 840,64 L 810,58 L 808,44 Z" />
            {/* Africa */}
            <path d="M 454,132 L 470,124 L 490,120 L 512,120 L 534,124 L 552,132 L 566,144 L 574,160 L 578,178 L 576,198 L 570,218 L 560,238 L 546,258 L 530,276 L 514,292 L 500,304 L 488,312 L 476,314 L 464,308 L 454,296 L 446,280 L 440,260 L 436,238 L 434,216 L 436,194 L 440,172 L 446,152 Z" />
            {/* Madagascar */}
            <path d="M 560,262 L 568,256 L 574,264 L 572,280 L 564,288 L 556,282 L 554,270 Z" />
            {/* Arabian Peninsula */}
            <path d="M 556,140 L 580,134 L 604,132 L 618,140 L 622,154 L 616,168 L 600,178 L 580,182 L 562,176 L 552,162 L 550,148 Z" />
            {/* India */}
            <path d="M 608,140 L 636,132 L 660,134 L 674,144 L 676,160 L 670,176 L 654,192 L 636,204 L 618,210 L 606,202 L 600,186 L 600,168 L 602,152 Z" />
            {/* Sri Lanka */}
            <path d="M 640,212 L 646,210 L 650,216 L 646,222 L 638,220 Z" />
            {/* Central Asia */}
            <path d="M 600,80 L 650,76 L 700,76 L 740,82 L 760,92 L 756,106 L 730,114 L 690,116 L 650,112 L 616,104 L 600,92 Z" />
            {/* East Asia / China */}
            <path d="M 720,72 L 760,68 L 800,68 L 836,72 L 862,82 L 876,96 L 876,112 L 862,126 L 840,138 L 812,148 L 780,154 L 748,152 L 722,144 L 706,130 L 700,114 L 702,98 L 710,84 Z" />
            {/* Southeast Asia mainland */}
            <path d="M 706,130 L 726,124 L 748,122 L 766,128 L 776,142 L 772,158 L 756,170 L 736,176 L 716,172 L 704,160 L 702,144 Z" />
            {/* Malay Peninsula */}
            <path d="M 740,168 L 750,166 L 756,174 L 754,186 L 746,192 L 738,188 L 734,178 Z" />
            {/* Borneo */}
            <path d="M 756,172 L 776,164 L 796,166 L 808,178 L 806,196 L 792,206 L 770,208 L 752,198 L 746,182 Z" />
            {/* Sumatra */}
            <path d="M 712,184 L 730,178 L 748,180 L 756,190 L 748,202 L 730,208 L 712,204 L 704,194 Z" />
            {/* Java */}
            <path d="M 736,210 L 764,206 L 786,208 L 792,216 L 778,222 L 750,224 L 730,220 Z" />
            {/* Japan */}
            <path d="M 862,82 L 870,78 L 878,80 L 882,90 L 876,98 L 866,98 L 858,90 Z" />
            <path d="M 856,100 L 864,96 L 872,100 L 870,110 L 860,114 L 852,108 Z" />
            {/* Philippines */}
            <path d="M 790,156 L 800,150 L 810,154 L 812,164 L 804,170 L 794,166 Z" />
            {/* Australia */}
            <path d="M 736,284 L 764,272 L 800,268 L 838,270 L 870,278 L 896,292 L 912,310 L 916,332 L 908,354 L 890,372 L 864,386 L 834,394 L 800,396 L 766,390 L 738,376 L 718,356 L 710,332 L 712,308 L 720,290 Z" />
            {/* Tasmania */}
            <path d="M 838,402 L 848,398 L 856,404 L 852,412 L 840,414 L 832,408 Z" />
            {/* New Zealand North */}
            <path d="M 912,358 L 922,352 L 930,358 L 928,370 L 918,374 L 910,368 Z" />
            {/* New Zealand South */}
            <path d="M 908,378 L 920,374 L 928,382 L 924,396 L 912,400 L 904,392 Z" />
            {/* Antarctica hint */}
            <path d="M 100,478 L 200,470 L 350,466 L 500,464 L 650,466 L 800,470 L 900,478 L 1000,484 L 1000,500 L 0,500 Z" opacity="0.5" />
          </g>

          {/* Region markers */}
          {Object.entries(awsRegions).map(([key, r]) => {
            const x = ((r.lng + 180) / 360) * 1000;
            const y = ((90 - r.lat) / 180) * 500;
            const isActive = key === region;
            return (
              <g key={key} transform={`translate(${x},${y})`}>
                {isActive ? (
                  <>
                    <circle r="20" fill="url(#activeGlow)">
                      <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r="7" fill="#3b82f6" opacity="0.3" />
                    <circle r="5" fill="#60a5fa" />
                    <circle r="2.5" fill="white" />
                  </>
                ) : (
                  <circle r="3.5" fill="#4ade80" opacity="0.5" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active region info */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-primary" />
        <div>
          <p className="text-sm font-medium">{regionData.name}</p>
          <p className="text-xs font-mono text-muted-foreground">{region}</p>
        </div>
      </div>

      {/* AZs */}
      <div className="flex flex-wrap gap-1.5">
        {regionData.azs.map((az, i) => (
          <span
            key={az}
            className={cn(
              "text-[10px] font-mono px-2 py-1 rounded-md border",
              i === 0 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {az}
          </span>
        ))}
      </div>
    </div>
  );
}