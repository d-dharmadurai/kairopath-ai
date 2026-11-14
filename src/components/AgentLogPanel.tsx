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
      return 'text-sky-400';
    case 'Curriculum Architect':
      return 'text-indigo-400';
    case 'Evaluator':
      return 'text-cyan-400';
    case 'Mentor':
      return 'text-amber-400';
    default:
      return 'text-slate-300';
  }
}

export function AgentLogPanel({ logs, activeAgent, onClearLogs }: AgentLogPanelProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs.length]);

  return (
    <aside
      aria-label="Agent Collaboration Log"
      className="flex flex-col rounded-xl border border-slate-800/90 bg-[#111827] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/90 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-sky-400 shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Agent Collaboration Log
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {logs.length} {logs.length === 1 ? 'event' : 'events'}
          </span>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              title="Clear log"
              aria-label="Clear collaboration log"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Agent Status Strip */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-800/90 bg-[#0E1420] px-4 py-3 sm:grid-cols-4 lg:grid-cols-2">
        {AGENTS_PIPELINE.map((agent) => {
          const isRunning = activeAgent === agent;
          return (
            <div
              key={agent}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                isRunning
                  ? 'border-sky-500/50 bg-sky-500/10 text-slate-100'
                  : 'border-slate-800 bg-[#111827] text-slate-400'
              }`}
            >
              <span className="truncate font-medium">{agent}</span>
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0 ml-1.5" aria-hidden="true" />
              ) : (
                <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-1.5">
                  Ready
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[540px] lg:max-h-none">
        {logs.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-medium text-slate-300">
              Waiting for agent pipeline
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Click &ldquo;Load Sample Student&rdquo; or enter your skills, then run &ldquo;Analyze &amp; Build Path&rdquo; to observe live agent handoffs.
            </p>
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border p-3 text-xs transition-colors ${
                entry.status === 'alert'
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : entry.status === 'error'
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : entry.status === 'handoff'
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : 'border-slate-800/80 bg-[#0B0F17]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {entry.status === 'running' && (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {entry.status === 'completed' && (
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {entry.status === 'handoff' && (
                    <ArrowRight
                      className="h-3.5 w-3.5 text-indigo-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  {(entry.status === 'alert' || entry.status === 'error') && (
                    <AlertTriangle
                      className={`h-3.5 w-3.5 shrink-0 ${
                        entry.status === 'error' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span className={`font-semibold truncate ${getAgentTextColor(entry.agent)}`}>
                    {entry.agent} Agent
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                  {entry.timestamp}
                </span>
              </div>

              <p className="mt-1.5 text-slate-200 leading-relaxed">{entry.message}</p>

              {entry.detail && (
                <p className="mt-1.5 rounded bg-slate-900/90 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 break-words">
                  {entry.detail}
                </p>
              )}
            </div>
          ))
        )}
        <div ref={scrollEndRef} />
      </div>
    </aside>
  );
}
