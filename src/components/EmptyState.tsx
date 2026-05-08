interface Props {
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16">
      <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-brand-700 dark:text-brand-300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-lg">{title}</h3>
      {body && <p className="mt-2 text-sm text-ink-muted max-w-md">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
