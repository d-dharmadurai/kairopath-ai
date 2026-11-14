import { Check, ListTodo, Plus, Sparkles, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { RoadmapModule } from '../types';

export interface StudyTask {
  id: string;
  text: string;
  done: boolean;
}

interface Props {
  tasks: StudyTask[];
  modules: RoadmapModule[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
  onAutoFillFromRoadmap: () => void;
}

export function StudyChecklistCard({ tasks, modules, onAddTask, onToggleTask, onDeleteTask, onClearCompleted, onAutoFillFromRoadmap }: Props) {
  const [draft, setDraft] = useState('');
  const doneCount = tasks.filter((t) => t.done).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAddTask(text);
    setDraft('');
  };

  return (
    <section id="study-checklist" aria-label="Study To-Do Checklist" className="studio-panel rounded-xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 shrink-0 text-[#00E5FF]" />
          <div>
            <h3 className="font-display text-sm font-bold text-slate-50">Study To-Do Checklist</h3>
            <p className="font-mono text-[11px] text-cyan-200/75 tabular-nums">{doneCount}/{tasks.length} done · Saved locally</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onAutoFillFromRoadmap} disabled={!modules.length} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#00E5FF]/45 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-45">
            <Sparkles className="h-3 w-3 text-[#00E5FF]" />Auto-Fill Tasks from Roadmap
          </button>
          {doneCount > 0 && (
            <button type="button" onClick={onClearCompleted} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-cyan-400/25 bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-cyan-200 hover:border-rose-400/50 hover:text-rose-200">
              <Trash2 className="h-3 w-3" />Clear Done
            </button>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="mb-3 flex items-center gap-2">
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a daily study action (e.g., Practice 2 SQL joins)..." aria-label="New daily study task" className="flex-1 rounded-lg border border-cyan-400/25 bg-slate-950/60 px-3 py-2 text-xs text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none" />
        <button type="submit" disabled={!draft.trim()} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-[#00E5FF] to-sky-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_16px_-4px_rgba(0,229,255,0.6)] hover:from-cyan-300 hover:to-sky-300 disabled:opacity-45">
          <Plus className="h-3.5 w-3.5" />Add
        </button>
      </form>

      {!tasks.length ? (
        <p className="rounded-lg border border-cyan-400/20 bg-slate-950/45 px-3.5 py-3 text-xs text-slate-300">
          No tasks yet. Add one above or click <span className="font-medium text-[#00E5FF]">Auto-Fill Tasks from Roadmap</span> after analyzing your role.
        </p>
      ) : (
        <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {tasks.map((t) => (
            <li key={t.id} className={`flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all ${t.done ? 'border-cyan-400/20 bg-slate-950/35' : 'border-cyan-400/30 bg-slate-950/60 hover:border-[#00E5FF]/55'}`}>
              <button type="button" onClick={() => onToggleTask(t.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${t.done ? 'border-[#00E5FF] bg-[#00E5FF] text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.75)]' : 'border-cyan-400/45 bg-slate-950/70 text-transparent'}`}>
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <span className={`truncate transition-all duration-300 ${t.done ? 'line-through decoration-[#00E5FF] decoration-2 text-cyan-300/60 drop-shadow-[0_0_6px_rgba(0,229,255,0.35)]' : 'text-slate-100'}`}>
                  {t.text}
                </span>
              </button>
              <button type="button" onClick={() => onDeleteTask(t.id)} aria-label={`Delete ${t.text}`} className="shrink-0 rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
