import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Evaluation } from '@/lib/types';
import { durationLabel } from '@/lib/dates';

interface Props {
  evaluation: Evaluation;
  /** Driven externally when a transcript turn or evidence quote is clicked. */
  jumpToMs: number | null;
}

/**
 * Mocked Genesys recording player. Audio playback is simulated (no real audio
 * file is loaded), but click-to-jump and playhead UI behave exactly as a
 * reviewer would expect — letting stakeholders touch-and-feel the synced flow
 * without us shipping audio assets.
 */
export function CallRecordingPlayer({ evaluation, jumpToMs }: Props) {
  const totalSec = evaluation.genesys?.durationSec ?? 0;
  const [currentSec, setCurrentSec] = useState(0);
  const [playing, setPlaying] = useState(false);

  // External jump (e.g., transcript turn clicked)
  useEffect(() => {
    if (jumpToMs == null) return;
    setCurrentSec(Math.min(totalSec, Math.max(0, Math.floor(jumpToMs / 1000))));
  }, [jumpToMs, totalSec]);

  // Simulated playback tick
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCurrentSec((s) => {
        if (s >= totalSec) {
          setPlaying(false);
          return totalSec;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, totalSec]);

  const progressPct = totalSec === 0 ? 0 : (currentSec / totalSec) * 100;

  return (
    <div className="card">
      <header className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg">Recording</h2>
        <span className="text-xs text-ink-muted">{evaluation.genesys?.recordingId}</span>
      </header>

      {/* Audio bar */}
      <div className="rounded-xl bg-surface-alt dark:bg-surface-dark p-3 flex items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        {/* Mini waveform-style scrubber */}
        <div className="flex-1 min-w-0">
          <div className="relative h-7">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-end gap-[2px] h-7" aria-hidden>
              {Array.from({ length: 64 }).map((_, i) => {
                // Pseudo-waveform — deterministic from index
                const h = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.21));
                const past = (i / 64) * 100 < progressPct;
                return (
                  <span
                    key={i}
                    className={clsx(
                      'w-[3px] rounded-sm',
                      past ? 'bg-brand-600 dark:bg-brand-400' : 'bg-line dark:bg-line-dark',
                    )}
                    style={{ height: `${h * 100}%` }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={totalSec}
              value={currentSec}
              onChange={(e) => setCurrentSec(parseInt(e.target.value, 10))}
              aria-label="Seek"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <span className="shrink-0 font-mono text-xs text-ink-muted tabular-nums">
          {durationLabel(currentSec)} / {durationLabel(totalSec)}
        </span>
      </div>

      {/* Screen recording placeholder */}
      <div className="mt-3 rounded-xl border border-line dark:border-line-dark overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)]" />
          <div className="relative text-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <p className="text-xs text-ink-muted mt-2">
              Agent screen recording · {durationLabel(totalSec)}
            </p>
            <p className="text-[10px] text-ink-muted mt-0.5">Click to expand (demo)</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-muted mt-2">
        Demo only — playback is simulated. Click a transcript turn or evidence quote to jump the playhead.
      </p>
    </div>
  );
}
