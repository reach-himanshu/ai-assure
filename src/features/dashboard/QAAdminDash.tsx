import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApp } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { fromNow } from '@/lib/dates';
import { compactNumber, pct } from '@/lib/format';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

export function QAAdminDash() {
  const evaluations = useApp((s) => s.evaluations);
  const config = useApp((s) => s.config);
  const audit = useApp((s) => s.audit);
  const channelVolumes = useApp((s) => s.channelVolumes);

  const last30 = evaluations.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day')));
  const totalEvals = evaluations.length;
  const autoApproveRate = (evaluations.filter((e) => e.status === 'auto_approved').length / Math.max(totalEvals, 1)) * 100;
  const lowConfRate = (evaluations.filter((e) => e.flags.includes('low_confidence')).length / Math.max(totalEvals, 1)) * 100;
  const piiHolds = evaluations.filter((e) => e.flags.includes('pii')).length;
  const openAppeals = evaluations.filter((e) => e.appeal && e.appeal.status === 'open').length;

  // Trend: last 14 days, evals per day
  const trend = useMemo(() => {
    const days: { date: string; auto: number; review: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayEvals = evaluations.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      days.push({
        date: day.format('MMM D'),
        auto: dayEvals.filter((e) => e.status === 'auto_approved').length,
        review: dayEvals.filter((e) => e.status === 'pending_review').length,
      });
    }
    return days;
  }, [evaluations]);

  // Band distribution
  const bandDist = useMemo(() => {
    const pass = last30.filter((e) => e.band === 'pass').length;
    const review = last30.filter((e) => e.band === 'needs_review').length;
    const fail = last30.filter((e) => e.band === 'fail').length;
    return [
      { name: 'Pass', value: pass, fill: '#2F6B1E' },
      { name: 'Needs review', value: review, fill: '#B26B00' },
      { name: 'Fail', value: fail, fill: '#A4262C' },
    ];
  }, [last30]);

  // Channel volume bar (claimed)
  const channelBar = [
    { name: 'Call', value: channelVolumes.call ?? 0 },
    { name: 'Email', value: channelVolumes.email ?? 0 },
    { name: 'Chat', value: channelVolumes.chat ?? 0 },
    { name: 'Portal', value: channelVolumes.portal ?? 0 },
    { name: 'CSAT', value: channelVolumes.csat ?? 0 },
  ];

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">Quality administration</h1>
          <p className="text-sm text-ink-muted mt-1">Global view across all evaluations · 60-day window</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/queue" className="btn-secondary">Open queue</Link>
          <Link to="/app/admin" className="btn-primary">Configuration</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile
          label="Auto-approve rate"
          value={pct(autoApproveRate)}
          tone="pass"
          hint={`Threshold ${config.autoApproveThresholdPct}%`}
        />
        <KpiTile label="Low-confidence rate" value={pct(lowConfRate)} tone={lowConfRate > 15 ? 'review' : 'default'} />
        <KpiTile label="PII holds" value={piiHolds.toString()} tone={piiHolds > 0 ? 'fail' : 'default'} />
        <KpiTile label="Open appeals" value={openAppeals.toString()} hint="across all teams" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="card xl:col-span-2">
          <header className="mb-3">
            <h2 className="text-lg">Auto-approve vs. pending review</h2>
            <p className="text-xs text-ink-muted">Daily counts · last 14 days</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="auto" name="Auto-approved" stroke="#2F6B1E" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="review" name="Pending review" stroke="#B26B00" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Score band mix</h2>
            <p className="text-xs text-ink-muted">Last 30 days</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={bandDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {bandDist.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <header className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg">Channel volume (claimed)</h2>
              <p className="text-xs text-ink-muted">Last 60 days · matches dashboards</p>
            </div>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={channelBar} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} tickFormatter={compactNumber} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Bar dataKey="value" fill="#2F6B1E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Recent audit log</h2>
            <p className="text-xs text-ink-muted">Latest config & decision events</p>
          </header>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {[...audit].reverse().slice(0, 12).map((a) => (
              <li key={a.id} className="text-sm flex items-start gap-3">
                <span className="w-2 h-2 mt-2 rounded-full bg-brand-500 shrink-0" />
                <div className="min-w-0">
                  <p className="leading-snug">
                    <span className="font-semibold">{a.actorName}</span>{' '}
                    <span className="text-ink-muted">· {a.action.replace(/[._]/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-ink-muted">{fromNow(a.at)} · {a.targetId}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
