import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { MentorChatMessage } from '../types';

interface MentorChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: MentorChatMessage[];
  isSending: boolean;
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  'Compress roadmap for a 2-week interview',
  'Why did I fail my last quiz?',
  'Suggest a capstone project for my missing skills',
];

export function MentorChatDrawer({
  isOpen,
  onToggle,
  messages,
  isSending,
  onSendMessage,
}: MentorChatDrawerProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput('');
    onSendMessage(trimmed);
  };

  return (
    <>
      {/* Floating Drawer */}
      {isOpen && (
        <section
          aria-label="Ask Kairo Mentor Chat"
          className="studio-panel-amber hud-boot-in fixed bottom-20 right-4 z-40 flex h-[540px] max-h-[75vh] w-[calc(100vw-2rem)] flex-col rounded-2xl sm:right-6 sm:w-[420px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/25 px-4 py-3.5">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
                <h2 className="font-display text-sm font-bold text-slate-50">
                  Kairo Mentor
                </h2>
              </div>
              <p className="text-[11px] text-slate-300">
                Live coaching &amp; dynamic roadmap refinement
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Close Kairo Mentor chat"
              className="rounded-lg p-1.5 text-cyan-200/80 hover:bg-cyan-500/20 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3 One-Click Quick Prompts */}
          <div className="border-b border-cyan-400/20 bg-slate-950/55 px-3.5 py-2.5">
            <div className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-cyan-300/80">
              Quick Prompts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => onSendMessage(prompt)}
                  className="rounded-md border border-cyan-400/35 bg-cyan-500/12 px-2.5 py-1 text-left text-[11px] font-medium text-cyan-100 hover:bg-cyan-500/25 hover:border-[#00E5FF]/70 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <p className="text-xs font-medium text-cyan-100">
                  Ask Kairo Mentor anything about your skill gaps or roadmap.
                </p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Try a quick prompt above to compress your study plan, review quiz struggles, or get a capstone idea.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/20 border border-[#00E5FF]/45 text-cyan-50'
                        : 'bg-slate-950/65 border border-cyan-400/25 text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.roadmapUpdated && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/45 bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-300 shrink-0" aria-hidden="true" />
                        <span>Active roadmap updated live</span>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-slate-400 tabular-nums">
                    {msg.role === 'user' ? 'You' : 'Kairo Mentor'} · {msg.timestamp}
                  </span>
                </div>
              ))
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#00E5FF]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Mentor Agent is thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-cyan-400/20 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to adjust roadmap, explain a quiz, or suggest a project..."
              disabled={isSending}
              className="flex-1 rounded-lg border border-cyan-400/30 bg-slate-950/65 px-3 py-2 text-xs text-slate-50 placeholder-slate-400 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send message to Kairo Mentor"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#00E5FF] to-sky-400 text-slate-950 shadow-[0_0_16px_-4px_rgba(0,229,255,0.6)] hover:from-cyan-300 hover:to-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2.5 rounded-full border border-[#00E5FF]/65 bg-slate-950/75 px-4 py-3 text-xs font-semibold text-cyan-100 shadow-[0_0_26px_-4px_rgba(0,229,255,0.65)] backdrop-blur-xl hover:border-[#00E5FF] hover:text-white transition-all sm:right-6 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <MessageSquare className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
        <span>Ask Kairo Mentor</span>
      </button>
    </>
  );
}
