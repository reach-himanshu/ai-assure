import clsx from 'clsx';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white">
        <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true">
          <path d="M10 16.5l4 4 8-9.5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg leading-none">
        <span className="text-ink dark:text-[#F1F5EE]">AI-</span>
        <span className="text-brand-600 dark:text-brand-400">Assure</span>
      </span>
    </span>
  );
}
