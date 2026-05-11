import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Evaluation } from '@/lib/types';
import { responseTimeDistribution } from '@/lib/channelMetrics';

interface Props {
  evaluations: Evaluation[];
  /** Label shown in the header (e.g., 'Email' or 'Chat'). */
  channelLabel?: string;
}

export function ResponseTimeHistogram({ evaluations, channelLabel = 'Text channels' }: Props) {
  const data = useMemo(() => responseTimeDistribution(evaluations), [evaluations]);
  const total = data.reduce((s, d) => s + d.count, 0);
  const within1h = data.filter((d) => d.bucket === '< 15m' || d.bucket === '15–60m').reduce((s, d) => s + d.count, 0);
  const within1hPct = total > 0 ? Math.round((within1h / total) * 100) : 0;
  // Tone the under-1h buckets green, over-4h red, in between amber
  const colorFor = (bucket: string) => {
    if (bucket === '< 15m' || bucket === '15–60m') return '#2F6B1E';
    if (bucket === '1–4h') return '#B26B00';
    return '#A4262C';
  };

  return (
    <div className="card">
      <header className="mb-3">
        <h2 className="text-lg">First-response time</h2>
        <p className="text-xs text-ink-muted">
          {channelLabel} · {total.toLocaleString()} replies · {within1hPct}% within 1 hour
        </p>
      </header>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <XAxis dataKey="bucket" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(47,107,30,0.06)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.bucket} fill={colorFor(d.bucket)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
