import { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import type { Evaluation } from '@/lib/types';
import { perSectionPassRate } from '@/lib/channelMetrics';

interface Props {
  evaluations: Evaluation[];
  /** Optional title override (e.g., 'Section performance · Email'). */
  title?: string;
  /** Optional sub-line. */
  hint?: string;
}

export function PerSectionPassRate({ evaluations, title = 'Section performance', hint }: Props) {
  const data = useMemo(() => perSectionPassRate(evaluations), [evaluations]);
  return (
    <div className="card">
      <header className="mb-3">
        <h2 className="text-lg">{title}</h2>
        <p className="text-xs text-ink-muted">{hint ?? '% of evaluations rated Full or Exceptional per section'}</p>
      </header>
      <div className="h-64">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="section" fontSize={11} stroke="#5B6760" />
            <Radar name="Pass %" dataKey="score" stroke="#2F6B1E" fill="#2F6B1E" fillOpacity={0.25} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF', fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
