import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { Evaluation } from '@/lib/types';
import { durationDistribution } from '@/lib/channelMetrics';

interface Props {
  evaluations: Evaluation[];
}

export function CallDurationHistogram({ evaluations }: Props) {
  const data = useMemo(() => durationDistribution(evaluations), [evaluations]);
  const total = data.reduce((s, d) => s + d.count, 0);
  // Highlight the modal (most common) bucket
  const peakIndex = data.reduce((acc, d, i) => (d.count > data[acc]!.count ? i : acc), 0);

  return (
    <div className="card">
      <header className="mb-3">
        <h2 className="text-lg">Call duration distribution</h2>
        <p className="text-xs text-ink-muted">{total.toLocaleString()} calls · last 30 days · most common: {data[peakIndex]?.bucket}</p>
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
              {data.map((_, i) => (
                <Cell key={i} fill={i === peakIndex ? '#2F6B1E' : '#A8D085'} />
              ))}
              <LabelList dataKey="count" position="top" fontSize={11} fontWeight={600} fill="#0E1411" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
