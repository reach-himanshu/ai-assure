import clsx from 'clsx';

interface Props {
  label: string;
  value: string;
  delta?: { sign: 'up' | 'down' | 'flat'; text: string };
  hint?: string;
  tone?: 'default' | 'pass' | 'review' | 'fail';
}

export function KpiTile({ label, value, delta, hint, tone = 'default' }: Props) {
  return (
    <div className="card-tight">
      <p className="label">{label}</p>
      <p
        className={clsx(
          'text-3xl font-semibold tabular-nums mt-1',
          tone === 'pass' && 'text-band-pass',
          tone === 'review' && 'text-band-review',
          tone === 'fail' && 'text-band-fail',
        )}
      >
        {value}
      </p>
      <div className="flex items-center justify-between mt-2">
        {delta && (
          <span
            className={clsx(
              'text-xs font-semibold',
              delta.sign === 'up' && 'text-band-pass',
              delta.sign === 'down' && 'text-band-fail',
              delta.sign === 'flat' && 'text-ink-muted',
            )}
          >
            {delta.sign === 'up' ? '↑' : delta.sign === 'down' ? '↓' : '→'} {delta.text}
          </span>
        )}
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
    </div>
  );
}
