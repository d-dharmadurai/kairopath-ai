import { useState } from 'react';
import type { RadarDimension } from '../utils/radarMetrics';

interface SkillRadarChartProps {
  dimensions: RadarDimension[];
  targetRole: string;
  completedModulesCount: number;
}

const CENTER_X = 195;
const CENTER_Y = 160;
const MAX_RADIUS = 96;
const RING_LEVELS = [20, 40, 60, 80, 100];

function polarPoint(index: number, total: number, valuePercent: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  const r = (valuePercent / 100) * MAX_RADIUS;
  return {
    x: CENTER_X + r * Math.cos(angle),
    y: CENTER_Y + r * Math.sin(angle),
    angle,
  };
}

function buildPolygonPoints(values: number[]): string {
  return values
    .map((val, idx) => {
      const pt = polarPoint(idx, values.length, val);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');
}

function getLabelAnchor(angle: number): {
  dx: number;
  dy: number;
  textAnchor: 'start' | 'middle' | 'end';
} {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  if (Math.abs(cos) < 0.15) {
    return { dx: 0, dy: sin < 0 ? -14 : 18, textAnchor: 'middle' };
  }
  return {
    dx: cos > 0 ? 12 : -12,
    dy: sin > 0.35 ? 10 : sin < -0.35 ? -4 : 4,
    textAnchor: cos > 0 ? 'start' : 'end',
  };
}

export function SkillRadarChart({
  dimensions,
  targetRole,
  completedModulesCount,
}: SkillRadarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<RadarDimension['key'] | null>(null);

  const count = dimensions.length;
  const currentPoints = buildPolygonPoints(dimensions.map((d) => d.current));
  const targetPoints = buildPolygonPoints(dimensions.map((d) => d.target));

  const activeDim =
    dimensions.find((d) => d.key === hoveredKey) ?? null;

  return (
    <div className="rounded-xl border border-cyan-400/30 bg-slate-950/55 backdrop-blur-md p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/20 pb-3.5">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-50">
            5-Axis Competency Radar
          </h3>
          <p className="text-xs text-slate-300">
            Hover any axis to inspect gap vs. {targetRole || 'Target Role'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#00E5FF]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm bg-[#00E5FF]/40 border border-[#00E5FF]"
              aria-hidden="true"
            />
            <span>Current Skill Level</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-300">
            <span
              className="inline-block h-0 w-4 border-t-2 border-dashed border-sky-400"
              aria-hidden="true"
            />
            <span>Target Requirement</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-center">
        {/* Custom SVG Spider Chart */}
        <div className="xl:col-span-7 flex justify-center">
          <svg
            viewBox="0 0 390 310"
            className="w-full max-w-[370px] h-auto overflow-visible"
            role="img"
            aria-label="Skill Gap Radar Chart comparing Current Skill Level against Target Role Requirement across 5 dimensions"
          >
            <defs>
              <linearGradient id="cyanRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.16" />
              </linearGradient>
            </defs>

            {/* Concentric pentagon grid rings */}
            {RING_LEVELS.map((level) => (
              <polygon
                key={level}
                points={buildPolygonPoints(Array(count).fill(level))}
                fill="none"
                stroke={level === 100 ? 'rgba(0, 229, 255, 0.32)' : 'rgba(56, 189, 248, 0.14)'}
                strokeWidth="1"
              />
            ))}

            {/* Radial spokes */}
            {dimensions.map((dim, idx) => {
              const outer = polarPoint(idx, count, 100);
              const isHighlighted = hoveredKey === dim.key;
              return (
                <line
                  key={dim.key}
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={isHighlighted ? 'rgba(0, 229, 255, 0.85)' : 'rgba(56, 189, 248, 0.22)'}
                  strokeWidth={isHighlighted ? '1.6' : '1'}
                />
              );
            })}

            {/* Target Role Requirement Polygon (Ice-Blue Dashed) */}
            <polygon
              points={targetPoints}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />

            {/* Current Skill Level Polygon (Arc-Reactor Cyan Fill) */}
            <polygon
              points={currentPoints}
              fill="url(#cyanRadarFill)"
              stroke="#00E5FF"
              strokeWidth="2.5"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />

            {/* Vertices & Interactive Hover Targets */}
            {dimensions.map((dim, idx) => {
              const curPt = polarPoint(idx, count, dim.current);
              const tgtPt = polarPoint(idx, count, dim.target);
              const labelPt = polarPoint(idx, count, 105);
              const anchor = getLabelAnchor(labelPt.angle);
              const isHighlighted = hoveredKey === dim.key;

              return (
                <g
                  key={dim.key}
                  onMouseEnter={() => setHoveredKey(dim.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className="cursor-pointer"
                >
                  {/* Target vertex ring */}
                  <circle
                    cx={tgtPt.x}
                    cy={tgtPt.y}
                    r={isHighlighted ? 4.5 : 3.2}
                    fill="#020617"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />

                  {/* Current vertex dot */}
                  <circle
                    cx={curPt.x}
                    cy={curPt.y}
                    r={isHighlighted ? 5.5 : 4}
                    fill="#00E5FF"
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />

                  {/* Axis label */}
                  <text
                    x={labelPt.x + anchor.dx}
                    y={labelPt.y + anchor.dy}
                    textAnchor={anchor.textAnchor}
                    className={`text-[11px] font-medium transition-colors ${
                      isHighlighted ? 'fill-[#00E5FF]' : 'fill-cyan-100'
                    }`}
                  >
                    {dim.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Interactive Dimension Readout Table */}
        <div className="xl:col-span-5 space-y-2">
          {dimensions.map((dim) => {
            const gap = Math.max(0, dim.target - dim.current);
            const isHighlighted = hoveredKey === dim.key;
            return (
              <button
                key={dim.key}
                type="button"
                onMouseEnter={() => setHoveredKey(dim.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onFocus={() => setHoveredKey(dim.key)}
                onBlur={() => setHoveredKey(null)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isHighlighted
                    ? 'border-[#00E5FF]/70 bg-cyan-500/15'
                    : 'border-cyan-400/25 bg-slate-950/55 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-cyan-50">{dim.label}</span>
                  <div className="flex items-center gap-1.5 font-mono tabular-nums">
                    <span className="text-[#00E5FF]">{dim.current}%</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-sky-300">{dim.target}%</span>
                  </div>
                </div>
                <div className="mt-1.5 relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                  {/* Target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-sky-300 z-10"
                    style={{ left: `${dim.target}%` }}
                    aria-hidden="true"
                  />
                  {/* Current level bar */}
                  <div
                    className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#00E5FF] to-sky-400 transition-transform duration-500"
                    style={{ transform: `scaleX(${dim.current / 100})` }}
                  />
                </div>
                {isHighlighted && (
                  <div className="mt-1 font-mono text-[10px] text-cyan-200/80 tabular-nums">
                    {gap === 0 ? 'Target benchmark met' : `${gap}% gap to role benchmark`}
                  </div>
                )}
              </button>
            );
          })}

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums">
            <span>
              {activeDim
                ? `${activeDim.label}: ${activeDim.current}% vs ${activeDim.target}%`
                : '5-axis competency model'}
            </span>
            <span className="text-[#00E5FF]">
              {completedModulesCount} {completedModulesCount === 1 ? 'quiz' : 'quizzes'} passed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
