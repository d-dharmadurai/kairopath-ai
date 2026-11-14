const PARTICLES = [
  { left: '8%', top: '18%', delay: '0s', size: 'h-1.5 w-1.5' },
  { left: '19%', top: '62%', delay: '1.4s', size: 'h-1 w-1' },
  { left: '31%', top: '28%', delay: '2.8s', size: 'h-1.5 w-1.5' },
  { left: '46%', top: '14%', delay: '0.9s', size: 'h-1 w-1' },
  { left: '63%', top: '34%', delay: '3.2s', size: 'h-1.5 w-1.5' },
  { left: '74%', top: '66%', delay: '1.9s', size: 'h-1 w-1' },
  { left: '86%', top: '24%', delay: '4.1s', size: 'h-1.5 w-1.5' },
  { left: '92%', top: '54%', delay: '2.2s', size: 'h-1 w-1' },
];

export function StarkHudBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Top & Horizon Arc-Reactor Ambient Glows */}
      <div className="absolute -top-40 left-1/2 h-[440px] w-[min(95vw,1120px)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.2),rgba(56,189,248,0.1)_48%,transparent_75%)] blur-[100px]" />
      <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[min(100vw,1360px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(0,229,255,0.22),rgba(14,165,233,0.1)_55%,transparent_78%)] blur-[80px]" />

      {/* Precision Blueprint Coordinate Grid + Corner Target Reticles */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="starkGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.065)" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.1" fill="rgba(0, 229, 255, 0.22)" />
          </pattern>
          <linearGradient id="skylineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.32" />
            <stop offset="45%" stopColor="#0284C7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#starkGrid)" />

        {/* Corner HUD Framing Brackets */}
        <path d="M 24 52 L 24 24 L 58 24" fill="none" stroke="rgba(0, 229, 255, 0.35)" strokeWidth="1.5" />
        <path d="M 24 calc(100% - 52) L 24 calc(100% - 24) L 58 calc(100% - 24)" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="1.5" />
      </svg>

      {/* Rotating Holographic Arc-Reactor Telemetry Ring */}
      <div className="absolute left-1/2 top-[42%] h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 opacity-55 sm:h-[820px] sm:w-[820px]">
        <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible">
          <g className="hud-spin-cw">
            <circle
              cx="200"
              cy="200"
              r="182"
              fill="none"
              stroke="rgba(0, 229, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="18 10 4 10"
            />
            <circle
              cx="200"
              cy="200"
              r="154"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="2.5"
              strokeDasharray="52 24 14 24"
            />
          </g>
          <g className="hud-spin-ccw">
            <circle
              cx="200"
              cy="200"
              r="128"
              fill="none"
              stroke="rgba(0, 229, 255, 0.28)"
              strokeWidth="1.5"
              strokeDasharray="8 8"
            />
            <circle
              cx="200"
              cy="200"
              r="98"
              fill="none"
              stroke="rgba(0, 229, 255, 0.22)"
              strokeWidth="3"
              strokeDasharray="34 18"
            />
            <polygon
              points="200,126 264,237 136,237"
              fill="none"
              stroke="rgba(56, 189, 248, 0.16)"
              strokeWidth="1"
            />
          </g>
          <circle cx="200" cy="200" r="64" fill="rgba(0, 229, 255, 0.04)" stroke="rgba(0, 229, 255, 0.22)" strokeWidth="1" />
        </svg>
      </div>

      {/* Futuristic Night-Skyline Silhouette & Neural Horizon */}
      <svg
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[36vh] min-h-[210px] w-full opacity-80"
      >
        {/* Perspective Neural Floor Lines */}
        <g stroke="rgba(0, 229, 255, 0.18)" strokeWidth="1">
          <line x1="0" y1="220" x2="1440" y2="220" />
          <line x1="0" y1="246" x2="1440" y2="246" />
          <line x1="720" y1="160" x2="80" y2="280" />
          <line x1="720" y1="160" x2="360" y2="280" />
          <line x1="720" y1="160" x2="720" y2="280" />
          <line x1="720" y1="160" x2="1080" y2="280" />
          <line x1="720" y1="160" x2="1360" y2="280" />
        </g>

        {/* Illuminated Futuristic City Spires (Stark Tower Central Spire) */}
        <path
          d="M0 280 L0 198 L44 198 L44 162 L86 162 L86 210 L132 210 L132 130 L176 112 L176 204 L230 204 L230 144 L288 144 L288 188 L342 188 L342 98 L392 98 L392 178 L450 178 L450 124 L508 124 L508 192 L568 192 L568 88 L614 68 L636 184 L692 184 L692 48 L718 16 L724 16 L750 56 L750 182 L810 182 L810 108 L866 108 L866 174 L924 174 L924 84 L978 84 L978 192 L1042 192 L1042 134 L1098 134 L1098 170 L1160 170 L1160 104 L1214 104 L1214 186 L1278 186 L1278 142 L1336 142 L1336 200 L1388 200 L1388 158 L1440 158 L1440 280 Z"
          fill="url(#skylineGrad)"
          stroke="rgba(0, 229, 255, 0.42)"
          strokeWidth="1.2"
        />

        {/* Neon Window & Telemetry Trace Accents */}
        <g stroke="rgba(0, 229, 255, 0.55)" strokeWidth="1.5" strokeDasharray="6 8">
          <line x1="721" y1="30" x2="721" y2="180" />
          <line x1="367" y1="110" x2="367" y2="210" />
          <line x1="951" y1="96" x2="951" y2="205" />
          <line x1="154" y1="128" x2="154" y2="212" />
          <line x1="1187" y1="116" x2="1187" y2="210" />
        </g>
      </svg>

      {/* Drifting Holographic Data Particles */}
      {PARTICLES.map((p, idx) => (
        <span
          key={idx}
          className={`hud-particle absolute rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] ${p.size}`}
          style={{ left: p.left, top: p.top, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
