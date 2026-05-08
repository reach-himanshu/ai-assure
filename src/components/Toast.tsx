import { create } from 'zustand';
import { useEffect } from 'react';

interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
}

interface ToastState {
  items: ToastItem[];
  push: (msg: string, tone?: ToastItem['tone']) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (message, tone = 'success') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ items: [...s.items, { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function useToast() {
  return useToastStore((s) => s.push);
}

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    // noop — reactive to items
  }, [items]);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[360px]">
      {items.map((t) => (
        <div
          key={t.id}
          className="card-tight flex items-start gap-3 shadow-pop animate-in fade-in slide-in-from-bottom-2"
        >
          <div className={
            'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ' +
            (t.tone === 'success' ? 'bg-band-pass/15 text-band-pass' :
             t.tone === 'error' ? 'bg-band-fail/15 text-band-fail' :
             'bg-brand-100 text-brand-700')
          }>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              {t.tone === 'success' ? <path d="M5 12l4 4L19 6" /> : t.tone === 'error' ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M12 9v4M12 17h.01M12 3l9 16H3l9-16z" />}
            </svg>
          </div>
          <div className="flex-1 text-sm leading-snug pr-2">{t.message}</div>
          <button onClick={() => dismiss(t.id)} className="text-ink-muted hover:text-ink dark:hover:text-[#F1F5EE]" aria-label="Dismiss">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
