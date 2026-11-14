import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { AgentLogEntry, AgentName } from '../types';

interface AgentLogPanelProps {
  logs: AgentLogEntry[];
  activeAgent: AgentName | null;
  onClearLogs: () => void;
}

const AGENTS_PIPELINE: AgentName[] = [
  'Profiler',
  'Curriculum Architect',
  'Evaluator',
  'Mentor',
];

function getAgentTextColor(agent: AgentName): string {
  switch (agent) {
    case 'Profiler':
      return 'text-[#00E5FF]';
    case 'Curriculum Architect':
      return 'text-sky-300';
    case 'Evaluator':
      return 'text-emerald-300';
    case 'Mentor':
      return 'text-cyan-200';
    default:
      return 'text-slate-200';
  }
}

export function AgentLogPanel({ logs, activeAgent, onClearLogs }: AgentLogPanelProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs.length]);

  return (
    <section
      id="telemetry"
      aria-label="Live Agent Telemetry Log"
      className="studio-panel flex flex-col rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-400/20 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-[#00E5FF] shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-display text-sm font-bold text-slate-50">
              Live Agent Telemetry &amp; Handoffs
            </h2>
            <p className="text-[11px] text-slate-300">
              Real-time inter-agent event stream
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-cyan-200 tabular-nums">
            {logs.length} {logs.length === 1 ? 'event' : 'events'}
          </span>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              title="Clear log"
              aria-label="Clear collaboration log"
              className="rounded-lg border border-cyan-400/25 p-1.5 text-cyan-200 hover:bg-cyan-500/20 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Agent Status Strip */}
      <div className="grid grid-cols-2 gap-2 border-b border-cyan-400/20 bg-slate-950/50 px-4 py-3 sm:grid-cols-4">
        {AGENTS_PIPELINE.map((agent) => {
          const isRunning = activeAgent === agent;
          return (
            <div
              key={agent}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                isRunning
                  ? 'border-[#00E5FF]/65 bg-cyan-500/15 text-cyan-50'
                  : 'border-cyan-400/20 bg-slate-950/55 text-slate-300'
              }`}
            >
              <span className="truncate font-medium">{agent}</span>
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E5FF] shrink-0 ml-1.5" aria-hidden="true" />
              ) : (
                <span className="font-mono text-[10px] text-cyan-300/70 shrink-0 ml-1.5">
                  Ready
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[360px] max-h-[600px]">
        {logs.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-medium text-cyan-100">
              Waiting for agent telemetry
            </p>
            <p className="mt-1 text-xs text-slate-300 max-w-sm">
              Click &ldquo;Load Sample Student&rdquo; or select a Role Switcher chip on Screen 01 to watch live multi-agent handoffs.
            </p>
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border p-3 text-xs backdrop-blur-md transition-colors ${
                entry.status === 'alert'
                  ? 'border-sky-400/50 bg-sky-500/15'
                  : entry.status === 'error'
                  ? 'border-rose-400/50 bg-rose-500/15'
                  : entry.status === 'handoff'
                  ? 'border-[#00E5FF]/35 bg-cyan-500/10'
                  : 'border-cyan-400/25 bg-slate-950/55'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {entry.status === 'running' && (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-[#00E5FF] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {entry.status === 'completed' && (
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-300 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {entry.status === 'handoff' && (
                    <ArrowRight
                      className="h-3.5 w-3.5 text-[#00E5FF] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {(entry.status === 'alert' || entry.status === 'error') && (
                    <AlertTriangle
                      className={`h-3.5 w-3.5 shrink-0 ${
                        entry.status === 'error' ? 'text-rose-400' : 'text-sky-300'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span className={`font-semibold truncate ${getAgentTextColor(entry.agent)}`}>
                    {entry.agent} Agent
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                  {entry.timestamp}
                </span>
              </div>

              <p className="mt-1.5 text-slate-100 leading-relaxed">{entry.message}</p>

              {entry.detail && (
                <p className="mt-1.5 rounded bg-slate-950/70 border border-cyan-400/20 px-2.5 py-1.5 font-mono text-[11px] text-cyan-200/85 break-words">
                  {entry.detail}
                </p>
              )}
            </div>
          ))
        )}
        <div ref={scrollEndRef} />
      </div>
    </section>
  );
}
